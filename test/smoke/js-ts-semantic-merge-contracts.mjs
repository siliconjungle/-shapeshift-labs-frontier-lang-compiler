import { assert } from './helpers.mjs';
import {
  createJsTsSemanticMergeConflictExplanation,
  createJsTsSemanticMergeGateResult,
  JsTsSemanticMergeConflictClasses,
  JsTsSemanticMergeGateStatuses
} from './compiler-api.mjs';

for (const conflictClass of [
  'same-token-edit',
  'same-region-edit',
  'delete-modify',
  'move-edit',
  'rename-rename',
  'import-order',
  'type-surface-drift',
  'trivia-preservation',
  'behavior-evidence-needed'
]) {
  assert.equal(JsTsSemanticMergeConflictClasses.includes(conflictClass), true);
}

for (const status of ['passed', 'warning', 'failed', 'skipped', 'blocked']) {
  assert.equal(JsTsSemanticMergeGateStatuses.includes(status), true);
}

const conflictInput = {
  conflictClass: 'same-region-edit',
  risk: 'high',
  language: 'typescript',
  sourcePath: 'src/example.ts',
  conflictKeys: ['source#src/example.ts#function#run'],
  matchIds: ['match_run'],
  editIds: ['left_edit_run', 'right_edit_run'],
  regionIds: ['region_run'],
  tokenIds: ['token_run_identifier'],
  triviaIds: ['trivia_run_leading_comment'],
  evidenceIds: ['evidence_typecheck'],
  reasonCodes: ['both-sides-update-function-body'],
  sides: {
    base: { sourceHash: 'base_hash', regionIds: ['region_run'], summary: 'run returns the original value' },
    left: { sourceHash: 'left_hash', editIds: ['left_edit_run'], summary: 'left changes return value' },
    right: { sourceHash: 'right_hash', editIds: ['right_edit_run'], summary: 'right changes return value' }
  }
};

const conflict = createJsTsSemanticMergeConflictExplanation(conflictInput);
const repeatedConflict = createJsTsSemanticMergeConflictExplanation(conflictInput);
assert.equal(conflict.kind, 'frontier.lang.jsTsSemanticMergeConflictExplanation');
assert.equal(conflict.schema, 'frontier.lang.jsTsSemanticMergeConflictExplanation.v1');
assert.equal(conflict.id, repeatedConflict.id);
assert.equal(conflict.stableId, repeatedConflict.stableId);
assert.equal(conflict.hash, repeatedConflict.hash);
assert.equal(conflict.readiness, 'blocked');
assert.equal(conflict.suggestedAction, 'block');
assert.equal(conflict.conflictKeys.includes('source#src/example.ts#function#run'), true);
assert.equal(conflict.reasonCodes.includes('js-ts-conflict:same-region-edit'), true);
assert.equal(conflict.metadata.structuralContract, true);

const failedGate = createJsTsSemanticMergeGateResult({
  gateId: 'js-ts-merge-admission',
  status: 'failed',
  checks: [
    { name: 'source-token-contract', status: 'passed' },
    { name: 'manual-conflict-review', status: 'failed', reasonCodes: ['same-region-conflict'] }
  ],
  structuredEditIds: ['left_edit_run', 'right_edit_run'],
  semanticRegionIds: ['region_run'],
  conflicts: [conflictInput]
});
const repeatedFailedGate = createJsTsSemanticMergeGateResult({
  gateId: 'js-ts-merge-admission',
  status: 'failed',
  checks: [
    { name: 'source-token-contract', status: 'passed' },
    { name: 'manual-conflict-review', status: 'failed', reasonCodes: ['same-region-conflict'] }
  ],
  structuredEditIds: ['left_edit_run', 'right_edit_run'],
  semanticRegionIds: ['region_run'],
  conflicts: [conflictInput]
});
assert.equal(failedGate.kind, 'frontier.lang.jsTsSemanticMergeGateResult');
assert.equal(failedGate.schema, 'frontier.lang.jsTsSemanticMergeGateResult.v1');
assert.equal(failedGate.id, repeatedFailedGate.id);
assert.equal(failedGate.hash, repeatedFailedGate.hash);
assert.equal(failedGate.status, 'failed');
assert.equal(failedGate.readiness, 'blocked');
assert.equal(failedGate.mergeable, false);
assert.equal(failedGate.action, 'block');
assert.equal(failedGate.summary.checks, 2);
assert.equal(failedGate.summary.failedChecks, 1);
assert.equal(failedGate.summary.conflicts, 1);
assert.equal(failedGate.conflictExplanations[0].hash, conflict.hash);
assert.equal(failedGate.reasonCodes.includes('js-ts-merge-gate:failed'), true);

const passedGate = createJsTsSemanticMergeGateResult({
  gateId: 'js-ts-merge-admission',
  status: 'passed',
  checks: [{ name: 'contract-shape', status: 'passed' }],
  semanticRegionIds: ['region_run']
});
assert.equal(passedGate.status, 'passed');
assert.equal(passedGate.readiness, 'ready');
assert.equal(passedGate.mergeable, true);
assert.equal(passedGate.action, 'merge');
assert.equal(passedGate.conflictExplanationIds.length, 0);
