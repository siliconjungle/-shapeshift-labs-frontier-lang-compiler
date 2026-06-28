import { createSourceBoundRuntimeProof } from '@shapeshift-labs/frontier-runtime-proof';
import { capturePlaywrightRuntimeProof } from '@shapeshift-labs/frontier-runtime-proof/playwright';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, sourceHashBinding } from './html-css-merge-test-helpers.mjs';

const htmlSourcePath = 'src/runtime-proof-corpus.html';
const htmlBase = '<button data-frontier-key="save" onclick="save()">Save</button>\n';
const htmlWorker = '<button data-frontier-key="save" onclick="saveNow()">Save</button>\n';

const htmlRuntimeRun = await capturePlaywrightRuntimeProof(fakeRuntimePage({
  selector: '[data-frontier-key="save"]',
  tag: 'button',
  text: 'Save',
  style: { display: 'inline-block', color: 'rgb(10, 20, 30)' },
  rect: { x: 8, y: 12, width: 88, height: 36 },
  events: [{ sequence: 0, type: 'click', target: '[data-frontier-key="save"]' }],
  screenshotBytes: [1, 2, 3, 4, 5]
}), {
  command: 'playwright test html-css-runtime-proof-corpus.spec.ts --project=chromium',
  probeId: 'html:event-handler-runtime-boundary:runtime-proof-corpus',
  signals: ['html-event-handler-runtime'],
  sourcePath: htmlSourcePath,
  sourceHash: hashSemanticValue(htmlWorker),
  selectors: ['[data-frontier-key="save"]'],
  screenshot: true,
  maxCumulativeLayoutShift: 0.01
});

assert.equal(htmlRuntimeRun.status, 'passed');
assert.equal(htmlRuntimeRun.validation.ok, true);

const canonicalHtmlProof = {
  ...createSourceBoundRuntimeProof({
    id: 'html_runtime_proof_corpus_source_bound',
    sourcePath: htmlSourcePath,
    reasonCode: 'event-handler-runtime-boundary',
    boundaryKey: 'html-event-handler-attribute',
    requiredSignals: ['html-event-handler-runtime'],
    ...sourceHashBinding(htmlBase, htmlWorker, htmlBase, htmlWorker),
    runtimeProofCapsule: htmlRuntimeRun.runtimeProofCapsule
  }),
  side: 'worker',
  boundaryAttributes: ['onclick']
};

const canonicalProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css_runtime_proof_corpus_canonical',
  sourceBoundRuntimeProofsByPath: {
    [htmlSourcePath]: [canonicalHtmlProof]
  },
  files: [{
    sourcePath: htmlSourcePath,
    baseSourceText: htmlBase,
    workerSourceText: htmlWorker,
    headSourceText: htmlBase
  }]
});

const canonicalRecord = canonicalProject.files[0].result.runtimeBoundaryProofs[0];
assert.equal(canonicalProject.status, 'merged');
assert.equal(canonicalProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(canonicalRecord.kind, 'frontier.runtime-proof.source-bound-proof');
assert.equal(canonicalRecord.runtimeEvidenceBound, true);
assert.equal(canonicalRecord.runtimeTelemetryHash.startsWith('fnv1a32:'), true);
assert.equal(canonicalRecord.runtimeDomSnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(canonicalRecord.runtimeComputedStyleHash.startsWith('fnv1a32:'), true);
assert.equal(canonicalRecord.runtimeLayoutSnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(canonicalRecord.runtimeEventTraceHash.startsWith('fnv1a32:'), true);
assert.equal(canonicalRecord.runtimeLayoutShiftHash.startsWith('fnv1a32:'), true);
assert.equal(canonicalRecord.runtimeScreenshotHash.startsWith('fnv1a32:'), true);
assert.equal(canonicalRecord.runtimeCumulativeLayoutShift, 0);
assert.equal(canonicalRecord.browserRuntimeEquivalenceClaim, true);
assert.equal(canonicalRecord.browserRenderEquivalenceClaim, false);
assert.equal(canonicalRecord.semanticEquivalenceClaim, false);
assert.equal(matrixSurface(canonicalProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

const staleProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css_runtime_proof_corpus_stale_source',
  sourceBoundRuntimeProofsByPath: {
    [htmlSourcePath]: [{
      ...canonicalHtmlProof,
      id: 'html_runtime_proof_corpus_stale_source',
      outputSourceHash: hashSemanticValue('<button data-frontier-key="save" onclick="stale()">Save</button>\n')
    }]
  },
  files: [{
    sourcePath: htmlSourcePath,
    baseSourceText: htmlBase,
    workerSourceText: htmlWorker,
    headSourceText: htmlBase
  }]
});

assert.equal(staleProofProject.status, 'blocked');
assert.equal(staleProofProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(staleProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'event-handler-runtime-boundary'), true);
assert.equal(matrixSurface(staleProofProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const blockedRuntimeRun = await capturePlaywrightRuntimeProof(fakeBlockedPage(), {
  command: 'playwright test html-css-runtime-proof-corpus-blocked.spec.ts --project=chromium',
  probeId: 'html:event-handler-runtime-boundary:blocked-runtime-proof-corpus',
  signals: ['html-event-handler-runtime'],
  sourcePath: htmlSourcePath
});

assert.equal(blockedRuntimeRun.status, 'blocked');
assert.equal(blockedRuntimeRun.validation.ok, false);

const environmentBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css_runtime_proof_corpus_environment_blocked',
  sourceBoundRuntimeProofsByPath: {
    [htmlSourcePath]: [{
      ...canonicalHtmlProof,
      id: 'html_runtime_proof_corpus_environment_blocked',
      status: 'blocked',
      runtimeProofCapsule: blockedRuntimeRun.runtimeProofCapsule
    }]
  },
  files: [{
    sourcePath: htmlSourcePath,
    baseSourceText: htmlBase,
    workerSourceText: htmlWorker,
    headSourceText: htmlBase
  }]
});

assert.equal(environmentBlockedProject.status, 'blocked');
assert.equal(environmentBlockedProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(matrixSurface(environmentBlockedProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const shiftingRuntimeRun = await capturePlaywrightRuntimeProof(fakeRuntimePage({
  selector: '[data-frontier-key="save"]',
  tag: 'button',
  text: 'Save',
  style: { display: 'inline-block' },
  rect: { x: 8, y: 12, width: 88, height: 36 },
  cumulativeLayoutShift: 0.12
}), {
  command: 'playwright test html-css-runtime-proof-corpus-layout-shift.spec.ts --project=chromium',
  probeId: 'html:event-handler-runtime-boundary:layout-shift-runtime-proof-corpus',
  signals: ['html-event-handler-runtime'],
  sourcePath: htmlSourcePath,
  selectors: ['[data-frontier-key="save"]'],
  maxCumulativeLayoutShift: 0.01
});

assert.equal(shiftingRuntimeRun.status, 'passed');
assert.equal(shiftingRuntimeRun.validation.ok, false);
assert.equal(shiftingRuntimeRun.validation.reasonCodes.includes('runtime-proof-cumulative-layout-shift-exceeded'), true);

const layoutShiftProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css_runtime_proof_corpus_layout_shift_rejected',
  sourceBoundRuntimeProofsByPath: {
    [htmlSourcePath]: [{
      ...canonicalHtmlProof,
      id: 'html_runtime_proof_corpus_layout_shift_rejected',
      runtimeProofCapsule: shiftingRuntimeRun.runtimeProofCapsule
    }]
  },
  files: [{
    sourcePath: htmlSourcePath,
    baseSourceText: htmlBase,
    workerSourceText: htmlWorker,
    headSourceText: htmlBase
  }]
});

assert.equal(layoutShiftProject.status, 'blocked');
assert.equal(layoutShiftProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(matrixSurface(layoutShiftProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const cssSourcePath = 'src/runtime-proof-corpus.css';
const cssBase = '.card { color: red; }\n';
const cssWorker = '@media (min-width: 700px) { .card { color: red; } }\n';
const cssOutput = '@media (min-width: 700px) {\n  .card {\n    color: red;\n  }\n}\n';

const cssRuntimeRun = await capturePlaywrightRuntimeProof(fakeRuntimePage({
  selector: '.card',
  tag: 'div',
  text: 'Card',
  style: { color: 'rgb(255, 0, 0)', display: 'block' },
  rect: { x: 0, y: 0, width: 320, height: 48 },
  events: []
}), {
  command: 'playwright test html-css-runtime-proof-corpus-css.spec.ts --project=chromium',
  probeId: 'css:media-cascade-runtime-boundary:runtime-proof-corpus',
  signals: ['css-cascade-runtime'],
  sourcePath: cssSourcePath,
  sourceHash: hashSemanticValue(cssWorker),
  cssHash: hashSemanticValue(cssOutput),
  selectors: ['.card'],
  screenshot: true,
  maxCumulativeLayoutShift: 0.01
});

assert.equal(cssRuntimeRun.status, 'passed');
assert.equal(cssRuntimeRun.validation.ok, true);

const cssProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css_runtime_proof_corpus_css_cascade',
  cssMergeOptionsByPath: {
    [cssSourcePath]: {
      scopedCascadeGraphHash: 'hash_runtime_proof_corpus_scoped_cascade',
      cssCascadeRuntimeProofs: [{
        id: 'css_runtime_proof_corpus_source_bound',
        kind: 'css-source-bound-cascade-runtime-proof',
        status: 'passed',
        sourcePath: cssSourcePath,
        reasonCode: 'css-atrule-new-scope-unsupported',
        side: 'worker',
        shapeKey: 'at-rule:media::(min-width: 700px)',
        baseSourceHash: hashSemanticValue(cssBase),
        workerSourceHash: hashSemanticValue(cssWorker),
        headSourceHash: hashSemanticValue(cssBase),
        outputSourceHash: hashSemanticValue(cssOutput),
        runtimeProofCapsule: cssRuntimeRun.runtimeProofCapsule
      }]
    }
  },
  files: [{
    sourcePath: cssSourcePath,
    baseSourceText: cssBase,
    workerSourceText: cssWorker,
    headSourceText: cssBase
  }]
});

const cssProofRecord = cssProject.files[0].result.cascadeRuntimeProofs[0];
assert.equal(cssProject.status, 'merged');
assert.equal(cssProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(cssProofRecord.runtimeEvidenceBound, true);
assert.equal(cssProofRecord.runtimeCommand, 'playwright test html-css-runtime-proof-corpus-css.spec.ts --project=chromium');
assert.equal(cssProofRecord.runtimeTelemetryHash.startsWith('fnv1a32:'), true);
assert.equal(cssProofRecord.runtimeDomSnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(cssProofRecord.runtimeComputedStyleHash.startsWith('fnv1a32:'), true);
assert.equal(cssProofRecord.runtimeLayoutSnapshotHash.startsWith('fnv1a32:'), true);
assert.equal(cssProofRecord.runtimeEventTraceHash.startsWith('fnv1a32:'), true);
assert.equal(matrixSurface(cssProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

function fakeRuntimePage({
  selector,
  tag,
  text,
  style,
  rect,
  events = [],
  cumulativeLayoutShift = 0,
  screenshotBytes = [9, 8, 7]
}) {
  return {
    viewportSize() {
      return { width: 1280, height: 720 };
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
          viewport: { width: 1280, height: 720 },
          deviceScaleFactor: 1,
          colorScheme: 'light',
          reducedMotion: 'no-preference'
        },
        domSnapshot: [{ path: selector, tag, text, attributes: [['data-frontier-key', 'save']] }],
        computedStyleSnapshot: [{ path: selector, properties: style }],
        layoutSnapshot: [{ path: selector, rect }],
        eventTrace: events,
        layoutShift: {
          cumulativeLayoutShift,
          entries: cumulativeLayoutShift ? [{ value: cumulativeLayoutShift, hadRecentInput: false }] : []
        }
      };
    }
  };
}

function fakeBlockedPage() {
  return {
    async evaluate() {
      throw new Error('fixture server login state unavailable');
    }
  };
}
