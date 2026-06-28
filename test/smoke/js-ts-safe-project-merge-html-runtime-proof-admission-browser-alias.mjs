import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, runtimeProofCapsule, sourceHashBinding } from './html-css-merge-test-helpers.mjs';

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
      sourceTexts: { base: htmlEventHandlerBase, worker: htmlEventHandlerWorker, head: htmlEventHandlerBase, output: htmlEventHandlerWorker },
      runtimeCommand: 'node test/html-runtime/event-handler-claiming.mjs',
      runtimeProbeId: 'html:event-handler-runtime-boundary:html-event-handler-attribute',
      runtimeEvidenceHash: 'html-runtime-evidence:event-handler-runtime-boundary:html-event-handler-attribute:event-handler-claiming',
      runtimeSignals: ['html-event-handler-runtime'],
      browserRuntimeEquivalenceClaim: true,
      semanticEquivalenceClaim: true
    }]
  },
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlEventHandlerBase, workerSourceText: htmlEventHandlerWorker, headSourceText: htmlEventHandlerBase }]
});

assert.equal(htmlEventHandlerClaimingProofProject.status, 'blocked');
assert.equal(htmlEventHandlerClaimingProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlEventHandlerClaimingProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlEventHandlerClaimingProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlEventHandlerClaimingProofProject.files[0].result.admission.browserRuntimeEquivalenceClaim, false);
assert.equal(matrixSurface(htmlEventHandlerClaimingProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const htmlEventHandlerLegacyAliasProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_event_handler_browser_runtime_proof_legacy_alias',
  htmlBrowserRuntimeProofsByPath: {
    'src/view.html': [{
      id: 'html_event_handler_browser_runtime_legacy_alias',
      kind: 'html-source-bound-browser-runtime-proof',
      status: 'passed',
      sourcePath: 'src/view.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundaries: ['html-event-handler-attribute'],
      attributeNames: ['onclick'],
      ...sourceHashBinding(htmlEventHandlerBase, htmlEventHandlerWorker, htmlEventHandlerBase, htmlEventHandlerWorker),
      runtimeCommand: 'node test/html-runtime/event-handler-browser-proof.mjs',
      runtimeProbeId: 'html:event-handler-runtime-boundary:html-event-handler-attribute',
      runtimeEvidenceHash: 'html-runtime-evidence:event-handler-runtime-boundary:html-event-handler-attribute:browser-proof',
      runtimeSignals: ['html-event-handler-runtime'],
      browserRuntimeEquivalenceClaim: false,
      browserRenderEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }]
  },
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlEventHandlerBase, workerSourceText: htmlEventHandlerWorker, headSourceText: htmlEventHandlerBase }]
});

assert.equal(htmlEventHandlerLegacyAliasProofProject.status, 'blocked');
assert.equal(htmlEventHandlerLegacyAliasProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlEventHandlerLegacyAliasProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(matrixSurface(htmlEventHandlerLegacyAliasProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const htmlEventHandlerStrictBrowserProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_event_handler_browser_runtime_proof_capsule',
  htmlBrowserRuntimeProofsByPath: {
    'src/view.html': [{
      id: 'html_event_handler_browser_runtime_capsule',
      kind: 'html-source-bound-browser-runtime-proof',
      status: 'passed',
      sourcePath: 'src/view.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundaries: ['html-event-handler-attribute'],
      attributeNames: ['onclick'],
      ...sourceHashBinding(htmlEventHandlerBase, htmlEventHandlerWorker, htmlEventHandlerBase, htmlEventHandlerWorker),
      runtimeProofCapsule: runtimeProofCapsule({
        command: 'node test/html-runtime/event-handler-browser-proof.mjs',
        probeId: 'html:event-handler-runtime-boundary:html-event-handler-attribute',
        evidenceHash: 'html-runtime-evidence:event-handler-runtime-boundary:html-event-handler-attribute:browser-proof',
        signals: ['html-event-handler-runtime'],
        label: 'event-handler-browser-proof'
      }),
      browserRuntimeEquivalenceClaim: false,
      browserRenderEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }]
  },
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlEventHandlerBase, workerSourceText: htmlEventHandlerWorker, headSourceText: htmlEventHandlerBase }]
});

const strictBrowserProofRecord = htmlEventHandlerStrictBrowserProofProject.files[0].result.runtimeBoundaryProofs[0];
assert.equal(htmlEventHandlerStrictBrowserProofProject.status, 'merged');
assert.equal(htmlEventHandlerStrictBrowserProofProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(htmlEventHandlerStrictBrowserProofProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(strictBrowserProofRecord.kind, 'html-source-bound-browser-runtime-proof');
assert.equal(strictBrowserProofRecord.runtimeEvidenceBound, true);
assert.equal(strictBrowserProofRecord.runtimeLayoutShiftHash, 'layout-shift:event-handler-browser-proof');
assert.equal(strictBrowserProofRecord.browserRenderEquivalenceClaim, false);
assert.equal(strictBrowserProofRecord.semanticEquivalenceClaim, false);
assert.equal(matrixSurface(htmlEventHandlerStrictBrowserProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');
