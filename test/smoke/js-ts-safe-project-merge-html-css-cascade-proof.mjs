import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const sourcePath = 'src/button.css';
const base = '.button { color: red; }\n';
const worker = '@media (min-width: 700px) { .button { color: red; } }\n';
const output = '@media (min-width: 700px) {\n  .button {\n    color: red;\n  }\n}\n';
const proof = {
  id: 'proof_css_project_source_shape_media',
  kind: 'css-source-bound-cascade-runtime-proof',
  status: 'passed',
  sourcePath,
  reasonCode: 'css-atrule-new-scope-unsupported',
  side: 'worker',
  shapeKey: 'at-rule:media::(min-width: 700px)',
  baseSourceHash: hashSemanticValue(base),
  workerSourceHash: hashSemanticValue(worker),
  headSourceHash: hashSemanticValue(base),
  outputSourceHash: hashSemanticValue(output),
  runtimeCommand: 'playwright test css-project-cascade-runtime.spec.ts',
  runtimeProbeId: 'css-project-media-cascade-probe',
  runtimeEvidenceHash: hashSemanticValue('src/button.css media project cascade runtime evidence'),
  runtimeSignals: ['css-cascade-runtime']
};

const project = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_cascade_runtime_proof',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      scopedCascadeGraphHash: 'hash_scoped_cascade',
      cssCascadeRuntimeProofs: [proof]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

assert.equal(project.status, 'merged');
assert.equal(project.summary.cssMergedFiles, 1);
assert.equal(project.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(project.files[0].result.browserCascadeEquivalenceClaim, true);
assert.equal(project.files[0].result.admission.browserCascadeEquivalenceClaim, true);
assert.equal(project.files[0].result.cascadeRuntimeProofs[0].reasonCode, 'css-atrule-new-scope-unsupported');
assert.equal(project.files[0].result.cascadeRuntimeProofs[0].runtimeEvidenceBound, true);
assert.equal(project.outputFiles[0].sourceText, output);
assert.equal(matrixSurface(project, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');
assert.equal(matrixSurface(project, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
