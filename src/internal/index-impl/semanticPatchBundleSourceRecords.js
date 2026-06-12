import { idFragment, uniqueStrings } from '../../native-import-utils.js';

export function normalizeSources(entries, context) {
  return entries.filter(Boolean).map((entry, index) => compactRecord({
    id: entry.id ?? entry.sourceId,
    side: entry.side,
    importId: entry.importId ?? entry.importResultId,
    language: entry.language ?? context.language,
    sourcePath: entry.sourcePath ?? context.sourcePath,
    sourceHash: entry.sourceHash ?? entry.hash,
    baseHash: entry.baseHash ?? entry.beforeHash ?? context.baseHash ?? context.beforeHash,
    targetHash: entry.targetHash ?? entry.afterHash ?? context.targetHash ?? context.afterHash,
    nativeSourceId: entry.nativeSourceId,
    nativeAstId: entry.nativeAstId,
    semanticIndexId: entry.semanticIndexId,
    universalAstId: entry.universalAstId,
    sourceMapIds: uniqueStrings(entry.sourceMapIds),
    ordinal: index
  })).filter((entry) => entry.importId || entry.sourcePath || entry.sourceHash || entry.baseHash || entry.targetHash);
}

export function sourceRef(importResult, side, sourceHash) {
  if (!importResult) return undefined;
  return compactRecord({
    id: `${side}_${importResult.id ?? idFragment(importResult.sourcePath ?? 'source')}`,
    side,
    importId: importResult.id,
    language: importResult.language,
    sourcePath: importResult.sourcePath,
    sourceHash: sourceHash ?? importResult.nativeSource?.sourceHash ?? importResult.nativeAst?.sourceHash ?? importResult.sourceHash,
    nativeSourceId: importResult.nativeSource?.id,
    nativeAstId: importResult.nativeAst?.id,
    semanticIndexId: importResult.semanticIndex?.id,
    universalAstId: importResult.universalAst?.id,
    sourceMapIds: uniqueStrings((importResult.sourceMaps ?? []).map((map) => map.id))
  });
}

export function normalizeRegions(regions, context) {
  return regions.filter(Boolean).map((region, index) => {
    const projection = region.metadata?.changedRegionProjection ?? region.projection;
    const projected = projection?.region ?? {};
    const key = firstString(region.key, region.ownershipKey, projected.key, region.conflictKey, region.id);
    const conflictKey = firstString(region.conflictKey, projection?.conflictKey, key);
    const links = array(projection?.sourceMapLinks ?? region.sourceMapLinks);
    return compactRecord({
      id: region.id ?? projected.id ?? `changed_region_${index + 1}`,
      key,
      conflictKey,
      changeKind: region.changeKind ?? projection?.changeKind,
      regionKind: region.regionKind ?? region.ownershipRegionKind ?? projected.kind,
      granularity: region.granularity ?? projected.granularity,
      precision: region.precision ?? projected.precision,
      language: region.language ?? projection?.language ?? context.language,
      sourcePath: region.sourcePath ?? projection?.sourcePath ?? context.sourcePath,
      sourceHash: region.sourceHash ?? projection?.after?.sourceHash ?? projection?.before?.sourceHash,
      symbolId: region.symbolId ?? projected.symbolId,
      symbolName: region.symbolName ?? region.name ?? projected.symbolName,
      symbolKind: region.symbolKind ?? projected.symbolKind,
      sourceSpan: region.sourceSpan ?? projected.sourceSpan,
      sourceMapLinkIds: uniqueStrings([...strings(region.sourceMapLinkIds), ...links.map((link) => link.id)]),
      sourceMapIds: uniqueStrings([...strings(region.sourceMapIds), ...links.map((link) => link.sourceMapId)]),
      sourceMapMappingIds: uniqueStrings([...strings(region.sourceMapMappingIds), ...links.map((link) => link.sourceMapMappingId)]),
      lineageResolutionIds: uniqueStrings([...strings(region.lineageResolutionIds), ...strings(projection?.lineageResolutionIds), ...strings(region.metadata?.bidirectionalTargetChange?.lineageResolutionIds), ...strings(region.metadata?.semanticHistoryLineageResolution?.lineageResolutionIds), region.metadata?.semanticHistoryLineageResolution?.id]),
      lineageEventIds: uniqueStrings([...strings(region.lineageEventIds), ...strings(projection?.lineageEventIds), ...strings(region.metadata?.semanticHistoryLineageResolution?.lineageEventIds)]),
      lineageSourcePaths: uniqueStrings([...strings(region.lineageSourcePaths), ...strings(projection?.lineageSourcePaths), ...strings(region.metadata?.semanticHistoryLineageResolution?.sourcePaths)]),
      lineageEvidenceIds: uniqueStrings([...strings(region.lineageEvidenceIds), ...strings(projection?.lineageEvidenceIds), ...strings(region.metadata?.semanticHistoryLineageResolution?.evidenceIds)]),
      lineageProofIds: uniqueStrings([...strings(region.lineageProofIds), ...strings(projection?.lineageProofIds), ...strings(region.metadata?.semanticHistoryLineageResolution?.proofIds)]),
      lineageReasonCodes: uniqueStrings([...strings(region.lineageReasonCodes), ...strings(projection?.lineageReasonCodes), ...strings(region.metadata?.semanticHistoryLineageResolution?.reasonCodes)]),
      admission: compactRecord({
        readiness: projection?.admission?.readiness ?? region.admission?.readiness,
        action: projection?.admission?.action ?? region.admission?.action,
        reasonCodes: uniqueStrings([...strings(region.admission?.reasonCodes), ...strings(projection?.admission?.reasons)]),
        conflictKeys: uniqueStrings([...strings(region.admission?.conflictKeys), ...strings(projection?.admission?.conflictKeys)])
      }),
      metadata: region.metadata
    });
  });
}

export function normalizeSourceMapLinks(links) {
  const seen = new Set();
  const result = [];
  for (const link of links.filter(Boolean)) {
    const id = link.id ?? `source_map_link_${result.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(compactRecord({
      id,
      side: link.side,
      sourceMapId: link.sourceMapId,
      sourceMapMappingId: link.sourceMapMappingId,
      sourcePath: link.sourcePath,
      sourceHash: link.sourceHash,
      targetPath: link.targetPath,
      targetHash: link.targetHash,
      semanticSymbolId: link.semanticSymbolId,
      semanticOccurrenceId: link.semanticOccurrenceId,
      semanticNodeId: link.semanticNodeId,
      nativeSourceId: link.nativeSourceId,
      nativeAstNodeId: link.nativeAstNodeId,
      precision: link.precision,
      sourceSpan: link.sourceSpan,
      generatedSpan: link.generatedSpan,
      regionKey: link.ownershipRegionKey,
      regionKind: link.ownershipRegionKind
    }));
  }
  return result;
}

function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function strings(value) {
  return array(value).map((entry) => String(entry ?? '')).filter(Boolean);
}

function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
