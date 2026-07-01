import { assert } from './helpers.mjs';
import {
  adtPatternConstraintMatches,
  createUniversalAdtPatternConstraintEvidence,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  UniversalInterlinguaConstraintEdgeKinds,
  UniversalInterlinguaLayerKinds
} from './compiler-api.mjs';

const allKinds = [
  'adt-identity',
  'variant-identity',
  'payload-shape',
  'tag-discriminator',
  'constructor-shape',
  'pattern-binding',
  'destructuring',
  'match-dispatch',
  'exhaustiveness',
  'guard-condition',
  'wildcard-catchall',
  'fallthrough',
  'refutability',
  'recursive-variant',
  'option-result-convention',
  'nullability-encoding',
  'order-sensitive-case',
  'generic-variant',
  'layout-representation'
];

const preserved = createUniversalAdtPatternConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceAdtPatternRecords: [adtRecord('source_result_enum', allKinds)],
  targetAdtPatternRecords: [adtRecord('target_result_union', allKinds)],
  evidenceIds: ['adt_pattern_contract_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-adt-pattern-record');
assert.equal(preserved.requiredKinds.includes('exhaustiveness'), true);
assert.equal(preserved.requiredKinds.includes('payload-shape'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.adtEquivalenceClaim, false);
assert.equal(preserved.claims.patternExhaustivenessClaim, false);
assert.equal(preserved.claims.variantPayloadEquivalenceClaim, false);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(preserved.claims.autoMergeClaim, false);
assert.equal(adtPatternConstraintMatches(preserved, { adtPatternConstraintStatus: 'satisfied' }), true);

const failClosedWithoutTarget = createUniversalAdtPatternConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceAdtPatternRecords: [adtRecord('source_order_sum_type', [
    'adt-identity',
    'variant-identity',
    'payload-shape',
    'tag-discriminator',
    'match-dispatch',
    'exhaustiveness'
  ])]
});

assert.equal(failClosedWithoutTarget.status, 'needs-evidence');
assert.equal(failClosedWithoutTarget.action, 'collect-adt-pattern-evidence');
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-adt-pattern-target-evidence'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-adt-pattern-proof'), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Source enum/sum/pattern records')), true);
assert.equal(failClosedWithoutTarget.claims.adtEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.patternExhaustivenessClaim, false);
assert.equal(failClosedWithoutTarget.claims.semanticEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.autoMergeClaim, false);

const satisfiedRoutePlan = createUniversalConversionPlan({
  generatedAt: 1023,
  universalCapabilityMatrix: capabilityMatrix('rust', 'typescript'),
  targets: ['typescript'],
  evidence: [routeProof()],
  adtPatternConstraints: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceAdtPatternRecords: [adtRecord('satisfied_result_enum', allKinds)],
    targetAdtPatternRecords: [adtRecord('satisfied_result_tagged_union', allKinds)]
  }]
});
const satisfiedRoute = queryUniversalConversionPlan(satisfiedRoutePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  adtPatternConstraintStatus: 'satisfied',
  interlinguaConstraintFamily: 'adt-pattern',
  interlinguaConstraintObligationKind: 'exhaustiveness',
  interlinguaConstraintObligationStatus: 'represented'
}).bestRoute;

assert.equal(Boolean(satisfiedRoute), true);
assert.equal(satisfiedRoute.adtPatternConstraint.status, 'satisfied');
assert.equal(satisfiedRoute.adtPatternConstraint.missingKinds.length, 0);
assert.equal(satisfiedRoute.translationAdmission.adtPatternConstraintStatus, 'satisfied');
assert.equal(satisfiedRoute.translationAdmission.requiredConstructKinds.includes('adt-pattern-contract'), true);
assert.equal(satisfiedRoute.interlingua.constraints.families.includes('adt-pattern'), true);
assert.equal(satisfiedRoute.interlingua.claims.semanticEquivalenceClaim, false);
assert.equal(satisfiedRoute.autoMergeClaim, false);
assert.equal(satisfiedRoute.semanticEquivalenceClaim, false);

const routePlan = createUniversalConversionPlan({
  generatedAt: 1024,
  universalCapabilityMatrix: capabilityMatrix('rust', 'typescript'),
  targets: ['typescript'],
  evidence: [routeProof()],
  adtPatternConstraints: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceAdtPatternRecords: [adtRecord('route_result_enum', [
      'adt-identity',
      'variant-identity',
      'payload-shape',
      'tag-discriminator',
      'match-dispatch',
      'exhaustiveness',
      'guard-condition',
      'fallthrough'
    ])]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  adtPatternConstraintStatus: 'needs-evidence',
  adtPatternConstraintMissingKind: 'payload-shape',
  interlinguaConstraintFamily: 'adt-pattern',
  interlinguaConstraintMissingEvidence: 'translation-adt-pattern:payload-shape'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.adtPatternConstraint.status, 'needs-evidence');
assert.equal(route.adtPatternConstraint.missingKinds.includes('exhaustiveness'), true);
assert.equal(route.adtPatternConstraint.missingEvidence.includes('translation-adt-pattern:payload-shape'), true);
assert.equal(route.adtPatternConstraint.claims.patternExhaustivenessClaim, false);
assert.equal(route.adtPatternConstraint.claims.variantPayloadEquivalenceClaim, false);
assert.equal(route.missingEvidence.includes('translation-adt-pattern-proof'), true);
assert.equal(route.translationAdmission.adtPatternConstraintStatus, 'needs-evidence');
assert.equal(route.translationAdmission.adtPatternConstraintMissingEvidence.includes('translation-adt-pattern:payload-shape'), true);
assert.equal(route.translationAdmission.requiredConstructKinds.includes('adt-pattern-contract'), true);
assert.equal(UniversalInterlinguaLayerKinds.includes('adt-pattern-contract'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('adt-pattern'), true);
assert.equal(route.interlingua.layers.kinds.includes('adt-pattern-contract'), true);
assert.equal(route.interlingua.layers.missingKinds.includes('adt-pattern-contract'), true);
assert.equal(route.interlingua.constraints.families.includes('adt-pattern'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'adt-pattern' && obligation.kind === 'exhaustiveness' && obligation.status === 'missing'), true);
assert.equal(route.interlingua.claims.autoMergeClaim, false);
assert.equal(route.interlingua.claims.semanticEquivalenceClaim, false);
assert.equal(route.autoMergeClaim, false);
assert.equal(route.semanticEquivalenceClaim, false);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 1025 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  adtPatternConstraintMissingKind: 'exhaustiveness',
  adtPatternConstraintMissingEvidence: 'translation-adt-pattern:payload-shape',
  interlinguaConstraintFamily: 'adt-pattern',
  interlinguaConstraintObligationKind: 'exhaustiveness',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.adtPatternConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.adtPatternConstraintStatuses.includes('needs-evidence'), true);
assert.equal(artifacts.index.adtPatternConstraintMissingKinds.includes('payload-shape'), true);
assert.equal(artifacts.summary.compactCounts.adtPatternConstraint.missingKinds.exhaustiveness, 1);
assert.equal(artifact.admissionRecord.adtPatternConstraint.status, 'needs-evidence');
assert.equal(artifact.admissionRecord.metadata.adtPatternConstraint.status, 'needs-evidence');
assert.equal(artifact.materialization.autoMergeClaim, false);
assert.equal(artifact.materialization.semanticEquivalenceClaim, false);
assert.equal(artifact.autoMergeClaim, false);
assert.equal(artifact.semanticEquivalenceClaim, false);
assert.equal(artifacts.metadata.autoMergeClaim, false);
assert.equal(artifacts.metadata.semanticEquivalenceClaim, false);

function adtRecord(id, constraintKinds) {
  return {
    id,
    kind: 'sum type enum variant payload tagged switch match exhaustive guard default fallthrough',
    name: 'Result',
    variantNames: ['Ok', 'Err'],
    payloadFieldNames: ['value', 'error'],
    tagFieldNames: ['kind'],
    matchArmNames: ['Ok', 'Err'],
    guardKinds: ['if-present'],
    exhaustivenessKinds: ['sealed-total'],
    constraintKinds
  };
}

function routeProof() {
  return { id: 'adt_pattern_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_rust_to_typescript', sourceLanguage: 'rust', target: 'typescript' };
}

function capabilityMatrix(language, target) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 1024,
    languages: [{
      language,
      aliases: ['rs'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
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
