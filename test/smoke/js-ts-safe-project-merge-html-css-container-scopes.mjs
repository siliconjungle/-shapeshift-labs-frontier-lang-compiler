import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const containerScope = '@container card (min-width: 30rem)';
const containerCssBase = `${containerScope} {\n  .button {\n    color: red;\n    padding-left: 1rem;\n  }\n}\n`;
const containerCssWorker = containerCssBase.replace('color: red', 'color: blue');
const containerCssHead = containerCssBase.replace('padding-left: 1rem;', 'padding-left: 1rem;\n    background-color: white;');
const containerCssOutput = `${containerScope} {\n  .button {\n    color: blue;\n    padding-left: 1rem;\n    background-color: white;\n  }\n}\n`;

const containerCssWrongShapeProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_container_scope_wrong_shape_proof',
  cssMergeOptionsByPath: { 'src/container.css': { scopedCascadeGraphHashesByShapeKey: { [containerScope]: 'hash_container_scope' }, cssScopedCascadeProofs: [scopedProof({ id: 'proof_css_project_container_wrong_shape', sourcePath: 'src/container.css', graphHash: 'hash_container_scope', base: containerCssBase, worker: containerCssWorker, head: containerCssHead, output: containerCssOutput, scope: containerScope, shapeKey: '@media (min-width: 30rem)', cascadeKeys: [`${containerScope}::.button::color`, `${containerScope}::.button::background-color`], properties: ['color', 'background-color'], sides: ['worker', 'head'] })] } },
  files: [{ sourcePath: 'src/container.css', baseSourceText: containerCssBase, workerSourceText: containerCssWorker, headSourceText: containerCssHead }]
});
assert.equal(containerCssWrongShapeProof.status, 'blocked');
assert.equal(containerCssWrongShapeProof.summary.cssScopedCascadeFiles, 1);
assert.equal(containerCssWrongShapeProof.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(containerCssWrongShapeProof.summary.cssScopedCascadeBlockedFiles, 1);
assert.equal(containerCssWrongShapeProof.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(containerCssWrongShapeProof.conflicts.some((conflict) => conflict.code === 'css-scoped-cascade-proof-blocked' && conflict.details.scopedCascadeGraphShapeKey === containerScope), true);
assert.equal(containerCssWrongShapeProof.files[0].result.browserCascadeEquivalenceClaim, false);

const containerCssWithShapeProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_container_scope_shape_proof',
  cssMergeOptionsByPath: { 'src/container.css': { scopedCascadeGraphHashesByShapeKey: { [containerScope]: 'hash_container_scope' }, cssScopedCascadeProofs: [scopedProof({ id: 'proof_css_project_container_shape', sourcePath: 'src/container.css', graphHash: 'hash_container_scope', base: containerCssBase, worker: containerCssWorker, head: containerCssHead, output: containerCssOutput, scope: containerScope, shapeKey: containerScope, cascadeKeys: [`${containerScope}::.button::color`, `${containerScope}::.button::background-color`], properties: ['color', 'background-color'], sides: ['worker', 'head'] })] } },
  files: [{ sourcePath: 'src/container.css', baseSourceText: containerCssBase, workerSourceText: containerCssWorker, headSourceText: containerCssHead }]
});
assert.equal(containerCssWithShapeProof.status, 'merged');
assert.equal(containerCssWithShapeProof.summary.cssScopedCascadeFiles, 1);
assert.equal(containerCssWithShapeProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(containerCssWithShapeProof.summary.cssScopedCascadeShapeEvidenceFiles, 1);
assert.equal(containerCssWithShapeProof.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(containerCssWithShapeProof.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(containerCssWithShapeProof.files[0].result.scopedCascadeProofs.every((proof) => proof.scopedCascadeGraphShapeKey === containerScope), true);
assert.equal(containerCssWithShapeProof.files[0].result.browserCascadeEquivalenceClaim, false);
assert.equal(matrixSurface(containerCssWithShapeProof, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');
assert.equal(matrixSurface(containerCssWithShapeProof, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}

function scopedProof({ id, sourcePath, graphHash, base, worker, head, output, scope, shapeKey, cascadeKeys, properties, sides }) {
  return {
    id,
    kind: 'css-source-bound-scoped-cascade-proof',
    status: 'passed',
    sourcePath,
    reasonCode: 'css-scoped-cascade-equivalence-unproved',
    sides,
    selectors: ['.button'],
    scopes: [scope],
    cascadeKeys,
    properties,
    scopedCascadeGraphHash: graphHash,
    scopedCascadeGraphShapeKey: shapeKey,
    baseSourceHash: hashSemanticValue(base),
    workerSourceHash: hashSemanticValue(worker),
    headSourceHash: hashSemanticValue(head),
    outputSourceHash: hashSemanticValue(output)
  };
}
