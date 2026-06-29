import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, runtimeProofCapsule, sourceHashBinding } from './html-css-merge-test-helpers.mjs';

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
      runtimeSignals: ['html-browser-runtime'],
      runtimeProofCapsule: runtimeProofCapsule({
        command: 'node test/html-runtime/resource-missing-signal.mjs',
        probeId: 'html:resource-loading-runtime-boundary:html-resource-loading-attribute',
        evidenceHash: 'html-runtime-evidence:resource-loading-runtime-boundary:html-resource-loading-attribute:missing-signal',
        signals: ['html-browser-runtime'],
        label: 'resource-missing-signal'
      })
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
assert.equal(htmlFrameworkDirectiveClaimingProofProject.conflicts.some((conflict) => conflict.code === 'html-runtime-proof-broad-claim'), true);
const htmlFrameworkDirectiveClaimingConflict = htmlFrameworkDirectiveClaimingProofProject.conflicts.find((conflict) => conflict.code === 'html-runtime-proof-broad-claim');
assert.equal(htmlFrameworkDirectiveClaimingConflict.details.proofGapCode, 'framework-directive-boundary');
assert.equal(htmlFrameworkDirectiveClaimingConflict.details.boundary, 'html-framework-directive');
assert.deepEqual(htmlFrameworkDirectiveClaimingConflict.details.boundaryAttributes, [':class']);
assert.equal(matrixSurface(htmlFrameworkDirectiveClaimingProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'failed');

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
      runtimeSignals: ['html-framework-directive-runtime'],
      runtimeProofCapsule: runtimeProofCapsule({
        command: 'node test/html-runtime/framework-directive.mjs',
        probeId: 'html:framework-directive-boundary:html-framework-directive',
        evidenceHash: 'html-runtime-evidence:framework-directive-boundary:html-framework-directive:framework-directive',
        signals: ['html-framework-directive-runtime'],
        label: 'framework-directive'
      })
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

const htmlCapsuleBase = '<button data-frontier-key="save" onclick="save()">Save</button>\n';
const htmlCapsuleWorker = '<button data-frontier-key="save" onclick="saveNow()">Save</button>\n';
const htmlCapsuleProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_runtime_capsule_micro_slice',
  htmlRuntimeBoundaryProofsByPath: {
    'src/capsule.html': [{
      id: 'html_runtime_capsule_micro_slice',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/capsule.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundary: 'html-event-handler-attribute',
      boundaryAttributes: ['onclick'],
      ...sourceHashBinding(htmlCapsuleBase, htmlCapsuleWorker, htmlCapsuleBase, htmlCapsuleWorker),
      runtimeProofCapsule: {
        mode: 'isolated-fixture',
        status: 'passed',
        command: 'playwright test runtime-proof-capsule.spec.ts',
        probeId: 'html:event-handler-runtime-boundary:capsule',
        evidenceHash: 'runtime-proof-capsule-evidence-hash',
        signals: ['html-event-handler-runtime'],
        browser: { name: 'chromium', version: 'stable' },
        viewport: { width: 390, height: 844, deviceScaleFactor: 2 },
        artifacts: { sourceHash: 'capsule-source-artifact', bundleHash: 'capsule-js-bundle' },
        telemetry: {
          hash: 'capsule-telemetry',
          domSnapshotHash: 'capsule-dom',
          computedStyleHash: 'capsule-style',
          layoutSnapshotHash: 'capsule-layout',
          eventTraceHash: 'capsule-events',
          accessibilitySnapshotHash: 'capsule-accessibility',
          focusSnapshotHash: 'capsule-focus',
          layoutShiftHash: 'capsule-layout-shift',
          screenshotHash: 'capsule-screenshot',
          cumulativeLayoutShift: 0
        }
      }
    }]
  },
  files: [{ sourcePath: 'src/capsule.html', baseSourceText: htmlCapsuleBase, workerSourceText: htmlCapsuleWorker, headSourceText: htmlCapsuleBase }]
});

const htmlCapsuleRecord = htmlCapsuleProofProject.files[0].result.runtimeBoundaryProofs[0];
assert.equal(htmlCapsuleProofProject.status, 'merged');
assert.equal(htmlCapsuleProofProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(htmlCapsuleRecord.runtimeCommand, 'playwright test runtime-proof-capsule.spec.ts');
assert.equal(htmlCapsuleRecord.runtimeProofMode, 'isolated-fixture');
assert.equal(htmlCapsuleRecord.runtimeBrowserName, 'chromium');
assert.equal(htmlCapsuleRecord.runtimeViewport.width, 390);
assert.equal(htmlCapsuleRecord.runtimeTelemetryHash, 'capsule-telemetry');
assert.equal(htmlCapsuleRecord.runtimeDomSnapshotHash, 'capsule-dom');
assert.equal(htmlCapsuleRecord.runtimeComputedStyleHash, 'capsule-style');
assert.equal(htmlCapsuleRecord.runtimeLayoutSnapshotHash, 'capsule-layout');
assert.equal(htmlCapsuleRecord.runtimeEventTraceHash, 'capsule-events');
assert.equal(htmlCapsuleRecord.runtimeAccessibilitySnapshotHash, 'capsule-accessibility');
assert.equal(htmlCapsuleRecord.runtimeFocusSnapshotHash, 'capsule-focus');
assert.equal(htmlCapsuleRecord.runtimeLayoutShiftHash, 'capsule-layout-shift');
assert.equal(htmlCapsuleRecord.runtimeCumulativeLayoutShift, 0);
assert.equal(typeof htmlCapsuleRecord.runtimeProofCapsuleHash, 'string');
assert.equal(matrixSurface(htmlCapsuleProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

const htmlEnvironmentBlockedProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_runtime_capsule_environment_blocked',
  htmlRuntimeBoundaryProofsByPath: {
    'src/capsule.html': [{
      id: 'html_runtime_capsule_environment_blocked',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/capsule.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundary: 'html-event-handler-attribute',
      boundaryAttributes: ['onclick'],
      ...sourceHashBinding(htmlCapsuleBase, htmlCapsuleWorker, htmlCapsuleBase, htmlCapsuleWorker),
      runtimeProofCapsule: {
        mode: 'environment-blocked',
        status: 'blocked',
        command: 'playwright test runtime-proof-capsule.spec.ts',
        probeId: 'html:event-handler-runtime-boundary:capsule',
        evidenceHash: 'runtime-proof-capsule-environment-blocked',
        signals: ['html-event-handler-runtime']
      }
    }]
  },
  files: [{ sourcePath: 'src/capsule.html', baseSourceText: htmlCapsuleBase, workerSourceText: htmlCapsuleWorker, headSourceText: htmlCapsuleBase }]
});

assert.equal(htmlEnvironmentBlockedProofProject.status, 'blocked');
assert.equal(htmlEnvironmentBlockedProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(htmlEnvironmentBlockedProofProject.files[0].admission.browserRuntimeEquivalenceClaim, false);
assert.equal(matrixSurface(htmlEnvironmentBlockedProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');
