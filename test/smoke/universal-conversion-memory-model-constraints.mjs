import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  createUniversalMemoryModelConstraintEvidence,
  memoryModelConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalMemoryModelConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'frontier-lang',
  sourceMemoryModelRecords: [
    { id: 'source_atomic', kind: 'atomic load acquire', resourceId: 'counter', memoryOrder: 'acquire' },
    { id: 'source_lock', kind: 'mutex lock', resourceId: 'state', lockId: 'state_lock' }
  ],
  targetMemoryModelRecords: [
    { id: 'target_atomic', kind: 'atomic load acquire', resourceId: 'counter', memoryOrder: 'acquire' },
    { id: 'target_lock', kind: 'mutex lock', resourceId: 'state', lockId: 'state_lock' }
  ],
  evidenceIds: ['memory_model_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-memory-model-record');
assert.equal(preserved.requiredKinds.includes('atomic-ordering'), true);
assert.equal(preserved.requiredKinds.includes('lock-discipline'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.dataRaceFreedomClaim, false);
assert.equal(memoryModelConstraintMatches(preserved, { memoryModelConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 918,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  evidence: [routeProof()],
  memoryModelConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceMemoryModelRecords: [
      { id: 'source_sab', kind: 'shared-array-buffer atomic compare-exchange', resourceId: 'buffer', memoryOrder: 'seq-cst' },
      { id: 'source_worker', kind: 'worker thread boundary happens-before', synchronizationKey: 'worker:message' }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  memoryModelConstraintStatus: 'needs-evidence',
  memoryModelConstraintMissingKind: 'shared-memory'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.memoryModelConstraint.status, 'needs-evidence');
assert.equal(route.memoryModelConstraint.missingKinds.includes('atomic-ordering'), true);
assert.equal(route.translationAdmission.memoryModelConstraint.status, 'needs-evidence');
assert.equal(route.translationAdmission.memoryModelConstraintMissingEvidence.includes('translation-memory-model:shared-memory'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('memory-model'), true);
assert.equal(route.interlingua.constraints.families.includes('memory-model'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'memory-model' && obligation.kind === 'shared-memory' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 919 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  memoryModelConstraintMissingKind: 'shared-memory',
  interlinguaConstraintFamily: 'memory-model',
  interlinguaConstraintObligationKind: 'shared-memory',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.memoryModelConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.memoryModelConstraintMissingKinds.includes('shared-memory'), true);
assert.equal(artifacts.summary.compactCounts.memoryModelConstraint.missingKinds['shared-memory'], 1);
assert.equal(artifact.admissionRecord.memoryModelConstraint.status, 'needs-evidence');

const worklist = createUniversalConversionWorklist(routePlan, { routeId: route.id });
const obligationWork = queryUniversalConversionWorklist(worklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'memory-model',
  interlinguaConstraintObligationKind: 'shared-memory',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationWork.found, true);
assert.equal(obligationWork.bestItem.action, 'collect-interlingua-obligation-evidence');
assert.equal(obligationWork.bestItem.tasks.some((task) => task.includes('shared-memory')), true);

function routeProof() {
  return { id: 'memory_model_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_javascript_to_rust', sourceLanguage: 'javascript', target: 'rust' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 918,
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
