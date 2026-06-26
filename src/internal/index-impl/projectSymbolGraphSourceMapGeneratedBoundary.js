import { classifySourceMapGeneratedBoundary } from './sourceMapGeneratedBoundaryGate.js';

function sourceMapsForImport(imported) {
  return uniqueRecords([
    ...(imported?.sourceMaps ?? []),
    ...(imported?.universalAst?.sourceMaps ?? [])
  ]);
}

function sourceMapGeneratedBoundaryGateForImport(imported, sourceMaps, context) {
  const generatedBoundarySourceMaps = sourceMaps.filter(sourceMapHasGeneratedBoundaryEvidence);
  const derived = generatedBoundarySourceMaps.length
    ? classifySourceMapGeneratedBoundary(generatedBoundarySourceMaps, {
      sourceLanguage: context.preservation?.language ?? imported?.language,
      target: imported?.target,
      outputMode: imported?.metadata?.outputMode,
      projectionMode: imported?.metadata?.projectionMode
    })
    : undefined;
  const existing = firstGeneratedBoundaryGate(
    imported?.metadata?.sourceMapGeneratedBoundaryGate,
    imported?.metadata?.projectionReview?.sourceMapGeneratedBoundaryGate,
    ...(sourceMaps ?? []).flatMap((sourceMap) => [
      sourceMap?.metadata?.sourceMapGeneratedBoundaryGate,
      sourceMap?.metadata?.projectionReview?.sourceMapGeneratedBoundaryGate
    ])
  );
  return derived ?? existing;
}

function sourceMapGeneratedBoundaryRecordForSpan(context, span) {
  return span.kind === 'source-map-comment'
    ? sourceMapGeneratedBoundaryRecord(context, { sourceMapComments: 1 })
    : undefined;
}

function sourceMapGeneratedBoundaryRecord(context, summary = {}) {
  const sourceMapCommentCount = summary.sourceMapComments ?? summary.ledger?.sourceMapComments ?? 0;
  const gate = context.generatedBoundaryGate
    ?? (sourceMapCommentCount > 0
      ? classifySourceMapGeneratedBoundary([], { sourceLanguage: context.preservation?.language })
      : undefined);
  if (!gate) return undefined;
  const blockReasonCodes = sourceMapGeneratedBoundaryBlockReasonCodes(gate);
  return compactRecord({
    sourceMapRecordCount: gate.summary?.sourceMaps,
    sourceMapMappingCount: gate.summary?.mappings,
    sourceMapIds: gate.sourceMapIds,
    sourceMapMappingIds: gate.sourceMapMappingIds,
    sourceMapGeneratedBoundaryStatus: gate.status,
    sourceMapGeneratedBoundaryReadiness: gate.readiness,
    sourceMapGeneratedBoundaryAction: gate.action,
    sourceMapGeneratedBoundaryReviewRequired: gate.reviewRequired,
    sourceMapGeneratedBoundaryExactBoundary: gate.exactBoundary,
    sourceMapGeneratedBoundaryOwnershipStatus: gate.generatedBoundaryOwnershipStatus,
    sourceMapGeneratedBoundaryOwnershipKeys: gate.generatedBoundaryOwnershipKeys,
    sourceMapGeneratedBoundaryOwnershipRecords: gate.generatedBoundaryOwnershipRecords,
    sourceMapGeneratedBoundaryReasonCodes: gate.reasonCodes,
    sourceMapGeneratedBoundaryBlockReasonCodes: blockReasonCodes,
    sourceMapGeneratedBoundarySummary: gate.summary,
    sourceMapGeneratedBoundaryInvariant: gate.invariant,
    sourceMapGeneratedBoundaryMissingInvariant: gate.missingInvariant
  });
}

function sourceMapHasGeneratedBoundaryEvidence(sourceMap) {
  return Boolean(
    sourceMap?.targetPath
      || sourceMap?.targetHash
      || sourceMap?.target?.emitPath
      || sourceMap?.metadata?.ecma426SourceMap?.present === true
      || (sourceMap?.mappings ?? []).some((mapping) => mapping?.generatedSpan || mapping?.targetHash)
  );
}

function firstGeneratedBoundaryGate(...values) {
  return values.find((value) => value?.schema === 'frontier.lang.sourceMapGeneratedBoundaryGate.v1'
    || typeof value?.generatedBoundaryOwnershipStatus === 'string');
}

function sourceMapGeneratedBoundaryBlockReasonCodes(gate) {
  if (gate?.status !== 'blocked' && gate?.generatedBoundaryOwnershipStatus !== 'blocked') return [];
  return uniqueStrings([
    gate?.missingInvariant,
    ...(gate?.reasonCodes ?? []).filter((code) => code !== 'ecma-426:source-map-generated-boundary-gate'
      && code !== 'runtime-neutral:source-map-records-only')
  ]);
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))];
}

export {
  sourceMapGeneratedBoundaryGateForImport,
  sourceMapGeneratedBoundaryRecord,
  sourceMapGeneratedBoundaryRecordForSpan,
  sourceMapsForImport
};
