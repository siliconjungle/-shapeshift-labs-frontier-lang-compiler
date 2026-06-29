import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';
import { htmlCssProjectSummary } from '../../src/js-ts-safe-project-merge-html-css-summary.js';

const sourcePath = 'src/runtime-proof-capsule-guard.css';
const base = '.card { color: red; }\n';
const worker = '@media (min-width: 700px) { .card { color: red; } }\n';
const output = '@media (min-width: 700px) {\n  .card {\n    color: red;\n  }\n}\n';

const project = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css_runtime_proof_capsule_guard',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      scopedCascadeGraphHash: 'hash_runtime_proof_capsule_guard_scoped_cascade',
      cssCascadeRuntimeProofs: [{
        id: 'css_runtime_proof_capsule_guard_no_capsule',
        kind: 'css-source-bound-cascade-runtime-proof',
        status: 'passed',
        sourcePath,
        reasonCode: 'css-atrule-new-scope-unsupported',
        side: 'worker',
        shapeKey: 'at-rule:media::(min-width: 700px)',
        baseSourceHash: hashSemanticValue(base),
        workerSourceHash: hashSemanticValue(worker),
        headSourceHash: hashSemanticValue(base),
        outputSourceHash: hashSemanticValue(output),
        runtimeCommand: 'playwright test html-css-runtime-proof-capsule-guard.spec.ts --project=chromium',
        runtimeProbeId: 'css:media-cascade-runtime-boundary:legacy-no-capsule',
        runtimeEvidenceHash: 'css-runtime-evidence:legacy-no-capsule',
        runtimeSignals: ['css-cascade-runtime']
      }]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

const conflict = project.conflicts.find((item) => item.details.reasonCode === 'css-cascade-runtime-proof-invalid');
assert.equal(project.status, 'blocked');
assert.equal(project.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(project.summary.htmlCssBrowserRuntimeProofAdmittedFiles, 0);
assert.equal(project.summary.htmlCssBrowserRuntimeProofBlockedFiles, 1);
assert.ok(conflict);
assert.equal(conflict.details.reasonCodes.includes('runtime-proof-capsule-missing'), true);
assert.equal(matrixSurface(project, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'failed');

const forgedLegacySummary = htmlCssProjectSummary([{
  sourcePath,
  language: 'css',
  status: 'merged',
  result: {
    admission: { browserCascadeEquivalenceClaim: true },
    cascadeRuntimeProofs: [{
      id: 'css_runtime_proof_capsule_guard_forged_legacy',
      status: 'passed',
      runtimeEvidenceBound: true,
      runtimeCommand: 'playwright test forged-legacy.spec.ts --project=chromium',
      runtimeProbeId: 'css:media-cascade-runtime-boundary:forged-legacy',
      runtimeEvidenceHash: 'css-runtime-evidence:forged-legacy',
      runtimeSignals: ['css-cascade-runtime']
    }]
  }
}]);

assert.equal(forgedLegacySummary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(forgedLegacySummary.htmlCssBrowserRuntimeProofAdmittedFiles, 0);

const sourceBoundRuntimeSummary = htmlCssProjectSummary([{
  sourcePath,
  language: 'css',
  status: 'merged',
  result: {
    admission: { browserCascadeEquivalenceClaim: true },
    cascadeRuntimeProofs: [sourceBoundRuntimeProofRecord()]
  }
}]);

assert.equal(sourceBoundRuntimeSummary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(sourceBoundRuntimeSummary.htmlCssBrowserRuntimeProofAdmittedFiles, 1);

const staleOutputProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css_runtime_proof_capsule_stale_output',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      scopedCascadeGraphHash: 'hash_runtime_proof_capsule_guard_scoped_cascade',
      cssCascadeRuntimeProofs: [{
        ...sourceBoundRuntimeProofInput(),
        id: 'css_runtime_proof_capsule_guard_stale_output',
        outputSourceHash: hashSemanticValue('.card { color: stale; }\n')
      }]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

assert.equal(staleOutputProject.status, 'blocked');
assert.equal(staleOutputProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(staleOutputProject.summary.htmlCssBrowserRuntimeProofBlockedFiles, 0);
assert.equal(staleOutputProject.conflicts.some((item) => item.details.reasonCode === 'css-atrule-new-scope-unsupported'), true);
assert.equal(matrixSurface(staleOutputProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

function sourceBoundRuntimeProofInput() {
  return {
    id: 'css_runtime_proof_capsule_guard_source_bound',
    kind: 'css-source-bound-cascade-runtime-proof',
    status: 'passed',
    sourcePath,
    reasonCode: 'css-atrule-new-scope-unsupported',
    side: 'worker',
    shapeKey: 'at-rule:media::(min-width: 700px)',
    baseSourceHash: hashSemanticValue(base),
    workerSourceHash: hashSemanticValue(worker),
    headSourceHash: hashSemanticValue(base),
    outputSourceHash: hashSemanticValue(output),
    runtimeProofCapsule: runtimeProofCapsule()
  };
}

function sourceBoundRuntimeProofRecord() {
  return {
    ...sourceBoundRuntimeProofInput(),
    runtimeCommand: 'playwright test html-css-runtime-proof-capsule-guard.spec.ts --project=chromium',
    runtimeProbeId: 'css:media-cascade-runtime-boundary:source-bound',
    runtimeEvidenceHash: 'css-runtime-evidence:source-bound',
    runtimeSignals: ['css-cascade-runtime'],
    requiredRuntimeSignals: ['css-cascade-runtime'],
    runtimeProofCapsuleHash: 'css-runtime-proof-capsule:source-bound',
    runtimeProofMode: 'isolated-fixture',
    runtimeTelemetryHash: 'css-runtime-telemetry:source-bound',
    runtimeDomSnapshotHash: 'css-runtime-dom:source-bound',
    runtimeComputedStyleHash: 'css-runtime-computed-style:source-bound',
    runtimeLayoutSnapshotHash: 'css-runtime-layout:source-bound',
    runtimeEventTraceHash: 'css-runtime-events:source-bound',
    runtimeAccessibilitySnapshotHash: 'css-runtime-accessibility:source-bound',
    runtimeFocusSnapshotHash: 'css-runtime-focus:source-bound',
    runtimeLayoutShiftHash: 'css-runtime-layout-shift:source-bound',
    runtimeCumulativeLayoutShift: 0,
    runtimeEvidenceBound: true,
    browserCascadeEquivalenceClaim: true,
    browserRenderEquivalenceClaim: false,
    semanticEquivalenceClaim: false,
    autoMergeClaim: false
  };
}

function runtimeProofCapsule() {
  return {
    mode: 'isolated-fixture',
    status: 'passed',
    command: 'playwright test html-css-runtime-proof-capsule-guard.spec.ts --project=chromium',
    probeId: 'css:media-cascade-runtime-boundary:source-bound',
    evidenceHash: 'css-runtime-evidence:source-bound',
    signals: ['css-cascade-runtime'],
    telemetry: {
      hash: 'css-runtime-telemetry:source-bound',
      domSnapshotHash: 'css-runtime-dom:source-bound',
      computedStyleHash: 'css-runtime-computed-style:source-bound',
      layoutSnapshotHash: 'css-runtime-layout:source-bound',
      eventTraceHash: 'css-runtime-events:source-bound',
      accessibilitySnapshotHash: 'css-runtime-accessibility:source-bound',
      focusSnapshotHash: 'css-runtime-focus:source-bound',
      layoutShiftHash: 'css-runtime-layout-shift:source-bound',
      cumulativeLayoutShift: 0
    }
  };
}
