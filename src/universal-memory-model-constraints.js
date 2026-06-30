import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalMemoryModelConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalMemoryModelConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeMemoryRecords('source', [
    ...(input.sourceMemoryModelRecords ?? []),
    ...(input.memoryModelRecords ?? []),
    ...(input.concurrencyRecords ?? []),
    ...(input.imports ?? []).flatMap(memoryRecordsFromImport)
  ]);
  const targetRecords = normalizeMemoryRecords('target', input.targetMemoryModelRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedMemoryKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = memoryMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = memoryReview(missingKinds, sourceRecords, targetRecords, input);
  const status = memoryStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalMemoryModelConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalMemoryModelConstraintEvidence.v1',
    id: input.id ?? `memory_model_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: memoryAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceMemoryModelRecords: sourceRecords,
    targetMemoryModelRecords: targetRecords,
    memoryModelConstraints: requiredKinds.map((kind) => memoryConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      memoryModelEquivalenceClaim: false,
      dataRaceFreedomClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Memory-model constraints record synchronization, aliasing, and shared-memory obligations for translation admission. They are not proof of data-race freedom or equivalent execution.',
      ...(input.metadata ?? {})
    }
  };
}

export function memoryModelConstraintMatches(evidence = {}, query = {}) {
  return match(query.memoryModelConstraintStatus, [evidence.status])
    && match(query.memoryModelConstraintAction, [evidence.action])
    && match(query.memoryModelConstraintRequiredKind, evidence.requiredKinds)
    && match(query.memoryModelConstraintRepresentedKind, evidence.representedKinds)
    && match(query.memoryModelConstraintMissingKind, evidence.missingKinds)
    && match(query.memoryModelConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.memoryModelConstraintEvidenceId, evidence.evidenceIds);
}

export function memoryModelConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingMemoryInput(input, route, routeEvidence);
  const sourceMemoryModelRecords = [...(explicit?.sourceMemoryModelRecords ?? []), ...(explicit?.memoryModelRecords ?? []), ...(explicit?.concurrencyRecords ?? []), ...routeImports.flatMap(memoryRecordsFromImport)];
  const targetMemoryModelRecords = [...(explicit?.targetMemoryModelRecords ?? [])];
  if (!explicit && !sourceMemoryModelRecords.length && !targetMemoryModelRecords.length) return undefined;
  return createUniversalMemoryModelConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceMemoryModelRecords, targetMemoryModelRecords, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeMemoryRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = memoryConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_memory_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      memoryKind: record?.memoryKind ?? record?.kind ?? record?.operationKind ?? record?.regionKind,
      resourceId: record?.resourceId ?? record?.resource,
      ordering: record?.ordering ?? record?.memoryOrder,
      synchronizationKey: record?.synchronizationKey ?? record?.lockId ?? record?.channelId ?? record?.actorId,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function memoryRecordsFromImport(imported) {
  return [
    ...(imported?.memoryModelConstraints ?? []),
    ...(imported?.memoryModelRecords ?? []),
    ...(imported?.concurrencyRecords ?? []),
    ...(imported?.synchronizationRecords ?? []),
    ...(imported?.atomicOperations ?? []),
    ...(imported?.locks ?? []),
    ...(imported?.sharedMemory ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(memoryLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(memoryLikeRecord)
  ];
}

function memoryLikeRecord(record = {}) {
  const token = String([record.kind, record.memoryKind, record.operationKind, record.regionKind, record.predicate, record.capability].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.memoryOrder || record.lockId || record.channelId || record.actorId || record.synchronizationKey || /atomic|mutex|lock|race|thread|worker|shared|volatile|happens-before|channel|actor|isolation|concurrency/.test(token));
}

function memoryConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.memoryKind,
    record.kind,
    record.operationKind,
    record.regionKind,
    record.predicate,
    record.capability,
    record.memoryOrder,
    record.ordering,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.lockId ? 'lock' : undefined,
    record.channelId ? 'channel' : undefined,
    record.actorId ? 'actor-isolation' : undefined,
    record.shared === true ? 'shared-memory' : undefined,
    record.atomic === true ? 'atomic' : undefined,
    record.volatile === true ? 'volatile' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(memoryKindForToken));
}

function memoryKindForToken(token) {
  const kinds = [];
  if (/atomic|compare-exchange|compare-and-swap|cas|fetch-add|memory-order/.test(token)) kinds.push('atomic-ordering');
  if (/happens-before|synchroni[sz]e|memory-barrier|fence|release|acquire|seq-cst|sequential/.test(token)) kinds.push('happens-before');
  if (/mutex|lock|monitor|critical-section|synchronized/.test(token)) kinds.push('lock-discipline');
  if (/race|data-race|thread-safe|send|sync/.test(token)) kinds.push('data-race-freedom');
  if (/shared-array-buffer|shared-memory|shared-state|shared/.test(token)) kinds.push('shared-memory');
  if (/volatile|relaxed|non-atomic/.test(token)) kinds.push('volatile-access');
  if (/thread|worker|goroutine|task|concurrency/.test(token)) kinds.push('thread-boundary');
  if (/channel|queue|mailbox/.test(token)) kinds.push('channel-ordering');
  if (/actor|isolation|main-actor|global-actor/.test(token)) kinds.push('actor-isolation');
  if (/reentrant|reentrancy/.test(token)) kinds.push('reentrancy');
  if (!kinds.length && (token === 'memory' || token === 'memory-model')) kinds.push('memory-model');
  return kinds;
}

function representedMemoryKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function memoryMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-memory-model-target-evidence']),
    ...(missingKinds.length ? ['translation-memory-model-proof'] : []),
    ...(missingKinds.map((kind) => `translation-memory-model:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function memoryReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Memory-model constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source synchronization/shared-memory records are not represented by target memory-model evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function memoryStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function memoryAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-memory-model-evidence';
  if (status === 'degraded') return 'review-memory-model-loss';
  if (status === 'satisfied') return 'attach-memory-model-record';
  return 'skip';
}

function memoryConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceMemoryModelIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetMemoryModelIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['happens-before', 'atomic-ordering', 'lock-discipline', 'data-race-freedom', 'shared-memory'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingMemoryInput(input, route, routeEvidence) {
  const candidates = [input.memoryModelConstraint, input.translationMemoryModelConstraint, ...(input.memoryModelConstraints ?? []), ...routeEvidence.map((record) => record?.memoryModelConstraint ?? record?.translationMemoryModelConstraint)].filter(Boolean);
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
