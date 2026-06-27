import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { parseCssSemanticSheet } from '@shapeshift-labs/frontier-lang-css';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const sourcePath = 'src/Button.module.css';
const generatedClassNameMap = { root: 'Button_root__hash', label: 'Button_label__hash' };
const jsTsUseSiteGraphHash = 'hash_css_module_use_sites';
const baseSourceText = [
  '.root {',
  '  color: red;',
  '}',
  ''
].join('\n');
const workerSourceText = [
  '.root {',
  '  color: red;',
  '}',
  '.label {',
  '  font-weight: 600;',
  '}',
  ''
].join('\n');
const headSourceText = [
  '.root {',
  '  color: blue;',
  '}',
  ''
].join('\n');
const outputSourceText = [
  '.root {',
  '  color: blue;',
  '}',
  '',
  '.label {',
  '  font-weight: 600;',
  '}',
  ''
].join('\n');

const missingGraphProject = mergeButtonModuleProject('js_ts_safe_project_merge_css_module_contract_missing_graph');
assert.equal(missingGraphProject.status, 'blocked');
assert.equal(missingGraphProject.summary.cssBlockedFiles, 1);
assert.equal(missingGraphProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-js-ts-use-site-graph-unproved'), true);
assert.equal(matrixSurface(missingGraphProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');

const hashOnlyProject = mergeButtonModuleProject('js_ts_safe_project_merge_css_module_contract_hash_only', {
  generatedClassNameMap,
  jsTsUseSiteGraphHash
});
assert.equal(hashOnlyProject.status, 'blocked');
assert.equal(hashOnlyProject.summary.cssBlockedFiles, 1);
assert.equal(hashOnlyProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-contract-source-proof-unproved'), true);
assert.equal(matrixSurface(hashOnlyProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');

const moduleHash = parseCssSemanticSheet(workerSourceText, {
  sourcePath,
  generatedClassNameMap,
  jsTsUseSiteGraphHash
}).cssModules.moduleHash;
const generatedClassNameMapHash = hashSemanticValue({
  kind: 'frontier.lang.css.modules.generatedClassNameMap.v1',
  generatedClassNameMap
});
const provenProject = mergeButtonModuleProject('js_ts_safe_project_merge_css_module_contract_source_bound_proof', {
  generatedClassNameMap,
  jsTsUseSiteGraphHash,
  cssModuleContractProofs: [{
    id: 'proof_css_project_module_label_export',
    kind: 'css-source-bound-module-contract-proof',
    status: 'passed',
    sourcePath,
    side: 'worker',
    changeKind: 'add',
    contractKey: 'export:label',
    contractKind: 'css-module-export',
    baseSourceHash: hashSemanticValue(baseSourceText),
    workerSourceHash: hashSemanticValue(workerSourceText),
    headSourceHash: hashSemanticValue(headSourceText),
    outputSourceHash: hashSemanticValue(outputSourceText),
    moduleHash,
    generatedClassNameMapHash,
    jsTsUseSiteGraphHash
  }]
});
assert.equal(provenProject.status, 'merged');
assert.equal(provenProject.summary.cssMergedFiles, 1);
assert.equal(provenProject.files[0].result.cssModuleContractProofs.length, 1);
assert.equal(provenProject.files[0].result.admission.cssModuleContractProofs.length, 1);
assert.equal(provenProject.files[0].result.workerChangedCssModuleContracts, 1);
assert.equal(provenProject.outputFiles[0].sourceText, outputSourceText);
assert.equal(matrixSurface(provenProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');

function mergeButtonModuleProject(id, cssOptions = {}) {
  return safeMergeJsTsProject({
    id,
    cssMergeOptionsByPath: { [sourcePath]: cssOptions },
    files: [{ language: 'css', sourcePath, baseSourceText, workerSourceText, headSourceText }]
  });
}

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
