import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalNumericSemanticsConstraintEvidence,
  numericSemanticsConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  UniversalInterlinguaConstraintEdgeKinds,
  UniversalInterlinguaLayerKinds
} from './compiler-api.mjs';

const numericKinds = [
  'numeric-type',
  'integer-width',
  'signedness',
  'overflow-behavior',
  'division-semantics',
  'modulo-remainder',
  'floating-point-format',
  'rounding-mode',
  'nan-infinity',
  'numeric-coercion',
  'bigint-semantics',
  'decimal-semantics',
  'literal-parsing',
  'bitwise-semantics',
  'numeric-ordering'
];

const preserved = createUniversalNumericSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceNumericSemanticsRecords: [numericRecord('source_numeric_contract', numericKinds)],
  targetNumericSemanticsRecords: [numericRecord('target_numeric_contract', numericKinds)],
  evidenceIds: ['numeric_semantics_contract_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-numeric-semantics-record');
assert.equal(preserved.requiredKinds.includes('overflow-behavior'), true);
assert.equal(preserved.requiredKinds.includes('nan-infinity'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.numericEquivalenceClaim, false);
assert.equal(preserved.claims.arithmeticEquivalenceClaim, false);
assert.equal(preserved.claims.floatingPointEquivalenceClaim, false);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(preserved.claims.autoMergeClaim, false);
assert.equal(numericSemanticsConstraintMatches(preserved, { numericSemanticsConstraintStatus: 'satisfied' }), true);

const failClosedWithoutTarget = createUniversalNumericSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceNumericSemanticsRecords: [numericRecord('source_integer_math', [
    'integer-width',
    'signedness',
    'overflow-behavior',
    'division-semantics',
    'modulo-remainder'
  ])]
});

assert.equal(failClosedWithoutTarget.status, 'needs-evidence');
assert.equal(failClosedWithoutTarget.action, 'collect-numeric-semantics-evidence');
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-numeric-semantics-target-evidence'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-numeric-semantics-proof'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-numeric-semantics:overflow-behavior'), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Integer overflow')), true);
assert.equal(failClosedWithoutTarget.claims.numericEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.semanticEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.autoMergeClaim, false);

const preserveSource = createUniversalConversionPlan({
  generatedAt: 2301,
  universalCapabilityMatrix: capabilityMatrix('typescript', 'typescript', ['ts']),
  targets: ['typescript'],
  evidence: [routeProof('typescript', 'typescript')],
  numericSemanticsConstraints: [{
    sourceLanguage: 'typescript',
    target: 'typescript',
    sourceNumericSemanticsRecords: [numericRecord('same_language_number_contract', ['numeric-type', 'floating-point-format', 'nan-infinity'])]
  }]
});
const preserveRoute = queryUniversalConversionPlan(preserveSource, {
  sourceLanguage: 'typescript',
  target: 'typescript',
  numericSemanticsConstraintStatus: 'satisfied'
}).bestRoute;

assert.equal(Boolean(preserveRoute), true);
assert.equal(preserveRoute.mode, 'preserve-source');
assert.equal(preserveRoute.numericSemanticsConstraint.status, 'satisfied');
assert.equal(preserveRoute.numericSemanticsConstraint.missingEvidence.length, 0);
assert.equal(preserveRoute.translationAdmission.numericSemanticsConstraintStatus, 'satisfied');
assert.equal(preserveRoute.semanticEquivalenceClaim, false);

const routePlan = createUniversalConversionPlan({
  generatedAt: 2302,
  universalCapabilityMatrix: capabilityMatrix('rust', 'typescript'),
  targets: ['typescript'],
  evidence: [routeProof('rust', 'typescript')],
  imports: [{ language: 'rust', numericSemanticsRecords: [numericRecord('imported_u32_contract', ['integer-width', 'overflow-behavior', 'division-semantics'])] }],
  numericSemanticsConstraints: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceNumericSemanticsRecords: [numericRecord('route_numeric_contract', [
      'integer-width',
      'signedness',
      'overflow-behavior',
      'division-semantics',
      'modulo-remainder',
      'floating-point-format',
      'rounding-mode',
      'nan-infinity'
    ])],
    targetNumericSemanticsRecords: [{ id: 'target_partial_contract', kind: 'numeric', constraintKinds: ['integer-width', 'signedness'] }]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  numericSemanticsConstraintStatus: 'degraded',
  numericSemanticsConstraintMissingKind: 'overflow-behavior',
  interlinguaConstraintFamily: 'numeric-semantics',
  interlinguaConstraintObligationKind: 'overflow-behavior',
  interlinguaConstraintObligationStatus: 'missing'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.numericSemanticsConstraint.status, 'degraded');
assert.equal(route.numericSemanticsConstraint.missingKinds.includes('overflow-behavior'), true);
assert.equal(route.numericSemanticsConstraint.missingEvidence.includes('translation-numeric-semantics:division-semantics'), true);
assert.equal(route.missingEvidence.includes('translation-numeric-semantics-proof'), true);
assert.equal(route.translationAdmission.numericSemanticsConstraintStatus, 'degraded');
assert.equal(route.translationAdmission.requiredConstructKinds.includes('numeric-semantics-contract'), true);
assert.equal(route.interlingua.layers.kinds.includes('numeric-semantics-contract'), true);
assert.equal(route.interlingua.constraints.families.includes('numeric-semantics'), true);
const numericOverflowObligation = route.interlingua.constraints.obligations.find((obligation) => obligation.family === 'numeric-semantics' && obligation.kind === 'overflow-behavior');
assert.equal(numericOverflowObligation.status, 'missing');
assert.equal(numericOverflowObligation.sourceNodeIds.includes('route_numeric_contract'), true);
assert.equal(numericOverflowObligation.targetNodeIds.length, 0);
assert.equal(UniversalInterlinguaLayerKinds.includes('numeric-semantics-contract'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('numeric-semantics'), true);
assert.equal(route.autoMergeClaim, false);
assert.equal(route.semanticEquivalenceClaim, false);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 2303 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  numericSemanticsConstraintMissingKind: 'overflow-behavior',
  numericSemanticsConstraintMissingEvidence: 'translation-numeric-semantics:division-semantics',
  interlinguaConstraintFamily: 'numeric-semantics',
  interlinguaConstraintObligationKind: 'overflow-behavior',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.numericSemanticsConstraint.status, 'degraded');
assert.equal(artifacts.index.numericSemanticsConstraintStatuses.includes('degraded'), true);
assert.equal(artifacts.index.numericSemanticsConstraintMissingKinds.includes('overflow-behavior'), true);
assert.equal(artifacts.summary.compactCounts.numericSemanticsConstraint.missingKinds['overflow-behavior'], 1);
assert.equal(artifact.admissionRecord.numericSemanticsConstraint.status, 'degraded');
assert.equal(artifact.admissionRecord.metadata.numericSemanticsConstraint.status, 'degraded');
assert.equal(artifact.materialization.autoMergeClaim, false);
assert.equal(artifact.materialization.semanticEquivalenceClaim, false);
assert.equal(artifact.autoMergeClaim, false);
assert.equal(artifact.semanticEquivalenceClaim, false);
assert.equal(artifacts.metadata.autoMergeClaim, false);
assert.equal(artifacts.metadata.semanticEquivalenceClaim, false);

function numericRecord(id, constraintKinds) {
  return {
    id,
    kind: 'numeric',
    name: 'Counter',
    width: 32,
    signedness: 'unsigned',
    overflowMode: 'wrapping',
    divisionMode: 'truncating',
    moduloMode: 'remainder',
    floatFormat: 'ieee-binary64',
    roundingMode: 'nearest-even',
    specialValues: ['nan', 'infinity', 'signed-zero'],
    coercionKinds: ['widening', 'narrowing'],
    literalKinds: ['decimal', 'hex', 'suffix'],
    constraintKinds
  };
}

function routeProof(sourceLanguage, target) {
  return { id: `numeric_route_proof_${sourceLanguage}_${target}`, kind: 'conversion-replay-proof', status: 'passed', routeId: `conversion_${sourceLanguage}_to_${target}`, sourceLanguage, target };
}

function capabilityMatrix(language, target, aliases = ['rs']) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 2300,
    languages: [{
      language,
      aliases,
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target, lossClass: target === language ? 'targetAdapterProjection' : 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: `fixture-${language}-${target}`, adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language, targets: [{ target, readiness: 'ready' }] }] } },
    metadata: { compileTargets: [target] }
  };
}
