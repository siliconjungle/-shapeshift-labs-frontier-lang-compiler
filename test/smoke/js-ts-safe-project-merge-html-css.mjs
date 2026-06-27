import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { htmlCssProjectSummary } from '../../src/js-ts-safe-project-merge-html-css-summary.js';

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

const cssSelectorMoveRebasedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_selector_move_rebased',
  cssMergeOptionsByPath: {
    'src/button.css': {
      selectorTargetGraphHash: 'target-graph-v1',
      selectorTargetEquivalences: [{ sourcePath: 'src/button.css', fromSelectors: ['.button'], toSelectors: ['.primary'], fromSpecificity: [[0, 1, 0]], toSpecificity: [[0, 1, 0]], graphHash: 'target-graph-v1' }]
    }
  },
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: '.button { color: red; }\n',
    workerSourceText: '.primary { color: red; }\n',
    headSourceText: '.button { color: red; background-color: white; }\n'
  }]
});
assert.equal(cssSelectorMoveRebasedProject.status, 'merged');
assert.equal(cssSelectorMoveRebasedProject.summary.cssSelectorTargetRebasedFiles, 1);
assert.match(cssSelectorMoveRebasedProject.outputFiles[0].sourceText, /\.primary \{/);
assert.match(cssSelectorMoveRebasedProject.outputFiles[0].sourceText, /background-color: white/);
assert.equal(matrixSurface(cssSelectorMoveRebasedProject, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'passed');

const cssSpecificSelectorListBase = '.card > .button:hover, .toolbar .button::before { color: red; }\n';
const cssSpecificSelectorListWorker = '.card > .primary:hover, .toolbar .button::before { color: red; }\n';
const cssSpecificSelectorListHead = '.card > .button:hover, .toolbar .button::before { color: red; background-color: white; }\n';
const cssSpecificSelectorListConflict = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_specific_selector_list_conflict',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: cssSpecificSelectorListBase,
    workerSourceText: cssSpecificSelectorListWorker,
    headSourceText: cssSpecificSelectorListHead
  }]
});
assert.equal(cssSpecificSelectorListConflict.status, 'blocked');
assert.equal(cssSpecificSelectorListConflict.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(cssSpecificSelectorListConflict.summary.cssSelectorTargetGraphEvidenceFiles, 0);
assert.equal(cssSpecificSelectorListConflict.summary.cssSelectorSpecificityEvidenceFiles, 1);
assert.equal(cssSpecificSelectorListConflict.summary.cssSelectorTargetMoveFiles, 1);
assert.equal(cssSpecificSelectorListConflict.summary.cssSelectorTargetConflictFiles, 1);
const cssSpecificSelectorListMove = cssSpecificSelectorListConflict.conflicts.find((conflict) => conflict.code === 'css-selector-target-conflict')?.details.selectorMove;
assert.deepEqual(cssSpecificSelectorListMove?.beforeSelectors, ['.card > .button:hover', '.toolbar .button::before']);
assert.deepEqual(cssSpecificSelectorListMove?.afterSelectors, ['.card > .primary:hover', '.toolbar .button::before']);
assert.equal(cssSpecificSelectorListMove?.selectorTargetGraphHashPresent, false);
const cssSpecificSelectorListSurface = matrixSurface(cssSpecificSelectorListConflict, 'css-selector-target-evidence');
assert.equal(cssSpecificSelectorListSurface.proofStatuses['css-selector-target-evidence'], 'failed');
assert.equal(cssSpecificSelectorListSurface.missingRouteIds.includes('prove-css-selector-target-evidence'), true);

const cssSpecificSelectorListPartialEquivalence = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_specific_selector_list_partial_equivalence',
  cssMergeOptionsByPath: { 'src/button.css': { selectorTargetEquivalences: [{ fromSelectors: ['.card > .button:hover'], toSelectors: ['.card > .primary:hover'] }] } },
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: cssSpecificSelectorListBase,
    workerSourceText: cssSpecificSelectorListWorker,
    headSourceText: cssSpecificSelectorListHead
  }]
});
assert.equal(cssSpecificSelectorListPartialEquivalence.status, 'blocked');
assert.equal(cssSpecificSelectorListPartialEquivalence.summary.cssSelectorTargetConflictFiles, 1);

const cssSpecificSelectorListRebased = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_specific_selector_list_rebased',
  cssMergeOptionsByPath: {
    'src/button.css': {
      selectorTargetGraphHash: 'specific-target-graph-v1',
      selectorTargetEquivalences: [{
        sourcePath: 'src/button.css',
        fromSelectors: ['.card > .button:hover', '.toolbar .button::before'],
        toSelectors: ['.card > .primary:hover', '.toolbar .button::before'],
        fromSpecificity: [[0, 3, 0], [0, 3, 0]],
        toSpecificity: [[0, 3, 0], [0, 3, 0]],
        graphHash: 'specific-target-graph-v1'
      }]
    }
  },
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: cssSpecificSelectorListBase,
    workerSourceText: cssSpecificSelectorListWorker,
    headSourceText: cssSpecificSelectorListHead
  }]
});
assert.equal(cssSpecificSelectorListRebased.status, 'merged');
assert.equal(cssSpecificSelectorListRebased.summary.cssSelectorTargetRebasedFiles, 1);
assert.equal(cssSpecificSelectorListRebased.summary.cssSelectorSpecificityEvidenceFiles, 1);
assert.equal(cssSpecificSelectorListRebased.summary.cssSelectorTargetGraphEvidenceFiles, 1);
assert.match(cssSpecificSelectorListRebased.outputFiles[0].sourceText, /\.card > \.primary:hover, \.toolbar \.button::before \{/);
assert.match(cssSpecificSelectorListRebased.outputFiles[0].sourceText, /background-color: white/);
assert.equal(cssSpecificSelectorListRebased.files[0].result.selectorTargetEvidence.rebaseProofs[0].cascadeKey, '.card > .primary:hover,.toolbar .button::before::background-color');
assert.equal(matrixSurface(cssSpecificSelectorListRebased, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'passed');

const scopedCssBase = '@media (min-width: 700px) {\n  .button {\n    color: red;\n    padding-left: 1rem;\n  }\n}\n';
const scopedCssWorker = scopedCssBase.replace('color: red', 'color: blue');
const scopedCssHead = scopedCssBase.replace('padding-left: 1rem;', 'padding-left: 1rem;\n    background-color: white;');
const scopedCssMissingProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scope_missing_proof',
  files: [{ sourcePath: 'src/button.css', baseSourceText: scopedCssBase, workerSourceText: scopedCssWorker, headSourceText: scopedCssHead }]
});
assert.equal(scopedCssMissingProof.status, 'blocked');
assert.equal(scopedCssMissingProof.summary.cssScopedCascadeFiles, 1);
assert.equal(scopedCssMissingProof.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(scopedCssMissingProof.summary.cssScopedCascadeBlockedFiles, 1);
assert.equal(scopedCssMissingProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-scoped-cascade-equivalence-unproved'), true);

const scopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scope_with_proof',
  cssMergeOptionsByPath: { 'src/button.css': { scopedCascadeGraphHash: 'hash_scoped_cascade' } },
  files: [{ sourcePath: 'src/button.css', baseSourceText: scopedCssBase, workerSourceText: scopedCssWorker, headSourceText: scopedCssHead }]
});
assert.equal(scopedCssWithProof.status, 'merged');
assert.equal(scopedCssWithProof.summary.cssMergedFiles, 1);
assert.equal(scopedCssWithProof.summary.cssScopedCascadeFiles, 1);
assert.equal(scopedCssWithProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(scopedCssWithProof.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(matrixSurface(scopedCssWithProof, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');

const layerScopedReasonSummary = htmlCssProjectSummary([{
  language: 'css',
  sourcePath: 'src/layer.css',
  status: 'blocked',
  result: { conflicts: [{ details: { reasonCode: 'css-layer-cascade-scope-unproved' } }] }
}]);
assert.equal(layerScopedReasonSummary.cssScopedCascadeFiles, 1);
assert.equal(layerScopedReasonSummary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(layerScopedReasonSummary.cssScopedCascadeBlockedFiles, 1);

function matrixSurface(result, surface) { const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface); assert.ok(record, `missing ${surface} matrix surface`); return record; }
