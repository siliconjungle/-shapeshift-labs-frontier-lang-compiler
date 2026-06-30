import { idFragment, uniqueStrings } from './native-import-utils.js';
import { summarizeSemanticResourceGraph } from './semantic-resource-graph.js';

export const UniversalLifetimeConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalLifetimeConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceGraph = firstGraph(input.sourceGraph, input.sourceResourceGraph, ...(input.sourceGraphs ?? []));
  const targetGraph = firstGraph(input.targetGraph, input.targetResourceGraph, ...(input.targetGraphs ?? []));
  const sourceSummary = summarize(sourceGraph);
  const targetSummary = summarize(targetGraph);
  const sourceModel = lifetimeModel(sourceGraph, input.sourceLifetimeConstraints ?? input.sourceConstraints ?? []);
  const targetModel = lifetimeModel(targetGraph, input.targetLifetimeConstraints ?? input.targetConstraints ?? []);
  const requiredKinds = requiredLifetimeKinds(sourceModel, sourceSummary);
  const representedKinds = representedLifetimeKinds(requiredKinds, targetModel, targetSummary, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = lifetimeMissingEvidence(missingKinds, sourceSummary, targetSummary, input);
  const blockers = lifetimeBlockers(sourceSummary, targetSummary, input);
  const review = lifetimeReview(missingKinds, sourceModel, targetModel, input);
  const status = lifetimeStatus({ sourceSummary, targetSummary, sourceModel, targetModel, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalLifetimeConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalLifetimeConstraintEvidence.v1',
    id: input.id ?? `lifetime_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: lifetimeAction(status),
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
    source: lifetimeSide('source', sourceGraph, sourceSummary, sourceModel),
    targetSide: lifetimeSide('target', targetGraph, targetSummary, targetModel),
    constraints: requiredKinds.map((kind) => lifetimeConstraintRecord(kind, sourceModel, targetModel, representedKinds)),
    claims: {
      borrowCheckerClaim: false,
      lifetimeSoundnessClaim: false,
      escapeSafetyClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Lifetime constraints model borrow-region and escape/drop obligations as admission evidence. They do not prove a target borrow checker exists or accepts the program.',
      ...(input.metadata ?? {})
    }
  };
}

export function lifetimeConstraintMatches(evidence = {}, query = {}) {
  return match(query.lifetimeConstraintStatus, [evidence.status])
    && match(query.lifetimeConstraintAction, [evidence.action])
    && match(query.lifetimeConstraintRequiredKind, evidence.requiredKinds)
    && match(query.lifetimeConstraintRepresentedKind, evidence.representedKinds)
    && match(query.lifetimeConstraintMissingKind, evidence.missingKinds)
    && match(query.lifetimeConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.lifetimeConstraintEvidenceId, evidence.evidenceIds);
}

export function lifetimeConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingLifetimeInput(input, route, routeEvidence);
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
  return createUniversalLifetimeConstraintEvidence({
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

function summarize(graph) {
  if (!graph) return { records: 0, resources: 0, owners: 0, loans: 0, aliases: 0, moves: 0, drops: 0, lifetimeRegions: 0, unsafeBoundaries: 0, conflicts: 0, proofObligations: 0, unsafeBoundariesWithoutProof: 0, reasonCodes: ['missing-resource-graph'] };
  return graph.summary ?? summarizeSemanticResourceGraph(graph);
}

function lifetimeModel(graph = {}, explicit = []) {
  const lifetimeRegions = [...(graph.lifetimeRegions ?? []), ...explicit.filter((record) => record?.kind === 'lifetime-region' || record?.constraintKind === 'lifetime-region')];
  const loans = graph.loans ?? [];
  const aliases = graph.aliases ?? [];
  const drops = graph.drops ?? [];
  const moves = graph.moves ?? [];
  const escapes = graph.escapes ?? [];
  const unsafeBoundaries = graph.unsafeBoundaries ?? [];
  const explicitKinds = uniqueStrings(explicit.flatMap((record) => lifetimeKindsForRecord(record)));
  return {
    lifetimeKinds: uniqueStrings(lifetimeRegions.map((record) => record.lifetimeKind ?? record.kind ?? record.constraintKind)),
    loanModes: uniqueStrings(loans.map((record) => record.mode)),
    loanRegionIds: uniqueStrings(loans.map((record) => record.lifetimeRegionId)),
    aliasRegionIds: uniqueStrings(aliases.map((record) => record.lifetimeRegionId)),
    dropRegionIds: uniqueStrings(drops.map((record) => record.lifetimeRegionId)),
    moveRegionIds: uniqueStrings(moves.map((record) => record.lifetimeRegionId)),
    outlivesRelations: uniqueStrings([...(graph.outlives ?? []), ...(graph.lifetimeRelations ?? [])].map((record) => relationKey(record))),
    escapeRecords: uniqueStrings([...escapes, ...explicit.filter((record) => /escape/i.test(String(record?.kind ?? record?.constraintKind ?? '')))].map((record) => record.id ?? record.resourceId ?? record.name ?? record.kind)),
    unsafeBoundaryKinds: uniqueStrings(unsafeBoundaries.map((record) => record.kind ?? record.metadata?.proofGapCode ?? 'unsafe-boundary')),
    explicitKinds,
    hasLifetimeRegion: lifetimeRegions.length > 0,
    hasLoanRegions: loans.some((record) => record.lifetimeRegionId),
    hasAliasRegions: aliases.some((record) => record.lifetimeRegionId),
    hasDropRegions: drops.some((record) => record.lifetimeRegionId),
    hasMoveRegions: moves.some((record) => record.lifetimeRegionId),
    hasOutlives: (graph.outlives ?? []).length > 0 || (graph.lifetimeRelations ?? []).length > 0 || explicitKinds.includes('outlives-relation'),
    hasEscapes: escapes.length > 0 || explicitKinds.includes('no-escape') || explicitKinds.includes('escape-proof'),
    hasUnsafeLifetime: unsafeBoundaries.length > 0 || explicitKinds.includes('unsafe-lifetime-proof')
  };
}

function lifetimeKindsForRecord(record = {}) {
  const tokens = uniqueStrings([
    record.kind,
    record.constraintKind,
    record.lifetimeKind,
    record.regionKind,
    record.predicate,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? [])
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap((token) => {
    if (/lifetime|region|scope/.test(token)) return ['lifetime-region'];
    if (/loan|borrow/.test(token)) return ['loan-region-binding'];
    if (/alias|reference/.test(token)) return ['alias-region-binding'];
    if (/drop|cleanup|dispose|finalize/.test(token)) return ['drop-region-bound'];
    if (/move|transfer/.test(token)) return ['move-region-bound'];
    if (/outlives|subregion/.test(token)) return ['outlives-relation'];
    if (/escape|leak/.test(token)) return ['no-escape'];
    if (/unsafe|raw/.test(token)) return ['unsafe-lifetime-proof'];
    return [];
  }));
}

function requiredLifetimeKinds(model, summary) {
  return uniqueStrings([
    ...(summary.lifetimeRegions || model.hasLifetimeRegion ? ['lifetime-region'] : []),
    ...(model.hasLoanRegions ? ['loan-region-binding'] : []),
    ...(model.hasAliasRegions ? ['alias-region-binding'] : []),
    ...(model.hasDropRegions ? ['drop-region-bound'] : []),
    ...(model.hasMoveRegions ? ['move-region-bound'] : []),
    ...(model.hasOutlives ? ['outlives-relation'] : []),
    ...(model.hasEscapes ? ['no-escape'] : []),
    ...(model.hasUnsafeLifetime ? ['unsafe-lifetime-proof'] : [])
  ]);
}

function representedLifetimeKinds(requiredKinds, model, summary, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  return requiredKinds.filter((kind) => {
    if (kind === 'lifetime-region') return summary.lifetimeRegions > 0 || model.hasLifetimeRegion;
    if (kind === 'loan-region-binding') return model.hasLoanRegions;
    if (kind === 'alias-region-binding') return model.hasAliasRegions;
    if (kind === 'drop-region-bound') return model.hasDropRegions;
    if (kind === 'move-region-bound') return model.hasMoveRegions;
    if (kind === 'outlives-relation') return model.hasOutlives;
    if (kind === 'no-escape') return model.hasEscapes;
    if (kind === 'unsafe-lifetime-proof') return model.hasUnsafeLifetime && summary.unsafeBoundariesWithoutProof === 0;
    return false;
  });
}

function lifetimeMissingEvidence(missingKinds, sourceSummary, targetSummary, input) {
  if (!sourceSummary.records && !(input.sourceLifetimeConstraints ?? input.sourceConstraints ?? []).length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetSummary.records || preserveSource ? [] : ['translation-lifetime-constraint-target-graph']),
    ...(missingKinds.length ? ['translation-lifetime-constraint-proof'] : []),
    ...(missingKinds.map((kind) => `translation-lifetime-constraint:${kind}`)),
    ...(sourceSummary.unsafeBoundariesWithoutProof || targetSummary.unsafeBoundariesWithoutProof ? ['translation-lifetime-unsafe-proof'] : []),
    ...(input.missingEvidence ?? [])
  ]);
}

function lifetimeBlockers(sourceSummary, targetSummary, input) {
  return uniqueStrings([
    ...(sourceSummary.conflicts ? ['Source lifetime/resource graph has unresolved conflicts.'] : []),
    ...(targetSummary.conflicts ? ['Target lifetime/resource graph has unresolved conflicts.'] : []),
    ...(sourceSummary.unsafeBoundariesWithoutProof ? ['Source unsafe lifetime proof is missing.'] : []),
    ...(targetSummary.unsafeBoundariesWithoutProof ? ['Target unsafe lifetime proof is missing.'] : []),
    ...(input.blockers ?? [])
  ]);
}

function lifetimeReview(missingKinds, sourceModel, targetModel, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Lifetime constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceModel.hasLoanRegions && !targetModel.hasLoanRegions ? ['Source borrow regions are not represented in the target graph.'] : []),
    ...(sourceModel.hasDropRegions && !targetModel.hasDropRegions ? ['Source drop bounds are not represented in the target graph.'] : []),
    ...(sourceModel.hasEscapes && !targetModel.hasEscapes ? ['Source no-escape constraints are not represented in the target graph.'] : []),
    ...(input.review ?? [])
  ]);
}

function lifetimeStatus(input) {
  if (!input.sourceSummary.records && !input.targetSummary.records && !input.sourceModel.explicitKinds.length && !input.targetModel.explicitKinds.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetSummary.records || input.targetModel.explicitKinds.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function lifetimeAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-lifetime-constraint-evidence';
  if (status === 'degraded') return 'review-lifetime-constraint-loss';
  if (status === 'satisfied') return 'attach-lifetime-constraint-record';
  return 'skip';
}

function lifetimeSide(role, graph, summary, model) {
  return { role, graphId: graph?.id, sourceLanguage: graph?.sourceLanguage, sourcePath: graph?.sourcePath, sourceHash: graph?.sourceHash, status: graph?.status, summary, model };
}

function lifetimeConstraintRecord(kind, sourceModel, targetModel, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    source: lifetimeValuesForKind(kind, sourceModel),
    target: lifetimeValuesForKind(kind, targetModel),
    severity: ['loan-region-binding', 'no-escape', 'unsafe-lifetime-proof'].includes(kind) ? 'error' : 'warning'
  };
}

function lifetimeValuesForKind(kind, model) {
  if (kind === 'lifetime-region') return model.lifetimeKinds;
  if (kind === 'loan-region-binding') return model.loanRegionIds.length ? model.loanRegionIds : model.loanModes;
  if (kind === 'alias-region-binding') return model.aliasRegionIds;
  if (kind === 'drop-region-bound') return model.dropRegionIds;
  if (kind === 'move-region-bound') return model.moveRegionIds;
  if (kind === 'outlives-relation') return model.outlivesRelations;
  if (kind === 'no-escape') return model.escapeRecords;
  if (kind === 'unsafe-lifetime-proof') return model.unsafeBoundaryKinds;
  return model.explicitKinds;
}

function matchingLifetimeInput(input, route, routeEvidence) {
  const candidates = [input.lifetimeConstraint, input.translationLifetimeConstraint, ...(input.lifetimeConstraints ?? []), ...routeEvidence.map((record) => record?.lifetimeConstraint ?? record?.translationLifetimeConstraint)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function resourceGraphsFromImport(imported) {
  return uniqueGraphs([imported?.resourceGraph, imported?.semanticResourceGraph, imported?.universalAst?.resourceGraph, imported?.universalAst?.semanticResourceGraph, imported?.metadata?.resourceGraph]);
}

function resourceGraphsFromEvidence(record, role) {
  const direct = role === 'source' ? [record?.sourceResourceGraph, record?.sourceGraph] : [record?.targetResourceGraph, record?.targetGraph];
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

function firstGraph(...graphs) {
  return graphs.flat().find((graph) => graph && typeof graph === 'object');
}

function relationKey(record = {}) {
  return record.id ?? `${record.shorter ?? record.from ?? record.source ?? 'source'}>${record.longer ?? record.to ?? record.target ?? 'target'}`;
}

function routeMatch(candidate, route) {
  return (!candidate.routeId || candidate.routeId === route.id)
    && (!candidate.sourceLanguage || candidate.sourceLanguage === route.sourceLanguage)
    && (!candidate.target || candidate.target === route.target);
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
