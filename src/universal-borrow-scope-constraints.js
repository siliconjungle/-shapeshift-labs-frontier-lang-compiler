import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalBorrowScopeConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalBorrowScopeConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const ownership = input.ownershipConstraint ?? input.resourceTransfer?.ownershipConstraints;
  const lifetime = input.lifetimeConstraint;
  const controlFlow = input.controlFlowConstraint;
  const sourceScopes = normalizeScopeRecords('source', [
    ...(input.sourceBorrowScopes ?? []),
    ...(input.borrowScopes ?? []),
    ...(input.imports ?? []).flatMap(scopeRecordsFromImport)
  ]);
  const targetScopes = normalizeScopeRecords('target', input.targetBorrowScopes ?? []);
  const sourceModel = scopeModel(sourceScopes, ownership, lifetime, controlFlow);
  const targetModel = scopeModel(targetScopes, input.targetOwnershipConstraint, input.targetLifetimeConstraint, input.targetControlFlowConstraint);
  const requiredKinds = requiredScopeKinds(sourceModel);
  const representedKinds = representedScopeKinds(requiredKinds, targetModel, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = scopeMissingEvidence(missingKinds, sourceModel, targetModel, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = scopeReview(missingKinds, sourceModel, targetModel, input);
  const status = scopeStatus({ sourceModel, targetModel, missingEvidence, blockers, requiredKinds });
  return {
    kind: 'frontier.lang.universalBorrowScopeConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalBorrowScopeConstraintEvidence.v1',
    id: input.id ?? `borrow_scope_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: scopeAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    source: { role: 'source', scopes: sourceScopes, model: sourceModel },
    targetSide: { role: 'target', scopes: targetScopes, model: targetModel },
    constraints: requiredKinds.map((kind) => scopeConstraintRecord(kind, sourceScopes, targetScopes, representedKinds)),
    evidenceIds: uniqueStrings([
      ...(input.evidenceIds ?? []),
      ...sourceScopes.flatMap((record) => record.evidenceIds ?? []),
      ...targetScopes.flatMap((record) => record.evidenceIds ?? [])
    ]),
    claims: {
      borrowCheckerClaim: false,
      flowSensitiveLifetimeClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Borrow-scope constraints join ownership, lifetime, and control-flow evidence. They model flow-sensitive proof obligations; they do not prove a target borrow checker accepted the program.',
      ...(input.metadata ?? {})
    }
  };
}

export function borrowScopeConstraintMatches(evidence = {}, query = {}) {
  return match(query.borrowScopeConstraintStatus, [evidence.status])
    && match(query.borrowScopeConstraintAction, [evidence.action])
    && match(query.borrowScopeConstraintRequiredKind, evidence.requiredKinds)
    && match(query.borrowScopeConstraintRepresentedKind, evidence.representedKinds)
    && match(query.borrowScopeConstraintMissingKind, evidence.missingKinds)
    && match(query.borrowScopeConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.borrowScopeConstraintEvidenceId, evidence.evidenceIds);
}

export function borrowScopeConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = [], constraints = {}) {
  const explicit = matchingBorrowScopeInput(input, route, routeEvidence);
  const sourceBorrowScopes = [...(explicit?.sourceBorrowScopes ?? []), ...(explicit?.borrowScopes ?? []), ...routeImports.flatMap(scopeRecordsFromImport)];
  const targetBorrowScopes = [...(explicit?.targetBorrowScopes ?? [])];
  const hasConstraintEvidence = constraints.ownershipConstraint || constraints.lifetimeConstraint || constraints.controlFlowConstraint;
  if (!explicit && !sourceBorrowScopes.length && !targetBorrowScopes.length && !hasConstraintEvidence) return undefined;
  return createUniversalBorrowScopeConstraintEvidence({
    ...explicit,
    route,
    routeId: route.id,
    sourceLanguage: route.sourceLanguage,
    target: route.target,
    mode: route.mode,
    imports: routeImports,
    sourceBorrowScopes,
    targetBorrowScopes,
    ownershipConstraint: constraints.ownershipConstraint,
    lifetimeConstraint: constraints.lifetimeConstraint,
    controlFlowConstraint: constraints.controlFlowConstraint,
    evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean)
  });
}

function normalizeScopeRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = borrowScopeKindsForRecord(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_borrow_scope_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      scopeKind: record?.scopeKind ?? record?.kind ?? record?.constraintKind,
      ownershipKind: record?.ownershipKind,
      lifetimeKind: record?.lifetimeKind,
      controlFlowKind: record?.controlFlowKind ?? record?.flowKind,
      sourceControlFlowId: record?.sourceControlFlowId ?? record?.flowId,
      lifetimeRegionId: record?.lifetimeRegionId ?? record?.regionId,
      resourceId: record?.resourceId,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function scopeModel(scopes, ownership = {}, lifetime = {}, controlFlow = {}) {
  const ownershipKinds = uniqueStrings([...(ownership.requiredKinds ?? []), ...(ownership.representedKinds ?? [])]);
  const lifetimeKinds = uniqueStrings([...(lifetime.requiredKinds ?? []), ...(lifetime.representedKinds ?? [])]);
  const flowKinds = uniqueStrings([...(controlFlow.requiredKinds ?? []), ...(controlFlow.representedKinds ?? [])]);
  const scopeKinds = uniqueStrings(scopes.flatMap((record) => record.constraintKinds));
  const hasSharedBorrow = scopeKinds.includes('shared-borrow-compatible') || ownershipKinds.includes('shared-borrow');
  const hasExclusiveAliasExclusion = scopeKinds.includes('exclusive-borrow-alias-exclusion');
  const hasExclusiveLoanExclusion = scopeKinds.includes('exclusive-borrow-loan-exclusion');
  const hasBorrow = ownershipKinds.some((kind) => /borrow|alias|owner/.test(kind)) || lifetimeKinds.some((kind) => /loan|alias|lifetime|region/.test(kind));
  const hasExclusive = ownershipKinds.includes('exclusive-borrow') || hasExclusiveAliasExclusion || hasExclusiveLoanExclusion;
  const hasMove = ownershipKinds.includes('move-invalidates-source') || lifetimeKinds.includes('move-region-bound');
  const hasDrop = ownershipKinds.includes('drop-order') || lifetimeKinds.includes('drop-region-bound');
  const hasNoEscape = lifetimeKinds.includes('no-escape');
  const hasUnsafe = ownershipKinds.some((kind) => /unsafe|raw/.test(kind)) || lifetimeKinds.includes('unsafe-lifetime-proof');
  const hasBranch = flowKinds.some((kind) => /branch|switch|pattern|loop|control-dependency/.test(kind));
  const hasAsync = flowKinds.some((kind) => /async|await|generator/.test(kind));
  const hasExit = flowKinds.some((kind) => /return|exit|exception|cancellation|finally|non-local/.test(kind));
  const hasConcurrency = flowKinds.includes('concurrency-order');
  return { scopeKinds, ownershipKinds, lifetimeKinds, flowKinds, hasBorrow, hasSharedBorrow, hasExclusive, hasExclusiveAliasExclusion, hasExclusiveLoanExclusion, hasMove, hasDrop, hasNoEscape, hasUnsafe, hasBranch, hasAsync, hasExit, hasConcurrency };
}

function requiredScopeKinds(model) {
  return uniqueStrings([
    ...model.scopeKinds,
    ...(model.hasSharedBorrow ? ['shared-borrow-compatible'] : []),
    ...(model.hasExclusive ? ['exclusive-borrow-alias-exclusion', 'exclusive-borrow-loan-exclusion'] : []),
    ...(model.hasBorrow ? ['loan-scope-boundary'] : []),
    ...(model.hasExclusive && model.hasBranch ? ['exclusive-borrow-branch-join'] : []),
    ...(model.hasBorrow && model.hasAsync ? ['borrow-across-await'] : []),
    ...(model.hasDrop && model.hasExit ? ['drop-cleanup-order'] : []),
    ...(model.hasMove && model.hasExit ? ['move-invalidates-exit'] : []),
    ...(model.hasNoEscape && (model.hasAsync || model.hasExit) ? ['no-escape-flow'] : []),
    ...(model.hasUnsafe && model.flowKinds.length ? ['unsafe-boundary-flow-proof'] : []),
    ...((model.hasExclusive || model.ownershipKinds.includes('alias-control')) && model.hasConcurrency ? ['concurrency-alias-proof'] : [])
  ]);
}

function representedScopeKinds(requiredKinds, targetModel, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  return requiredKinds.filter((kind) => targetModel.scopeKinds.includes(kind));
}

function scopeMissingEvidence(missingKinds, sourceModel, targetModel, input) {
  if (!sourceModel.scopeKinds.length && !sourceModel.hasBorrow && !sourceModel.lifetimeKinds.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(sourceModel.hasBorrow && !sourceModel.flowKinds.length ? ['translation-borrow-scope-control-flow-evidence'] : []),
    ...(targetModel.scopeKinds.length || preserveSource ? [] : ['translation-borrow-scope-target-evidence']),
    ...(missingKinds.length ? ['translation-borrow-scope-proof'] : []),
    ...(missingKinds.map((kind) => `translation-borrow-scope:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function scopeReview(missingKinds, sourceModel, targetModel, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Borrow-scope constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceModel.hasSharedBorrow && !targetModel.scopeKinds.includes('shared-borrow-compatible') ? ['Source shared-borrow compatibility is not represented in the target graph.'] : []),
    ...(sourceModel.hasExclusiveAliasExclusion && !targetModel.scopeKinds.includes('exclusive-borrow-alias-exclusion') ? ['Source mutable borrow alias exclusion is not represented in the target graph.'] : []),
    ...(sourceModel.hasExclusiveLoanExclusion && !targetModel.scopeKinds.includes('exclusive-borrow-loan-exclusion') ? ['Source mutable borrow loan exclusion is not represented in the target graph.'] : []),
    ...(sourceModel.hasBorrow && sourceModel.hasAsync && !targetModel.scopeKinds.includes('borrow-across-await') ? ['Borrow/lifetime obligations cross async or generator suspension without target scope proof.'] : []),
    ...(sourceModel.hasDrop && sourceModel.hasExit && !targetModel.scopeKinds.includes('drop-cleanup-order') ? ['Drop or cleanup order crosses non-linear exit flow without target scope proof.'] : []),
    ...(input.review ?? [])
  ]);
}

function scopeStatus(input) {
  if (!input.requiredKinds.length && !input.sourceModel.scopeKinds.length && !input.targetModel.scopeKinds.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetModel.scopeKinds.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function scopeAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-borrow-scope-constraint-evidence';
  if (status === 'degraded') return 'review-borrow-scope-constraint-loss';
  if (status === 'satisfied') return 'attach-borrow-scope-constraint-record';
  return 'skip';
}

function scopeConstraintRecord(kind, sourceScopes, targetScopes, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceBorrowScopeIds: sourceScopes.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetBorrowScopeIds: targetScopes.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['exclusive-borrow-alias-exclusion', 'exclusive-borrow-loan-exclusion', 'borrow-across-await', 'drop-cleanup-order', 'move-invalidates-exit', 'unsafe-boundary-flow-proof'].includes(kind) ? 'error' : 'warning'
  };
}

function scopeRecordsFromImport(imported) {
  return [
    ...(imported?.borrowScopeConstraints ?? []),
    ...(imported?.borrowScopes ?? []),
    ...(imported?.borrowScopeRegions ?? []),
    ...(imported?.resourceGraph?.borrowScopes ?? []),
    ...(imported?.resourceGraph?.borrowScopeRegions ?? []),
    ...(imported?.semanticResourceGraph?.borrowScopes ?? []),
    ...(imported?.semanticResourceGraph?.borrowScopeRegions ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(scopeLikeRecord)
  ];
}

function scopeLikeRecord(record = {}) {
  const token = String([record.kind, record.constraintKind, record.scopeKind, record.predicate, record.flowKind].filter(Boolean).join(' ')).toLowerCase();
  return /borrow|loan|lifetime|region|scope|drop|move|escape|unsafe|await|async|branch|return|throw|cleanup|concurrency/.test(token);
}

function borrowScopeKindsForRecord(record = {}) {
  const tokens = uniqueStrings([
    record.kind,
    record.constraintKind,
    record.scopeKind,
    record.predicate,
    record.ownershipKind,
    record.lifetimeKind,
    record.controlFlowKind,
    record.flowKind,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? [])
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(scopeKindForToken));
}

function scopeKindForToken(token) {
  if (/shared-borrow-compatible|shared.*borrow.*compat/.test(token)) return ['shared-borrow-compatible'];
  if (/exclusive-borrow-alias-exclusion|exclusive.*alias.*exclusion|mutable.*alias.*exclusion/.test(token)) return ['exclusive-borrow-alias-exclusion'];
  if (/exclusive-borrow-loan-exclusion|exclusive.*loan.*exclusion|mutable.*borrow.*overlap/.test(token)) return ['exclusive-borrow-loan-exclusion'];
  if (/borrow-across-await|await-borrow|async-borrow|suspension-borrow/.test(token)) return ['borrow-across-await'];
  if (/exclusive.*branch|branch.*exclusive|join.*borrow/.test(token)) return ['exclusive-borrow-branch-join'];
  if (/drop.*cleanup|cleanup.*drop|finally|defer/.test(token)) return ['drop-cleanup-order'];
  if (/move.*exit|exit.*move|return.*move|throw.*move/.test(token)) return ['move-invalidates-exit'];
  if (/no-escape|escape-flow|closure-escape|generator-escape/.test(token)) return ['no-escape-flow'];
  if (/unsafe.*flow|raw.*flow|unsafe-boundary/.test(token)) return ['unsafe-boundary-flow-proof'];
  if (/concurrency.*alias|alias.*concurrency|race|atomic|thread/.test(token)) return ['concurrency-alias-proof'];
  if (/loan|borrow|lifetime|region|scope/.test(token)) return ['loan-scope-boundary'];
  return [];
}

function matchingBorrowScopeInput(input, route, routeEvidence) {
  const candidates = [input.borrowScopeConstraint, input.translationBorrowScopeConstraint, ...(input.borrowScopeConstraints ?? []), ...routeEvidence.map((record) => record?.borrowScopeConstraint ?? record?.translationBorrowScopeConstraint)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
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
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
