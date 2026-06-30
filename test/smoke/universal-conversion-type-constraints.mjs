import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalTypeConstraintEvidence,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const degradedTypeConstraints = createUniversalTypeConstraintEvidence({
  routeId: 'typescript_to_rust_public_api',
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceTypes: [
    { id: 'read_user_api', kind: 'public function', signatureHash: 'sig_read_user' },
    { id: 'result_type_param', kind: 'generic type-parameter' },
    { id: 'nickname_property', kind: 'property', optional: true }
  ],
  targetTypes: [{ id: 'read_user_rust_api', kind: 'public function', signatureHash: 'sig_read_user' }]
});
assert.equal(degradedTypeConstraints.status, 'degraded');
assert.equal(degradedTypeConstraints.missingKinds.includes('generic-parameters'), true);
assert.equal(degradedTypeConstraints.missingKinds.includes('nullability'), true);
assert.equal(degradedTypeConstraints.missingEvidence.includes('translation-type-constraint:nullability'), true);
assert.equal(degradedTypeConstraints.claims.typeEquivalenceClaim, false);
assert.equal(degradedTypeConstraints.claims.publicApiEquivalenceClaim, false);

const degradedTypePlan = createUniversalConversionPlan({
  generatedAt: 812,
  universalCapabilityMatrix: capabilityMatrix(),
  targets: ['rust'],
  imports: [sourceImport()],
  evidence: [routeProof('type_constraint')],
  typeConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceTypes: [
      { id: 'js_read_user_api', kind: 'public function', signatureHash: 'sig_read_user' },
      { id: 'js_result_type_param', kind: 'generic type-parameter' },
      { id: 'js_nickname_property', kind: 'property', optional: true }
    ],
    targetTypes: [{ id: 'rust_read_user_api', kind: 'public function', signatureHash: 'sig_read_user' }]
  }]
});
const degradedTypeRoute = queryUniversalConversionPlan(degradedTypePlan, {
  typeConstraintStatus: 'degraded',
  typeConstraintMissingKind: 'nullability'
}).bestRoute;
assert.equal(degradedTypeRoute.translationAdmission.status, 'needs-evidence');
assert.equal(degradedTypeRoute.translationAdmission.typeConstraintStatus, 'degraded');
assert.equal(degradedTypeRoute.typeConstraint.missingEvidence.includes('translation-type-constraint:nullability'), true);
assert.equal(degradedTypeRoute.missingEvidence.includes('translation-type-constraint-proof'), true);

const degradedTypeArtifacts = createUniversalConversionArtifacts(degradedTypePlan, {
  routeId: degradedTypeRoute.id,
  generatedAt: 813
});
const degradedTypeArtifact = queryUniversalConversionArtifacts(degradedTypeArtifacts, {
  typeConstraintMissingEvidence: 'translation-type-constraint:nullability'
})[0];
assert.equal(degradedTypeArtifact.admissionRecord.typeConstraint.missingKinds.includes('nullability'), true);
assert.equal(degradedTypeArtifacts.index.typeConstraintStatuses.includes('degraded'), true);
assert.equal(degradedTypeArtifacts.index.typeConstraintMissingKinds.includes('generic-parameters'), true);
assert.equal(degradedTypeArtifacts.summary.compactCounts.typeConstraint.missingKinds.nullability, 1);

function capabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 812,
    languages: [{
      language: 'javascript',
      aliases: ['js'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: {
          exactSource: { evidence: { importsWithExactSource: 1 } },
          stubs: { evidence: { importsWithDeclarations: 1 } }
        },
        targets: [{ target: 'rust', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-js-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: {
      projectionReadiness: {
        languages: [{ language: 'javascript', targets: [{ target: 'rust', readiness: 'ready' }] }]
      }
    },
    metadata: { compileTargets: ['rust'] }
  };
}

function sourceImport() {
  return {
    id: 'native_import_js_type_constraint',
    language: 'javascript',
    sourcePath: 'src/public-api.js',
    sourceHash: 'hash_public_api_source',
    evidence: [{ id: 'native_import_type_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_type_symbol', ownershipKeys: ['symbol.publicApi'], conflictKeys: ['symbol.publicApi'] }],
    sourceMaps: [{ id: 'source_map_type', mappings: [{ id: 'source_map_mapping_type', ownershipRegionKey: 'symbol.publicApi', sourceSpan: { path: 'src/public-api.js' } }] }]
  };
}

function routeProof(id) {
  return {
    id: `evidence_${id}_translation_proof`,
    kind: 'conversion-replay-proof',
    status: 'passed',
    routeId: 'conversion_javascript_to_rust',
    sourceLanguage: 'javascript',
    target: 'rust'
  };
}
