import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalObjectModelConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalObjectModelConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeObjectRecords('source', [
    ...(input.sourceObjectModelRecords ?? []),
    ...(input.objectModelRecords ?? []),
    ...(input.objectRecords ?? []),
    ...(input.classRecords ?? []),
    ...(input.prototypeRecords ?? []),
    ...(input.imports ?? []).flatMap(objectRecordsFromImport)
  ]);
  const targetRecords = normalizeObjectRecords('target', input.targetObjectModelRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedObjectKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = objectMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = objectReview(missingKinds, sourceRecords, targetRecords, input);
  const status = objectStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalObjectModelConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalObjectModelConstraintEvidence.v1',
    id: input.id ?? `object_model_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: objectAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceObjectModelRecords: sourceRecords,
    targetObjectModelRecords: targetRecords,
    objectModelConstraints: requiredKinds.map((kind) => objectConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      objectModelEquivalenceClaim: false,
      dispatchEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Object-model constraints record class/prototype/dispatch/identity semantics for translation admission. They are not proof of equivalent target execution.',
      ...(input.metadata ?? {})
    }
  };
}

export function objectModelConstraintMatches(evidence = {}, query = {}) {
  return match(query.objectModelConstraintStatus, [evidence.status])
    && match(query.objectModelConstraintAction, [evidence.action])
    && match(query.objectModelConstraintRequiredKind, evidence.requiredKinds)
    && match(query.objectModelConstraintRepresentedKind, evidence.representedKinds)
    && match(query.objectModelConstraintMissingKind, evidence.missingKinds)
    && match(query.objectModelConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.objectModelConstraintEvidenceId, evidence.evidenceIds);
}

export function objectModelConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingObjectInput(input, route, routeEvidence);
  const sourceObjectModelRecords = [...(explicit?.sourceObjectModelRecords ?? []), ...(explicit?.objectModelRecords ?? []), ...(explicit?.objectRecords ?? []), ...(explicit?.classRecords ?? []), ...(explicit?.prototypeRecords ?? []), ...routeImports.flatMap(objectRecordsFromImport)];
  const targetObjectModelRecords = [...(explicit?.targetObjectModelRecords ?? [])];
  if (!explicit && !sourceObjectModelRecords.length && !targetObjectModelRecords.length) return undefined;
  return createUniversalObjectModelConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceObjectModelRecords, targetObjectModelRecords, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeObjectRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = objectConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_object_model_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      objectKind: record?.objectKind ?? record?.kind ?? record?.classKind,
      classId: record?.classId ?? record?.symbolId ?? record?.nodeId,
      prototypeId: record?.prototypeId,
      traitId: record?.traitId,
      mixinId: record?.mixinId,
      methodId: record?.methodId,
      fieldId: record?.fieldId,
      constructorId: record?.constructorId,
      dispatchKind: record?.dispatchKind,
      inheritanceKind: record?.inheritanceKind,
      receiverKind: record?.receiverKind,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function objectRecordsFromImport(imported) {
  return [
    ...(imported?.objectModelConstraints ?? []),
    ...(imported?.objectModelRecords ?? []),
    ...(imported?.objectRecords ?? []),
    ...(imported?.classRecords ?? []),
    ...(imported?.prototypeRecords ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(objectLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(objectLikeRecord),
    ...(imported?.nativeAst?.classes ?? []),
    ...(imported?.nativeAst?.objects ?? []),
    ...(imported?.nativeAst?.declarations ?? []).filter(objectLikeRecord)
  ];
}

function objectLikeRecord(record = {}) {
  const token = String([record.kind, record.objectKind, record.classKind, record.dispatchKind, record.inheritanceKind, record.receiverKind, record.predicate, record.capability].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.classId || record.prototypeId || record.traitId || record.mixinId || record.methodId || record.constructorId || /class|constructor|prototype|inherit|extends|trait|mixin|dispatch|override|super|receiver|metaclass|reflection|visibility|sealed|final|destructor|object-model/.test(token));
}

function objectConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.objectKind,
    record.kind,
    record.classKind,
    record.dispatchKind,
    record.inheritanceKind,
    record.receiverKind,
    record.predicate,
    record.capability,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.prototypeId ? 'prototype-chain' : undefined,
    record.constructorId ? 'constructor-order' : undefined,
    record.fieldId ? 'field-initialization' : undefined,
    record.virtual === true ? 'virtual-dispatch' : undefined,
    record.staticDispatch === true ? 'static-dispatch' : undefined,
    record.multipleInheritance === true ? 'multiple-inheritance' : undefined,
    record.valueSemantics === true ? 'value-semantics' : undefined,
    record.referenceSemantics === true ? 'reference-semantics' : undefined,
    record.reflection === true ? 'reflection' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(objectKindForToken));
}

function objectKindForToken(token) {
  const kinds = [];
  if (/class-construction|construct|constructor|new-object|class\b/.test(token)) kinds.push('class-construction');
  if (/constructor-order|init-order|initialization-order|super-before-this|base-init/.test(token)) kinds.push('constructor-order');
  if (/field-initialization|field-init|property-init|initializer|default-field/.test(token)) kinds.push('field-initialization');
  if (/object-identity|identity|reference-equality|object-id/.test(token)) kinds.push('object-identity');
  if (/reference-semantics|shared-object|alias|reference-type/.test(token)) kinds.push('reference-semantics');
  if (/value-semantics|value-object|struct-value|copy-semantics|record-value/.test(token)) kinds.push('value-semantics');
  if (/prototype-chain|prototype|__proto__|delegation/.test(token)) kinds.push('prototype-chain');
  if (/inheritance|inherits|extends|subclass|base-class/.test(token)) kinds.push('inheritance');
  if (/multiple-inheritance|diamond-inheritance/.test(token)) kinds.push('multiple-inheritance');
  if (/method-resolution-order|mro|linearization|method-resolution/.test(token)) kinds.push('method-resolution-order');
  if (/virtual-dispatch|dynamic-dispatch|vtable|override-dispatch/.test(token)) kinds.push('virtual-dispatch');
  if (/static-dispatch|monomorph|final-dispatch/.test(token)) kinds.push('static-dispatch');
  if (/override-rules|override|abstract-method|interface-impl/.test(token)) kinds.push('override-rules');
  if (/super-dispatch|super-call|base-call/.test(token)) kinds.push('super-dispatch');
  if (/trait-composition|trait|protocol-extension|impl-block/.test(token)) kinds.push('trait-composition');
  if (/mixin-composition|mixin/.test(token)) kinds.push('mixin-composition');
  if (/extension-method|extension-methods|extension-function/.test(token)) kinds.push('extension-method');
  if (/visibility|private|protected|public|friend/.test(token)) kinds.push('visibility');
  if (/sealed-final|sealed|final|closed-class/.test(token)) kinds.push('sealed-final');
  if (/destructor-finalizer|destructor|finalizer|deinit|drop-order/.test(token)) kinds.push('destructor-finalizer');
  if (/reflection|reflect|introspect|descriptor/.test(token)) kinds.push('reflection');
  if (/metaclass|class-object|eigenclass/.test(token)) kinds.push('metaclass');
  if (!kinds.length && (token === 'object' || token === 'object-model')) kinds.push('object-model');
  return kinds;
}

function representedObjectKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function objectMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-object-model-target-evidence']),
    ...(missingKinds.length ? ['translation-object-model-proof'] : []),
    ...(missingKinds.map((kind) => `translation-object-model:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function objectReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Object-model constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source object/class/prototype semantics are not represented by target object-model evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function objectStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function objectAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-object-model-evidence';
  if (status === 'degraded') return 'review-object-model-loss';
  if (status === 'satisfied') return 'attach-object-model-record';
  return 'skip';
}

function objectConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceObjectModelIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetObjectModelIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['constructor-order', 'field-initialization', 'object-identity', 'reference-semantics', 'value-semantics', 'prototype-chain', 'multiple-inheritance', 'method-resolution-order', 'virtual-dispatch', 'override-rules', 'super-dispatch', 'destructor-finalizer'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingObjectInput(input, route, routeEvidence) {
  const candidates = [input.objectModelConstraint, input.translationObjectModelConstraint, ...(input.objectModelConstraints ?? []), ...routeEvidence.map((record) => record?.objectModelConstraint ?? record?.translationObjectModelConstraint)].filter(Boolean);
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
