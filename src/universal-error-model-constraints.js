import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalErrorModelConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalErrorModelConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeErrorRecords('source', [
    ...(input.sourceErrorModelRecords ?? []),
    ...(input.errorModelRecords ?? []),
    ...(input.exceptionRecords ?? []),
    ...(input.imports ?? []).flatMap(errorRecordsFromImport)
  ]);
  const targetRecords = normalizeErrorRecords('target', input.targetErrorModelRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedErrorKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = errorMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = errorReview(missingKinds, sourceRecords, targetRecords, input);
  const status = errorStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalErrorModelConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalErrorModelConstraintEvidence.v1',
    id: input.id ?? `error_model_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: errorAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceErrorModelRecords: sourceRecords,
    targetErrorModelRecords: targetRecords,
    errorModelConstraints: requiredKinds.map((kind) => errorConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      errorModelEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Error-model constraints record throw/result/panic/recovery obligations for translation admission. They are not proof of equivalent error behavior.',
      ...(input.metadata ?? {})
    }
  };
}

export function errorModelConstraintMatches(evidence = {}, query = {}) {
  return match(query.errorModelConstraintStatus, [evidence.status])
    && match(query.errorModelConstraintAction, [evidence.action])
    && match(query.errorModelConstraintRequiredKind, evidence.requiredKinds)
    && match(query.errorModelConstraintRepresentedKind, evidence.representedKinds)
    && match(query.errorModelConstraintMissingKind, evidence.missingKinds)
    && match(query.errorModelConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.errorModelConstraintEvidenceId, evidence.evidenceIds);
}

export function errorModelConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingErrorInput(input, route, routeEvidence);
  const sourceErrorModelRecords = [...(explicit?.sourceErrorModelRecords ?? []), ...(explicit?.errorModelRecords ?? []), ...(explicit?.exceptionRecords ?? []), ...routeImports.flatMap(errorRecordsFromImport)];
  const targetErrorModelRecords = [...(explicit?.targetErrorModelRecords ?? [])];
  if (!explicit && !sourceErrorModelRecords.length && !targetErrorModelRecords.length) return undefined;
  return createUniversalErrorModelConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceErrorModelRecords, targetErrorModelRecords, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeErrorRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = errorConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_error_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      errorKind: record?.errorKind ?? record?.kind ?? record?.operationKind ?? record?.regionKind,
      errorType: record?.errorType ?? record?.exceptionType ?? record?.resultType,
      boundaryId: record?.boundaryId ?? record?.catchId ?? record?.handlerId,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function errorRecordsFromImport(imported) {
  return [
    ...(imported?.errorModelConstraints ?? []),
    ...(imported?.errorModelRecords ?? []),
    ...(imported?.exceptionRecords ?? []),
    ...(imported?.throwRecords ?? []),
    ...(imported?.panicRecords ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(errorLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(errorLikeRecord)
  ];
}

function errorLikeRecord(record = {}) {
  const token = String([record.kind, record.errorKind, record.operationKind, record.regionKind, record.predicate, record.capability].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.errorType || record.exceptionType || record.resultType || record.catchId || record.handlerId || /throw|exception|panic|result|error|catch|finally|defer|recover|unwind|abort|trap|cancel|fallible/.test(token));
}

function errorConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.errorKind,
    record.kind,
    record.operationKind,
    record.regionKind,
    record.predicate,
    record.capability,
    record.errorType,
    record.exceptionType,
    record.resultType,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.checked === true ? 'checked-exception' : undefined,
    record.unchecked === true ? 'unchecked-exception' : undefined,
    record.throws === true ? 'throw-exception' : undefined,
    record.result === true ? 'result-return' : undefined,
    record.panic === true ? 'panic' : undefined,
    record.recoverable === true ? 'catch-recovery' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(errorKindForToken));
}

function errorKindForToken(token) {
  const kinds = [];
  if (/checked-exception|throws-declaration|declared-throws/.test(token)) kinds.push('checked-exception');
  if (/unchecked-exception|runtime-exception/.test(token)) kinds.push('unchecked-exception');
  if (/throw|exception/.test(token)) kinds.push('throw-exception');
  if (/result|either|option|fallible-return/.test(token)) kinds.push('result-return');
  if (/panic-unwind|unwind|resume-unwind/.test(token)) kinds.push('panic-unwind');
  if (/panic-abort|abort|fatal-error|terminate/.test(token)) kinds.push('panic-abort');
  if (/panic/.test(token)) kinds.push('panic');
  if (/catch|recover|rescue|handler/.test(token)) kinds.push('catch-recovery');
  if (/finally|defer|ensure|drop-cleanup/.test(token)) kinds.push('cleanup-boundary');
  if (/error-boundary|boundary/.test(token)) kinds.push('error-boundary');
  if (/cancel|cancellation/.test(token)) kinds.push('cancellation');
  if (/trap|assert|precondition/.test(token)) kinds.push('trap');
  if (!kinds.length && (token === 'error' || token === 'error-model')) kinds.push('error-model');
  return kinds;
}

function representedErrorKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function errorMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-error-model-target-evidence']),
    ...(missingKinds.length ? ['translation-error-model-proof'] : []),
    ...(missingKinds.map((kind) => `translation-error-model:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function errorReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Error-model constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source throw/result/panic/recovery records are not represented by target error-model evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function errorStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function errorAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-error-model-evidence';
  if (status === 'degraded') return 'review-error-model-loss';
  if (status === 'satisfied') return 'attach-error-model-record';
  return 'skip';
}

function errorConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceErrorModelIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetErrorModelIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['throw-exception', 'checked-exception', 'panic-unwind', 'panic-abort', 'cleanup-boundary', 'catch-recovery'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingErrorInput(input, route, routeEvidence) {
  const candidates = [input.errorModelConstraint, input.translationErrorModelConstraint, ...(input.errorModelConstraints ?? []), ...routeEvidence.map((record) => record?.errorModelConstraint ?? record?.translationErrorModelConstraint)].filter(Boolean);
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
