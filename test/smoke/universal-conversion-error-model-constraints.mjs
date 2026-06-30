import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  createUniversalErrorModelConstraintEvidence,
  errorModelConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalErrorModelConstraintEvidence({
  sourceLanguage: 'java',
  target: 'frontier-lang',
  sourceErrorModelRecords: [
    { id: 'source_checked', kind: 'checked-exception throws declaration', errorType: 'IOException' },
    { id: 'source_cleanup', kind: 'finally cleanup-boundary', boundaryId: 'cleanup:socket' }
  ],
  targetErrorModelRecords: [
    { id: 'target_checked', kind: 'checked-exception throws declaration', errorType: 'IOException' },
    { id: 'target_cleanup', kind: 'finally cleanup-boundary', boundaryId: 'cleanup:socket' }
  ],
  evidenceIds: ['error_model_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-error-model-record');
assert.equal(preserved.requiredKinds.includes('checked-exception'), true);
assert.equal(preserved.requiredKinds.includes('cleanup-boundary'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(errorModelConstraintMatches(preserved, { errorModelConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 929,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  evidence: [routeProof()],
  errorModelConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceErrorModelRecords: [
      { id: 'source_throw', kind: 'throw exception catch recovery', errorType: 'SyntaxError' },
      { id: 'source_finally', kind: 'finally cleanup-boundary', boundaryId: 'parser:cleanup' }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  errorModelConstraintStatus: 'needs-evidence',
  errorModelConstraintMissingKind: 'cleanup-boundary'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.errorModelConstraint.status, 'needs-evidence');
assert.equal(route.errorModelConstraint.missingKinds.includes('throw-exception'), true);
assert.equal(route.translationAdmission.errorModelConstraint.status, 'needs-evidence');
assert.equal(route.translationAdmission.errorModelConstraintMissingEvidence.includes('translation-error-model:cleanup-boundary'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('error-model'), true);
assert.equal(route.interlingua.constraints.families.includes('error-model'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'error-model' && obligation.kind === 'cleanup-boundary' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 930 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  errorModelConstraintMissingKind: 'cleanup-boundary',
  interlinguaConstraintFamily: 'error-model',
  interlinguaConstraintObligationKind: 'cleanup-boundary',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.errorModelConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.errorModelConstraintMissingKinds.includes('cleanup-boundary'), true);
assert.equal(artifacts.summary.compactCounts.errorModelConstraint.missingKinds['cleanup-boundary'], 1);
assert.equal(artifact.admissionRecord.errorModelConstraint.status, 'needs-evidence');

const worklist = createUniversalConversionWorklist(routePlan, { routeId: route.id });
const obligationWork = queryUniversalConversionWorklist(worklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'error-model',
  interlinguaConstraintObligationKind: 'cleanup-boundary',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationWork.found, true);
assert.equal(obligationWork.bestItem.action, 'collect-interlingua-obligation-evidence');
assert.equal(obligationWork.bestItem.tasks.some((task) => task.includes('cleanup-boundary')), true);

function routeProof() {
  return { id: 'error_model_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_javascript_to_rust', sourceLanguage: 'javascript', target: 'rust' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 929,
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
