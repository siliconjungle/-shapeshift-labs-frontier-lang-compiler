import { assert } from './helpers.mjs';
import { fileAdmissionEvidenceRecords } from '../../src/js-ts-safe-project-merge-evidence-routing.js';

const genericAdmissionEvidence = fileAdmissionEvidenceRecords([{
  summary: {
    genericAdmissionEvidence: [
      { id: 'safe_exact', kind: 'js-ts-project-generic-admission', status: 'passed', details: { exactBranchOutput: true } },
      { id: 'blocked_conflict', kind: 'js-ts-project-generic-admission', status: 'failed', details: { reasonCode: 'generic-conflict' } }
    ]
  },
  metadata: {
    genericAdmissions: [{
      id: 'review_missing',
      kind: 'js-ts-project-generic-admission',
      status: 'missing',
      admissionRoute: { status: 'missing', reasonCodes: ['missing-proof'] }
    }]
  }
}]);
const genericAdmissionById = new Map(genericAdmissionEvidence.map((record) => [record.id, record]));
assert.equal(genericAdmissionById.get('safe_exact').admissionOutcome, 'safe');
assert.equal(genericAdmissionById.get('safe_exact').admissionOutcomeReasonCode, 'passed-exact-branch-output');
assert.equal(genericAdmissionById.get('blocked_conflict').admissionOutcome, 'blocked');
assert.equal(genericAdmissionById.get('blocked_conflict').admissionOutcomeReasonCode, 'generic-conflict');
assert.equal(genericAdmissionById.get('review_missing').admissionOutcome, 'review');
assert.equal(genericAdmissionById.get('review_missing').admissionOutcomeReasonCode, 'missing-proof');
