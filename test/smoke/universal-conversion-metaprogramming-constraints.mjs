import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalMetaprogrammingConstraintEvidence,
  metaprogrammingConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalMetaprogrammingConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'frontier-lang',
  sourceMetaprogrammingRecords: [
    { id: 'source_derive_user', kind: 'procedural-macro derive-macro macro-hygiene expansion-order', expansionId: 'derive_User', evidenceIds: ['source_expansion'] },
    { id: 'source_generated_map', kind: 'preprocessor include conditional-compilation generated-source-map', generatedSourcePath: 'target/generated/user.ts' }
  ],
  targetMetaprogrammingRecords: [
    { id: 'target_derive_user', kind: 'procedural-macro derive-macro macro-hygiene expansion-order', expansionId: 'derive_User', evidenceIds: ['target_expansion'] },
    { id: 'target_generated_map', kind: 'preprocessor include conditional-compilation generated-source-map', generatedSourcePath: 'target/generated/user.ts' }
  ],
  evidenceIds: ['metaprogramming_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-metaprogramming-record');
assert.equal(preserved.requiredKinds.includes('procedural-macro'), true);
assert.equal(preserved.requiredKinds.includes('macro-hygiene'), true);
assert.equal(preserved.requiredKinds.includes('generated-source-map'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.expansionEquivalenceClaim, false);
assert.equal(preserved.claims.macroHygieneClaim, false);
assert.equal(preserved.claims.generatedSourceEquivalenceClaim, false);
assert.equal(metaprogrammingConstraintMatches(preserved, { metaprogrammingConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 930,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['typescript'],
  evidence: [routeProof()],
  metaprogrammingConstraints: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceMetaprogrammingRecords: [
      { id: 'source_proc_macro', kind: 'procedural-macro derive-macro macro-hygiene expansion-order', expansionId: 'derive_User' },
      { id: 'source_cfg_codegen', kind: 'preprocessor include conditional-compilation generated-source-map', generatedSourcePath: 'target/generated/user.ts' }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  metaprogrammingConstraintStatus: 'needs-evidence',
  metaprogrammingConstraintMissingKind: 'procedural-macro'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.metaprogrammingConstraint.status, 'needs-evidence');
assert.equal(route.metaprogrammingConstraint.missingKinds.includes('macro-hygiene'), true);
assert.equal(route.missingEvidence.includes('translation-metaprogramming:procedural-macro'), true);
assert.equal(route.translationAdmission.status, 'needs-evidence');
assert.equal(route.translationAdmission.metaprogrammingConstraintStatus, 'needs-evidence');
assert.equal(route.translationAdmission.metaprogrammingConstraintMissingEvidence.includes('translation-metaprogramming:macro-hygiene'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('metaprogramming'), true);
assert.equal(route.interlingua.constraints.families.includes('metaprogramming'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'metaprogramming' && obligation.kind === 'procedural-macro' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 931 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  metaprogrammingConstraintMissingKind: 'procedural-macro',
  interlinguaConstraintFamily: 'metaprogramming',
  interlinguaConstraintObligationKind: 'procedural-macro',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.metaprogrammingConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.metaprogrammingConstraintMissingKinds.includes('procedural-macro'), true);
assert.equal(artifacts.summary.compactCounts.metaprogrammingConstraint.missingKinds['procedural-macro'], 1);
assert.equal(artifact.admissionRecord.metaprogrammingConstraint.status, 'needs-evidence');
assert.equal(artifact.admissionRecord.metadata.metaprogrammingConstraint.status, 'needs-evidence');

function routeProof() {
  return { id: 'metaprogramming_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_rust_to_typescript', sourceLanguage: 'rust', target: 'typescript' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 930,
    languages: [{
      language: 'rust',
      aliases: [],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target: 'typescript', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-rust-typescript', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture ready adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language: 'rust', targets: [{ target: 'typescript', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['typescript'] }
  };
}
