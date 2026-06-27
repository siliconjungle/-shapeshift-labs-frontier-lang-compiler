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

const cssDeterministicShorthandProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_deterministic_shorthand_expansion',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: '.button { color: red; margin: 1rem; }\n',
    workerSourceText: '.button { color: blue; margin: 1rem; }\n',
    headSourceText: '.button { color: red; margin: 1rem 2rem; }\n'
  }]
});
assert.equal(cssDeterministicShorthandProject.status, 'merged');
assert.equal(cssDeterministicShorthandProject.summary.cssShorthandExpansionEvidenceFiles, 1);
assert.equal(cssDeterministicShorthandProject.summary.cssDeterministicShorthandExpansionFiles, 1);
assert.equal(cssDeterministicShorthandProject.summary.cssShorthandExpansionBlockedFiles, 0);
assert.equal(cssDeterministicShorthandProject.files[0].result.shorthandExpansionEvidence.changedShorthandCount, 2);
assert.equal(cssDeterministicShorthandProject.files[0].result.shorthandExpansionEvidence.expandedChangedShorthandCount, 2);
assert.match(cssDeterministicShorthandProject.outputFiles[0].sourceText, /margin: 1rem 2rem/);
assert.equal(matrixSurface(cssDeterministicShorthandProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');

const cssAmbiguousShorthandProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_ambiguous_shorthand_blocked',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: '.button { color: red; }\n',
    workerSourceText: '.button { color: blue; }\n',
    headSourceText: '.button { color: red; background: white; }\n'
  }]
});
assert.equal(cssAmbiguousShorthandProject.status, 'blocked');
assert.equal(cssAmbiguousShorthandProject.summary.cssShorthandExpansionEvidenceFiles, 1);
assert.equal(cssAmbiguousShorthandProject.summary.cssDeterministicShorthandExpansionFiles, 0);
assert.equal(cssAmbiguousShorthandProject.summary.cssShorthandExpansionBlockedFiles, 1);
assert.equal(cssAmbiguousShorthandProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-shorthand-expansion-unproved' && conflict.details.shorthandExpansion.reasonCode === 'css-shorthand-expansion-unsupported'), true);
const ambiguousMissing = cssAmbiguousShorthandProject.confidence.missingEvidence.find((item) => item.code === 'css-cascade-merge-proof-blocked');
assert.match(ambiguousMissing?.summary ?? '', /shorthand expansion blocker/);
assert.equal(matrixSurface(cssAmbiguousShorthandProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
