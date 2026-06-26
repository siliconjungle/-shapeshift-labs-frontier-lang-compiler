import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

const defaultPhases = ['dependency-install', 'build', 'test'];
const defaultTimeoutMs = 15_000;
const defaultMaxOutputBytes = 4_096;
const safeEnvKeys = new Set(['PATH', 'HOME', 'USER', 'TMPDIR', 'TEMP', 'TMP']);
const shellMetacharacters = /[;&|<>$`(){}[\]*?!~"'\\\n\r]/;

function collectRealRepoCommandExecution(manifest, checkoutProof, options = {}) {
  const phases = normalizePhases(options.phases);
  const enabled = options.enabled === true;
  const selectedEntryIds = Array.isArray(options.entryIds) ? new Set(options.entryIds) : null;
  const matrixByManager = new Map((manifest.localBehavior?.packageManagerMatrix ?? []).map((row) => [row.manager, row]));
  const rows = (checkoutProof.rows ?? []).map((row) => {
    if (!enabled || (selectedEntryIds && !selectedEntryIds.has(row.entryId))) {
      return createDefaultOffRow(row, phases, 'real-repo-command-opt-in-missing');
    }
    return collectCommandExecutionForRow(row, phases, matrixByManager, checkoutProof, options);
  });
  return {
    enabled,
    rows,
    commandRunRows: rows.length,
    commandRunEnabledRows: rows.filter((row) => row.commandRunEnabled).length,
    commandRunDefaultOffRows: rows.filter((row) => row.commandRunExecutionStatus === 'not-run-default-network-free').length,
    commandRunOptInRequiredRows: rows.filter((row) => row.commandRunStatus === 'blocked-opt-in-required').length,
    commandRunSkippedRows: rows.filter((row) => row.commandRunStatus === 'skipped-missing-checkout').length,
    commandRunBlockedRows: rows.filter((row) => row.commandRunStatus.startsWith('blocked-')).length,
    commandRunExecutedPhases: countPhases(rows, 'executed'),
    commandRunFailedPhases: countPhases(rows, 'failed'),
    commandRunTimedOutPhases: countPhases(rows, 'timed-out'),
    commandRunSkippedPhases: rows.reduce((sum, row) => sum + row.commandRunPhases.filter((phase) => phase.executionStatus.startsWith('skipped-')).length, 0),
    commandRunDefaultOffPhases: rows.reduce((sum, row) => sum + row.commandRunPhases.filter((phase) => phase.defaultExecution === 'not-run-default-network-free').length, 0),
    commandRunOutputTruncatedPhases: rows.reduce((sum, row) => sum + row.commandRunPhases.filter((phase) => phase.stdoutTruncated || phase.stderrTruncated).length, 0)
  };
}

function collectCommandExecutionForRow(row, phases, matrixByManager, checkoutProof, options) {
  const safety = commandExecutionSafety(row, checkoutProof);
  if (safety.status !== 'ready') return createBlockedRow(row, phases, safety.status, safety.reason);

  const packageManager = packageManagerForRow(row);
  if (packageManager.status !== 'ready') return createBlockedRow(row, phases, packageManager.status, packageManager.reason);

  const commandSpecs = commandSpecsForManager(matrixByManager.get(packageManager.manager));
  if (!commandSpecs) return createBlockedRow(row, phases, 'blocked-command-not-allowed', 'real-repo-command-package-manager-unsupported');

  const commandRunPhases = phases.map((phase) => {
    const spec = commandSpecs.get(phase);
    if (!spec) return createPhase(phase, 'blocked-command-not-allowed', 'real-repo-command-phase-not-allowed');
    if (phase === 'dependency-install' && options.allowDependencyInstall !== true) {
      return createPhase(phase, 'blocked-opt-in-required', 'real-repo-command-network-opt-in-missing', spec);
    }
    return runCommandPhase(phase, spec, safety.checkoutPath, options);
  });
  return createRunRow(row, commandRunPhases, true);
}

function commandExecutionSafety(row, checkoutProof) {
  if (row.status === 'skipped-missing-checkout') {
    return { status: 'skipped-missing-checkout', reason: 'real-repo-command-checkout-dir-missing' };
  }
  if (row.status !== 'checked-out') {
    return { status: 'blocked-safety-invariant', reason: 'real-repo-command-proof-globs-missing' };
  }
  if (!checkoutProof.rootPath) {
    return { status: 'blocked-safety-invariant', reason: 'real-repo-command-checkout-root-unconfigured' };
  }
  if (!existsSync(checkoutProof.rootPath)) {
    return { status: 'blocked-safety-invariant', reason: 'real-repo-command-checkout-root-missing' };
  }
  if (!row.checkoutDir) {
    return { status: 'blocked-safety-invariant', reason: 'real-repo-command-checkout-dir-not-declared' };
  }
  const contained = realContainedPath(checkoutProof.rootPath, row.checkoutDir);
  if (contained.reason) return { status: 'blocked-safety-invariant', reason: contained.reason };
  const identity = identitySafety(row);
  if (identity.reason) return identity;
  return { status: 'ready', reason: 'real-repo-command-ready-local-checkout', checkoutPath: contained.path };
}

function identitySafety(row) {
  if (row.gitDirPointerPresent === true) {
    return { status: 'blocked-safety-invariant', reason: 'real-repo-command-gitdir-pointer-unverified' };
  }
  if (row.checkoutIdentityStatus === 'git-identity-matched') return {};
  if (!row.gitMetadataPresent) return { status: 'blocked-identity-mismatch', reason: 'real-repo-command-git-metadata-missing' };
  if (row.gitRemoteOriginMatchesManifest === false) return { status: 'blocked-identity-mismatch', reason: 'real-repo-command-git-remote-mismatch' };
  if (row.gitRefMatchesManifest === false) return { status: 'blocked-identity-mismatch', reason: 'real-repo-command-git-ref-mismatch' };
  return { status: 'blocked-identity-mismatch', reason: 'real-repo-command-git-metadata-missing' };
}

function packageManagerForRow(row) {
  const managers = row.packageManagersPresent ?? [];
  if (!managers.length) return { status: 'blocked-command-not-allowed', reason: 'real-repo-command-lockfile-missing' };
  if (managers.length > 1) return { status: 'blocked-command-not-allowed', reason: 'real-repo-command-package-manager-ambiguous' };
  return { status: 'ready', manager: managers[0] };
}

function commandSpecsForManager(row) {
  if (!row?.manager || !Array.isArray(row.commands)) return null;
  const specs = new Map();
  for (const command of row.commands) {
    const parsed = parseAllowedCommand(command);
    if (!parsed) return null;
    const phase = phaseForCommand(command);
    if (phase && !specs.has(phase)) specs.set(phase, { ...parsed, manager: row.manager });
  }
  return specs;
}

function runCommandPhase(phase, spec, checkoutPath, options) {
  const startedAt = Date.now();
  const result = spawnSync(spec.argv[0], spec.argv.slice(1), {
    cwd: checkoutPath,
    shell: false,
    encoding: 'utf8',
    env: commandEnv(options.env),
    timeout: timeoutMs(options.timeoutMs),
    maxBuffer: Math.max(maxOutputBytes(options.maxOutputBytes) * 16, 1_048_576)
  });
  const durationMs = Date.now() - startedAt;
  const stdout = capOutput(result.stdout ?? '', options.maxOutputBytes);
  const stderr = capOutput(result.stderr ?? '', options.maxOutputBytes);
  const timedOut = result.error?.code === 'ETIMEDOUT';
  const executionStatus = timedOut ? 'timed-out' : result.status === 0 ? 'executed' : 'failed';
  return {
    ...createPhase(phase, executionStatus, reasonForExecutionStatus(executionStatus), spec),
    exitCode: typeof result.status === 'number' ? result.status : null,
    signal: result.signal ?? null,
    durationMs,
    timedOut,
    stdoutBytes: stdout.bytes,
    stderrBytes: stderr.bytes,
    stdoutHash: hashText(result.stdout ?? ''),
    stderrHash: hashText(result.stderr ?? ''),
    stdoutPreview: stdout.preview,
    stderrPreview: stderr.preview,
    stdoutTruncated: stdout.truncated,
    stderrTruncated: stderr.truncated
  };
}

function createDefaultOffRow(row, phases, reason) {
  return createRunRow(row, phases.map((phase) => createPhase(phase, 'blocked-opt-in-required', reason)), false);
}

function createBlockedRow(row, phases, status, reason) {
  return createRunRow(row, phases.map((phase) => createPhase(phase, status, reason)), true);
}

function createRunRow(row, commandRunPhases, enabled) {
  const commandRunStatus = aggregateStatus(commandRunPhases);
  const repositoryPhases = commandRunPhases.filter((phase) => phase.phase === 'build' || phase.phase === 'test');
  const dependencyPhase = commandRunPhases.find((phase) => phase.phase === 'dependency-install');
  return {
    entryId: row.entryId,
    commandRunEnabled: enabled,
    commandRunStatus,
    commandRunExecutionStatus: enabled ? commandRunStatus : 'not-run-default-network-free',
    commandRunReason: aggregateReason(commandRunPhases),
    commandRunPhaseCount: commandRunPhases.length,
    commandRunPhases,
    commandRunExecutedPhases: commandRunPhases.filter((phase) => phase.executionStatus === 'executed').length,
    commandRunFailedPhases: commandRunPhases.filter((phase) => phase.executionStatus === 'failed').length,
    commandRunTimedOutPhases: commandRunPhases.filter((phase) => phase.executionStatus === 'timed-out').length,
    commandRunSkippedPhases: commandRunPhases.filter((phase) => phase.executionStatus.startsWith('skipped-')).length,
    commandRunDefaultOffPhases: commandRunPhases.filter((phase) => phase.defaultExecution === 'not-run-default-network-free').length,
    commandRunOutputTruncatedPhases: commandRunPhases.filter((phase) => phase.stdoutTruncated || phase.stderrTruncated).length,
    dependencyInstallExecution: phaseExecutionForEvidence(dependencyPhase),
    repositoryCommandExecution: repositoryExecutionForEvidence(repositoryPhases)
  };
}

function createPhase(phase, executionStatus, reason, spec = null) {
  return {
    phase,
    executionStatus,
    reason,
    defaultExecution: executionStatus === 'blocked-opt-in-required' ? 'not-run-default-network-free' : 'explicit-opt-in',
    command: spec?.command ?? null,
    argv: spec?.argv ?? [],
    manager: spec?.manager ?? null,
    commandHash: spec ? hashText(JSON.stringify(spec.argv)) : null,
    stdoutBytes: 0,
    stderrBytes: 0,
    stdoutHash: null,
    stderrHash: null,
    stdoutPreview: '',
    stderrPreview: '',
    stdoutTruncated: false,
    stderrTruncated: false
  };
}

function aggregateStatus(phases) {
  if (phases.some((phase) => phase.executionStatus === 'timed-out')) return 'timed-out';
  if (phases.some((phase) => phase.executionStatus === 'failed')) return 'failed';
  if (phases.some((phase) => phase.executionStatus === 'executed')) return 'executed';
  if (phases.some((phase) => phase.executionStatus === 'skipped-missing-checkout')) return 'skipped-missing-checkout';
  if (phases.some((phase) => phase.executionStatus === 'blocked-identity-mismatch')) return 'blocked-identity-mismatch';
  if (phases.some((phase) => phase.executionStatus === 'blocked-command-not-allowed')) return 'blocked-command-not-allowed';
  if (phases.some((phase) => phase.executionStatus === 'blocked-safety-invariant')) return 'blocked-safety-invariant';
  return 'blocked-opt-in-required';
}

function aggregateReason(phases) {
  return phases.find((phase) => phase.executionStatus !== 'executed')?.reason ?? 'real-repo-command-executed';
}

function repositoryExecutionForEvidence(phases) {
  if (phases.some((phase) => phase.executionStatus === 'timed-out')) return 'timed-out';
  if (phases.some((phase) => phase.executionStatus === 'failed')) return 'failed';
  if (phases.some((phase) => phase.executionStatus === 'executed')) return 'executed';
  return 'not-run-default-network-free';
}

function phaseExecutionForEvidence(phase) {
  if (!phase) return 'not-run-default-network-free';
  if (['executed', 'failed', 'timed-out'].includes(phase.executionStatus)) return phase.executionStatus;
  return 'not-run-default-network-free';
}

function parseAllowedCommand(command) {
  if (typeof command !== 'string' || shellMetacharacters.test(command)) return null;
  const argv = command.trim().split(/\s+/).filter(Boolean);
  if (!argv.length || !['npm', 'pnpm', 'yarn'].includes(argv[0])) return null;
  return { command, argv };
}

function phaseForCommand(command) {
  if (/\b(ci|install)\b/.test(command)) return 'dependency-install';
  if (/\bbuild\b/.test(command)) return 'build';
  if (/\btest\b/.test(command)) return 'test';
  return null;
}

function realContainedPath(rootPath, checkoutDir) {
  let rootRealPath;
  try {
    rootRealPath = realpathSync(rootPath);
  } catch {
    return { reason: 'real-repo-command-checkout-root-missing' };
  }
  const checkoutPath = resolve(rootRealPath, checkoutDir);
  const lexicalRelative = relative(rootRealPath, checkoutPath);
  if (lexicalRelative.startsWith('..') || isAbsolute(lexicalRelative)) return { reason: 'real-repo-command-checkout-dir-outside-root' };
  try {
    const stat = statSync(checkoutPath);
    if (!stat.isDirectory()) return { reason: 'real-repo-command-checkout-dir-missing' };
    const checkoutRealPath = realpathSync(checkoutPath);
    const realRelative = relative(rootRealPath, checkoutRealPath);
    if (realRelative.startsWith('..') || isAbsolute(realRelative)) return { reason: 'real-repo-command-checkout-realpath-escape' };
    return { path: checkoutRealPath };
  } catch {
    return { reason: 'real-repo-command-checkout-dir-missing' };
  }
}

function commandEnv(extra = {}) {
  const env = {};
  for (const key of safeEnvKeys) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (safeEnvKeys.has(key) || /^npm_config_[a-z0-9_]+$/i.test(key)) env[key] = String(value);
  }
  env.CI = 'true';
  env.NO_COLOR = '1';
  env.npm_config_audit = 'false';
  env.npm_config_fund = 'false';
  env.npm_config_update_notifier = 'false';
  return env;
}

function capOutput(value, maxBytesOption) {
  const text = String(value ?? '');
  const bytes = Buffer.byteLength(text);
  const maxBytes = maxOutputBytes(maxBytesOption);
  if (bytes <= maxBytes) return { bytes, preview: text, truncated: false };
  return { bytes, preview: Buffer.from(text).subarray(0, maxBytes).toString('utf8'), truncated: true };
}

function normalizePhases(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return defaultPhases;
  return phases.filter((phase) => defaultPhases.includes(phase));
}

function timeoutMs(value) {
  return Number.isInteger(value) && value > 0 ? value : defaultTimeoutMs;
}

function maxOutputBytes(value) {
  return Number.isInteger(value) && value > 0 ? value : defaultMaxOutputBytes;
}

function countPhases(rows, status) {
  return rows.reduce((sum, row) => sum + row.commandRunPhases.filter((phase) => phase.executionStatus === status).length, 0);
}

function reasonForExecutionStatus(status) {
  if (status === 'failed') return 'real-repo-command-exit-nonzero';
  if (status === 'timed-out') return 'real-repo-command-timeout';
  return 'real-repo-command-executed';
}

function hashText(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export { collectRealRepoCommandExecution };
