import { compactRecord } from './js-ts-safe-merge-context.js';
import {
  classMergeClassification,
  classSplitClassification,
  classificationSummaryRecord,
  classifiedOperation,
  moduleMergeClassification,
  moduleSplitClassification,
  splitMergeConflictForPath
} from './js-ts-safe-project-merge-split-merge-records.js';
import {
  changedBaseClasses,
  changedBaseModules,
  changedBranchClasses,
  changedBranchModules,
  classMemberOverlap,
  moduleItemOverlap,
  sameClassIdentity,
  sameIdentityCandidateCoversAllClassMembers,
  samePathCandidateCoversAllModuleItems,
  stageFileShape
} from './js-ts-safe-project-merge-split-merge-shapes.js';
import {
  allowsProjectSplitMerge,
  hasProjectSplitMergeAdmissionEvidence,
  maybeAdmitProjectSplitMergeFile,
  projectSplitMergeAdmissionSummary
} from './js-ts-safe-project-merge-split-merge-admission.js';

function classifyProjectSplitMerges(files) {
  const classifications = uniqueClassifications([
    ...classifyBranchSplitMerges(files, 'worker'),
    ...classifyBranchSplitMerges(files, 'head')
  ]);
  const byPath = new Map();
  for (const classification of classifications) {
    for (const sourcePath of classification.sourcePaths) {
      const entries = byPath.get(sourcePath) ?? [];
      entries.push(classification);
      byPath.set(sourcePath, entries);
    }
  }
  return { classifications, byPath, summary: projectSplitMergeSummary(classifications) };
}

function applyProjectSplitMergeClassifications(fileResults, projectSplitMerges, files = [], input = {}) {
  if (!projectSplitMerges?.byPath?.size) return fileResults;
  const filesByPath = new Map(files.map((file) => [file.sourcePath, file]));
  const admissions = [];
  const applied = fileResults.map((fileResult) => {
    const classifications = projectSplitMerges.byPath.get(fileResult.sourcePath);
    const file = filesByPath.get(fileResult.sourcePath);
    const admission = classifications?.length && file
      ? maybeAdmitProjectSplitMergeFile(fileResult, file, input, classifications)
      : undefined;
    if (admission) admissions.push(...admission.admissions);
    return admission?.fileResult ?? (classifications?.length ? blockedSplitMergeFile(fileResult, classifications, file, input) : fileResult);
  });
  projectSplitMerges.admissionSummary = projectSplitMergeAdmissionSummary(admissions);
  return applied;
}

function classifyBranchSplitMerges(files, branch) {
  const stageFiles = files.map((file) => stageFileShape(file, branch)).filter((file) => file.sourcePath);
  return [
    ...classifyModuleSplits(stageFiles, branch),
    ...classifyModuleMerges(stageFiles, branch),
    ...classifyClassSplits(stageFiles, branch),
    ...classifyClassMerges(stageFiles, branch)
  ];
}

function classifyModuleSplits(stageFiles, branch) {
  const baseModules = changedBaseModules(stageFiles).filter((file) => file.baseShape.moduleItems.length >= 2);
  const branchModules = changedBranchModules(stageFiles).filter((file) => file.branchShape.moduleItems.length >= 1);
  const results = [];
  for (const baseModule of baseModules) {
    const candidates = branchModules
      .map((branchModule) => ({ file: branchModule, overlap: moduleItemOverlap(baseModule.baseShape, branchModule.branchShape) }))
      .filter((candidate) => candidate.overlap.length > 0);
    if (candidates.length < 2) continue;
    if (!candidates.some((candidate) => candidate.file.sourcePath !== baseModule.sourcePath)) continue;
    if (samePathCandidateCoversAllModuleItems(baseModule, candidates)) continue;
    const movedItems = uniqueStrings(candidates.flatMap((candidate) => candidate.overlap));
    if (movedItems.length >= 2) results.push(moduleSplitClassification(branch, baseModule, candidates, movedItems));
  }
  return results;
}

function classifyModuleMerges(stageFiles, branch) {
  const baseModules = changedBaseModules(stageFiles).filter((file) => file.baseShape.moduleItems.length >= 1);
  const branchModules = changedBranchModules(stageFiles).filter((file) => file.branchShape.moduleItems.length >= 2);
  const results = [];
  for (const branchModule of branchModules) {
    const candidates = baseModules
      .map((baseModule) => ({ file: baseModule, overlap: moduleItemOverlap(baseModule.baseShape, branchModule.branchShape) }))
      .filter((candidate) => candidate.overlap.length > 0);
    if (candidates.length < 2) continue;
    if (!candidates.some((candidate) => candidate.file.sourcePath !== branchModule.sourcePath)) continue;
    const movedItems = uniqueStrings(candidates.flatMap((candidate) => candidate.overlap));
    if (movedItems.length >= 2) results.push(moduleMergeClassification(branch, branchModule, candidates, movedItems));
  }
  return results;
}

function classifyClassSplits(stageFiles, branch) {
  const baseClasses = changedBaseClasses(stageFiles).filter((record) => record.classRecord.members.length >= 2);
  const branchClasses = changedBranchClasses(stageFiles).filter((record) => record.classRecord.members.length >= 1);
  const results = [];
  for (const baseClass of baseClasses) {
    const candidates = branchClasses
      .filter((branchClass) => !sameClassIdentity(baseClass, branchClass))
      .map((branchClass) => ({ record: branchClass, overlap: classMemberOverlap(baseClass.classRecord, branchClass.classRecord) }))
      .filter((candidate) => candidate.overlap.length > 0);
    if (candidates.length < 2) continue;
    if (sameIdentityCandidateCoversAllClassMembers(baseClass, branchClasses)) continue;
    const movedMembers = uniqueStrings(candidates.flatMap((candidate) => candidate.overlap));
    if (movedMembers.length >= 2) results.push(classSplitClassification(branch, baseClass, candidates, movedMembers));
  }
  return results;
}

function classifyClassMerges(stageFiles, branch) {
  const baseClasses = changedBaseClasses(stageFiles).filter((record) => record.classRecord.members.length >= 1);
  const branchClasses = changedBranchClasses(stageFiles).filter((record) => record.classRecord.members.length >= 2);
  const results = [];
  for (const branchClass of branchClasses) {
    const candidates = baseClasses
      .filter((baseClass) => !sameClassIdentity(baseClass, branchClass))
      .map((baseClass) => ({ record: baseClass, overlap: classMemberOverlap(baseClass.classRecord, branchClass.classRecord) }))
      .filter((candidate) => candidate.overlap.length > 0);
    const movedMembers = uniqueStrings(candidates.flatMap((candidate) => candidate.overlap));
    if (candidates.length >= 2 && movedMembers.length >= 2) results.push(classMergeClassification(branch, branchClass, candidates, movedMembers));
  }
  return results;
}

function blockedSplitMergeFile(fileResult, classifications, file, input) {
  const conflicts = classifications.map((classification) => splitMergeConflictForPath(
    classification,
    fileResult.sourcePath,
    splitMergeAdmissionBlockerDetails(classification, file, input)
  ));
  const reasonCodes = uniqueStrings(classifications.map((classification) => classification.code));
  const conflictKeys = uniqueStrings([...(fileResult.conflictKeys ?? []), ...conflicts.map((conflict) => conflict.details?.conflictKey)]);
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile',
    version: 1,
    sourcePath: fileResult.sourcePath,
    language: fileResult.language,
    status: 'blocked',
    operation: classifiedOperation(classifications),
    baseHash: fileResult.baseHash,
    workerHash: fileResult.workerHash,
    headHash: fileResult.headHash,
    result: fileResult.result,
    conflicts,
    admission: blockedAdmission(reasonCodes, conflictKeys),
    summary: compactRecord({ ...(isPlainObject(fileResult.summary) ? fileResult.summary : {}), conflicts: conflicts.length, projectSplitMergeClassification: true, projectSplitMergeClassifications: classifications.map(classificationSummaryRecord) }),
    conflictKeys
  });
}

function blockedAdmission(reasonCodes, conflictKeys) {
  return { status: 'blocked', action: 'human-review', reviewRequired: true, autoApplyCandidate: false, autoMergeClaim: false, semanticEquivalenceClaim: false, reasonCodes, conflictKeys };
}

function splitMergeAdmissionBlockerDetails(classification, file, input) {
  if (!file || !allowsProjectSplitMerge(input, classification) || !hasProjectSplitMergeAdmissionEvidence(input)) return undefined;
  if (classification.details?.exactStructuralPartition === false || classification.details?.generatedOutputBoundary === true) return undefined;
  const otherBranch = classification.branch === 'worker' ? 'head' : 'worker';
  if (branchSourceText(file, otherBranch) === file.baseSourceText) return undefined;
  return {
    staleStructuralEditProof: true,
    otherBranchChanged: true,
    otherBranch,
    missingRequiredEvidence: ['other-branch-unchanged-proof'],
    structuralProofRouteId: 'prove-project-split-merge-current-branch-output'
  };
}

function projectSplitMergeSummary(classifications) {
  return {
    classifications: classifications.length,
    moduleSplits: classifications.filter((classification) => classification.kind === 'module-split').length,
    moduleMerges: classifications.filter((classification) => classification.kind === 'module-merge').length,
    classSplits: classifications.filter((classification) => classification.kind === 'class-split').length,
    classMerges: classifications.filter((classification) => classification.kind === 'class-merge').length,
    reasonCodes: uniqueStrings(classifications.map((classification) => classification.code))
  };
}

function uniqueClassifications(classifications) {
  const results = [];
  const seen = new Set();
  for (const classification of classifications) {
    const key = classification.details?.conflictKey;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    results.push(classification);
  }
  return results;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function branchSourceText(file, branch) {
  if (branch === 'worker') return file.workerDeleted ? undefined : file.workerSourceText ?? file.baseSourceText;
  return file.headDeleted ? undefined : file.headSourceText ?? file.baseSourceText;
}

export { applyProjectSplitMergeClassifications, classifyProjectSplitMerges };
