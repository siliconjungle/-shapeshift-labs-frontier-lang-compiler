import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalCallableBoundaryConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalCallableBoundaryConstraintEvidence(input = {}) {
  input = input ?? {};
  const route = input.route ?? {};
  const routeId = input.routeId ?? route.id;
  const sourceLanguage = input.sourceLanguage ?? route.sourceLanguage;
  const target = input.target ?? route.target;
  const mode = input.mode ?? route.mode;
  const sourceRecords = normalizeCallableRecords('source', [
    ...(input.sourceCallableBoundaryRecords ?? []), ...(input.callableBoundaryRecords ?? []), ...(input.callableRecords ?? []),
    ...(input.callSignatureRecords ?? []), ...(input.functionSignatureRecords ?? []), ...(input.methodSignatureRecords ?? []),
    ...(input.callbackRecords ?? []), ...(input.closureRecords ?? []), ...(input.callsiteRecords ?? []), ...(input.ffiRecords ?? []),
    ...(input.sourceCallableBoundaryConstraints ?? []), ...(input.callableBoundaryConstraints ?? []), ...(input.imports ?? []).flatMap(callableRecordsFromImport)
  ]);
  const targetRecords = normalizeCallableRecords('target', [
    ...(input.targetCallableBoundaryRecords ?? []), ...(input.targetCallableBoundaryConstraints ?? [])
  ]);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedCallableKinds(requiredKinds, targetRecords, { mode, sameLanguage: sameLanguage(sourceLanguage, target) });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const context = { ...input, route, routeId, sourceLanguage, target, mode, preserveSource: mode === 'preserve-source' && sameLanguage(sourceLanguage, target) };
  const missingEvidence = callableMissingEvidence(missingKinds, sourceRecords, targetRecords, context);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = callableReview(missingKinds, sourceRecords, targetRecords, context);
  const status = callableStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalCallableBoundaryConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalCallableBoundaryConstraintEvidence.v1',
    id: input.id ?? `callable_boundary_constraints_${idFragment(routeId ?? `${sourceLanguage ?? 'source'}_${target ?? 'target'}`)}`,
    routeId, sourceLanguage, target, status, action: callableAction(status),
    requiredKinds, representedKinds, missingKinds, missingEvidence, blockers, review, sourceRecords, targetRecords,
    callableBoundaryConstraints: requiredKinds.map((kind) => callableConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: { callableEquivalenceClaim: false, signatureEquivalenceClaim: false, dispatchEquivalenceClaim: false, abiEquivalenceClaim: false, semanticEquivalenceClaim: false, autoMergeClaim: false },
    metadata: { note: 'Callable-boundary constraints model call signatures, parameter passing, receivers, dispatch, callbacks, closures, async/generator calls, exceptions, effects, FFI, and calling conventions for translation admission. They are not proof of equivalent target execution.', ...(input.metadata ?? {}) }
  };
}

export function callableBoundaryConstraintMatches(evidence = {}, query = {}) {
  return match(query.callableBoundaryConstraintStatus, [evidence.status])
    && match(query.callableBoundaryConstraintAction, [evidence.action])
    && match(query.callableBoundaryConstraintRequiredKind, evidence.requiredKinds)
    && match(query.callableBoundaryConstraintRepresentedKind, evidence.representedKinds)
    && match(query.callableBoundaryConstraintMissingKind, evidence.missingKinds)
    && match(query.callableBoundaryConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.callableBoundaryConstraintEvidenceId, evidence.evidenceIds);
}

export function callableBoundaryConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  input = input ?? {};
  route = route ?? {};
  const explicit = matchingCallableInput(input, route, routeEvidence);
  const sourceRecords = [
    ...(explicit?.sourceCallableBoundaryRecords ?? []), ...(explicit?.callableBoundaryRecords ?? []), ...(explicit?.callableRecords ?? []),
    ...(explicit?.callSignatureRecords ?? []), ...(explicit?.functionSignatureRecords ?? []), ...(explicit?.methodSignatureRecords ?? []),
    ...(explicit?.callbackRecords ?? []), ...(explicit?.closureRecords ?? []), ...(explicit?.callsiteRecords ?? []), ...(explicit?.ffiRecords ?? []),
    ...(explicit?.sourceCallableBoundaryConstraints ?? []), ...(explicit?.callableBoundaryConstraints ?? []), ...routeImports.flatMap(callableRecordsFromImport)
  ];
  const targetRecords = [...(explicit?.targetCallableBoundaryRecords ?? []), ...(explicit?.targetCallableBoundaryConstraints ?? [])];
  if (!explicit && !sourceRecords.length && !targetRecords.length) return undefined;
  return createUniversalCallableBoundaryConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceCallableBoundaryRecords: sourceRecords, targetCallableBoundaryRecords: targetRecords, evidenceIds: uniqueStrings([...(explicit?.evidenceIds ?? []), ...routeEvidence.map((record) => record?.id).filter(Boolean)]) });
}

function normalizeCallableRecords(role, records) {
  return uniqueCallableRecords((records ?? []).flatMap((record, index) => {
    const constraintKinds = callableConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_callable_${index + 1}_${idFragment(constraintKinds.join('_'))}`, role: record?.role ?? role,
      name: record?.name ?? record?.symbolName ?? record?.functionName ?? record?.methodName ?? record?.callableName, symbolId: record?.symbolId ?? record?.id,
      callableKind: record?.callableKind ?? record?.kind ?? record?.typeKind, signatureHash: record?.signatureHash ?? record?.contractHash ?? record?.callSignatureHash,
      arity: record?.arity ?? record?.parameterCount, requiredParameters: record?.requiredParameters ?? record?.requiredParameterCount,
      optionalParameters: record?.optionalParameters ?? record?.optionalParameterCount, parameterOrder: record?.parameterOrder ?? record?.orderedParameters,
      defaultParameters: record?.defaultParameters ?? record?.defaults, restParameter: record?.restParameter ?? record?.rest, variadic: record?.variadic,
      namedArguments: record?.namedArguments ?? record?.keywordArguments, receiverKind: record?.receiverKind ?? record?.receiver, thisBinding: record?.thisBinding,
      selfBinding: record?.selfBinding, returnKind: record?.returnKind ?? record?.returnType, asyncKind: record?.asyncKind ?? record?.asyncMode,
      generatorKind: record?.generatorKind ?? record?.yieldKind, callbackKind: record?.callbackKind, closureCapture: record?.closureCapture ?? record?.captureKind,
      overloadSet: record?.overloadSet ?? record?.overloads, dispatchKind: record?.dispatchKind ?? record?.dispatchMode, constructorKind: record?.constructorKind,
      callingConvention: record?.callingConvention ?? record?.abiKind, ffiBoundary: record?.ffiBoundary ?? record?.foreignFunction, exceptionModel: record?.exceptionModel,
      effectKind: record?.effectKind ?? record?.effects, constraintKinds, sourcePath: record?.sourcePath ?? record?.sourceSpan?.path, sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan, evidenceIds: record?.evidenceIds ?? []
    }];
  }));
}

function callableRecordsFromImport(imported) {
  return uniqueCallableRecords([
    ...(imported?.callableBoundaryConstraints ?? []), ...(imported?.callableBoundaryRecords ?? []), ...(imported?.callableRecords ?? []),
    ...(imported?.callSignatureRecords ?? []), ...(imported?.functionSignatureRecords ?? []), ...(imported?.methodSignatureRecords ?? []),
    ...(imported?.callbackRecords ?? []), ...(imported?.closureRecords ?? []), ...(imported?.callsiteRecords ?? []), ...(imported?.ffiRecords ?? []),
    ...(imported?.typeConstraints ?? []).filter(callableLikeRecord), ...(imported?.protocolConstraints ?? []).filter(callableLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(callableLikeRecord), ...(imported?.semanticIndex?.facts ?? []).filter(callableLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(callableLikeRecord), ...(imported?.nativeAst?.expressions ?? []).filter(callableLikeRecord)
  ]);
}

function callableLikeRecord(record = {}) {
  const token = callableToken(record);
  return Boolean(record.signatureHash || record.callSignatureHash || record.arity || record.parameterCount || record.receiverKind || record.callingConvention || record.dispatchKind || /call|callable|function|method|signature|parameter|argument|receiver|this|self|callback|closure|dispatch|overload|variadic|async|generator|ffi|foreign|calling-convention/.test(token));
}

function callableConstraintKinds(record = {}) {
  const primitiveToken = typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean' ? record : undefined;
  const tokens = uniqueStrings([
    primitiveToken, record.callableKind, record.kind, record.typeKind, record.signatureHash ? 'signature-hash' : undefined, record.contractHash ? 'signature-hash' : undefined,
    record.arity ?? record.parameterCount ? 'arity' : undefined, record.parameterOrder ?? record.orderedParameters ? 'parameter-order' : undefined,
    record.requiredParameters ?? record.requiredParameterCount ? 'required-parameters' : undefined, record.optionalParameters ?? record.optionalParameterCount ? 'optional-parameters' : undefined,
    record.defaultParameters ?? record.defaults ? 'default-parameters' : undefined, record.restParameter ?? record.rest ? 'rest-parameter' : undefined, record.variadic ? 'variadic' : undefined,
    record.namedArguments ?? record.keywordArguments ? 'named-arguments' : undefined, record.receiverKind, record.receiver, record.thisBinding, record.selfBinding, record.returnKind, record.returnType,
    record.asyncKind, record.asyncMode, record.generatorKind, record.yieldKind, record.callbackKind, record.closureCapture, record.captureKind, record.overloadSet, record.overloads,
    record.dispatchKind, record.dispatchMode, record.constructorKind, record.callingConvention, record.abiKind, record.ffiBoundary, record.foreignFunction, record.exceptionModel,
    record.effectKind, record.effects, ...(record.constraintKinds ?? []), ...(record.factKinds ?? []), ...(record.metadata?.factKinds ?? [])
  ].filter(Boolean).map(normalizeToken));
  return uniqueStrings(tokens.flatMap(callableKindForToken));
}

function callableKindForToken(token) {
  const kinds = [];
  if (/callable|function|method|signature|delegate|call-signature/.test(token)) kinds.push('callable-signature');
  if (/signature-hash|contract-hash/.test(token)) kinds.push('signature-hash');
  if (/arity|required-parameters|required-parameter-count/.test(token)) kinds.push('arity');
  if (/parameter-order|ordered-parameter|positional/.test(token)) kinds.push('parameter-order');
  if (/optional-parameter|optional-argument/.test(token)) kinds.push('optional-parameters');
  if (/default-parameter|default-argument|default-value/.test(token)) kinds.push('default-parameters');
  if (/rest-parameter|spread-argument|vararg|variadic/.test(token)) kinds.push('rest-variadic');
  if (/named-argument|keyword-argument|labelled-argument/.test(token)) kinds.push('named-arguments');
  if (/receiver|this|self|bound-method|unbound-method/.test(token)) kinds.push('receiver-binding');
  if (/return|result|completion|yield-return/.test(token)) kinds.push('return-channel');
  if (/async|await|promise|future|task/.test(token)) kinds.push('async-call-shape');
  if (/generator|yield|iterator|coroutine/.test(token)) kinds.push('generator-call-shape');
  if (/callback|event-handler|listener|delegate/.test(token)) kinds.push('callback-contract');
  if (/closure|capture|environment/.test(token)) kinds.push('closure-capture');
  if (/overload/.test(token)) kinds.push('overload-resolution');
  if (/dispatch|dynamic-dispatch|virtual|vtable|trait-object/.test(token)) kinds.push('method-dispatch');
  if (/constructor|new|init/.test(token)) kinds.push('constructor-call');
  if (/ffi|foreign|native-bridge|extern/.test(token)) kinds.push('ffi-boundary');
  if (/calling-convention|cdecl|stdcall|fastcall|system-v|aapcs|abi/.test(token)) kinds.push('calling-convention');
  if (/exception|throw|throws|panic|error-channel/.test(token)) kinds.push('exception-propagation');
  if (/effect|side-effect|mutation|io|unsafe/.test(token)) kinds.push('effect-boundary');
  return kinds;
}

function callableToken(record = {}) {
  return String([record.kind, record.callableKind, record.typeKind, record.signatureHash, record.receiverKind, record.thisBinding, record.selfBinding, record.returnKind, record.asyncKind, record.generatorKind, record.callbackKind, record.closureCapture, record.overloadSet, record.dispatchKind, record.constructorKind, record.callingConvention, record.abiKind, record.ffiBoundary, record.exceptionModel, record.effectKind].filter(Boolean).join(' ')).toLowerCase();
}

function representedCallableKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function callableMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  return uniqueStrings([
    ...(targetRecords.length || input.preserveSource ? [] : ['translation-callable-boundary-target-evidence']),
    ...(missingKinds.length ? ['translation-callable-boundary-proof'] : []),
    ...missingKinds.map((kind) => `translation-callable-boundary:${kind}`),
    ...(input.missingEvidence ?? [])
  ]);
}

function callableReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Callable boundary constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length && !input.preserveSource ? ['Source callable signatures, call edges, or call adapters are not represented by target callable-boundary evidence.'] : []),
    ...(missingKinds.some((kind) => ['callable-signature', 'signature-hash', 'arity', 'parameter-order', 'return-channel'].includes(kind)) ? ['Callable signature, parameter order, arity, and return channel require target proof.'] : []),
    ...(missingKinds.some((kind) => ['optional-parameters', 'default-parameters', 'rest-variadic', 'named-arguments', 'overload-resolution'].includes(kind)) ? ['Optional/default/rest/named parameters and overload resolution require explicit target evidence.'] : []),
    ...(missingKinds.some((kind) => ['receiver-binding', 'method-dispatch', 'constructor-call'].includes(kind)) ? ['Receiver binding, constructor calls, and method dispatch require target call-boundary proof.'] : []),
    ...(missingKinds.some((kind) => ['async-call-shape', 'generator-call-shape', 'callback-contract', 'closure-capture'].includes(kind)) ? ['Async/generator calls, callbacks, and closure captures require runtime or compiler-backed proof.'] : []),
    ...(missingKinds.some((kind) => ['ffi-boundary', 'calling-convention', 'exception-propagation', 'effect-boundary'].includes(kind)) ? ['FFI, calling convention, exception propagation, and effect boundaries require source-bound adapter or runtime proof.'] : []),
    ...(input.review ?? [])
  ]);
}

function callableStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function callableAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-callable-boundary-evidence';
  if (status === 'degraded') return 'review-callable-boundary-loss';
  if (status === 'satisfied') return 'attach-callable-boundary-record';
  return 'skip';
}

function callableConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind, status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceCallableBoundaryIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetCallableBoundaryIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['callable-signature', 'signature-hash', 'arity', 'parameter-order', 'receiver-binding', 'return-channel', 'overload-resolution', 'method-dispatch', 'ffi-boundary', 'calling-convention', 'exception-propagation', 'effect-boundary'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingCallableInput(input, route, routeEvidence) {
  const candidates = [input.callableBoundaryConstraint, input.translationCallableBoundaryConstraint, ...(input.callableBoundaryConstraints ?? []), ...routeEvidence.flatMap(callableCandidatesFromRouteEvidence)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function callableCandidatesFromRouteEvidence(record) {
  if (!record) return [];
  return [record.callableBoundaryConstraint, record.translationCallableBoundaryConstraint, callableEvidenceRecord(record) ? record : undefined, ...(record.callableBoundaryConstraints ?? []), ...(record.translationCallableBoundaryConstraints ?? [])].filter(Boolean);
}

function callableEvidenceRecord(record) {
  return record?.kind === 'frontier.lang.universalCallableBoundaryConstraintEvidence' || record?.schema === 'frontier.lang.universalCallableBoundaryConstraintEvidence.v1' || Boolean((record?.sourceRecords?.length || record?.targetRecords?.length) && record?.callableBoundaryConstraints?.length);
}

function routeMatch(candidate, route = {}) {
  return (!candidate.routeId || String(candidate.routeId) === String(route.id))
    && (!candidate.sourceLanguage || normalizeToken(candidate.sourceLanguage) === normalizeToken(route.sourceLanguage))
    && (!candidate.target || normalizeToken(candidate.target) === normalizeToken(route.target));
}

function sameLanguage(source, target) {
  const sourceKey = normalizeToken(source);
  const targetKey = normalizeToken(target);
  return Boolean(sourceKey && targetKey && sourceKey === targetKey);
}

function match(filter, values) {
  const filters = (Array.isArray(filter) ? filter : filter === undefined || filter === null ? [] : [filter]).filter((item) => item !== null && item !== undefined);
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter((value) => value !== null && value !== undefined).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}

function normalizeToken(value) {
  return String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
}

function uniqueCallableRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const explicitKey = record.id ?? record.symbolId ?? [record.name, record.symbolName, record.functionName, record.methodName, record.signatureHash, record.callSignatureHash, record.callingConvention].filter(Boolean).join(':');
    const key = explicitKey || JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
