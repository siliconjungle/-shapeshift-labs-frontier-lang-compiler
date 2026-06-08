import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert } from './smoke/helpers.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const smoke = spawnSync(process.execPath, ['examples/js-frontier-rust-workbench.mjs', '--smoke'], {
  cwd: packageRoot,
  encoding: 'utf8'
});

assert.equal(smoke.status, 0, smoke.stderr || smoke.stdout);

const payload = JSON.parse(smoke.stdout);
assert.equal(payload.ok, true);
assert.equal(payload.summary.symbols >= 2, true);
assert.equal(payload.projections.rust.ok, true);
assert.equal(payload.projections.python.ok, true);
assert.equal(payload.routeExplanation.semanticMerge.readiness, 'blocked');
assert.equal(payload.routeExplanation.semanticMerge.admissionAction, 'reject');
assert.equal(payload.routeExplanation.semanticMerge.autoMergeClaim, false);
assert.equal(payload.routeExplanation.semanticMerge.semanticEquivalenceClaim, false);
assert.equal(payload.routeExplanation.semanticMerge.missingEvidence.includes('proof-or-replay-evidence'), true);
assert.equal(payload.routeExplanation.semanticMerge.missingEvidence.includes('merge-ready-parser'), true);
assert.equal(payload.routeExplanation.semanticMerge.missingEvidence.includes('runtime-adapter-evidence'), true);
assert.equal(payload.routeExplanation.routes.length, 2);
assert.equal(payload.routeExplanation.routes.some((route) => route.target === 'rust'), true);
assert.equal(payload.routeExplanation.routes.some((route) => route.target === 'python'), true);
assert.equal(payload.routeExplanation.routes.every((route) => route.mode === 'target-adapter'), true);
assert.equal(payload.routeExplanation.routes.every((route) => route.missingEvidence.includes('runtime-adapter-evidence')), true);
assert.equal(payload.layout.submitBased, true);
assert.deepEqual(payload.layout.panes, ['typescript', 'frontier', 'rust', 'python']);
assert.equal(payload.layout.independentScrollRegions >= 4, true);
assert.deepEqual(payload.layout.fixedSections, ['topbar', 'statusStrip', 'workspace']);
