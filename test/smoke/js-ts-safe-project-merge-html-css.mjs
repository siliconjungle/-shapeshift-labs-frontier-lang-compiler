import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';

const htmlBase = [
  '<main id="app">',
  '  <h1>Todo</h1>',
  '  <button data-frontier-key="save" type="button">Save</button>',
  '</main>',
  ''
].join('\n');
const htmlWorker = htmlBase.replace('Todo</h1>', 'Todos</h1>');
const htmlHead = htmlBase.replace('type="button"', 'type="button" aria-label="Save item"');
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
assert.equal(mixedProject.summary.htmlExplicitIdentityEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlPathOnlyIdentityResidualFiles, 1);
assert.equal(mixedProject.summary.htmlDuplicateIdentityEvidenceFiles, 0);
assert.equal(mixedProject.summary.htmlDuplicateIdentityKeys, 0);
assert.equal(mixedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 0);
assert.equal(mixedProject.summary.htmlFrameworkBoundaryEvidenceFiles, 0);
assert.equal(mixedProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(mixedProject.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(mixedProject.summary.cssSelectorTargetGraphEvidenceFiles, 0);
assert.equal(mixedProject.summary.cssSelectorSpecificityEvidenceFiles, 1);
assert.equal(mixedProject.summary.cssSelectorTargetMoveFiles, 0);
assert.equal(mixedProject.summary.htmlCssStructuralTargetEvidenceFiles, 2);
assert.equal(mixedProject.summary.cssScopedCascadeFiles, 0);
assert.equal(mixedProject.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(mixedProject.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(mixedProject.summary.cssDependencySurfaceFiles, 0);
assert.equal(mixedProject.summary.cssDependencyGraphEvidenceFiles, 0);
assert.equal(mixedProject.summary.cssDependencyGraphMissingProofFiles, 0);
assert.equal(mixedProject.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(mixedProject.summary.htmlCssBrowserRuntimeProofs, 0);
const outputByPath = new Map(mixedProject.outputFiles.map((file) => [file.sourcePath, file]));
assert.equal(outputByPath.get('src/view.html').language, 'html');
assert.equal(outputByPath.get('src/view.html').operation, 'merged-html-source');
assert.match(outputByPath.get('src/view.html').sourceText, /<h1>Todos<\/h1>/);
assert.match(outputByPath.get('src/view.html').sourceText, /aria-label="Save item"/);
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

const htmlClassTokenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_class_tokens',
  files: [{
    sourcePath: 'src/panel.html',
    baseSourceText: '<div data-frontier-key="panel" class="card selected muted">Panel</div>\n',
    workerSourceText: '<div data-frontier-key="panel" class="card muted">Panel</div>\n',
    headSourceText: '<div data-frontier-key="panel" class="card selected muted compact">Panel</div>\n'
  }]
});
assert.equal(htmlClassTokenProject.status, 'merged');
assert.equal(htmlClassTokenProject.summary.htmlClassTokenMergeFiles, 1);
assert.equal(htmlClassTokenProject.summary.htmlClassTokenMergeEvidenceRecords, 1);
assert.match(htmlClassTokenProject.outputFiles[0].sourceText, /class="card muted compact"/);
assert.deepEqual(htmlClassTokenProject.files[0].result.htmlClassTokenMergeEvidence[0].workerRemovedTokens, ['selected']);
assert.deepEqual(htmlClassTokenProject.files[0].result.htmlClassTokenMergeEvidence[0].headAddedTokens, ['compact']);
assert.equal(htmlClassTokenProject.files[0].result.htmlClassTokenMergeEvidence[0].browserRenderEquivalenceClaim, false);
assert.equal(matrixSurface(htmlClassTokenProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');

const htmlDuplicateIdentityBase = [
  '<main id="app">',
  '  <button data-frontier-key="dup">A</button>',
  '  <button data-frontier-key="dup">B</button>',
  '</main>',
  ''
].join('\n');
const htmlDuplicateIdentityProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_duplicate_identity',
  files: [{
    sourcePath: 'src/view.html',
    baseSourceText: htmlDuplicateIdentityBase,
    workerSourceText: htmlDuplicateIdentityBase.replace('A</button>', 'Save</button>'),
    headSourceText: htmlDuplicateIdentityBase.replace('id="app"', 'id="app" class="shell"')
  }]
});
assert.equal(htmlDuplicateIdentityProject.status, 'blocked');
assert.equal(htmlDuplicateIdentityProject.summary.htmlBlockedFiles, 1);
assert.equal(htmlDuplicateIdentityProject.summary.htmlIdentityEvidenceFiles, 0);
assert.equal(htmlDuplicateIdentityProject.summary.htmlIdentityEvidenceFailedFiles, 1);
assert.equal(htmlDuplicateIdentityProject.summary.htmlDuplicateIdentityEvidenceFiles, 1);
assert.equal(htmlDuplicateIdentityProject.summary.htmlDuplicateIdentityKeys, 3);
assert.equal(htmlDuplicateIdentityProject.conflicts.some((conflict) => conflict.code === 'html-duplicate-explicit-identity'), true);
assert.equal(htmlDuplicateIdentityProject.conflicts.some((conflict) => conflict.details.reasonCode === 'html-duplicate-explicit-identity'), true);
const htmlDuplicateIdentitySurface = matrixSurface(htmlDuplicateIdentityProject, 'html-identity-evidence');
assert.equal(htmlDuplicateIdentitySurface.proofStatuses['html-identity-evidence'], 'failed');
assert.equal(htmlDuplicateIdentitySurface.missingRouteIds.includes('prove-html-identity-evidence'), true);

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
assert.equal(htmlBlockedProject.summary.htmlExplicitIdentityEvidenceFiles, 0);
assert.equal(htmlBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlBlockedProject.conflicts.some((conflict) => conflict.code === 'html-proof-gap-blocked'), true);
assert.equal(htmlBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'script-runtime-boundary'), true);
assert.equal(typeof htmlBlockedProject.files[0].baseHash, 'string');
assert.equal(typeof htmlBlockedProject.files[0].workerHash, 'string');
assert.equal(typeof htmlBlockedProject.files[0].headHash, 'string');
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
assert.equal(typeof cssBlockedProject.files[0].baseHash, 'string');
assert.equal(typeof cssBlockedProject.files[0].workerHash, 'string');
assert.equal(typeof cssBlockedProject.files[0].headHash, 'string');
const cssBlockedSurface = matrixSurface(cssBlockedProject, 'css-cascade-merge-admission');
assert.equal(cssBlockedSurface.proofStatuses['css-cascade-merge'], 'failed');
assert.equal(cssBlockedSurface.missingRouteIds.includes('admit-css-cascade-merge'), true);
