import { createHash } from 'node:crypto';

function createUpstreamProofArtifact(input) {
  const { manifest, rootEnv, rootPath, selectedEntryIds, checkoutPreparation, metrics, options } = input;
  const selected = new Set(selectedEntryIds);
  const selectedCheckoutRows = (metrics.realRepoCorpusCheckoutEvidenceRows ?? [])
    .filter((row) => selected.has(row.entryId))
    .map(compactCheckoutRow);
  const selectedLiveProjectRows = (metrics.realRepoCorpusLiveProjectProofRowsByEntry ?? [])
    .filter((row) => selected.has(row.entryId))
    .map(compactLiveProjectRow);
  const selectedSourceCacheRows = (metrics.realRepoCorpusSourceCachePolicyRowsByEntry ?? [])
    .filter((row) => selected.has(row.entryId))
    .map(compactSourceCacheRow);
  return {
    kind: 'frontier.lang.realRepoUpstreamCorpusProof',
    version: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    manifestSchema: manifest.schema ?? null,
    rootEnv,
    rootPathHash: hashText(rootPath),
    selectedEntryIds,
    cloneEnabled: options.clone === true,
    liveProjectEnabled: options.liveProject === true,
    commandExecutionEnabled: options.commands === true,
    dependencyInstallEnabled: options.allowDependencyInstall === true,
    sourceTextIncluded: false,
    checkoutPreparation,
    summary: compactSummary(metrics, selectedEntryIds),
    selectedCheckoutRows,
    selectedLiveProjectRows,
    selectedSourceCacheRows,
    artifactHash: hashJson({
      selectedEntryIds,
      checkoutPreparation,
      selectedCheckoutRows,
      selectedLiveProjectRows,
      selectedSourceCacheRows
    })
  };
}

function compactSummary(metrics, selectedEntryIds) {
  return {
    corpusEntries: metrics.realRepoCorpusEntries,
    selectedEntries: selectedEntryIds.length,
    checkoutCheckedOut: metrics.realRepoCorpusCheckoutCheckedOut,
    checkoutIdentityMatched: metrics.realRepoCorpusCheckoutIdentityMatched,
    licenseProofPassedRows: metrics.realRepoCorpusLicenseProofPassedRows,
    sourceCacheAdmissibleRows: metrics.realRepoCorpusSourceCachePolicyAdmissibleRows,
    sourceCacheSourceTextIncludedRows: metrics.realRepoCorpusSourceCachePolicySourceTextIncludedRows,
    liveProjectPassedRows: metrics.realRepoCorpusLiveProjectProofPassedRows,
    liveProjectDiagnosticsPassedRows: metrics.realRepoCorpusLiveProjectProofDiagnosticsPassedRows,
    liveProjectDeclarationPassedRows: metrics.realRepoCorpusLiveProjectProofDeclarationPassedRows,
    liveProjectSourceTextReadRows: metrics.realRepoCorpusLiveProjectProofSourceTextReadRows,
    commandRunExecutedPhases: metrics.realRepoCorpusCommandRunExecutedPhases,
    commandRunFailedPhases: metrics.realRepoCorpusCommandRunFailedPhases,
    commandRunTimedOutPhases: metrics.realRepoCorpusCommandRunTimedOutPhases,
    dependencyInstallsRun: metrics.realRepoCorpusDependencyInstallsRun,
    repositoryCommandsRun: metrics.realRepoCorpusRepositoryCommandsRun
  };
}

function compactCheckoutRow(row) {
  return {
    entryId: row.entryId,
    checkoutProofStatus: row.checkoutProofStatus,
    checkoutIdentityStatus: row.checkoutIdentityStatus,
    gitMetadataKind: row.gitMetadataKind,
    gitRemoteOriginMatchesManifest: row.gitRemoteOriginMatchesManifest,
    gitRefMatchesManifest: row.gitRefMatchesManifest,
    licenseExpectedId: row.licenseExpectedId,
    licenseProofStatus: row.licenseProofStatus,
    licenseFileHash: row.licenseFileHash,
    sourceCachePolicyStatus: row.sourceCachePolicyStatus,
    packageManagersPresent: row.packageManagersPresent,
    packageManagerLockFiles: row.packageManagerLockFiles,
    matchedFiles: row.matchedFiles,
    maxObservedBytesPerFile: row.maxObservedBytesPerFile,
    dependencyInstallExecution: row.dependencyInstallExecution,
    repositoryCommandExecution: row.repositoryCommandExecution,
    commandRunStatus: row.commandRunStatus,
    commandRunReason: row.commandRunReason,
    commandRunPhases: (row.commandRunPhases ?? []).map(compactCommandPhase)
  };
}

function compactCommandPhase(phase) {
  return {
    phase: phase.phase,
    executionStatus: phase.executionStatus,
    reason: phase.reason,
    manager: phase.manager,
    argv: phase.argv,
    commandHash: phase.commandHash,
    exitCode: phase.exitCode ?? null,
    signal: phase.signal ?? null,
    durationMs: phase.durationMs ?? 0,
    stdoutBytes: phase.stdoutBytes,
    stderrBytes: phase.stderrBytes,
    stdoutHash: phase.stdoutHash,
    stderrHash: phase.stderrHash,
    stdoutTruncated: phase.stdoutTruncated,
    stderrTruncated: phase.stderrTruncated
  };
}

function compactLiveProjectRow(row) {
  return {
    entryId: row.entryId,
    liveProjectProofStatus: row.liveProjectProofStatus,
    liveProjectProofReason: row.liveProjectProofReason,
    liveProjectSourceTextRead: row.liveProjectSourceTextRead,
    liveProjectSourceFilesRead: row.liveProjectSourceFilesRead,
    liveProjectSourceBytesRead: row.liveProjectSourceBytesRead,
    liveProjectSourceSetHash: row.liveProjectSourceSetHash,
    liveProjectSourceFiles: row.liveProjectSourceFiles,
    liveProjectDiagnosticsStatus: row.liveProjectDiagnosticsStatus,
    liveProjectDiagnosticsErrors: row.liveProjectDiagnosticsErrors,
    liveProjectDiagnosticsGateHash: row.liveProjectDiagnosticsGateHash,
    liveProjectDeclarationStatus: row.liveProjectDeclarationStatus,
    liveProjectDeclarationFiles: row.liveProjectDeclarationFiles,
    liveProjectDeclarationBytes: row.liveProjectDeclarationBytes,
    liveProjectDeclarationGateHash: row.liveProjectDeclarationGateHash
  };
}

function compactSourceCacheRow(row) {
  return {
    entryId: row.entryId,
    retentionAdmissionStatus: row.retentionAdmissionStatus,
    retentionStatus: row.retentionStatus,
    retentionReason: row.retentionReason,
    retainedSourceLocationKind: row.retainedSourceLocationKind,
    retainedSourceRootEnv: row.retainedSourceRootEnv,
    retainedSourceCheckoutDir: row.retainedSourceCheckoutDir,
    sourceTextIncluded: row.sourceTextIncluded,
    sourceTextPublishable: row.sourceTextPublishable,
    publishDecision: row.publishDecision,
    licenseFileHash: row.licenseFileHash,
    liveProjectSourceSetHash: row.liveProjectSourceSetHash,
    evidenceHash: row.evidenceHash
  };
}

function hashJson(value) {
  return hashText(JSON.stringify(value));
}

function hashText(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export { createUpstreamProofArtifact };
