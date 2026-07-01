import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalSerializationSemanticsConstraintEvidence,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  serializationSemanticsConstraintMatches,
  UniversalInterlinguaConstraintEdgeKinds,
  UniversalInterlinguaLayerKinds
} from './compiler-api.mjs';

const serializationKinds = [
  'serialization-format', 'wire-format', 'field-naming', 'field-order', 'default-values', 'nullability', 'unknown-fields', 'enum-tagging',
  'binary-endianness', 'binary-alignment', 'varint-encoding', 'schema-versioning', 'canonicalization', 'deterministic-output',
  'precision-loss', 'roundtrip-stability', 'validation', 'security-escaping', 'streaming-framing', 'codec-runtime'
];

const preserved = createUniversalSerializationSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceSerializationSemanticsRecords: [serializationRecord('source_wire_contract', serializationKinds)],
  targetSerializationSemanticsRecords: [serializationRecord('target_wire_contract', serializationKinds)],
  evidenceIds: ['serialization_semantics_contract_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-serialization-semantics-record');
assert.equal(preserved.requiredKinds.includes('schema-versioning'), true);
assert.equal(preserved.requiredKinds.includes('roundtrip-stability'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.serializationEquivalenceClaim, false);
assert.equal(preserved.claims.wireEquivalenceClaim, false);
assert.equal(preserved.claims.roundtripEquivalenceClaim, false);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(preserved.claims.autoMergeClaim, false);
assert.equal(serializationSemanticsConstraintMatches(preserved, { serializationSemanticsConstraintStatus: 'satisfied' }), true);

const failClosedWithoutTarget = createUniversalSerializationSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceSerializationSemanticsRecords: [serializationRecord('source_json_schema_contract', [
    'serialization-format', 'field-naming', 'default-values', 'unknown-fields', 'schema-versioning', 'canonicalization', 'roundtrip-stability'
  ])]
});

assert.equal(failClosedWithoutTarget.status, 'needs-evidence');
assert.equal(failClosedWithoutTarget.action, 'collect-serialization-semantics-evidence');
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-serialization-semantics-target-evidence'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-serialization-semantics-proof'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-serialization-semantics:canonicalization'), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Field')), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Schema')), true);
assert.equal(failClosedWithoutTarget.claims.semanticEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.autoMergeClaim, false);

const preserveSource = createUniversalConversionPlan({
  generatedAt: 2601,
  universalCapabilityMatrix: capabilityMatrix('typescript', 'typescript', ['ts']),
  targets: ['typescript'],
  evidence: [routeProof('typescript', 'typescript')],
  serializationSemanticsConstraints: [{
    sourceLanguage: 'typescript',
    target: 'typescript',
    sourceSerializationSemanticsRecords: [serializationRecord('same_language_json_contract', ['serialization-format', 'field-naming', 'roundtrip-stability'])]
  }]
});
const preserveRoute = queryUniversalConversionPlan(preserveSource, {
  sourceLanguage: 'typescript',
  target: 'typescript',
  serializationSemanticsConstraintStatus: 'satisfied'
}).bestRoute;

assert.equal(Boolean(preserveRoute), true);
assert.equal(preserveRoute.mode, 'preserve-source');
assert.equal(preserveRoute.serializationSemanticsConstraint.status, 'satisfied');
assert.equal(preserveRoute.serializationSemanticsConstraint.missingEvidence.length, 0);
assert.equal(preserveRoute.translationAdmission.serializationSemanticsConstraintStatus, 'satisfied');
assert.equal(preserveRoute.semanticEquivalenceClaim, false);

const routePlan = createUniversalConversionPlan({
  generatedAt: 2602,
  universalCapabilityMatrix: capabilityMatrix('rust', 'typescript'),
  targets: ['typescript'],
  evidence: [routeProof('rust', 'typescript')],
  imports: [{ language: 'rust', serializationSemanticsRecords: [serializationRecord('imported_serde_contract', ['serialization-format', 'schema-versioning'])] }],
  serializationSemanticsConstraints: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceSerializationSemanticsRecords: [serializationRecord('route_serialization_contract', serializationKinds)],
    targetSerializationSemanticsRecords: [{ id: 'target_partial_json_contract', constraintKinds: ['serialization-format', 'field-naming'] }]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  serializationSemanticsConstraintStatus: 'degraded',
  serializationSemanticsConstraintMissingKind: 'canonicalization',
  interlinguaConstraintFamily: 'serialization-semantics',
  interlinguaConstraintObligationKind: 'canonicalization',
  interlinguaConstraintObligationStatus: 'missing'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.serializationSemanticsConstraint.status, 'degraded');
assert.equal(route.serializationSemanticsConstraint.missingKinds.includes('canonicalization'), true);
assert.equal(route.serializationSemanticsConstraint.missingEvidence.includes('translation-serialization-semantics:roundtrip-stability'), true);
assert.equal(route.missingEvidence.includes('translation-serialization-semantics-proof'), true);
assert.equal(route.translationAdmission.serializationSemanticsConstraintStatus, 'degraded');
assert.equal(route.translationAdmission.requiredConstructKinds.includes('serialization-semantics-contract'), true);
assert.equal(route.interlingua.layers.kinds.includes('serialization-semantics-contract'), true);
assert.equal(route.interlingua.constraints.families.includes('serialization-semantics'), true);
const canonicalObligation = route.interlingua.constraints.obligations.find((obligation) => obligation.family === 'serialization-semantics' && obligation.kind === 'canonicalization');
assert.equal(canonicalObligation.status, 'missing');
assert.equal(canonicalObligation.sourceNodeIds.includes('route_serialization_contract'), true);
assert.equal(canonicalObligation.targetNodeIds.length, 0);
assert.equal(UniversalInterlinguaLayerKinds.includes('serialization-semantics-contract'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('serialization-semantics'), true);
assert.equal(route.autoMergeClaim, false);
assert.equal(route.semanticEquivalenceClaim, false);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 2603 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  serializationSemanticsConstraintMissingKind: 'canonicalization',
  serializationSemanticsConstraintMissingEvidence: 'translation-serialization-semantics:roundtrip-stability',
  interlinguaConstraintFamily: 'serialization-semantics',
  interlinguaConstraintObligationKind: 'canonicalization',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.serializationSemanticsConstraint.status, 'degraded');
assert.equal(artifacts.index.serializationSemanticsConstraintStatuses.includes('degraded'), true);
assert.equal(artifacts.index.serializationSemanticsConstraintMissingKinds.includes('canonicalization'), true);
assert.equal(artifacts.summary.compactCounts.serializationSemanticsConstraint.missingKinds.canonicalization, 1);
assert.equal(artifact.admissionRecord.serializationSemanticsConstraint.status, 'degraded');
assert.equal(artifact.admissionRecord.metadata.serializationSemanticsConstraint.status, 'degraded');
assert.equal(artifact.materialization.autoMergeClaim, false);
assert.equal(artifact.materialization.semanticEquivalenceClaim, false);
assert.equal(artifact.autoMergeClaim, false);
assert.equal(artifact.semanticEquivalenceClaim, false);

function serializationRecord(id, constraintKinds) {
  return {
    id,
    name: 'UserWireV1',
    format: 'json',
    wireFormat: 'utf8-json',
    codec: 'serde-json',
    schema: 'UserWireV1',
    fieldNaming: 'snake_case',
    fieldOrder: 'canonical',
    omittedFields: 'skip-default',
    defaultValues: 'materialized-defaults',
    nullSemantics: 'explicit-null',
    unknownFields: 'deny',
    enumEncoding: 'adjacent-tag',
    endianness: 'little-endian',
    alignment: 'packed',
    varint: 'leb128',
    schemaVersion: 'v1',
    compatibility: 'backward-compatible',
    canonicalization: 'canonical-json',
    deterministic: 'stable-output',
    precision: 'lossless-decimal-string',
    roundtrip: 'decode-encode-stable',
    validation: 'schema-required',
    escaping: 'json-string-escaping',
    streaming: 'framed',
    framing: 'newline-delimited',
    constraintKinds
  };
}

function routeProof(sourceLanguage, target) {
  return { id: `serialization_route_proof_${sourceLanguage}_${target}`, kind: 'conversion-replay-proof', status: 'passed', routeId: `conversion_${sourceLanguage}_to_${target}`, sourceLanguage, target };
}

function capabilityMatrix(language, target, aliases = ['rs']) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 2600,
    languages: [{
      language,
      aliases,
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
