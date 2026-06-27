import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const duplicateRuleBase = '.alert { color: red; }\n.alert { color: green; }\n';
const duplicateRuleWorker = '.alert { color: blue; }\n.alert { color: green; }\n';
const duplicateRuleHead = '.alert { color: red; }\n.alert { color: yellow; }\n';
const duplicateCascadeProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_duplicate_cascade_key_blocked',
  files: [{ sourcePath: 'src/alerts.css', baseSourceText: duplicateRuleBase, workerSourceText: duplicateRuleWorker, headSourceText: duplicateRuleHead }]
});
assert.equal(duplicateCascadeProject.status, 'blocked');
assert.equal(duplicateCascadeProject.summary.cssBlockedFiles, 1);
assert.equal(duplicateCascadeProject.summary.cssDuplicateCascadeKeyBlockedFiles, 1);
assert.equal(duplicateCascadeProject.summary.cssParserEvidenceFiles, 1);
const duplicateConflict = duplicateCascadeProject.conflicts.find((conflict) => conflict.details.reasonCode === 'css-duplicate-cascade-key-order-unproved');
assert.ok(duplicateConflict);
assert.equal(duplicateConflict.code, 'css-duplicate-cascade-key-blocked');
assert.equal(duplicateConflict.details.cascadeKey, '.alert::color');
assert.equal(duplicateConflict.details.count, 2);
assert.equal(duplicateConflict.details.proofGap.failClosed, true);
const cascadeSurface = matrixSurface(duplicateCascadeProject, 'css-cascade-merge-admission');
assert.equal(cascadeSurface.proofStatuses['css-cascade-merge'], 'failed');
assert.equal(cascadeSurface.missingRouteIds.includes('admit-css-cascade-merge'), true);
const missingCascade = duplicateCascadeProject.confidence.missingEvidence.find((item) => item.code === 'css-cascade-merge-proof-blocked');
assert.ok(missingCascade);
assert.match(missingCascade.summary, /duplicate cascade-key blocker/);

const scopedDuplicateProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scoped_duplicate_cascade_key_blocked',
  cssMergeOptionsByPath: { 'src/scoped.css': { scopedCascadeGraphHash: 'hash_scoped_cascade' } },
  files: [{
    sourcePath: 'src/scoped.css',
    baseSourceText: '@layer theme {\n  .alert { color: red; }\n  .alert { color: green; }\n}\n',
    workerSourceText: '@layer theme {\n  .alert { color: blue; }\n  .alert { color: green; }\n}\n',
    headSourceText: '@layer theme {\n  .alert { color: red; }\n  .alert { color: yellow; }\n}\n'
  }]
});
assert.equal(scopedDuplicateProject.status, 'blocked');
assert.equal(scopedDuplicateProject.summary.cssDuplicateCascadeKeyBlockedFiles, 1);
assert.equal(scopedDuplicateProject.conflicts.some((conflict) => conflict.details.cascadeKey === '@layer theme::.alert::color'), true);

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
