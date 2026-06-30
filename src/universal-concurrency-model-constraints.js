import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalConcurrencyModelConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalConcurrencyModelConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeConcurrencyRecords('source', [
    ...(input.sourceConcurrencyModelRecords ?? []),
    ...(input.concurrencyModelRecords ?? []),
    ...(input.concurrencyRecords ?? []),
    ...(input.asyncRecords ?? []),
    ...(input.taskRecords ?? []),
    ...(input.imports ?? []).flatMap(concurrencyRecordsFromImport)
  ]);
  const targetRecords = normalizeConcurrencyRecords('target', input.targetConcurrencyModelRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedConcurrencyKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = concurrencyMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = concurrencyReview(missingKinds, sourceRecords, targetRecords, input);
  const status = concurrencyStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalConcurrencyModelConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalConcurrencyModelConstraintEvidence.v1',
    id: input.id ?? `concurrency_model_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: concurrencyAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceConcurrencyModelRecords: sourceRecords,
    targetConcurrencyModelRecords: targetRecords,
    concurrencyModelConstraints: requiredKinds.map((kind) => concurrencyConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      concurrencyModelEquivalenceClaim: false,
      schedulerEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Concurrency-model constraints record async/task/thread/actor/channel/scheduler obligations for translation admission. They are not proof of equivalent scheduling or execution.',
      ...(input.metadata ?? {})
    }
  };
}

export function concurrencyModelConstraintMatches(evidence = {}, query = {}) {
  return match(query.concurrencyModelConstraintStatus, [evidence.status])
    && match(query.concurrencyModelConstraintAction, [evidence.action])
    && match(query.concurrencyModelConstraintRequiredKind, evidence.requiredKinds)
    && match(query.concurrencyModelConstraintRepresentedKind, evidence.representedKinds)
    && match(query.concurrencyModelConstraintMissingKind, evidence.missingKinds)
    && match(query.concurrencyModelConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.concurrencyModelConstraintEvidenceId, evidence.evidenceIds);
}

export function concurrencyModelConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingConcurrencyInput(input, route, routeEvidence);
  const sourceConcurrencyModelRecords = [...(explicit?.sourceConcurrencyModelRecords ?? []), ...(explicit?.concurrencyModelRecords ?? []), ...(explicit?.concurrencyRecords ?? []), ...(explicit?.asyncRecords ?? []), ...(explicit?.taskRecords ?? []), ...routeImports.flatMap(concurrencyRecordsFromImport)];
  const targetConcurrencyModelRecords = [...(explicit?.targetConcurrencyModelRecords ?? [])];
  if (!explicit && !sourceConcurrencyModelRecords.length && !targetConcurrencyModelRecords.length) return undefined;
  return createUniversalConcurrencyModelConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceConcurrencyModelRecords, targetConcurrencyModelRecords, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeConcurrencyRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = concurrencyConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_concurrency_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      concurrencyKind: record?.concurrencyKind ?? record?.kind ?? record?.operationKind ?? record?.regionKind,
      constructId: record?.constructId ?? record?.taskId ?? record?.threadId ?? record?.actorId ?? record?.channelId,
      scheduler: record?.scheduler ?? record?.executor ?? record?.queue ?? record?.runtime,
      isolationKey: record?.isolationKey ?? record?.actorId ?? record?.threadId ?? record?.executorId,
      cancellationKey: record?.cancellationKey ?? record?.signalId ?? record?.contextId,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function concurrencyRecordsFromImport(imported) {
  return [
    ...(imported?.concurrencyModelConstraints ?? []),
    ...(imported?.concurrencyModelRecords ?? []),
    ...(imported?.concurrencyRecords ?? []),
    ...(imported?.asyncRecords ?? []),
    ...(imported?.taskRecords ?? []),
    ...(imported?.threadRecords ?? []),
    ...(imported?.actorRecords ?? []),
    ...(imported?.channelRecords ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(concurrencyLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(concurrencyLikeRecord)
  ];
}

function concurrencyLikeRecord(record = {}) {
  const token = String([record.kind, record.concurrencyKind, record.operationKind, record.regionKind, record.predicate, record.capability].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.taskId || record.threadId || record.actorId || record.channelId || record.executorId || record.cancellationKey || /async|await|promise|future|task|spawn|thread|worker|goroutine|actor|channel|mailbox|event-loop|microtask|scheduler|executor|queue|cancel|reentrant|backpressure|structured-concurrency/.test(token));
}

function concurrencyConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.concurrencyKind,
    record.kind,
    record.operationKind,
    record.regionKind,
    record.predicate,
    record.capability,
    record.scheduler,
    record.executor,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.async === true ? 'async-task' : undefined,
    record.await === true ? 'async-task' : undefined,
    record.spawn === true ? 'thread-boundary' : undefined,
    record.structured === true ? 'structured-concurrency' : undefined,
    record.actorId ? 'actor-isolation' : undefined,
    record.channelId ? 'channel-communication' : undefined,
    record.cancellationKey || record.cancelable === true ? 'cancellation-propagation' : undefined,
    record.reentrant === true ? 'reentrancy' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(concurrencyKindForToken));
}

function concurrencyKindForToken(token) {
  const kinds = [];
  if (/structured-concurrency|task-group|nursery|scope|join-set|coroutine-scope/.test(token)) kinds.push('structured-concurrency');
  if (/async|await|promise|future|deferred|coroutine|async-task/.test(token)) kinds.push('async-task');
  if (/thread|worker|goroutine|spawn|fork|parallel/.test(token)) kinds.push('thread-boundary');
  if (/event-loop|runloop|reactor|microtask|macrotask|dispatch-queue|executor|scheduler/.test(token)) kinds.push('scheduler-semantics');
  if (/main-thread|ui-thread|main-actor|affinity|thread-confined/.test(token)) kinds.push('scheduler-affinity');
  if (/actor|isolation|mailbox/.test(token)) kinds.push('actor-isolation');
  if (/channel|queue|stream|send|receive|select/.test(token)) kinds.push('channel-communication');
  if (/cancel|abort-signal|cancellation|context/.test(token)) kinds.push('cancellation-propagation');
  if (/join|detach|daemon|lifecycle|wait/.test(token)) kinds.push('task-lifecycle');
  if (/backpressure|flow-control/.test(token)) kinds.push('backpressure');
  if (/reentrant|reentrancy/.test(token)) kinds.push('reentrancy');
  if (/task-local|thread-local|context-local|async-local/.test(token)) kinds.push('task-local-context');
  if (!kinds.length && (token === 'concurrency' || token === 'concurrency-model')) kinds.push('concurrency-model');
  return kinds;
}

function representedConcurrencyKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function concurrencyMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-concurrency-model-target-evidence']),
    ...(missingKinds.length ? ['translation-concurrency-model-proof'] : []),
    ...(missingKinds.map((kind) => `translation-concurrency-model:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function concurrencyReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Concurrency-model constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source async/task/thread/actor/channel records are not represented by target concurrency-model evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function concurrencyStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function concurrencyAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-concurrency-model-evidence';
  if (status === 'degraded') return 'review-concurrency-model-loss';
  if (status === 'satisfied') return 'attach-concurrency-model-record';
  return 'skip';
}

function concurrencyConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceConcurrencyModelIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetConcurrencyModelIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['structured-concurrency', 'scheduler-affinity', 'actor-isolation', 'channel-communication', 'cancellation-propagation', 'task-lifecycle'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingConcurrencyInput(input, route, routeEvidence) {
  const candidates = [input.concurrencyModelConstraint, input.translationConcurrencyModelConstraint, ...(input.concurrencyModelConstraints ?? []), ...routeEvidence.map((record) => record?.concurrencyModelConstraint ?? record?.translationConcurrencyModelConstraint)].filter(Boolean);
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
