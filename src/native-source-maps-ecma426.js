import { idFragment, reserveUniqueId, uniqueStrings } from './native-import-utils.js';

const ECMA426_SOURCE_MAP_LIMITS = Object.freeze({ maxPayloadBytes: 1024 * 1024, maxMappingsBytes: 512 * 1024, maxDecodedMappings: 10000, maxSources: 10000, maxNames: 10000, maxSections: 256, maxErrors: 32 });
const BASE64_VLQ_VALUES = new Map('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').map((character, index) => [character, index]));

function parseEcma426SourceMapInput(sourceMapInput, sourceMap, context = {}) {
  const candidate = ecma426PayloadCandidate(sourceMapInput, sourceMap);
  if (!candidate.present) return missingEcma426Ingestion();
  return parseEcma426SourceMapPayload(candidate.payload, { ...context, payloadField: candidate.field });
}

function ecma426PayloadCandidate(sourceMapInput, sourceMap) {
  if (typeof sourceMapInput === 'string' || isUint8Array(sourceMapInput)) return { present: true, field: 'self', payload: sourceMapInput };
  for (const field of ['sourceMapPayload', 'ecma426SourceMap', 'ecma426', 'rawSourceMap', 'payload']) {
    if (sourceMap?.[field] !== undefined && sourceMap?.[field] !== null) return { present: true, field, payload: sourceMap[field] };
  }
  if (sourceMap?.version === 3 || typeof sourceMap?.mappings === 'string' || Array.isArray(sourceMap?.sections)) {
    return { present: true, field: 'self', payload: sourceMap };
  }
  return { present: false };
}

function parseEcma426SourceMapPayload(payload, options = {}) {
  const limits = { ...ECMA426_SOURCE_MAP_LIMITS, ...(options.limits ?? {}) };
  const parsed = parseSourceMapJsonPayload(payload, limits, options.payloadField ?? 'self');
  if (!parsed.ok) return parsed.result;
  const state = ecma426DecodeState(limits, options.payloadField ?? 'self');
  decodeEcma426Map(parsed.value, state, { line: 0, column: 0 }, 0);
  return finishEcma426Ingestion(state, parsed.value);
}

function parseSourceMapJsonPayload(payload, limits, payloadField) {
  if (typeof payload === 'string') {
    if (payload.length > limits.maxPayloadBytes) {
      return { ok: false, result: blockedEcma426Ingestion(payloadField, ['ecma-426:payload-too-large'], { payloadBytes: payload.length }) };
    }
    try { return { ok: true, value: JSON.parse(stripJsonProtectionPrefix(payload)) }; }
    catch (error) {
      return { ok: false, result: blockedEcma426Ingestion(payloadField, ['ecma-426:payload-json-invalid'], { error: error instanceof Error ? error.message : String(error) }) };
    }
  }
  if (isUint8Array(payload)) {
    if (payload.byteLength > limits.maxPayloadBytes) {
      return { ok: false, result: blockedEcma426Ingestion(payloadField, ['ecma-426:payload-too-large'], { payloadBytes: payload.byteLength }) };
    }
    if (typeof TextDecoder !== 'function') return { ok: false, result: blockedEcma426Ingestion(payloadField, ['ecma-426:payload-bytes-unsupported']) };
    return parseSourceMapJsonPayload(new TextDecoder().decode(payload), limits, payloadField);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { ok: false, result: blockedEcma426Ingestion(payloadField, ['ecma-426:payload-not-object']) };
  return { ok: true, value: payload };
}

function stripJsonProtectionPrefix(text) {
  return String(text).startsWith(")]}'") ? String(text).replace(/^\)\]\}'[^\r\n]*(?:\r\n|\n|\r)?/, '') : text;
}

function ecma426DecodeState(limits, payloadField) {
  return { schema: 'frontier.lang.ecma426SourceMapIngestion.v1', version: 1, present: true, payloadField, limits, reasonCodes: ['ecma-426:source-map-payload'], errors: [], warnings: [], decodedMappings: [], decodedSources: [], summary: emptyEcma426Summary() };
}

function decodeEcma426Map(map, state, offset, depth) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    addEcma426Error(state, 'ecma-426:payload-not-object', 'Source map payload must be an object.');
    return;
  }
  if (map.version !== 3) addEcma426Error(state, 'ecma-426:version-missing-or-unsupported', 'Source map version must be integer 3.');
  state.file ??= stringOrUndefined(map.file);
  if (Array.isArray(map.sections)) decodeEcma426IndexMap(map, state, offset, depth);
  else decodeEcma426RegularMap(map, state, offset);
}

function decodeEcma426IndexMap(map, state, offset, depth) {
  if (depth > 4) {
    addEcma426Error(state, 'ecma-426:index-sections-too-deep', 'Index source map sections are nested too deeply.');
    return;
  }
  const sections = map.sections;
  if (!Array.isArray(sections)) {
    addEcma426Error(state, 'ecma-426:index-sections-invalid', 'Index source map sections must be an array.');
    return;
  }
  if (sections.length > state.limits.maxSections) {
    addEcma426Error(state, 'ecma-426:index-sections-too-many', `Index source map sections exceed limit ${state.limits.maxSections}.`);
    return;
  }
  state.summary.sections += sections.length;
  let previousOffset;
  sections.forEach((section, index) => {
    const sectionOffset = sectionOffsetFor(section, state, index);
    if (!sectionOffset) return;
    if (previousOffset && compareGeneratedPosition(sectionOffset, previousOffset) <= 0) {
      addEcma426Error(state, 'ecma-426:index-sections-unsorted', `Index source map section ${index + 1} is not sorted by offset.`);
    }
    previousOffset = sectionOffset;
    if (!section.map || typeof section.map !== 'object' || Array.isArray(section.map)) {
      addEcma426Error(state, 'ecma-426:index-section-map-missing', `Index source map section ${index + 1} must contain an embedded map.`);
      return;
    }
    decodeEcma426Map(section.map, state, {
      line: offset.line + sectionOffset.line,
      column: sectionOffset.line === 0 ? offset.column + sectionOffset.column : sectionOffset.column
    }, depth + 1);
  });
}

function sectionOffsetFor(section, state, index) {
  const line = section?.offset?.line;
  const column = section?.offset?.column;
  if (isNonNegativeInteger(line) && isNonNegativeInteger(column)) return { line, column };
  addEcma426Error(state, 'ecma-426:index-section-offset-invalid', `Index source map section ${index + 1} has invalid offset.`);
  return undefined;
}

function decodeEcma426RegularMap(map, state, offset) {
  const sources = optionalOptionalStringList(map.sources, state, 'sources', true);
  const names = optionalStringList(map.names, state, 'names');
  optionalOptionalStringList(map.sourcesContent, state, 'sourcesContent', false);
  optionalIndexList(map.ignoreList, state, 'ignoreList', sources.length);
  optionalString(map.sourceRoot, state, 'sourceRoot');
  optionalString(map.file, state, 'file');
  if (state.errors.length) return;
  const mappings = map.mappings;
  if (typeof mappings !== 'string') {
    addEcma426Error(state, 'ecma-426:mappings-missing', 'Source map mappings must be a string.');
    return;
  }
  if (mappings.length > state.limits.maxMappingsBytes) {
    addEcma426Error(state, 'ecma-426:mappings-too-large', `Source map mappings exceed limit ${state.limits.maxMappingsBytes}.`);
    return;
  }
  state.summary.sources += sources.length;
  state.summary.names += names.length;
  state.summary.mappingsBytes += mappings.length;
  state.decodedSources.push(...sources.map((source, index) => ({ index, source: combineSourceRoot(map.sourceRoot, source) })));
  decodeMappingsString(mappings, { state, sources, names, sourceRoot: map.sourceRoot, offset });
}

function decodeMappingsString(mappings, context) {
  let previousSource = 0, previousOriginalLine = 0, previousOriginalColumn = 0, previousName = 0;
  for (const [generatedLine, line] of mappings.split(';').entries()) {
    if (!line) continue;
    let previousGeneratedColumn = 0;
    for (const [segmentIndex, segment] of line.split(',').entries()) {
      if (!segment) {
        addEcma426Error(context.state, 'ecma-426:mapping-segment-empty', `Mapping segment ${segmentIndex + 1} on generated line ${generatedLine + 1} is empty.`);
        continue;
      }
      const fields = decodeMappingSegmentFields(segment, context.state);
      if (!fields) continue;
      if (fields.length !== 1 && fields.length !== 4 && fields.length !== 5) {
        addEcma426Error(context.state, 'ecma-426:mapping-segment-field-count-invalid', `Mapping segment ${segmentIndex + 1} on generated line ${generatedLine + 1} has ${fields.length} field(s).`);
        continue;
      }
      const generatedColumn = previousGeneratedColumn + fields[0];
      if (generatedColumn < previousGeneratedColumn || generatedColumn < 0) {
        addEcma426Error(context.state, 'ecma-426:generated-column-order-invalid', `Mapping segment ${segmentIndex + 1} on generated line ${generatedLine + 1} has an invalid generated column.`);
        continue;
      }
      previousGeneratedColumn = generatedColumn;
      const decoded = { generatedLine: context.offset.line + generatedLine, generatedColumn: generatedLine === 0 ? context.offset.column + generatedColumn : generatedColumn };
      if (fields.length > 1) {
        const sourceIndex = previousSource + fields[1], originalLine = previousOriginalLine + fields[2], originalColumn = previousOriginalColumn + fields[3];
        if (!isValidIndex(sourceIndex, context.sources)) {
          addEcma426Error(context.state, sourceIndex < 0 ? 'ecma-426:source-index-negative' : 'ecma-426:source-index-out-of-range', `Mapping segment ${segmentIndex + 1} references source index ${sourceIndex}.`);
          continue;
        }
        if (originalLine < 0 || originalColumn < 0) {
          addEcma426Error(context.state, originalLine < 0 ? 'ecma-426:original-line-negative' : 'ecma-426:original-column-negative', `Mapping segment ${segmentIndex + 1} has negative original position.`);
          continue;
        }
        previousSource = sourceIndex;
        previousOriginalLine = originalLine;
        previousOriginalColumn = originalColumn;
        Object.assign(decoded, { sourceIndex, originalSource: combineSourceRoot(context.sourceRoot, context.sources[sourceIndex]), originalLine, originalColumn });
        context.state.summary.mappedSegments += 1;
      } else {
        context.state.summary.unmappedSegments += 1;
      }
      if (fields.length === 5) {
        const nameIndex = previousName + fields[4];
        if (!isValidIndex(nameIndex, context.names)) {
          addEcma426Error(context.state, nameIndex < 0 ? 'ecma-426:name-index-negative' : 'ecma-426:name-index-out-of-range', `Mapping segment ${segmentIndex + 1} references name index ${nameIndex}.`);
          continue;
        }
        previousName = nameIndex;
        Object.assign(decoded, { nameIndex, name: context.names[nameIndex] });
      }
      if (context.state.decodedMappings.length >= context.state.limits.maxDecodedMappings) {
        addEcma426Error(context.state, 'ecma-426:mappings-too-many', `Source map decoded mappings exceed limit ${context.state.limits.maxDecodedMappings}.`);
        return;
      }
      context.state.decodedMappings.push(decoded);
    }
  }
}

function decodeMappingSegmentFields(segment, state) {
  const fields = [];
  let index = 0;
  while (index < segment.length) {
    const decoded = decodeBase64Vlq(segment, index, state);
    if (!decoded) return undefined;
    fields.push(decoded.value);
    index = decoded.nextIndex;
  }
  return fields;
}

function decodeBase64Vlq(segment, index, state) {
  let result = 0, shift = 0, cursor = index;
  while (cursor < segment.length) {
    const character = segment[cursor], digit = BASE64_VLQ_VALUES.get(character);
    if (digit === undefined) {
      addEcma426Error(state, 'ecma-426:vlq-invalid-character', `Invalid base64 VLQ character ${JSON.stringify(character)}.`);
      return undefined;
    }
    cursor += 1;
    result += (digit & 31) * (2 ** shift);
    if (result > 0xffffffff) {
      addEcma426Error(state, 'ecma-426:vlq-overflow', 'Base64 VLQ value exceeds 32-bit source-map limit.');
      return undefined;
    }
    shift += 5;
    if ((digit & 32) === 0) {
      const negative = (result & 1) === 1, magnitude = Math.floor(result / 2);
      return { value: negative ? -magnitude : magnitude, nextIndex: cursor };
    }
  }
  addEcma426Error(state, 'ecma-426:vlq-unterminated', 'Base64 VLQ continuation was not terminated.');
  return undefined;
}

function finishEcma426Ingestion(state, map) {
  const status = state.errors.length ? 'blocked' : 'valid';
  if (status === 'valid') state.reasonCodes.push('ecma-426:payload-valid');
  state.summary.decodedMappings = state.decodedMappings.length;
  return { ...state, status, valid: status === 'valid', file: stringOrUndefined(map?.file) ?? state.file, reasonCodes: uniqueStrings([...state.reasonCodes, ...(status === 'blocked' ? ['ecma-426:payload-invalid'] : [])]) };
}

function blockedEcma426Ingestion(payloadField, reasonCodes, metadata = {}) {
  return { schema: 'frontier.lang.ecma426SourceMapIngestion.v1', version: 1, present: true, payloadField, status: 'blocked', valid: false, reasonCodes: uniqueStrings(['ecma-426:source-map-payload', 'ecma-426:payload-invalid', ...reasonCodes]), errors: reasonCodes.map((code) => ({ code, message: metadata.error ?? code })), warnings: [], decodedMappings: [], decodedSources: [], summary: { ...emptyEcma426Summary(), ...metadata } };
}

function missingEcma426Ingestion() { return { schema: 'frontier.lang.ecma426SourceMapIngestion.v1', version: 1, present: false, status: 'missing', valid: false, reasonCodes: ['ecma-426:payload-missing'], errors: [], warnings: [], decodedMappings: [], decodedSources: [], summary: emptyEcma426Summary() }; }
function emptyEcma426Summary() { return { sections: 0, sources: 0, names: 0, mappingsBytes: 0, decodedMappings: 0, mappedSegments: 0, unmappedSegments: 0 }; }
function addEcma426Error(state, code, message) { state.reasonCodes.push(code); if (state.errors.length < state.limits.maxErrors) state.errors.push({ code, message }); }

function ecma426Metadata(ingestion) {
  return { schema: ingestion.schema, version: ingestion.version, present: ingestion.present, payloadField: ingestion.payloadField, status: ingestion.status, valid: ingestion.valid, file: ingestion.file, reasonCodes: ingestion.reasonCodes, errors: ingestion.errors, warnings: ingestion.warnings, summary: ingestion.summary };
}

function sourceMapMappingsFromEcma426(ingestion, sourceMap, context) {
  if (!ingestion.present || ingestion.status !== 'valid') return [];
  const usedIds = new Set();
  return ingestion.decodedMappings.map((mapping, index) => ecma426MappingRecord(ingestion, sourceMap, context, mapping, index, usedIds));
}

function ecma426MappingRecord(ingestion, sourceMap, context, mapping, index, usedIds) {
  const sourcePath = mapping.originalSource ?? sourceMap.sourcePath ?? context.sourcePath;
  const generatedTargetPath = sourceMap.targetPath ?? context.targetPath ?? ingestion.file;
  return {
    id: reserveUniqueId(`map_${idFragment(context.id ?? sourceMap.id ?? 'ecma426')}_${index + 1}`, usedIds),
    nativeSourceId: sourceMap.nativeSourceId ?? context.nativeSource?.id,
    sourceSpan: mapping.sourceIndex === undefined ? undefined : { path: sourcePath, sourceId: sourceMap.sourceHash ?? context.sourceHash, startLine: mapping.originalLine + 1, startColumn: mapping.originalColumn + 1 },
    generatedSpan: { target: sourceMap.target ?? context.target, targetPath: generatedTargetPath, targetHash: sourceMap.targetHash ?? context.targetHash, startLine: mapping.generatedLine + 1, startColumn: mapping.generatedColumn + 1, generatedName: mapping.name },
    target: sourceMap.target ?? context.target,
    generatedName: mapping.name,
    evidenceIds: uniqueStrings([...(sourceMap.evidence ?? []).map((record) => record.id), ...(context.evidence ?? []).map((record) => record.id)]),
    lossIds: [],
    precision: 'line',
    preservation: 'estimated',
    metadata: { ...(sourceMap.metadata ?? {}), sourceMapOrigin: 'ecma-426-payload', ecma426MappingIndex: index, generatedLine: mapping.generatedLine, generatedColumn: mapping.generatedColumn, sourceIndex: mapping.sourceIndex, nameIndex: mapping.nameIndex }
  };
}

function optionalString(value, state, field) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') addEcma426Error(state, `ecma-426:${field}-invalid`, `Source map ${field} must be a string when present.`);
  return typeof value === 'string' ? value : undefined;
}

function optionalStringList(value, state, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return arrayFieldError(state, field);
  if (value.length > state.limits[field === 'names' ? 'maxNames' : 'maxSources']) return boundedListError(state, field);
  return value.map((item, index) => typeof item === 'string' ? item : invalidListEntry(state, field, index, 'string', ''));
}

function optionalOptionalStringList(value, state, field, required) {
  if (value === undefined || value === null) {
    if (required) addEcma426Error(state, `ecma-426:${field}-missing`, `Source map ${field} must be present.`);
    return [];
  }
  if (!Array.isArray(value)) return arrayFieldError(state, field);
  if (field === 'sources' && value.length > state.limits.maxSources) return boundedListError(state, 'sources');
  return value.map((item, index) => item === null || typeof item === 'string' ? item : invalidListEntry(state, field, index, 'string or null', null));
}

function optionalIndexList(value, state, field, sourceCount) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return arrayFieldError(state, field);
  return value.map((item, index) => isNonNegativeInteger(item) && item < sourceCount ? item : invalidListEntry(state, field, index, 'source array index', null));
}

function arrayFieldError(state, field) { addEcma426Error(state, `ecma-426:${field}-invalid`, `Source map ${field} must be an array.`); return []; }
function boundedListError(state, field) { addEcma426Error(state, `ecma-426:${field}-too-many`, `Source map ${field} exceeds bounded ingestion limits.`); return []; }
function invalidListEntry(state, field, index, expected, fallback) { addEcma426Error(state, `ecma-426:${field}-entry-invalid`, `Source map ${field}[${index}] must be a ${expected}.`); return fallback; }
function combineSourceRoot(sourceRoot, source) { if (source === null || source === undefined) return undefined; const root = typeof sourceRoot === 'string' ? sourceRoot : ''; return !root ? source : root.endsWith('/') || String(source).startsWith('/') ? `${root}${source}` : `${root}/${source}`; }
function isValidIndex(index, values) { return Number.isInteger(index) && index >= 0 && index < values.length; }
function isNonNegativeInteger(value) { return Number.isInteger(value) && value >= 0; }
function compareGeneratedPosition(left, right) { return left.line !== right.line ? left.line - right.line : left.column - right.column; }
function stringOrUndefined(value) { return typeof value === 'string' && value ? value : undefined; }
function isSourceMapInput(value) { return Boolean(value && (typeof value === 'object' || typeof value === 'string')); }
function isUint8Array(value) { return typeof Uint8Array !== 'undefined' && value instanceof Uint8Array; }

export { ecma426Metadata, isSourceMapInput, isUint8Array, parseEcma426SourceMapInput, parseEcma426SourceMapPayload, sourceMapMappingsFromEcma426 };
