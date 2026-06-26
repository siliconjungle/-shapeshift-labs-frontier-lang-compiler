import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import {
  TypeScriptRefactorEvidenceMissingCode,
  typeScriptRefactorEvidenceRecordsFromClassifications,
  withTypeScriptRefactorEvidence
} from './internal/index-impl/typeScriptCompilerFacts.js';
import { classifyProjectSymbolMoves } from './js-ts-safe-project-merge-symbol-move.js';
import { maybeAdmitProjectSymbolMoveFile, projectSymbolMoveAdmissionSummary } from './js-ts-safe-project-merge-symbol-move-admission.js';

const requiredEvidence = [
  'path-lineage-evidence',
  'import-export-rewrite-evidence',
  'output-diagnostics-gate',
  'output-declaration-gate'
];

function classifyProjectMoveRenames(files, input = {}, projectId = 'js_ts_project_safe_merge') {
  const fileMoveRenames = [
    ...classifyBranchMoveRenames(files, 'worker'),
    ...classifyBranchMoveRenames(files, 'head')
  ];
  const classifications = [
    ...fileMoveRenames,
    ...classifyProjectSymbolMoves(input, files, projectId, fileMoveRenames)
  ];
  const byPath = new Map();
  for (const classification of classifications) {
    for (const sourcePath of classification.sourcePaths) {
      const entries = byPath.get(sourcePath) ?? [];
      entries.push(classification);
      byPath.set(sourcePath, entries);
    }
  }
  return { classifications, byPath, summary: projectMoveRenameSummary(classifications) };
}

function applyProjectMoveRenameClassifications(fileResults, projectMoveRenames, files = [], input = {}) {
  if (!projectMoveRenames?.byPath?.size) return fileResults;
  const filesByPath = new Map(files.map((file) => [file.sourcePath, file]));
  const admissions = [];
  const applied = fileResults.map((fileResult) => {
    const classifications = projectMoveRenames.byPath.get(fileResult.sourcePath);
    const file = filesByPath.get(fileResult.sourcePath);
    const evidenceClassifications = classifications?.length
      ? withTypeScriptRefactorEvidence(input, classifications, files)
      : classifications;
    const admission = evidenceClassifications?.length && file
      ? maybeAdmitProjectSymbolMoveFile(fileResult, file, input, evidenceClassifications)
      : undefined;
    if (admission) admissions.push(...admission.admissions);
    return admission?.fileResult ?? (evidenceClassifications?.length ? blockedMoveRenameFile(fileResult, evidenceClassifications) : fileResult);
  });
  projectMoveRenames.admissionSummary = projectSymbolMoveAdmissionSummary(admissions);
  return applied;
}

function classifyBranchMoveRenames(files, branch) {
  const sourceField = branch === 'worker' ? 'workerSourceText' : 'headSourceText';
  const deletedFlag = branch === 'worker' ? 'workerDeleted' : 'headDeleted';
  const otherSourceField = branch === 'worker' ? 'headSourceText' : 'workerSourceText';
  const deleted = files
    .filter((file) => typeof file.baseSourceText === 'string' && file[deletedFlag] === true)
    .map((file) => ({ file, hash: hashText(file.baseSourceText) }))
    .sort((left, right) => comparePath(left.file.sourcePath, right.file.sourcePath));
  const addedByHash = new Map();
  for (const file of files) {
    if (typeof file.baseSourceText === 'string' || typeof file[sourceField] !== 'string') continue;
    if (typeof file[otherSourceField] === 'string') continue;
    const hash = hashText(file[sourceField]);
    const entries = addedByHash.get(hash) ?? [];
    entries.push(file);
    addedByHash.set(hash, entries);
  }
  const used = new Set();
  const results = [];
  for (const deletion of deleted) {
    const candidates = (addedByHash.get(deletion.hash) ?? []).filter((file) => !used.has(file.sourcePath));
    if (candidates.length !== 1) continue;
    const added = candidates[0];
    used.add(added.sourcePath);
    results.push(fileMoveRenameClassification(branch, deletion.file, added, deletion.hash));
  }
  return results;
}

function fileMoveRenameClassification(branch, fromFile, toFile, sourceHash) {
  const code = `project-${branch}-file-move-rename-blocked`;
  return {
    kind: 'file-move-rename',
    branch,
    code,
    operation: `blocked-${branch}-file-move-rename`,
    sourcePaths: uniqueStrings([fromFile.sourcePath, toFile.sourcePath]),
    details: compactRecord({
      reasonCode: code,
      conflictKey: `project-file-move-rename#${branch}#${fromFile.sourcePath}#${toFile.sourcePath}#${sourceHash}`,
      branch,
      fromSourcePath: fromFile.sourcePath,
      toSourcePath: toFile.sourcePath,
      movementKind: movementKind(fromFile.sourcePath, toFile.sourcePath),
      sourceHash,
      requiredEvidence
    })
  };
}

function blockedMoveRenameFile(fileResult, classifications) {
  const typeScriptRefactorAdmissionEvidence = typeScriptRefactorEvidenceRecordsFromClassifications(classifications);
  const conflicts = classifications.map((classification) => ({
    code: classification.code,
    gateId: 'project-move-rename-classifier',
    message: classifierMessage(classification),
    sourcePath: fileResult.sourcePath,
    details: compactRecord({
      ...classification.details,
      sourcePath: fileResult.sourcePath,
      pathRole: classification.pathRoles?.[fileResult.sourcePath]
    })
  }));
  const reasonCodes = uniqueStrings(classifications.map((classification) => classification.code));
  const conflictKeys = uniqueStrings([
    ...(fileResult.conflictKeys ?? []),
    ...conflicts.map((conflict) => conflict.details?.conflictKey)
  ]);
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: fileResult.sourcePath,
    language: fileResult.language,
    status: 'blocked',
    operation: blockedOperation(classifications),
    baseHash: fileResult.baseHash,
    workerHash: fileResult.workerHash,
    headHash: fileResult.headHash,
    result: fileResult.result,
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
      ...(isPlainObject(fileResult.summary) ? fileResult.summary : {}),
      conflicts: conflicts.length,
      typeScriptRefactorAdmissionEvidence: nonEmptyArray(typeScriptRefactorAdmissionEvidence),
      projectMoveRenameClassifications: classifications.map((classification) => classification.details)
    }),
    conflictKeys
  });
}

function projectMoveRenameSummary(classifications) {
  return {
    classifications: classifications.length,
    fileMoveRenames: classifications.filter((classification) => classification.kind === 'file-move-rename').length,
    symbolMoves: classifications.filter((classification) => classification.kind === 'exported-symbol-move' || classification.kind === 'imported-symbol-move').length,
    exportedSymbolMoves: classifications.filter((classification) => classification.kind === 'exported-symbol-move').length,
    importedSymbolMoves: classifications.filter((classification) => classification.kind === 'imported-symbol-move').length,
    reasonCodes: uniqueStrings(classifications.map((classification) => classification.code))
  };
}

function classifierMessage(classification) {
  if (classification.code === TypeScriptRefactorEvidenceMissingCode) {
    return `Project ${classification.branch} symbol move requires caller-supplied TypeScript refactor reference evidence.`;
  }
  if (classification.kind === 'exported-symbol-move') {
    return `Project ${classification.branch} exported symbol move requires lineage, import/export rewrite, diagnostics, and declaration evidence.`;
  }
  if (classification.kind === 'imported-symbol-move') {
    return `Project ${classification.branch} imported symbol move requires lineage, import/export rewrite, diagnostics, and declaration evidence.`;
  }
  return `Project ${classification.branch} file move/rename requires path lineage, rewrite, diagnostics, and declaration evidence.`;
}

function blockedOperation(classifications) {
  const operations = uniqueStrings(classifications.map((classification) => classification.operation));
  return operations.length === 1 ? operations[0] : 'blocked-project-move-rename';
}

function movementKind(fromPath, toPath) {
  const fromName = String(fromPath ?? '').split('/').pop();
  const toName = String(toPath ?? '').split('/').pop();
  if (fromName === toName) return 'move';
  if (dirname(fromPath) === dirname(toPath)) return 'rename';
  return 'move-rename';
}

function dirname(path) {
  const text = String(path ?? '');
  const slash = text.lastIndexOf('/');
  return slash === -1 ? '' : text.slice(0, slash);
}

function hashText(text) { return typeof text === 'string' ? hashSemanticValue(text) : undefined; }
function comparePath(left, right) { return String(left ?? '').localeCompare(String(right ?? '')); }
function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { applyProjectMoveRenameClassifications, classifyProjectMoveRenames };
