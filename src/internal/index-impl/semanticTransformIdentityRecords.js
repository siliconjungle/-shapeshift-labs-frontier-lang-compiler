import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings as uniqueRawStrings } from '../../native-import-utils.js';
import { semanticEditIdentityFields } from './semanticEditIdentityRecords.js';

export function createSemanticTransformIdentityRecord(input = {}, options = {}) {
  const source = input?.transform ?? input;
  const merged = { ...source, ...definedEntries(options) };
  const editIdentity = semanticEditIdentityFields(merged);
  const semanticKey = firstString(merged.semanticKey, editIdentity.semanticKey);
  const transformKey = firstString(merged.transformKey, semanticTransformKey({ ...merged, semanticKey }));
  const sourceLanguage = firstString(merged.sourceLanguage, merged.language);
  const targetLanguage = firstString(merged.targetLanguage, merged.projectedLanguage);
  const sourcePath = firstString(merged.sourcePath, merged.originalSourcePath);
  const targetPath = firstString(merged.targetPath, merged.targetSourcePath, merged.projectedSourcePath);
  const semanticIdentityHash = firstString(merged.semanticIdentityHash, editIdentity.semanticIdentityHash);
  const sourceIdentityHash = firstString(merged.sourceIdentityHash, editIdentity.sourceIdentityHash);
  const transformIdentityHash = firstString(merged.transformIdentityHash, hashSemanticValue(compactRecord({
    transformKey,
    semanticIdentityHash,
    sourceLanguage,
    targetLanguage
  })));
  const projectionIdentityHash = firstString(merged.projectionIdentityHash, hashSemanticValue(compactRecord({
    transformIdentityHash,
    sourceIdentityHash,
    sourcePath,
    targetPath
  })));
  const operationContentHash = firstString(merged.operationContentHash);
  const editContentHash = firstString(merged.editContentHash);
  const transformContentHash = firstString(
    merged.transformContentHash,
    operationContentHash || editContentHash ? hashSemanticValue(compactRecord({ transformIdentityHash, operationContentHash, editContentHash })) : undefined
  );
  const sourceMapIds = uniqueStrings([...strings(merged.sourceMapIds), ...strings(merged.sourceMapId), ...strings(merged.metadata?.sourceMapIds), ...strings(merged.metadata?.sourceMapId)]);
  const sourceMapLinkIds = uniqueStrings([...strings(merged.sourceMapLinkIds), ...strings(merged.sourceMapLinkId), ...strings(merged.metadata?.sourceMapLinkIds), ...strings(merged.metadata?.sourceMapLinkId)]);
  const sourceMapMappingIds = uniqueStrings([...strings(merged.sourceMapMappingIds), ...strings(merged.sourceMapMappingId), ...strings(merged.metadata?.sourceMapMappingIds), ...strings(merged.metadata?.sourceMapMappingId)]);
  const id = merged.id && source.kind === 'frontier.lang.semanticTransformIdentityRecord'
    ? merged.id
    : firstString(merged.id, `semantic_transform_${idFragment(firstString(transformKey, semanticKey, sourcePath, targetPath, 'record'))}`);
  return compactRecord({
    kind: 'frontier.lang.semanticTransformIdentityRecord',
    version: 1,
    schema: 'frontier.lang.semanticTransformIdentityRecord.v1',
    id,
    sourceLanguage,
    targetLanguage,
    sourcePath,
    targetPath,
    baseHash: firstString(merged.baseHash),
    targetHash: firstString(merged.targetHash, merged.projectedHash),
    semanticKey,
    transformKey,
    semanticIdentityHash,
    sourceIdentityHash,
    operationContentHash,
    editContentHash,
    transformIdentityHash,
    projectionIdentityHash,
    transformContentHash,
    sourceMapIds,
    sourceMapLinkIds,
    sourceMapMappingIds,
    readiness: firstString(merged.readiness),
    confidence: typeof merged.confidence === 'number' ? merged.confidence : undefined,
    evidenceIds: uniqueStrings(merged.evidenceIds),
    metadata: compactRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      sourceTransformId: source.kind === 'frontier.lang.semanticTransformIdentityRecord' ? source.id : undefined,
      ...merged.metadata
    })
  });
}

export function semanticTransformIdentityFields(record = {}) {
  return createSemanticTransformIdentityRecord(record);
}

export function normalizeSemanticTransformIdentityRecords(records, context = {}) {
  return uniqueRecords(array(records).filter(Boolean).map((record) => createSemanticTransformIdentityRecord(record, context)));
}

export function semanticTransformInputs(source = {}, options = {}) {
  const projections = [
    ...array(options.semanticEditProjections ?? options.semanticEditProjection),
    ...array(source.semanticEditProjections ?? source.semanticEditProjection)
  ];
  const scripts = [
    ...array(options.semanticEditScripts ?? options.semanticEditScript),
    ...array(source.semanticEditScripts ?? source.semanticEditScript)
  ];
  return [
    ...array(options.semanticTransformIdentities ?? options.semanticTransformIdentity),
    ...array(source.semanticTransformIdentities ?? source.semanticTransformIdentity ?? source.semanticTransforms),
    ...array(source.index?.semanticTransformIdentities),
    ...deriveSemanticTransformIdentityRecords({ semanticEditProjections: projections, semanticEditScripts: scripts }, { ...source, ...options })
  ];
}

export function deriveSemanticTransformIdentityRecords(input = {}, options = {}) {
  const projections = semanticEditProjectionInputs(input);
  const projectionRecords = projections.flatMap((projection, projectionIndex) => {
    const edits = array(projection.edits).filter((edit) => edit && typeof edit === 'object');
    return edits.map((edit, editIndex) => transformRecordForProjectionEdit(edit, projection, input, options, projectionIndex, editIndex));
  });
  const scriptRecords = projections.length ? [] : semanticEditScriptInputs(input).flatMap((script, scriptIndex) => {
    const operations = array(script.operations).filter((operation) => operation && typeof operation === 'object');
    return operations.map((operation, operationIndex) => transformRecordForScriptOperation(operation, script, input, options, scriptIndex, operationIndex));
  });
  return uniqueRecords([...projectionRecords, ...scriptRecords]);
}

export function semanticTransformRecordIndex(records, source = {}) {
  const index = source.index ?? {};
  return {
    semanticTransformIds: uniqueStrings([...strings(source.semanticTransformIds), ...strings(index.semanticTransformIds), ...records.map((record) => record.id)]),
    semanticTransformKeys: uniqueStrings([...strings(source.semanticTransformKeys), ...strings(index.semanticTransformKeys), ...records.map((record) => record.transformKey)]),
    semanticTransformIdentityHashes: uniqueStrings([...strings(source.semanticTransformIdentityHashes), ...strings(index.semanticTransformIdentityHashes), ...records.map((record) => record.transformIdentityHash)]),
    semanticTransformContentHashes: uniqueStrings([...strings(source.semanticTransformContentHashes), ...strings(index.semanticTransformContentHashes), ...records.map((record) => record.transformContentHash)]),
    projectionIdentityHashes: uniqueStrings([...strings(source.projectionIdentityHashes), ...strings(index.projectionIdentityHashes), ...records.map((record) => record.projectionIdentityHash)]),
    semanticTransformReadinesses: uniqueStrings([...strings(source.semanticTransformReadinesses), ...strings(index.semanticTransformReadinesses), ...records.map((record) => record.readiness)]),
    semanticTransformEvidenceIds: uniqueStrings([...strings(source.semanticTransformEvidenceIds), ...strings(index.semanticTransformEvidenceIds), ...records.flatMap((record) => record.evidenceIds)]),
    transformSourceLanguages: uniqueStrings([...strings(source.transformSourceLanguages), ...strings(index.transformSourceLanguages), ...records.map((record) => record.sourceLanguage)]),
    transformTargetLanguages: uniqueStrings([...strings(source.transformTargetLanguages), ...strings(index.transformTargetLanguages), ...records.map((record) => record.targetLanguage)]),
    transformSourcePaths: uniqueStrings([...strings(source.transformSourcePaths), ...strings(index.transformSourcePaths), ...records.map((record) => record.sourcePath)]),
    transformTargetPaths: uniqueStrings([...strings(source.transformTargetPaths), ...strings(index.transformTargetPaths), ...records.map((record) => record.targetPath)]),
    transformCrossLanguages: uniqueStrings([...strings(source.transformCrossLanguages), ...strings(index.transformCrossLanguages), ...records.map(transformCrossLanguageFlag)]),
    transformSourceMapIds: uniqueStrings([...strings(source.transformSourceMapIds), ...strings(index.transformSourceMapIds), ...records.flatMap((record) => record.sourceMapIds)]),
    transformSourceMapLinkIds: uniqueStrings([...strings(source.transformSourceMapLinkIds), ...strings(index.transformSourceMapLinkIds), ...records.flatMap((record) => record.sourceMapLinkIds)]),
    transformSourceMapMappingIds: uniqueStrings([...strings(source.transformSourceMapMappingIds), ...strings(index.transformSourceMapMappingIds), ...records.flatMap((record) => record.sourceMapMappingIds)])
  };
}

export function semanticTransformSummary(index) {
  if (!index.semanticTransformIds.length && !index.semanticTransformKeys.length) return undefined;
  return compactRecord({
    ids: index.semanticTransformIds,
    keys: index.semanticTransformKeys,
    identityHashes: index.semanticTransformIdentityHashes,
    contentHashes: index.semanticTransformContentHashes,
    projectionIdentityHashes: index.projectionIdentityHashes,
    readinesses: index.semanticTransformReadinesses,
    evidenceIds: index.semanticTransformEvidenceIds,
    sourceLanguages: index.transformSourceLanguages,
    targetLanguages: index.transformTargetLanguages,
    targetPaths: index.transformTargetPaths,
    crossLanguages: index.transformCrossLanguages,
    sourceMapIds: index.transformSourceMapIds,
    sourceMapLinkIds: index.transformSourceMapLinkIds,
    sourceMapMappingIds: index.transformSourceMapMappingIds
  });
}

function transformCrossLanguageFlag(record) {
  return record.sourceLanguage && record.targetLanguage && record.sourceLanguage !== record.targetLanguage ? 'true' : 'false';
}

function semanticTransformKey(record) {
  const scope = record.semanticKey ?? (record.symbolName
    ? `${record.symbolKind ?? 'symbol'}:${record.symbolName}`
    : record.anchorKey ?? record.regionId ?? record.operationId ?? record.id);
  const route = [record.sourceLanguage ?? record.language, record.targetLanguage ?? record.projectedLanguage].filter(Boolean).join('->');
  return ['semantic-transform', route, scope].filter(Boolean).join(':');
}

function semanticEditProjectionInputs(input) {
  if (input.kind === 'frontier.lang.semanticEditProjection') return [input];
  return [
    ...array(input.semanticEditProjections ?? input.semanticEditProjection),
    ...array(input.projections ?? input.projection)
  ].filter((entry) => entry && typeof entry === 'object');
}

function semanticEditScriptInputs(input) {
  if (input.kind === 'frontier.lang.semanticEditScript') return [input];
  return [
    ...array(input.semanticEditScripts ?? input.semanticEditScript),
    ...array(input.scripts ?? input.script)
  ].filter((entry) => entry && typeof entry === 'object');
}

function transformRecordForProjectionEdit(edit, projection, input, options, projectionIndex, editIndex) {
  const sourceLanguage = firstString(edit.sourceLanguage, edit.language, input.sourceLanguage, options.sourceLanguage, projection.sourceLanguage, projection.language);
  const targetLanguage = firstString(edit.targetLanguage, edit.projectedLanguage, input.targetLanguage, options.targetLanguage, projection.targetLanguage, projection.projectedLanguage, projection.language);
  const sourcePath = firstString(edit.originalSourcePath, edit.sourcePath, input.sourcePath, options.sourcePath, projection.sourcePath);
  const targetPath = firstString(edit.targetPath, edit.targetSourcePath, input.targetPath, options.targetPath, projection.targetPath, projection.projectedSourcePath, projection.sourcePath);
  const transformId = [projection.id, edit.operationId, projectionIndex, editIndex].filter((entry) => entry !== undefined && entry !== null).join(':');
  return createSemanticTransformIdentityRecord(edit, {
    id: `semantic_transform_${idFragment(transformId)}`,
    sourceLanguage,
    targetLanguage,
    sourcePath,
    targetPath,
    baseHash: firstString(edit.baseHash, projection.baseHash, input.baseHash, options.baseHash),
    targetHash: firstString(edit.targetHash, projection.projectedHash, projection.targetHash, input.targetHash, options.targetHash),
    readiness: firstString(edit.readiness, projection.admission?.status, projection.status),
    evidenceIds: uniqueStrings([...strings(input.evidenceIds), ...strings(options.evidenceIds), ...strings(projection.evidenceIds), ...strings(edit.evidenceIds)]),
    metadata: compactRecord({
      sourceProjectionId: projection.id,
      sourceProjectionEditOperationId: edit.operationId
    })
  });
}

function transformRecordForScriptOperation(operation, script, input, options, scriptIndex, operationIndex) {
  const targetRegion = operation.metadata?.targetRegion ?? {};
  const transformId = [script.id, operation.id, scriptIndex, operationIndex].filter((entry) => entry !== undefined && entry !== null).join(':');
  return createSemanticTransformIdentityRecord(operation, {
    id: `semantic_transform_${idFragment(transformId)}`,
    sourceLanguage: firstString(operation.anchor?.language, script.language, input.sourceLanguage, options.sourceLanguage),
    targetLanguage: firstString(targetRegion.language, script.metadata?.targetLanguage, input.targetLanguage, options.targetLanguage),
    sourcePath: firstString(operation.anchor?.sourcePath, script.sourcePath, input.sourcePath, options.sourcePath),
    targetPath: firstString(targetRegion.sourcePath, script.metadata?.targetPath, input.targetPath, options.targetPath),
    baseHash: firstString(operation.hashes?.baseSourceHash, script.baseHash, input.baseHash, options.baseHash),
    targetHash: firstString(targetRegion.sourceHash, operation.hashes?.workerSourceHash, input.targetHash, options.targetHash),
    sourceMapIds: script.metadata?.sourceProjectionHint?.sourceMapIds,
    sourceMapLinkIds: operation.metadata?.sourceMapLinkIds,
    sourceMapMappingIds: operation.metadata?.sourceMapMappingIds,
    readiness: firstString(script.admission?.status, script.metadata?.sourceProjectionHint?.status),
    evidenceIds: uniqueStrings([
      ...strings(input.evidenceIds),
      ...strings(options.evidenceIds),
      ...array(script.evidence).map((record) => record?.id),
      ...strings(operation.evidenceIds)
    ]),
    metadata: compactRecord({
      sourceEditScriptId: script.id,
      sourceEditOperationId: operation.id,
      sourceProjectionHintId: script.metadata?.sourceProjectionHint?.id,
      sourceMapIds: script.metadata?.sourceProjectionHint?.sourceMapIds,
      sourceMapLinkIds: operation.metadata?.sourceMapLinkIds,
      sourceMapMappingIds: operation.metadata?.sourceMapMappingIds,
      reviewOnly: script.admission?.reviewRequired === true
    })
  });
}

function uniqueRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = firstString(record.id, record.transformContentHash, record.projectionIdentityHash, record.transformIdentityHash);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function firstString(...values) { return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean); }
function uniqueStrings(values) { return uniqueRawStrings((values ?? []).filter((entry) => entry !== undefined && entry !== null && String(entry) !== '')); }
function definedEntries(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined)); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
