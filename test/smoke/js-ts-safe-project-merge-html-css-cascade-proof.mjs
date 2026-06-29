import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const sourcePath = 'src/button.css';
const base = '.button { color: red; }\n';
const worker = '@media (min-width: 700px) { .button { color: red; } }\n';
const output = '@media (min-width: 700px) {\n  .button {\n    color: red;\n  }\n}\n';
const proof = {
  id: 'proof_css_project_source_shape_media',
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
  runtimeCommand: 'playwright test css-project-cascade-runtime.spec.ts',
  runtimeProbeId: 'css-project-media-cascade-probe',
  runtimeEvidenceHash: hashSemanticValue('src/button.css media project cascade runtime evidence'),
  runtimeSignals: ['css-cascade-runtime']
};

const project = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_cascade_runtime_proof',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      scopedCascadeGraphHash: 'hash_scoped_cascade',
      cssCascadeRuntimeProofs: [proof]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

assert.equal(project.status, 'merged');
assert.equal(project.summary.cssMergedFiles, 1);
assert.equal(project.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(project.files[0].result.browserCascadeEquivalenceClaim, true);
assert.equal(project.files[0].result.admission.browserCascadeEquivalenceClaim, true);
assert.equal(project.files[0].result.cascadeRuntimeProofs[0].reasonCode, 'css-atrule-new-scope-unsupported');
assert.equal(project.files[0].result.cascadeRuntimeProofs[0].runtimeEvidenceBound, true);
assert.equal(project.outputFiles[0].sourceText, output);
assert.equal(matrixSurface(project, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');
assert.equal(matrixSurface(project, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

const explicitFalseClaimProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_cascade_runtime_explicit_false_claims',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      scopedCascadeGraphHash: 'hash_scoped_cascade',
      cssCascadeRuntimeProofs: [{
        ...proof,
        id: 'proof_css_project_source_shape_media_explicit_false_claims',
        browserRuntimeEquivalenceClaim: false,
        browserCascadeEquivalenceClaim: false,
        browserRenderEquivalenceClaim: false,
        semanticEquivalenceClaim: false,
        autoMergeClaim: false
      }]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

assert.equal(explicitFalseClaimProject.status, 'merged');
assert.equal(explicitFalseClaimProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(explicitFalseClaimProject.files[0].result.cascadeRuntimeProofs[0].runtimeEvidenceBound, true);
assert.equal(explicitFalseClaimProject.files[0].result.cascadeRuntimeProofs[0].browserRenderEquivalenceClaim, false);
assert.equal(explicitFalseClaimProject.files[0].result.cascadeRuntimeProofs[0].semanticEquivalenceClaim, false);
assert.equal(matrixSurface(explicitFalseClaimProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

const broadClaimProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_cascade_runtime_broad_claim_blocked',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      scopedCascadeGraphHash: 'hash_scoped_cascade',
      cssCascadeRuntimeProofs: [{
        ...proof,
        id: 'proof_css_project_source_shape_media_broad_claim',
        browserRenderEquivalenceClaim: true
      }]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

assert.equal(broadClaimProject.status, 'blocked');
assert.equal(broadClaimProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(broadClaimProject.files[0].result.browserCascadeEquivalenceClaim, false);
assert.equal(broadClaimProject.files[0].result.admission.browserCascadeEquivalenceClaim, false);
assert.equal(broadClaimProject.conflicts.some((conflict) => conflict.code === 'css-cascade-runtime-proof-blocked' && conflict.details.reasonCode === 'css-cascade-runtime-proof-broad-claim'), true);
assert.equal(broadClaimProject.conflicts.some((conflict) => conflict.details.invalidRuntimeProofIds?.includes('proof_css_project_source_shape_media_broad_claim')), true);
assert.equal(matrixSurface(broadClaimProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');
assert.equal(matrixSurface(broadClaimProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const capsuleProof = {
  id: 'proof_css_project_source_shape_media_capsule',
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
  runtimeProofCapsule: {
    mode: 'isolated-fixture',
    status: 'passed',
    command: 'playwright test css-project-cascade-runtime-capsule.spec.ts',
    probeId: 'css-project-media-cascade-capsule-probe',
    evidenceHash: hashSemanticValue('src/button.css media project cascade runtime capsule evidence'),
    signals: ['css-cascade-runtime'],
    browser: { name: 'chromium', version: 'stable' },
    viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
    telemetry: {
      hash: 'css-project-capsule-telemetry',
      domSnapshotHash: 'css-project-capsule-dom',
      computedStyleHash: 'css-project-capsule-style',
      layoutSnapshotHash: 'css-project-capsule-layout',
      eventTraceHash: 'css-project-capsule-events',
      accessibilitySnapshotHash: 'css-project-capsule-accessibility',
      focusSnapshotHash: 'css-project-capsule-focus',
      layoutShiftHash: 'css-project-capsule-layout-shift',
      cumulativeLayoutShift: 0
    }
  }
};

const capsuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_cascade_runtime_capsule_proof',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      scopedCascadeGraphHash: 'hash_scoped_cascade',
      cssCascadeRuntimeProofs: [capsuleProof]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

assert.equal(capsuleProject.status, 'merged');
assert.equal(capsuleProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeCommand, 'playwright test css-project-cascade-runtime-capsule.spec.ts');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeProofMode, 'isolated-fixture');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeBrowserName, 'chromium');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeViewport.width, 1280);
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeTelemetryHash, 'css-project-capsule-telemetry');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeDomSnapshotHash, 'css-project-capsule-dom');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeComputedStyleHash, 'css-project-capsule-style');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeLayoutSnapshotHash, 'css-project-capsule-layout');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeAccessibilitySnapshotHash, 'css-project-capsule-accessibility');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeFocusSnapshotHash, 'css-project-capsule-focus');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeLayoutShiftHash, 'css-project-capsule-layout-shift');
assert.equal(capsuleProject.files[0].result.cascadeRuntimeProofs[0].runtimeCumulativeLayoutShift, 0);
assert.equal(matrixSurface(capsuleProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'passed');

const blockedCapsuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_cascade_runtime_capsule_blocked',
  cssMergeOptionsByPath: {
    [sourcePath]: {
      scopedCascadeGraphHash: 'hash_scoped_cascade',
      cssCascadeRuntimeProofs: [{
        ...capsuleProof,
        id: 'proof_css_project_source_shape_media_capsule_blocked',
        runtimeProofCapsule: {
          mode: 'environment-blocked',
          status: 'blocked',
          command: 'playwright test css-project-cascade-runtime-capsule.spec.ts',
          probeId: 'css-project-media-cascade-capsule-probe',
          evidenceHash: hashSemanticValue('src/button.css media project cascade runtime capsule blocked'),
          signals: ['css-cascade-runtime']
        }
      }]
    }
  },
  files: [{ sourcePath, baseSourceText: base, workerSourceText: worker, headSourceText: base }]
});

assert.equal(blockedCapsuleProject.status, 'blocked');
assert.equal(blockedCapsuleProject.summary.htmlCssBrowserRuntimeProofs, 0);
assert.equal(blockedCapsuleProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-atrule-new-scope-unsupported'), true);
assert.equal(matrixSurface(blockedCapsuleProject, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
