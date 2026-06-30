import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalControlFlowConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalControlFlowConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceFlows = normalizeFlowRecords('source', [
    ...(input.sourceControlFlows ?? []),
    ...(input.controlFlows ?? []),
    ...(input.flows ?? []),
    ...(input.imports ?? []).flatMap(controlFlowRecordsFromImport)
  ]);
  const targetFlows = normalizeFlowRecords('target', input.targetControlFlows ?? []);
  const requiredKinds = uniqueStrings(sourceFlows.flatMap((record) => record.constraintKinds));
  const representedKinds = representedFlowKinds(requiredKinds, targetFlows, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = flowMissingEvidence(missingKinds, sourceFlows, targetFlows, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = flowReview(missingKinds, sourceFlows, targetFlows, input);
  const status = flowStatus({ sourceFlows, targetFlows, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalControlFlowConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalControlFlowConstraintEvidence.v1',
    id: input.id ?? `control_flow_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: flowAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceControlFlows: sourceFlows,
    targetControlFlows: targetFlows,
    controlFlowConstraints: requiredKinds.map((kind) => controlFlowConstraintRecord(kind, sourceFlows, targetFlows, representedKinds)),
    evidenceIds: uniqueStrings([
      ...(input.evidenceIds ?? []),
      ...sourceFlows.flatMap((record) => record.evidenceIds ?? []),
      ...targetFlows.flatMap((record) => record.evidenceIds ?? [])
    ]),
    claims: {
      controlFlowEquivalenceClaim: false,
      exceptionEquivalenceClaim: false,
      asyncOrderingClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Control-flow constraints record ordering, branch, exit, exception, async, and scheduling obligations for translation admission. They are not proof of equivalent execution.',
      ...(input.metadata ?? {})
    }
  };
}

export function controlFlowConstraintMatches(evidence = {}, query = {}) {
  return match(query.controlFlowConstraintStatus, [evidence.status])
    && match(query.controlFlowConstraintAction, [evidence.action])
    && match(query.controlFlowConstraintRequiredKind, evidence.requiredKinds)
    && match(query.controlFlowConstraintRepresentedKind, evidence.representedKinds)
    && match(query.controlFlowConstraintMissingKind, evidence.missingKinds)
    && match(query.controlFlowConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.controlFlowConstraintEvidenceId, evidence.evidenceIds);
}

export function controlFlowConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingFlowInput(input, route, routeEvidence);
  const sourceControlFlows = [...(explicit?.sourceControlFlows ?? []), ...(explicit?.controlFlows ?? []), ...(explicit?.flows ?? []), ...routeImports.flatMap(controlFlowRecordsFromImport)];
  const targetControlFlows = [...(explicit?.targetControlFlows ?? [])];
  if (!explicit && !sourceControlFlows.length && !targetControlFlows.length) return undefined;
  return createUniversalControlFlowConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceControlFlows, targetControlFlows, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeFlowRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = controlFlowConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_flow_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      flowKind: record?.flowKind ?? record?.kind ?? record?.statementKind ?? record?.edgeKind,
      sourceId: record?.sourceId ?? record?.from,
      targetId: record?.targetId ?? record?.to,
      label: record?.label ?? record?.name,
      conditionHash: record?.conditionHash,
      orderingKey: record?.orderingKey ?? record?.orderKey,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function controlFlowRecordsFromImport(imported) {
  return [
    ...(imported?.controlFlowConstraints ?? []),
    ...(imported?.controlFlows ?? []),
    ...(imported?.flows ?? []),
    ...(imported?.controlFlowRegions ?? []),
    ...(imported?.controlFlowGraph?.nodes ?? []),
    ...(imported?.controlFlowGraph?.edges ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(flowLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(flowLikeRecord),
    ...(imported?.nativeAst?.controlFlows ?? []),
    ...(imported?.nativeAst?.declarations ?? []).filter(flowLikeRecord)
  ];
}

function flowLikeRecord(record = {}) {
  const token = String([
    record.role,
    record.kind,
    record.flowKind,
    record.statementKind,
    record.edgeKind,
    record.regionKind,
    record.predicate
  ].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.conditionHash || record.orderingKey || record.controlFlow || /branch|loop|return|throw|exception|catch|finally|await|async|promise|yield|switch|break|continue|goto|reachability|control/.test(token));
}

function controlFlowConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.flowKind,
    record.kind,
    record.statementKind,
    record.edgeKind,
    record.regionKind,
    record.predicate,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.conditionHash ? 'branch-condition' : undefined,
    record.orderingKey || record.orderKey ? 'ordering' : undefined,
    record.async ? 'async-suspension' : undefined,
    record.generator ? 'generator-yield' : undefined,
    record.exceptional ? 'exception-flow' : undefined,
    record.cancellable ? 'cancellation' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(controlFlowKindForToken));
}

function controlFlowKindForToken(token) {
  if (/finally|defer|ensure|cleanup/.test(token)) return ['finally-cleanup'];
  if (/throw|exception|catch|try|raise|panic|recover/.test(token)) return ['exception-flow'];
  if (/await-order|promise-order|then-chain|microtask|macrotask|event-loop|scheduler|timer/.test(token)) return ['await-order'];
  if (/async|await|promise|suspension/.test(token)) return ['async-suspension'];
  if (/yield|generator|iterator/.test(token)) return ['generator-yield'];
  if (/switch|case|match-dispatch/.test(token)) return ['switch-dispatch'];
  if (/short-circuit|logical-and|logical-or|nullish/.test(token)) return ['short-circuit'];
  if (/branch|if|conditional|ternary|guard|condition/.test(token)) return ['branch-condition'];
  if (/loop|for|while|do-while|iteration/.test(token)) return ['loop'];
  if (/return|early-exit|early-return/.test(token)) return ['early-return'];
  if (/break|continue|goto|label|non-local|nonlocal/.test(token)) return ['non-local-exit'];
  if (/pattern|match|destructure/.test(token)) return ['pattern-match'];
  if (/recursion|recursive/.test(token)) return ['recursion'];
  if (/reachability|reachable|unreachable|dead-code/.test(token)) return ['reachability'];
  if (/init|initialization|static-block|top-level|hoist/.test(token)) return ['initialization-order'];
  if (/happens-before|atomic|lock|mutex|race|thread|concurrency/.test(token)) return ['concurrency-order'];
  if (/cancel|abort|dispose/.test(token)) return ['cancellation'];
  if (/control-dependency|dominance|postdominator/.test(token)) return ['control-dependency'];
  return token === 'control' || token === 'control-flow' ? ['control-flow'] : [];
}

function representedFlowKinds(requiredKinds, targetFlows, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetFlows.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function flowMissingEvidence(missingKinds, sourceFlows, targetFlows, input) {
  if (!sourceFlows.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetFlows.length || preserveSource ? [] : ['translation-control-flow-constraint-target-evidence']),
    ...(missingKinds.length ? ['translation-control-flow-constraint-proof'] : []),
    ...(missingKinds.map((kind) => `translation-control-flow-constraint:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function flowReview(missingKinds, sourceFlows, targetFlows, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Control-flow constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceFlows.length && !targetFlows.length ? ['Source control-flow records are not represented by target control-flow evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function flowStatus(input) {
  if (!input.sourceFlows.length && !input.targetFlows.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetFlows.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function flowAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-control-flow-constraint-evidence';
  if (status === 'degraded') return 'review-control-flow-constraint-loss';
  if (status === 'satisfied') return 'attach-control-flow-constraint-record';
  return 'skip';
}

function controlFlowConstraintRecord(kind, sourceFlows, targetFlows, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceControlFlowIds: sourceFlows.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetControlFlowIds: targetFlows.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['exception-flow', 'finally-cleanup', 'await-order', 'concurrency-order', 'cancellation'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingFlowInput(input, route, routeEvidence) {
  const candidates = [input.controlFlowConstraint, input.translationControlFlowConstraint, ...(input.controlFlowConstraints ?? []), ...routeEvidence.map((record) => record?.controlFlowConstraint ?? record?.translationControlFlowConstraint)].filter(Boolean);
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
