import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord, createMergeContext } from './js-ts-safe-merge-context.js';
import { scanJsTsTopLevelLedger, validateLedgerUniqueness } from './js-ts-safe-merge-ledger.js';
import { TypeScriptRefactorEvidenceMissingCode, typeScriptRefactorEvidenceRecordsFromClassifications, withTypeScriptRefactorEvidence } from './internal/index-impl/typeScriptCompilerFacts.js';
import { projectSymbolRenameDefaultAdmissionProofs } from './js-ts-safe-project-merge-symbol-rename-default-admission.js';
import { maybeAdmitProjectSymbolRenameFile, projectSymbolRenameAdmissionSummary } from './js-ts-safe-project-merge-symbol-rename-admission.js';

const projectSymbolRenameRequiredEvidence = ['import-export-rewrite-evidence', 'output-diagnostics-gate', 'output-declaration-gate'];

function classifyProjectSymbolRenames(files, input) {
  const classifications = [...classifyBranchCrossFileSymbolRenames(files, input, 'worker'), ...classifyBranchCrossFileSymbolRenames(files, input, 'head')];
  const byPath = new Map();
  for (const classification of classifications) {
    for (const sourcePath of classification.sourcePaths) {
      const entries = byPath.get(sourcePath) ?? [];
      entries.push(classification);
      byPath.set(sourcePath, entries);
    }
  }
  return { classifications, byPath, summary: projectSymbolRenameSummary(classifications) };
}

function classifyBranchCrossFileSymbolRenames(files, input, branch) {
  const exportRenames = [];
  const importRenames = [];
  const sourcePaths = new Set(files.map((file) => file.sourcePath).filter(Boolean));
  const ledgersByPath = new Map();
  for (const file of files) {
    if (!file.sourcePath || typeof file.baseSourceText !== 'string') continue;
    const branchSourceText = branchStageSourceText(file, branch);
    if (typeof branchSourceText !== 'string') continue;
    const ledgers = projectSymbolRenameLedgers(file, input, branch, branchSourceText);
    if (!ledgers) continue;
    ledgersByPath.set(file.sourcePath, ledgers);
    if (branchSourceText === file.baseSourceText) continue;
    const exportRename = exportedNameRenameCandidate(file, branch, ledgers.base, ledgers.branch);
    if (exportRename) exportRenames.push(exportRename);
    importRenames.push(...importedNameRenameCandidates(file, branch, ledgers.base, ledgers.branch));
  }
  const defaultAdmissionProofs = projectSymbolRenameDefaultAdmissionProofs(branch, exportRenames, importRenames, ledgersByPath, sourcePaths, projectSymbolRenameRequiredEvidence);
  const exportsByPathAndName = new Map(exportRenames.map((rename) => [
    projectSymbolRenameKey(rename.sourcePath, rename.fromName, rename.toName),
    rename
  ]));
  const classifications = [];
  const seen = new Set();
  for (const importRename of importRenames) {
    const exportSourcePath = resolveProjectModuleSpecifier(importRename.sourcePath, importRename.moduleSpecifier, sourcePaths);
    if (!exportSourcePath || exportSourcePath === importRename.sourcePath) continue;
    const exportRename = exportsByPathAndName.get(projectSymbolRenameKey(exportSourcePath, importRename.fromName, importRename.toName));
    if (!exportRename) continue;
    const proofKey = projectSymbolRenameKey(exportRename.sourcePath, exportRename.fromName, exportRename.toName);
    const classification = projectSymbolRenameClassification(branch, exportRename, importRename, defaultAdmissionProofs.get(proofKey));
    if (seen.has(classification.details.conflictKey)) continue;
    seen.add(classification.details.conflictKey);
    classifications.push(classification);
  }
  return classifications;
}

function projectSymbolRenameLedgers(file, input, branch, branchSourceText) {
  const context = createMergeContext({
    id: `project_symbol_rename_${branch}_${safeId(file.sourcePath)}`,
    sourcePath: file.sourcePath,
    language: file.language ?? input.language ?? 'typescript'
  });
  const base = scanJsTsTopLevelLedger(file.baseSourceText, 'base', context);
  const branchLedger = scanJsTsTopLevelLedger(branchSourceText, branch, context);
  if (!context.conflicts.length) {
    validateLedgerUniqueness(base, context);
    validateLedgerUniqueness(branchLedger, context);
  }
  return context.conflicts.length ? undefined : { base, branch: branchLedger };
}

function exportedNameRenameCandidate(file, branch, base, branchLedger) {
  const baseNames = exportedNamesByName(base);
  const branchNames = exportedNamesByName(branchLedger);
  const removedNames = [...baseNames.keys()].filter((name) => !branchNames.has(name));
  const addedNames = [...branchNames.keys()].filter((name) => !baseNames.has(name));
  if (removedNames.length !== 1 || addedNames.length !== 1) return undefined;
  const fromName = removedNames[0];
  const toName = addedNames[0];
  if (!renameableProjectSymbolName(fromName) || !renameableProjectSymbolName(toName)) return undefined;
  return {
    kind: 'export-symbol-rename',
    branch,
    sourcePath: file.sourcePath,
    fromName,
    toName,
    fromEntries: baseNames.get(fromName),
    toEntries: branchNames.get(toName)
  };
}

function importedNameRenameCandidates(file, branch, base, branchLedger) {
  const baseImports = importSpecifiersByModule(base);
  const branchImports = importSpecifiersByModule(branchLedger);
  const moduleKeys = uniqueStrings([...baseImports.keys(), ...branchImports.keys()]);
  return moduleKeys.flatMap((moduleKey) => {
    const baseSpecifiers = baseImports.get(moduleKey) ?? [];
    const branchSpecifiers = branchImports.get(moduleKey) ?? [];
    const baseNames = new Set(baseSpecifiers.map((specifier) => specifier.importedName));
    const branchNames = new Set(branchSpecifiers.map((specifier) => specifier.importedName));
    const removedNames = [...baseNames].filter((name) => !branchNames.has(name));
    const addedNames = [...branchNames].filter((name) => !baseNames.has(name));
    if (removedNames.length !== 1 || addedNames.length !== 1) return [];
    const fromName = removedNames[0];
    const toName = addedNames[0];
    if (!renameableProjectSymbolName(fromName) || !renameableProjectSymbolName(toName)) return [];
    const fromSpecifier = baseSpecifiers.find((specifier) => specifier.importedName === fromName);
    const toSpecifier = branchSpecifiers.find((specifier) => specifier.importedName === toName);
    if (!fromSpecifier || !toSpecifier) return [];
    return [{
      kind: 'import-symbol-rename',
      branch,
      sourcePath: file.sourcePath,
      moduleSpecifier: fromSpecifier.moduleSpecifier,
      fromName,
      toName,
      fromLocalName: fromSpecifier.localName,
      toLocalName: toSpecifier.localName,
      typeOnly: fromSpecifier.typeOnly === true || toSpecifier.typeOnly === true
    }];
  });
}

function exportedNamesByName(ledger) {
  const result = new Map();
  for (const entry of ledger?.entries ?? []) {
    const exported = entry.kind === 'export' || entry.declarationInfo?.exported === true;
    if (!exported) continue;
    for (const name of entry.names ?? []) {
      if (!renameableProjectSymbolName(name)) continue;
      const entries = result.get(name) ?? [];
      entries.push(entry);
      result.set(name, entries);
    }
  }
  return result;
}

function importSpecifiersByModule(ledger) {
  const result = new Map();
  for (const entry of ledger?.entries ?? []) {
    if (entry.kind !== 'import' || !entry.importInfo?.moduleSpecifier) continue;
    for (const specifier of entry.importInfo.specifiers ?? []) {
      const importedName = specifier.importedName;
      if (!renameableProjectSymbolName(importedName)) continue;
      const record = {
        moduleSpecifier: entry.importInfo.moduleSpecifier,
        importedName,
        localName: specifier.localName,
        typeOnly: entry.importInfo.typeOnly === true || specifier.typeOnly === true
      };
      const key = importSpecifierModuleKey(record);
      const entries = result.get(key) ?? [];
      entries.push(record);
      result.set(key, entries);
    }
  }
  return result;
}

function projectSymbolRenameClassification(branch, exportRename, importRename, defaultAdmissionProof) {
  const code = `project-${branch}-cross-file-symbol-rename-blocked`;
  return {
    kind: 'cross-file-symbol-rename',
    branch,
    code,
    operation: `blocked-${branch}-cross-file-symbol-rename`,
    sourcePaths: uniqueStrings([exportRename.sourcePath, importRename.sourcePath]),
    details: compactRecord({
      reasonCode: code,
      conflictKey: [
        'project-symbol-rename',
        branch,
        exportRename.sourcePath,
        exportRename.fromName,
        exportRename.toName,
        importRename.sourcePath,
        importRename.moduleSpecifier
      ].join('#'),
      branch,
      symbolRenameKind: 'cross-file-export-import-rename',
      fromName: exportRename.fromName,
      toName: exportRename.toName,
      exportSourcePath: exportRename.sourcePath,
      importSourcePath: importRename.sourcePath,
      moduleSpecifier: importRename.moduleSpecifier,
      importFromLocalName: importRename.fromLocalName,
      importToLocalName: importRename.toLocalName,
      importTypeOnly: importRename.typeOnly || undefined,
      observedEvidence: ['export-symbol-rename', 'import-specifier-rename'],
      requiredEvidence: projectSymbolRenameRequiredEvidence,
      defaultAdmissionProof
    })
  };
}

function blockedProjectSymbolRenameFile(file, input, classifications) {
  const language = file.language ?? input.language ?? 'typescript';
  const worker = file.workerDeleted ? undefined : file.workerSourceText ?? file.baseSourceText;
  const head = file.headDeleted ? undefined : file.headSourceText ?? file.baseSourceText;
  const typeScriptRefactorAdmissionEvidence = typeScriptRefactorEvidenceRecordsFromClassifications(classifications);
  const conflicts = classifications.map((classification) => ({
    code: classification.code,
    gateId: 'project-symbol-rename-classifier',
    message: classification.code === TypeScriptRefactorEvidenceMissingCode
      ? `Project ${classification.branch} cross-file symbol rename requires caller-supplied TypeScript refactor reference evidence.`
      : `Project ${classification.branch} cross-file symbol rename requires import/export rewrite, diagnostics, and declaration evidence.`,
    sourcePath: file.sourcePath,
    details: compactRecord({ ...classification.details, sourcePath: file.sourcePath })
  }));
  const reasonCodes = uniqueStrings(classifications.map((classification) => classification.code));
  const conflictKeys = uniqueStrings(conflicts.map((conflict) => conflict.details?.conflictKey));
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language,
    status: 'blocked',
    operation: classifications[0]?.operation ?? 'blocked-project-symbol-rename',
    baseHash: hashText(file.baseSourceText),
    workerHash: hashText(worker),
    headHash: hashText(head),
    conflicts,
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes,
      conflictKeys
    },
    summary: compactRecord({
      conflicts: conflicts.length,
      typeScriptRefactorAdmissionEvidence: nonEmptyArray(typeScriptRefactorAdmissionEvidence),
      projectSymbolRenameClassifications: classifications.map((classification) => classification.details)
    }),
    conflictKeys
  });
}

function applyProjectSymbolRenameClassifications(fileResults, files, input, projectSymbolRenames) {
  if (!projectSymbolRenames?.byPath?.size) return fileResults;
  const filesByPath = new Map(files.map((file) => [file.sourcePath, file]));
  const admissions = [];
  const applied = fileResults.map((fileResult) => {
    const classifications = projectSymbolRenames.byPath.get(fileResult.sourcePath);
    const file = filesByPath.get(fileResult.sourcePath);
    const evidenceClassifications = classifications?.length
      ? withTypeScriptRefactorEvidence(input, classifications, files)
      : classifications;
    const admission = evidenceClassifications?.length && file
      ? maybeAdmitProjectSymbolRenameFile(fileResult, file, input, evidenceClassifications)
      : undefined;
    if (admission) admissions.push(...admission.admissions);
    return admission?.fileResult ?? (evidenceClassifications?.length && file ? blockedProjectSymbolRenameFile(file, input, evidenceClassifications) : fileResult);
  });
  projectSymbolRenames.admissionSummary = projectSymbolRenameAdmissionSummary(admissions);
  return applied;
}

function projectSymbolRenameSummary(classifications) {
  return {
    classifications: classifications.length,
    crossFileSymbolRenames: classifications.filter((classification) => classification.kind === 'cross-file-symbol-rename').length,
    reasonCodes: uniqueStrings(classifications.map((classification) => classification.code))
  };
}

function branchStageSourceText(file, branch) {
  if (branch === 'worker') return file.workerDeleted ? undefined : file.workerSourceText ?? file.baseSourceText;
  return file.headDeleted ? undefined : file.headSourceText ?? file.baseSourceText;
}

function projectSymbolRenameKey(sourcePath, fromName, toName) { return [sourcePath, fromName, toName].join('\u0000'); }
function importSpecifierModuleKey(specifier) { return [specifier.moduleSpecifier, specifier.typeOnly ? 'type' : 'value'].join('\u0000'); }

function renameableProjectSymbolName(name) {
  return typeof name === 'string' && name.length > 0 && name !== 'default' && name !== '*';
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

function hashText(text) { return typeof text === 'string' ? hashSemanticValue(text) : undefined; }
function safeId(value) { return String(value ?? 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'file'; }
function dirname(path) { const text = String(path ?? ''); const slash = text.lastIndexOf('/'); return slash === -1 ? '' : text.slice(0, slash); }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { applyProjectSymbolRenameClassifications, blockedProjectSymbolRenameFile, classifyProjectSymbolRenames };
