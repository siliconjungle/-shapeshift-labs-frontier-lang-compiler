import { readdirSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

const maxMatchedFilesPerEntry = 64;
const maxScannedFilesPerGlob = 2_000;

function collectPackageManagerMetadata(checkoutPath, matrix = []) {
  const lockFiles = [];
  const managers = [];
  for (const row of matrix) {
    const present = (row.lockFiles ?? []).filter((lockFile) => {
      const filePath = resolveInside(checkoutPath, lockFile);
      if (!filePath) return false;
      try { return statSync(filePath).isFile(); } catch { return false; }
    });
    if (!present.length) continue;
    managers.push(row.manager);
    for (const lockFile of present) lockFiles.push(lockFile);
  }
  return { lockFiles, managers };
}

function collectMatchingFileStats(checkoutPath, globs) {
  const matches = new Map();
  for (const glob of globs) {
    if (!hasGlobMagic(glob)) {
      const filePath = resolveInside(checkoutPath, glob);
      addMatchedFile(matches, filePath, checkoutPath);
      continue;
    }
    const prefix = staticPrefixForGlob(glob);
    const scanRoot = resolveInside(checkoutPath, prefix);
    if (!scanRoot || !isDirectory(scanRoot)) continue;
    const regex = globToRegExp(toPosix(glob));
    let scannedFiles = 0;
    scanFiles(scanRoot, checkoutPath, (relativePath, filePath) => {
      if (scannedFiles >= maxScannedFilesPerGlob || matches.size >= maxMatchedFilesPerEntry) return false;
      scannedFiles += 1;
      if (regex.test(relativePath)) addMatchedFile(matches, filePath, checkoutPath);
      return true;
    });
  }
  return {
    matchedFiles: matches.size,
    maxObservedBytesPerFile: [...matches.values()].reduce((max, size) => Math.max(max, size), 0)
  };
}

function addMatchedFile(matches, filePath, rootPath) {
  if (!filePath || matches.size >= maxMatchedFilesPerEntry) return;
  try {
    const stat = statSync(filePath);
    if (stat.isFile()) matches.set(toPosix(relative(rootPath, filePath)), stat.size);
  } catch {
    // Local external checkouts are optional; races while scanning remain non-fatal.
  }
}

function scanFiles(dirPath, rootPath, visit) {
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    return true;
  }
  for (const entry of entries) {
    const childPath = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (scanFiles(childPath, rootPath, visit) === false) return false;
      continue;
    }
    if (entry.isFile() && visit(toPosix(relative(rootPath, childPath)), childPath) === false) return false;
  }
  return true;
}

function staticPrefixForGlob(glob) {
  const prefix = [];
  for (const part of toPosix(glob).split('/')) {
    if (hasGlobMagic(part)) break;
    prefix.push(part);
  }
  return prefix.join('/');
}

function globToRegExp(glob) {
  let source = '^';
  for (let index = 0; index < glob.length;) {
    const char = glob[index];
    if (char === '*' && glob[index + 1] === '*') {
      source += glob[index + 2] === '/' ? '(?:[^/]+/)*' : '.*';
      index += glob[index + 2] === '/' ? 3 : 2;
    } else if (char === '*') {
      source += '[^/]*';
      index += 1;
    } else if (char === '?') {
      source += '[^/]';
      index += 1;
    } else {
      source += escapeRegExp(char);
      index += 1;
    }
  }
  return new RegExp(`${source}$`);
}

function hasGlobMagic(value) {
  return /[*?]/.test(value);
}

function resolveInside(rootPath, requestedPath) {
  const targetPath = resolve(rootPath, requestedPath);
  const relativePath = relative(rootPath, targetPath);
  if (relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))) return targetPath;
  return null;
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function toPosix(path) {
  return path.replaceAll('\\', '/');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { collectMatchingFileStats, collectPackageManagerMetadata, isDirectory, resolveInside };
