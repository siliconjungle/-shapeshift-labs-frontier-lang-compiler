import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { measureRealRepoCorpus, readRealRepoCorpusFixture } from '../../bench/real-repo-corpus-suite.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;
const corpus = readRealRepoCorpusFixture();
const manifest = corpus.realRepoCorpus;
const proof = manifest.localBehavior?.checkoutProof ?? {};
const envName = proof.rootEnv ?? 'FRONTIER_REAL_REPO_CORPUS_ROOT';
const previousRoot = process.env[envName];
const tempRoot = mkdtempSync(join(tmpdir(), 'frontier-real-repo-live-project-'));

try {
  const viteEntry = manifest.entries.find((entry) => entry.id === 'vite-plugin-config');
  const viteRoot = join(tempRoot, 'vite');
  prepareViteCheckout(viteRoot, viteEntry);
  process.env[envName] = tempRoot;

  const defaultMetrics = measureRealRepoCorpus();
  assert.equal(defaultMetrics.realRepoCorpusLiveProjectProofEnabledRows, 0, 'default live-project proof disabled');
  assert.equal(defaultMetrics.realRepoCorpusLiveProjectProofSourceTextReadRows, 0, 'default live-project proof reads no source text');
  assert.equal(defaultMetrics.realRepoCorpusLiveProjectProofDefaultOffRows, manifest.entries.length, 'default live-project proof default-off rows');

  const selectedEntries = ['vite-plugin-config', 'typescript-compiler-services'];
  const metrics = measureRealRepoCorpus({
    realRepoLiveProjectProof: {
      enabled: true,
      entryIds: selectedEntries,
      typescript,
      maxFiles: 8,
      maxBytesPerFile: 32_000
    }
  });
  const rows = new Map(metrics.realRepoCorpusLiveProjectProofRowsByEntry.map((row) => [row.entryId, row]));
  const checkoutRows = new Map(metrics.realRepoCorpusCheckoutEvidenceRows.map((row) => [row.entryId, row]));
  const cacheRows = new Map(metrics.realRepoCorpusSourceCachePolicyRowsByEntry.map((row) => [row.entryId, row]));
  const viteCheckout = checkoutRows.get('vite-plugin-config');
  assert.equal(viteCheckout.checkoutProofStatus, 'checked-out', 'prepared Vite checkout proof status');
  assert.equal(viteCheckout.checkoutIdentityStatus, 'git-identity-matched', 'prepared Vite git identity');
  assert.equal(viteCheckout.gitMetadataKind, 'git-directory', 'prepared Vite real git directory');
  assert.equal(viteCheckout.gitRemoteOriginMatchesManifest, true, 'prepared Vite remote identity');
  assert.equal(viteCheckout.gitRefMatchesManifest, true, 'prepared Vite ref identity');
  assert.deepEqual(viteCheckout.packageManagersPresent, ['npm'], 'prepared Vite lockfile manager');

  const viteRow = rows.get('vite-plugin-config');
  assert.equal(metrics.realRepoCorpusLiveProjectProofEnabledRows, selectedEntries.length, 'selected live-project proof rows');
  assert.equal(metrics.realRepoCorpusLiveProjectProofDefaultOffRows, manifest.entries.length - selectedEntries.length, 'unselected live-project rows stay default-off');
  assert.equal(metrics.realRepoCorpusLiveProjectProofPassedRows, 1, 'prepared Vite live-project proof passes');
  assert.equal(metrics.realRepoCorpusLiveProjectProofSkippedRows, 1, 'missing selected checkout is skipped');
  assert.equal(metrics.realRepoCorpusLiveProjectProofSourceTextReadRows, 1, 'only prepared selected checkout reads source text');
  assert.equal(metrics.realRepoCorpusSourceCachePolicyLiveProjectHashRows, 1, 'prepared Vite source-cache artifact links live source-set hash');
  assert.equal(viteRow.liveProjectProofStatus, 'passed', 'Vite live-project proof status');
  assert.equal(viteRow.liveProjectProofExecutionStatus, 'passed', 'Vite live-project proof execution');
  assert.deepEqual(viteRow.liveProjectProofPhases.map((phase) => phase.phase), ['diagnostics', 'declaration-output']);
  assert.deepEqual(viteRow.liveProjectProofPhases.map((phase) => phase.executionStatus), ['passed', 'passed']);
  assert.equal(viteRow.liveProjectSourceTextRead, true, 'Vite live-project proof reads source text under opt-in');
  assert.equal(viteRow.liveProjectSourceFilesRead, 2, 'Vite live-project proof bounded source files');
  assert.equal(viteRow.liveProjectSourceFiles.every((file) => typeof file.sourceHash === 'string' && file.sourceHash.length === 64), true, 'Vite source file hashes');
  assert.equal(viteRow.liveProjectSourceFiles.some((file) => Object.hasOwn(file, 'sourceText')), false, 'Vite source evidence omits source text');
  assert.equal(typeof viteRow.liveProjectSourceSetHash === 'string' && viteRow.liveProjectSourceSetHash.length === 64, true, 'Vite source set hash');
  assert.equal(viteRow.liveProjectDiagnosticsStatus, 'passed', 'Vite diagnostics passed');
  assert.equal(viteRow.liveProjectDiagnosticsErrors, 0, 'Vite diagnostics errors');
  assert.equal(viteRow.liveProjectDeclarationStatus, 'passed', 'Vite declaration proof passed');
  assert.equal(viteRow.liveProjectDeclarationFiles >= 2, true, 'Vite declaration files emitted');
  assert.equal(typeof viteRow.liveProjectDiagnosticsGateHash === 'string' && viteRow.liveProjectDiagnosticsGateHash.length > 0, true, 'Vite diagnostics gate hash');
  assert.equal(typeof viteRow.liveProjectDeclarationGateHash === 'string' && viteRow.liveProjectDeclarationGateHash.length > 0, true, 'Vite declaration gate hash');
  const viteCacheRow = cacheRows.get('vite-plugin-config');
  assert.equal(viteCacheRow.retentionAdmissionStatus, 'admissible', 'Vite source-cache retention admission');
  assert.equal(viteCacheRow.liveProjectSourceSetHash, viteRow.liveProjectSourceSetHash, 'Vite source-cache live source-set hash binding');
  assert.equal(viteCacheRow.sourceTextIncluded, false, 'Vite source-cache artifact omits source text');

  const missingRow = rows.get('typescript-compiler-services');
  assert.equal(missingRow.liveProjectProofStatus, 'skipped-missing-checkout', 'missing selected checkout live-project status');
  assert.equal(missingRow.liveProjectSourceTextRead, false, 'missing selected checkout reads no source text');

  writeFileSync(join(viteRoot, 'packages/vite/src/node/config.ts'), [
    'export interface UserConfig {',
    '  root?: string;',
    '}',
    'export const defaultConfig: UserConfig = { root: 7 };',
    ''
  ].join('\n'));
  const failedMetrics = measureRealRepoCorpus({
    realRepoLiveProjectProof: {
      enabled: true,
      entryIds: ['vite-plugin-config'],
      typescript,
      maxFiles: 8,
      maxBytesPerFile: 32_000
    }
  });
  const failedRow = new Map(failedMetrics.realRepoCorpusLiveProjectProofRowsByEntry.map((row) => [row.entryId, row])).get('vite-plugin-config');
  assert.equal(failedRow.liveProjectProofStatus, 'failed', 'type diagnostic blocks live-project proof');
  assert.equal(failedRow.liveProjectDiagnosticsStatus, 'failed', 'type diagnostic gate fails');
  assert.equal(failedRow.liveProjectDiagnosticsErrors > 0, true, 'type diagnostic errors are counted');
} finally {
  if (previousRoot === undefined) delete process.env[envName];
  else process.env[envName] = previousRoot;
  rmSync(tempRoot, { recursive: true, force: true });
}

function prepareViteCheckout(root, entry) {
  mkdirSync(join(root, 'packages/vite/src/node/plugins'), { recursive: true });
  writeFileSync(join(root, 'packages/vite/src/node/plugins/frontier.ts'), [
    'export interface PluginOptions {',
    '  enabled: boolean;',
    '}',
    'export function createPlugin(options: PluginOptions): boolean {',
    '  return options.enabled;',
    '}',
    ''
  ].join('\n'));
  writeFileSync(join(root, 'packages/vite/src/node/config.ts'), [
    'export interface UserConfig {',
    '  root?: string;',
    '}',
    'export const defaultConfig: UserConfig = {};',
    ''
  ].join('\n'));
  writeFileSync(join(root, 'LICENSE'), 'MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy.\n');
  writeFileSync(join(root, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: {} }));
  runGit(root, ['init']);
  runGit(root, ['symbolic-ref', 'HEAD', `refs/heads/${entry.source.ref}`]);
  runGit(root, ['remote', 'add', 'origin', entry.source.url]);
}

function runGit(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
}
