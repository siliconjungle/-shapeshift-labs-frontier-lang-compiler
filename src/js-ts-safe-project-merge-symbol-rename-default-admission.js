import { compactRecord } from './js-ts-safe-merge-context.js';

function projectSymbolRenameDefaultAdmissionProofs(branch, exportRenames, importRenames, ledgersByPath, sourcePaths, requiredEvidence) {
  const proofs = new Map();
  if (exportRenames.length !== 1) return proofs;
  const exportRename = exportRenames[0];
  const proof = projectSymbolRenameDefaultAdmissionProof(branch, exportRename, importRenames, ledgersByPath, sourcePaths, requiredEvidence);
  if (proof) proofs.set(projectSymbolRenameKey(exportRename.sourcePath, exportRename.fromName, exportRename.toName), proof);
  return proofs;
}

function projectSymbolRenameDefaultAdmissionProof(branch, exportRename, importRenames, ledgersByPath, sourcePaths, requiredEvidence) {
  if ((exportRename.fromEntries?.length ?? 0) !== 1 || (exportRename.toEntries?.length ?? 0) !== 1) return undefined;
  const matchingImportRenames = importRenames.filter((importRename) => importRenameMatchesExportRename(importRename, exportRename, sourcePaths));
  if (!matchingImportRenames.length || matchingImportRenames.length !== importRenames.length) return undefined;
  const baseOldReferences = projectSymbolImportReferences(ledgersByPath, sourcePaths, 'base', exportRename.sourcePath, exportRename.fromName);
  const branchNewReferences = projectSymbolImportReferences(ledgersByPath, sourcePaths, 'branch', exportRename.sourcePath, exportRename.toName);
  const branchOldReferences = projectSymbolImportReferences(ledgersByPath, sourcePaths, 'branch', exportRename.sourcePath, exportRename.fromName);
  if (branchOldReferences.length) return undefined;
  const rewriteKeys = matchingImportRenames.map(importRenameReferenceKey);
  const baseOldKeys = baseOldReferences.map(importReferenceKey);
  const branchNewKeys = branchNewReferences.map(importReferenceKey);
  if (!hasUniqueStrings(rewriteKeys) || !hasUniqueStrings(baseOldKeys) || !hasUniqueStrings(branchNewKeys)) return undefined;
  if (!sameStringSet(rewriteKeys, baseOldKeys) || !sameStringSet(rewriteKeys, branchNewKeys)) return undefined;
  return compactRecord({
    status: 'passed',
    route: 'default-exact-cross-file-symbol-rename',
    branch,
    exportSourcePath: exportRename.sourcePath,
    fromName: exportRename.fromName,
    toName: exportRename.toName,
    importRewriteCount: matchingImportRenames.length,
    rewrittenImportSourcePaths: uniqueStrings(matchingImportRenames.map((importRename) => importRename.sourcePath)),
    staleImportReferences: 0,
    duplicateImportReferences: 0,
    duplicateExportReferences: 0,
    requiredEvidence: [
      'project-graph-delta-evidence',
      ...requiredEvidence
    ]
  });
}

function importRenameMatchesExportRename(importRename, exportRename, sourcePaths) {
  return importRename.fromName === exportRename.fromName
    && importRename.toName === exportRename.toName
    && resolveProjectModuleSpecifier(importRename.sourcePath, importRename.moduleSpecifier, sourcePaths) === exportRename.sourcePath;
}

function projectSymbolImportReferences(ledgersByPath, sourcePaths, stage, exportSourcePath, importedName) {
  const references = [];
  for (const [sourcePath, ledgers] of ledgersByPath) {
    const ledger = ledgers?.[stage];
    for (const entry of ledger?.entries ?? []) {
      if (entry.kind !== 'import' || !entry.importInfo?.moduleSpecifier) continue;
      const resolvedPath = resolveProjectModuleSpecifier(sourcePath, entry.importInfo.moduleSpecifier, sourcePaths);
      if (resolvedPath !== exportSourcePath) continue;
      for (const specifier of entry.importInfo.specifiers ?? []) {
        if (specifier.importedName !== importedName) continue;
        references.push({
          sourcePath,
          moduleSpecifier: entry.importInfo.moduleSpecifier,
          importedName: specifier.importedName,
          localName: specifier.localName,
          typeOnly: entry.importInfo.typeOnly === true || specifier.typeOnly === true
        });
      }
    }
  }
  return references;
}

function resolveProjectModuleSpecifier(sourcePath, moduleSpecifier, sourcePaths) {
  if (typeof moduleSpecifier !== 'string' || !moduleSpecifier.startsWith('.')) return undefined;
  const rawPath = normalizeProjectPath(`${dirname(sourcePath) ? `${dirname(sourcePath)}/` : ''}${moduleSpecifier}`);
  return projectModulePathCandidates(rawPath).find((candidate) => sourcePaths.has(candidate));
}

function projectModulePathCandidates(rawPath) {
  const candidates = [rawPath];
  if (/\.[cm]?[jt]sx?$/.test(rawPath)) {
    candidates.push(...['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'].map((ext) => rawPath.replace(/\.[cm]?[jt]sx?$/, ext)));
  } else {
    candidates.push(...['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'].map((suffix) => `${rawPath}${suffix}`));
  }
  return uniqueStrings(candidates.map(normalizeProjectPath));
}

function normalizeProjectPath(path) {
  const parts = [];
  for (const part of String(path ?? '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

function projectSymbolRenameKey(sourcePath, fromName, toName) { return [sourcePath, fromName, toName].join('\u0000'); }
function importRenameReferenceKey(rename) { return importReferenceKey(rename); }
function importReferenceKey(reference) { return [reference.sourcePath, reference.moduleSpecifier, reference.typeOnly ? 'type' : 'value'].join('\u0000'); }
function dirname(path) { const text = String(path ?? ''); const slash = text.lastIndexOf('/'); return slash === -1 ? '' : text.slice(0, slash); }
function hasUniqueStrings(values) { return new Set(values).size === values.length; }
function sameStringSet(left, right) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { projectSymbolRenameDefaultAdmissionProofs };
