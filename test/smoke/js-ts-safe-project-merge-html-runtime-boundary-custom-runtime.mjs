import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';

function customRuntimeEvidence(label) {
  return {
    runtimeCommand: `node test/html-runtime/${label}.mjs`,
    runtimeProbeId: 'html:custom-runtime-attribute-boundary:html-custom-runtime-attribute',
    runtimeEvidenceHash: `html-runtime-evidence:custom-runtime-attribute-boundary:html-custom-runtime-attribute:${label}`,
    runtimeSignals: ['html-custom-runtime-attribute-runtime']
  };
}

const htmlCustomRuntimeBase = '<button data-frontier-key="load" hx-get="/old" data-hx-trigger="click">Load</button>\n';
const htmlCustomRuntimeWorker = '<button data-frontier-key="load" hx-get="/new" data-hx-trigger="revealed">Load</button>\n';
const htmlCustomRuntimeBoundaryAttributes = ['hx-get', 'data-hx-trigger'];
const htmlCustomRuntimeBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_custom_runtime_attribute_block',
  files: [{ sourcePath: 'src/hx.html', baseSourceText: htmlCustomRuntimeBase, workerSourceText: htmlCustomRuntimeWorker, headSourceText: htmlCustomRuntimeBase }]
});
assert.equal(htmlCustomRuntimeBlockedProject.status, 'blocked');
assert.equal(htmlCustomRuntimeBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlCustomRuntimeBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlCustomRuntimeBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'custom-runtime-attribute-boundary'), true);
const htmlCustomRuntimeBlockedConflict = htmlCustomRuntimeBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'custom-runtime-attribute-boundary');
assert.equal(htmlCustomRuntimeBlockedConflict.details.boundary, 'html-custom-runtime-attribute');
assert.deepEqual([...htmlCustomRuntimeBlockedConflict.details.boundaryAttributes].sort(), [...htmlCustomRuntimeBoundaryAttributes].sort());
assert.match(htmlCustomRuntimeBlockedConflict.details.proofGap.nextProof, /html-custom-runtime-attribute/);
assert.equal(htmlCustomRuntimeBlockedProject.files[0].admission.browserRuntimeEquivalenceClaim, false);

const htmlCustomRuntimeWrongOutputProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_custom_runtime_attribute_wrong_output_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/hx.html': [{
      id: 'html_custom_runtime_attribute_wrong_output',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/hx.html',
      reasonCode: 'custom-runtime-attribute-boundary',
      side: 'worker',
      boundary: 'html-custom-runtime-attribute',
      boundaryAttributes: htmlCustomRuntimeBoundaryAttributes,
      sourceTexts: { base: htmlCustomRuntimeBase, worker: htmlCustomRuntimeWorker, head: htmlCustomRuntimeBase, output: htmlCustomRuntimeBase },
      ...customRuntimeEvidence('custom-runtime-wrong-output')
    }]
  },
  files: [{ sourcePath: 'src/hx.html', baseSourceText: htmlCustomRuntimeBase, workerSourceText: htmlCustomRuntimeWorker, headSourceText: htmlCustomRuntimeBase }]
});
assert.equal(htmlCustomRuntimeWrongOutputProofProject.status, 'blocked');
assert.equal(htmlCustomRuntimeWrongOutputProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlCustomRuntimeWrongOutputProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlCustomRuntimeWrongOutputProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);

const htmlCustomRuntimeClaimingProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_custom_runtime_attribute_claiming_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/hx.html': [{
      id: 'html_custom_runtime_attribute_claiming',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/hx.html',
      reasonCode: 'custom-runtime-attribute-boundary',
      side: 'worker',
      boundary: 'html-custom-runtime-attribute',
      boundaryAttributes: htmlCustomRuntimeBoundaryAttributes,
      sourceTexts: { base: htmlCustomRuntimeBase, worker: htmlCustomRuntimeWorker, head: htmlCustomRuntimeBase, output: htmlCustomRuntimeWorker },
      ...customRuntimeEvidence('custom-runtime-claiming'),
      browserRuntimeEquivalenceClaim: true
    }]
  },
  files: [{ sourcePath: 'src/hx.html', baseSourceText: htmlCustomRuntimeBase, workerSourceText: htmlCustomRuntimeWorker, headSourceText: htmlCustomRuntimeBase }]
});
assert.equal(htmlCustomRuntimeClaimingProofProject.status, 'blocked');
assert.equal(htmlCustomRuntimeClaimingProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlCustomRuntimeClaimingProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(matrixSurface(htmlCustomRuntimeClaimingProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const htmlCustomRuntimeProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_custom_runtime_attribute_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/hx.html': [{
      id: 'html_custom_runtime_attribute_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/hx.html',
      reasonCode: 'custom-runtime-attribute-boundary',
      side: 'worker',
      boundary: 'html-custom-runtime-attribute',
      boundaryAttributes: htmlCustomRuntimeBoundaryAttributes,
      sourceTexts: { base: htmlCustomRuntimeBase, worker: htmlCustomRuntimeWorker, head: htmlCustomRuntimeBase, output: htmlCustomRuntimeWorker },
      ...customRuntimeEvidence('custom-runtime')
    }]
  },
  files: [{ sourcePath: 'src/hx.html', baseSourceText: htmlCustomRuntimeBase, workerSourceText: htmlCustomRuntimeWorker, headSourceText: htmlCustomRuntimeBase }]
});
assert.equal(htmlCustomRuntimeProvenProject.status, 'merged');
assert.equal(htmlCustomRuntimeProvenProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(htmlCustomRuntimeProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlCustomRuntimeProvenProject.files[0].result.runtimeBoundaryProofs[0].boundary, 'html-custom-runtime-attribute');
assert.deepEqual([...htmlCustomRuntimeProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes].sort(), [...htmlCustomRuntimeBoundaryAttributes].sort());
assert.equal(htmlCustomRuntimeProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeEvidenceBound, true);
assert.equal(htmlCustomRuntimeProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeSignals.includes('html-custom-runtime-attribute-runtime'), true);
assert.equal(htmlCustomRuntimeProvenProject.files[0].result.runtimeBoundaryProofs[0].requiredRuntimeSignals.includes('html-custom-runtime-attribute-runtime'), true);
assert.match(htmlCustomRuntimeProvenProject.outputFiles[0].sourceText, /hx-get="\/new"/);
assert.match(htmlCustomRuntimeProvenProject.outputFiles[0].sourceText, /data-hx-trigger="revealed"/);
