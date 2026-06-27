import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const cssShorthandProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_shorthand_conflict',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: '.button { border-top: 1px solid red; }\n',
    workerSourceText: '.button { border-top: 2px solid red; }\n',
    headSourceText: '.button { border-top: 1px solid red; border-top-color: blue; }\n'
  }]
});
assert.equal(cssShorthandProject.status, 'blocked');
assert.equal(cssShorthandProject.summary.cssBlockedFiles, 1);
assert.equal(cssShorthandProject.summary.cssParserEvidenceFiles, 1);
assert.equal(cssShorthandProject.conflicts.some((conflict) => conflict.code === 'css-shorthand-longhand-conflict'), true);
assert.equal(cssShorthandProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-shorthand-longhand-conflict'), true);
assert.equal(matrixSurface(cssShorthandProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
