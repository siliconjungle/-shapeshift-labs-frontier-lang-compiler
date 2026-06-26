import { readFileSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

function collectCheckoutIdentityMetadata(checkoutPath, entry) {
  const gitPath = resolveInside(checkoutPath, '.git');
  const base = {
    checkoutIdentityStatus: 'git-metadata-missing',
    checkoutIdentityExecution: 'executed',
    gitMetadataPresent: false,
    gitMetadataKind: 'missing',
    gitDirPointerPresent: false,
    gitHeadPresent: false,
    gitConfigPresent: false,
    gitRemoteOriginUrlPresent: false,
    gitRemoteOriginMatchesManifest: null,
    gitRefMatchesManifest: null
  };
  if (!gitPath) return base;

  let gitStat;
  try {
    gitStat = statSync(gitPath);
  } catch {
    return base;
  }

  if (gitStat.isFile()) {
    const gitFileText = readSmallText(gitPath);
    const gitDirPointerPresent = /^gitdir:\s*\S+/im.test(gitFileText ?? '');
    return {
      ...base,
      checkoutIdentityStatus: gitDirPointerPresent ? 'gitdir-pointer-present' : 'git-metadata-present',
      gitMetadataPresent: true,
      gitMetadataKind: gitDirPointerPresent ? 'gitdir-pointer' : 'git-file',
      gitDirPointerPresent
    };
  }
  if (!gitStat.isDirectory()) return base;

  const headText = readSmallText(resolveInside(checkoutPath, '.git/HEAD'));
  const configText = readSmallText(resolveInside(checkoutPath, '.git/config'));
  const gitRemoteOriginUrlPresent = gitConfigHasOriginUrl(configText);
  const gitRemoteOriginMatchesManifest = gitConfigMatchesManifestRemote(configText, entry.source?.url);
  const gitRefMatchesManifest = gitHeadMatchesManifestRef(headText, entry.source?.ref);
  const checkoutIdentityStatus = gitRemoteOriginMatchesManifest === true && gitRefMatchesManifest === true
    ? 'git-identity-matched'
    : 'git-metadata-present';

  return {
    ...base,
    checkoutIdentityStatus,
    gitMetadataPresent: true,
    gitMetadataKind: 'git-directory',
    gitHeadPresent: Boolean(headText),
    gitConfigPresent: Boolean(configText),
    gitRemoteOriginUrlPresent,
    gitRemoteOriginMatchesManifest,
    gitRefMatchesManifest
  };
}

function readSmallText(filePath, maxBytes = 16_384) {
  if (!filePath) return null;
  try {
    const stat = statSync(filePath);
    if (!stat.isFile() || stat.size > maxBytes) return null;
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function gitConfigMatchesManifestRemote(configText, expectedUrl) {
  const expected = normalizeGitRemoteUrl(expectedUrl);
  if (!configText || !expected) return null;
  const observed = gitConfigOriginUrls(configText).map((value) => normalizeGitRemoteUrl(value));
  const comparable = observed.filter(Boolean);
  return comparable.length ? comparable.includes(expected) : null;
}

function gitConfigHasOriginUrl(configText) {
  return gitConfigOriginUrls(configText).length > 0;
}

function gitConfigOriginUrls(configText) {
  if (!configText) return [];
  let inOrigin = false;
  const observed = [];
  for (const line of configText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '[remote "origin"]') { inOrigin = true; continue; }
    if (trimmed.startsWith('[')) { inOrigin = false; continue; }
    if (!inOrigin) continue;
    const match = trimmed.match(/^url\s*=\s*(.+)$/);
    if (match) observed.push(match[1]);
  }
  return observed;
}

function gitHeadMatchesManifestRef(headText, expectedRef) {
  if (!headText || typeof expectedRef !== 'string' || expectedRef.length === 0) return null;
  const head = headText.trim();
  const expected = expectedRef.replace(/^refs\/heads\//, '');
  const branchMatch = head.match(/^ref:\s+refs\/heads\/(.+)$/);
  if (branchMatch) return branchMatch[1] === expected;
  if (/^[a-f0-9]{7,40}$/i.test(expectedRef) && head.startsWith(expectedRef)) return true;
  return null;
}

function normalizeGitRemoteUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const raw = value.trim().replace(/^git\+/, '');
  const sshMatch = raw.match(/^git@([^:]+):(.+)$/);
  if (sshMatch) return stripGitSuffix(`https://${sshMatch[1]}/${sshMatch[2]}`);
  try {
    const parsed = new URL(raw);
    parsed.username = '';
    parsed.password = '';
    return stripGitSuffix(parsed.href.replace(/\/$/, ''));
  } catch {
    return stripGitSuffix(raw);
  }
}

function stripGitSuffix(value) { return value.replace(/\.git$/, ''); }

function resolveInside(rootPath, requestedPath) {
  const targetPath = resolve(rootPath, requestedPath);
  const relativePath = relative(rootPath, targetPath);
  if (relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))) return targetPath;
  return null;
}

export { collectCheckoutIdentityMetadata };
