import { idFragment, uniqueStrings } from './native-import-utils.js';
import { createUniversalBorrowScopeConstraintEvidence, borrowScopeConstraintMatches } from './universal-borrow-scope-constraints.js';
import { createUniversalLifetimeConstraintEvidence, lifetimeConstraintMatches } from './universal-lifetime-constraints.js';
import { createUniversalResourceTransferEvidence, resourceTransferMatches } from './universal-resource-transfer.js';

export const UniversalBorrowCheckerConstraintStatuses = Object.freeze([
  'not-applicable',
  'preserved',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalBorrowCheckerConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceGraph = firstGraph(input.sourceGraph, input.sourceResourceGraph, ...(input.sourceGraphs ?? []));
  const targetGraph = firstGraph(input.targetGraph, input.targetResourceGraph, ...(input.targetGraphs ?? []));
  const resourceTransfer = evidenceOrCreate(input.resourceTransfer ?? input.translationResourceTransfer, 'frontier.lang.universalResourceTransferEvidence', () => createUniversalResourceTransferEvidence({
    ...input,
    route,
    routeId: input.routeId ?? route.id,
    sourceGraphs: sourceGraph ? [sourceGraph] : input.sourceGraphs,
    targetGraphs: targetGraph ? [targetGraph] : input.targetGraphs
  }));
  const lifetimeConstraint = evidenceOrCreate(input.lifetimeConstraint ?? input.translationLifetimeConstraint, 'frontier.lang.universalLifetimeConstraintEvidence', () => createUniversalLifetimeConstraintEvidence({
    ...input,
    route,
    routeId: input.routeId ?? route.id,
    sourceGraphs: sourceGraph ? [sourceGraph] : input.sourceGraphs,
    targetGraphs: targetGraph ? [targetGraph] : input.targetGraphs
  }));
  const borrowScopeConstraint = evidenceOrCreate(input.borrowScopeConstraint ?? input.translationBorrowScopeConstraint, 'frontier.lang.universalBorrowScopeConstraintEvidence', () => createUniversalBorrowScopeConstraintEvidence({
    ...input,
    route,
    routeId: input.routeId ?? route.id,
    sourceBorrowScopes: uniqueRecords([...(input.sourceBorrowScopes ?? []), ...(sourceGraph?.borrowScopes ?? [])]),
    targetBorrowScopes: uniqueRecords([...(input.targetBorrowScopes ?? []), ...(targetGraph?.borrowScopes ?? [])]),
    ownershipConstraint: input.ownershipConstraint ?? resourceTransfer?.ownershipConstraints,
    lifetimeConstraint,
    controlFlowConstraint: input.controlFlowConstraint
  }));
  const ownershipConstraint = input.ownershipConstraint ?? resourceTransfer?.ownershipConstraints;
  const components = componentRecords({ resourceTransfer, ownershipConstraint, lifetimeConstraint, borrowScopeConstraint });
  const active = components.filter((component) => component.applicable);
  const missingEvidence = uniqueStrings([
    ...active.flatMap((component) => component.missingEvidence),
    ...(input.missingEvidence ?? [])
  ]);
  const blockers = uniqueStrings([
    ...active.flatMap((component) => component.blockers),
    ...(input.blockers ?? [])
  ]);
  const status = checkerStatus(active, missingEvidence, blockers);
  return {
    kind: 'frontier.lang.universalBorrowCheckerConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalBorrowCheckerConstraintEvidence.v1',
    id: input.id ?? `borrow_checker_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: checkerAction(status),
    requiredFamilies: uniqueStrings(active.map((component) => component.family)),
    missingFamilies: uniqueStrings(active.filter((component) => !component.preserved).map((component) => component.family)),
    requiredKinds: uniqueStrings(active.flatMap((component) => component.requiredKinds.map((kind) => `${component.family}:${kind}`))),
    representedKinds: uniqueStrings(active.flatMap((component) => component.representedKinds.map((kind) => `${component.family}:${kind}`))),
    missingKinds: uniqueStrings(active.flatMap((component) => component.missingKinds.map((kind) => `${component.family}:${kind}`))),
    missingEvidence,
    blockers,
    review: uniqueStrings([
      ...active.flatMap((component) => component.review),
      ...(input.review ?? [])
    ]),
    components,
    evidenceIds: uniqueStrings([
      ...(input.evidenceIds ?? []),
      ...active.flatMap((component) => component.evidenceIds)
    ]),
    claims: {
      borrowCheckerClaim: false,
      ownershipSoundnessClaim: false,
      lifetimeSoundnessClaim: false,
      aliasSafetyClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Borrow-checker constraints compose ownership, resource-transfer, lifetime, and borrow-scope evidence. They record preservation or proof gaps; they do not claim the target language has a borrow checker.',
      ...(input.metadata ?? {})
    }
  };
}

export function borrowCheckerConstraintMatches(evidence = {}, query = {}) {
  return match(query.borrowCheckerConstraintStatus, [evidence.status])
    && match(query.borrowCheckerConstraintAction, [evidence.action])
    && match(query.borrowCheckerConstraintRequiredFamily, evidence.requiredFamilies)
    && match(query.borrowCheckerConstraintMissingFamily, evidence.missingFamilies)
    && match(query.borrowCheckerConstraintRequiredKind, evidence.requiredKinds)
    && match(query.borrowCheckerConstraintRepresentedKind, evidence.representedKinds)
    && match(query.borrowCheckerConstraintMissingKind, evidence.missingKinds)
    && match(query.borrowCheckerConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.borrowCheckerConstraintEvidenceId, evidence.evidenceIds)
    && resourceTransferMatches(evidence.components?.find((record) => record.family === 'resource-transfer')?.evidence, query)
    && lifetimeConstraintMatches(evidence.components?.find((record) => record.family === 'lifetime')?.evidence, query)
    && borrowScopeConstraintMatches(evidence.components?.find((record) => record.family === 'borrow-scope')?.evidence, query);
}

export function borrowCheckerConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = [], constraints = {}) {
  const explicit = matchingBorrowCheckerInput(input, route, routeEvidence);
  const sourceGraphs = uniqueRecords([
    ...(explicit?.sourceGraphs ?? []),
    explicit?.sourceGraph,
    explicit?.sourceResourceGraph,
    ...routeImports.flatMap(resourceGraphsFromImport),
    ...routeEvidence.flatMap((record) => resourceGraphsFromEvidence(record, 'source'))
  ]);
  const targetGraphs = uniqueRecords([
    ...(explicit?.targetGraphs ?? []),
    explicit?.targetGraph,
    explicit?.targetResourceGraph,
    ...routeEvidence.flatMap((record) => resourceGraphsFromEvidence(record, 'target'))
  ]);
  const hasConstraints = constraints.resourceTransfer || constraints.lifetimeConstraint || constraints.borrowScopeConstraint || constraints.controlFlowConstraint;
  if (!explicit && !sourceGraphs.length && !targetGraphs.length && !hasConstraints) return undefined;
  return createUniversalBorrowCheckerConstraintEvidence({
    ...explicit,
    route,
    routeId: route.id,
    sourceLanguage: route.sourceLanguage,
    target: route.target,
    mode: route.mode,
    sourceGraphs,
    targetGraphs,
    resourceTransfer: constraints.resourceTransfer,
    ownershipConstraint: constraints.resourceTransfer?.ownershipConstraints,
    lifetimeConstraint: constraints.lifetimeConstraint,
    borrowScopeConstraint: constraints.borrowScopeConstraint,
    controlFlowConstraint: constraints.controlFlowConstraint,
    evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean)
  });
}

function componentRecords(records) {
  return [
    componentRecord('resource-transfer', records.resourceTransfer, 'preserved'),
    componentRecord('ownership', records.ownershipConstraint, 'satisfied'),
    componentRecord('lifetime', records.lifetimeConstraint, 'satisfied'),
    componentRecord('borrow-scope', records.borrowScopeConstraint, 'satisfied')
  ];
}

function componentRecord(family, evidence = {}, preservedStatus) {
  const requiredKinds = evidence.requiredKinds ?? [];
  const representedKinds = evidence.representedKinds ?? [];
  const missingKinds = evidence.missingKinds ?? [];
  const status = evidence.status ?? 'not-applicable';
  return {
    family,
    id: evidence.id,
    status,
    action: evidence.action,
    applicable: status !== 'not-applicable' || requiredKinds.length > 0 || missingKinds.length > 0,
    preserved: status === preservedStatus || status === 'not-applicable',
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence: evidence.missingEvidence ?? [],
    blockers: evidence.blockers ?? [],
    review: evidence.review ?? [],
    evidenceIds: evidence.evidenceIds ?? [],
    evidence
  };
}

function checkerStatus(active, missingEvidence, blockers) {
  if (!active.length) return 'not-applicable';
  if (blockers.length || active.some((component) => component.status === 'blocked')) return 'blocked';
  if (!missingEvidence.length && active.every((component) => component.preserved)) return 'preserved';
  if (active.some((component) => component.status === 'needs-evidence')) return 'needs-evidence';
  return missingEvidence.length ? 'degraded' : 'preserved';
}

function checkerAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-borrow-checker-evidence';
  if (status === 'degraded') return 'review-borrow-checker-loss';
  if (status === 'preserved') return 'attach-borrow-checker-record';
  return 'skip';
}

function evidenceOrCreate(candidate, kind, create) {
  return candidate?.kind === kind ? candidate : create();
}

function matchingBorrowCheckerInput(input, route, routeEvidence) {
  const candidates = [input.borrowCheckerConstraint, input.translationBorrowCheckerConstraint, ...(input.borrowCheckerConstraints ?? []), ...routeEvidence.map((record) => record?.borrowCheckerConstraint ?? record?.translationBorrowCheckerConstraint)].filter(Boolean);
  return candidates.find((record) => matchesRoute(record, route));
}

function matchesRoute(record, route) {
  return (!record.sourceLanguage || String(record.sourceLanguage).toLowerCase() === String(route.sourceLanguage).toLowerCase())
    && (!record.target || String(record.target).toLowerCase() === String(route.target).toLowerCase());
}

function resourceGraphsFromImport(imported) {
  return [imported?.resourceGraph, imported?.semanticResourceGraph, imported?.universalAst?.resourceGraph, imported?.universalAst?.semanticResourceGraph].filter(Boolean);
}

function resourceGraphsFromEvidence(record, role) {
  return [record?.[`${role}Graph`], record?.[`${role}ResourceGraph`], record?.resourceGraph, record?.semanticResourceGraph].filter(Boolean);
}

function firstGraph(...graphs) {
  return graphs.flat().find((graph) => graph && typeof graph === 'object');
}

function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? record.graphId ?? record.sourceHash ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
