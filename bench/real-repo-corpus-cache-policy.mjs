import { createHash } from 'node:crypto';

const defaultRetentionStatus = 'retention-admissible-local-private';
const defaultBlockedStatus = 'retention-blocked-proof-incomplete';

function createSourceCachePolicyArtifact(manifest, checkoutEvidenceRows, liveProjectProof) {
  const policy = manifest.localBehavior?.checkoutProof?.licenseCachePolicy ?? {};
  const liveRows = new Map((liveProjectProof?.rows ?? []).map((row) => [row.entryId, row]));
  const rows = checkoutEvidenceRows.map((row) => sourceCachePolicyRow(row, liveRows.get(row.entryId), policy));
  return {
    kind: 'frontier.lang.realRepoSourceCachePolicyArtifact',
    version: 1,
    retentionMode: policy.retentionMode ?? 'local-private-cache',
    publishDefault: policy.publishDefault ?? 'do-not-publish-source',
    sourceEvidence: policy.sourceEvidence ?? 'sha256-hash-plus-license-id-no-vendored-text',
    rows,
    rowCount: rows.length,
    admissibleRows: rows.filter((row) => row.retentionAdmissionStatus === 'admissible').length,
    blockedRows: rows.filter((row) => row.retentionAdmissionStatus === 'blocked').length,
    sourceTextIncludedRows: rows.filter((row) => row.sourceTextIncluded === true).length,
    hashOnlyRows: rows.filter((row) => row.sourceTextIncluded === false).length,
    publishBlockedRows: rows.filter((row) => row.publishDecision === 'do-not-publish-source').length,
    rowsWithLiveProjectSourceSetHash: rows.filter((row) => typeof row.liveProjectSourceSetHash === 'string').length,
    artifactHash: hashJson(rows)
  };
}

function sourceCachePolicyRow(row, liveRow, policy) {
  const admissible = row.sourceCachePolicyStatus === 'source-cache-license-verified' &&
    row.checkoutProofStatus === 'checked-out' &&
    row.checkoutIdentityStatus === 'git-identity-matched' &&
    row.gitRemoteOriginMatchesManifest === true &&
    row.gitRefMatchesManifest === true &&
    row.licenseTextMatchesExpectation === true;
  const reason = admissible ? 'source-cache-retention-policy-passed' : blockedReason(row);
  return {
    entryId: row.entryId,
    retentionAdmissionStatus: admissible ? 'admissible' : 'blocked',
    retentionStatus: admissible ? (policy.retentionStatus ?? defaultRetentionStatus) : defaultBlockedStatus,
    retentionReason: reason,
    retainedSourceLocationKind: admissible ? 'env-relative-checkout' : 'none',
    retainedSourceRootEnv: admissible ? row.checkoutRootEnv : null,
    retainedSourceCheckoutDir: admissible ? row.checkoutDir : null,
    sourceTextIncluded: false,
    sourceTextPublishable: false,
    publishDecision: policy.publishDefault ?? 'do-not-publish-source',
    checkoutProofStatus: row.checkoutProofStatus,
    checkoutIdentityStatus: row.checkoutIdentityStatus,
    gitRemoteOriginMatchesManifest: row.gitRemoteOriginMatchesManifest,
    gitRefMatchesManifest: row.gitRefMatchesManifest,
    licenseExpectedId: row.licenseExpectedId,
    licenseProofStatus: row.licenseProofStatus,
    licenseFileHash: row.licenseFileHash,
    sourceCachePolicyStatus: row.sourceCachePolicyStatus,
    matchedFiles: row.matchedFiles,
    maxObservedBytesPerFile: row.maxObservedBytesPerFile,
    liveProjectProofStatus: liveRow?.liveProjectProofStatus ?? 'not-run-default-source-free',
    liveProjectSourceSetHash: liveRow?.liveProjectSourceSetHash ?? null,
    liveProjectSourceFilesRead: liveRow?.liveProjectSourceFilesRead ?? 0,
    evidenceHash: hashJson({
      entryId: row.entryId,
      checkoutProofStatus: row.checkoutProofStatus,
      checkoutIdentityStatus: row.checkoutIdentityStatus,
      licenseFileHash: row.licenseFileHash,
      sourceCachePolicyStatus: row.sourceCachePolicyStatus,
      liveProjectSourceSetHash: liveRow?.liveProjectSourceSetHash ?? null
    })
  };
}

function blockedReason(row) {
  if (row.checkoutProofStatus === 'skipped-missing-checkout') return 'source-cache-checkout-missing';
  if (row.checkoutProofStatus !== 'checked-out') return 'source-cache-proof-globs-missing';
  if (row.checkoutIdentityStatus !== 'git-identity-matched') return 'source-cache-git-identity-unverified';
  if (row.licenseProofStatus !== 'license-proof-passed') return 'source-cache-license-unverified';
  return 'source-cache-retention-policy-incomplete';
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export { createSourceCachePolicyArtifact };
