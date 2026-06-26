import { createSourceMapRecord, validateSourceMapRecord } from '@shapeshift-labs/frontier-lang-kernel';
import {
  commonGeneratedTargetPath,
  idFragment,
  normalizeSourcePreservationLevel,
  reserveUniqueId,
  uniqueRecordsById,
  uniqueStrings
} from './native-import-utils.js';
import {
  ecma426Metadata,
  isSourceMapInput,
  isUint8Array,
  parseEcma426SourceMapInput,
  parseEcma426SourceMapPayload,
  sourceMapMappingsFromEcma426
} from './native-source-maps-ecma426.js';

function inferSourceMapMappings(input) {
  const semanticIndex = input.semanticIndex;
  const nativeAst = input.nativeAst;
  const nativeSource = input.nativeSource;
  const evidenceIds = [
    ...(semanticIndex?.evidence ?? []).map((record) => record.id),
    ...(input.evidence ?? []).map((record) => record.id)
  ];
  const symbolsById = new Map((semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));

  if (semanticIndex?.occurrences?.length) {
    return semanticIndex.occurrences
      .filter((occurrence) => occurrence.nativeAstNodeId || occurrence.span)
      .map((occurrence) => {
        const symbol = symbolsById.get(occurrence.symbolId);
        const nativeNode = occurrence.nativeAstNodeId ? nativeAst?.nodes?.[occurrence.nativeAstNodeId] : undefined;
        return {
          id: `map_${idFragment(occurrence.id)}`,
          nativeSourceId: nativeSource?.id,
          nativeAstNodeId: occurrence.nativeAstNodeId,
          semanticSymbolId: occurrence.symbolId,
          semanticOccurrenceId: occurrence.id,
          semanticNodeId: occurrence.semanticNodeId ?? symbol?.semanticNodeId,
          sourceSpan: occurrence.span ?? nativeNode?.span,
          evidenceIds,
          lossIds: lossIdsForNativeNode(input.losses ?? nativeAst?.losses ?? [], occurrence.nativeAstNodeId),
          ownershipRegionId: symbol?.metadata?.ownershipRegionId,
          ownershipRegionKey: symbol?.metadata?.ownershipRegionKey,
          ownershipRegionKind: symbol?.metadata?.ownershipRegionKind,
          precision: occurrence.span || nativeNode?.span ? 'declaration' : 'unknown'
        };
      });
  }

  return Object.values(nativeAst?.nodes ?? {})
    .filter((node) => node.span)
    .map((node) => ({
      id: `map_${idFragment(node.id)}`,
      nativeSourceId: nativeSource?.id,
      nativeAstNodeId: node.id,
      sourceSpan: node.span,
      evidenceIds,
      lossIds: lossIdsForNativeNode(input.losses ?? nativeAst?.losses ?? [], node.id),
      precision: 'line'
    }));
}

function normalizeSourceMapMappings(mappings, context) {
  if (mappings === undefined || mappings === null) return [];
  if (!Array.isArray(mappings)) {
    throw new Error('Source-map mappings must be an array');
  }
  const semanticIndex = context.semanticIndex;
  const nativeAst = context.nativeAst;
  const nativeSource = context.nativeSource;
  const symbolsById = new Map((semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const occurrencesById = new Map((semanticIndex?.occurrences ?? []).map((occurrence) => [occurrence.id, occurrence]));
  const evidenceIds = uniqueStrings([
    ...(semanticIndex?.evidence ?? []).map((record) => record.id),
    ...(context.evidence ?? []).map((record) => record.id),
    ...(context.sourceMapEvidence ?? []).map((record) => record.id)
  ]);
  const usedMappingIds = new Set();
  return mappings
    .map((mapping, index) => {
      if (!mapping || typeof mapping !== 'object') {
        throw new Error(`Source-map mapping ${index + 1} must be an object`);
      }
      const occurrence = mapping.semanticOccurrenceId ? occurrencesById.get(mapping.semanticOccurrenceId) : undefined;
      const symbol = mapping.semanticSymbolId ? symbolsById.get(mapping.semanticSymbolId) : occurrence ? symbolsById.get(occurrence.symbolId) : undefined;
      const nativeAstNodeId = mapping.nativeAstNodeId ?? occurrence?.nativeAstNodeId;
      const nativeNode = nativeAstNodeId ? nativeAst?.nodes?.[nativeAstNodeId] : undefined;
      const sourceSpan = mapping.sourceSpan ?? occurrence?.span ?? nativeNode?.span;
      const target = mapping.target ?? mapping.generatedSpan?.target ?? context.target;
      const generatedSpan = normalizeGeneratedSpan(mapping.generatedSpan, target, context.targetPath, context.targetHash);
      const mappingLossIds = normalizeReferenceIds(mapping.lossIds, lossIdsForNativeNode(context.losses ?? nativeAst?.losses ?? [], nativeAstNodeId));
      const precision = normalizeSourceMapPrecision(mapping.precision, sourceSpan, generatedSpan);
      if (
        !nativeAstNodeId &&
        !mapping.semanticNodeId &&
        !mapping.semanticSymbolId &&
        !mapping.semanticOccurrenceId &&
        !sourceSpan &&
        !generatedSpan &&
        !mapping.generatedName
      ) {
        throw new Error(`Source-map mapping ${index + 1} must reference a native AST node, semantic node, symbol, occurrence, source span, or generated span`);
      }
      const normalizedMapping = {
        ...mapping,
        nativeSourceId: mapping.nativeSourceId ?? nativeSource?.id,
        nativeAstNodeId,
        semanticSymbolId: mapping.semanticSymbolId ?? occurrence?.symbolId,
        semanticOccurrenceId: mapping.semanticOccurrenceId ?? occurrence?.id,
        semanticNodeId: mapping.semanticNodeId ?? occurrence?.semanticNodeId ?? symbol?.semanticNodeId,
        sourceSpan,
        generatedSpan,
        target,
        evidenceIds: normalizeReferenceIds(mapping.evidenceIds, evidenceIds),
        lossIds: mappingLossIds,
        ownershipRegionId: mapping.ownershipRegionId ?? symbol?.metadata?.ownershipRegionId,
        ownershipRegionKey: mapping.ownershipRegionKey ?? symbol?.metadata?.ownershipRegionKey,
        ownershipRegionKind: mapping.ownershipRegionKind ?? symbol?.metadata?.ownershipRegionKind,
        precision,
        preservation: normalizeSourcePreservationLevel(mapping.preservation, {
          precision,
          lossIds: mappingLossIds,
          losses: context.losses ?? nativeAst?.losses ?? [],
          sourcePreservation: context.sourcePreservation
        })
      };
      return {
        ...normalizedMapping,
        id: reserveUniqueId(sourceMapMappingBaseId(normalizedMapping, index), usedMappingIds)
      };
    });
}

function lossIdsForNativeNode(losses, nativeAstNodeId) {
  if (!nativeAstNodeId) return [];
  return (losses ?? [])
    .filter((loss) => loss.nodeId === nativeAstNodeId)
    .map((loss) => loss.id);
}

function normalizeSourceMaps(sourceMaps, context) {
  if (sourceMaps === undefined || sourceMaps === null) return [];
  if (!Array.isArray(sourceMaps)) {
    throw new Error('Native import sourceMaps must be an array');
  }
  const usedSourceMapIds = new Set();
  return sourceMaps.map((sourceMapInput, index) => {
    if (!isSourceMapInput(sourceMapInput)) {
      throw new Error(`Native import source map ${index + 1} must be an object or ECMA-426 payload`);
    }
    const sourceMap = typeof sourceMapInput === 'object' && !isUint8Array(sourceMapInput) ? sourceMapInput : {};
    const ecma426 = parseEcma426SourceMapInput(sourceMapInput, sourceMap, {
      ...context,
      sourceMapIndex: index
    });
    const id = reserveUniqueId(String(sourceMap.id ?? `${context.defaultSourceMapId}_${index + 1}`), usedSourceMapIds);
    const evidence = uniqueRecordsById([...(sourceMap.evidence ?? []), ...(context.evidence ?? [])]);
    const target = sourceMap.target ?? context.target;
    const targetPath = sourceMap.targetPath ?? context.targetPath ?? ecma426.file;
    const targetHash = sourceMap.targetHash ?? context.targetHash;
    const ecma426Mappings = Array.isArray(sourceMap.mappings)
      ? []
      : sourceMapMappingsFromEcma426(ecma426, sourceMap, {
        ...context,
        id,
        evidence,
        target,
        targetPath,
        targetHash
      });
    const mappings = normalizeSourceMapMappings(Array.isArray(sourceMap.mappings) ? sourceMap.mappings : ecma426Mappings, {
      ...context,
      target,
      targetPath,
      targetHash,
      sourceMapEvidence: evidence
    });
    const normalized = createSourceMapRecord({
      ...sourceMap,
      id,
      sourcePath: sourceMap.sourcePath ?? context.sourcePath,
      sourceHash: sourceMap.sourceHash ?? context.sourceHash,
      target,
      targetPath: targetPath ?? commonGeneratedTargetPath(mappings),
      targetHash,
      semanticIndexId: sourceMap.semanticIndexId ?? context.semanticIndex?.id,
      nativeAstId: sourceMap.nativeAstId ?? context.nativeAst?.id,
      nativeSourceId: sourceMap.nativeSourceId ?? context.nativeSource?.id,
      mappings,
      evidence,
      metadata: {
        ...(sourceMap.metadata ?? {}),
        ecma426SourceMap: ecma426.present
          ? ecma426Metadata(ecma426)
          : sourceMap.metadata?.ecma426SourceMap ?? ecma426Metadata(ecma426)
      }
    });
    const issues = validateSourceMapRecord(normalized, {
      document: context.document,
      nativeSources: context.nativeSources,
      nativeAst: context.nativeAst,
      semanticIndex: context.semanticIndex,
      losses: context.losses,
      evidence: context.evidence
    });
    if (issues.length) {
      throw new Error(`Invalid Frontier native source map ${normalized.id}: ${issues.join('; ')}`);
    }
    return normalized;
  });
}

function normalizeGeneratedSpan(generatedSpan, target, targetPath, targetHash) {
  if (!generatedSpan) return generatedSpan;
  return {
    ...generatedSpan,
    target: generatedSpan.target ?? target,
    targetPath: generatedSpan.targetPath ?? target?.emitPath ?? targetPath,
    targetHash: generatedSpan.targetHash ?? targetHash
  };
}

function normalizeSourceMapPrecision(value, sourceSpan, generatedSpan) {
  const explicit = value === undefined || value === null ? '' : String(value).trim();
  if (explicit) {
    const normalized = explicit.toLowerCase();
    if (normalized === 'exact') {
      return hasExactSpan(sourceSpan) && hasExactSpan(generatedSpan)
        ? 'exact'
        : inferSourceMapPrecisionFromSpans(sourceSpan, generatedSpan);
    }
    if (normalized === 'declaration' || normalized === 'line' || normalized === 'estimated' || normalized === 'unknown') return normalized;
    if (normalized === 'estimate' || normalized === 'approx' || normalized === 'approximate' || normalized === 'approximated') return 'estimated';
    return explicit;
  }
  return inferSourceMapPrecisionFromSpans(sourceSpan, generatedSpan);
}

function inferSourceMapPrecisionFromSpans(sourceSpan, generatedSpan) {
  if (hasExactSpan(sourceSpan) && hasExactSpan(generatedSpan)) return 'exact';
  if (sourceSpan?.startLine && generatedSpan?.startLine) return 'line';
  if (sourceSpan?.startLine) return 'declaration';
  if (generatedSpan?.startLine) return 'line';
  return 'unknown';
}

function hasExactSpan(span) {
  return Boolean(span && (
    (typeof span.start === 'number' && typeof span.end === 'number') ||
    (
      typeof span.startLine === 'number' &&
      typeof span.startColumn === 'number' &&
      typeof span.endLine === 'number' &&
      typeof span.endColumn === 'number'
    )
  ));
}

function normalizeReferenceIds(value, fallback = []) {
  if (value === undefined || value === null) return uniqueStrings(fallback);
  return uniqueStrings(Array.isArray(value) ? value : [value]);
}

function sourceMapMappingBaseId(mapping, index) {
  const explicit = mapping.id === undefined || mapping.id === null ? '' : String(mapping.id).trim();
  if (explicit) return explicit;
  const span = mapping.sourceSpan ?? mapping.generatedSpan;
  const spanPart = span
    ? `${span.path ?? span.targetPath ?? span.sourceId ?? 'span'}_${span.start ?? span.startLine ?? ''}_${span.end ?? span.endLine ?? ''}`
    : undefined;
  return `map_${idFragment([
    mapping.nativeAstNodeId,
    mapping.semanticOccurrenceId,
    mapping.semanticSymbolId,
    mapping.semanticNodeId,
    spanPart,
    index + 1
  ].filter(Boolean).join('_'))}`;
}

export {
  inferSourceMapMappings,
  lossIdsForNativeNode,
  parseEcma426SourceMapPayload,
  normalizeSourceMapMappings,
  normalizeSourceMaps
};
