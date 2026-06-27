import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { htmlCssProjectSummary } from '../../src/js-ts-safe-project-merge-html-css-summary.js';
import { matrixSurface, scopedProof } from './html-css-merge-test-helpers.mjs';

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

const scopedCssHashOnly = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scope_hash_only',
  cssMergeOptionsByPath: { 'src/button.css': { scopedCascadeGraphHash: 'hash_scoped_cascade' } },
  files: [{ sourcePath: 'src/button.css', baseSourceText: scopedCssBase, workerSourceText: scopedCssWorker, headSourceText: scopedCssHead }]
});
assert.equal(scopedCssHashOnly.status, 'blocked');
assert.equal(scopedCssHashOnly.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(scopedCssHashOnly.summary.cssScopedCascadeBlockedFiles, 1);
assert.equal(scopedCssHashOnly.conflicts.some((conflict) => conflict.code === 'css-scoped-cascade-proof-blocked'), true);

const scopedCssOutput = '@media (min-width: 700px) {\n  .button {\n    color: blue;\n    padding-left: 1rem;\n    background-color: white;\n  }\n}\n';
const scopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scope_with_proof',
  cssMergeOptionsByPath: {
    'src/button.css': {
      scopedCascadeGraphHash: 'hash_scoped_cascade',
      cssScopedCascadeProofs: [scopedProof({ id: 'proof_css_project_media_scope', sourcePath: 'src/button.css', graphHash: 'hash_scoped_cascade', base: scopedCssBase, worker: scopedCssWorker, head: scopedCssHead, output: scopedCssOutput, scope: '@media (min-width: 700px)', cascadeKeys: ['@media (min-width: 700px)::.button::color', '@media (min-width: 700px)::.button::background-color'], properties: ['color', 'background-color'], sides: ['worker', 'head'] })]
    }
  },
  files: [{ sourcePath: 'src/button.css', baseSourceText: scopedCssBase, workerSourceText: scopedCssWorker, headSourceText: scopedCssHead }]
});
assert.equal(scopedCssWithProof.status, 'merged');
assert.equal(scopedCssWithProof.summary.cssMergedFiles, 1);
assert.equal(scopedCssWithProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(scopedCssWithProof.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(scopedCssWithProof.files[0].result.scopedCascadeProofs.length, 2);
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
