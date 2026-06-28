import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

const defaultMaxFiles = 32;
const defaultMaxBytesPerFile = 256_000;
const defaultExtensions = ['.ts', '.tsx', '.mts', '.cts'];

function collectBoundedSourceFiles(checkoutPath, globs, options) {
  const maxFiles = positiveInteger(options.maxFiles, defaultMaxFiles);
  const maxBytesPerFile = positiveInteger(options.maxBytesPerFile, defaultMaxBytesPerFile);
  const extensions = normalizeExtensions(options.extensions);
  const matches = new Map();
  for (const glob of globs) {
    if (matches.size >= maxFiles) break;
    if (!hasGlobMagic(glob)) {
      addSourceFile(matches, resolveInside(checkoutPath, glob), checkoutPath, { maxFiles, maxBytesPerFile, extensions });
      continue;
    }
    const prefix = staticPrefixForGlob(glob);
    const scanRoot = resolveInside(checkoutPath, prefix);
    if (!scanRoot || !isDirectory(scanRoot)) continue;
    const regex = globToRegExp(toPosix(glob));
    scanFiles(scanRoot, checkoutPath, (relativePath, filePath) => {
      if (matches.size >= maxFiles) return false;
      if (regex.test(relativePath)) addSourceFile(matches, filePath, checkoutPath, { maxFiles, maxBytesPerFile, extensions });
      return true;
    });
  }
  const files = [...matches.values()].map((entry) => ({ sourcePath: entry.sourcePath, language: 'typescript', sourceText: entry.sourceText }));
  const sourceSummaries = [...matches.values()].map((entry) => ({
    sourcePath: entry.sourcePath,
    bytes: entry.bytes,
    sourceHash: entry.sourceHash
  }));
  return {
    status: files.length ? 'ready' : 'blocked-source-read',
    reason: files.length ? 'real-repo-live-project-source-read' : 'real-repo-live-project-source-files-missing',
    files,
    summary: {
      sourceTextRead: files.length > 0,
      sourceFilesRead: files.length,
      sourceBytesRead: sourceSummaries.reduce((sum, entry) => sum + entry.bytes, 0),
      sourceSetHash: hashValue(sourceSummaries),
      sourceFiles: sourceSummaries,
      sourceFileLimit: maxFiles,
      sourceFileByteLimit: maxBytesPerFile,
      sourceFilesSkippedTooLarge: 0
    }
  };
}

function addSourceFile(matches, filePath, rootPath, limits) {
  if (!filePath || matches.size >= limits.maxFiles || !hasAllowedExtension(filePath, limits.extensions)) return;
  const relativePath = toPosix(relative(rootPath, filePath));
  if (matches.has(relativePath)) return;
  try {
    const stat = statSync(filePath);
    if (!stat.isFile() || stat.size > limits.maxBytesPerFile) return;
    const sourceText = readFileSync(filePath, 'utf8');
    matches.set(relativePath, {
      sourcePath: relativePath,
      sourceText,
      bytes: Buffer.byteLength(sourceText),
      sourceHash: hashText(sourceText)
    });
  } catch {
    // Prepared external checkouts are optional; read races stay non-fatal.
  }
}

function compilerOptionsForProof(ts, options) {
  return {
    noLib: true,
    strict: true,
    target: ts.ScriptTarget?.ESNext ?? ts.ScriptTarget?.Latest ?? 99,
    module: ts.ModuleKind?.ESNext ?? 99,
    moduleResolution: ts.ModuleResolutionKind?.Node10 ?? ts.ModuleResolutionKind?.NodeJs ?? 2,
    ...(options.compilerOptions ?? {})
  };
}

function declarationCompilerOptionsForProof(ts, options) {
  return {
    noLib: true,
    strict: true,
    target: ts.ScriptTarget?.ESNext ?? ts.ScriptTarget?.Latest ?? 99,
    module: ts.ModuleKind?.ESNext ?? 99,
    moduleResolution: ts.ModuleResolutionKind?.Node10 ?? ts.ModuleResolutionKind?.NodeJs ?? 2,
    ...(options.declarationCompilerOptions ?? options.compilerOptions ?? {})
  };
}

function realContainedPath(rootPath, checkoutDir) {
  let rootRealPath;
  try {
    rootRealPath = realpathSync(rootPath);
  } catch {
    return { reason: 'real-repo-live-project-checkout-root-missing' };
  }
  const checkoutPath = resolve(rootRealPath, checkoutDir);
  const lexicalRelative = relative(rootRealPath, checkoutPath);
  if (lexicalRelative.startsWith('..') || isAbsolute(lexicalRelative)) return { reason: 'real-repo-live-project-checkout-dir-outside-root' };
  try {
    const stat = statSync(checkoutPath);
    if (!stat.isDirectory()) return { reason: 'real-repo-live-project-checkout-dir-missing' };
    const checkoutRealPath = realpathSync(checkoutPath);
    const realRelative = relative(rootRealPath, checkoutRealPath);
    if (realRelative.startsWith('..') || isAbsolute(realRelative)) return { reason: 'real-repo-live-project-checkout-realpath-escape' };
    return { path: checkoutRealPath };
  } catch {
    return { reason: 'real-repo-live-project-checkout-dir-missing' };
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

function normalizeExtensions(value) {
  const extensions = Array.isArray(value) && value.length ? value : defaultExtensions;
  return new Set(extensions.map((extension) => String(extension).toLowerCase()));
}

function hasAllowedExtension(filePath, extensions) {
  const lowered = String(filePath).toLowerCase();
  return [...extensions].some((extension) => lowered.endsWith(extension));
}

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
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

function hashText(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function hashValue(value) {
  return hashText(JSON.stringify(value));
}

export {
  collectBoundedSourceFiles,
  compilerOptionsForProof,
  declarationCompilerOptionsForProof,
  defaultMaxBytesPerFile,
  defaultMaxFiles,
  realContainedPath
};
