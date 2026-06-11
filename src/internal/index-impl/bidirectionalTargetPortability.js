import { uniqueStrings } from '../../native-import-utils.js';

export function classifyBidirectionalTargetPortability(context = {}) {
  const matches = array(context.sourceAnchorMatches);
  const targetRegions = Number(context.targetChangeSet?.changedRegions?.length ?? matches.length);
  const links = matches.flatMap((match) => array(match.sourceMapLinks));
  const sourceMapBackedMatches = matches.filter((match) => array(match.sourceMapLinks).length > 0).length;
  const unmatched = matches.filter((match) => match.status === 'unmatched').length;
  const ambiguous = matches.filter((match) => match.status === 'ambiguous').length;
  const deleted = matches.filter((match) => match.status === 'deleted').length;
  const staleLinks = links.filter((link) => sourceMapLinkIsStale(link, context));
  const status = portabilityStatus({ context, targetRegions, matches, sourceMapBackedMatches, unmatched, ambiguous, deleted, staleLinks });
  return compactRecord({
    kind: 'frontier.lang.bidirectionalTargetPortability',
    version: 1,
    id: context.id ? `target_portability_${context.id}` : undefined,
    status,
    action: portabilityAction(status),
    readiness: status === 'blocked' ? 'blocked' : 'needs-review',
    confidence: portabilityConfidence({ status, targetRegions, sourceMapBackedMatches, unmatched, ambiguous, deleted, staleLinks }),
    reviewRequired: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: portabilityReasons({ context, targetRegions, matches, sourceMapBackedMatches, unmatched, ambiguous, deleted, staleLinks, status }),
    conflictKeys: uniqueStrings(matches.flatMap((match) => array(match.conflictKeys))),
    sourceAnchorMatchIds: uniqueStrings(matches.map((match) => match.id)),
    sourceMapLinkIds: uniqueStrings(links.map((link) => link.id)),
    sourceMapMappingIds: uniqueStrings(links.map((link) => link.sourceMapMappingId)),
    staleSourceMapLinkIds: uniqueStrings(staleLinks.map((link) => link.id)),
    targetChangedRegions: targetRegions,
    matchedTargetRegions: matches.filter((match) => match.status === 'matched').length,
    sourceMapBackedRegions: sourceMapBackedMatches,
    unmatchedTargetRegions: unmatched,
    ambiguousTargetRegions: ambiguous,
    deletedSourceAnchors: deleted
  });
}

export function attachBidirectionalMatchPortability(match = {}, context = {}) {
  return {
    ...match,
    portability: classifyBidirectionalMatchPortability(match, context)
  };
}

export function classifyBidirectionalMatchPortability(match = {}, context = {}) {
  const links = array(match.sourceMapLinks);
  const staleLinks = links.filter((link) => sourceMapLinkIsStale(link, context));
  const status = matchPortabilityStatus(match, links, staleLinks);
  return compactRecord({
    status,
    action: portabilityAction(status),
    readiness: status === 'blocked' ? 'blocked' : 'needs-review',
    confidence: matchPortabilityConfidence(status, links),
    reviewRequired: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: matchPortabilityReasons(match, links, staleLinks, status),
    sourceMapLinkIds: uniqueStrings(links.map((link) => link.id)),
    sourceMapMappingIds: uniqueStrings(links.map((link) => link.sourceMapMappingId)),
    staleSourceMapLinkIds: uniqueStrings(staleLinks.map((link) => link.id))
  });
}

function portabilityStatus(input) {
  if (!input.context.source) return 'blocked';
  if (input.targetRegions === 0 || input.matches.length === 0) return 'evidence-only';
  if (input.deleted > 0) return 'blocked';
  if (input.unmatched === input.targetRegions) return 'blocked';
  if (input.staleLinks.length > 0) return 'stale';
  if (input.ambiguous > 0) return 'conflict';
  if (input.unmatched > 0) return 'needs-port';
  if (input.sourceMapBackedMatches === input.targetRegions) return 'portable';
  return 'needs-port';
}

function portabilityAction(status) {
  if (status === 'portable') return 'port-with-source-map-review';
  if (status === 'needs-port') return 'human-port';
  if (status === 'stale') return 'refresh-source-map';
  if (status === 'conflict') return 'resolve-anchor-conflict';
  if (status === 'blocked') return 'block';
  return 'record-evidence';
}

function matchPortabilityStatus(match, links, staleLinks) {
  if (match.status === 'deleted' || match.status === 'unmatched') return 'blocked';
  if (staleLinks.length > 0) return 'stale';
  if (match.status === 'ambiguous') return 'conflict';
  if (match.status === 'matched' && links.length > 0) return 'portable';
  return 'needs-port';
}

function matchPortabilityConfidence(status, links) {
  if (status === 'portable') return 0.72;
  if (status === 'needs-port') return links.length > 0 ? 0.52 : 0.35;
  return undefined;
}

function matchPortabilityReasons(match, links, staleLinks, status) {
  return uniqueStrings([
    status === 'portable' ? 'target-region-source-map-portable' : undefined,
    links.length > 0 ? 'target-region-source-map-backed' : undefined,
    links.length === 0 ? 'target-region-not-source-map-backed' : undefined,
    match.status === 'unmatched' ? 'target-anchor-unmatched' : undefined,
    match.status === 'ambiguous' ? 'target-anchor-ambiguous' : undefined,
    match.status === 'deleted' ? 'target-anchor-deleted' : undefined,
    staleLinks.length > 0 ? 'target-source-map-stale' : undefined,
    'target-region-is-portability-evidence-not-proof'
  ]);
}

function portabilityConfidence(input) {
  if (input.status === 'portable') return 0.74;
  if (input.status === 'needs-port') return input.sourceMapBackedMatches > 0 ? 0.52 : 0.35;
  if (input.status === 'evidence-only') return 0.25;
  return undefined;
}

function portabilityReasons(input) {
  const sourceMapBacked = input.sourceMapBackedMatches > 0;
  return uniqueStrings([
    input.context.source ? undefined : 'source-import-missing',
    input.targetRegions === 0 ? 'target-change-empty' : undefined,
    input.status === 'portable' ? 'target-change-source-map-portable' : undefined,
    sourceMapBacked ? 'target-change-source-map-backed' : undefined,
    input.sourceMapBackedMatches < input.targetRegions ? 'target-change-not-fully-source-map-backed' : undefined,
    input.unmatched > 0 ? 'target-anchor-unmatched' : undefined,
    input.ambiguous > 0 ? 'target-anchor-ambiguous' : undefined,
    input.deleted > 0 ? 'target-anchor-deleted' : undefined,
    input.staleLinks.length > 0 ? 'target-source-map-stale' : undefined,
    'target-change-is-portability-evidence-not-proof',
    ...input.matches.flatMap((match) => array(match.reasonCodes))
  ]);
}

function sourceMapLinkIsStale(link, context) {
  const currentSourceHash = context.currentSourceHash;
  const baseTargetHash = context.targetChangeSet?.beforeHash;
  return Boolean(
    (link.sourceHash && currentSourceHash && link.sourceHash !== currentSourceHash)
    || (link.targetHash && baseTargetHash && link.targetHash !== baseTargetHash)
  );
}

function array(value) {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
