import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const duplicateRuleBase = '.alert { color: red; }\n.alert { color: green; }\n';
const duplicateRuleWorker = '.alert { color: blue; }\n.alert { color: green; }\n';
const duplicateRuleHead = '.alert { color: red; }\n.alert { color: yellow; }\n';
const duplicateCascadeProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_duplicate_cascade_key_ordered_merge',
  files: [{ sourcePath: 'src/alerts.css', baseSourceText: duplicateRuleBase, workerSourceText: duplicateRuleWorker, headSourceText: duplicateRuleHead }]
});
assert.equal(duplicateCascadeProject.status, 'merged');
assert.equal(duplicateCascadeProject.summary.cssMergedFiles, 1);
assert.equal(duplicateCascadeProject.summary.cssDuplicateCascadeKeyBlockedFiles, 0);
assert.equal(duplicateCascadeProject.summary.cssOrderedCascadeOccurrenceEvidenceFiles, 1);
assert.equal(duplicateCascadeProject.summary.cssOrderedCascadeOccurrenceEvidenceRecords, 1);
assert.equal(duplicateCascadeProject.summary.cssParserEvidenceFiles, 1);
assert.match(duplicateCascadeProject.files[0].outputSourceText, /color: blue;\n  color: yellow/);
assert.equal(duplicateCascadeProject.files[0].result.orderedCascadeOccurrenceEvidence[0].cascadeKey, '.alert::color');
const cascadeSurface = matrixSurface(duplicateCascadeProject, 'css-cascade-merge-admission');
assert.equal(cascadeSurface.proofStatuses['css-cascade-merge'], 'passed');
assert.equal(cascadeSurface.missingRouteIds.includes('admit-css-cascade-merge'), false);

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
assert.equal(scopedDuplicateProject.summary.cssDuplicateCascadeKeyBlockedFiles, 0);
assert.equal(scopedDuplicateProject.summary.cssOrderedCascadeOccurrenceEvidenceFiles, 1);
assert.equal(scopedDuplicateProject.conflicts.some((conflict) => conflict.details.cascadeKey === '@layer theme::.alert::color'), true);
assert.equal(scopedDuplicateProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-duplicate-cascade-key-order-unproved'), false);

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
