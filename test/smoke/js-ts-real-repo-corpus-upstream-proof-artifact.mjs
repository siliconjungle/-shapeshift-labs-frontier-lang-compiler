import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const artifact = JSON.parse(readFileSync(new URL('../../research/real-repo-corpus-upstream-proof.json', import.meta.url), 'utf8'));

assert.equal(artifact.kind, 'frontier.lang.realRepoUpstreamCorpusProof', 'upstream proof artifact kind');
assert.equal(artifact.version, 1, 'upstream proof artifact version');
assert.deepEqual(artifact.selectedEntryIds, ['frontier-merge-metrics-public-api'], 'upstream proof selected entry');
assert.equal(artifact.sourceTextIncluded, false, 'upstream proof omits source text');
assert.equal(artifact.summary.selectedEntries, 1, 'upstream proof selected entry count');
assert.equal(artifact.summary.checkoutCheckedOut >= 1, true, 'upstream proof checked-out repo');
assert.equal(artifact.summary.checkoutIdentityMatched >= 1, true, 'upstream proof git identity');
assert.equal(artifact.summary.licenseProofPassedRows >= 1, true, 'upstream proof license passed');
assert.equal(artifact.summary.sourceCacheAdmissibleRows >= 1, true, 'upstream proof source-cache admission');
assert.equal(artifact.summary.sourceCacheSourceTextIncludedRows, 0, 'upstream proof source-cache source text omitted');
assert.equal(artifact.summary.liveProjectPassedRows >= 1, true, 'upstream proof live project passed');
assert.equal(artifact.summary.liveProjectDiagnosticsPassedRows >= 1, true, 'upstream proof diagnostics passed');
assert.equal(artifact.summary.liveProjectDeclarationPassedRows >= 1, true, 'upstream proof declaration passed');
assert.equal(artifact.summary.commandRunExecutedPhases >= 3, true, 'upstream proof command phases executed');
assert.equal(artifact.summary.commandRunFailedPhases, 0, 'upstream proof command failures');
assert.equal(artifact.summary.commandRunTimedOutPhases, 0, 'upstream proof command timeouts');
assert.equal(artifact.summary.dependencyInstallsRun >= 1, true, 'upstream proof dependency install executed');
assert.equal(artifact.summary.repositoryCommandsRun >= 1, true, 'upstream proof repository commands executed');
assert.match(artifact.artifactHash, /^[a-f0-9]{64}$/, 'upstream proof artifact hash');
assert.equal(JSON.stringify(artifact).includes('"sourceText"'), false, 'upstream proof must not include vendored source text');

const checkoutRow = artifact.selectedCheckoutRows.find((row) => row.entryId === 'frontier-merge-metrics-public-api');
assert.equal(checkoutRow?.checkoutProofStatus, 'checked-out', 'upstream proof checkout status');
assert.equal(checkoutRow.checkoutIdentityStatus, 'git-identity-matched', 'upstream proof checkout identity');
assert.equal(checkoutRow.gitRemoteOriginMatchesManifest, true, 'upstream proof remote identity');
assert.equal(checkoutRow.gitRefMatchesManifest, true, 'upstream proof ref identity');
assert.equal(checkoutRow.licenseProofStatus, 'license-proof-passed', 'upstream proof license status');
assert.equal(checkoutRow.sourceCachePolicyStatus, 'source-cache-license-verified', 'upstream proof source-cache license status');
assert.deepEqual(checkoutRow.packageManagersPresent, ['npm'], 'upstream proof package manager');
assert.deepEqual(checkoutRow.commandRunPhases.map((phase) => phase.phase), ['dependency-install', 'build', 'test']);
assert.deepEqual(checkoutRow.commandRunPhases.map((phase) => phase.executionStatus), ['executed', 'executed', 'executed']);
for (const phase of checkoutRow.commandRunPhases) {
  assert.match(phase.commandHash, /^[a-f0-9]{64}$/, `${phase.phase}: command hash`);
  assert.match(phase.stdoutHash, /^[a-f0-9]{64}$/, `${phase.phase}: stdout hash`);
  assert.match(phase.stderrHash, /^[a-f0-9]{64}$/, `${phase.phase}: stderr hash`);
}

const liveRow = artifact.selectedLiveProjectRows.find((row) => row.entryId === 'frontier-merge-metrics-public-api');
assert.equal(liveRow?.liveProjectProofStatus, 'passed', 'upstream proof live status');
assert.equal(liveRow.liveProjectDiagnosticsStatus, 'passed', 'upstream proof diagnostics status');
assert.equal(liveRow.liveProjectDiagnosticsErrors, 0, 'upstream proof diagnostics errors');
assert.equal(liveRow.liveProjectDeclarationStatus, 'passed', 'upstream proof declaration status');
assert.equal(liveRow.liveProjectSourceTextRead, true, 'upstream proof source text read only under explicit opt-in');
assert.equal(liveRow.liveProjectSourceFiles.some((file) => Object.hasOwn(file, 'sourceText')), false, 'upstream proof source file summaries omit source text');

const cacheRow = artifact.selectedSourceCacheRows.find((row) => row.entryId === 'frontier-merge-metrics-public-api');
assert.equal(cacheRow?.retentionAdmissionStatus, 'admissible', 'upstream proof cache retention admission');
assert.equal(cacheRow.sourceTextIncluded, false, 'upstream proof cache source text omitted');
assert.equal(cacheRow.sourceTextPublishable, false, 'upstream proof cache source not publishable');
assert.equal(cacheRow.publishDecision, 'do-not-publish-source', 'upstream proof cache publish decision');
