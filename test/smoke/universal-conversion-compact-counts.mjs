import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { scannedCImport } from './scanned-languages.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan
} from './compiler-api.mjs';

const jsRustAdapter = {
  id: 'fixture-js-rust-compact-counts-adapter',
  sourceLanguage: 'javascript',
  target: 'rust',
  coverage: {
    readiness: 'ready',
    handledLossKinds: [
      'declarationOnlyCoverage',
      'dynamicDispatch',
      'dynamicRuntime',
      'opaqueNative',
      'partialSemanticIndex',
      'sourceMapApproximation',
      'sourcePreservation',
      'targetProjectionLoss',
      'typeInference'
    ]
  },
  project() {
    return { output: 'pub fn compact_counts_fixture() {}\n', readiness: 'ready' };
  }
};

const plan = createUniversalConversionPlan({
  generatedAt: 780,
  imports: [scannedJsImport, scannedCImport],
  targetAdapters: [jsRustAdapter],
  targets: ['javascript', 'rust']
});
const planCounts = plan.summary.compactCounts;
assert.equal(planCounts.representationConstructs.total >= plan.summary.routes, true);
assert.equal(planCounts.representationConstructs.byKind['source-import'] >= 1, true);
assert.equal(planCounts.missingConstructs.byKind['proof-evidence'] >= 1, true);
assert.equal(sumCounts(planCounts.semanticEditReadiness.routes), plan.summary.routes);
assert.equal(planCounts.semanticEditReadiness.routes.blocked >= 1, true);
assert.equal(planCounts.admissionStatuses.byAction.reject >= 1, true);
assert.equal(sumCounts(planCounts.translationAdmission.byStatus), plan.summary.routes);
assert.equal(planCounts.translationAdmission.byStatus.blocked >= 1, true);
assert.equal(planCounts.translationAdmission.missingEvidence['translation-target-adapter'] >= 1, true);
assert.equal(planCounts.translationAdmission.evidenceIds.evidence_src_scanned_js_import >= 1, true);
assert.equal(planCounts.translationAdmission.requiredConstructKinds['proof-evidence'] >= 1, true);
assert.equal(planCounts.translationAdmission.representedConstructKinds['target-adapter'] >= 1, true);
assert.equal(planCounts.translationAdmission.targetAdapterIds[jsRustAdapter.id] >= 1, true);
assert.equal(sumCounts(planCounts.interlingua.byLoweringDisposition), plan.summary.routes);
assert.equal(planCounts.interlingua.byLoweringDisposition.blocked >= 1, true);
assert.equal(planCounts.interlingua.representedLayerKinds['target-adapter'] >= 1, true);
assert.equal(planCounts.interlingua.missingEvidence['translation-target-adapter'] >= 1, true);

const artifacts = createUniversalConversionArtifacts(plan, { generatedAt: 781 });
const artifactCounts = artifacts.summary.compactCounts;
assert.equal(artifactCounts.representationConstructs.byKind['source-import'] >= 1, true);
assert.equal(artifactCounts.missingConstructs.byKind['proof-evidence'] >= 1, true);
assert.equal(sumCounts(artifactCounts.semanticEditReadiness.routeArtifacts), artifacts.summary.routes);
assert.equal(sumCounts(artifactCounts.semanticEditReadiness.semanticOperations), artifacts.summary.semanticOperations);
assert.equal(artifactCounts.semanticEditReadiness.routeArtifacts.blocked >= 1, true);
assert.equal(artifactCounts.semanticEditReadiness.semanticOperations.blocked >= 1, true);
assert.equal(artifactCounts.admissionStatuses.byStatus.blocked >= 1, true);
assert.equal(artifactCounts.admissionStatuses.byBucket.blocked >= 1, true);
assert.equal(sumCounts(artifactCounts.translationAdmission.byStatus), artifacts.summary.routes);
assert.equal(artifactCounts.translationAdmission.byStatus.blocked >= 1, true);
assert.equal(artifactCounts.translationAdmission.evidenceIds.evidence_src_scanned_js_import >= 1, true);
assert.equal(artifactCounts.translationAdmission.requiredConstructKinds['proof-evidence'] >= 1, true);
assert.equal(artifactCounts.translationAdmission.representedConstructKinds['target-adapter'] >= 1, true);
assert.equal(artifactCounts.translationAdmission.targetAdapterIds[jsRustAdapter.id] >= 1, true);
assert.equal(sumCounts(artifactCounts.interlingua.byLoweringDisposition), artifacts.summary.routes);
assert.equal(artifactCounts.interlingua.byLoweringDisposition.blocked >= 1, true);
assert.equal(artifactCounts.interlingua.representedLayerKinds['target-adapter'] >= 1, true);
assert.equal(artifactCounts.semanticOperationInterlingua.operations, artifacts.summary.semanticOperations);
assert.equal(artifactCounts.semanticOperationInterlingua.operationRecords, artifacts.summary.semanticOperations);
assert.equal(sumCounts(artifactCounts.semanticOperationInterlingua.byLoweringDisposition), artifacts.summary.semanticOperations);
assert.equal(artifactCounts.semanticOperationInterlingua.byLoweringDisposition.blocked >= 1, true);

function sumCounts(counts) {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}
