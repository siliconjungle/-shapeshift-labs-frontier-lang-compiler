import {
  idFragment,
  maxSemanticMergeReadiness,
  uniqueRecordsById,
  uniqueStrings
} from '../../native-import-utils.js';
import { resolveSemanticLineage } from './semanticLineageResolutionRecords.js';

export function matchTargetRegion(context) {
  const explicit = explicitMappingForRegion(context.region, context.mappings);
  const candidateAnchors = explicit
    ? sourceAnchorsForMapping(explicit, context.sourceAnchors)
    : sourceAnchorsByName(context.region, context.sourceAnchors);
  const resolvedAnchors = candidateAnchors.flatMap((anchor) => resolveAnchor(anchor, context.lineage));
  const status = matchStatus(candidateAnchors, resolvedAnchors);
  const reasonCodes = uniqueStrings([
    explicit ? 'explicit-anchor-mapping' : 'inferred-by-symbol-name',
    status === 'unmatched' ? 'source-anchor-not-found' : undefined,
    status === 'ambiguous' ? 'source-anchor-ambiguous' : undefined,
    status === 'deleted' ? 'source-anchor-deleted' : undefined,
    'human-source-port-required'
  ]);
  return {
    kind: 'frontier.lang.bidirectionalTargetChangeSourceAnchorMatch',
    version: 1,
    id: `source_anchor_match_${idFragment(context.id)}_${context.index + 1}`,
    targetRegion: compactRegion(context.region),
    sourceAnchors: resolvedAnchors.map((entry) => entry.anchor),
    lineageResolutions: uniqueRecordsById(resolvedAnchors.map((entry) => entry.resolution).filter(Boolean)),
    status,
    confidence: status === 'matched' && explicit ? 0.8 : status === 'matched' ? 0.58 : undefined,
    reasonCodes,
    reviewRequired: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    conflictKeys: uniqueStrings([
      context.region.conflictKey,
      context.region.key,
      ...resolvedAnchors.map((entry) => entry.anchor?.key),
      status === 'unmatched' ? `target:${context.region.sourcePath ?? context.region.language ?? 'unknown'}` : undefined
    ])
  };
}

export function classifyBidirectionalReadiness(targetChangeSet, source, matches) {
  let readiness = maxSemanticMergeReadiness(targetChangeSet.readiness, 'needs-review');
  if (!source) readiness = 'blocked';
  if (matches.some((match) => match.status === 'deleted')) readiness = 'blocked';
  if (matches.every((match) => match.status === 'unmatched') && matches.length > 0) readiness = 'blocked';
  return readiness;
}

export function sourceRegionsForMatch(match, readiness) {
  const anchors = match.sourceAnchors.length ? match.sourceAnchors : [undefined];
  return anchors.map((anchor, index) => compactRecord({
    id: `source_port_region_${idFragment(match.id)}_${index + 1}`,
    key: anchor?.key ?? `unmapped-target#${match.targetRegion.key ?? match.targetRegion.id}`,
    conflictKey: anchor?.key ?? match.targetRegion.conflictKey ?? match.targetRegion.key,
    changeKind: match.targetRegion.changeKind,
    regionKind: anchor?.kind ?? match.targetRegion.regionKind,
    granularity: 'symbol',
    language: anchor?.language,
    sourcePath: anchor?.sourcePath,
    sourceHash: anchor?.sourceHash,
    symbolId: anchor?.symbolId,
    symbolName: anchor?.symbolName,
    sourceSpan: anchor?.sourceSpan,
    admission: {
      readiness,
      action: 'review-port-from-target-change',
      reasonCodes: match.reasonCodes,
      conflictKeys: match.conflictKeys
    },
    metadata: {
      bidirectionalTargetChange: {
        matchId: match.id,
        targetRegion: match.targetRegion,
        lineageResolutionIds: match.lineageResolutions.map((resolution) => resolution.id),
        reviewRequired: true,
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      }
    }
  }));
}

export function createBidirectionalEvidence(context) {
  return {
    id: context.input.evidenceId ?? `evidence_${idFragment(context.id)}_bidirectional_target_change`,
    kind: 'semantic-merge',
    status: 'passed',
    path: context.source?.sourcePath ?? context.targetChangeSet.sourcePath,
    summary: `Mapped ${context.targetChangeSet.changedRegions.length} target changed region(s) to ${matchedCount(context.sourceAnchorMatches)} source anchor match(es).`,
    metadata: {
      schema: 'frontier.lang.bidirectionalTargetChangeEvidence.v1',
      sourceImportId: context.source?.id,
      targetChangeSetId: context.targetChangeSet.id,
      targetPatchId: context.targetChangeSet.patch?.id,
      sourceAnchorMatchIds: context.sourceAnchorMatches.map((match) => match.id),
      readiness: context.readiness,
      reasons: context.reasons,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  };
}

export function anchorsFromSourceSidecar(sidecar, source) {
  return uniqueRecordsById((sidecar.ownershipRegions ?? []).map((region) => compactRecord({
    id: region.id,
    key: region.key,
    kind: region.regionKind,
    language: region.language ?? source?.language,
    sourcePath: region.sourcePath ?? source?.sourcePath,
    sourceHash: region.sourceHash ?? sourceHash(source),
    symbolId: region.symbolId,
    symbolName: region.symbolName,
    sourceSpan: region.sourceSpan,
    metadata: region.metadata
  })));
}

export function sourceHash(source) {
  return source?.nativeSource?.sourceHash ?? source?.nativeAst?.sourceHash ?? source?.sourceHash;
}

function explicitMappingForRegion(region, mappings) {
  return mappings.find((mapping) => {
    const targetKeys = uniqueStrings([
      mapping.targetAnchorKey,
      mapping.targetRegionKey,
      mapping.targetConflictKey,
      mapping.targetKey
    ]);
    if (targetKeys.some((key) => key === region.key || key === region.conflictKey || key === region.id)) return true;
    if (mapping.targetSymbolName && mapping.targetSymbolName === (region.symbolName ?? region.name)) return true;
    return mapping.targetSymbolId && mapping.targetSymbolId === region.symbolId;
  });
}

function sourceAnchorsForMapping(mapping, sourceAnchors) {
  const keys = uniqueStrings([mapping.sourceAnchorKey, mapping.sourceRegionKey, mapping.sourceConflictKey, mapping.sourceKey]);
  const matches = sourceAnchors.filter((anchor) => keys.includes(anchor.key) || keys.includes(anchor.id));
  if (matches.length) return matches;
  if (mapping.sourceSymbolName) return sourceAnchors.filter((anchor) => anchor.symbolName === mapping.sourceSymbolName);
  if (mapping.sourceSymbolId) return sourceAnchors.filter((anchor) => anchor.symbolId === mapping.sourceSymbolId);
  return [];
}

function sourceAnchorsByName(region, sourceAnchors) {
  const names = uniqueStrings([region.symbolName, region.name, region.metadata?.changedRegionProjection?.region?.symbolName]);
  if (names.length === 0) return [];
  return sourceAnchors.filter((anchor) => names.includes(anchor.symbolName));
}

function resolveAnchor(anchor, lineage) {
  if (!anchor) return [];
  const resolution = array(lineage).length ? resolveSemanticLineage(lineage, { anchorKey: anchor.key }) : undefined;
  if (!resolution || resolution.status === 'unchanged') return [{ anchor, resolution }];
  if (resolution.status === 'deleted') return [{ anchor, resolution }];
  if (resolution.currentAnchors.length === 0) return [{ anchor, resolution }];
  return resolution.currentAnchors.map((current) => ({ anchor: { ...anchor, ...current }, resolution }));
}

function matchStatus(originalAnchors, resolvedAnchors) {
  if (originalAnchors.length === 0 || resolvedAnchors.length === 0) return 'unmatched';
  if (resolvedAnchors.some((entry) => entry.resolution?.status === 'deleted')) return 'deleted';
  if (resolvedAnchors.length > 1 || resolvedAnchors.some((entry) => entry.resolution?.status === 'ambiguous')) return 'ambiguous';
  return 'matched';
}

function matchedCount(matches) {
  return matches.filter((match) => match.status === 'matched').length;
}

function compactRegion(region) {
  return compactRecord({
    id: region.id,
    key: region.key,
    conflictKey: region.conflictKey,
    changeKind: region.changeKind,
    regionKind: region.regionKind,
    language: region.language,
    sourcePath: region.sourcePath,
    sourceHash: region.sourceHash,
    symbolId: region.symbolId,
    symbolName: region.symbolName ?? region.name,
    sourceSpan: region.sourceSpan
  });
}

function array(value) {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
