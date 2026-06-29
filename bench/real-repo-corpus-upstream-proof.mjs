import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureRealRepoCorpus, readRealRepoCorpusFixture } from './real-repo-corpus-suite.mjs';
import { createUpstreamProofArtifact } from './real-repo-corpus-upstream-artifact.mjs';

const defaultRootUrl = new URL('../tmp/js-ts-semantic-merge-real-repos', import.meta.url);
const defaultEntryIds = ['frontier-merge-metrics-public-api'];

async function runRealRepoCorpusUpstreamProof(options = {}) {
  const corpus = readRealRepoCorpusFixture();
  const manifest = corpus.realRepoCorpus ?? {};
  const proof = manifest.localBehavior?.checkoutProof ?? {};
  const rootEnv = proof.rootEnv ?? 'FRONTIER_REAL_REPO_CORPUS_ROOT';
  const rootPath = resolve(options.root ?? process.env[rootEnv] ?? fileURLToPath(defaultRootUrl));
  const selectedEntryIds = normalizeEntryIds(options.entryIds);
  const entries = (manifest.entries ?? []).filter((entry) => selectedEntryIds.includes(entry.id));
  mkdirSync(rootPath, { recursive: true });

  const checkoutPreparation = entries.map((entry) => prepareUpstreamCheckout(entry, rootPath, options));
  const previousRoot = process.env[rootEnv];
  process.env[rootEnv] = rootPath;
  try {
    const typescript = options.liveProject === true ? await loadTypeScript() : undefined;
    const metrics = measureRealRepoCorpus({
      realRepoLiveProjectProof: options.liveProject === true
        ? {
            enabled: true,
            entryIds: selectedEntryIds,
            typescript,
            maxFiles: options.maxFiles,
            maxBytesPerFile: options.maxBytesPerFile,
            compilerOptions: options.withDefaultLib === true ? { noLib: false, skipLibCheck: true } : undefined,
            declarationCompilerOptions: options.withDefaultLib === true ? { noLib: false, skipLibCheck: true } : undefined
          }
        : undefined,
      realRepoCommandExecution: options.commands === true
        ? {
            enabled: true,
            entryIds: selectedEntryIds,
            phases: options.commandPhases,
            allowDependencyInstall: options.allowDependencyInstall === true,
            timeoutMs: options.timeoutMs,
            maxOutputBytes: options.maxOutputBytes
          }
        : undefined
    });
    const artifact = createUpstreamProofArtifact({
      manifest,
      rootEnv,
      rootPath,
      selectedEntryIds,
      checkoutPreparation,
      metrics,
      options
    });
    if (options.out) writeJsonFile(options.out, artifact);
    return artifact;
  } finally {
    if (previousRoot === undefined) delete process.env[rootEnv];
    else process.env[rootEnv] = previousRoot;
  }
}

function prepareUpstreamCheckout(entry, rootPath, options) {
  const checkoutDir = entry.checkoutDir;
  const checkoutPath = checkoutDir ? resolve(rootPath, checkoutDir) : null;
  const base = {
    entryId: entry.id,
    sourceType: entry.source?.type ?? null,
    sourceUrl: entry.source?.url ?? null,
    sourceRef: entry.source?.ref ?? null,
    checkoutDir: checkoutDir ?? null,
    checkoutPathHash: checkoutPath ? hashText(checkoutPath) : null
  };
  if (entry.source?.type !== 'git' || !entry.source?.url || !checkoutDir) {
    return { ...base, status: 'skipped-unsupported-source' };
  }
  if (checkoutPath && existsSync(checkoutPath)) {
    return { ...base, status: 'already-present', headCommit: gitHead(checkoutPath) };
  }
  if (options.clone !== true) return { ...base, status: 'missing-clone-disabled' };

  const args = ['clone', '--filter=blob:none', '--depth=1'];
  if (entry.source.ref && !/^[a-f0-9]{7,40}$/i.test(entry.source.ref)) args.push('--branch', entry.source.ref);
  args.push(entry.source.url, checkoutPath);
  const result = spawnSync('git', args, {
    cwd: rootPath,
    shell: false,
    encoding: 'utf8',
    timeout: positiveInteger(options.cloneTimeoutMs, 120_000),
    maxBuffer: 1_048_576
  });
  return {
    ...base,
    status: result.status === 0 ? 'cloned' : 'clone-failed',
    exitCode: typeof result.status === 'number' ? result.status : null,
    signal: result.signal ?? null,
    stdoutHash: hashText(result.stdout ?? ''),
    stderrHash: hashText(result.stderr ?? ''),
    stdoutBytes: Buffer.byteLength(result.stdout ?? ''),
    stderrBytes: Buffer.byteLength(result.stderr ?? ''),
    headCommit: result.status === 0 ? gitHead(checkoutPath) : null
  };
}

async function loadTypeScript() {
  const tsModule = await import('typescript');
  return tsModule.default ?? tsModule;
}

function gitHead(checkoutPath) {
  const result = spawnSync('git', ['-C', checkoutPath, 'rev-parse', 'HEAD'], {
    shell: false,
    encoding: 'utf8',
    timeout: 10_000
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function normalizeEntryIds(value) {
  return Array.isArray(value) && value.length ? [...new Set(value)] : defaultEntryIds;
}

function writeJsonFile(path, value) {
  const resolved = resolve(path);
  mkdirSync(dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') options.root = requiredValue(args, ++index, arg);
    else if (arg === '--entry') options.entryIds = [...(options.entryIds ?? []), requiredValue(args, ++index, arg)];
    else if (arg === '--out') options.out = requiredValue(args, ++index, arg);
    else if (arg === '--clone') options.clone = true;
    else if (arg === '--live-project') options.liveProject = true;
    else if (arg === '--commands') options.commands = true;
    else if (arg === '--allow-dependency-install') options.allowDependencyInstall = true;
    else if (arg === '--with-default-lib') options.withDefaultLib = true;
    else if (arg === '--timeout-ms') options.timeoutMs = positiveInteger(requiredValue(args, ++index, arg), 0);
    else if (arg === '--clone-timeout-ms') options.cloneTimeoutMs = positiveInteger(requiredValue(args, ++index, arg), 0);
    else if (arg === '--max-output-bytes') options.maxOutputBytes = positiveInteger(requiredValue(args, ++index, arg), 0);
    else if (arg === '--max-files') options.maxFiles = positiveInteger(requiredValue(args, ++index, arg), 0);
    else if (arg === '--max-bytes-per-file') options.maxBytesPerFile = positiveInteger(requiredValue(args, ++index, arg), 0);
    else if (arg === '--phase') options.commandPhases = [...(options.commandPhases ?? []), requiredValue(args, ++index, arg)];
    else if (arg === '--generated-at') options.generatedAt = requiredValue(args, ++index, arg);
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function printHelp() {
  process.stdout.write(`real-repo-corpus-upstream-proof

Usage:
  node bench/real-repo-corpus-upstream-proof.mjs --clone --live-project --commands --entry <id> --out <path>

Options:
  --root <path>                 Checkout cache root. Defaults to tmp/js-ts-semantic-merge-real-repos.
  --entry <id>                  Corpus entry to prove. Repeatable. Defaults to frontier-merge-metrics-public-api.
  --clone                       Clone missing git checkouts. Existing checkouts are reused.
  --live-project                Run source-bound diagnostics/declaration proof.
  --commands                    Run guarded repository command phases.
  --allow-dependency-install    Allow dependency-install command phases.
  --with-default-lib            Allow TypeScript default lib for real-world source proof.
  --phase <phase>               Command phase: dependency-install, build, or test. Repeatable.
  --timeout-ms <n>              Per-command timeout.
  --max-output-bytes <n>        Per-command output preview cap before hashing.
  --max-files <n>               Live source file cap.
  --max-bytes-per-file <n>      Live source file byte cap.
  --out <path>                  Write compact JSON proof artifact.
`);
}

function requiredValue(args, index, option) {
  const value = args[index];
  if (!value) throw new Error(`${option} requires a value`);
  return value;
}

function positiveInteger(value, fallback) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function hashText(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
  } else {
    const artifact = await runRealRepoCorpusUpstreamProof(options);
    if (!options.out) process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
  }
}

export { prepareUpstreamCheckout, runRealRepoCorpusUpstreamProof };
