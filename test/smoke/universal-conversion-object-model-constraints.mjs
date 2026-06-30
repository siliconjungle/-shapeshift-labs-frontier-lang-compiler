import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  createUniversalObjectModelConstraintEvidence,
  objectModelConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalObjectModelConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'frontier-lang',
  sourceObjectModelRecords: [
    { id: 'source_class', kind: 'class constructor field-initialization', classId: 'UserStore', constructorId: 'ctor:UserStore' },
    { id: 'source_dispatch', kind: 'virtual-dispatch override-rules super-dispatch', methodId: 'UserStore.save' }
  ],
  targetObjectModelRecords: [
    { id: 'target_class', kind: 'class constructor field-initialization', classId: 'UserStore', constructorId: 'ctor:UserStore' },
    { id: 'target_dispatch', kind: 'virtual-dispatch override-rules super-dispatch', methodId: 'UserStore.save' }
  ],
  evidenceIds: ['object_model_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-object-model-record');
assert.equal(preserved.requiredKinds.includes('class-construction'), true);
assert.equal(preserved.requiredKinds.includes('virtual-dispatch'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(objectModelConstraintMatches(preserved, { objectModelConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 947,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  evidence: [routeProof()],
  objectModelConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceObjectModelRecords: [
      { id: 'source_proto', kind: 'prototype-chain object-identity reference-semantics', prototypeId: 'AdminUser.prototype' },
      { id: 'source_method', kind: 'virtual-dispatch override-rules super-dispatch', methodId: 'AdminUser.save' }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  objectModelConstraintStatus: 'needs-evidence',
  objectModelConstraintMissingKind: 'virtual-dispatch'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.objectModelConstraint.status, 'needs-evidence');
assert.equal(route.objectModelConstraint.missingKinds.includes('prototype-chain'), true);
assert.equal(route.translationAdmission.objectModelConstraint.status, 'needs-evidence');
assert.equal(route.translationAdmission.objectModelConstraintMissingEvidence.includes('translation-object-model:virtual-dispatch'), true);
assert.equal(route.missingEvidence.includes('translation-object-model:virtual-dispatch'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('object-model'), true);
assert.equal(route.interlingua.constraints.families.includes('object-model'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'object-model' && obligation.kind === 'virtual-dispatch' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 948 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  objectModelConstraintMissingKind: 'virtual-dispatch',
  interlinguaConstraintFamily: 'object-model',
  interlinguaConstraintObligationKind: 'virtual-dispatch',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.objectModelConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.objectModelConstraintMissingKinds.includes('virtual-dispatch'), true);
assert.equal(artifacts.summary.compactCounts.objectModelConstraint.missingKinds['virtual-dispatch'], 1);
assert.equal(artifact.admissionRecord.objectModelConstraint.status, 'needs-evidence');

const worklist = createUniversalConversionWorklist(routePlan, { routeId: route.id });
const obligationWork = queryUniversalConversionWorklist(worklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'object-model',
  interlinguaConstraintObligationKind: 'virtual-dispatch',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationWork.found, true);
assert.equal(obligationWork.bestItem.action, 'collect-interlingua-obligation-evidence');
assert.equal(obligationWork.bestItem.tasks.some((task) => task.includes('virtual-dispatch')), true);

function routeProof() {
  return { id: 'object_model_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_javascript_to_rust', sourceLanguage: 'javascript', target: 'rust' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 947,
    languages: [{
      language: 'javascript',
      aliases: ['js'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target: 'rust', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-js-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture ready adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language: 'javascript', targets: [{ target: 'rust', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['rust'] }
  };
}
