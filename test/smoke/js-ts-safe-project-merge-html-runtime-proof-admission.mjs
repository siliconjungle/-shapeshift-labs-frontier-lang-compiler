import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const htmlEventHandlerBase = '<button data-frontier-key="save" onclick="save()">Save</button>\n';
const htmlEventHandlerWorker = '<button data-frontier-key="save" onclick="saveNow()">Save</button>\n';

const htmlEventHandlerClaimingProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_event_handler_runtime_claiming_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/view.html': [{
      id: 'html_event_handler_claiming',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/view.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundary: 'html-event-handler-attribute',
      boundaryAttributes: ['onclick'],
      sourceTexts: {
        base: htmlEventHandlerBase,
        worker: htmlEventHandlerWorker,
        head: htmlEventHandlerBase,
        output: htmlEventHandlerWorker
      },
      runtimeCommand: 'node test/html-runtime/event-handler-claiming.mjs',
      runtimeProbeId: 'html:event-handler-runtime-boundary:html-event-handler-attribute',
      runtimeEvidenceHash: 'html-runtime-evidence:event-handler-runtime-boundary:html-event-handler-attribute:event-handler-claiming',
      runtimeSignals: ['html-event-handler-runtime'],
      browserRuntimeEquivalenceClaim: true,
      semanticEquivalenceClaim: true
    }]
  },
  files: [{
    sourcePath: 'src/view.html',
    baseSourceText: htmlEventHandlerBase,
    workerSourceText: htmlEventHandlerWorker,
    headSourceText: htmlEventHandlerBase
  }]
});

assert.equal(htmlEventHandlerClaimingProofProject.status, 'blocked');
assert.equal(htmlEventHandlerClaimingProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlEventHandlerClaimingProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlEventHandlerClaimingProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlEventHandlerClaimingProofProject.files[0].result.admission.browserRuntimeEquivalenceClaim, false);
assert.equal(matrixSurface(htmlEventHandlerClaimingProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
