import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalScopeBindingConstraintEvidence,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  scopeBindingConstraintMatches,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalScopeBindingConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'frontier-lang',
  sourceScopeBindingRecords: [
    { id: 'source_read_user_binding', kind: 'lexical scope binding-identity use-def reference', bindingId: 'binding_readUser', referenceId: 'ref_readUser', evidenceIds: ['source_scope'] },
    { id: 'source_closure_capture', kind: 'closure capture mutable-capture receiver-binding type-value namespace', name: 'count' }
  ],
  targetScopeBindingRecords: [
    { id: 'target_read_user_binding', kind: 'lexical scope binding-identity use-def reference', bindingId: 'binding_readUser', referenceId: 'ref_readUser', evidenceIds: ['target_scope'] },
    { id: 'target_closure_capture', kind: 'closure capture mutable-capture receiver-binding type-value namespace', name: 'count' }
  ],
  evidenceIds: ['scope_binding_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-scope-binding-record');
assert.equal(preserved.requiredKinds.includes('binding-identity'), true);
assert.equal(preserved.requiredKinds.includes('use-def-edge'), true);
assert.equal(preserved.requiredKinds.includes('closure-capture'), true);
assert.equal(preserved.requiredKinds.includes('type-value-namespace'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.nameResolutionEquivalenceClaim, false);
assert.equal(preserved.claims.closureEquivalenceClaim, false);
assert.equal(scopeBindingConstraintMatches(preserved, { scopeBindingConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 940,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  evidence: [routeProof()],
  scopeBindingConstraints: [{
    sourceLanguage: 'typescript',
    target: 'rust',
    sourceScopeBindingRecords: [
      { id: 'source_read_binding', kind: 'lexical scope binding-identity use-def reference', bindingId: 'binding_readUser', referenceId: 'ref_readUser' },
      { id: 'source_closure', kind: 'closure capture mutable-capture receiver-binding', name: 'count' },
      { id: 'source_dynamic_lookup', kind: 'dynamic-lookup late-binding type-value namespace', name: 'record[key]' }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'typescript',
  target: 'rust',
  scopeBindingConstraintStatus: 'needs-evidence',
  scopeBindingConstraintMissingKind: 'closure-capture'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.scopeBindingConstraint.status, 'needs-evidence');
assert.equal(route.scopeBindingConstraint.missingKinds.includes('dynamic-lookup'), true);
assert.equal(route.missingEvidence.includes('translation-scope-binding:closure-capture'), true);
assert.equal(route.translationAdmission.status, 'needs-evidence');
assert.equal(route.translationAdmission.scopeBindingConstraintStatus, 'needs-evidence');
assert.equal(route.translationAdmission.scopeBindingConstraintMissingEvidence.includes('translation-scope-binding:dynamic-lookup'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('scope-binding'), true);
assert.equal(route.interlingua.constraints.families.includes('scope-binding'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'scope-binding' && obligation.kind === 'closure-capture' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 941 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  scopeBindingConstraintMissingKind: 'closure-capture',
  interlinguaConstraintFamily: 'scope-binding',
  interlinguaConstraintObligationKind: 'closure-capture',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.scopeBindingConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.scopeBindingConstraintMissingKinds.includes('closure-capture'), true);
assert.equal(artifacts.summary.compactCounts.scopeBindingConstraint.missingKinds['closure-capture'], 1);
assert.equal(artifact.admissionRecord.scopeBindingConstraint.status, 'needs-evidence');
assert.equal(artifact.admissionRecord.metadata.scopeBindingConstraint.status, 'needs-evidence');

function routeProof() {
  return { id: 'scope_binding_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_typescript_to_rust', sourceLanguage: 'typescript', target: 'rust' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 940,
    languages: [{
      language: 'typescript',
      aliases: [],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target: 'rust', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-typescript-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture ready adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language: 'typescript', targets: [{ target: 'rust', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['rust'] }
  };
}
