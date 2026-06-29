import { capturePlaywrightRuntimeProof } from '@shapeshift-labs/frontier-runtime-proof/playwright';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, sourceHashBinding } from './html-css-merge-test-helpers.mjs';

const base = '<button data-frontier-key="save" onclick="save()">Save</button>\n';
const worker = '<button data-frontier-key="save" onclick="saveNow()">Save</button>\n';

const generatedRuntimeProof = await capturePlaywrightRuntimeProof({
  viewportSize() {
    return { width: 800, height: 600 };
  },
  context() {
    return {
      browser() {
        return {
          version: () => 'stable',
          browserType: () => ({ name: () => 'chromium' })
        };
      }
    };
  },
  async screenshot() {
    return new Uint8Array([1, 2, 3, 4]);
  },
  async evaluate(_pageFunction, arg) {
    if (arg?.traceKind === 'frontier.runtime-proof.playwright.trace.v1') return undefined;
    assert.equal(arg.captureKind, 'frontier.runtime-proof.playwright.capture.v1');
    return {
      environment: {
        viewport: { width: 800, height: 600 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        reducedMotion: 'no-preference'
      },
      domSnapshot: [{ path: '#save', tag: 'button', attributes: [['data-frontier-key', 'save']] }],
      computedStyleSnapshot: [{ path: '#save', properties: { display: 'inline-block' } }],
      layoutSnapshot: [{ path: '#save', rect: { x: 0, y: 0, width: 80, height: 32 } }],
      eventTrace: [{ sequence: 0, type: 'click', target: '#save' }],
      accessibilitySnapshot: [{ path: '#save', tag: 'button', role: 'button' }],
      focusSnapshot: { path: '#save', tag: 'button', role: 'button' },
      layoutShift: { cumulativeLayoutShift: 0, entries: [] }
    };
  }
}, {
  command: 'playwright test generated-runtime-proof.spec.ts',
  probeId: 'html:event-handler-runtime-boundary:generated-capsule',
  signals: ['html-event-handler-runtime'],
  sourcePath: 'src/capsule.html',
  sourceHash: 'generated-capsule-source-artifact',
  selectors: ['[data-frontier-key="save"]'],
  screenshot: true,
  maxCumulativeLayoutShift: 0.01
});

assert.equal(generatedRuntimeProof.status, 'passed');
assert.equal(generatedRuntimeProof.validation.ok, true);

const project = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_runtime_generated_playwright_capsule',
  htmlRuntimeBoundaryProofsByPath: {
    'src/capsule.html': [{
      id: 'html_runtime_generated_playwright_capsule',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/capsule.html',
      reasonCode: 'event-handler-runtime-boundary',
      side: 'worker',
      boundary: 'html-event-handler-attribute',
      boundaryAttributes: ['onclick'],
      ...sourceHashBinding(base, worker, base, worker),
      runtimeProofCapsule: generatedRuntimeProof.runtimeProofCapsule
    }]
  },
  files: [{ sourcePath: 'src/capsule.html', baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

const record = project.files[0].result.runtimeBoundaryProofs[0];
assert.equal(project.status, 'merged');
assert.equal(project.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(record.runtimeCommand, 'playwright test generated-runtime-proof.spec.ts');
assert.equal(record.runtimeProofMode, 'isolated-fixture');
assert.equal(record.runtimeBrowserName, 'chromium');
assert.equal(record.runtimeViewport.width, 800);
assert.equal(record.runtimeTelemetryHash.startsWith('fnv1a32:'), true);
assert.equal(record.runtimeDomSnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(record.runtimeComputedStyleHash.startsWith('fnv1a32:'), true);
assert.equal(record.runtimeLayoutSnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(record.runtimeEventTraceHash.startsWith('fnv1a32:'), true);
assert.equal(record.runtimeAccessibilitySnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(record.runtimeFocusSnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(record.runtimeLayoutShiftHash.startsWith('fnv1a32:'), true);
assert.equal(record.runtimeScreenshotHash.startsWith('fnv1a32:'), true);
assert.equal(matrixSurface(project, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');
