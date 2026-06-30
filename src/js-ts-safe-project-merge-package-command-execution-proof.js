import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText } from './js-ts-safe-project-merge-core.js';

const DependencyInstallExecutionModes = new Set(['not-run-default-network-free', 'metadata-only', 'lockfile-only', 'frozen', 'explicitly-run']);

function scriptCommandBinding(parsed, script, outputCommand) {
  return {
    script,
    baseCommandHash: hashOptionalScript(parsed.base.scripts?.[script]),
    workerCommandHash: hashOptionalScript(parsed.worker.scripts?.[script]),
    headCommandHash: hashOptionalScript(parsed.head.scripts?.[script]),
    outputCommandHash: hashOptionalScript(outputCommand)
  };
}

function packageCommandExecutionPhase(script) {
  return /test$/i.test(script) ? 'test' : 'build';
}

function proofHasPackageCommandExecutionCapsule(proof, options) {
  const capsule = commandExecutionCapsule(proof);
  if (!capsule) return false;
  if (!['package-manager-command-execution-proof', 'frontier.package-manager-command-execution-proof', 'frontier.lang.packageManagerCommandExecutionProof'].includes(firstString(capsule.proofLevel, capsule.kind, proof.proofLevel, proof.kind))) return false;
  if (firstString(capsule.executionPhase, proof.executionPhase) !== options.executionPhase) return false;
  if (!changedScriptMatches(capsule, proof, options.script, options.scriptBinding)) return false;
  if (!firstString(capsule.packageManagerName, proof.packageManagerName) || !firstString(capsule.packageManagerVersion, proof.packageManagerVersion)) return false;
  if (!firstString(capsule.packageManagerFieldValue, proof.packageManagerFieldValue) && firstString(capsule.packageManagerSource, proof.packageManagerSource) !== 'inferred') return false;
  if (!Array.isArray(capsule.commandArgv ?? proof.commandArgv) || !(capsule.commandArgv ?? proof.commandArgv).length || (capsule.shell ?? proof.shell) !== false) return false;
  if (!firstString(capsule.cwd, proof.cwd) || !firstString(capsule.commandAllowlistId, proof.commandAllowlistId)) return false;
  if (typeof (capsule.exitCode ?? proof.exitCode) !== 'number' || typeof (capsule.durationMs ?? proof.durationMs) !== 'number' || typeof (capsule.timeoutMs ?? proof.timeoutMs) !== 'number') return false;
  if (!Object.hasOwn(capsule, 'signal') && !Object.hasOwn(proof, 'signal')) return false;
  if (!firstString(capsule.stdoutHash, proof.stdoutHash) || !firstString(capsule.stderrHash, proof.stderrHash)) return false;
  if (typeof (capsule.stdoutBytes ?? proof.stdoutBytes) !== 'number' || typeof (capsule.stderrBytes ?? proof.stderrBytes) !== 'number') return false;
  if (typeof (capsule.stdoutTruncated ?? proof.stdoutTruncated) !== 'boolean' || typeof (capsule.stderrTruncated ?? proof.stderrTruncated) !== 'boolean') return false;
  if (!DependencyInstallExecutionModes.has(firstString(capsule.dependencyInstallExecution, proof.dependencyInstallExecution))) return false;
  return Boolean(firstString(capsule.networkPolicy, proof.networkPolicy) && firstString(capsule.envAllowlistHash, proof.envAllowlistHash));
}

function packageManagerCommandExecutionRecord(proof) {
  const capsule = commandExecutionCapsule(proof);
  if (!capsule) return {};
  return compactRecord({
    packageManagerCommandExecutionProof: true,
    executionPhase: firstString(capsule.executionPhase, proof.executionPhase),
    changedScripts: capsule.changedScripts ?? proof.changedScripts,
    packageManagerName: firstString(capsule.packageManagerName, proof.packageManagerName),
    packageManagerVersion: firstString(capsule.packageManagerVersion, proof.packageManagerVersion),
    packageManagerFieldValue: firstString(capsule.packageManagerFieldValue, proof.packageManagerFieldValue),
    packageManagerSource: firstString(capsule.packageManagerSource, proof.packageManagerSource),
    commandArgv: capsule.commandArgv ?? proof.commandArgv,
    shell: capsule.shell ?? proof.shell,
    cwd: firstString(capsule.cwd, proof.cwd),
    commandAllowlistId: firstString(capsule.commandAllowlistId, proof.commandAllowlistId),
    exitCode: capsule.exitCode ?? proof.exitCode,
    signal: capsule.signal ?? proof.signal,
    durationMs: capsule.durationMs ?? proof.durationMs,
    timeoutMs: capsule.timeoutMs ?? proof.timeoutMs,
    stdoutHash: firstString(capsule.stdoutHash, proof.stdoutHash),
    stderrHash: firstString(capsule.stderrHash, proof.stderrHash),
    stdoutBytes: capsule.stdoutBytes ?? proof.stdoutBytes,
    stderrBytes: capsule.stderrBytes ?? proof.stderrBytes,
    stdoutTruncated: capsule.stdoutTruncated ?? proof.stdoutTruncated,
    stderrTruncated: capsule.stderrTruncated ?? proof.stderrTruncated,
    dependencyInstallExecution: firstString(capsule.dependencyInstallExecution, proof.dependencyInstallExecution),
    networkPolicy: firstString(capsule.networkPolicy, proof.networkPolicy),
    envAllowlistHash: firstString(capsule.envAllowlistHash, proof.envAllowlistHash),
    commandExecutionEvidenceHash: firstString(capsule.commandExecutionEvidenceHash, proof.commandExecutionEvidenceHash)
  });
}

function commandExecutionCapsule(proof) {
  return proof.packageManagerCommandExecutionProof ?? proof.packageManagerCommandExecution ?? proof.commandExecutionProof ?? proof;
}

function changedScriptMatches(capsule, proof, script, binding) {
  const changedScripts = asArray(capsule.changedScripts ?? proof.changedScripts);
  const record = changedScripts.find((entry) => (typeof entry === 'string' ? entry : firstString(entry?.script, entry?.name)) === script);
  if (!record) return false;
  if (typeof record === 'string') return true;
  return ['base', 'worker', 'head', 'output'].every((role) => {
    const expected = binding?.[`${role}CommandHash`];
    return expected === undefined || firstString(record[`${role}CommandHash`], record[`${role}ScriptHash`], record[`${role}Hash`]) === expected;
  });
}

function hashOptionalScript(command) {
  return typeof command === 'string' ? hashText(command) : undefined;
}

function firstString(...values) {
  for (const value of values) if (typeof value === 'string' && value.length) return value;
  return undefined;
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

export { packageCommandExecutionPhase, packageManagerCommandExecutionRecord, proofHasPackageCommandExecutionCapsule, scriptCommandBinding };
