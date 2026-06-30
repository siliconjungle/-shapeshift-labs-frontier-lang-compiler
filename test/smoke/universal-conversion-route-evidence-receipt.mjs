import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionRouteEvidenceReceipt,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const scopedEvidence = {
  id: 'receipt_scoped_translation_proof',
  kind: 'conversion-replay-proof',
  status: 'passed',
  routeId: 'conversion_javascript_to_rust',
  sourceLanguage: 'javascript',
  target: 'rust'
};
const unscopedEvidence = {
  id: 'receipt_unscoped_translation_proof',
  kind: 'conversion-replay-proof',
  status: 'passed'
};
const wrongTargetEvidence = {
  id: 'receipt_wrong_target_translation_proof',
  kind: 'conversion-replay-proof',
  status: 'passed',
  sourceLanguage: 'javascript',
  target: 'python'
};
const plan = createUniversalConversionPlan({
  generatedAt: 803,
  imports: [scannedJsImport],
  targets: ['rust'],
  evidence: [scopedEvidence, unscopedEvidence, wrongTargetEvidence]
});
const route = queryUniversalConversionPlan(plan, { sourceLanguage: 'javascript', target: 'rust' }).bestRoute;
const receipt = createUniversalConversionRouteEvidenceReceipt(plan, {
  routeId: route.id,
  evidence: [scopedEvidence, unscopedEvidence, wrongTargetEvidence]
});
assert.equal(receipt.kind, 'frontier.lang.universalConversionRouteEvidenceReceipt');
assert.equal(receipt.id, `evidence_receipt_${route.id}`);
assert.equal(receipt.routeId, route.id);
assert.equal(receipt.evidenceIds.includes('receipt_scoped_translation_proof'), true);
assert.equal(receipt.proofEvidenceIds.includes('receipt_scoped_translation_proof'), true);
assert.equal(receipt.records.bound.length, 1);
assert.equal(receipt.records.bound[0].binding, 'bound');
assert.equal(receipt.records.bound[0].proof, true);
assert.equal(receipt.records.rejected.some((record) => record.id === 'receipt_unscoped_translation_proof' && record.reason === 'unscoped-evidence'), true);
assert.equal(receipt.records.rejected.some((record) => record.id === 'receipt_wrong_target_translation_proof' && record.reason === 'target-mismatch'), true);
assert.equal(receipt.summary.boundEvidence, 1);
assert.equal(receipt.summary.rejectedByReason['unscoped-evidence'], 1);
assert.equal(receipt.summary.rejectedByReason['target-mismatch'], 1);
assert.equal(receipt.autoMergeClaim, false);
assert.equal(receipt.semanticEquivalenceClaim, false);

const artifactsWithReceipts = createUniversalConversionArtifacts(plan, {
  routeId: route.id,
  evidence: [scopedEvidence, unscopedEvidence, wrongTargetEvidence]
});
const rejectedArtifact = queryUniversalConversionArtifacts(artifactsWithReceipts, {
  evidenceReceiptRejectedReason: 'unscoped-evidence',
  evidenceReceiptRejectedId: 'receipt_unscoped_translation_proof'
})[0];
assert.equal(rejectedArtifact.evidenceReceipt.records.rejected.length, 2);
assert.equal(artifactsWithReceipts.summary.receiptRejectedEvidence, 2);
assert.equal(artifactsWithReceipts.summary.compactCounts.evidenceReceipts.rejectedByReason['target-mismatch'], 1);

const routeReceipt = createUniversalConversionRouteEvidenceReceipt(route);
assert.equal(routeReceipt.routeId, route.id);
assert.equal(routeReceipt.proofEvidenceIds.includes('receipt_scoped_translation_proof'), true);

const missingReceipt = createUniversalConversionRouteEvidenceReceipt(createUniversalConversionPlan({
  generatedAt: 804,
  imports: [scannedJsImport],
  targets: ['rust']
}), {
  sourceLanguage: 'javascript',
  target: 'rust'
});
assert.equal(missingReceipt.missingEvidence.includes('route-bound-proof-evidence'), true);
assert.equal(missingReceipt.summary.missingEvidence >= 1, true);
