const CHECKOUT_PROOF_STATUSES = ['skipped-missing-checkout', 'checked-out', 'checked-out-no-proof-match'];
const CHECKOUT_EXECUTION_STATUSES = ['skipped', 'executed'];
const CHECKOUT_PRESENCE_STATUSES = ['checkout-root-unconfigured', 'checkout-root-missing', 'checkout-dir-not-declared', 'checkout-dir-missing', 'checkout-dir-present'];
const CHECKOUT_PROOF_REASONS = ['checkout-root-unconfigured', 'checkout-root-missing', 'checkout-dir-not-declared', 'checkout-dir-missing', 'declared-proof-globs-matched', 'declared-proof-globs-missing'];
const CHECKOUT_EVIDENCE_FIELDS = ['manifestMetadataStatus', 'checkoutProofStatus', 'checkoutProofExecution', 'checkoutRootMode', 'checkoutRootEnv', 'checkoutRootPresent', 'checkoutDirPresent', 'checkoutPresenceStatus', 'checkoutProofReason', 'checkoutIdentityStatus', 'checkoutIdentityExecution', 'gitMetadataPresent', 'gitMetadataKind', 'gitDirPointerPresent', 'gitHeadPresent', 'gitConfigPresent', 'gitRemoteOriginUrlPresent', 'gitRemoteOriginMatchesManifest', 'gitRefMatchesManifest', 'licenseExpectation', 'licenseExpectedId', 'licenseProofStatus', 'licenseProofExecution', 'licenseFilePresent', 'licenseFilePath', 'licenseFileHash', 'licenseFileBytes', 'licenseTextMatchesExpectation', 'sourceCachePolicyStatus', 'dependencyInstallProofStatus', 'dependencyInstallExecution', 'repositoryCommandProofStatus', 'repositoryCommandExecution', 'commandDryRunStatus', 'commandDryRunExecutionStatus', 'commandDryRunPhaseCount', 'commandDryRunPhases', 'commandDryRunSkippedPhases', 'commandDryRunReadyPhases', 'commandDryRunOptInRequiredPhases', 'commandDryRunExecutedPhases', 'commandDryRunDefaultOffPhases', 'commandRunStatus', 'commandRunExecutionStatus', 'commandRunReason', 'commandRunEnabled', 'commandRunPhaseCount', 'commandRunPhases', 'commandRunExecutedPhases', 'commandRunFailedPhases', 'commandRunTimedOutPhases', 'commandRunSkippedPhases', 'commandRunDefaultOffPhases', 'commandRunOutputTruncatedPhases'];
const STRENGTHENED_CHECKOUT_EVIDENCE_FIELDS = ['checkoutIdentityStatus', 'checkoutIdentityExecution', 'gitMetadataPresent', 'gitHeadPresent', 'gitRemoteOriginMatchesManifest', 'gitRefMatchesManifest', 'dependencyInstallDefaultOffReason', 'dependencyInstallOptInRequired', 'repositoryCommandDefaultOffReason', 'repositoryCommandOptInRequired', 'packageManagerCommandMatrixStatus', 'packageManagerCommandMatrixCommands', 'packageManagerInstallCommands', 'packageManagerBuildCommands', 'packageManagerTestCommands'];
const SKIPPED_CHECKOUT_PRESENCE_STATUSES = ['checkout-root-unconfigured', 'checkout-root-missing', 'checkout-dir-not-declared', 'checkout-dir-missing'];
const CHECKOUT_IDENTITY_STATUSES = ['skipped-missing-checkout', 'git-metadata-missing', 'gitdir-pointer-present', 'git-metadata-present', 'git-identity-matched'];
const GIT_METADATA_KINDS = ['not-scanned', 'missing', 'git-directory', 'gitdir-pointer', 'git-file'];
const COMMAND_DRY_RUN_PHASES = ['dependency-install', 'build', 'test'];
const COMMAND_DRY_RUN_READINESS_STATUSES = ['skipped-missing-checkout', 'ready-local-checkout'];
const COMMAND_DRY_RUN_EXECUTION_STATUSES = ['skipped-missing-checkout', 'opt-in-required'];
const COMMAND_RUN_EXECUTION_STATUSES = ['skipped-missing-checkout', 'blocked-safety-invariant', 'blocked-opt-in-required', 'blocked-identity-mismatch', 'blocked-command-not-allowed', 'executed', 'failed', 'timed-out'];
const LIVE_PROJECT_PROOF_PHASES = ['diagnostics', 'declaration-output'];
const LIVE_PROJECT_PROOF_EXECUTION_STATUSES = ['not-run-default-source-free', 'skipped-missing-checkout', 'blocked-safety-invariant', 'blocked-identity-mismatch', 'blocked-compiler-unavailable', 'blocked-source-read', 'passed', 'failed'];
const LICENSE_CACHE_POLICY_EXECUTION_STATUSES = ['skipped-missing-checkout', 'license-proof-passed', 'license-file-missing', 'license-expectation-missing', 'license-text-mismatch'];
const SOURCE_CACHE_RETENTION_STATUSES = ['retention-admissible-local-private', 'retention-blocked-proof-incomplete'];
const SOURCE_CACHE_ARTIFACT_FIELDS = ['entryId', 'retentionAdmissionStatus', 'retentionStatus', 'retentionReason', 'retainedSourceLocationKind', 'retainedSourceRootEnv', 'retainedSourceCheckoutDir', 'sourceTextIncluded', 'sourceTextPublishable', 'publishDecision', 'checkoutProofStatus', 'checkoutIdentityStatus', 'licenseFileHash', 'sourceCachePolicyStatus', 'liveProjectSourceSetHash', 'evidenceHash'];
const UPSTREAM_PROOF_STATUSES = ['not-run-default-network-free', 'explicit-opt-in-git-clone', 'explicit-opt-in-local-typechecker', 'explicit-opt-in-local-runner'];

function assertLocalCheckoutProof(manifest, assert) {
  const proof = manifest.localBehavior?.checkoutProof;
  assert.equal(proof?.runner, 'bench/real-repo-corpus-suite.mjs', 'real-repo checkout proof runner');
  assert.equal(proof.rootEnv, 'FRONTIER_REAL_REPO_CORPUS_ROOT', 'real-repo checkout proof root env');
  assert.equal(proof.networkRequired, false, 'real-repo checkout proof must be network-free');
  assert.equal(proof.readsSourceText, false, 'real-repo checkout proof must not read third-party source text');
  assert.deepEqual(proof.statuses, CHECKOUT_PROOF_STATUSES, 'real-repo checkout proof statuses');
  assert.deepEqual(proof.executionStatuses, CHECKOUT_EXECUTION_STATUSES, 'real-repo checkout proof execution statuses');
  assert.deepEqual(proof.presenceStatuses, CHECKOUT_PRESENCE_STATUSES, 'real-repo checkout proof presence statuses');
  assert.deepEqual(proof.proofReasons, CHECKOUT_PROOF_REASONS, 'real-repo checkout proof reason statuses');
  assert.deepEqual(proof.evidenceRowFields, CHECKOUT_EVIDENCE_FIELDS, 'real-repo checkout proof evidence row fields');
  assert.equal(proof.dependencyInstallExecution, 'not-run-default-network-free', 'real-repo checkout proof dependency install execution');
  assert.equal(proof.repositoryCommandProofStatus, 'not-run-default-network-free', 'real-repo checkout proof repository command proof status');
  assert.equal(proof.repositoryCommandExecution, 'not-run-default-network-free', 'real-repo checkout proof repository command execution');
  assert.equal(proof.commandDryRun?.proofStatus, 'metadata-only-default-off', 'real-repo command dry-run proof status');
  assert.deepEqual(proof.commandDryRun?.phases, COMMAND_DRY_RUN_PHASES, 'real-repo command dry-run phases');
  assert.deepEqual(proof.commandDryRun?.readinessStatuses, COMMAND_DRY_RUN_READINESS_STATUSES, 'real-repo command dry-run readiness statuses');
  assert.deepEqual(proof.commandDryRun?.executionStatuses, COMMAND_DRY_RUN_EXECUTION_STATUSES, 'real-repo command dry-run execution statuses');
  assert.equal(proof.commandDryRun?.defaultExecution, 'not-run-default-network-free', 'real-repo command dry-run default execution');
  assert.equal(proof.commandDryRun?.networkRequired, false, 'real-repo command dry-run network-free proof');
  assert.equal(proof.commandDryRun?.readsSourceText, false, 'real-repo command dry-run source-text access');
  assert.equal(proof.commandExecution?.proofStatus, 'explicit-opt-in-local-runner', 'real-repo command execution proof status');
  assert.deepEqual(proof.commandExecution?.phases, COMMAND_DRY_RUN_PHASES, 'real-repo command execution phases');
  assert.deepEqual(proof.commandExecution?.executionStatuses, COMMAND_RUN_EXECUTION_STATUSES, 'real-repo command execution statuses');
  assert.equal(proof.commandExecution?.defaultExecution, 'not-run-default-network-free', 'real-repo command execution default');
  assert.equal(proof.commandExecution?.networkRequired, false, 'real-repo command execution network-free proof');
  assert.equal(proof.commandExecution?.readsSourceText, false, 'real-repo command execution source-text access');
  assert.equal(proof.commandExecution?.shell, false, 'real-repo command execution shell policy');
  assert.equal(proof.commandExecution?.envPolicy, 'allowlist-only', 'real-repo command execution env policy');
  assert.equal(proof.commandExecution?.outputEvidence, 'sha256-hash-plus-capped-preview', 'real-repo command execution output evidence');
  assert.equal(proof.liveProjectProof?.proofStatus, 'explicit-opt-in-local-typechecker', 'real-repo live-project proof status');
  assert.deepEqual(proof.liveProjectProof?.phases, LIVE_PROJECT_PROOF_PHASES, 'real-repo live-project proof phases');
  assert.deepEqual(proof.liveProjectProof?.executionStatuses, LIVE_PROJECT_PROOF_EXECUTION_STATUSES, 'real-repo live-project proof execution statuses');
  assert.equal(proof.liveProjectProof?.defaultExecution, 'not-run-default-source-free', 'real-repo live-project proof default execution');
  assert.equal(proof.liveProjectProof?.networkRequired, false, 'real-repo live-project proof network-free');
  assert.equal(proof.liveProjectProof?.readsSourceText, true, 'real-repo live-project proof source-text access is explicit opt-in');
  assert.equal(proof.liveProjectProof?.sourceEvidence, 'sha256-hash-plus-counts-no-vendored-text', 'real-repo live-project source evidence');
  assert.equal(proof.licenseCachePolicy?.proofStatus, 'source-cache-license-provenance', 'real-repo license cache policy proof status');
  assert.equal(proof.licenseCachePolicy?.retentionMode, 'local-private-cache', 'real-repo source cache retention mode');
  assert.equal(proof.licenseCachePolicy?.publishDefault, 'do-not-publish-source', 'real-repo source cache publish default');
  assert.deepEqual(proof.licenseCachePolicy?.candidateFiles, ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING', 'COPYING.md', 'COPYING.txt'], 'real-repo license cache policy candidates');
  assert.deepEqual(proof.licenseCachePolicy?.executionStatuses, LICENSE_CACHE_POLICY_EXECUTION_STATUSES, 'real-repo license cache policy statuses');
  assert.deepEqual(proof.licenseCachePolicy?.retentionStatuses, SOURCE_CACHE_RETENTION_STATUSES, 'real-repo source cache retention statuses');
  assert.deepEqual(proof.licenseCachePolicy?.artifactFields, SOURCE_CACHE_ARTIFACT_FIELDS, 'real-repo source cache artifact fields');
  assert.equal(proof.licenseCachePolicy?.sourceEvidence, 'sha256-hash-plus-license-id-no-vendored-text', 'real-repo license cache policy evidence');
  assert.equal(proof.upstreamProof?.runner, 'bench/real-repo-corpus-upstream-proof.mjs', 'real-repo upstream proof runner');
  assert.equal(UPSTREAM_PROOF_STATUSES.includes(proof.upstreamProof?.defaultExecution), true, 'real-repo upstream proof default status');
  assert.equal(UPSTREAM_PROOF_STATUSES.includes(proof.upstreamProof?.cloneExecution), true, 'real-repo upstream proof clone status');
  assert.equal(UPSTREAM_PROOF_STATUSES.includes(proof.upstreamProof?.liveProjectExecution), true, 'real-repo upstream proof live status');
  assert.equal(UPSTREAM_PROOF_STATUSES.includes(proof.upstreamProof?.commandExecution), true, 'real-repo upstream proof command status');
  assert.equal(proof.upstreamProof?.evidenceArtifact, 'research/real-repo-corpus-upstream-proof.json', 'real-repo upstream proof artifact');
  assert.equal(proof.upstreamProof?.sourceTextIncluded, false, 'real-repo upstream proof omits source text');
  assert.equal(proof.upstreamProof?.outputEvidence, 'sha256-hash-plus-counts-no-vendored-text', 'real-repo upstream proof output evidence');
}

function assertPackageManagerMatrix(manifest, assert) {
  const matrix = manifest.localBehavior?.packageManagerMatrix;
  assert.equal(Array.isArray(matrix) && matrix.length >= 3, true, 'real-repo package-manager matrix');
  const managers = new Set();
  for (const row of matrix) {
    assert.equal(['npm', 'pnpm', 'yarn'].includes(row.manager), true, `${row.manager}: package manager`);
    assert.equal(managers.has(row.manager), false, `${row.manager}: duplicate package manager`);
    managers.add(row.manager);
    assert.equal(Array.isArray(row.lockFiles) && row.lockFiles.length > 0, true, `${row.manager}: lock files`);
    assert.equal(Array.isArray(row.commands) && row.commands.length >= 3, true, `${row.manager}: commands`);
    assert.equal(row.status, 'metadata-only', `${row.manager}: offline command metadata`);
  }
  for (const manager of ['npm', 'pnpm', 'yarn']) {
    assert.equal(managers.has(manager), true, `real-repo package-manager matrix ${manager}`);
  }
}

function assertDefaultCommandRunRow(row, assert) {
  assert.equal(row.commandRunStatus, 'blocked-opt-in-required', `${row.entryId}: default command-run status`);
  assert.equal(row.commandRunExecutionStatus, 'not-run-default-network-free', `${row.entryId}: default command-run execution status`);
  assert.equal(row.commandRunReason, 'real-repo-command-opt-in-missing', `${row.entryId}: default command-run reason`);
  assert.equal(row.commandRunEnabled, false, `${row.entryId}: default command-run enabled flag`);
  assert.equal(row.commandRunPhaseCount, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: default command-run phase count`);
  assert.equal(Array.isArray(row.commandRunPhases), true, `${row.entryId}: command-run phases`);
  assert.equal(row.commandRunPhases.length, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: command-run phase rows`);
  assert.equal(row.commandRunExecutedPhases + row.commandRunFailedPhases + row.commandRunTimedOutPhases + row.commandRunSkippedPhases, 0, `${row.entryId}: command-run inactive phases`);
  assert.equal(row.commandRunDefaultOffPhases, COMMAND_DRY_RUN_PHASES.length, `${row.entryId}: command-run default-off phases`);
  assert.equal(row.commandRunOutputTruncatedPhases, 0, `${row.entryId}: command-run truncated output phases`);
  for (const phase of row.commandRunPhases) {
    assert.equal(COMMAND_DRY_RUN_PHASES.includes(phase.phase), true, `${row.entryId}: command-run phase ${phase.phase}`);
    assert.equal(COMMAND_RUN_EXECUTION_STATUSES.includes(phase.executionStatus), true, `${row.entryId}: command-run execution ${phase.executionStatus}`);
    assert.equal(phase.executionStatus, 'blocked-opt-in-required', `${row.entryId}: ${phase.phase} default command-run execution`);
    assert.equal(phase.reason, 'real-repo-command-opt-in-missing', `${row.entryId}: ${phase.phase} default command-run reason`);
    assert.equal(phase.defaultExecution, 'not-run-default-network-free', `${row.entryId}: ${phase.phase} default command-run default execution`);
    assert.equal(Array.isArray(phase.argv), true, `${row.entryId}: ${phase.phase} command-run argv`);
    assert.equal(phase.stdoutBytes + phase.stderrBytes, 0, `${row.entryId}: ${phase.phase} command-run output bytes`);
    assert.equal(phase.stdoutTruncated || phase.stderrTruncated, false, `${row.entryId}: ${phase.phase} command-run truncation`);
  }
}

function assertDefaultCommandRunMetrics(metrics, entryCount, assert) {
  assert.equal(metrics.realRepoCorpusCommandRunRows, entryCount, 'real-repo command-run rows');
  assert.equal(metrics.realRepoCorpusCommandRunEnabledRows, 0, 'real-repo metrics default command-run enabled rows');
  assert.equal(metrics.realRepoCorpusCommandRunDefaultOffRows, entryCount, 'real-repo metrics default command-run rows');
  assert.equal(metrics.realRepoCorpusCommandRunExecutedPhases, 0, 'real-repo metrics command-run executed phases');
  assert.equal(metrics.realRepoCorpusCommandRunFailedPhases, 0, 'real-repo metrics command-run failed phases');
  assert.equal(metrics.realRepoCorpusCommandRunTimedOutPhases, 0, 'real-repo metrics command-run timed-out phases');
  assert.equal(metrics.realRepoCorpusCommandRunOutputTruncatedPhases, 0, 'real-repo metrics command-run truncated output phases');
  assert.equal(metrics.realRepoCorpusCommandRunDefaultOffPhases, entryCount * COMMAND_DRY_RUN_PHASES.length, 'real-repo metrics command-run default-off phases');
}

function assertBroadSuiteGaps(manifest, assert) {
  const gaps = manifest.broadSuiteGaps;
  assert.equal(Array.isArray(gaps) && gaps.length >= 3, true, 'real-repo corpus broad-suite gaps');
  const gapIds = new Set();
  const statuses = new Set();
  for (const gap of gaps) {
    assert.match(gap.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${gap.id}: gap id`);
    assert.equal(gapIds.has(gap.id), false, `${gap.id}: duplicate broad-suite gap`);
    gapIds.add(gap.id);
    assert.equal(['missing', 'partial', 'manual', 'covered'].includes(gap.status), true, `${gap.id}: gap status`);
    statuses.add(gap.status);
    assert.equal(typeof gap.reason === 'string' && gap.reason.length >= 24, true, `${gap.id}: gap reason`);
    for (const field of ['sourceLines', 'baseLines', 'workerLines', 'headLines', 'expectedLines']) {
      assert.equal(gap[field], undefined, `${gap.id}: gap must not vendor ${field}`);
    }
  }
  assert.equal(statuses.has('covered'), true, 'real-repo corpus covered proof milestones');
}

export {
  CHECKOUT_EXECUTION_STATUSES,
  CHECKOUT_IDENTITY_STATUSES,
  COMMAND_DRY_RUN_EXECUTION_STATUSES,
  COMMAND_DRY_RUN_PHASES,
  COMMAND_DRY_RUN_READINESS_STATUSES,
  COMMAND_RUN_EXECUTION_STATUSES,
  GIT_METADATA_KINDS,
  LICENSE_CACHE_POLICY_EXECUTION_STATUSES,
  LIVE_PROJECT_PROOF_EXECUTION_STATUSES,
  LIVE_PROJECT_PROOF_PHASES,
  SKIPPED_CHECKOUT_PRESENCE_STATUSES,
  SOURCE_CACHE_ARTIFACT_FIELDS,
  SOURCE_CACHE_RETENTION_STATUSES,
  STRENGTHENED_CHECKOUT_EVIDENCE_FIELDS,
  assertBroadSuiteGaps,
  assertDefaultCommandRunMetrics,
  assertDefaultCommandRunRow,
  assertLocalCheckoutProof,
  assertPackageManagerMatrix
};
