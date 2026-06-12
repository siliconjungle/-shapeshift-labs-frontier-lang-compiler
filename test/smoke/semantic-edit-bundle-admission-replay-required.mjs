import { assert } from './helpers.mjs';
import { createSemanticPatchBundleAdmission } from '../../dist/internal/index-impl/semanticPatchBundleAdmission.js';

const passedAutoMergeProof = {
  id: 'evidence_semantic_edit_bundle_auto_merge_tests',
  kind: 'test',
  status: 'passed',
  scope: 'semantic-edit:auto-merge',
  summary: 'Semantic edit bundle replay gate passed.'
};

const scriptOnlyAutoMergeShapedAdmission = createSemanticPatchBundleAdmission({}, {
  conflictKeys: [],
  semanticEditAdmission: {
    status: 'ready',
    action: 'admit',
    readiness: 'ready',
    reviewRequired: false,
    autoApplyCandidate: true,
    summary: {
      scripts: 1,
      projections: 0,
      replays: 0,
      portableScripts: 1,
      portableProjections: 0,
      acceptedClean: 0,
      alreadyApplied: 0
    },
    reasonCodes: ['semantic-edit-positive-auto-merge-proof']
  },
  evidenceRecords: [passedAutoMergeProof]
});

assert.equal(scriptOnlyAutoMergeShapedAdmission.status, 'needs-review');
assert.equal(scriptOnlyAutoMergeShapedAdmission.readiness, 'needs-review');
assert.equal(scriptOnlyAutoMergeShapedAdmission.reviewRequired, true);
assert.equal(scriptOnlyAutoMergeShapedAdmission.autoApplyCandidate, false);
assert.equal(scriptOnlyAutoMergeShapedAdmission.semanticEditAdmission.status, 'needs-review');
assert.equal(scriptOnlyAutoMergeShapedAdmission.semanticEditAdmission.action, 'review');
assert.equal(scriptOnlyAutoMergeShapedAdmission.reasonCodes.includes('semantic-edit-replay-missing'), true);
assert.equal(scriptOnlyAutoMergeShapedAdmission.reasonCodes.includes('semantic-edit-replay-required'), true);
assert.equal(scriptOnlyAutoMergeShapedAdmission.reasonCodes.includes('auto-merge-positive-proof'), false);
assert.equal(scriptOnlyAutoMergeShapedAdmission.reasonCodes.includes('semantic-edit-positive-auto-merge-proof'), false);

const replayedAutoMergeShapedAdmission = createSemanticPatchBundleAdmission({}, {
  conflictKeys: [],
  semanticEditAdmission: {
    status: 'ready',
    action: 'admit',
    readiness: 'ready',
    reviewRequired: false,
    autoApplyCandidate: true,
    summary: {
      scripts: 1,
      projections: 1,
      replays: 1,
      portableScripts: 1,
      portableProjections: 1,
      acceptedClean: 1,
      alreadyApplied: 0
    },
    reasonCodes: [
      'semantic-edit-replay-accepted-clean',
      'semantic-edit-positive-auto-merge-proof'
    ]
  },
  evidenceRecords: [passedAutoMergeProof]
});

assert.equal(replayedAutoMergeShapedAdmission.status, 'admitted');
assert.equal(replayedAutoMergeShapedAdmission.readiness, 'ready');
assert.equal(replayedAutoMergeShapedAdmission.reviewRequired, false);
assert.equal(replayedAutoMergeShapedAdmission.autoApplyCandidate, true);
assert.equal(replayedAutoMergeShapedAdmission.semanticEditAdmission.status, 'ready');
assert.equal(replayedAutoMergeShapedAdmission.evidenceAdmission.status, 'ready');
assert.equal(replayedAutoMergeShapedAdmission.reasonCodes.includes('auto-merge-positive-proof'), true);
