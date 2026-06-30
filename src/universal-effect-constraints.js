import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalEffectConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalEffectConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceEffects = normalizeEffects('source', [
    ...(input.sourceEffects ?? []),
    ...(input.effects ?? []),
    ...(input.imports ?? []).flatMap(effectsFromImport),
    ...effectsFromRuntime(input.runtime, 'source')
  ]);
  const targetEffects = normalizeEffects('target', [
    ...(input.targetEffects ?? []),
    ...effectsFromRuntime(input.runtime, 'target')
  ]);
  const requiredKinds = uniqueStrings(sourceEffects.flatMap((record) => record.constraintKinds));
  const representedKinds = representedEffectKinds(requiredKinds, targetEffects, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = effectMissingEvidence(missingKinds, sourceEffects, targetEffects, input);
  const blockers = effectBlockers(input.runtime, input);
  const review = effectReview(missingKinds, sourceEffects, targetEffects, input);
  const status = effectStatus({ sourceEffects, targetEffects, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalEffectConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalEffectConstraintEvidence.v1',
    id: input.id ?? `effect_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: effectAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceEffects,
    targetEffects,
    effectConstraints: requiredKinds.map((kind) => effectConstraintRecord(kind, sourceEffects, targetEffects, representedKinds)),
    evidenceIds: uniqueStrings([
      ...(input.evidenceIds ?? []),
      ...sourceEffects.flatMap((record) => record.evidenceIds ?? []),
      ...targetEffects.flatMap((record) => record.evidenceIds ?? [])
    ]),
    claims: {
      runtimeEquivalenceClaim: false,
      effectEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Effect constraints record observable effect obligations for translation admission. They are not proof that target execution is equivalent.',
      ...(input.metadata ?? {})
    }
  };
}

export function effectConstraintMatches(evidence = {}, query = {}) {
  return match(query.effectConstraintStatus, [evidence.status])
    && match(query.effectConstraintAction, [evidence.action])
    && match(query.effectConstraintRequiredKind, evidence.requiredKinds)
    && match(query.effectConstraintRepresentedKind, evidence.representedKinds)
    && match(query.effectConstraintMissingKind, evidence.missingKinds)
    && match(query.effectConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.effectConstraintEvidenceId, evidence.evidenceIds);
}

export function effectConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = [], runtime = {}) {
  const explicit = matchingEffectInput(input, route, routeEvidence);
  const sourceEffects = [...(explicit?.sourceEffects ?? []), ...(explicit?.effects ?? []), ...routeImports.flatMap(effectsFromImport)];
  const targetEffects = [...(explicit?.targetEffects ?? [])];
  if (!explicit && !sourceEffects.length && !(runtime?.requiredCapabilities ?? []).length) return undefined;
  return createUniversalEffectConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceEffects, targetEffects, runtime, routeEvidence, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeEffects(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = effectConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_effect_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      effectKind: record?.effectKind ?? record?.kind ?? record?.capability ?? record?.regionKind,
      constraintKinds,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      target: record?.target,
      adapterRequired: Boolean(record?.adapterRequired),
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function effectsFromImport(imported) {
  return [
    ...(imported?.effectConstraints ?? []),
    ...(imported?.effects ?? []),
    ...(imported?.runtimeEffects ?? []),
    ...(imported?.ownershipRegions ?? []).filter(effectRegion),
    ...(imported?.universalAst?.ownershipRegions ?? []).filter(effectRegion),
    ...(imported?.semanticIndex?.facts ?? []).filter(effectFact)
  ];
}

function effectsFromRuntime(runtime = {}, role) {
  const capabilities = role === 'source' ? runtime.requiredCapabilities ?? [] : runtime.satisfiedCapabilities ?? [];
  const adapters = role === 'target' ? runtime.adapterRequirements ?? [] : [];
  return [
    ...capabilities.map((capability) => ({ kind: capability, capability, evidenceIds: [] })),
    ...adapters.map((adapter) => ({ kind: adapter.capability, capability: adapter.capability, adapterRequired: true, evidenceIds: adapter.evidenceIds ?? [] }))
  ];
}

function effectRegion(record) {
  return ['effect', 'mutation', 'controlFlow'].includes(String(record?.regionKind ?? record?.symbolKind ?? record?.predicate));
}

function effectFact(record) {
  return ['effect', 'mutation', 'controlFlow'].includes(String(record?.predicate));
}

function effectConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.effectKind,
    record.kind,
    record.capability,
    record.regionKind,
    record.symbolKind,
    record.predicate,
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.value?.kind
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(effectKindForToken));
}

function effectKindForToken(token) {
  if (/fetch|network|http|websocket|eventsource/.test(token)) return ['network-io'];
  if (/storage|indexeddb|cookie|cache|localstorage|sessionstorage/.test(token)) return ['storage-io'];
  if (/file|filesystem|fs/.test(token)) return ['filesystem-io'];
  if (/timer|scheduler|interval|animation|idle|microtask/.test(token)) return ['scheduler'];
  if (/dom|browser|document|window|navigator|history|location/.test(token)) return ['dom'];
  if (/async|await|promise/.test(token)) return ['async-suspension'];
  if (/thread|worker|concurrency/.test(token)) return ['concurrency'];
  if (/ffi|foreign|native/.test(token)) return ['ffi-boundary'];
  if (/mutation|assignment|update|delete|mutating/.test(token)) return ['mutation'];
  if (/exception|throw|try|catch|finally/.test(token)) return ['exception'];
  if (/branch|loop|control|transfer|exit|return|yield/.test(token)) return ['control-flow'];
  if (/alloc|new|constructor/.test(token)) return ['allocation'];
  if (/host|console|process|deno|bun|import-meta/.test(token)) return ['host-effect'];
  return token === 'effect' ? ['effect'] : [];
}

function representedEffectKinds(requiredKinds, targetEffects, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetEffects.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function effectMissingEvidence(missingKinds, sourceEffects, targetEffects, input) {
  if (!sourceEffects.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetEffects.length || preserveSource ? [] : ['translation-effect-constraint-target-evidence']),
    ...(missingKinds.length ? ['translation-effect-constraint-proof'] : []),
    ...(missingKinds.map((kind) => `translation-effect-constraint:${kind}`)),
    ...((input.runtime?.adapterRequirements ?? []).length && !hasPassedEffectProof(input.routeEvidence) ? ['translation-effect-runtime-adapter-proof'] : []),
    ...(input.missingEvidence ?? [])
  ]);
}

function effectBlockers(runtime = {}, input = {}) {
  return uniqueStrings([
    ...((runtime.missingCapabilities ?? []).map((capability) => `Target runtime is missing effect capability: ${capability}.`)),
    ...(input.blockers ?? [])
  ]);
}

function effectReview(missingKinds, sourceEffects, targetEffects, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Effect constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceEffects.length && !targetEffects.length ? ['Source effects are not represented by target effect evidence.'] : []),
    ...((input.runtime?.adapterRequirements ?? []).map((entry) => `Runtime effect adapter proof is required for ${entry.capability}.`)),
    ...(input.review ?? [])
  ]);
}

function hasPassedEffectProof(evidence) {
  return (evidence ?? []).some((record) => (record?.status === 'passed' || record?.status === 'ok' || record?.status === 'success') && /runtime|effect|adapter|proof|replay|gate|verification/i.test(String(record?.kind ?? record?.type ?? record?.scope ?? '')));
}

function effectStatus(input) {
  if (!input.sourceEffects.length && !input.targetEffects.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetEffects.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function effectAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-effect-constraint-evidence';
  if (status === 'degraded') return 'review-effect-constraint-loss';
  if (status === 'satisfied') return 'attach-effect-constraint-record';
  return 'skip';
}

function effectConstraintRecord(kind, sourceEffects, targetEffects, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceEffectIds: sourceEffects.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetEffectIds: targetEffects.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['network-io', 'filesystem-io', 'mutation', 'exception', 'ffi-boundary'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingEffectInput(input, route, routeEvidence) {
  const candidates = [input.effectConstraint, input.translationEffectConstraint, ...(input.effectConstraints ?? []), ...routeEvidence.map((record) => record?.effectConstraint ?? record?.translationEffectConstraint)].filter(Boolean);
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
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
