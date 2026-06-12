import { assert } from './helpers.mjs';
import { estreeAdapterImport } from './js-ts-adapters.mjs';
import { pythonAstImport } from './python-adapter.mjs';
import { rustSynImport } from './rust-adapter.mjs';
import { clangImport, goAstImport } from './clang-go-adapters.mjs';
import { javaAstImport } from './java-adapter.mjs';
import { csharpRoslynImport } from './csharp-adapter.mjs';
import { kotlinPsiImport, swiftSyntaxImport } from './swift-kotlin-project.mjs';
import { scannedRImport } from './scanned-languages.mjs';
import {
  classifyNativeImportReadiness,
  createCSharpRoslynNativeImporterAdapter,
  createClangAstNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createGoAstNativeImporterAdapter,
  createJavaAstNativeImporterAdapter,
  createKotlinPsiNativeImporterAdapter,
  createPythonAstNativeImporterAdapter,
  createRustSynNativeImporterAdapter,
  createSemanticMergeCandidateAdmissionRecord,
  createSwiftSyntaxNativeImporterAdapter,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  diffNativeSources,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  sortSemanticMergeCandidateAdmissionRecords,
  summarizeNativeImportLosses
} from './compiler-api.mjs';

const universalFixtureImports = [
  estreeAdapterImport,
  pythonAstImport,
  rustSynImport,
  clangImport,
  goAstImport,
  javaAstImport,
  kotlinPsiImport,
  csharpRoslynImport,
  swiftSyntaxImport,
  scannedRImport
];
const universalFixtureTargetAdapters = [{
  id: 'matrix-js-to-rust-route-adapter',
  sourceLanguage: 'javascript',
  target: 'rust',
  coverage: {
    readiness: 'ready',
    handledLossKinds: ['dynamicRuntime', 'dynamicDispatch', 'typeInference', 'overloadResolution']
  },
  project() {
    return { output: 'pub fn matrix_js_to_rust() {}\n', readiness: 'ready' };
  }
}, {
  id: 'matrix-c-to-rust-route-adapter',
  sourceLanguage: 'c',
  target: 'rust',
  coverage: {
    readiness: 'ready',
    handledLossKinds: ['preprocessor', 'conditionalCompilation', 'macroExpansion', 'generatedCode']
  },
  project() {
    return { output: 'pub fn matrix_c_to_rust() {}\n', readiness: 'ready' };
  }
}];
const universalFixturePlan = createUniversalConversionPlan({
  generatedAt: 654,
  imports: universalFixtureImports,
  adapters: [
    createEstreeNativeImporterAdapter(),
    createPythonAstNativeImporterAdapter(),
    createRustSynNativeImporterAdapter(),
    createClangAstNativeImporterAdapter(),
    createGoAstNativeImporterAdapter(),
    createJavaAstNativeImporterAdapter(),
    createKotlinPsiNativeImporterAdapter(),
    createCSharpRoslynNativeImporterAdapter(),
    createSwiftSyntaxNativeImporterAdapter()
  ],
  targetAdapters: universalFixtureTargetAdapters,
  targets: ['javascript', 'python', 'rust', 'c'],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation'],
  evidence: [{
    id: 'matrix_universal_conversion_replay',
    kind: 'conversion-replay-proof',
    status: 'passed'
  }]
});
assert.equal(universalFixturePlan.kind, 'frontier.lang.universalConversionPlan');
assert.equal(universalFixturePlan.summary.routes, universalFixturePlan.matrices.universalCapability.summary.languages * 4);
assert.equal(universalFixturePlan.summary.autoMergeClaims, 0);
assert.equal(universalFixturePlan.summary.semanticEquivalenceClaims, 0);
assert.equal(universalFixturePlan.summary.targetAdapterRoutes >= 2, true);
assert.equal(universalFixturePlan.summary.semanticIndexOnlyRoutes >= 1, true);
assert.equal(universalFixturePlan.matrices.universalCapability.summary.representationConstructs > 0, true);
assert.equal(universalFixturePlan.matrices.universalCapability.summary.representationMissing >= 0, true);
const matrixJsLanguage = universalFixturePlan.matrices.universalCapability.languages.find((row) => row.language === 'javascript');
assert.equal(matrixJsLanguage.representation.kind, 'frontier.lang.universalRepresentationCoverage');
assert.equal(matrixJsLanguage.representation.constructKinds.includes('semantic-symbol'), true);
assert.equal(matrixJsLanguage.representation.autoMergeClaim, false);
const matrixJsToRust = queryUniversalConversionPlan(universalFixturePlan, {
  sourceLanguage: 'javascript',
  target: 'rust'
}).bestRoute;
const matrixRustToRust = queryUniversalConversionPlan(universalFixturePlan, {
  sourceLanguage: 'rust',
  target: 'rust'
}).bestRoute;
const matrixRToRust = queryUniversalConversionPlan(universalFixturePlan, {
  sourceLanguage: 'r',
  target: 'rust'
}).bestRoute;
assert.equal(matrixJsToRust.mode, 'target-adapter');
assert.equal(matrixRustToRust.mode, 'preserve-source');
assert.equal(matrixRToRust.mode, 'semantic-index-only');
assert.equal(matrixRToRust.admissionAction, 'reject');
assert.equal(matrixJsToRust.mergeScore.schema, 'frontier.lang.semanticMergeScore.v1');
assert.equal(Boolean(matrixJsToRust.adapter), true);
assert.equal(matrixJsToRust.mergeScore.sortKey > matrixRToRust.mergeScore.sortKey, true);
assert.equal(matrixJsToRust.representation.constructKinds.includes('target-adapter'), true);
assert.equal(matrixJsToRust.mergeScore.components.representationCoverage.key, 'representationCoverage');
assert.equal(matrixJsToRust.mergeScore.components.representationCoverage.signals.constructKinds.includes('target-adapter'), true);
assert.equal(matrixJsToRust.autoMergeClaim, false);
assert.equal(matrixJsToRust.semanticEquivalenceClaim, false);
assert.equal(queryUniversalConversionPlan(universalFixturePlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  constructKind: 'target-adapter'
}).bestRoute.id, matrixJsToRust.id);
const universalFixtureArtifacts = createUniversalConversionArtifacts(universalFixturePlan, { generatedAt: 655 });
assert.equal(universalFixtureArtifacts.summary.routes, universalFixturePlan.routes.length);
assert.equal(universalFixtureArtifacts.summary.admissionRecords, universalFixturePlan.routes.length);
assert.equal(universalFixtureArtifacts.summary.autoMergeClaims, 0);
assert.equal(universalFixtureArtifacts.index.representationConstructKinds.includes('target-adapter'), true);
assert.equal(queryUniversalConversionArtifacts(universalFixtureArtifacts, {
  routeId: matrixJsToRust.id,
  constructKind: 'target-adapter'
})[0].routeId, matrixJsToRust.id);
const universalFixtureLossSummaries = universalFixtureImports.map((imported) => summarizeNativeImportLosses(imported.losses, {
  evidence: imported.evidence,
  exactAst: imported.metadata?.nativeImportLossSummary?.exactAst
}));
assert.equal(universalFixtureLossSummaries.some((summary) => summary.semanticMergeReadiness === 'ready'), true);
assert.equal(universalFixtureLossSummaries.some((summary) => summary.semanticMergeReadiness === 'needs-review'), true);
assert.equal(universalFixtureLossSummaries.some((summary) => (summary.byKind.dynamicRuntime ?? 0) > 0), true);
assert.equal(classifyNativeImportReadiness(scannedRImport.losses, { evidence: scannedRImport.evidence }).readiness, 'needs-review');
const universalCandidateRecords = [{
  language: 'javascript',
  sourcePath: 'src/matrix-candidate.js',
  beforeSourceText: 'export function matrixCandidate(value) { return value + 1; }\n',
  afterSourceText: 'export function matrixCandidate(value) { return value + 2; }\n',
  readiness: 'ready'
}, {
  language: 'python',
  sourcePath: 'matrix_candidate.py',
  beforeSourceText: 'def matrix_candidate(value):\n    return value + 1\n',
  afterSourceText: 'def matrix_candidate(value):\n    return value + 2\n',
  readiness: 'ready-with-losses'
}, {
  language: 'rust',
  sourcePath: 'src/matrix_candidate.rs',
  beforeSourceText: 'pub fn matrix_candidate(value: i32) -> i32 { value + 1 }\n',
  afterSourceText: 'pub fn matrix_candidate(value: i32) -> i32 { value + 2 }\n',
  readiness: 'needs-review'
}, {
  language: 'c',
  sourcePath: 'matrix_candidate.c',
  beforeSourceText: 'int matrix_candidate(int value) { return value + 1; }\n',
  afterSourceText: 'int matrix_candidate(int value) { return value + 2; }\n',
  readiness: 'blocked'
}].map((spec, index) => {
  const changeSet = diffNativeSources({
    id: `matrix_candidate_change_${index}`,
    language: spec.language,
    sourcePath: spec.sourcePath,
    beforeSourceText: spec.beforeSourceText,
    afterSourceText: spec.afterSourceText,
    evidenceId: `matrix_candidate_evidence_${index}`,
    patchId: `matrix_candidate_patch_${index}`,
    mergeCandidateId: `matrix_candidate_${index}`
  });
  assert.equal(changeSet.changedRegions.length >= 1, true);
  return createSemanticMergeCandidateAdmissionRecord(changeSet, {
    readiness: spec.readiness,
    evidence: [{
      id: `matrix_candidate_verification_${index}`,
      kind: 'candidate-verification-proof',
      status: 'passed'
    }]
  });
});
const sortedUniversalCandidateRecords = sortSemanticMergeCandidateAdmissionRecords(universalCandidateRecords);
assert.deepEqual(sortedUniversalCandidateRecords.map((record) => record.readiness), ['ready', 'ready-with-losses', 'needs-review', 'blocked']);
assert.equal(sortedUniversalCandidateRecords[0].readinessSortKey > sortedUniversalCandidateRecords[3].readinessSortKey, true);
assert.equal(new Set(universalCandidateRecords.map((record) => record.language)).size, 4);
