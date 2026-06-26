import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const htmlBase = [
  '<main id="app">',
  '  <h1>Todo</h1>',
  '  <button data-frontier-key="save" type="button">Save</button>',
  '</main>',
  ''
].join('\n');
const htmlWorker = htmlBase.replace('Todo</h1>', 'Todos</h1>');
const htmlHead = htmlBase.replace('type="button"', 'type="button" disabled');
const cssBase = [
  '.button {',
  '  color: red;',
  '  padding: 1rem;',
  '}',
  ''
].join('\n');
const cssWorker = cssBase.replace('color: red', 'color: blue');
const cssHead = [
  '.button {',
  '  color: red;',
  '  padding: 1rem;',
  '  background-color: white;',
  '}',
  ''
].join('\n');

const mixedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css',
  baseFiles: {
    'src/view.html': htmlBase,
    'src/button.css': cssBase
  },
  workerFiles: {
    'src/view.html': htmlWorker,
    'src/button.css': cssWorker
  },
  headFiles: {
    'src/view.html': htmlHead,
    'src/button.css': cssHead
  }
});
assert.equal(mixedProject.status, 'merged');
assert.equal(mixedProject.summary.htmlFiles, 1);
assert.equal(mixedProject.summary.cssFiles, 1);
assert.equal(mixedProject.summary.htmlCssFiles, 2);
assert.equal(mixedProject.summary.htmlMergedFiles, 1);
assert.equal(mixedProject.summary.cssMergedFiles, 1);
assert.equal(mixedProject.summary.htmlCssMergedFiles, 2);
assert.equal(mixedProject.summary.htmlParserEvidenceFiles, 1);
assert.equal(mixedProject.summary.cssParserEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlCssParserEvidenceFiles, 2);
assert.equal(mixedProject.summary.htmlIdentityEvidenceFiles, 1);
assert.equal(mixedProject.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlCssStructuralTargetEvidenceFiles, 2);
assert.equal(mixedProject.summary.htmlCssBrowserRuntimeProofs, 0);
const outputByPath = new Map(mixedProject.outputFiles.map((file) => [file.sourcePath, file]));
assert.equal(outputByPath.get('src/view.html').language, 'html');
assert.equal(outputByPath.get('src/view.html').operation, 'merged-html-source');
assert.match(outputByPath.get('src/view.html').sourceText, /<h1>Todos<\/h1>/);
assert.match(outputByPath.get('src/view.html').sourceText, /disabled/);
assert.equal(outputByPath.get('src/button.css').language, 'css');
assert.equal(outputByPath.get('src/button.css').operation, 'merged-css-source');
assert.match(outputByPath.get('src/button.css').sourceText, /color: blue/);
assert.match(outputByPath.get('src/button.css').sourceText, /background-color: white/);
assert.equal(matrixSurface(mixedProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');
assert.equal(matrixSurface(mixedProject, 'html-parser-source-evidence').proofStatuses['html-parser-source-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-parser-source-evidence').proofStatuses['css-parser-source-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'html-identity-evidence').proofStatuses['html-identity-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'passed');
const browserSurface = matrixSurface(mixedProject, 'html-css-browser-runtime-proof');
assert.equal(browserSurface.proofStatuses['browser-runtime-proof'], 'missing');
assert.equal(browserSurface.missingRouteIds.includes('prove-html-css-browser-runtime'), true);

const htmlBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_runtime_block',
  files: [{
    sourcePath: 'src/view.html',
    baseSourceText: '<script>window.value = 1;</script>\n',
    workerSourceText: '<script>window.value = 2;</script>\n',
    headSourceText: '<script>window.value = 1;</script>\n'
  }]
});
assert.equal(htmlBlockedProject.status, 'blocked');
assert.equal(htmlBlockedProject.summary.htmlBlockedFiles, 1);
assert.equal(htmlBlockedProject.summary.htmlParserEvidenceFiles, 1);
assert.equal(htmlBlockedProject.conflicts.some((conflict) => conflict.code === 'html-proof-gap-blocked'), true);
const htmlBlockedSurface = matrixSurface(htmlBlockedProject, 'html-structural-merge-admission');
assert.equal(htmlBlockedSurface.proofStatuses['html-structural-merge'], 'failed');
assert.equal(htmlBlockedSurface.missingRouteIds.includes('admit-html-structural-merge'), true);

const cssBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_conflict',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: cssBase,
    workerSourceText: cssWorker,
    headSourceText: cssBase.replace('color: red', 'color: green')
  }]
});
assert.equal(cssBlockedProject.status, 'blocked');
assert.equal(cssBlockedProject.summary.cssBlockedFiles, 1);
assert.equal(cssBlockedProject.summary.cssParserEvidenceFiles, 1);
assert.equal(cssBlockedProject.conflicts.some((conflict) => conflict.code === 'css-cascade-declaration-conflict'), true);
const cssBlockedSurface = matrixSurface(cssBlockedProject, 'css-cascade-merge-admission');
assert.equal(cssBlockedSurface.proofStatuses['css-cascade-merge'], 'failed');
assert.equal(cssBlockedSurface.missingRouteIds.includes('admit-css-cascade-merge'), true);

const cssSelectorMoveProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_selector_move_conflict',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: '.button { color: red; }\n',
    workerSourceText: '.primary { color: red; }\n',
    headSourceText: '.button { color: red; background-color: white; }\n'
  }]
});
assert.equal(cssSelectorMoveProject.status, 'blocked');
assert.equal(cssSelectorMoveProject.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(cssSelectorMoveProject.summary.cssSelectorTargetConflictFiles, 1);
assert.equal(cssSelectorMoveProject.conflicts.some((conflict) => conflict.code === 'css-selector-target-conflict'), true);
const cssSelectorMoveSurface = matrixSurface(cssSelectorMoveProject, 'css-selector-target-evidence');
assert.equal(cssSelectorMoveSurface.proofStatuses['css-selector-target-evidence'], 'failed');
assert.equal(cssSelectorMoveSurface.missingRouteIds.includes('prove-css-selector-target-evidence'), true);

const scopedCssBase = '@media (min-width: 700px) {\n  .button {\n    color: red;\n    padding-left: 1rem;\n  }\n}\n';
const scopedCssWorker = scopedCssBase.replace('color: red', 'color: blue');
const scopedCssHead = scopedCssBase.replace('padding-left: 1rem;', 'padding-left: 1rem;\n    background-color: white;');
const scopedCssMissingProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scope_missing_proof',
  files: [{ sourcePath: 'src/button.css', baseSourceText: scopedCssBase, workerSourceText: scopedCssWorker, headSourceText: scopedCssHead }]
});
assert.equal(scopedCssMissingProof.status, 'blocked');
assert.equal(scopedCssMissingProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-scoped-cascade-equivalence-unproved'), true);

const scopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scope_with_proof',
  cssMergeOptionsByPath: { 'src/button.css': { scopedCascadeGraphHash: 'hash_scoped_cascade' } },
  files: [{ sourcePath: 'src/button.css', baseSourceText: scopedCssBase, workerSourceText: scopedCssWorker, headSourceText: scopedCssHead }]
});
assert.equal(scopedCssWithProof.status, 'merged');
assert.equal(scopedCssWithProof.summary.cssMergedFiles, 1);
assert.equal(matrixSurface(scopedCssWithProof, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
