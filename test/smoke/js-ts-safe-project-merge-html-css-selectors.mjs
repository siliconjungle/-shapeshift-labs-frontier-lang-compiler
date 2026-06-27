import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, selectorProof } from './html-css-merge-test-helpers.mjs';

const selectorMoveBase = '.button { color: red; }\n';
const selectorMoveWorker = '.primary { color: red; }\n';
const selectorMoveHead = '.button { color: red; background-color: white; }\n';
const cssSelectorMoveProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_selector_move_conflict',
  files: [{ sourcePath: 'src/button.css', baseSourceText: selectorMoveBase, workerSourceText: selectorMoveWorker, headSourceText: selectorMoveHead }]
});
assert.equal(cssSelectorMoveProject.status, 'blocked');
assert.equal(cssSelectorMoveProject.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(cssSelectorMoveProject.summary.cssSelectorTargetConflictFiles, 1);
assert.equal(cssSelectorMoveProject.conflicts.some((conflict) => conflict.code === 'css-selector-target-conflict'), true);
assert.equal(matrixSurface(cssSelectorMoveProject, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'failed');

const cssSelectorMoveRebasedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_selector_move_rebased',
  cssMergeOptionsByPath: {
    'src/button.css': {
      selectorTargetGraphHash: 'target-graph-v1',
      cssSelectorTargetProofs: [selectorProof({ id: 'proof_project_selector_target_button_primary', graphHash: 'target-graph-v1', base: selectorMoveBase, worker: selectorMoveWorker, head: selectorMoveHead, fromSelectors: ['.button'], toSelectors: ['.primary'], specificity: [[0, 1, 0]] })]
    }
  },
  files: [{ sourcePath: 'src/button.css', baseSourceText: selectorMoveBase, workerSourceText: selectorMoveWorker, headSourceText: selectorMoveHead }]
});
assert.equal(cssSelectorMoveRebasedProject.status, 'merged');
assert.equal(cssSelectorMoveRebasedProject.summary.cssSelectorTargetRebasedFiles, 1);
assert.equal(cssSelectorMoveRebasedProject.files[0].result.selectorTargetEvidence.rebaseProofs[0].proofLevel, 'css-selector-target-source-bound');
assert.match(cssSelectorMoveRebasedProject.outputFiles[0].sourceText, /\.primary \{/);
assert.match(cssSelectorMoveRebasedProject.outputFiles[0].sourceText, /background-color: white/);
assert.equal(matrixSurface(cssSelectorMoveRebasedProject, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'passed');

const cssSpecificSelectorListBase = '.card > .button:hover, .toolbar .button::before { color: red; }\n';
const cssSpecificSelectorListWorker = '.card > .primary:hover, .toolbar .button::before { color: red; }\n';
const cssSpecificSelectorListHead = '.card > .button:hover, .toolbar .button::before { color: red; background-color: white; }\n';
const cssSpecificSelectorListConflict = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_specific_selector_list_conflict',
  files: [{ sourcePath: 'src/button.css', baseSourceText: cssSpecificSelectorListBase, workerSourceText: cssSpecificSelectorListWorker, headSourceText: cssSpecificSelectorListHead }]
});
assert.equal(cssSpecificSelectorListConflict.status, 'blocked');
const cssSpecificSelectorListMove = cssSpecificSelectorListConflict.conflicts.find((conflict) => conflict.code === 'css-selector-target-conflict')?.details.selectorMove;
assert.deepEqual(cssSpecificSelectorListMove?.beforeSelectors, ['.card > .button:hover', '.toolbar .button::before']);
assert.deepEqual(cssSpecificSelectorListMove?.afterSelectors, ['.card > .primary:hover', '.toolbar .button::before']);
assert.equal(cssSpecificSelectorListMove?.selectorTargetGraphHashPresent, false);
assert.equal(matrixSurface(cssSpecificSelectorListConflict, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'failed');

const cssSpecificSelectorListPartialEquivalence = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_specific_selector_list_partial_equivalence',
  cssMergeOptionsByPath: { 'src/button.css': { selectorTargetEquivalences: [{ fromSelectors: ['.card > .button:hover'], toSelectors: ['.card > .primary:hover'] }] } },
  files: [{ sourcePath: 'src/button.css', baseSourceText: cssSpecificSelectorListBase, workerSourceText: cssSpecificSelectorListWorker, headSourceText: cssSpecificSelectorListHead }]
});
assert.equal(cssSpecificSelectorListPartialEquivalence.status, 'blocked');
assert.equal(cssSpecificSelectorListPartialEquivalence.summary.cssSelectorTargetConflictFiles, 1);

const cssSpecificSelectorListRebased = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_specific_selector_list_rebased',
  cssMergeOptionsByPath: {
    'src/button.css': {
      selectorTargetGraphHash: 'specific-target-graph-v1',
      cssSelectorTargetProofs: [selectorProof({ id: 'proof_project_specific_selector_list', graphHash: 'specific-target-graph-v1', base: cssSpecificSelectorListBase, worker: cssSpecificSelectorListWorker, head: cssSpecificSelectorListHead, fromSelectors: ['.card > .button:hover', '.toolbar .button::before'], toSelectors: ['.card > .primary:hover', '.toolbar .button::before'], specificity: [[0, 3, 0], [0, 3, 0]] })]
    }
  },
  files: [{ sourcePath: 'src/button.css', baseSourceText: cssSpecificSelectorListBase, workerSourceText: cssSpecificSelectorListWorker, headSourceText: cssSpecificSelectorListHead }]
});
assert.equal(cssSpecificSelectorListRebased.status, 'merged');
assert.equal(cssSpecificSelectorListRebased.summary.cssSelectorTargetRebasedFiles, 1);
assert.equal(cssSpecificSelectorListRebased.summary.cssSelectorTargetGraphEvidenceFiles, 1);
assert.match(cssSpecificSelectorListRebased.outputFiles[0].sourceText, /\.card > \.primary:hover, \.toolbar \.button::before \{/);
assert.equal(cssSpecificSelectorListRebased.files[0].result.selectorTargetEvidence.rebaseProofs[0].cascadeKey, '.card > .primary:hover,.toolbar .button::before::background-color');

const cssModernPseudoSelectorBase = '.card:is(.interactive):where(.ready) .button::before, .panel:has(.button):not(.disabled) > .button { color: red; }\n';
const cssModernPseudoSelectorWorker = '.card:is(.interactive):where(.ready) .primary::before, .panel:has(.primary):not(.disabled) > .primary { color: red; }\n';
const cssModernPseudoSelectorHead = '.card:is(.interactive):where(.ready) .button::before, .panel:has(.button):not(.disabled) > .button { color: red; background-color: white; }\n';
const cssModernPseudoFromSelectors = ['.card:is(.interactive):where(.ready) .button::before', '.panel:has(.button):not(.disabled) > .button'];
const cssModernPseudoToSelectors = ['.card:is(.interactive):where(.ready) .primary::before', '.panel:has(.primary):not(.disabled) > .primary'];
const cssModernPseudoSpecificity = [[0, 5, 0], [0, 4, 0]];
const cssModernPseudoGraphHash = 'modern-pseudo-target-graph-v1';
const cssModernPseudoProofWithoutGraph = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_modern_pseudo_selector_proof_without_graph',
  cssMergeOptionsByPath: {
    'src/button.css': {
      cssSelectorTargetProofs: [selectorProof({ id: 'proof_project_modern_pseudo_selector_without_graph', graphHash: cssModernPseudoGraphHash, base: cssModernPseudoSelectorBase, worker: cssModernPseudoSelectorWorker, head: cssModernPseudoSelectorHead, fromSelectors: cssModernPseudoFromSelectors, toSelectors: cssModernPseudoToSelectors, specificity: cssModernPseudoSpecificity })]
    }
  },
  files: [{ sourcePath: 'src/button.css', baseSourceText: cssModernPseudoSelectorBase, workerSourceText: cssModernPseudoSelectorWorker, headSourceText: cssModernPseudoSelectorHead }]
});
assert.equal(cssModernPseudoProofWithoutGraph.status, 'blocked');
const cssModernPseudoProofWithoutGraphMove = cssModernPseudoProofWithoutGraph.conflicts.find((conflict) => conflict.code === 'css-selector-target-conflict')?.details.selectorMove;
assert.deepEqual(cssModernPseudoProofWithoutGraphMove?.beforeSelectors, cssModernPseudoFromSelectors);
assert.deepEqual(cssModernPseudoProofWithoutGraphMove?.afterSelectors, cssModernPseudoToSelectors);
assert.deepEqual(cssModernPseudoProofWithoutGraphMove?.beforeSpecificity, cssModernPseudoSpecificity);
assert.equal(cssModernPseudoProofWithoutGraphMove?.specificityInvariant, true);
assert.equal(cssModernPseudoProofWithoutGraphMove?.selectorTargetGraphHashPresent, false);

const cssModernPseudoSelectorRebased = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_modern_pseudo_selector_rebased',
  cssMergeOptionsByPath: {
    'src/button.css': {
      selectorTargetGraphHash: cssModernPseudoGraphHash,
      cssSelectorTargetProofs: [selectorProof({ id: 'proof_project_modern_pseudo_selector_target', graphHash: cssModernPseudoGraphHash, base: cssModernPseudoSelectorBase, worker: cssModernPseudoSelectorWorker, head: cssModernPseudoSelectorHead, fromSelectors: cssModernPseudoFromSelectors, toSelectors: cssModernPseudoToSelectors, specificity: cssModernPseudoSpecificity })]
    }
  },
  files: [{ sourcePath: 'src/button.css', baseSourceText: cssModernPseudoSelectorBase, workerSourceText: cssModernPseudoSelectorWorker, headSourceText: cssModernPseudoSelectorHead }]
});
assert.equal(cssModernPseudoSelectorRebased.status, 'merged');
const cssModernPseudoRebaseProof = cssModernPseudoSelectorRebased.files[0].result.selectorTargetEvidence.rebaseProofs[0];
assert.equal(cssModernPseudoRebaseProof.proofLevel, 'css-selector-target-source-bound');
assert.equal(cssModernPseudoRebaseProof.selectorTargetGraphHash, cssModernPseudoGraphHash);
assert.deepEqual(cssModernPseudoRebaseProof.fromSelectors, cssModernPseudoFromSelectors);
assert.deepEqual(cssModernPseudoRebaseProof.toSelectors, cssModernPseudoToSelectors);
assert.equal(cssModernPseudoRebaseProof.cascadeKey, '.card:is(.interactive):where(.ready) .primary::before,.panel:has(.primary):not(.disabled) > .primary::background-color');
assert.equal(matrixSurface(cssModernPseudoSelectorRebased, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'passed');
