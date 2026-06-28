import {
  createJsTsProjectMergeDeclarationGate,
  createJsTsProjectMergeDiagnosticsGate
} from '../dist/index.js';
import {
  collectBoundedSourceFiles,
  compilerOptionsForProof,
  declarationCompilerOptionsForProof,
  defaultMaxBytesPerFile,
  defaultMaxFiles,
  realContainedPath
} from './real-repo-corpus-live-project-files.mjs';

const defaultPhases = ['diagnostics', 'declaration-output'];
function collectRealRepoLiveProjectProofs(manifest, checkoutProof, options = {}) {
  const phases = normalizePhases(options.phases);
  const enabled = options.enabled === true;
  const selectedEntryIds = Array.isArray(options.entryIds) ? new Set(options.entryIds) : null;
  const entriesById = new Map((manifest.entries ?? []).map((entry) => [entry.id, entry]));
  const rows = (checkoutProof.rows ?? []).map((row) => {
    if (!enabled || (selectedEntryIds && !selectedEntryIds.has(row.entryId))) {
      return createDefaultOffRow(row, phases, 'real-repo-live-project-opt-in-missing');
    }
    return collectLiveProjectProofForRow(entriesById.get(row.entryId), row, phases, checkoutProof, options);
  });
  return {
    enabled,
    rows,
    liveProjectProofRows: rows.length,
    liveProjectProofEnabledRows: rows.filter((row) => row.liveProjectProofEnabled).length,
    liveProjectProofDefaultOffRows: rows.filter((row) => row.liveProjectProofExecutionStatus === 'not-run-default-source-free').length,
    liveProjectProofSkippedRows: rows.filter((row) => row.liveProjectProofStatus === 'skipped-missing-checkout').length,
    liveProjectProofBlockedRows: rows.filter((row) => row.liveProjectProofStatus.startsWith('blocked-')).length,
    liveProjectProofPassedRows: rows.filter((row) => row.liveProjectProofStatus === 'passed').length,
    liveProjectProofFailedRows: rows.filter((row) => row.liveProjectProofStatus === 'failed').length,
    liveProjectProofSourceTextReadRows: rows.filter((row) => row.liveProjectSourceTextRead).length,
    liveProjectProofSourceFilesRead: rows.reduce((sum, row) => sum + row.liveProjectSourceFilesRead, 0),
    liveProjectProofSourceBytesRead: rows.reduce((sum, row) => sum + row.liveProjectSourceBytesRead, 0),
    liveProjectProofDiagnosticsPassedRows: rows.filter((row) => row.liveProjectDiagnosticsStatus === 'passed').length,
    liveProjectProofDeclarationPassedRows: rows.filter((row) => row.liveProjectDeclarationStatus === 'passed').length,
    liveProjectProofDiagnosticsErrors: rows.reduce((sum, row) => sum + row.liveProjectDiagnosticsErrors, 0),
    liveProjectProofDeclarationFiles: rows.reduce((sum, row) => sum + row.liveProjectDeclarationFiles, 0)
  };
}

function realRepoCorpusLiveProjectProofMetrics(liveProjectProof) {
  return {
    realRepoCorpusLiveProjectProofRows: liveProjectProof.liveProjectProofRows,
    realRepoCorpusLiveProjectProofEnabledRows: liveProjectProof.liveProjectProofEnabledRows,
    realRepoCorpusLiveProjectProofDefaultOffRows: liveProjectProof.liveProjectProofDefaultOffRows,
    realRepoCorpusLiveProjectProofSkippedRows: liveProjectProof.liveProjectProofSkippedRows,
    realRepoCorpusLiveProjectProofBlockedRows: liveProjectProof.liveProjectProofBlockedRows,
    realRepoCorpusLiveProjectProofPassedRows: liveProjectProof.liveProjectProofPassedRows,
    realRepoCorpusLiveProjectProofFailedRows: liveProjectProof.liveProjectProofFailedRows,
    realRepoCorpusLiveProjectProofSourceTextReadRows: liveProjectProof.liveProjectProofSourceTextReadRows,
    realRepoCorpusLiveProjectProofSourceFilesRead: liveProjectProof.liveProjectProofSourceFilesRead,
    realRepoCorpusLiveProjectProofSourceBytesRead: liveProjectProof.liveProjectProofSourceBytesRead,
    realRepoCorpusLiveProjectProofDiagnosticsPassedRows: liveProjectProof.liveProjectProofDiagnosticsPassedRows,
    realRepoCorpusLiveProjectProofDeclarationPassedRows: liveProjectProof.liveProjectProofDeclarationPassedRows,
    realRepoCorpusLiveProjectProofDiagnosticsErrors: liveProjectProof.liveProjectProofDiagnosticsErrors,
    realRepoCorpusLiveProjectProofDeclarationFiles: liveProjectProof.liveProjectProofDeclarationFiles,
    realRepoCorpusLiveProjectProofRowsByEntry: liveProjectProof.rows
  };
}

function assertDefaultRealRepoLiveProjectProofMetrics(metrics, entries, assert) {
  assert.equal(metrics.realRepoCorpusLiveProjectProofRows, entries.length, 'default real-repo live-project proof row count');
  assert.equal(metrics.realRepoCorpusLiveProjectProofEnabledRows, 0, 'default real-repo live-project proof disabled rows');
  assert.equal(metrics.realRepoCorpusLiveProjectProofDefaultOffRows, entries.length, 'default real-repo live-project proof default-off rows');
  assert.equal(metrics.realRepoCorpusLiveProjectProofSourceTextReadRows, 0, 'default real-repo live-project proof must not read source text');
  assert.equal(metrics.realRepoCorpusLiveProjectProofSourceFilesRead, 0, 'default real-repo live-project proof source files');
  assert.equal(metrics.realRepoCorpusLiveProjectProofPassedRows, 0, 'default real-repo live-project proof passed rows');
}

function collectLiveProjectProofForRow(entry, row, phases, checkoutProof, options) {
  const safety = liveProjectSafety(row, checkoutProof);
  if (safety.status !== 'ready') return createBlockedRow(row, phases, safety.status, safety.reason, true);
  if (!entry) return createBlockedRow(row, phases, 'blocked-safety-invariant', 'real-repo-live-project-entry-missing', true);
  const ts = options.typescript ?? options.ts ?? options.typescriptModule;
  if (!ts?.createProgram || !ts?.createSourceFile) {
    return createBlockedRow(row, phases, 'blocked-compiler-unavailable', 'real-repo-live-project-typescript-compiler-missing', true);
  }

  const sourceFiles = collectBoundedSourceFiles(safety.checkoutPath, entry.pathGlobs ?? [], options);
  if (!sourceFiles.files.length) return createBlockedRow(row, phases, sourceFiles.status, sourceFiles.reason, true, sourceFiles.summary);

  const gateInput = {
    typescript: ts,
    projectRoot: safety.checkoutPath,
    requireOutputDiagnostics: true,
    requireDeclarationOutput: true,
    includeDeclarationOutput: true,
    compilerOptions: compilerOptionsForProof(ts, options),
    declarationCompilerOptions: declarationCompilerOptionsForProof(ts, options),
    diagnosticOptions: {
      options: true,
      syntactic: true,
      semantic: true,
      ...(options.diagnosticOptions ?? {})
    }
  };
  const id = `real_repo_live_project_${row.entryId.replace(/[^a-z0-9_]+/gi, '_')}`;
  const diagnosticsGate = phases.includes('diagnostics')
    ? createJsTsProjectMergeDiagnosticsGate(gateInput, sourceFiles.files, id)
    : undefined;
  const declarationGate = phases.includes('declaration-output')
    ? createJsTsProjectMergeDeclarationGate(gateInput, sourceFiles.files, id)
    : undefined;
  const phaseRows = phases.map((phase) => {
    if (phase === 'diagnostics') return gatePhase(phase, diagnosticsGate, 'real-repo-live-project-diagnostics-not-requested');
    if (phase === 'declaration-output') return gatePhase(phase, declarationGate, 'real-repo-live-project-declaration-not-requested');
    return createPhase(phase, 'blocked-safety-invariant', 'real-repo-live-project-phase-unsupported');
  });
  return createRunRow(row, phaseRows, true, sourceFiles.summary, diagnosticsGate, declarationGate);
}

function liveProjectSafety(row, checkoutProof) {
  if (row.status === 'skipped-missing-checkout') {
    return { status: 'skipped-missing-checkout', reason: 'real-repo-live-project-checkout-dir-missing' };
  }
  if (row.status !== 'checked-out') {
    return { status: 'blocked-safety-invariant', reason: 'real-repo-live-project-proof-globs-missing' };
  }
  if (!checkoutProof.rootPath) return { status: 'blocked-safety-invariant', reason: 'real-repo-live-project-checkout-root-unconfigured' };
  if (!row.checkoutDir) return { status: 'blocked-safety-invariant', reason: 'real-repo-live-project-checkout-dir-not-declared' };
  if (row.gitDirPointerPresent === true) return { status: 'blocked-safety-invariant', reason: 'real-repo-live-project-gitdir-pointer-unverified' };
  if (row.checkoutIdentityStatus !== 'git-identity-matched') {
    return { status: 'blocked-identity-mismatch', reason: 'real-repo-live-project-git-identity-mismatch' };
  }
  const contained = realContainedPath(checkoutProof.rootPath, row.checkoutDir);
  if (contained.reason) return { status: 'blocked-safety-invariant', reason: contained.reason };
  return { status: 'ready', reason: 'real-repo-live-project-ready-local-checkout', checkoutPath: contained.path };
}

function gatePhase(phase, gate, missingReason) {
  if (!gate) return createPhase(phase, 'blocked-safety-invariant', missingReason);
  return createPhase(
    phase,
    gate.status === 'passed' ? 'passed' : 'failed',
    gate.status === 'passed' ? `real-repo-live-project-${phase}-passed` : `real-repo-live-project-${phase}-failed`,
    {
      gateId: gate.id,
      gateHash: gate.hash,
      conflicts: gate.conflicts?.length ?? 0,
      diagnostics: gate.summary?.diagnostics ?? 0,
      errors: gate.summary?.errors ?? 0,
      declarationFiles: gate.summary?.declarationFiles ?? 0,
      declarationBytes: gate.summary?.declarationBytes ?? 0
    }
  );
}

function createDefaultOffRow(row, phases, reason) {
  return createRunRow(row, phases.map((phase) => createPhase(phase, 'blocked-opt-in-required', reason)), false);
}

function createBlockedRow(row, phases, status, reason, enabled, sourceSummary = {}) {
  return createRunRow(row, phases.map((phase) => createPhase(phase, status, reason)), enabled, sourceSummary);
}

function createRunRow(row, liveProjectPhases, enabled, sourceSummary = {}, diagnosticsGate = undefined, declarationGate = undefined) {
  const liveProjectProofStatus = aggregateStatus(liveProjectPhases);
  const diagnosticsPhase = liveProjectPhases.find((phase) => phase.phase === 'diagnostics');
  const declarationPhase = liveProjectPhases.find((phase) => phase.phase === 'declaration-output');
  return {
    entryId: row.entryId,
    liveProjectProofEnabled: enabled,
    liveProjectProofStatus,
    liveProjectProofExecutionStatus: enabled ? liveProjectProofStatus : 'not-run-default-source-free',
    liveProjectProofReason: aggregateReason(liveProjectPhases),
    liveProjectProofPhaseCount: liveProjectPhases.length,
    liveProjectProofPhases: liveProjectPhases,
    liveProjectProofPassedPhases: liveProjectPhases.filter((phase) => phase.executionStatus === 'passed').length,
    liveProjectProofFailedPhases: liveProjectPhases.filter((phase) => phase.executionStatus === 'failed').length,
    liveProjectProofBlockedPhases: liveProjectPhases.filter((phase) => phase.executionStatus.startsWith('blocked-')).length,
    liveProjectProofSkippedPhases: liveProjectPhases.filter((phase) => phase.executionStatus.startsWith('skipped-')).length,
    liveProjectProofDefaultOffPhases: liveProjectPhases.filter((phase) => phase.defaultExecution === 'not-run-default-source-free').length,
    liveProjectSourceTextRead: sourceSummary.sourceTextRead === true,
    liveProjectSourceFilesRead: sourceSummary.sourceFilesRead ?? 0,
    liveProjectSourceBytesRead: sourceSummary.sourceBytesRead ?? 0,
    liveProjectSourceSetHash: sourceSummary.sourceSetHash ?? null,
    liveProjectSourceFiles: sourceSummary.sourceFiles ?? [],
    liveProjectSourceFileLimit: sourceSummary.sourceFileLimit ?? defaultMaxFiles,
    liveProjectSourceFileByteLimit: sourceSummary.sourceFileByteLimit ?? defaultMaxBytesPerFile,
    liveProjectSourceFilesSkippedTooLarge: sourceSummary.sourceFilesSkippedTooLarge ?? 0,
    liveProjectDiagnosticsStatus: diagnosticsPhase?.executionStatus ?? 'not-run',
    liveProjectDiagnosticsGateHash: diagnosticsPhase?.gateHash ?? null,
    liveProjectDiagnosticsConflicts: diagnosticsPhase?.conflicts ?? 0,
    liveProjectDiagnosticsCount: diagnosticsPhase?.diagnostics ?? 0,
    liveProjectDiagnosticsErrors: diagnosticsPhase?.errors ?? 0,
    liveProjectDeclarationStatus: declarationPhase?.executionStatus ?? 'not-run',
    liveProjectDeclarationGateHash: declarationPhase?.gateHash ?? null,
    liveProjectDeclarationConflicts: declarationPhase?.conflicts ?? 0,
    liveProjectDeclarationDiagnostics: declarationPhase?.diagnostics ?? 0,
    liveProjectDeclarationFiles: declarationPhase?.declarationFiles ?? 0,
    liveProjectDeclarationBytes: declarationPhase?.declarationBytes ?? 0,
    liveProjectDiagnosticsEvidenceKind: diagnosticsGate?.kind ?? null,
    liveProjectDeclarationEvidenceKind: declarationGate?.kind ?? null
  };
}

function createPhase(phase, executionStatus, reason, evidence = {}) {
  return {
    phase,
    executionStatus,
    reason,
    defaultExecution: executionStatus === 'blocked-opt-in-required' ? 'not-run-default-source-free' : 'explicit-opt-in',
    ...evidence
  };
}

function aggregateStatus(phases) {
  if (phases.some((phase) => phase.executionStatus === 'failed')) return 'failed';
  if (phases.length > 0 && phases.every((phase) => phase.executionStatus === 'passed')) return 'passed';
  if (phases.some((phase) => phase.executionStatus === 'skipped-missing-checkout')) return 'skipped-missing-checkout';
  if (phases.some((phase) => phase.executionStatus === 'blocked-identity-mismatch')) return 'blocked-identity-mismatch';
  if (phases.some((phase) => phase.executionStatus === 'blocked-compiler-unavailable')) return 'blocked-compiler-unavailable';
  if (phases.some((phase) => phase.executionStatus === 'blocked-source-read')) return 'blocked-source-read';
  if (phases.some((phase) => phase.executionStatus === 'blocked-safety-invariant')) return 'blocked-safety-invariant';
  return 'blocked-opt-in-required';
}

function aggregateReason(phases) {
  return phases.find((phase) => phase.executionStatus !== 'passed')?.reason ?? 'real-repo-live-project-passed';
}

function normalizePhases(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return defaultPhases;
  return phases.filter((phase) => defaultPhases.includes(phase));
}

export {
  assertDefaultRealRepoLiveProjectProofMetrics,
  collectRealRepoLiveProjectProofs,
  realRepoCorpusLiveProjectProofMetrics
};
