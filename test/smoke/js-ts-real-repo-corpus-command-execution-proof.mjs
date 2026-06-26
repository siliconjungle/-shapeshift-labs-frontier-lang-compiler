import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { measureRealRepoCorpus, readRealRepoCorpusFixture } from '../../bench/real-repo-corpus-suite.mjs';

const corpus = readRealRepoCorpusFixture();
const manifest = corpus.realRepoCorpus;
const proof = manifest.localBehavior?.checkoutProof ?? {};
const envName = proof.rootEnv ?? 'FRONTIER_REAL_REPO_CORPUS_ROOT';
const previousRoot = process.env[envName];
const tempRoot = mkdtempSync(join(tmpdir(), 'frontier-real-repo-command-'));

try {
  const viteEntry = manifest.entries.find((entry) => entry.id === 'vite-plugin-config');
  const selectedEntries = ['vite-plugin-config', 'typescript-compiler-services'];
  mkdirSync(join(tempRoot, 'vite', 'packages/vite/src/node'), { recursive: true });
  mkdirSync(join(tempRoot, 'vite', 'scripts'), { recursive: true });
  writeFileSync(join(tempRoot, 'vite', 'packages/vite/src/node/config.ts'), 'export const syntheticConfig = true;\n');
  writeFileSync(join(tempRoot, 'vite', 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: {} }));
  writeFileSync(join(tempRoot, 'vite', 'package.json'), JSON.stringify({
    scripts: {
      build: 'node scripts/build-ok.mjs',
      test: 'node scripts/test-ok.mjs'
    }
  }));
  writeFileSync(join(tempRoot, 'vite', 'scripts/build-ok.mjs'), 'console.log("build-output-" + "x".repeat(512));\n');
  writeFileSync(join(tempRoot, 'vite', 'scripts/test-ok.mjs'), 'console.log("test-ok");\n');
  mkdirSync(join(tempRoot, 'vite', '.git'), { recursive: true });
  writeFileSync(join(tempRoot, 'vite', '.git/HEAD'), `ref: refs/heads/${viteEntry.source.ref}\n`);
  writeFileSync(join(tempRoot, 'vite', '.git/config'), `[remote "origin"]\n\turl = ${viteEntry.source.url}\n`);

  process.env[envName] = tempRoot;
  const defaultMetrics = measureRealRepoCorpus();
  const defaultRows = new Map(defaultMetrics.realRepoCorpusCheckoutEvidenceRows.map((row) => [row.entryId, row]));
  assert.equal(defaultMetrics.realRepoCorpusCommandRunEnabledRows, 0, 'default command execution remains disabled');
  assert.equal(defaultMetrics.realRepoCorpusCommandRunExecutedPhases, 0, 'default command execution runs no phases');
  assert.equal(defaultRows.get('vite-plugin-config').commandRunStatus, 'blocked-opt-in-required', 'default Vite command run requires opt-in');

  const successMetrics = measureRealRepoCorpus({
    realRepoCommandExecution: {
      enabled: true,
      entryIds: selectedEntries,
      phases: ['dependency-install', 'build', 'test'],
      allowDependencyInstall: false,
      timeoutMs: 8_000,
      maxOutputBytes: 96
    }
  });
  const successRows = new Map(successMetrics.realRepoCorpusCheckoutEvidenceRows.map((row) => [row.entryId, row]));
  const viteSuccess = successRows.get('vite-plugin-config');
  assert.equal(successMetrics.realRepoCorpusRepositoryCommandsRun, 1, 'opt-in command execution records repository commands');
  assert.equal(successMetrics.realRepoCorpusDependencyInstallsRun, 0, 'dependency install remains disabled without network opt-in');
  assert.equal(successMetrics.realRepoCorpusCommandRunEnabledRows, selectedEntries.length, 'selected rows are command-run enabled');
  assert.equal(successMetrics.realRepoCorpusCommandRunExecutedPhases, 2, 'build and test phases executed');
  assert.equal(successMetrics.realRepoCorpusCommandRunOutputTruncatedPhases >= 1, true, 'large command output is capped');
  assert.equal(viteSuccess.commandRunStatus, 'executed', 'Vite command run aggregate status');
  assert.equal(viteSuccess.repositoryCommandExecution, 'executed', 'Vite repository command execution');
  assert.equal(viteSuccess.dependencyInstallExecution, 'not-run-default-network-free', 'Vite dependency install execution');
  assert.equal(viteSuccess.commandRunExecutedPhases, 2, 'Vite executed build and test');
  assert.equal(viteSuccess.commandRunDefaultOffPhases, 1, 'Vite dependency install remains default-off');
  assert.deepEqual(viteSuccess.commandRunPhases.map((phase) => phase.phase), ['dependency-install', 'build', 'test']);
  assert.deepEqual(viteSuccess.commandRunPhases.map((phase) => phase.executionStatus), ['blocked-opt-in-required', 'executed', 'executed']);
  assert.equal(viteSuccess.commandRunPhases[0].reason, 'real-repo-command-network-opt-in-missing', 'dependency install network opt-in reason');
  assert.equal(viteSuccess.commandRunPhases[1].argv[0], 'npm', 'build command manager');
  assert.equal(viteSuccess.commandRunPhases[1].argv.includes('build'), true, 'build command argv');
  assert.equal(viteSuccess.commandRunPhases[1].stdoutTruncated, true, 'build stdout truncation');
  assert.equal(viteSuccess.commandRunPhases[1].stdoutHash.length, 64, 'build stdout hash');
  assert.equal(viteSuccess.commandRunPhases[2].exitCode, 0, 'test exit code');

  const typescriptRow = successRows.get('typescript-compiler-services');
  assert.equal(typescriptRow.commandRunStatus, 'skipped-missing-checkout', 'missing checkout command run skipped');
  assert.equal(typescriptRow.commandRunSkippedPhases, 3, 'missing checkout skips all command phases');

  writeFileSync(join(tempRoot, 'vite', 'scripts/test-ok.mjs'), 'console.error("test-failed");\nprocess.exit(7);\n');
  const failedMetrics = measureRealRepoCorpus({
    realRepoCommandExecution: {
      enabled: true,
      entryIds: ['vite-plugin-config'],
      phases: ['build', 'test'],
      timeoutMs: 8_000,
      maxOutputBytes: 256
    }
  });
  const viteFailure = new Map(failedMetrics.realRepoCorpusCheckoutEvidenceRows.map((row) => [row.entryId, row])).get('vite-plugin-config');
  assert.equal(failedMetrics.realRepoCorpusCommandRunExecutedPhases, 1, 'failure run still records successful build phase');
  assert.equal(failedMetrics.realRepoCorpusCommandRunFailedPhases, 1, 'failure run records failed test phase');
  assert.equal(viteFailure.commandRunStatus, 'failed', 'failed test aggregate status');
  assert.equal(viteFailure.repositoryCommandExecution, 'failed', 'failed repository command execution');
  assert.equal(viteFailure.commandRunPhases.find((phase) => phase.phase === 'test').exitCode, 7, 'failed test exit code evidence');
} finally {
  if (previousRoot === undefined) delete process.env[envName];
  else process.env[envName] = previousRoot;
  rmSync(tempRoot, { recursive: true, force: true });
}
