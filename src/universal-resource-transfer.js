import { idFragment, uniqueStrings } from './native-import-utils.js';
import { createUniversalOwnershipConstraintEvidence, ownershipConstraintMatches } from './universal-ownership-constraints.js';
import { summarizeSemanticResourceGraph } from './semantic-resource-graph.js';

export const UniversalResourceTransferStatuses = Object.freeze([
  'not-applicable',
  'preserved',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalResourceTransferEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceGraph = firstGraph(input.sourceGraph, input.sourceResourceGraph, ...(input.sourceGraphs ?? []));
  const targetGraph = firstGraph(input.targetGraph, input.targetResourceGraph, ...(input.targetGraphs ?? []));
  const sourceSummary = summarize(sourceGraph);
  const targetSummary = summarize(targetGraph);
  const sourceFeatures = resourceFeatures(sourceGraph);
  const targetFeatures = resourceFeatures(targetGraph);
  const ownershipConstraints = input.ownershipConstraints?.kind === 'frontier.lang.universalOwnershipConstraintEvidence'
    ? input.ownershipConstraints
    : createUniversalOwnershipConstraintEvidence({
      ...(input.ownershipConstraints ?? {}),
      route,
      routeId: input.routeId ?? route.id,
      sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
      target: input.target ?? route.target,
      mode: input.mode ?? route.mode,
      sourceGraphs: sourceGraph ? [sourceGraph] : [],
      targetGraphs: targetGraph ? [targetGraph] : [],
      evidenceIds: input.evidenceIds ?? []
    });
  const requiredKinds = requiredResourceTransferKinds(sourceSummary, sourceFeatures);
  const representedKinds = representedResourceTransferKinds(requiredKinds, targetSummary, targetFeatures, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = transferMissingEvidence(missingKinds, sourceSummary, targetSummary, input, ownershipConstraints);
  const blockers = transferBlockers(sourceSummary, targetSummary, input, ownershipConstraints);
  const review = transferReview(missingKinds, sourceFeatures, targetFeatures, input, ownershipConstraints);
  const status = transferStatus({ sourceSummary, targetSummary, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalResourceTransferEvidence',
    version: 1,
    schema: 'frontier.lang.universalResourceTransferEvidence.v1',
    id: input.id ?? `resource_transfer_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: transferAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    evidenceIds: uniqueStrings([
      ...(input.evidenceIds ?? []),
      ...(sourceGraph?.evidenceIds ?? []),
      ...(targetGraph?.evidenceIds ?? [])
    ]),
    source: transferSide('source', sourceGraph, sourceSummary, sourceFeatures),
    targetSide: transferSide('target', targetGraph, targetSummary, targetFeatures),
    losses: transferLosses(missingKinds, sourceFeatures, targetFeatures),
    ownershipConstraints,
    claims: {
      resourceEquivalenceClaim: false,
      borrowCheckerClaim: false,
      aliasSafetyClaim: false,
      lifetimeSoundnessClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Resource transfer evidence compares ownership, borrow, move, drop, alias, and unsafe-boundary shapes across a conversion route. It is not a proof of target semantic equivalence.',
      ...(input.metadata ?? {})
    }
  };
}

export function resourceTransferMatches(transfer = {}, query = {}) {
  return match(query.resourceTransferStatus, [transfer.status])
    && match(query.resourceTransferAction, [transfer.action])
    && match(query.resourceTransferMissingEvidence, transfer.missingEvidence)
    && match(query.resourceTransferRequiredKind, transfer.requiredKinds)
    && match(query.resourceTransferRepresentedKind, transfer.representedKinds)
    && match(query.resourceTransferMissingKind, transfer.missingKinds)
    && match(query.resourceTransferLossKind, (transfer.losses ?? []).map((loss) => loss.kind))
    && match(query.resourceTransferEvidenceId, transfer.evidenceIds)
    && ownershipConstraintMatches(transfer.ownershipConstraints, query);
}

export function resourceTransferForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingTransferInput(input, route, routeEvidence);
  const sourceGraphs = uniqueGraphs([
    ...(explicit?.sourceGraphs ?? []),
    explicit?.sourceGraph,
    explicit?.sourceResourceGraph,
    ...routeImports.flatMap(resourceGraphsFromImport),
    ...routeEvidence.flatMap((record) => resourceGraphsFromEvidence(record, 'source'))
  ]);
  const targetGraphs = uniqueGraphs([
    ...(explicit?.targetGraphs ?? []),
    explicit?.targetGraph,
    explicit?.targetResourceGraph,
    ...routeEvidence.flatMap((record) => resourceGraphsFromEvidence(record, 'target'))
  ]);
  if (!explicit && !sourceGraphs.length && !targetGraphs.length) return undefined;
  return createUniversalResourceTransferEvidence({
    ...explicit,
    route,
    routeId: route.id,
    sourceLanguage: route.sourceLanguage,
    target: route.target,
    mode: route.mode,
    sourceGraphs,
    targetGraphs,
    evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean)
  });
}

function firstGraph(...graphs) {
  return graphs.flat().find((graph) => graph && typeof graph === 'object');
}

function summarize(graph) {
  if (!graph) return { records: 0, resources: 0, owners: 0, loans: 0, aliases: 0, moves: 0, drops: 0, lifetimeRegions: 0, unsafeBoundaries: 0, conflicts: 0, proofObligations: 0, unsafeBoundariesWithoutProof: 0, reasonCodes: ['missing-resource-graph'] };
  return graph.summary ?? summarizeSemanticResourceGraph(graph);
}

function resourceFeatures(graph = {}) {
  return {
    resourceKinds: uniqueStrings((graph.resources ?? []).map((record) => record.resourceKind)),
    loanModes: uniqueStrings((graph.loans ?? []).map((record) => record.mode)),
    aliasKinds: uniqueStrings((graph.aliases ?? []).map((record) => record.aliasKind)),
    moveKinds: uniqueStrings((graph.moves ?? []).map((record) => record.moveKind ?? record.kind ?? 'move')),
    dropKinds: uniqueStrings((graph.drops ?? []).map((record) => record.dropKind)),
    lifetimeKinds: uniqueStrings((graph.lifetimeRegions ?? []).map((record) => record.lifetimeKind)),
    unsafeBoundaryKinds: uniqueStrings((graph.unsafeBoundaries ?? []).map((record) => record.kind ?? record.metadata?.proofGapCode ?? 'unsafe-boundary'))
  };
}

function requiredResourceTransferKinds(summary, features) {
  return uniqueStrings([
    ...(summary.resources ? ['resource-identity'] : []),
    ...(summary.owners ? ['owner'] : []),
    ...(summary.loans ? ['loan'] : []),
    ...(features.loanModes.includes('mutable') || features.loanModes.includes('exclusive') ? ['exclusive-borrow'] : []),
    ...(summary.aliases ? ['alias'] : []),
    ...(summary.moves ? ['move'] : []),
    ...(summary.drops ? ['drop'] : []),
    ...(summary.lifetimeRegions ? ['lifetime-region'] : []),
    ...(summary.unsafeBoundaries ? ['unsafe-boundary'] : [])
  ]);
}

function representedResourceTransferKinds(requiredKinds, targetSummary, targetFeatures, options) {
  if (!requiredKinds.length) return [];
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  return requiredKinds.filter((kind) => {
    if (kind === 'resource-identity') return targetSummary.resources > 0;
    if (kind === 'owner') return targetSummary.owners > 0;
    if (kind === 'loan') return targetSummary.loans > 0;
    if (kind === 'exclusive-borrow') return targetFeatures.loanModes.includes('mutable') || targetFeatures.loanModes.includes('exclusive');
    if (kind === 'alias') return targetSummary.aliases > 0;
    if (kind === 'move') return targetSummary.moves > 0;
    if (kind === 'drop') return targetSummary.drops > 0;
    if (kind === 'lifetime-region') return targetSummary.lifetimeRegions > 0;
    if (kind === 'unsafe-boundary') return targetSummary.unsafeBoundaries > 0 && targetSummary.unsafeBoundariesWithoutProof === 0;
    return false;
  });
}

function transferMissingEvidence(missingKinds, sourceSummary, targetSummary, input, ownershipConstraints = {}) {
  if (!sourceSummary.records) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetSummary.records || preserveSource ? [] : ['translation-resource-transfer-target-graph']),
    ...(missingKinds.length ? ['translation-resource-transfer-proof'] : []),
    ...(missingKinds.map((kind) => `translation-resource-transfer:${kind}`)),
    ...(sourceSummary.unsafeBoundariesWithoutProof || targetSummary.unsafeBoundariesWithoutProof ? ['translation-unsafe-resource-proof'] : []),
    ...(ownershipConstraints.missingEvidence ?? []),
    ...(input.missingEvidence ?? [])
  ]);
}

function transferBlockers(sourceSummary, targetSummary, input, ownershipConstraints = {}) {
  return uniqueStrings([
    ...(sourceSummary.conflicts ? ['Source resource graph has unresolved conflicts.'] : []),
    ...(targetSummary.conflicts ? ['Target resource graph has unresolved conflicts.'] : []),
    ...(sourceSummary.unsafeBoundariesWithoutProof ? ['Source unsafe resource boundary proof is missing.'] : []),
    ...(targetSummary.unsafeBoundariesWithoutProof ? ['Target unsafe resource boundary proof is missing.'] : []),
    ...(ownershipConstraints.blockers ?? []),
    ...(input.blockers ?? [])
  ]);
}

function transferReview(missingKinds, sourceFeatures, targetFeatures, input, ownershipConstraints = {}) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Resource transfer is missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceFeatures.loanModes.length && !targetFeatures.loanModes.length ? ['Source borrow modes are not represented in the target graph.'] : []),
    ...(sourceFeatures.dropKinds.length && !targetFeatures.dropKinds.length ? ['Source cleanup/drop evidence is not represented in the target graph.'] : []),
    ...(ownershipConstraints.review ?? []),
    ...(input.review ?? [])
  ]);
}

function transferStatus(input) {
  if (!input.sourceSummary.records && !input.targetSummary.records) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetSummary.records ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'preserved' : 'not-applicable';
}

function transferAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-resource-transfer-evidence';
  if (status === 'degraded') return 'review-resource-transfer-loss';
  if (status === 'preserved') return 'attach-resource-transfer-record';
  return 'skip';
}

function transferSide(role, graph, summary, features) {
  return {
    role,
    graphId: graph?.id,
    sourceLanguage: graph?.sourceLanguage,
    sourcePath: graph?.sourcePath,
    sourceHash: graph?.sourceHash,
    status: graph?.status,
    summary,
    features
  };
}

function transferLosses(missingKinds, sourceFeatures, targetFeatures) {
  return missingKinds.map((kind) => ({
    kind,
    source: featureValuesForKind(kind, sourceFeatures),
    target: featureValuesForKind(kind, targetFeatures),
    severity: kind === 'unsafe-boundary' || kind === 'exclusive-borrow' ? 'error' : 'warning'
  }));
}

function featureValuesForKind(kind, features) {
  if (kind === 'loan' || kind === 'exclusive-borrow') return features.loanModes;
  if (kind === 'alias') return features.aliasKinds;
  if (kind === 'move') return features.moveKinds;
  if (kind === 'drop') return features.dropKinds;
  if (kind === 'lifetime-region') return features.lifetimeKinds;
  if (kind === 'unsafe-boundary') return features.unsafeBoundaryKinds;
  return features.resourceKinds;
}

function matchingTransferInput(input, route, routeEvidence) {
  const candidates = [
    input.resourceTransfer,
    input.translationResourceTransfer,
    ...(input.resourceTransfers ?? []),
    ...routeEvidence.map((record) => record?.resourceTransfer ?? record?.translationResourceTransfer)
  ].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function routeMatch(candidate, route) {
  return (!candidate.routeId || candidate.routeId === route.id)
    && (!candidate.sourceLanguage || candidate.sourceLanguage === route.sourceLanguage)
    && (!candidate.target || candidate.target === route.target);
}

function resourceGraphsFromImport(imported) {
  return uniqueGraphs([
    imported?.resourceGraph,
    imported?.semanticResourceGraph,
    imported?.universalAst?.resourceGraph,
    imported?.universalAst?.semanticResourceGraph,
    imported?.metadata?.resourceGraph
  ]);
}

function resourceGraphsFromEvidence(record, role) {
  const direct = role === 'source'
    ? [record?.sourceResourceGraph, record?.sourceGraph]
    : [record?.targetResourceGraph, record?.targetGraph];
  return uniqueGraphs([...direct, ...(record?.resourceGraphs ?? []).filter((graph) => !graph.role || graph.role === role)]);
}

function uniqueGraphs(graphs) {
  const seen = new Set();
  return graphs.flat().filter((graph) => {
    if (!graph || typeof graph !== 'object') return false;
    const key = graph.id ?? `${graph.sourcePath ?? ''}:${graph.sourceHash ?? ''}:${graph.status ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sameLanguage(source, target) {
  return String(source ?? '').toLowerCase() === String(target ?? '').toLowerCase();
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
