import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  createUniversalEvaluationModelConstraintEvidence,
  evaluationModelConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalEvaluationModelConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'frontier-lang',
  sourceEvaluationModelRecords: [
    { id: 'source_short_circuit', kind: 'short-circuit logical-and left-to-right', expressionId: 'expr:guard' },
    { id: 'source_equality', kind: 'strict-equal equality numeric-coercion', operator: '===' }
  ],
  targetEvaluationModelRecords: [
    { id: 'target_short_circuit', kind: 'short-circuit logical-and left-to-right', expressionId: 'expr:guard' },
    { id: 'target_equality', kind: 'strict-equal equality numeric-coercion', operator: '===' }
  ],
  evidenceIds: ['evaluation_model_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-evaluation-model-record');
assert.equal(preserved.requiredKinds.includes('short-circuit'), true);
assert.equal(preserved.requiredKinds.includes('equality-semantics'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(evaluationModelConstraintMatches(preserved, { evaluationModelConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 941,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  evidence: [routeProof()],
  evaluationModelConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceEvaluationModelRecords: [
      { id: 'source_truthy', kind: 'truthiness boolean-context', expressionId: 'expr:if_user' },
      { id: 'source_div', kind: 'integer-division numeric-coercion modulo', operator: '/' }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  evaluationModelConstraintStatus: 'needs-evidence',
  evaluationModelConstraintMissingKind: 'integer-division'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.evaluationModelConstraint.status, 'needs-evidence');
assert.equal(route.evaluationModelConstraint.missingKinds.includes('truthiness'), true);
assert.equal(route.translationAdmission.evaluationModelConstraint.status, 'needs-evidence');
assert.equal(route.translationAdmission.evaluationModelConstraintMissingEvidence.includes('translation-evaluation-model:integer-division'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('evaluation-model'), true);
assert.equal(route.interlingua.constraints.families.includes('evaluation-model'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'evaluation-model' && obligation.kind === 'integer-division' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 942 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  evaluationModelConstraintMissingKind: 'integer-division',
  interlinguaConstraintFamily: 'evaluation-model',
  interlinguaConstraintObligationKind: 'integer-division',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.evaluationModelConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.evaluationModelConstraintMissingKinds.includes('integer-division'), true);
assert.equal(artifacts.summary.compactCounts.evaluationModelConstraint.missingKinds['integer-division'], 1);
assert.equal(artifact.admissionRecord.evaluationModelConstraint.status, 'needs-evidence');

const worklist = createUniversalConversionWorklist(routePlan, { routeId: route.id });
const obligationWork = queryUniversalConversionWorklist(worklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'evaluation-model',
  interlinguaConstraintObligationKind: 'integer-division',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationWork.found, true);
assert.equal(obligationWork.bestItem.action, 'collect-interlingua-obligation-evidence');
assert.equal(obligationWork.bestItem.tasks.some((task) => task.includes('integer-division')), true);

function routeProof() {
  return { id: 'evaluation_model_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_javascript_to_rust', sourceLanguage: 'javascript', target: 'rust' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 941,
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
