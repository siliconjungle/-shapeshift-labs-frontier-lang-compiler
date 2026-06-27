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

const htmlInlineStyleBase = '<div data-frontier-key="card" style="color: red">Card</div>\n';
const htmlInlineStyleWorker = '<div data-frontier-key="card" style="color: blue">Card</div>\n';
const htmlInlineStyleBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_inline_style_runtime_block',
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlInlineStyleBase, workerSourceText: htmlInlineStyleWorker, headSourceText: htmlInlineStyleBase }]
});
assert.equal(htmlInlineStyleBlockedProject.status, 'blocked');
assert.equal(htmlInlineStyleBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlInlineStyleBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlInlineStyleBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'inline-style-runtime-boundary'), true);
const htmlInlineStyleBlockedConflict = htmlInlineStyleBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'inline-style-runtime-boundary');
assert.match(htmlInlineStyleBlockedConflict.details.proofGap.nextProof, /html-inline-style-attribute/);

const htmlInlineStyleProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_inline_style_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/view.html': [{
      id: 'html_inline_style_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/view.html',
      reasonCode: 'inline-style-runtime-boundary',
      side: 'worker',
      boundary: 'html-inline-style-attribute',
      boundaryAttributes: ['style'],
      sourceTexts: { base: htmlInlineStyleBase, worker: htmlInlineStyleWorker, head: htmlInlineStyleBase, output: htmlInlineStyleWorker }
    }]
  },
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlInlineStyleBase, workerSourceText: htmlInlineStyleWorker, headSourceText: htmlInlineStyleBase }]
});
assert.equal(htmlInlineStyleProvenProject.status, 'merged');
assert.equal(htmlInlineStyleProvenProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlInlineStyleProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlInlineStyleProvenProject.files[0].result.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlInlineStyleProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-inline-style-attribute');

const htmlIframeBase = '<iframe data-frontier-key="preview" src="/a.html" title="Preview"></iframe>\n';
const htmlIframeWorker = '<iframe data-frontier-key="preview" src="/b.html" title="Preview"></iframe>\n';
const htmlIframeHead = '<iframe class="embed" data-frontier-key="preview" src="/a.html" title="Preview"></iframe>\n';
const htmlIframeOutput = '<iframe class="embed" data-frontier-key="preview" src="/b.html" title="Preview"></iframe>\n';
const htmlIframeBlockedProject = safeMergeJsTsProject({ id: 'js_ts_safe_project_merge_html_iframe_runtime_block', files: [{ sourcePath: 'src/frame.html', baseSourceText: htmlIframeBase, workerSourceText: htmlIframeWorker, headSourceText: htmlIframeHead }] });
assert.equal(htmlIframeBlockedProject.status, 'blocked');
assert.equal(htmlIframeBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlIframeBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'iframe-runtime-boundary'), true);
assert.match(htmlIframeBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'iframe-runtime-boundary').details.proofGap.nextProof, /htmlRuntimeBoundaryProofsByPath/);
const htmlIframeProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_iframe_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: { 'src/frame.html': [{ id: 'html_iframe_runtime_source_bound', kind: 'html-source-bound-runtime-boundary-proof', status: 'passed', sourcePath: 'src/frame.html', reasonCode: 'iframe-runtime-boundary', side: 'worker', boundary: 'html-iframe-runtime-attribute', boundaryAttributes: ['src'], sourceTexts: { base: htmlIframeBase, worker: htmlIframeWorker, head: htmlIframeHead, output: htmlIframeOutput } }] },
  files: [{ sourcePath: 'src/frame.html', baseSourceText: htmlIframeBase, workerSourceText: htmlIframeWorker, headSourceText: htmlIframeHead }]
});
assert.equal(htmlIframeProvenProject.status, 'merged');
assert.equal(htmlIframeProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlIframeProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-iframe-runtime-attribute');
assert.match(htmlIframeProvenProject.outputFiles[0].sourceText, /src="\/b.html"/);

const htmlSrcdocBase = '<iframe data-frontier-key="preview" srcdoc="&lt;p&gt;A&lt;/p&gt;"></iframe>\n';
const htmlSrcdocWorker = '<iframe data-frontier-key="preview" srcdoc="&lt;p&gt;B&lt;/p&gt;"></iframe>\n';
const htmlSrcdocHead = '<iframe aria-label="Preview" data-frontier-key="preview" srcdoc="&lt;p&gt;A&lt;/p&gt;"></iframe>\n';
const htmlSrcdocOutput = '<iframe aria-label="Preview" data-frontier-key="preview" srcdoc="&lt;p&gt;B&lt;/p&gt;"></iframe>\n';
const htmlSrcdocBlockedProject = safeMergeJsTsProject({ id: 'js_ts_safe_project_merge_html_iframe_srcdoc_runtime_block', files: [{ sourcePath: 'src/srcdoc.html', baseSourceText: htmlSrcdocBase, workerSourceText: htmlSrcdocWorker, headSourceText: htmlSrcdocHead }] });
assert.equal(htmlSrcdocBlockedProject.status, 'blocked');
assert.equal(htmlSrcdocBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'iframe-srcdoc-runtime-boundary'), true);
const htmlSrcdocProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_iframe_srcdoc_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: { 'src/srcdoc.html': [{ id: 'html_iframe_srcdoc_source_bound', kind: 'html-source-bound-runtime-boundary-proof', status: 'passed', sourcePath: 'src/srcdoc.html', reasonCode: 'iframe-srcdoc-runtime-boundary', side: 'worker', boundary: 'html-iframe-srcdoc-attribute', boundaryAttributes: ['srcdoc'], sourceTexts: { base: htmlSrcdocBase, worker: htmlSrcdocWorker, head: htmlSrcdocHead, output: htmlSrcdocOutput } }] },
  files: [{ sourcePath: 'src/srcdoc.html', baseSourceText: htmlSrcdocBase, workerSourceText: htmlSrcdocWorker, headSourceText: htmlSrcdocHead }]
});
assert.equal(htmlSrcdocProvenProject.status, 'merged');
assert.equal(htmlSrcdocProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlSrcdocProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-iframe-srcdoc-attribute');
assert.match(htmlSrcdocProvenProject.outputFiles[0].sourceText, /srcdoc="&lt;p&gt;B&lt;\/p&gt;"/);

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
