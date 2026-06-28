import { RealRepoCorpusSurfaceAudit } from '../../bench/real-repo-corpus-suite.mjs';
import {
  CHECKOUT_EXECUTION_STATUSES,
  CHECKOUT_IDENTITY_STATUSES,
  COMMAND_DRY_RUN_EXECUTION_STATUSES,
  COMMAND_DRY_RUN_PHASES,
  COMMAND_DRY_RUN_READINESS_STATUSES,
  GIT_METADATA_KINDS,
  SKIPPED_CHECKOUT_PRESENCE_STATUSES,
  STRENGTHENED_CHECKOUT_EVIDENCE_FIELDS,
  assertDefaultCommandRunMetrics,
  assertDefaultCommandRunRow
} from './js-ts-real-repo-corpus-proof-helpers.mjs';

function assertRealRepoCorpusMetrics(metrics, manifest, assert) {
  const entries = manifest.entries ?? [];
  const proof = manifest.localBehavior?.checkoutProof ?? {};
  const evidenceRows = metrics.realRepoCorpusCheckoutEvidenceRows;
  const entryIds = new Set(entries.map((entry) => entry.id));
  const proofStatuses = new Set(proof.statuses ?? []);
  const presenceStatuses = new Set(proof.presenceStatuses ?? []);
  const proofReasons = new Set(proof.proofReasons ?? []);

  assert.equal(metrics.realRepoCorpusEntries, entries.length, 'real-repo metrics entry count');
  assert.equal(typeof metrics.realRepoCorpusFixtureMode === 'string', true, 'real-repo metrics fixture mode');
  assert.equal(metrics.realRepoCorpusCommittedSourceBytes, 0, 'real-repo metrics committed source bytes');
  assert.equal(metrics.realRepoCorpusCheckoutProofEntries, entries.length, 'real-repo metrics checkout proof row count');
  assert.equal(Array.isArray(metrics.realRepoCorpusCheckoutProofRows), true, 'real-repo metrics raw checkout proof rows');
  assert.equal(Array.isArray(evidenceRows), true, 'real-repo metrics checkout evidence rows');
  assert.equal(evidenceRows.length, entries.length, 'real-repo metrics checkout evidence row count');
  assert.equal(
    metrics.realRepoCorpusCheckoutProofSkipped + metrics.realRepoCorpusCheckoutProofExecuted,
    entries.length,
    'real-repo metrics checkout proof skipped/executed accounting'
  );
  assert.equal(
    metrics.realRepoCorpusCheckoutEvidenceSkipped + metrics.realRepoCorpusCheckoutEvidenceExecuted,
    entries.length,
    'real-repo metrics checkout evidence skipped/executed accounting'
  );
  assert.equal(metrics.realRepoCorpusCheckoutDirPresentRows, metrics.realRepoCorpusCheckoutProofExecuted, 'real-repo metrics checkout dir presence/execution accounting');
  assert.equal(
    metrics.realRepoCorpusCheckoutDirPresentRows +
      metrics.realRepoCorpusCheckoutRootMissingRows +
      metrics.realRepoCorpusCheckoutRootUnconfiguredRows +
      metrics.realRepoCorpusCheckoutDirMissingRows +
      metrics.realRepoCorpusCheckoutDirNotDeclaredRows,
    entries.length,
    'real-repo metrics checkout presence reason accounting'
  );
  assert.equal(Number.isInteger(metrics.realRepoCorpusCheckoutPresenceStatuses) && metrics.realRepoCorpusCheckoutPresenceStatuses >= 1, true, 'real-repo metrics checkout presence status count');
  assert.equal(Number.isInteger(metrics.realRepoCorpusCheckoutProofReasons) && metrics.realRepoCorpusCheckoutProofReasons >= 1, true, 'real-repo metrics checkout proof reason count');
  assert.equal(metrics.realRepoCorpusRepositoryCommandsRun, 0, 'real-repo metrics default repository command execution');
  assert.equal(metrics.realRepoCorpusDependencyInstallsRun, 0, 'real-repo metrics default dependency install execution');
  assert.equal(
    metrics.realRepoCorpusCheckoutIdentitySkipped + metrics.realRepoCorpusCheckoutIdentityExecuted,
    entries.length,
    'real-repo metrics checkout identity skipped/executed accounting'
  );
  assert.equal(Number.isInteger(metrics.realRepoCorpusCheckoutGitDirectories), true, 'real-repo metrics git directory proof rows');
  assert.equal(Number.isInteger(metrics.realRepoCorpusCheckoutGitDirPointers), true, 'real-repo metrics gitdir pointer proof rows');
  assert.equal(Number.isInteger(metrics.realRepoCorpusCheckoutGitConfigsPresent), true, 'real-repo metrics git config proof rows');
  assert.equal(Number.isInteger(metrics.realRepoCorpusCheckoutGitOriginUrlsPresent), true, 'real-repo metrics git origin proof rows');
  assert.equal(metrics.realRepoCorpusDependencyInstallDefaultOffRows, entries.length, 'real-repo metrics dependency install default-off rows');
  assert.equal(metrics.realRepoCorpusRepositoryCommandDefaultOffRows, entries.length, 'real-repo metrics repository command default-off rows');
  assert.equal(metrics.realRepoCorpusPackageManagerCommandMatrixRows, entries.length, 'real-repo metrics package-manager command matrix rows');
  assert.equal(metrics.realRepoCorpusCommandDryRunPhaseRows, entries.length * COMMAND_DRY_RUN_PHASES.length, 'real-repo metrics command dry-run phase rows');
  assert.equal(metrics.realRepoCorpusCommandDryRunPhaseKinds, COMMAND_DRY_RUN_PHASES.length, 'real-repo metrics command dry-run phase kinds');
  assert.equal(metrics.realRepoCorpusCommandDryRunSkippedPhases, metrics.realRepoCorpusCheckoutEvidenceSkipped * COMMAND_DRY_RUN_PHASES.length, 'real-repo metrics command dry-run skipped phases');
  assert.equal(metrics.realRepoCorpusCommandDryRunReadyPhases, metrics.realRepoCorpusCheckoutEvidenceExecuted * COMMAND_DRY_RUN_PHASES.length, 'real-repo metrics command dry-run ready phases');
  assert.equal(metrics.realRepoCorpusCommandDryRunOptInRequiredPhases, metrics.realRepoCorpusCheckoutEvidenceExecuted * COMMAND_DRY_RUN_PHASES.length, 'real-repo metrics command dry-run opt-in phases');
  assert.equal(metrics.realRepoCorpusCommandDryRunExecutedPhases, 0, 'real-repo metrics command dry-run executed phases');
  assert.equal(metrics.realRepoCorpusCommandDryRunDefaultOffPhases, metrics.realRepoCorpusCommandDryRunPhaseRows, 'real-repo metrics command dry-run default-off phases');
  assertDefaultCommandRunMetrics(metrics, entries.length, assert);
  assert.deepEqual(metrics.realRepoCorpusMergeSurfaceFailClosedSurfaceIds, RealRepoCorpusSurfaceAudit.failClosedSurfaces, 'real-repo metrics fail-closed surfaces');
  assert.deepEqual(metrics.realRepoCorpusMergeSurfaceFailClosedRouteIds, RealRepoCorpusSurfaceAudit.failClosedRouteIds, 'real-repo metrics fail-closed routes');
  assert.equal(metrics.realRepoCorpusMergeSurfaceUnroutedSurfaces, 0, 'real-repo metrics unrouted surfaces');

  for (const row of evidenceRows) {
    assertRealRepoCorpusEvidenceRow(row, { proof, manifest, metrics, entryIds, proofStatuses, presenceStatuses, proofReasons }, assert);
  }
}

function assertRealRepoCorpusEvidenceRow(row, context, assert) {
  const { proof, manifest, metrics, entryIds, proofStatuses, presenceStatuses, proofReasons } = context;
  for (const field of proof.evidenceRowFields ?? []) assert.equal(Object.hasOwn(row, field), true, `${row.entryId}: checkout evidence row field ${field}`);
  for (const field of STRENGTHENED_CHECKOUT_EVIDENCE_FIELDS) assert.equal(Object.hasOwn(row, field), true, `${row.entryId}: strengthened checkout evidence row field ${field}`);
  assert.equal(entryIds.has(row.entryId), true, `${row.entryId}: checkout evidence known entry`);
  assert.equal(row.manifestMetadataStatus, manifest.mode, `${row.entryId}: manifest metadata status`);
  assert.equal(proofStatuses.has(row.checkoutProofStatus), true, `${row.entryId}: checkout proof status`);
  assert.equal((proof.executionStatuses ?? []).includes(row.checkoutProofExecution), true, `${row.entryId}: checkout proof execution`);
  assert.equal(row.checkoutRootMode, metrics.realRepoCorpusCheckoutRootMode, `${row.entryId}: checkout root mode`);
  assert.equal(row.checkoutRootEnv, proof.rootEnv, `${row.entryId}: checkout root env`);
  assert.equal(row.checkoutRootPresent, metrics.realRepoCorpusExternalRootPresent, `${row.entryId}: checkout root present`);
  assert.equal(typeof row.checkoutDirPresent, 'boolean', `${row.entryId}: checkout dir present`);
  assert.equal(presenceStatuses.has(row.checkoutPresenceStatus), true, `${row.entryId}: checkout presence status`);
  assert.equal(proofReasons.has(row.checkoutProofReason), true, `${row.entryId}: checkout proof reason`);
  assert.equal(row.dependencyInstallExecution, proof.dependencyInstallExecution, `${row.entryId}: dependency install execution`);
  assert.equal(row.repositoryCommandProofStatus, proof.repositoryCommandProofStatus, `${row.entryId}: repository command proof status`);
  assert.equal(row.repositoryCommandExecution, proof.repositoryCommandExecution, `${row.entryId}: repository command execution`);
  assert.equal(typeof row.dependencyInstallDefaultOffReason === 'string' && row.dependencyInstallDefaultOffReason.length > 0, true, `${row.entryId}: dependency install default-off reason`);
  assert.equal(row.dependencyInstallOptInRequired, true, `${row.entryId}: dependency install opt-in`);
  assert.equal(typeof row.repositoryCommandDefaultOffReason === 'string' && row.repositoryCommandDefaultOffReason.length > 0, true, `${row.entryId}: repository command default-off reason`);
  assert.equal(row.repositoryCommandOptInRequired, true, `${row.entryId}: repository command opt-in`);
  assert.equal(row.networkAccess, 'none', `${row.entryId}: network access`);
  assert.equal(row.sourceTextRead, false, `${row.entryId}: source text access`);
  assert.equal(row.installCommandsRun, false, `${row.entryId}: install command execution`);
  assert.equal(Number.isInteger(row.packageManagerLockFilesPresent) && row.packageManagerLockFilesPresent >= 0, true, `${row.entryId}: lockfile metadata count`);
  assert.equal(Array.isArray(row.packageManagerLockFiles), true, `${row.entryId}: lockfile metadata files`);
  assert.equal(Array.isArray(row.packageManagersPresent), true, `${row.entryId}: package manager metadata`);
  assert.equal(row.packageManagerCommandMatrixStatus, 'metadata-only', `${row.entryId}: package manager command matrix status`);
  assert.equal(Number.isInteger(row.packageManagerCommandMatrixCommands) && row.packageManagerCommandMatrixCommands >= 3, true, `${row.entryId}: package manager command matrix commands`);
  assert.equal(Number.isInteger(row.packageManagerInstallCommands) && row.packageManagerInstallCommands >= 1, true, `${row.entryId}: package manager install commands`);
  assert.equal(Number.isInteger(row.packageManagerBuildCommands) && row.packageManagerBuildCommands >= 1, true, `${row.entryId}: package manager build commands`);
  assert.equal(Number.isInteger(row.packageManagerTestCommands) && row.packageManagerTestCommands >= 1, true, `${row.entryId}: package manager test commands`);
  assert.equal(COMMAND_DRY_RUN_READINESS_STATUSES.includes(row.commandDryRunStatus), true, `${row.entryId}: command dry-run readiness status`);
  assert.equal(COMMAND_DRY_RUN_EXECUTION_STATUSES.includes(row.commandDryRunExecutionStatus), true, `${row.entryId}: command dry-run execution status`);
  assert.equal(row.commandDryRunPhaseCount, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: command dry-run phase count`);
  assert.equal(Array.isArray(row.commandDryRunPhases), true, `${row.entryId}: command dry-run phases`);
  assert.equal(row.commandDryRunPhases.length, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: command dry-run phase rows`);
  assert.equal(row.commandDryRunSkippedPhases + row.commandDryRunReadyPhases, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: command dry-run readiness accounting`);
  assert.equal(row.commandDryRunExecutedPhases, 0, `${row.entryId}: command dry-run executed phases`);
  assert.equal(row.commandDryRunDefaultOffPhases, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: command dry-run default-off phases`);
  assertDefaultCommandRunRow(row, assert);
  for (const phase of row.commandDryRunPhases) assertRealRepoCorpusCommandDryRunPhase(row, phase, assert);
  assert.equal(CHECKOUT_IDENTITY_STATUSES.includes(row.checkoutIdentityStatus), true, `${row.entryId}: checkout identity status`);
  assert.equal(CHECKOUT_EXECUTION_STATUSES.includes(row.checkoutIdentityExecution), true, `${row.entryId}: checkout identity execution`);
  assert.equal(typeof row.gitMetadataPresent, 'boolean', `${row.entryId}: git metadata present`);
  assert.equal(GIT_METADATA_KINDS.includes(row.gitMetadataKind), true, `${row.entryId}: git metadata kind`);
  assert.equal(typeof row.gitDirPointerPresent, 'boolean', `${row.entryId}: gitdir pointer present`);
  assert.equal(typeof row.gitHeadPresent, 'boolean', `${row.entryId}: git head present`);
  assert.equal(typeof row.gitConfigPresent, 'boolean', `${row.entryId}: git config present`);
  assert.equal(typeof row.gitRemoteOriginUrlPresent, 'boolean', `${row.entryId}: git origin url present`);
  assert.equal(row.gitRemoteOriginMatchesManifest === null || typeof row.gitRemoteOriginMatchesManifest === 'boolean', true, `${row.entryId}: git remote match`);
  assert.equal(row.gitRefMatchesManifest === null || typeof row.gitRefMatchesManifest === 'boolean', true, `${row.entryId}: git ref match`);
  assert.equal(Number.isInteger(row.plannedSampleFiles) && row.plannedSampleFiles > 0, true, `${row.entryId}: planned sample files`);
  assert.equal(Number.isInteger(row.proofGlobs) && row.proofGlobs > 0, true, `${row.entryId}: proof globs`);
  assert.equal(Number.isInteger(row.matchedFiles) && row.matchedFiles >= 0, true, `${row.entryId}: matched files`);
  assert.equal(Number.isInteger(row.maxObservedBytesPerFile) && row.maxObservedBytesPerFile >= 0, true, `${row.entryId}: max observed bytes per file`);
  row.checkoutProofStatus === 'skipped-missing-checkout'
    ? assertSkippedRealRepoCorpusEvidenceRow(row, assert)
    : assertCheckedOutRealRepoCorpusEvidenceRow(row, assert);
}

function assertRealRepoCorpusCommandDryRunPhase(row, phase, assert) {
  assert.equal(COMMAND_DRY_RUN_PHASES.includes(phase.phase), true, `${row.entryId}: command dry-run phase ${phase.phase}`);
  assert.equal(phase.readinessStatus, row.commandDryRunStatus, `${row.entryId}: ${phase.phase} readiness status`);
  assert.equal(phase.executionStatus, row.commandDryRunExecutionStatus, `${row.entryId}: ${phase.phase} execution status`);
  assert.equal(phase.defaultExecution, 'not-run-default-network-free', `${row.entryId}: ${phase.phase} default execution`);
  assert.equal(phase.optInRequired, phase.executionStatus === 'opt-in-required', `${row.entryId}: ${phase.phase} opt-in flag`);
  assert.equal(Array.isArray(phase.commandKinds) && phase.commandKinds.length > 0, true, `${row.entryId}: ${phase.phase} command kinds`);
  assert.equal(Number.isInteger(phase.commandCount) && phase.commandCount > 0, true, `${row.entryId}: ${phase.phase} command count`);
  assert.equal(phase.networkAccess, 'none', `${row.entryId}: ${phase.phase} network access`);
  assert.equal(phase.sourceTextRead, false, `${row.entryId}: ${phase.phase} source text access`);
}

function assertSkippedRealRepoCorpusEvidenceRow(row, assert) {
  assert.equal(row.checkoutProofExecution, 'skipped', `${row.entryId}: skipped proof execution`);
  assert.equal(row.checkoutDirPresent, false, `${row.entryId}: skipped checkout dir presence`);
  assert.equal(SKIPPED_CHECKOUT_PRESENCE_STATUSES.includes(row.checkoutPresenceStatus), true, `${row.entryId}: skipped checkout presence reason`);
  assert.equal(row.checkoutProofReason, row.checkoutPresenceStatus, `${row.entryId}: skipped checkout proof reason`);
  assert.equal(row.checkoutIdentityExecution, 'skipped', `${row.entryId}: skipped identity proof execution`);
  assert.equal(row.checkoutIdentityStatus, 'skipped-missing-checkout', `${row.entryId}: skipped identity proof status`);
  assert.equal(row.gitMetadataKind, 'not-scanned', `${row.entryId}: skipped git metadata kind`);
  assert.equal(row.gitDirPointerPresent, false, `${row.entryId}: skipped gitdir pointer`);
  assert.equal(row.gitConfigPresent, false, `${row.entryId}: skipped git config`);
  assert.equal(row.dependencyInstallProofStatus, 'skipped-missing-checkout', `${row.entryId}: skipped dependency proof`);
  assert.equal(row.commandDryRunStatus, 'skipped-missing-checkout', `${row.entryId}: skipped command dry-run status`);
  assert.equal(row.commandDryRunExecutionStatus, 'skipped-missing-checkout', `${row.entryId}: skipped command dry-run execution`);
  assert.equal(row.commandDryRunSkippedPhases, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: skipped command dry-run phases`);
  assert.equal(row.commandDryRunReadyPhases, 0, `${row.entryId}: skipped command dry-run ready phases`);
  assert.equal(row.commandDryRunOptInRequiredPhases, 0, `${row.entryId}: skipped command dry-run opt-in phases`);
  assert.equal(row.matchedFiles, 0, `${row.entryId}: skipped proof matched files`);
}

function assertCheckedOutRealRepoCorpusEvidenceRow(row, assert) {
  assert.equal(row.checkoutProofExecution, 'executed', `${row.entryId}: checked-out proof execution`);
  assert.equal(row.checkoutDirPresent, true, `${row.entryId}: checked-out checkout dir presence`);
  assert.equal(row.checkoutPresenceStatus, 'checkout-dir-present', `${row.entryId}: checked-out checkout presence status`);
  assert.equal(row.checkoutProofReason, row.checkoutProofStatus === 'checked-out' ? 'declared-proof-globs-matched' : 'declared-proof-globs-missing', `${row.entryId}: checked-out checkout proof reason`);
  assert.equal(row.checkoutIdentityExecution, 'executed', `${row.entryId}: checked-out identity proof execution`);
  assert.equal(row.gitMetadataKind !== 'not-scanned', true, `${row.entryId}: checked-out git metadata scanned`);
  assert.equal(['lockfile-metadata-present', 'lockfile-metadata-missing'].includes(row.dependencyInstallProofStatus), true, `${row.entryId}: dependency proof metadata status`);
  assert.equal(row.commandDryRunStatus, 'ready-local-checkout', `${row.entryId}: checked-out command dry-run readiness`);
  assert.equal(row.commandDryRunExecutionStatus, 'opt-in-required', `${row.entryId}: checked-out command dry-run execution`);
  assert.equal(row.commandDryRunSkippedPhases, 0, `${row.entryId}: checked-out command dry-run skipped phases`);
  assert.equal(row.commandDryRunReadyPhases, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: checked-out command dry-run ready phases`);
  assert.equal(row.commandDryRunOptInRequiredPhases, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: checked-out command dry-run opt-in phases`);
}

export { assertRealRepoCorpusMetrics };
