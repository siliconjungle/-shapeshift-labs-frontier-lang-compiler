import { idFragment, uniqueStrings } from './native-import-utils.js';
import { summarizeSemanticResourceGraph } from './semantic-resource-graph.js';

export const UniversalOwnershipConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalOwnershipConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceGraph = firstGraph(input.sourceGraph, input.sourceResourceGraph, ...(input.sourceGraphs ?? []));
  const targetGraph = firstGraph(input.targetGraph, input.targetResourceGraph, ...(input.targetGraphs ?? []));
  const sourceSummary = summarize(sourceGraph);
  const targetSummary = summarize(targetGraph);
  const sourceModel = constraintModel(sourceGraph, sourceSummary);
  const targetModel = constraintModel(targetGraph, targetSummary);
  const requiredKinds = requiredConstraintKinds(sourceModel, sourceSummary);
  const representedKinds = representedConstraintKinds(requiredKinds, targetModel, targetSummary, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = constraintMissingEvidence(missingKinds, sourceSummary, targetSummary, input);
  const blockers = constraintBlockers(sourceSummary, targetSummary, input);
  const review = constraintReview(missingKinds, sourceModel, targetModel, input);
  const status = constraintStatus({ sourceSummary, targetSummary, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalOwnershipConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalOwnershipConstraintEvidence.v1',
    id: input.id ?? `ownership_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: constraintAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...(sourceGraph?.evidenceIds ?? []), ...(targetGraph?.evidenceIds ?? [])]),
    source: constraintSide('source', sourceGraph, sourceSummary, sourceModel),
    targetSide: constraintSide('target', targetGraph, targetSummary, targetModel),
    constraints: requiredKinds.map((kind) => constraintRecord(kind, sourceModel, targetModel, representedKinds)),
    claims: {
      borrowCheckerClaim: false,
      aliasSafetyClaim: false,
      lifetimeSoundnessClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Ownership constraints model borrow-checker-shaped obligations as evidence. They do not prove that the target language enforces those obligations.',
      ...(input.metadata ?? {})
    }
  };
}

export function ownershipConstraintMatches(evidence = {}, query = {}) {
  return match(query.ownershipConstraintStatus, [evidence.status])
    && match(query.ownershipConstraintAction, [evidence.action])
    && match(query.ownershipConstraintRequiredKind, evidence.requiredKinds)
    && match(query.ownershipConstraintRepresentedKind, evidence.representedKinds)
    && match(query.ownershipConstraintMissingKind, evidence.missingKinds)
    && match(query.ownershipConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.ownershipConstraintEvidenceId, evidence.evidenceIds);
}

function summarize(graph) {
  if (!graph) return { records: 0, resources: 0, owners: 0, loans: 0, aliases: 0, moves: 0, drops: 0, lifetimeRegions: 0, unsafeBoundaries: 0, conflicts: 0, proofObligations: 0, unsafeBoundariesWithoutProof: 0, reasonCodes: ['missing-resource-graph'] };
  return graph.summary ?? summarizeSemanticResourceGraph(graph);
}

function constraintModel(graph = {}, summary = {}) {
  const loanModes = uniqueStrings((graph.loans ?? []).map((record) => record.mode));
  return {
    ownerKinds: uniqueStrings((graph.owners ?? []).map((record) => record.ownerKind)),
    loanModes,
    aliasKinds: uniqueStrings((graph.aliases ?? []).map((record) => record.aliasKind)),
    moveKinds: uniqueStrings((graph.moves ?? []).map((record) => record.moveKind ?? 'move')),
    dropKinds: uniqueStrings((graph.drops ?? []).map((record) => record.dropKind)),
    lifetimeKinds: uniqueStrings((graph.lifetimeRegions ?? []).map((record) => record.lifetimeKind)),
    unsafeBoundaryKinds: uniqueStrings((graph.unsafeBoundaries ?? []).map((record) => record.kind ?? record.metadata?.proofGapCode ?? 'unsafe-boundary')),
    hasSharedBorrow: loanModes.includes('shared'),
    hasExclusiveBorrow: loanModes.includes('mutable') || loanModes.includes('exclusive'),
    hasRawAccess: loanModes.includes('raw') || summary.unsafeBoundaries > 0,
    hasLifetimeBoundLoans: (graph.loans ?? []).some((record) => record.lifetimeRegionId),
    hasCallArgumentTransfer: (graph.moves ?? []).some((record) => String(record.moveKind ?? '').includes('call-argument')),
    hasReturnTransfer: (graph.moves ?? []).some((record) => String(record.moveKind ?? '').includes('return'))
  };
}

function requiredConstraintKinds(model, summary) {
  return uniqueStrings([
    ...(summary.resources && summary.owners ? ['single-owner'] : []),
    ...(model.hasSharedBorrow ? ['shared-borrow'] : []),
    ...(model.hasExclusiveBorrow ? ['exclusive-borrow'] : []),
    ...(summary.aliases ? ['alias-control'] : []),
    ...(summary.moves ? ['move-invalidates-source'] : []),
    ...(model.hasCallArgumentTransfer ? ['call-argument-ownership-transfer'] : []),
    ...(model.hasReturnTransfer ? ['return-ownership-transfer'] : []),
    ...(summary.drops ? ['drop-order'] : []),
    ...(summary.lifetimeRegions || model.hasLifetimeBoundLoans ? ['lifetime-bound'] : []),
    ...(model.hasRawAccess ? ['raw-access-boundary'] : []),
    ...(summary.unsafeBoundaries ? ['unsafe-boundary-proof'] : [])
  ]);
}

function representedConstraintKinds(requiredKinds, model, summary, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  return requiredKinds.filter((kind) => {
    if (kind === 'single-owner') return summary.resources > 0 && summary.owners > 0;
    if (kind === 'shared-borrow') return model.loanModes.includes('shared');
    if (kind === 'exclusive-borrow') return model.hasExclusiveBorrow;
    if (kind === 'alias-control') return summary.aliases > 0;
    if (kind === 'move-invalidates-source') return summary.moves > 0;
    if (kind === 'call-argument-ownership-transfer') return model.hasCallArgumentTransfer;
    if (kind === 'return-ownership-transfer') return model.hasReturnTransfer;
    if (kind === 'drop-order') return summary.drops > 0;
    if (kind === 'lifetime-bound') return summary.lifetimeRegions > 0 || model.hasLifetimeBoundLoans;
    if (kind === 'raw-access-boundary') return model.hasRawAccess;
    if (kind === 'unsafe-boundary-proof') return summary.unsafeBoundaries > 0 && summary.unsafeBoundariesWithoutProof === 0;
    return false;
  });
}

function constraintMissingEvidence(missingKinds, sourceSummary, targetSummary, input) {
  if (!sourceSummary.records) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetSummary.records || preserveSource ? [] : ['translation-ownership-constraint-target-graph']),
    ...(missingKinds.length ? ['translation-ownership-constraint-proof'] : []),
    ...(missingKinds.map((kind) => `translation-ownership-constraint:${kind}`)),
    ...(sourceSummary.unsafeBoundariesWithoutProof || targetSummary.unsafeBoundariesWithoutProof ? ['translation-ownership-unsafe-proof'] : []),
    ...(input.missingEvidence ?? [])
  ]);
}

function constraintBlockers(sourceSummary, targetSummary, input) {
  return uniqueStrings([
    ...(sourceSummary.conflicts ? ['Source ownership constraints have unresolved conflicts.'] : []),
    ...(targetSummary.conflicts ? ['Target ownership constraints have unresolved conflicts.'] : []),
    ...(sourceSummary.unsafeBoundariesWithoutProof ? ['Source unsafe ownership proof is missing.'] : []),
    ...(targetSummary.unsafeBoundariesWithoutProof ? ['Target unsafe ownership proof is missing.'] : []),
    ...(input.blockers ?? [])
  ]);
}

function constraintReview(missingKinds, sourceModel, targetModel, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Ownership constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceModel.hasExclusiveBorrow && !targetModel.hasExclusiveBorrow ? ['Source exclusive borrow constraints are not represented in the target graph.'] : []),
    ...(sourceModel.hasCallArgumentTransfer && !targetModel.hasCallArgumentTransfer ? ['Source call-argument ownership transfers are not represented in the target graph.'] : []),
    ...(sourceModel.hasReturnTransfer && !targetModel.hasReturnTransfer ? ['Source return ownership transfers are not represented in the target graph.'] : []),
    ...(sourceModel.dropKinds.length && !targetModel.dropKinds.length ? ['Source drop-order constraints are not represented in the target graph.'] : []),
    ...(input.review ?? [])
  ]);
}

function constraintStatus(input) {
  if (!input.sourceSummary.records && !input.targetSummary.records) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetSummary.records ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function constraintAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-ownership-constraint-evidence';
  if (status === 'degraded') return 'review-ownership-constraint-loss';
  if (status === 'satisfied') return 'attach-ownership-constraint-record';
  return 'skip';
}

function constraintSide(role, graph, summary, model) {
  return { role, graphId: graph?.id, sourceLanguage: graph?.sourceLanguage, sourcePath: graph?.sourcePath, sourceHash: graph?.sourceHash, status: graph?.status, summary, model };
}

function constraintRecord(kind, sourceModel, targetModel, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    source: valuesForConstraint(kind, sourceModel),
    target: valuesForConstraint(kind, targetModel),
    severity: ['exclusive-borrow', 'unsafe-boundary-proof', 'raw-access-boundary', 'call-argument-ownership-transfer', 'return-ownership-transfer'].includes(kind) ? 'error' : 'warning'
  };
}

function valuesForConstraint(kind, model) {
  if (kind.endsWith('borrow')) return model.loanModes;
  if (kind === 'alias-control') return model.aliasKinds;
  if (kind === 'move-invalidates-source' || kind.includes('ownership-transfer')) return model.moveKinds;
  if (kind === 'drop-order') return model.dropKinds;
  if (kind === 'lifetime-bound') return model.lifetimeKinds;
  if (kind.includes('unsafe') || kind.includes('raw')) return model.unsafeBoundaryKinds;
  return model.ownerKinds;
}

function firstGraph(...graphs) {
  return graphs.flat().find((graph) => graph && typeof graph === 'object');
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
