import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectMatchingFileStats,
  collectPackageManagerMetadata,
  isDirectory,
  resolveInside
} from './real-repo-corpus-checkout-files.mjs';
import { collectCheckoutIdentityMetadata } from './real-repo-corpus-checkout-identity.mjs';
import { collectLicenseProof, skippedLicenseProof } from './real-repo-corpus-license-proof.mjs';

const defaultCheckoutRootEnv = 'FRONTIER_REAL_REPO_CORPUS_ROOT';

function collectExternalCheckoutProofs(manifest, entries) {
  const root = checkoutProofRoot(manifest);
  const rootPresent = root.path ? isDirectory(root.path) : false;
  const packageManagerMatrix = manifest.localBehavior?.packageManagerMatrix ?? [];
  const commandMatrix = summarizePackageManagerCommandMatrix(packageManagerMatrix);
  const rows = entries.map((entry) => collectExternalCheckoutProof(entry, root.path, rootPresent, packageManagerMatrix, commandMatrix));
  const statuses = new Set(rows.map((row) => row.status));
  return {
    rootMode: root.mode,
    rootPath: root.path,
    rootPresent,
    rows,
    statuses,
    proofSkipped: rows.filter((row) => row.checkoutProofExecution === 'skipped').length,
    proofExecuted: rows.filter((row) => row.checkoutProofExecution === 'executed').length,
    skipped: rows.filter((row) => row.status === 'skipped-missing-checkout').length,
    checkedOut: rows.filter((row) => row.status.startsWith('checked-out')).length,
    noProofMatch: rows.filter((row) => row.status === 'checked-out-no-proof-match').length,
    proofMatchedEntries: rows.filter((row) => row.status === 'checked-out').length,
    matchedFiles: rows.reduce((sum, row) => sum + row.matchedFiles, 0),
    maxBytesPerFile: rows.reduce((max, row) => Math.max(max, row.maxObservedBytesPerFile), 0),
    identitySkipped: rows.filter((row) => row.checkoutIdentityExecution === 'skipped').length,
    identityExecuted: rows.filter((row) => row.checkoutIdentityExecution === 'executed').length,
    identityMetadataPresent: rows.filter((row) => row.gitMetadataPresent === true).length,
    identityMatched: rows.filter((row) => row.checkoutIdentityStatus === 'git-identity-matched').length,
    identityRemoteMatched: rows.filter((row) => row.gitRemoteOriginMatchesManifest === true).length,
    identityRefMatched: rows.filter((row) => row.gitRefMatchesManifest === true).length
  };
}

function checkoutProofRoot(manifest) {
  const envName = manifest.localBehavior?.checkoutProof?.rootEnv ?? defaultCheckoutRootEnv;
  const envRoot = process.env[envName];
  if (envRoot) return { mode: 'env-override', path: resolve(envRoot) };
  if (typeof manifest.fetchRoot !== 'string') return { mode: 'missing-fetch-root', path: null };
  return { mode: 'manifest-fetch-root', path: fileURLToPath(new URL(`../${manifest.fetchRoot}`, import.meta.url)) };
}

function collectExternalCheckoutProof(entry, rootPath, rootPresent, packageManagerMatrix, commandMatrix) {
  const missingPresence = missingCheckoutPresence(rootPath, rootPresent, entry);
  const baseRow = {
    entryId: entry.id,
    checkoutDir: entry.checkoutDir ?? null,
    checkoutRootPresent: rootPresent,
    checkoutDirPresent: false,
    checkoutPresenceStatus: missingPresence.status,
    checkoutProofReason: missingPresence.reason,
    plannedSampleFiles: entry.metrics?.sampleFiles ?? 0,
    proofGlobs: entry.pathGlobs?.length ?? 0,
    matchedFiles: 0,
    maxObservedBytesPerFile: 0,
    packageManagerLockFilesPresent: 0,
    packageManagerLockFiles: [],
    packageManagersPresent: [],
    packageManagerCommandMatrixStatus: commandMatrix.status,
    packageManagerCommandMatrixCommands: commandMatrix.commands,
    packageManagerInstallCommands: commandMatrix.installCommands,
    packageManagerBuildCommands: commandMatrix.buildCommands,
    packageManagerTestCommands: commandMatrix.testCommands,
    checkoutIdentityStatus: 'skipped-missing-checkout',
    checkoutIdentityExecution: 'skipped',
    gitMetadataPresent: false,
    gitMetadataKind: 'not-scanned',
    gitDirPointerPresent: false,
    gitHeadPresent: false,
    gitConfigPresent: false,
    gitRemoteOriginUrlPresent: false,
    gitRemoteOriginMatchesManifest: null,
    gitRefMatchesManifest: null,
    ...skippedLicenseProof(entry)
  };
  if (!rootPath || !rootPresent || !entry.checkoutDir) return withCheckoutProofStatus(baseRow, 'skipped-missing-checkout');
  const checkoutPath = resolveInside(rootPath, entry.checkoutDir);
  if (!checkoutPath || !isDirectory(checkoutPath)) return withCheckoutProofStatus(baseRow, 'skipped-missing-checkout');

  const matched = collectMatchingFileStats(checkoutPath, entry.pathGlobs ?? []);
  const packageManagers = collectPackageManagerMetadata(checkoutPath, packageManagerMatrix);
  const identity = collectCheckoutIdentityMetadata(checkoutPath, entry);
  const license = collectLicenseProof(checkoutPath, entry);
  const hasProofMatch = matched.matchedFiles > 0;
  return withCheckoutProofStatus({
    ...baseRow,
    checkoutDirPresent: true,
    checkoutPresenceStatus: 'checkout-dir-present',
    checkoutProofReason: hasProofMatch ? 'declared-proof-globs-matched' : 'declared-proof-globs-missing',
    matchedFiles: matched.matchedFiles,
    maxObservedBytesPerFile: matched.maxObservedBytesPerFile,
    packageManagerLockFilesPresent: packageManagers.lockFiles.length,
    packageManagerLockFiles: packageManagers.lockFiles,
    packageManagersPresent: packageManagers.managers,
    ...identity,
    ...license
  }, hasProofMatch ? 'checked-out' : 'checked-out-no-proof-match');
}

function missingCheckoutPresence(rootPath, rootPresent, entry) {
  if (!rootPath) return { status: 'checkout-root-unconfigured', reason: 'checkout-root-unconfigured' };
  if (!rootPresent) return { status: 'checkout-root-missing', reason: 'checkout-root-missing' };
  if (!entry.checkoutDir) return { status: 'checkout-dir-not-declared', reason: 'checkout-dir-not-declared' };
  return { status: 'checkout-dir-missing', reason: 'checkout-dir-missing' };
}

function summarizePackageManagerCommandMatrix(matrix = []) {
  const summary = {
    status: matrix.length > 0 && matrix.every((row) => row.status === 'metadata-only') ? 'metadata-only' : 'unknown',
    commands: 0,
    installCommands: 0,
    buildCommands: 0,
    testCommands: 0
  };
  for (const row of matrix) {
    for (const command of row.commands ?? []) {
      summary.commands += 1;
      if (/\b(ci|install)\b/.test(command)) summary.installCommands += 1;
      if (/\bbuild\b/.test(command)) summary.buildCommands += 1;
      if (/\btest\b/.test(command)) summary.testCommands += 1;
    }
  }
  return summary;
}

function withCheckoutProofStatus(row, status) {
  return {
    ...row,
    status,
    checkoutProofExecution: status === 'skipped-missing-checkout' ? 'skipped' : 'executed'
  };
}

export { collectExternalCheckoutProofs };
