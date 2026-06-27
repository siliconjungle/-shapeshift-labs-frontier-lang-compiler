import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import {
  createSemanticEditBundleAdmission,
  createSemanticEditScript,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

function semanticEditFlow(input) {
  const script = createSemanticEditScript({
    id: `${input.id}_script`,
    language: 'javascript',
    sourcePath: input.sourcePath,
    baseSourceText: input.base,
    workerSourceText: input.worker,
    headSourceText: input.head ?? input.base,
    generatedAt: 80
  });
  const projection = projectSemanticEditScriptToSource({
    id: `${input.id}_projection`,
    script,
    workerSourceText: input.worker,
    headSourceText: input.head ?? input.base
  });
  const currentSourceText = input.current ?? input.head ?? input.base;
  const replayBinding = input.bindReplay === false ? {} : {
    currentSourceHash: hashSemanticValue(currentSourceText),
    expectedOutputSourceText: projection.sourceText,
    expectedOutputHash: projection.projectedHash
  };
  const replay = replaySemanticEditProjection({
    id: `${input.id}_replay`,
    projection,
    currentSourceText,
    ...replayBinding
  });
  return { script, projection, replay };
}

const first = semanticEditFlow({
  id: 'bundle_status_first',
  sourcePath: 'src/a.js',
  base: 'export function a() { return 1; }\n',
  worker: 'export function a() { return 2; }\n'
});
const stale = semanticEditFlow({
  id: 'bundle_stale',
  sourcePath: 'src/d.js',
  base: 'export function d() { return 1; }\n',
  worker: 'export function d() { return 2; }\n',
  current: 'export function renamed() { return 1; }\n'
});
const conflict = semanticEditFlow({
  id: 'bundle_conflict',
  sourcePath: 'src/e.js',
  base: 'export function e() { return 1; }\n',
  worker: 'export function e() { return 2; }\n',
  current: 'export function e() { return 4; }\n',
  bindReplay: false
});

assert.equal(createSemanticEditBundleAdmission({ semanticEditReplays: [stale.replay] }).status, 'stale');
assert.equal(createSemanticEditBundleAdmission({ semanticEditReplays: [conflict.replay] }).status, 'conflict');

const blockedAdmission = createSemanticEditBundleAdmission({
  semanticEditProjections: [{
    id: 'bundle_blocked_projection',
    status: 'blocked',
    admission: { status: 'blocked', reasonCodes: ['projection-blocked'] }
  }]
});
assert.equal(blockedAdmission.status, 'blocked');
assert.equal(blockedAdmission.action, 'block');
assert.equal(blockedAdmission.readiness, 'blocked');
assert.equal(blockedAdmission.reasonCodes.includes('semantic-edit-blocked'), true);

const missingReplayAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [first.script],
  semanticEditProjections: [first.projection]
});
assert.equal(missingReplayAdmission.status, 'needs-review');
assert.equal(missingReplayAdmission.action, 'review');
assert.equal(missingReplayAdmission.reasonCodes.includes('semantic-edit-replay-missing'), true);
