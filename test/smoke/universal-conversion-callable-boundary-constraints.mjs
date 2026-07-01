import { assert } from './helpers.mjs';
import { createUniversalCallableBoundaryConstraintEvidence, createUniversalConversionArtifacts, createUniversalConversionPlan, queryUniversalConversionArtifacts, queryUniversalConversionPlan, callableBoundaryConstraintMatches, UniversalInterlinguaConstraintEdgeKinds, UniversalInterlinguaLayerKinds } from './compiler-api.mjs';

const callableKinds = ['callable-signature', 'signature-hash', 'arity', 'parameter-order', 'optional-parameters', 'default-parameters', 'rest-variadic', 'named-arguments', 'receiver-binding', 'return-channel', 'async-call-shape', 'generator-call-shape', 'callback-contract', 'closure-capture', 'overload-resolution', 'method-dispatch', 'constructor-call', 'ffi-boundary', 'calling-convention', 'exception-propagation', 'effect-boundary'];

const preserved = createUniversalCallableBoundaryConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceCallableBoundaryRecords: [callableRecord('source_callable_contract', callableKinds)],
  targetCallableBoundaryRecords: [callableRecord('target_callable_contract', callableKinds)],
  evidenceIds: ['callable_boundary_contract_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-callable-boundary-record');
assert.equal(preserved.requiredKinds.includes('receiver-binding'), true);
assert.equal(preserved.requiredKinds.includes('calling-convention'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.callableEquivalenceClaim, false);
assert.equal(preserved.claims.signatureEquivalenceClaim, false);
assert.equal(preserved.claims.dispatchEquivalenceClaim, false);
assert.equal(preserved.claims.abiEquivalenceClaim, false);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(preserved.claims.autoMergeClaim, false);
assert.equal(callableBoundaryConstraintMatches(preserved, { callableBoundaryConstraintStatus: 'satisfied' }), true);

const failClosedWithoutTarget = createUniversalCallableBoundaryConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceCallableBoundaryRecords: [callableRecord('source_handler_contract', ['callable-signature', 'arity', 'receiver-binding', 'async-call-shape', 'callback-contract', 'closure-capture', 'exception-propagation'])]
});

assert.equal(failClosedWithoutTarget.status, 'needs-evidence');
assert.equal(failClosedWithoutTarget.action, 'collect-callable-boundary-evidence');
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-callable-boundary-target-evidence'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-callable-boundary-proof'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-callable-boundary:receiver-binding'), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Receiver binding')), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Async/generator')), true);
assert.equal(failClosedWithoutTarget.claims.semanticEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.autoMergeClaim, false);

const primitiveCallableFacts = createUniversalCallableBoundaryConstraintEvidence({
  sourceLanguage: 'python',
  target: 'go',
  sourceCallableBoundaryRecords: ['receiver-binding', 'async-call-shape', 'callback-contract']
});

assert.equal(primitiveCallableFacts.status, 'needs-evidence');
assert.equal(primitiveCallableFacts.sourceRecords.length, 3);
assert.equal(primitiveCallableFacts.requiredKinds.includes('receiver-binding'), true);
assert.equal(primitiveCallableFacts.requiredKinds.includes('async-call-shape'), true);
assert.equal(primitiveCallableFacts.requiredKinds.includes('callback-contract'), true);
assert.equal(primitiveCallableFacts.missingEvidence.includes('translation-callable-boundary:async-call-shape'), true);
assert.equal(primitiveCallableFacts.claims.autoMergeClaim, false);

const preserveSource = createUniversalConversionPlan({
  generatedAt: 2801,
  universalCapabilityMatrix: capabilityMatrix('typescript', 'typescript', ['ts']),
  targets: ['typescript'],
  evidence: [routeProof('typescript', 'typescript')],
  callableBoundaryConstraints: [{ sourceLanguage: 'typescript', target: 'typescript', sourceCallableBoundaryRecords: [callableRecord('same_language_callable_contract', ['callable-signature', 'arity', 'receiver-binding'])] }]
});
const preserveRoute = queryUniversalConversionPlan(preserveSource, { sourceLanguage: 'typescript', target: 'typescript', callableBoundaryConstraintStatus: 'satisfied' }).bestRoute;

assert.equal(Boolean(preserveRoute), true);
assert.equal(preserveRoute.mode, 'preserve-source');
assert.equal(preserveRoute.callableBoundaryConstraint.status, 'satisfied');
assert.equal(preserveRoute.callableBoundaryConstraint.missingEvidence.length, 0);
assert.equal(preserveRoute.translationAdmission.callableBoundaryConstraintStatus, 'satisfied');
assert.equal(preserveRoute.semanticEquivalenceClaim, false);

const routePlan = createUniversalConversionPlan({
  generatedAt: 2802,
  universalCapabilityMatrix: capabilityMatrix('typescript', 'rust'),
  targets: ['rust'],
  evidence: [routeProof('typescript', 'rust')],
  imports: [{ language: 'typescript', callableBoundaryRecords: [callableRecord('imported_callback_contract', ['callable-signature', 'callback-contract', 'closure-capture'])] }],
  callableBoundaryConstraints: [{
    sourceLanguage: 'typescript',
    target: 'rust',
    sourceCallableBoundaryRecords: [callableRecord('route_callable_contract', callableKinds)],
    targetCallableBoundaryRecords: [{ id: 'target_partial_callable_contract', constraintKinds: ['callable-signature', 'arity'] }]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'typescript',
  target: 'rust',
  callableBoundaryConstraintStatus: 'degraded',
  callableBoundaryConstraintMissingKind: 'receiver-binding',
  interlinguaConstraintFamily: 'callable-boundary',
  interlinguaConstraintObligationKind: 'receiver-binding',
  interlinguaConstraintObligationStatus: 'missing'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.callableBoundaryConstraint.status, 'degraded');
assert.equal(route.callableBoundaryConstraint.missingKinds.includes('receiver-binding'), true);
assert.equal(route.callableBoundaryConstraint.missingEvidence.includes('translation-callable-boundary:calling-convention'), true);
assert.equal(route.missingEvidence.includes('translation-callable-boundary-proof'), true);
assert.equal(route.translationAdmission.callableBoundaryConstraintStatus, 'degraded');
assert.equal(route.translationAdmission.requiredConstructKinds.includes('callable-boundary-contract'), true);
assert.equal(route.interlingua.layers.kinds.includes('callable-boundary-contract'), true);
assert.equal(route.interlingua.constraints.families.includes('callable-boundary'), true);
const receiverObligation = route.interlingua.constraints.obligations.find((obligation) => obligation.family === 'callable-boundary' && obligation.kind === 'receiver-binding');
assert.equal(receiverObligation.status, 'missing');
assert.equal(receiverObligation.sourceNodeIds.includes('route_callable_contract'), true);
assert.equal(receiverObligation.targetNodeIds.length, 0);
assert.equal(UniversalInterlinguaLayerKinds.includes('callable-boundary-contract'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('callable-boundary'), true);
assert.equal(route.autoMergeClaim, false);
assert.equal(route.semanticEquivalenceClaim, false);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 2803 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  callableBoundaryConstraintMissingKind: 'receiver-binding',
  callableBoundaryConstraintMissingEvidence: 'translation-callable-boundary:calling-convention',
  interlinguaConstraintFamily: 'callable-boundary',
  interlinguaConstraintObligationKind: 'receiver-binding',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.callableBoundaryConstraint.status, 'degraded');
assert.equal(artifacts.index.callableBoundaryConstraintStatuses.includes('degraded'), true);
assert.equal(artifacts.index.callableBoundaryConstraintMissingKinds.includes('receiver-binding'), true);
assert.equal(artifacts.summary.compactCounts.callableBoundaryConstraint.missingKinds['receiver-binding'], 1);
assert.equal(artifact.admissionRecord.callableBoundaryConstraint.status, 'degraded');
assert.equal(artifact.admissionRecord.metadata.callableBoundaryConstraint.status, 'degraded');
assert.equal(artifact.materialization.autoMergeClaim, false);
assert.equal(artifact.materialization.semanticEquivalenceClaim, false);
assert.equal(artifact.autoMergeClaim, false);
assert.equal(artifact.semanticEquivalenceClaim, false);

function callableRecord(id, constraintKinds) {
  return {
    id, kind: 'async function callback closure receiver overload ffi calling-convention exception effect', name: 'submitOrder', signatureHash: 'sig_submit_order',
    arity: 2, requiredParameters: 1, optionalParameters: 1, parameterOrder: ['order', 'options'], defaultParameters: ['options'], restParameter: false,
    namedArguments: ['order', 'options'], receiverKind: 'this-bound', thisBinding: 'CheckoutController', returnKind: 'promise-result', asyncKind: 'promise',
    generatorKind: 'none', callbackKind: 'event-handler', closureCapture: 'captures-payment-client', overloadSet: ['submit(order)', 'submit(order, options)'],
    dispatchKind: 'method', constructorKind: 'not-constructor', callingConvention: 'napi', ffiBoundary: 'native-addon', exceptionModel: 'throws', effectKind: 'network', constraintKinds
  };
}

function routeProof(sourceLanguage, target) {
  return { id: `callable_route_proof_${sourceLanguage}_${target}`, kind: 'conversion-replay-proof', status: 'passed', routeId: `conversion_${sourceLanguage}_to_${target}`, sourceLanguage, target };
}

function capabilityMatrix(language, target, aliases = ['ts']) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 2800,
    languages: [{
      language, aliases, readiness: 'ready', imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target, lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: `fixture-${language}-${target}`, adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language, targets: [{ target, readiness: 'ready' }] }] } },
    metadata: { compileTargets: [target] }
  };
}
