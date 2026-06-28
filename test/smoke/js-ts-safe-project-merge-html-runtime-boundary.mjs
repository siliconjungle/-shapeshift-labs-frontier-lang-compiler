import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, runtimeEvidence } from './html-css-merge-test-helpers.mjs';

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
assert.equal(htmlEventHandlerBlockedMissingEvidence.routeNext, 'prove-parser-identity-and-runtime-boundary-evidence-or-fix-duplicate-identity');
assert.equal(htmlEventHandlerBlockedMissingEvidence.suggestedInput.htmlRuntimeBoundaryProofsByPath, true);
assert.match(htmlEventHandlerBlockedMissingEvidence.summary, /parser\/source evidence and stable identity evidence/);
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
      sourceTexts: { base: htmlEventHandlerBase, worker: htmlEventHandlerWorker, head: htmlEventHandlerHead, output: htmlEventHandlerBase },
      ...runtimeEvidence('event-handler-runtime-boundary', 'html-event-handler-attribute', 'event-handler-wrong-output')
    }]
  },
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlEventHandlerBase, workerSourceText: htmlEventHandlerWorker, headSourceText: htmlEventHandlerHead }]
});
assert.equal(htmlEventHandlerWrongProofProject.status, 'blocked');
assert.equal(htmlEventHandlerWrongProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlEventHandlerWrongProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'event-handler-runtime-boundary'), true);
assert.equal(htmlEventHandlerWrongProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);

const htmlEventHandlerSourceOnlyProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_event_handler_runtime_source_only_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/view.html': [{
      id: 'html_event_handler_source_only',
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
assert.equal(htmlEventHandlerSourceOnlyProofProject.status, 'blocked');
assert.equal(htmlEventHandlerSourceOnlyProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlEventHandlerSourceOnlyProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(matrixSurface(htmlEventHandlerSourceOnlyProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

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
      sourceTexts: { base: htmlEventHandlerBase, worker: htmlEventHandlerWorker, head: htmlEventHandlerHead, output: htmlEventHandlerWorker },
      ...runtimeEvidence('event-handler-runtime-boundary', 'html-event-handler-attribute', 'event-handler')
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
assert.equal(htmlEventHandlerProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeEvidenceBound, true);
assert.equal(htmlEventHandlerProvenProject.files[0].result.runtimeBoundaryProofs[0].proofLevel, 'html-runtime-boundary-evidence-bound');
assert.equal(htmlEventHandlerProvenProject.files[0].result.admission.reasonCodes.includes('html-runtime-boundary-evidence-bound'), true);
assert.equal(htmlEventHandlerProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeSignals.includes('html-event-handler-runtime'), true);
assert.equal(matrixSurface(htmlEventHandlerProvenProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');
assert.equal(matrixSurface(htmlEventHandlerProvenProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

const htmlSubmitterBase = '<button data-frontier-key="save" type="button">Save</button>\n';
const htmlSubmitterWorker = '<button data-frontier-key="save" type="submit">Save</button>\n';
const htmlSubmitterBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_form_submitter_runtime_block',
  files: [{ sourcePath: 'src/form.html', baseSourceText: htmlSubmitterBase, workerSourceText: htmlSubmitterWorker, headSourceText: htmlSubmitterBase }]
});
assert.equal(htmlSubmitterBlockedProject.status, 'blocked');
assert.equal(htmlSubmitterBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlSubmitterBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlSubmitterBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'form-submitter-runtime-boundary'), true);
assert.match(htmlSubmitterBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'form-submitter-runtime-boundary').details.proofGap.nextProof, /htmlRuntimeBoundaryProofsByPath/);

const htmlSubmitterWrongProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_form_submitter_runtime_wrong_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/form.html': [{
      id: 'html_form_submitter_wrong_attribute',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/form.html',
      reasonCode: 'form-submitter-runtime-boundary',
      side: 'worker',
      boundary: 'html-form-submitter-runtime-attribute',
      boundaryAttributes: ['formmethod'],
      sourceTexts: { base: htmlSubmitterBase, worker: htmlSubmitterWorker, head: htmlSubmitterBase, output: htmlSubmitterWorker },
      ...runtimeEvidence('form-submitter-runtime-boundary', 'html-form-submitter-runtime-attribute', 'submitter-wrong-attribute')
    }]
  },
  files: [{ sourcePath: 'src/form.html', baseSourceText: htmlSubmitterBase, workerSourceText: htmlSubmitterWorker, headSourceText: htmlSubmitterBase }]
});
assert.equal(htmlSubmitterWrongProofProject.status, 'blocked');
assert.equal(htmlSubmitterWrongProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'form-submitter-runtime-boundary'), true);

const htmlSubmitterProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_form_submitter_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/form.html': [{
      id: 'html_form_submitter_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/form.html',
      reasonCode: 'form-submitter-runtime-boundary',
      side: 'worker',
      boundary: 'html-form-submitter-runtime-attribute',
      boundaryAttributes: ['type'],
      sourceTexts: { base: htmlSubmitterBase, worker: htmlSubmitterWorker, head: htmlSubmitterBase, output: htmlSubmitterWorker },
      ...runtimeEvidence('form-submitter-runtime-boundary', 'html-form-submitter-runtime-attribute', 'submitter')
    }]
  },
  files: [{ sourcePath: 'src/form.html', baseSourceText: htmlSubmitterBase, workerSourceText: htmlSubmitterWorker, headSourceText: htmlSubmitterBase }]
});
assert.equal(htmlSubmitterProvenProject.status, 'merged');
assert.equal(htmlSubmitterProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlSubmitterProvenProject.files[0].result.runtimeBoundaryProofs[0].boundary, 'html-form-submitter-runtime-attribute');
assert.equal(htmlSubmitterProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes[0], 'type');
assert.match(htmlSubmitterProvenProject.outputFiles[0].sourceText, /type="submit"/);

const htmlFormBase = '<form data-frontier-key="search" action="/old" method="get"><input name="q"></form>\n';
const htmlFormWorker = '<form data-frontier-key="search" action="/new" method="get"><input name="q"></form>\n';
const htmlFormBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_form_action_runtime_block',
  files: [{ sourcePath: 'src/search.html', baseSourceText: htmlFormBase, workerSourceText: htmlFormWorker, headSourceText: htmlFormBase }]
});
assert.equal(htmlFormBlockedProject.status, 'blocked');
assert.equal(htmlFormBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'form-runtime-boundary'), true);

const htmlControlBase = '<input data-frontier-key="agree" type="checkbox">\n';
const htmlControlWorker = '<input data-frontier-key="agree" type="checkbox" checked>\n';
const htmlControlBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_form_control_runtime_block',
  files: [{ sourcePath: 'src/control.html', baseSourceText: htmlControlBase, workerSourceText: htmlControlWorker, headSourceText: htmlControlBase }]
});
assert.equal(htmlControlBlockedProject.status, 'blocked');
assert.equal(htmlControlBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'form-control-runtime-boundary'), true);

const htmlControlProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_form_control_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/control.html': [{
      id: 'html_form_control_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/control.html',
      reasonCode: 'form-control-runtime-boundary',
      side: 'worker',
      boundary: 'html-form-control-runtime-attribute',
      boundaryAttributes: ['checked'],
      sourceTexts: { base: htmlControlBase, worker: htmlControlWorker, head: htmlControlBase, output: htmlControlWorker },
      ...runtimeEvidence('form-control-runtime-boundary', 'html-form-control-runtime-attribute', 'control')
    }]
  },
  files: [{ sourcePath: 'src/control.html', baseSourceText: htmlControlBase, workerSourceText: htmlControlWorker, headSourceText: htmlControlBase }]
});
assert.equal(htmlControlProvenProject.status, 'merged');
assert.equal(htmlControlProvenProject.files[0].result.runtimeBoundaryProofs[0].boundary, 'html-form-control-runtime-attribute');
assert.equal(htmlControlProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes[0], 'checked');
assert.match(htmlControlProvenProject.outputFiles[0].sourceText, /checked/);

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
      sourceTexts: { base: htmlInlineStyleBase, worker: htmlInlineStyleWorker, head: htmlInlineStyleBase, output: htmlInlineStyleWorker },
      ...runtimeEvidence('inline-style-runtime-boundary', 'html-inline-style-attribute', 'inline-style')
    }]
  },
  files: [{ sourcePath: 'src/view.html', baseSourceText: htmlInlineStyleBase, workerSourceText: htmlInlineStyleWorker, headSourceText: htmlInlineStyleBase }]
});
assert.equal(htmlInlineStyleProvenProject.status, 'merged');
assert.equal(htmlInlineStyleProvenProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlInlineStyleProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlInlineStyleProvenProject.files[0].result.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlInlineStyleProvenProject.files[0].result.htmlRuntimeProofs[0].boundary, 'html-inline-style-attribute');
