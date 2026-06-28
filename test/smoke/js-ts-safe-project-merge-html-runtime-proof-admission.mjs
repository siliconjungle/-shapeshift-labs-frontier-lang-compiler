import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, sourceHashBinding } from './html-css-merge-test-helpers.mjs';

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

const htmlEventHandlerBrowserProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_event_handler_browser_runtime_proof_alias',
  htmlBrowserRuntimeProofsByPath: {
    'src/view.html': [{
      id: 'html_event_handler_browser_runtime_alias',
      kind: 'html-source-bound-browser-runtime-proof',
      status: 'passed',
      sourcePath: 'src/view.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundary: 'html-event-handler-attribute',
      boundaryAttributes: ['onclick'],
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
  files: [{
    sourcePath: 'src/view.html',
    baseSourceText: htmlEventHandlerBase,
    workerSourceText: htmlEventHandlerWorker,
    headSourceText: htmlEventHandlerBase
  }]
});

assert.equal(htmlEventHandlerBrowserProofProject.status, 'merged');
assert.equal(htmlEventHandlerBrowserProofProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(htmlEventHandlerBrowserProofProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlEventHandlerBrowserProofProject.files[0].result.runtimeBoundaryProofs[0].kind, 'html-source-bound-browser-runtime-proof');
assert.equal(htmlEventHandlerBrowserProofProject.files[0].result.runtimeBoundaryProofs[0].runtimeEvidenceBound, true);
assert.equal(htmlEventHandlerBrowserProofProject.files[0].result.runtimeBoundaryProofs[0].browserRenderEquivalenceClaim, false);
assert.equal(htmlEventHandlerBrowserProofProject.files[0].result.runtimeBoundaryProofs[0].semanticEquivalenceClaim, false);
assert.equal(matrixSurface(htmlEventHandlerBrowserProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

const htmlResourceSrcsetBase = '<img data-frontier-key="hero" src="/hero.jpg" srcset="/hero-600.jpg 600w" sizes="100vw">\n';
const htmlResourceSrcsetWorker = '<img data-frontier-key="hero" src="/hero.jpg" srcset="/hero-900.jpg 900w" sizes="100vw">\n';

const htmlResourceMissingSignalProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_resource_runtime_missing_required_signal',
  htmlRuntimeBoundaryProofsByPath: {
    'src/hero.html': [{
      id: 'html_resource_missing_signal',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/hero.html',
      reasonCode: 'resource-loading-runtime-boundary',
      side: 'worker',
      boundary: 'html-resource-loading-attribute',
      boundaryAttributes: ['srcset'],
      ...sourceHashBinding(htmlResourceSrcsetBase, htmlResourceSrcsetWorker, htmlResourceSrcsetBase, htmlResourceSrcsetWorker),
      runtimeCommand: 'node test/html-runtime/resource-missing-signal.mjs',
      runtimeProbeId: 'html:resource-loading-runtime-boundary:html-resource-loading-attribute',
      runtimeEvidenceHash: 'html-runtime-evidence:resource-loading-runtime-boundary:html-resource-loading-attribute:missing-signal',
      runtimeSignals: ['html-browser-runtime']
    }]
  },
  files: [{
    sourcePath: 'src/hero.html',
    baseSourceText: htmlResourceSrcsetBase,
    workerSourceText: htmlResourceSrcsetWorker,
    headSourceText: htmlResourceSrcsetBase
  }]
});

assert.equal(htmlResourceMissingSignalProofProject.status, 'blocked');
assert.equal(htmlResourceMissingSignalProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlResourceMissingSignalProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
const htmlResourceMissingSignalConflict = htmlResourceMissingSignalProofProject.conflicts.find((conflict) => conflict.details.reasonCode === 'resource-loading-runtime-boundary');
assert.ok(htmlResourceMissingSignalConflict);
assert.equal(htmlResourceMissingSignalConflict.details.boundary, 'html-resource-loading-attribute');
assert.deepEqual(htmlResourceMissingSignalConflict.details.boundaryAttributes, ['srcset']);
assert.equal(matrixSurface(htmlResourceMissingSignalProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const htmlFrameworkDirectiveBase = '<div data-frontier-key="panel" :class="oldClass">Panel</div>\n';
const htmlFrameworkDirectiveWorker = '<div data-frontier-key="panel" :class="nextClass">Panel</div>\n';

const htmlFrameworkDirectiveClaimingProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_framework_directive_runtime_claiming_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/directive.html': [{
      id: 'html_framework_directive_claiming',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/directive.html',
      reasonCode: 'framework-directive-boundary',
      side: 'worker',
      boundary: 'html-framework-directive',
      boundaryAttributes: [':class'],
      sourceTexts: {
        base: htmlFrameworkDirectiveBase,
        worker: htmlFrameworkDirectiveWorker,
        head: htmlFrameworkDirectiveBase,
        output: htmlFrameworkDirectiveWorker
      },
      runtimeCommand: 'node test/html-runtime/framework-directive-claiming.mjs',
      runtimeProbeId: 'html:framework-directive-boundary:html-framework-directive',
      runtimeEvidenceHash: 'html-runtime-evidence:framework-directive-boundary:html-framework-directive:framework-directive-claiming',
      runtimeSignals: ['html-framework-directive-runtime'],
      browserRuntimeEquivalenceClaim: true
    }]
  },
  files: [{
    sourcePath: 'src/directive.html',
    baseSourceText: htmlFrameworkDirectiveBase,
    workerSourceText: htmlFrameworkDirectiveWorker,
    headSourceText: htmlFrameworkDirectiveBase
  }]
});

assert.equal(htmlFrameworkDirectiveClaimingProofProject.status, 'blocked');
assert.equal(htmlFrameworkDirectiveClaimingProofProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlFrameworkDirectiveClaimingProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlFrameworkDirectiveClaimingProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlFrameworkDirectiveClaimingProofProject.files[0].result.admission.browserRuntimeEquivalenceClaim, false);
assert.equal(htmlFrameworkDirectiveClaimingProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'framework-directive-boundary'), true);
const htmlFrameworkDirectiveClaimingConflict = htmlFrameworkDirectiveClaimingProofProject.conflicts.find((conflict) => conflict.details.reasonCode === 'framework-directive-boundary');
assert.equal(htmlFrameworkDirectiveClaimingConflict.details.boundary, 'html-framework-directive');
assert.deepEqual(htmlFrameworkDirectiveClaimingConflict.details.boundaryAttributes, [':class']);
assert.equal(matrixSurface(htmlFrameworkDirectiveClaimingProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const htmlFrameworkDirectiveProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_framework_directive_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/directive.html': [{
      id: 'html_framework_directive_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/directive.html',
      reasonCode: 'framework-directive-boundary',
      side: 'worker',
      boundary: 'html-framework-directive',
      boundaryAttributes: [':class'],
      sourceTexts: {
        base: htmlFrameworkDirectiveBase,
        worker: htmlFrameworkDirectiveWorker,
        head: htmlFrameworkDirectiveBase,
        output: htmlFrameworkDirectiveWorker
      },
      runtimeCommand: 'node test/html-runtime/framework-directive.mjs',
      runtimeProbeId: 'html:framework-directive-boundary:html-framework-directive',
      runtimeEvidenceHash: 'html-runtime-evidence:framework-directive-boundary:html-framework-directive:framework-directive',
      runtimeSignals: ['html-framework-directive-runtime']
    }]
  },
  files: [{
    sourcePath: 'src/directive.html',
    baseSourceText: htmlFrameworkDirectiveBase,
    workerSourceText: htmlFrameworkDirectiveWorker,
    headSourceText: htmlFrameworkDirectiveBase
  }]
});

assert.equal(htmlFrameworkDirectiveProvenProject.status, 'merged');
assert.equal(htmlFrameworkDirectiveProvenProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(htmlFrameworkDirectiveProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlFrameworkDirectiveProvenProject.files[0].admission.browserRuntimeEquivalenceClaim, true);
assert.equal(htmlFrameworkDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].boundary, 'html-framework-directive');
assert.deepEqual(htmlFrameworkDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes, [':class']);
assert.equal(htmlFrameworkDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeEvidenceBound, true);
assert.equal(htmlFrameworkDirectiveProvenProject.files[0].result.runtimeBoundaryProofs[0].runtimeSignals.includes('html-framework-directive-runtime'), true);
assert.match(htmlFrameworkDirectiveProvenProject.outputFiles[0].sourceText, /nextClass/);
