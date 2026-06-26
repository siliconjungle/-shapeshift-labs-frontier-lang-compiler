function createCheckoutEvidenceRows(manifest, checkoutProof, commandExecution = null) {
  const proof = manifest.localBehavior?.checkoutProof ?? {};
  const dependencyInstallExecution = proof.dependencyInstallExecution ?? 'not-run-default-network-free';
  const repositoryCommandExecution = proof.repositoryCommandExecution ?? 'not-run-default-network-free';
  const repositoryCommandProofStatus = proof.repositoryCommandProofStatus ?? repositoryCommandExecution;
  const commandRowsByEntry = new Map((commandExecution?.rows ?? []).map((row) => [row.entryId, row]));
  return checkoutProof.rows.map((row) => {
    const checkoutProofExecution = row.checkoutProofExecution ?? (row.status === 'skipped-missing-checkout' ? 'skipped' : 'executed');
    const commandDryRunPhases = createCommandDryRunPhases(row, checkoutProofExecution, proof);
    const commandRun = commandRowsByEntry.get(row.entryId) ?? createDefaultCommandRunRow(row, commandDryRunPhases);
    const commandDryRunSkippedPhases = commandDryRunPhases.filter((phase) => phase.readinessStatus === 'skipped-missing-checkout').length;
    const commandDryRunReadyPhases = commandDryRunPhases.filter((phase) => phase.readinessStatus === 'ready-local-checkout').length;
    const commandDryRunOptInRequiredPhases = commandDryRunPhases.filter((phase) => phase.executionStatus === 'opt-in-required').length;
    const commandDryRunExecutedPhases = commandDryRunPhases.filter((phase) => phase.executionStatus === 'executed').length;
    const commandDryRunDefaultOffPhases = commandDryRunPhases.filter((phase) => phase.defaultExecution === 'not-run-default-network-free').length;
    const commandDryRunStatus = checkoutProofExecution === 'skipped' ? 'skipped-missing-checkout' : 'ready-local-checkout';
    const commandDryRunExecutionStatus = checkoutProofExecution === 'skipped' ? 'skipped-missing-checkout' : 'opt-in-required';
    return {
      entryId: row.entryId,
      checkoutDir: row.checkoutDir,
      manifestMetadataStatus: manifest.mode ?? 'unknown',
      checkoutProofStatus: row.status,
      checkoutProofExecution,
      checkoutRootMode: checkoutProof.rootMode,
      checkoutRootEnv: proof.rootEnv ?? 'FRONTIER_REAL_REPO_CORPUS_ROOT',
      checkoutRootPresent: checkoutProof.rootPresent,
      checkoutDirPresent: row.checkoutDirPresent ?? checkoutProofExecution === 'executed',
      checkoutPresenceStatus: row.checkoutPresenceStatus ?? (checkoutProofExecution === 'skipped' ? 'checkout-dir-missing' : 'checkout-dir-present'),
      checkoutProofReason: row.checkoutProofReason ?? row.status,
      checkoutIdentityStatus: row.checkoutIdentityStatus ?? (checkoutProofExecution === 'skipped' ? 'skipped-missing-checkout' : 'git-metadata-missing'),
      checkoutIdentityExecution: row.checkoutIdentityExecution ?? checkoutProofExecution,
      gitMetadataPresent: row.gitMetadataPresent ?? false,
      gitMetadataKind: row.gitMetadataKind ?? (checkoutProofExecution === 'skipped' ? 'not-scanned' : 'missing'),
      gitDirPointerPresent: row.gitDirPointerPresent ?? false,
      gitHeadPresent: row.gitHeadPresent ?? false,
      gitConfigPresent: row.gitConfigPresent ?? false,
      gitRemoteOriginUrlPresent: row.gitRemoteOriginUrlPresent ?? false,
      gitRemoteOriginMatchesManifest: row.gitRemoteOriginMatchesManifest ?? null,
      gitRefMatchesManifest: row.gitRefMatchesManifest ?? null,
      dependencyInstallProofStatus: dependencyInstallProofStatus(row, checkoutProofExecution),
      dependencyInstallExecution: commandRun.dependencyInstallExecution ?? dependencyInstallExecution,
      dependencyInstallDefaultOffReason: proof.dependencyInstallDefaultOffReason ?? 'dependency installs require an explicit opt-in after a local checkout is supplied',
      dependencyInstallOptInRequired: (commandRun.dependencyInstallExecution ?? dependencyInstallExecution) !== 'executed',
      repositoryCommandProofStatus: commandRun.repositoryCommandExecution ?? repositoryCommandProofStatus,
      repositoryCommandExecution: commandRun.repositoryCommandExecution ?? repositoryCommandExecution,
      repositoryCommandDefaultOffReason: proof.repositoryCommandDefaultOffReason ?? 'repository build/test commands require explicit opt-in after dependency metadata is reviewed',
      repositoryCommandOptInRequired: (commandRun.repositoryCommandExecution ?? repositoryCommandExecution) !== 'executed',
      commandDryRunStatus,
      commandDryRunExecutionStatus,
      commandDryRunPhaseCount: commandDryRunPhases.length,
      commandDryRunPhases,
      commandDryRunSkippedPhases,
      commandDryRunReadyPhases,
      commandDryRunOptInRequiredPhases,
      commandDryRunExecutedPhases,
      commandDryRunDefaultOffPhases,
      commandRunStatus: commandRun.commandRunStatus,
      commandRunExecutionStatus: commandRun.commandRunExecutionStatus,
      commandRunReason: commandRun.commandRunReason,
      commandRunEnabled: commandRun.commandRunEnabled,
      commandRunPhaseCount: commandRun.commandRunPhaseCount,
      commandRunPhases: commandRun.commandRunPhases,
      commandRunExecutedPhases: commandRun.commandRunExecutedPhases,
      commandRunFailedPhases: commandRun.commandRunFailedPhases,
      commandRunTimedOutPhases: commandRun.commandRunTimedOutPhases,
      commandRunSkippedPhases: commandRun.commandRunSkippedPhases,
      commandRunDefaultOffPhases: commandRun.commandRunDefaultOffPhases,
      commandRunOutputTruncatedPhases: commandRun.commandRunOutputTruncatedPhases,
      networkAccess: proof.networkRequired === true ? 'required' : 'none',
      sourceTextRead: proof.readsSourceText === true,
      installCommandsRun: commandRun.dependencyInstallExecution === 'executed',
      packageManagerLockFilesPresent: row.packageManagerLockFilesPresent ?? 0,
      packageManagerLockFiles: row.packageManagerLockFiles ?? [],
      packageManagersPresent: row.packageManagersPresent ?? [],
      packageManagerCommandMatrixStatus: row.packageManagerCommandMatrixStatus ?? 'metadata-only',
      packageManagerCommandMatrixCommands: row.packageManagerCommandMatrixCommands ?? 0,
      packageManagerInstallCommands: row.packageManagerInstallCommands ?? 0,
      packageManagerBuildCommands: row.packageManagerBuildCommands ?? 0,
      packageManagerTestCommands: row.packageManagerTestCommands ?? 0,
      plannedSampleFiles: row.plannedSampleFiles,
      proofGlobs: row.proofGlobs,
      matchedFiles: row.matchedFiles,
      maxObservedBytesPerFile: row.maxObservedBytesPerFile
    };
  });
}

function createDefaultCommandRunRow(row, phases) {
  const commandRunPhases = phases.map((phase) => ({
    phase: phase.phase,
    executionStatus: 'blocked-opt-in-required',
    reason: 'real-repo-command-opt-in-missing',
    defaultExecution: 'not-run-default-network-free',
    command: null,
    argv: [],
    manager: null,
    commandHash: null,
    stdoutBytes: 0,
    stderrBytes: 0,
    stdoutHash: null,
    stderrHash: null,
    stdoutPreview: '',
    stderrPreview: '',
    stdoutTruncated: false,
    stderrTruncated: false
  }));
  return {
    entryId: row.entryId,
    commandRunEnabled: false,
    commandRunStatus: 'blocked-opt-in-required',
    commandRunExecutionStatus: 'not-run-default-network-free',
    commandRunReason: 'real-repo-command-opt-in-missing',
    commandRunPhaseCount: commandRunPhases.length,
    commandRunPhases,
    commandRunExecutedPhases: 0,
    commandRunFailedPhases: 0,
    commandRunTimedOutPhases: 0,
    commandRunSkippedPhases: 0,
    commandRunDefaultOffPhases: commandRunPhases.length,
    commandRunOutputTruncatedPhases: 0,
    dependencyInstallExecution: 'not-run-default-network-free',
    repositoryCommandExecution: 'not-run-default-network-free'
  };
}

function createCommandDryRunPhases(row, checkoutProofExecution, proof) {
  const dryRun = proof.commandDryRun ?? {};
  const phases = dryRun.phases ?? ['dependency-install', 'build', 'test'];
  const readinessStatus = checkoutProofExecution === 'skipped' ? 'skipped-missing-checkout' : 'ready-local-checkout';
  const executionStatus = checkoutProofExecution === 'skipped' ? 'skipped-missing-checkout' : 'opt-in-required';
  return phases.map((phase) => ({
    phase,
    readinessStatus,
    executionStatus,
    defaultExecution: dryRun.defaultExecution ?? 'not-run-default-network-free',
    optInRequired: executionStatus === 'opt-in-required',
    commandKinds: commandKindsForDryRunPhase(phase),
    commandCount: commandCountForDryRunPhase(row, phase),
    networkAccess: dryRun.networkRequired === true ? 'required' : 'none',
    sourceTextRead: dryRun.readsSourceText === true
  }));
}

function commandKindsForDryRunPhase(phase) {
  if (phase === 'dependency-install') return ['install'];
  if (phase === 'build') return ['build'];
  if (phase === 'test') return ['test'];
  return [phase];
}

function commandCountForDryRunPhase(row, phase) {
  if (phase === 'dependency-install') return row.packageManagerInstallCommands ?? 0;
  if (phase === 'build') return row.packageManagerBuildCommands ?? 0;
  if (phase === 'test') return row.packageManagerTestCommands ?? 0;
  return 0;
}

function dependencyInstallProofStatus(row, execution) {
  if (execution === 'skipped') return 'skipped-missing-checkout';
  return (row.packageManagerLockFilesPresent ?? 0) > 0
    ? 'lockfile-metadata-present'
    : 'lockfile-metadata-missing';
}

export { createCheckoutEvidenceRows };
