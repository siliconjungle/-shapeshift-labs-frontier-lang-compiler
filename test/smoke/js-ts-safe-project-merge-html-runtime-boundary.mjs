import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const htmlEventHandlerBase = '<button data-frontier-key="save" onclick="save()">Save</button>\n';
const htmlEventHandlerWorker = '<button data-frontier-key="save" onclick="saveNow()">Save</button>\n';
const htmlEventHandlerHead = htmlEventHandlerBase;
const htmlEventHandlerBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_event_handler_runtime_block',
  files: [{
    sourcePath: 'src/view.html',
    baseSourceText: htmlEventHandlerBase,
    workerSourceText: htmlEventHandlerWorker,
    headSourceText: htmlEventHandlerHead
  }]
});
assert.equal(htmlEventHandlerBlockedProject.status, 'blocked');
assert.equal(htmlEventHandlerBlockedProject.summary.htmlBlockedFiles, 1);
assert.equal(htmlEventHandlerBlockedProject.summary.htmlParserEvidenceFiles, 1);
assert.equal(htmlEventHandlerBlockedProject.summary.htmlExplicitIdentityEvidenceFiles, 1);
assert.equal(htmlEventHandlerBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlEventHandlerBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlEventHandlerBlockedProject.conflicts.some((conflict) => conflict.code === 'html-proof-gap-blocked'), true);
assert.equal(htmlEventHandlerBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'event-handler-runtime-boundary'), true);
assert.equal(htmlEventHandlerBlockedProject.files[0].result.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlEventHandlerBlockedProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
const htmlEventHandlerBlockedSurface = matrixSurface(htmlEventHandlerBlockedProject, 'html-structural-merge-admission');
assert.equal(htmlEventHandlerBlockedSurface.proofStatuses['html-structural-merge'], 'failed');
assert.equal(htmlEventHandlerBlockedSurface.missingRouteIds.includes('admit-html-structural-merge'), true);
const htmlEventHandlerBlockedMissingEvidence = htmlEventHandlerBlockedProject.confidence.missingEvidence.find((item) => item.code === 'html-structural-merge-proof-blocked');
assert.equal(htmlEventHandlerBlockedMissingEvidence.routeNext, 'attach-source-bound-html-runtime-proof-or-fix-duplicate-identity');
assert.equal(htmlEventHandlerBlockedMissingEvidence.suggestedInput.htmlRuntimeBoundaryProofsByPath, true);
assert.match(htmlEventHandlerBlockedMissingEvidence.summary, /exact base\/worker\/head\/output/);
const htmlEventHandlerBlockedConflict = htmlEventHandlerBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'event-handler-runtime-boundary');
assert.match(htmlEventHandlerBlockedConflict.details.proofGap.nextProof, /htmlRuntimeBoundaryProofsByPath/);

const htmlEventHandlerWrongProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_event_handler_runtime_wrong_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/view.html': [{
      id: 'html_event_handler_wrong_output',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/view.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundary: 'html-event-handler-attribute',
      boundaryAttributes: ['onclick'],
      sourceTexts: { base: htmlEventHandlerBase, worker: htmlEventHandlerWorker, head: htmlEventHandlerHead, output: htmlEventHandlerBase }
    }]
  },
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlEventHandlerBase, workerSourceText: htmlEventHandlerWorker, headSourceText: htmlEventHandlerHead }]
});
assert.equal(htmlEventHandlerWrongProofProject.status, 'blocked');
assert.equal(htmlEventHandlerWrongProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlEventHandlerWrongProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'event-handler-runtime-boundary'), true);
assert.equal(htmlEventHandlerWrongProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);

const htmlEventHandlerProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_event_handler_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/view.html': [{
      id: 'html_event_handler_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/view.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundary: 'html-event-handler-attribute',
      boundaryAttributes: ['onclick'],
      sourceTexts: { base: htmlEventHandlerBase, worker: htmlEventHandlerWorker, head: htmlEventHandlerHead, output: htmlEventHandlerWorker }
    }]
  },
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlEventHandlerBase, workerSourceText: htmlEventHandlerWorker, headSourceText: htmlEventHandlerHead }]
});
assert.equal(htmlEventHandlerProvenProject.status, 'merged');
assert.equal(htmlEventHandlerProvenProject.summary.htmlBlockedFiles, 0);
assert.equal(htmlEventHandlerProvenProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlEventHandlerProvenProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(htmlEventHandlerProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlEventHandlerProvenProject.conflicts.length, 0);
assert.match(htmlEventHandlerProvenProject.outputFiles[0].sourceText, /saveNow\(\)/);
assert.equal(htmlEventHandlerProvenProject.files[0].result.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlEventHandlerProvenProject.files[0].admission.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlEventHandlerProvenProject.files[0].result.runtimeBoundaryProofs[0].sourcePath, 'src/view.html');
assert.equal(matrixSurface(htmlEventHandlerProvenProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');
assert.equal(matrixSurface(htmlEventHandlerProvenProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
