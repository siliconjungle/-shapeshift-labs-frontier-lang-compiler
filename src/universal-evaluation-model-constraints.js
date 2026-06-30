import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalEvaluationModelConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalEvaluationModelConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeEvaluationRecords('source', [
    ...(input.sourceEvaluationModelRecords ?? []),
    ...(input.evaluationModelRecords ?? []),
    ...(input.evaluationRecords ?? []),
    ...(input.expressionRecords ?? []),
    ...(input.operatorRecords ?? []),
    ...(input.imports ?? []).flatMap(evaluationRecordsFromImport)
  ]);
  const targetRecords = normalizeEvaluationRecords('target', input.targetEvaluationModelRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedEvaluationKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = evaluationMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = evaluationReview(missingKinds, sourceRecords, targetRecords, input);
  const status = evaluationStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalEvaluationModelConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalEvaluationModelConstraintEvidence.v1',
    id: input.id ?? `evaluation_model_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: evaluationAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceEvaluationModelRecords: sourceRecords,
    targetEvaluationModelRecords: targetRecords,
    evaluationModelConstraints: requiredKinds.map((kind) => evaluationConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      evaluationModelEquivalenceClaim: false,
      valueSemanticsEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Evaluation-model constraints record expression/value semantics for translation admission. They are not proof of equivalent target execution.',
      ...(input.metadata ?? {})
    }
  };
}

export function evaluationModelConstraintMatches(evidence = {}, query = {}) {
  return match(query.evaluationModelConstraintStatus, [evidence.status])
    && match(query.evaluationModelConstraintAction, [evidence.action])
    && match(query.evaluationModelConstraintRequiredKind, evidence.requiredKinds)
    && match(query.evaluationModelConstraintRepresentedKind, evidence.representedKinds)
    && match(query.evaluationModelConstraintMissingKind, evidence.missingKinds)
    && match(query.evaluationModelConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.evaluationModelConstraintEvidenceId, evidence.evidenceIds);
}

export function evaluationModelConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingEvaluationInput(input, route, routeEvidence);
  const sourceEvaluationModelRecords = [...(explicit?.sourceEvaluationModelRecords ?? []), ...(explicit?.evaluationModelRecords ?? []), ...(explicit?.evaluationRecords ?? []), ...(explicit?.expressionRecords ?? []), ...(explicit?.operatorRecords ?? []), ...routeImports.flatMap(evaluationRecordsFromImport)];
  const targetEvaluationModelRecords = [...(explicit?.targetEvaluationModelRecords ?? [])];
  if (!explicit && !sourceEvaluationModelRecords.length && !targetEvaluationModelRecords.length) return undefined;
  return createUniversalEvaluationModelConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceEvaluationModelRecords, targetEvaluationModelRecords, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeEvaluationRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = evaluationConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_evaluation_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      evaluationKind: record?.evaluationKind ?? record?.kind ?? record?.expressionKind ?? record?.operationKind,
      expressionId: record?.expressionId ?? record?.nodeId ?? record?.symbolId,
      operator: record?.operator,
      valueKind: record?.valueKind ?? record?.typeKind,
      evaluationOrder: record?.evaluationOrder ?? record?.order,
      coercionKind: record?.coercionKind ?? record?.conversionKind,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function evaluationRecordsFromImport(imported) {
  return [
    ...(imported?.evaluationModelConstraints ?? []),
    ...(imported?.evaluationModelRecords ?? []),
    ...(imported?.evaluationRecords ?? []),
    ...(imported?.expressionRecords ?? []),
    ...(imported?.operatorRecords ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(evaluationLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(evaluationLikeRecord),
    ...(imported?.nativeAst?.expressions ?? []),
    ...(imported?.nativeAst?.declarations ?? []).filter(evaluationLikeRecord)
  ];
}

function evaluationLikeRecord(record = {}) {
  const token = String([record.kind, record.evaluationKind, record.expressionKind, record.operationKind, record.operator, record.predicate, record.capability].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.operator || record.expressionId || record.evaluationOrder || record.coercionKind || /short-circuit|lazy|eager|truthy|truthiness|coercion|conversion|equality|comparison|overflow|division|float|operator|destructur|default|property-access|index|evaluation/.test(token));
}

function evaluationConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.evaluationKind,
    record.kind,
    record.expressionKind,
    record.operationKind,
    record.operator,
    record.predicate,
    record.capability,
    record.evaluationOrder,
    record.coercionKind,
    record.conversionKind,
    record.valueKind,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.shortCircuit === true ? 'short-circuit' : undefined,
    record.lazy === true ? 'lazy-evaluation' : undefined,
    record.eager === true ? 'eager-evaluation' : undefined,
    record.truthy === true ? 'truthiness' : undefined,
    record.coerces === true ? 'implicit-conversion' : undefined,
    record.operatorOverload === true ? 'operator-overload' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(evaluationKindForToken));
}

function evaluationKindForToken(token) {
  const kinds = [];
  if (/left-to-right|right-to-left|evaluation-order|operand-order|argument-order|sequence/.test(token)) kinds.push('evaluation-order');
  if (/side-effect-order|sequence-point|sequenced-before|unsequenced/.test(token)) kinds.push('side-effect-order');
  if (/short-circuit|logical-and|logical-or|nullish/.test(token)) kinds.push('short-circuit');
  if (/lazy|thunk|by-name|generator-demand/.test(token)) kinds.push('lazy-evaluation');
  if (/eager|strict-evaluation|call-by-value/.test(token)) kinds.push('eager-evaluation');
  if (/truthy|truthiness|falsy|boolean-context/.test(token)) kinds.push('truthiness');
  if (/nullish|none-coalescing|optional-chain/.test(token)) kinds.push('nullish-semantics');
  if (/equality|strict-equal|loose-equal|samevalue|equatable/.test(token)) kinds.push('equality-semantics');
  if (/comparison|ordering|compare|spaceship|partial-ord/.test(token)) kinds.push('comparison-semantics');
  if (/coercion|implicit-conversion|cast|conversion|widening|narrowing/.test(token)) kinds.push('implicit-conversion');
  if (/numeric-coercion|number-conversion|bigint|int-to-float/.test(token)) kinds.push('numeric-coercion');
  if (/overflow|wrapping|checked-add|saturating/.test(token)) kinds.push('integer-overflow');
  if (/integer-division|floor-division|truncating-division|modulo|remainder/.test(token)) kinds.push('integer-division');
  if (/float|floating|nan|infinity|ieee|rounding/.test(token)) kinds.push('floating-point');
  if (/operator-overload|overload|method-dispatch|trait-op/.test(token)) kinds.push('operator-overload');
  if (/property-access|member-access|getter|setter|descriptor/.test(token)) kinds.push('property-access');
  if (/index|subscript|bounds|slice/.test(token)) kinds.push('indexing-bounds');
  if (/destructur|default-value|initializer/.test(token)) kinds.push('destructuring-default');
  if (/pattern-binding|binding-pattern|match-binding/.test(token)) kinds.push('pattern-binding');
  if (/receiver|this-binding|self-binding|method-call/.test(token)) kinds.push('receiver-binding');
  if (!kinds.length && (token === 'evaluation' || token === 'evaluation-model')) kinds.push('evaluation-model');
  return kinds;
}

function representedEvaluationKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function evaluationMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-evaluation-model-target-evidence']),
    ...(missingKinds.length ? ['translation-evaluation-model-proof'] : []),
    ...(missingKinds.map((kind) => `translation-evaluation-model:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function evaluationReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Evaluation-model constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source expression/value semantics are not represented by target evaluation-model evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function evaluationStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function evaluationAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-evaluation-model-evidence';
  if (status === 'degraded') return 'review-evaluation-model-loss';
  if (status === 'satisfied') return 'attach-evaluation-model-record';
  return 'skip';
}

function evaluationConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceEvaluationModelIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetEvaluationModelIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['evaluation-order', 'side-effect-order', 'short-circuit', 'truthiness', 'equality-semantics', 'implicit-conversion', 'integer-overflow', 'integer-division', 'floating-point', 'operator-overload'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingEvaluationInput(input, route, routeEvidence) {
  const candidates = [input.evaluationModelConstraint, input.translationEvaluationModelConstraint, ...(input.evaluationModelConstraints ?? []), ...routeEvidence.map((record) => record?.evaluationModelConstraint ?? record?.translationEvaluationModelConstraint)].filter(Boolean);
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
