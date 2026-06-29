import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, runtimeProofCapsule } from './html-css-merge-test-helpers.mjs';

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sourceProof({ id, sourcePath, base, worker, head, output, extra = {} }) {
  return {
    id,
    kind: 'source-bound-proof',
    status: 'passed',
    sourcePath,
    sourceHashes: {
      base: hashSemanticValue(base),
      worker: hashSemanticValue(worker),
      head: hashSemanticValue(head),
      output: output === undefined ? undefined : hashSemanticValue(output)
    },
    outputSourceHash: output === undefined ? undefined : hashSemanticValue(output),
    command: `node proof/${id}.mjs`,
    probeId: id,
    evidenceHash: `evidence:${id}`,
    ...extra
  };
}

const packageBase = json({
  name: '@demo/app',
  version: '1.0.0',
  scripts: { test: 'node test.mjs' },
  dependencies: { react: '^18.2.0' }
});
const packageWorker = json({
  name: '@demo/app',
  version: '1.0.0',
  scripts: { test: 'node test.mjs' },
  dependencies: { react: '^18.2.0', zod: '^3.23.0' }
});
const packageHead = json({
  name: '@demo/app',
  version: '1.0.0',
  scripts: { test: 'node test.mjs', build: 'vite build' },
  dependencies: { react: '^18.2.0' },
  devDependencies: { vitest: '^2.0.0' }
});
const packageProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_intent',
  files: [{ sourcePath: 'package.json', baseSourceText: packageBase, workerSourceText: packageWorker, headSourceText: packageHead }]
});
assert.equal(packageProject.status, 'merged');
assert.equal(packageProject.summary.packageManagementFiles, 1);
assert.equal(packageProject.summary.packageJsonFiles, 1);
assert.equal(packageProject.summary.packageIntentMergeFiles, 1);
assert.equal(packageProject.summary.packageGraphEvidenceFiles, 1);
assert.equal(packageProject.outputFiles[0].language, 'package-json');
assert.match(packageProject.outputFiles[0].sourceText, /"zod": "\^3\.23\.0"/);
assert.match(packageProject.outputFiles[0].sourceText, /"vitest": "\^2\.0\.0"/);
assert.match(packageProject.outputFiles[0].sourceText, /"build": "vite build"/);
assert.equal(packageProject.files[0].result.admission.packageInstallEquivalenceClaim, false);
assert.equal(matrixSurface(packageProject, 'package-management-intent-merge').proofStatuses['package-management-intent'], 'passed');

const dependencyConflictProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_dependency_conflict',
  files: [{
    sourcePath: 'package.json',
    baseSourceText: packageBase,
    workerSourceText: packageBase.replace('"react": "^18.2.0"', '"react": "^19.0.0"'),
    headSourceText: packageBase.replace('"react": "^18.2.0"', '"react": "~18.2.0"')
  }]
});
assert.equal(dependencyConflictProject.status, 'blocked');
assert.equal(dependencyConflictProject.summary.packageDependencyRangeConflictFiles, 1);
assert.equal(dependencyConflictProject.conflicts.some((conflict) => conflict.code === 'package-dependency-range-conflict'), true);

const publicSurfaceProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_public_surface_blocked',
  files: [{
    sourcePath: 'package.json',
    baseSourceText: json({ name: '@demo/lib', version: '1.0.0', exports: { '.': './src/index.ts' } }),
    workerSourceText: json({ name: '@demo/lib', version: '1.0.0', exports: { '.': './src/index.ts', './worker': './src/worker.ts' } }),
    headSourceText: json({ name: '@demo/lib', version: '1.0.0', exports: { '.': './src/index.ts' } })
  }]
});
assert.equal(publicSurfaceProject.status, 'blocked');
assert.equal(publicSurfaceProject.summary.packagePublicSurfaceBlockedFiles, 1);
assert.equal(matrixSurface(publicSurfaceProject, 'package-public-surface-proof').proofStatuses['package-public-surface-proof'], 'failed');

const publicSurfaceBase = json({ name: '@demo/lib', version: '1.0.0', exports: { '.': './src/index.ts' } });
const publicSurfaceWorker = json({ name: '@demo/lib', version: '1.0.0', exports: { '.': './src/index.ts', './worker': './src/worker.ts' } });
const publicSurfaceProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_public_surface_proven',
  packagePublicSurfaceProofsByPath: {
    'package.json': [sourceProof({
      id: 'package_public_surface',
      sourcePath: 'package.json',
      base: publicSurfaceBase,
      worker: publicSurfaceWorker,
      head: publicSurfaceBase,
      output: publicSurfaceWorker,
      extra: { packagePublicSurfaceHash: 'exports:hash', command: 'npm run build', evidenceHash: 'exports:evidence' }
    })]
  },
  files: [{ sourcePath: 'package.json', baseSourceText: publicSurfaceBase, workerSourceText: publicSurfaceWorker, headSourceText: publicSurfaceBase }]
});
assert.equal(publicSurfaceProvenProject.status, 'merged');
assert.equal(publicSurfaceProvenProject.summary.packagePublicSurfaceProofs, 1);
assert.equal(matrixSurface(publicSurfaceProvenProject, 'package-public-surface-proof').proofStatuses['package-public-surface-proof'], 'passed');

const lockBase = json({ lockfileVersion: 3, packages: { '': { dependencies: { react: '^18.2.0' } } } });
const lockWorker = json({ lockfileVersion: 3, packages: { '': { dependencies: { react: '^18.2.0', zod: '^3.23.0' } } } });
const lockBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_lockfile_blocked',
  files: [{ sourcePath: 'package-lock.json', baseSourceText: lockBase, workerSourceText: lockWorker, headSourceText: lockBase }]
});
assert.equal(lockBlockedProject.status, 'blocked');
assert.equal(lockBlockedProject.summary.packageLockfileRegenerationBlockedFiles, 1);
assert.equal(matrixSurface(lockBlockedProject, 'package-lockfile-regeneration-proof').proofStatuses['package-lockfile-regeneration-proof'], 'failed');
const lockProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_lockfile_regenerated',
  packageLockfileRegenerationProofsByPath: {
    'package-lock.json': [sourceProof({
      id: 'package_lock_regenerated',
      sourcePath: 'package-lock.json',
      base: lockBase,
      worker: lockWorker,
      head: lockBase,
      output: lockWorker,
      extra: { packageManager: 'npm', installCommand: 'npm install --package-lock-only', lockfileRegenerationHash: 'lock:regen' }
    })]
  },
  files: [{ sourcePath: 'package-lock.json', baseSourceText: lockBase, workerSourceText: lockWorker, headSourceText: lockBase }]
});
assert.equal(lockProvenProject.status, 'merged');
assert.equal(lockProvenProject.summary.packageLockfileRegeneratedFiles, 1);
assert.equal(lockProvenProject.summary.packageLockfileRegenerationProofs, 1);
assert.equal(matrixSurface(lockProvenProject, 'package-lockfile-regeneration-proof').proofStatuses['package-lockfile-regeneration-proof'], 'passed');

const htmlCanvasProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_canvas_static',
  files: [{
    sourcePath: 'src/canvas.html',
    baseSourceText: '<canvas data-frontier-key="preview" width="100">Fallback</canvas>\n',
    workerSourceText: '<canvas data-frontier-key="preview" width="200">Fallback</canvas>\n',
    headSourceText: '<canvas data-frontier-key="preview" width="100" aria-label="Preview">Fallback</canvas>\n'
  }]
});
assert.equal(htmlCanvasProject.status, 'merged');
assert.equal(htmlCanvasProject.summary.htmlCanvasElementFiles, 1);
assert.equal(htmlCanvasProject.summary.htmlCanvasStaticMergedFiles, 1);
assert.equal(matrixSurface(htmlCanvasProject, 'canvas-static-element-merge').proofStatuses['canvas-static-element'], 'passed');

const canvasBase = [
  'export function draw(canvas) {',
  "  const ctx = canvas.getContext('2d');",
  '  return ctx;',
  '}',
  ''
].join('\n');
const canvasWorker = canvasBase.replace('  return ctx;', '  ctx.fillRect(0, 0, 10, 10);\n  return ctx;');
const canvasBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_canvas_runtime_blocked',
  files: [{ sourcePath: 'src/draw.js', baseSourceText: canvasBase, workerSourceText: canvasWorker, headSourceText: canvasBase }]
});
assert.equal(canvasBlockedProject.status, 'blocked');
assert.equal(canvasBlockedProject.summary.canvasRuntimeBlockedFiles, 1);
assert.equal(canvasBlockedProject.summary.canvasDrawingRuntimeBlockedFiles, 1);
assert.equal(canvasBlockedProject.conflicts.some((conflict) => conflict.code === 'canvas-drawing-runtime-proof-missing'), true);
assert.equal(matrixSurface(canvasBlockedProject, 'canvas-runtime-proof').proofStatuses['canvas-runtime-proof'], 'failed');

const canvasProofSignals = [
  'canvas-deterministic-input',
  'canvas-viewport-dpr',
  'canvas-draw-command-trace',
  'canvas-bitmap-proof',
  'canvas-hit-test-pointer',
  'canvas-frame-budget',
  'canvas-accessibility-fallback'
];
const canvasProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_canvas_runtime_proven',
  canvasRuntimeProofsByPath: {
    'src/draw.js': [sourceProof({
      id: 'canvas_runtime_proof',
      sourcePath: 'src/draw.js',
      base: canvasBase,
      worker: canvasWorker,
      head: canvasBase,
      output: canvasWorker,
      extra: {
        kind: 'frontier.runtime-proof.source-bound-proof',
        runtimeCommand: 'node test/probe-canvas.mjs',
        runtimeProbeId: 'canvas:draw',
        runtimeEvidenceHash: 'canvas:evidence',
        runtimeSignals: canvasProofSignals,
        runtimeProofCapsule: runtimeProofCapsule({
          command: 'node test/probe-canvas.mjs',
          probeId: 'canvas:draw',
          evidenceHash: 'canvas:evidence',
          signals: canvasProofSignals,
          label: 'canvas-runtime-proof'
        }),
        inputSequenceHash: 'input:sequence',
        viewportDprHash: 'viewport:dpr',
        drawCommandTraceHash: 'draw:trace',
        canvasBitmapHash: 'bitmap:hash',
        hitTestTraceHash: 'hit:test',
        pointerTraceHash: 'pointer:trace',
        frameTimingHash: 'frame:timing',
        frameBudgetHash: 'frame:budget',
        accessibilitySnapshotHash: 'a11y:hash',
        viewport: { width: 320, height: 240 },
        devicePixelRatio: 2
      }
    })]
  },
  files: [{ sourcePath: 'src/draw.js', baseSourceText: canvasBase, workerSourceText: canvasWorker, headSourceText: canvasBase }]
});
assert.equal(canvasProvenProject.status, 'merged');
assert.equal(canvasProvenProject.summary.canvasRuntimeProofs, 1);
assert.equal(canvasProvenProject.files[0].result.canvasRuntimeProofs[0].runtimeEvidenceBound, true);
assert.equal(canvasProvenProject.files[0].result.canvasRuntimeProofs[0].canvasRuntimeEquivalenceClaim, false);
assert.equal(matrixSurface(canvasProvenProject, 'canvas-runtime-proof').proofStatuses['canvas-runtime-proof'], 'passed');

const offscreenWorker = canvasBase.replace('  return ctx;', '  const offscreen = canvas.transferControlToOffscreen();\n  return offscreen;');
const offscreenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_canvas_offscreen_blocked',
  files: [{ sourcePath: 'src/offscreen.js', baseSourceText: canvasBase, workerSourceText: offscreenWorker, headSourceText: canvasBase }]
});
assert.equal(offscreenProject.status, 'blocked');
assert.equal(offscreenProject.summary.canvasOffscreenWorkerBlockedFiles, 1);
assert.equal(matrixSurface(offscreenProject, 'canvas-offscreen-worker-proof').proofStatuses['canvas-offscreen-worker-proof'], 'failed');
