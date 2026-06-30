import { createSourceBoundRuntimeProof, hashRuntimeProofValue } from '@shapeshift-labs/frontier-runtime-proof';
import { capturePlaywrightRuntimeProof } from '@shapeshift-labs/frontier-runtime-proof/playwright';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';

const canvasSignals = [
  'canvas-deterministic-input',
  'canvas-viewport-dpr',
  'canvas-draw-command-trace',
  'canvas-bitmap-proof',
  'canvas-hit-test-pointer',
  'canvas-frame-budget',
  'canvas-accessibility-fallback'
];
const offscreenSignals = [...canvasSignals, 'canvas-offscreen-worker-proof'];

const canvasBase = [
  'export function draw(canvas) {',
  "  const ctx = canvas.getContext('2d');",
  '  return ctx;',
  '}',
  ''
].join('\n');
const canvasWorker = canvasBase.replace('  return ctx;', '  ctx.fillStyle = "red";\n  ctx.fillRect(0, 0, 20, 20);\n  return ctx;');

const canvasRuntimeRun = await capturePlaywrightRuntimeProof(fakeCanvasPage({
  selector: 'canvas[data-frontier-key="plot"]',
  drawTrace: [
    { op: 'getContext', context: '2d' },
    { op: 'setFillStyle', valueHash: 'sha256:style:red' },
    { op: 'fillRect', args: [0, 0, 20, 20] }
  ],
  bitmap: { width: 64, height: 64, pixelsHash: 'sha256:canvas:bitmap:red-square' },
  hitTests: [{ x: 10, y: 10, target: 'painted-region', hit: true }],
  pointerTrace: [{ sequence: 0, type: 'pointerdown', x: 10, y: 10 }],
  frameBudget: { frames: 1, maxFrameMs: 4.2, budgetMs: 16.7 },
  fallbackSnapshot: { textHash: 'sha256:fallback:plot' },
  screenshotBytes: [4, 3, 2, 1]
}), {
  command: 'playwright test canvas-runtime-proof-corpus.spec.ts --project=chromium',
  probeId: 'canvas:draw-command-runtime-boundary:runtime-proof-corpus',
  signals: canvasSignals,
  sourcePath: 'src/draw.js',
  sourceHash: hashSemanticValue(canvasWorker),
  selectors: ['canvas[data-frontier-key="plot"]'],
  screenshot: true,
  maxCumulativeLayoutShift: 0.01
});

assert.equal(canvasRuntimeRun.status, 'passed');
assert.equal(canvasRuntimeRun.validation.ok, true);

const canvasProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_canvas_browser_probe_corpus',
  canvasRuntimeProofsByPath: {
    'src/draw.js': [canvasSourceBoundProof({
      id: 'canvas_browser_probe_corpus',
      sourcePath: 'src/draw.js',
      base: canvasBase,
      worker: canvasWorker,
      head: canvasBase,
      output: canvasWorker,
      runtimeRun: canvasRuntimeRun,
      signals: canvasSignals
    })]
  },
  files: [{ sourcePath: 'src/draw.js', baseSourceText: canvasBase, workerSourceText: canvasWorker, headSourceText: canvasBase }]
});

const canvasRecord = canvasProject.files[0].result.canvasRuntimeProofs[0];
assert.equal(canvasProject.status, 'merged');
assert.equal(canvasProject.summary.canvasRuntimeProofs, 1);
assert.equal(canvasRecord.runtimeEvidenceBound, true);
assert.equal(canvasRecord.runtimeTelemetryHash.startsWith('fnv1a32:'), true);
assert.equal(canvasRecord.runtimeProofCapsuleHash.startsWith('fnv1a32:'), true);
assert.equal(canvasRecord.drawCommandTraceHash.startsWith('fnv1a32:'), true);
assert.equal(canvasRecord.canvasBitmapHash.startsWith('fnv1a32:'), true);
assert.equal(canvasRecord.hitTestTraceHash.startsWith('fnv1a32:'), true);
assert.equal(canvasRecord.pointerTraceHash.startsWith('fnv1a32:'), true);
assert.equal(canvasRecord.frameBudgetHash.startsWith('fnv1a32:'), true);
assert.equal(canvasRecord.accessibilitySnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(canvasRecord.canvasRuntimeEquivalenceClaim, false);
assert.equal(matrixSurface(canvasProject, 'canvas-runtime-proof').proofStatuses['canvas-runtime-proof'], 'passed');

const staleCanvasProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_canvas_browser_probe_stale_source',
  canvasRuntimeProofsByPath: {
    'src/draw.js': [{
      ...canvasSourceBoundProof({
        id: 'canvas_browser_probe_corpus_stale_source',
        sourcePath: 'src/draw.js',
        base: canvasBase,
        worker: canvasWorker,
        head: canvasBase,
        output: canvasWorker,
        runtimeRun: canvasRuntimeRun,
        signals: canvasSignals
      }),
      outputSourceHash: hashSemanticValue(canvasBase)
    }]
  },
  files: [{ sourcePath: 'src/draw.js', baseSourceText: canvasBase, workerSourceText: canvasWorker, headSourceText: canvasBase }]
});
assert.equal(staleCanvasProject.status, 'blocked');
assert.equal(staleCanvasProject.summary.canvasRuntimeProofs, 0);
assert.equal(staleCanvasProject.conflicts.some((conflict) => conflict.code === 'canvas-drawing-runtime-proof-missing'), true);
assert.equal(matrixSurface(staleCanvasProject, 'canvas-runtime-proof').proofStatuses['canvas-runtime-proof'], 'failed');

const offscreenWorker = canvasBase.replace('  return ctx;', '  const offscreen = canvas.transferControlToOffscreen();\n  worker.postMessage({ canvas: offscreen }, [offscreen]);\n  return offscreen;');
const offscreenRuntimeRun = await capturePlaywrightRuntimeProof(fakeCanvasPage({
  selector: 'canvas[data-frontier-key="plot"]',
  drawTrace: [
    { op: 'transferControlToOffscreen', target: 'canvas[data-frontier-key="plot"]' },
    { op: 'worker.draw', args: ['fillRect', 0, 0, 20, 20] }
  ],
  bitmap: { width: 64, height: 64, pixelsHash: 'sha256:canvas:bitmap:worker-square' },
  hitTests: [{ x: 10, y: 10, target: 'worker-painted-region', hit: true }],
  pointerTrace: [{ sequence: 0, type: 'pointerup', x: 10, y: 10 }],
  frameBudget: { frames: 2, maxFrameMs: 6.1, budgetMs: 16.7 },
  fallbackSnapshot: { textHash: 'sha256:fallback:offscreen' },
  workerTrace: [{ op: 'transferControlToOffscreen' }, { op: 'postMessage', transferCount: 1 }],
  workerMessages: [{ sequence: 0, type: 'draw-complete', bitmapHash: 'sha256:canvas:bitmap:worker-square' }]
}), {
  command: 'playwright test canvas-offscreen-worker-proof-corpus.spec.ts --project=chromium',
  probeId: 'canvas:offscreen-worker-runtime-boundary:runtime-proof-corpus',
  signals: offscreenSignals,
  sourcePath: 'src/offscreen.js',
  sourceHash: hashSemanticValue(offscreenWorker),
  selectors: ['canvas[data-frontier-key="plot"]'],
  screenshot: true,
  maxCumulativeLayoutShift: 0.01
});

assert.equal(offscreenRuntimeRun.status, 'passed');
assert.equal(offscreenRuntimeRun.validation.ok, true);

const offscreenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_canvas_offscreen_browser_probe_corpus',
  canvasOffscreenWorkerProofsByPath: {
    'src/offscreen.js': [canvasSourceBoundProof({
      id: 'canvas_offscreen_worker_browser_probe_corpus',
      sourcePath: 'src/offscreen.js',
      base: canvasBase,
      worker: offscreenWorker,
      head: canvasBase,
      output: offscreenWorker,
      runtimeRun: offscreenRuntimeRun,
      signals: offscreenSignals,
      offscreen: true
    })]
  },
  files: [{ sourcePath: 'src/offscreen.js', baseSourceText: canvasBase, workerSourceText: offscreenWorker, headSourceText: canvasBase }]
});

const offscreenRecord = offscreenProject.files[0].result.canvasRuntimeProofs[0];
assert.equal(offscreenProject.status, 'merged');
assert.equal(offscreenProject.summary.canvasOffscreenWorkerProofs, 1);
assert.equal(offscreenRecord.workerTraceHash.startsWith('fnv1a32:'), true);
assert.equal(offscreenRecord.workerMessageTraceHash.startsWith('fnv1a32:'), true);
assert.equal(offscreenRecord.runtimeSignals.includes('canvas-offscreen-worker-proof'), true);
assert.equal(matrixSurface(offscreenProject, 'canvas-offscreen-worker-proof').proofStatuses['canvas-offscreen-worker-proof'], 'passed');

function canvasSourceBoundProof({ id, sourcePath, base, worker, head, output, runtimeRun, signals, offscreen = false }) {
  const telemetry = runtimeRun.telemetry;
  const capsule = runtimeRun.runtimeProofCapsule;
  const proof = createSourceBoundRuntimeProof({
    id,
    sourcePath,
    reasonCode: offscreen ? 'canvas-offscreen-worker-proof-missing' : 'canvas-drawing-runtime-proof-missing',
    baseSourceHash: hashSemanticValue(base),
    workerSourceHash: hashSemanticValue(worker),
    headSourceHash: hashSemanticValue(head),
    outputSourceHash: hashSemanticValue(output),
    runtimeProofCapsule: capsule,
    requiredSignals: signals
  });
  return {
    ...proof,
    deterministicInputHash: hashRuntimeProofValue(telemetry.canvasInputSequence),
    viewportDprHash: hashRuntimeProofValue({
      viewport: telemetry.environment.viewport,
      deviceScaleFactor: telemetry.environment.deviceScaleFactor
    }),
    drawCommandTraceHash: hashRuntimeProofValue(telemetry.canvasDrawCommandTrace),
    canvasBitmapHash: hashRuntimeProofValue(telemetry.canvasBitmap),
    hitTestTraceHash: hashRuntimeProofValue(telemetry.canvasHitTestTrace),
    pointerTraceHash: hashRuntimeProofValue(telemetry.canvasPointerTrace),
    frameTimingHash: hashRuntimeProofValue(telemetry.canvasFrameBudget),
    frameBudgetHash: hashRuntimeProofValue(telemetry.canvasFrameBudget),
    accessibilitySnapshotHash: capsule.accessibilitySnapshotHash,
    fallbackSnapshotHash: hashRuntimeProofValue(telemetry.canvasFallbackSnapshot),
    offscreenWorkerProofHash: offscreen ? hashRuntimeProofValue(telemetry.canvasOffscreenWorkerTrace) : undefined,
    workerTraceHash: offscreen ? hashRuntimeProofValue(telemetry.canvasOffscreenWorkerTrace) : undefined,
    workerMessageTraceHash: offscreen ? hashRuntimeProofValue(telemetry.canvasOffscreenWorkerMessages) : undefined
  };
}

function fakeCanvasPage({ selector, drawTrace, bitmap, hitTests, pointerTrace, frameBudget, fallbackSnapshot, workerTrace = [], workerMessages = [], screenshotBytes = [9, 8, 7] }) {
  return {
    viewportSize() {
      return { width: 640, height: 480 };
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
      return new Uint8Array(screenshotBytes);
    },
    async evaluate(_pageFunction, arg) {
      if (arg?.traceKind === 'frontier.runtime-proof.playwright.trace.v1') return undefined;
      assert.equal(arg.captureKind, 'frontier.runtime-proof.playwright.capture.v1');
      return {
        environment: {
          viewport: { width: 640, height: 480 },
          deviceScaleFactor: 2,
          colorScheme: 'light',
          reducedMotion: 'no-preference'
        },
        domSnapshot: [{ path: selector, tag: 'canvas', attributes: [['data-frontier-key', 'plot'], ['width', '64'], ['height', '64']] }],
        computedStyleSnapshot: [{ path: selector, properties: { display: 'block', width: '64px', height: '64px', pointerEvents: 'auto' } }],
        layoutSnapshot: [{ path: selector, rect: { x: 16, y: 24, width: 64, height: 64 } }],
        eventTrace: pointerTrace,
        accessibilitySnapshot: [{ path: selector, tag: 'canvas', role: 'img', labelHash: 'sha256:canvas:label' }],
        focusSnapshot: { path: selector, tag: 'canvas', role: 'img' },
        layoutShift: { cumulativeLayoutShift: 0, entries: [] },
        canvasInputSequence: [{ sequence: 0, type: 'deterministic-seed', seedHash: 'sha256:canvas:seed' }],
        canvasDrawCommandTrace: drawTrace,
        canvasBitmap: bitmap,
        canvasHitTestTrace: hitTests,
        canvasPointerTrace: pointerTrace,
        canvasFrameBudget: frameBudget,
        canvasFallbackSnapshot: fallbackSnapshot,
        canvasOffscreenWorkerTrace: workerTrace,
        canvasOffscreenWorkerMessages: workerMessages
      };
    }
  };
}
