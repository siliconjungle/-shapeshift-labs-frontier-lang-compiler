import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalModuleConstraintEvidence,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const degradedModuleConstraints = createUniversalModuleConstraintEvidence({
  routeId: 'typescript_to_rust_module_graph',
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceModules: [
    { id: 'api_import', kind: 'static import', specifier: './api', importedName: 'readUser' },
    { id: 'barrel_export', kind: 're-export', exportedName: 'readUser' },
    { id: 'pkg_condition', kind: 'package runtime condition', packageName: '@pkg/api', packageCondition: 'import' }
  ],
  targetModules: [{ id: 'rust_import', kind: 'static import', specifier: 'crate::api' }]
});
assert.equal(degradedModuleConstraints.status, 'degraded');
assert.equal(degradedModuleConstraints.missingKinds.includes('re-export-edge'), true);
assert.equal(degradedModuleConstraints.missingKinds.includes('package-runtime-condition'), true);
assert.equal(degradedModuleConstraints.missingEvidence.includes('translation-module-constraint:package-runtime-condition'), true);
assert.equal(degradedModuleConstraints.claims.moduleEquivalenceClaim, false);
assert.equal(degradedModuleConstraints.claims.packageResolutionClaim, false);

const degradedModulePlan = createUniversalConversionPlan({
  generatedAt: 827,
  universalCapabilityMatrix: capabilityMatrix(),
  targets: ['rust'],
  imports: [sourceImport()],
  evidence: [routeProof('module_constraint')],
  moduleConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceModules: [
      { id: 'js_api_import', kind: 'static import', specifier: './api', importedName: 'readUser' },
      { id: 'js_barrel_export', kind: 're-export', exportedName: 'readUser' },
      { id: 'js_pkg_condition', kind: 'package runtime condition', packageName: '@pkg/api', packageCondition: 'import' }
    ],
    targetModules: [{ id: 'rust_api_import', kind: 'static import', specifier: 'crate::api' }]
  }]
});
const degradedModuleRoute = queryUniversalConversionPlan(degradedModulePlan, {
  moduleConstraintStatus: 'degraded',
  moduleConstraintMissingKind: 'package-runtime-condition'
}).bestRoute;
assert.equal(degradedModuleRoute.translationAdmission.status, 'needs-evidence');
assert.equal(degradedModuleRoute.translationAdmission.moduleConstraintStatus, 'degraded');
assert.equal(degradedModuleRoute.moduleConstraint.missingEvidence.includes('translation-module-constraint:package-runtime-condition'), true);
assert.equal(degradedModuleRoute.missingEvidence.includes('translation-module-constraint-proof'), true);

const degradedModuleArtifacts = createUniversalConversionArtifacts(degradedModulePlan, {
  routeId: degradedModuleRoute.id,
  generatedAt: 828
});
const degradedModuleArtifact = queryUniversalConversionArtifacts(degradedModuleArtifacts, {
  moduleConstraintMissingEvidence: 'translation-module-constraint:package-runtime-condition'
})[0];
assert.equal(degradedModuleArtifact.admissionRecord.moduleConstraint.missingKinds.includes('package-runtime-condition'), true);
assert.equal(degradedModuleArtifacts.index.moduleConstraintStatuses.includes('degraded'), true);
assert.equal(degradedModuleArtifacts.index.moduleConstraintMissingKinds.includes('re-export-edge'), true);
assert.equal(degradedModuleArtifacts.summary.compactCounts.moduleConstraint.missingKinds['package-runtime-condition'], 1);

function capabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 827,
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
    matrices: { projectionReadiness: { languages: [{ language: 'javascript', targets: [{ target: 'rust', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['rust'] }
  };
}

function sourceImport() {
  return {
    id: 'native_import_js_module_constraint',
    language: 'javascript',
    sourcePath: 'src/module-graph.js',
    sourceHash: 'hash_module_graph_source',
    evidence: [{ id: 'native_import_module_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_module_symbol', ownershipKeys: ['module.api'], conflictKeys: ['module.api'] }],
    sourceMaps: [{ id: 'source_map_module', mappings: [{ id: 'source_map_mapping_module', ownershipRegionKey: 'module.api', sourceSpan: { path: 'src/module-graph.js' } }] }]
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
