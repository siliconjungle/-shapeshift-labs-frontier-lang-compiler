import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeJsTsSource } from './js-ts-safe-merge-composed.js';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { createJsTsProjectSafeMergeGraphArtifacts, createJsTsProjectSafeMergeGraphDelta } from './js-ts-safe-project-merge-graph.js';
import { addProjectGraphDeltaConflictSummary } from './js-ts-safe-project-merge-graph-delta-conflicts.js';
import { outputProjectGraphConflicts, projectGraphDeltaConflicts } from './js-ts-safe-project-merge-graph-conflicts.js';

function safeMergeJsTsProject(input = {}) {
  const id = String(input.id ?? 'js_ts_project_safe_merge');
  const files = normalizeProjectFiles(input);
  const fileResults = files.map((file) => mergeProjectFile(file, input, id));
  const blockedFiles = fileResults.filter((file) => file.status === 'blocked');
  const outputFiles = fileResults
    .filter((file) => typeof file.outputSourceText === 'string')
    .map((file) => compactRecord({
      sourcePath: file.sourcePath,
      language: file.language,
      sourceText: file.outputSourceText,
      sourceHash: file.outputHash,
      operation: file.operation
    }));
  const projectGraphDelta = blockedFiles.length === 0 && input.includeProjectGraphDelta
    ? createJsTsProjectSafeMergeGraphDelta(input, files, outputFiles, id)
    : undefined;
  const graphArtifacts = projectGraphDelta?.stages?.output ?? (blockedFiles.length === 0 && input.includeOutputProjectSymbolGraph
    ? createJsTsProjectSafeMergeGraphArtifacts(input, outputFiles, id)
    : undefined);
  const outputGraphConflicts = outputProjectGraphConflicts(projectGraphDelta ? graphArtifacts?.projectSymbolGraph : graphArtifacts);
  const deltaGraphConflicts = projectGraphDeltaConflicts(projectGraphDelta);
  const projectGraphDeltaWithConflicts = addProjectGraphDeltaConflictSummary(projectGraphDelta, deltaGraphConflicts);
  const graphConflicts = [...outputGraphConflicts, ...deltaGraphConflicts];
  const status = blockedFiles.length || graphConflicts.length ? 'blocked' : 'merged';
  const reasonCodes = uniqueStrings([
    ...blockedFiles.flatMap((file) => file.admission.reasonCodes),
    ...graphConflicts.map((conflict) => conflict.code)
  ]);
  const conflictKeys = uniqueStrings([
    ...fileResults.flatMap((file) => file.conflictKeys),
    ...graphConflicts.map((conflict) => conflict.details?.conflictKey)
  ]);
  const core = {
    kind: 'frontier.lang.jsTsProjectSafeMerge',
    version: 1,
    schema: 'frontier.lang.jsTsProjectSafeMerge.v1',
    id,
    status,
    files: fileResults,
    outputFiles,
    outputProjectImport: graphArtifacts?.projectImport,
    outputProjectSymbolGraph: graphArtifacts?.projectSymbolGraph,
    projectGraphDelta: projectGraphDeltaWithConflicts,
    conflicts: [...fileResults.flatMap((file) => file.conflicts), ...graphConflicts],
    admission: {
      status: status === 'merged' ? 'auto-merge-candidate' : 'blocked',
      action: status === 'merged' ? 'apply-project' : 'human-review',
      reviewRequired: status !== 'merged',
      autoApplyCandidate: status === 'merged',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes,
      conflictKeys
    },
    summary: projectSummary(fileResults, graphConflicts, Boolean(projectGraphDelta)),
    metadata: compactRecord({
      workerChangeSetId: input.workerChangeSetId,
      headChangeSetId: input.headChangeSetId,
      projectRoot: input.projectRoot,
      filesInput: Array.isArray(input.files) ? 'records' : 'maps',
      outputProjectSymbolGraph: Boolean(graphArtifacts?.projectSymbolGraph),
      projectGraphDelta: Boolean(projectGraphDeltaWithConflicts),
      projectGraphConflicts: graphConflicts.length || undefined,
      outputProjectGraphConflicts: outputGraphConflicts.length || undefined,
      projectGraphDeltaConflicts: deltaGraphConflicts.length || undefined,
      projectGraphLimitConflicts: graphConflicts.filter((conflict) => conflict.gateId === 'project-graph-limit').length || undefined,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function mergeProjectFile(file, input, projectId) {
  const base = file.baseSourceText;
  const worker = file.workerDeleted ? undefined : file.workerSourceText ?? base;
  const head = file.headDeleted ? undefined : file.headSourceText ?? base;
  const context = { sourcePath: file.sourcePath, language: file.language ?? input.language ?? 'typescript' };
  if (!file.sourcePath) return blockedFile(file, context, 'missing-source-path');
  if (base === undefined && worker === undefined && head !== undefined) {
    return syntheticFile(file, context, head, 'head-only');
  }
  if (base === undefined && worker !== undefined && head === undefined) {
    return input.allowFileAdditions === false
      ? blockedFile(file, context, 'worker-file-addition-disabled')
      : syntheticFile(file, context, worker, 'worker-added');
  }
  if (base === undefined && worker !== undefined && head !== undefined) {
    return worker === head
      ? syntheticFile(file, context, worker, 'both-added-identical')
      : blockedFile(file, context, 'file-add-conflict');
  }
  if (base !== undefined && worker === undefined) {
    return input.allowFileDeletes
      ? syntheticFile(file, context, undefined, 'worker-deleted')
      : blockedFile(file, context, 'worker-file-delete-blocked');
  }
  if (base !== undefined && head === undefined) {
    return worker === base
      ? syntheticFile(file, context, undefined, 'head-deleted-worker-unchanged')
      : blockedFile(file, context, 'head-file-delete-conflict');
  }
  const result = safeMergeJsTsSource({
    ...input,
    ...context,
    deferReExportIdentityConflictsToProjectGraph: input.includeProjectGraphDelta === true,
    id: `${projectId}_${safeId(file.sourcePath)}`,
    baseSourceText: base,
    workerSourceText: worker,
    headSourceText: head,
    sourceLedgers: sourceLedgersForFile(input, file.sourcePath),
    policy: file.policy ?? file.mergePolicy ?? policyForFile(input, file.sourcePath)
  });
  if (result.status !== 'merged') return mergeBlockedFile(file, context, result);
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'merged',
    operation: result.summary.memberAdditions ? 'merged-source-and-members' : 'merged-source',
    outputSourceText: result.mergedSourceText,
    outputHash: hashText(result.mergedSourceText),
    baseHash: hashText(base),
    workerHash: hashText(worker),
    headHash: hashText(head),
    result,
    semanticArtifacts: result.semanticArtifacts,
    conflicts: [],
    admission: result.admission,
    summary: result.summary,
    conflictKeys: [`source#${file.sourcePath}`]
  });
}

function mergeBlockedFile(file, context, result) {
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'blocked',
    operation: 'blocked-merge',
    result,
    conflicts: result.conflicts ?? [],
    admission: result.admission,
    summary: result.summary,
    conflictKeys: [`source#${file.sourcePath}`]
  });
}

function syntheticFile(file, context, sourceText, operation) {
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'merged',
    operation,
    outputSourceText: sourceText,
    outputHash: hashText(sourceText),
    baseHash: hashText(file.baseSourceText),
    workerHash: hashText(file.workerSourceText),
    headHash: hashText(file.headSourceText),
    conflicts: [],
    admission: admittedSyntheticAdmission(operation),
    summary: { conflicts: 0, synthetic: true },
    conflictKeys: [`source#${file.sourcePath}`]
  });
}

function blockedFile(file, context, reasonCode) {
  const conflict = {
    code: reasonCode,
    gateId: 'project-file-presence',
    message: `Project file cannot be safely merged: ${reasonCode}.`,
    sourcePath: file.sourcePath,
    details: { sourcePath: file.sourcePath }
  };
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: file.sourcePath,
    language: context.language,
    status: 'blocked',
    operation: 'blocked-file-presence',
    conflicts: [conflict],
    admission: blockedAdmission(reasonCode),
    summary: { conflicts: 1, synthetic: true },
    conflictKeys: [`source#${file.sourcePath ?? 'unknown'}`]
  });
}

function normalizeProjectFiles(input) {
  if (Array.isArray(input.files)) return input.files.map(normalizeFileRecord).sort(bySourcePath);
  const base = normalizeFileMap(input.baseFiles);
  const worker = normalizeFileMap(input.workerFiles);
  const head = normalizeFileMap(input.headFiles);
  const paths = [...new Set([...base.keys(), ...worker.keys(), ...head.keys()])].sort();
  return paths.map((sourcePath) => normalizeFileRecord({
    sourcePath,
    baseSourceText: base.get(sourcePath),
    workerSourceText: worker.get(sourcePath),
    headSourceText: head.get(sourcePath)
  }));
}

function normalizeFileRecord(record = {}) {
  return {
    sourcePath: record.sourcePath ?? record.path,
    language: record.language,
    baseSourceText: stringOrUndefined(record.baseSourceText ?? record.baseText),
    workerSourceText: stringOrUndefined(record.workerSourceText ?? record.workerText),
    headSourceText: stringOrUndefined(record.headSourceText ?? record.headText),
    workerDeleted: record.workerDeleted === true,
    headDeleted: record.headDeleted === true,
    policy: record.policy,
    mergePolicy: record.mergePolicy
  };
}

function normalizeFileMap(value) {
  const map = new Map();
  if (!value) return map;
  if (value instanceof Map) {
    for (const [sourcePath, sourceText] of value) map.set(String(sourcePath), String(sourceText));
    return map;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!entry?.sourcePath && !entry?.path) continue;
      map.set(String(entry.sourcePath ?? entry.path), String(entry.sourceText ?? entry.text ?? ''));
    }
    return map;
  }
  for (const [sourcePath, sourceText] of Object.entries(value)) map.set(sourcePath, String(sourceText));
  return map;
}

function policyForFile(input, sourcePath) {
  if (input.policyByPath?.[sourcePath]) return input.policyByPath[sourcePath];
  if (input.mergePolicyByPath?.[sourcePath]) return input.mergePolicyByPath[sourcePath];
  return input.policy ?? input.mergePolicy;
}

function sourceLedgersForFile(input, sourcePath) {
  const byPath = input.sourceLedgersByPath?.[sourcePath] ?? input.sourceLedgers?.[sourcePath];
  return byPath ?? (input.sourceLedgers?.base || input.sourceLedgers?.worker || input.sourceLedgers?.head ? input.sourceLedgers : undefined);
}

function projectSummary(files, graphConflicts = [], hasProjectGraphDelta = false) {
  const byOperation = {};
  for (const file of files) byOperation[file.operation] = (byOperation[file.operation] ?? 0) + 1;
  const limitConflicts = graphConflicts.filter((conflict) => conflict.gateId === 'project-graph-limit');
  const deltaConflicts = graphConflicts.filter((conflict) => conflict.gateId === 'project-graph-delta' || (hasProjectGraphDelta && conflict.gateId === 'project-graph-limit'));
  const outputConflicts = graphConflicts.filter((conflict) => conflict.gateId === 'project-symbol-graph' || (!hasProjectGraphDelta && conflict.gateId === 'project-graph-limit'));
  return {
    files: files.length,
    mergedFiles: files.filter((file) => file.status === 'merged').length,
    blockedFiles: files.filter((file) => file.status === 'blocked').length,
    outputFiles: files.filter((file) => typeof file.outputSourceText === 'string').length,
    projectGraphConflicts: graphConflicts.length,
    outputProjectGraphConflicts: outputConflicts.length,
    projectGraphDeltaConflicts: deltaConflicts.length,
    projectGraphLimitConflicts: limitConflicts.length,
    projectGraphPublicContractConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-public-contract-delta-conflict').length,
    projectGraphReExportIdentityConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-re-export-identity-delta-conflict').length,
    projectGraphImportTargetConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-import-target-delta-conflict').length,
    semanticArtifactFiles: files.filter((file) => file.semanticArtifacts).length,
    operations: byOperation
  };
}

function admittedSyntheticAdmission(operation) {
  return {
    status: 'auto-merge-candidate',
    action: operation === 'head-only' ? 'preserve-head' : 'apply',
    reviewRequired: false,
    autoApplyCandidate: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: []
  };
}

function blockedAdmission(reasonCode) {
  return {
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: [reasonCode]
  };
}

function hashText(text) { return typeof text === 'string' ? hashSemanticValue(text) : undefined; }

function stringOrUndefined(value) { return typeof value === 'string' ? value : undefined; }

function safeId(value) {
  return String(value ?? 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'file';
}

function bySourcePath(left, right) { return String(left.sourcePath ?? '').localeCompare(String(right.sourcePath ?? '')); }

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { safeMergeJsTsProject };
