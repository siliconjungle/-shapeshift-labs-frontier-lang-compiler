import { assert } from './helpers.mjs';
import {
  concurrencyModelConstraintMatches,
  createUniversalConcurrencyModelConstraintEvidence,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalConcurrencyModelConstraintEvidence({
  sourceLanguage: 'swift',
  target: 'frontier-lang',
  sourceConcurrencyModelRecords: [
    { id: 'source_group', kind: 'structured-concurrency task-group', taskId: 'task:load' },
    { id: 'source_actor', kind: 'main-actor scheduler-affinity actor isolation', actorId: 'MainActor' }
  ],
  targetConcurrencyModelRecords: [
    { id: 'target_group', kind: 'structured-concurrency task-group', taskId: 'task:load' },
    { id: 'target_actor', kind: 'main-actor scheduler-affinity actor isolation', actorId: 'MainActor' }
  ],
  evidenceIds: ['concurrency_model_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-concurrency-model-record');
assert.equal(preserved.requiredKinds.includes('structured-concurrency'), true);
assert.equal(preserved.requiredKinds.includes('scheduler-affinity'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(concurrencyModelConstraintMatches(preserved, { concurrencyModelConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 931,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  evidence: [routeProof()],
  concurrencyModelConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceConcurrencyModelRecords: [
      { id: 'source_async', kind: 'async promise scheduler microtask', taskId: 'task:parse' },
      { id: 'source_cancel', kind: 'cancellation abort-signal', cancellationKey: 'abort:parse' }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  concurrencyModelConstraintStatus: 'needs-evidence',
  concurrencyModelConstraintMissingKind: 'cancellation-propagation'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.concurrencyModelConstraint.status, 'needs-evidence');
assert.equal(route.concurrencyModelConstraint.missingKinds.includes('async-task'), true);
assert.equal(route.translationAdmission.concurrencyModelConstraint.status, 'needs-evidence');
assert.equal(route.translationAdmission.concurrencyModelConstraintMissingEvidence.includes('translation-concurrency-model:cancellation-propagation'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('concurrency-model'), true);
assert.equal(route.interlingua.constraints.families.includes('concurrency-model'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'concurrency-model' && obligation.kind === 'cancellation-propagation' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 932 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  concurrencyModelConstraintMissingKind: 'cancellation-propagation',
  interlinguaConstraintFamily: 'concurrency-model',
  interlinguaConstraintObligationKind: 'cancellation-propagation',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.concurrencyModelConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.concurrencyModelConstraintMissingKinds.includes('cancellation-propagation'), true);
assert.equal(artifacts.summary.compactCounts.concurrencyModelConstraint.missingKinds['cancellation-propagation'], 1);
assert.equal(artifact.admissionRecord.concurrencyModelConstraint.status, 'needs-evidence');

const worklist = createUniversalConversionWorklist(routePlan, { routeId: route.id });
const obligationWork = queryUniversalConversionWorklist(worklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'concurrency-model',
  interlinguaConstraintObligationKind: 'cancellation-propagation',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationWork.found, true);
assert.equal(obligationWork.bestItem.action, 'collect-interlingua-obligation-evidence');
assert.equal(obligationWork.bestItem.tasks.some((task) => task.includes('cancellation-propagation')), true);

function routeProof() {
  return { id: 'concurrency_model_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_javascript_to_rust', sourceLanguage: 'javascript', target: 'rust' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 931,
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
