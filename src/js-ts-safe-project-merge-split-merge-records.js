import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { classEvidence, generatedProjectSourcePath, moduleEvidence } from './js-ts-safe-project-merge-split-merge-shapes.js';

const classifierGateId = 'project-split-merge-classifier';
const exactStructuralPartitionEvidence = 'exact-structural-partition-proof';
const moduleRequiredEvidence = [
  'module-lineage-evidence',
  'public-api-contract-evidence',
  'import-export-rewrite-evidence',
  'output-project-symbol-graph',
  'output-diagnostics-gate',
  'output-declaration-gate'
];
const classRequiredEvidence = [
  'class-lineage-evidence',
  'member-lineage-evidence',
  'public-api-contract-evidence',
  'output-project-symbol-graph',
  'output-diagnostics-gate',
  'output-declaration-gate'
];

function moduleSplitClassification(branch, baseModule, candidates, movedItems) {
  const sourcePaths = uniqueStrings([baseModule.sourcePath, ...candidates.map((candidate) => candidate.file.sourcePath)]);
  const code = `project-${branch}-module-split-blocked`;
  const fingerprint = classificationFingerprint({ kind: 'module-split', branch, sourcePath: baseModule.sourcePath, targetPaths: candidates.map((candidate) => candidate.file.sourcePath), movedItems });
  const partition = moduleSplitPartition(baseModule, candidates);
  return {
    kind: 'module-split',
    branch,
    code,
    operation: `blocked-${branch}-module-split`,
    sourcePaths,
    pathRoles: splitPathRoles(baseModule.sourcePath, candidates.map((candidate) => candidate.file.sourcePath)),
    details: compactRecord({
      reasonCode: code,
      conflictKey: `project-module-split#${branch}#${sourcePaths.join('|')}#${fingerprint}`,
      branch,
      structuralEditKind: 'module-split',
      sourcePath: baseModule.sourcePath,
      targetPaths: uniqueStrings(candidates.map((candidate) => candidate.file.sourcePath)),
      movedDeclarationKeys: movedItems,
      ...generatedBoundaryDetails(sourcePaths),
      ...partition,
      requiredEvidence: requiredEvidenceForPartition(moduleRequiredEvidence, partition),
      missingRequiredEvidence: requiredEvidenceForPartition(moduleRequiredEvidence, partition),
      baseModule: moduleEvidence(baseModule.baseShape),
      branchModules: candidates.map((candidate) => compactRecord({ ...moduleEvidence(candidate.file.branchShape), overlappingDeclarationKeys: candidate.overlap }))
    })
  };
}

function moduleMergeClassification(branch, branchModule, candidates, movedItems) {
  const sourcePaths = uniqueStrings([...candidates.map((candidate) => candidate.file.sourcePath), branchModule.sourcePath]);
  const code = `project-${branch}-module-merge-blocked`;
  const fingerprint = classificationFingerprint({ kind: 'module-merge', branch, sourcePaths: candidates.map((candidate) => candidate.file.sourcePath), targetPath: branchModule.sourcePath, movedItems });
  const partition = moduleMergePartition(branchModule, candidates);
  return {
    kind: 'module-merge',
    branch,
    code,
    operation: `blocked-${branch}-module-merge`,
    sourcePaths,
    pathRoles: mergePathRoles(candidates.map((candidate) => candidate.file.sourcePath), branchModule.sourcePath),
    details: compactRecord({
      reasonCode: code,
      conflictKey: `project-module-merge#${branch}#${sourcePaths.join('|')}#${fingerprint}`,
      branch,
      structuralEditKind: 'module-merge',
      sourcePaths: uniqueStrings(candidates.map((candidate) => candidate.file.sourcePath)),
      targetPath: branchModule.sourcePath,
      movedDeclarationKeys: movedItems,
      ...generatedBoundaryDetails(sourcePaths),
      ...partition,
      requiredEvidence: requiredEvidenceForPartition(moduleRequiredEvidence, partition),
      missingRequiredEvidence: requiredEvidenceForPartition(moduleRequiredEvidence, partition),
      baseModules: candidates.map((candidate) => compactRecord({ ...moduleEvidence(candidate.file.baseShape), overlappingDeclarationKeys: candidate.overlap })),
      branchModule: moduleEvidence(branchModule.branchShape)
    })
  };
}

function classSplitClassification(branch, baseClass, candidates, movedMembers) {
  const sourcePaths = uniqueStrings([baseClass.sourcePath, ...candidates.map((candidate) => candidate.record.sourcePath)]);
  const code = `project-${branch}-class-split-blocked`;
  const fingerprint = classificationFingerprint({ kind: 'class-split', branch, sourcePath: baseClass.sourcePath, className: baseClass.classRecord.name, targetClasses: candidates.map((candidate) => classIdentity(candidate.record)), movedMembers });
  const partition = classSplitPartition(baseClass, candidates);
  return {
    kind: 'class-split',
    branch,
    code,
    operation: `blocked-${branch}-class-split`,
    sourcePaths,
    pathRoles: splitPathRoles(baseClass.sourcePath, candidates.map((candidate) => candidate.record.sourcePath)),
    details: compactRecord({
      reasonCode: code,
      conflictKey: `project-class-split#${branch}#${sourcePaths.join('|')}#${fingerprint}`,
      branch,
      structuralEditKind: 'class-split',
      sourceClass: classEvidence(baseClass),
      targetClasses: candidates.map((candidate) => compactRecord({ ...classEvidence(candidate.record), overlappingMemberKeys: candidate.overlap })),
      movedMemberKeys: movedMembers,
      ...generatedBoundaryDetails(sourcePaths),
      ...partition,
      requiredEvidence: requiredEvidenceForPartition(classRequiredEvidence, partition),
      missingRequiredEvidence: requiredEvidenceForPartition(classRequiredEvidence, partition)
    })
  };
}

function classMergeClassification(branch, branchClass, candidates, movedMembers) {
  const sourcePaths = uniqueStrings([...candidates.map((candidate) => candidate.record.sourcePath), branchClass.sourcePath]);
  const code = `project-${branch}-class-merge-blocked`;
  const fingerprint = classificationFingerprint({ kind: 'class-merge', branch, sourceClasses: candidates.map((candidate) => classIdentity(candidate.record)), targetPath: branchClass.sourcePath, targetClassName: branchClass.classRecord.name, movedMembers });
  const partition = classMergePartition(branchClass, candidates);
  return {
    kind: 'class-merge',
    branch,
    code,
    operation: `blocked-${branch}-class-merge`,
    sourcePaths,
    pathRoles: mergePathRoles(candidates.map((candidate) => candidate.record.sourcePath), branchClass.sourcePath),
    details: compactRecord({
      reasonCode: code,
      conflictKey: `project-class-merge#${branch}#${sourcePaths.join('|')}#${fingerprint}`,
      branch,
      structuralEditKind: 'class-merge',
      sourceClasses: candidates.map((candidate) => compactRecord({ ...classEvidence(candidate.record), overlappingMemberKeys: candidate.overlap })),
      targetClass: classEvidence(branchClass),
      movedMemberKeys: movedMembers,
      ...generatedBoundaryDetails(sourcePaths),
      ...partition,
      requiredEvidence: requiredEvidenceForPartition(classRequiredEvidence, partition),
      missingRequiredEvidence: requiredEvidenceForPartition(classRequiredEvidence, partition)
    })
  };
}

function splitMergeConflictForPath(classification, sourcePath, extraDetails = {}) {
  const details = splitMergeConflictDetails(classification.details, extraDetails);
  return {
    code: classification.code,
    gateId: classifierGateId,
    message: splitMergeMessage(classification),
    sourcePath,
    details: compactRecord({ ...details, sourcePath, pathRole: classification.pathRoles?.[sourcePath] })
  };
}

function splitMergeMessage(classification) {
  const structuralKind = classification.details?.structuralEditKind ?? classification.kind;
  if (structuralKind === 'module-split') return `${classification.branch} module split requires an exact declaration partition, module lineage, public API contract, import/export rewrite, diagnostics, and declaration evidence.`;
  if (structuralKind === 'module-merge') return `${classification.branch} module merge requires an exact declaration partition, module lineage, public API contract, import/export rewrite, diagnostics, and declaration evidence.`;
  if (structuralKind === 'class-split') return `${classification.branch} class split requires an exact member partition, class/member lineage, public API contract, diagnostics, and declaration evidence.`;
  return `${classification.branch} class merge requires an exact member partition, class/member lineage, public API contract, diagnostics, and declaration evidence.`;
}

function classificationSummaryRecord(classification) {
  return compactRecord({
    kind: classification.kind,
    branch: classification.branch,
    code: classification.code,
    operation: classification.operation,
    sourcePaths: classification.sourcePaths,
    conflictKey: classification.details?.conflictKey,
    structuralEditKind: classification.details?.structuralEditKind
  });
}

function classifiedOperation(classifications) {
  const operations = uniqueStrings(classifications.map((classification) => classification.operation));
  return operations.length === 1 ? operations[0] : 'blocked-project-split-merge-classification';
}

function splitPathRoles(sourcePath, targetPaths) {
  return pathRoles([[sourcePath, 'split-source'], ...targetPaths.map((targetPath) => [targetPath, 'split-target'])]);
}

function mergePathRoles(sourcePaths, targetPath) {
  return pathRoles([...sourcePaths.map((sourcePath) => [sourcePath, 'merge-source']), [targetPath, 'merge-target']]);
}

function pathRoles(entries) {
  const roles = {};
  for (const [sourcePath, role] of entries) {
    if (!sourcePath) continue;
    roles[sourcePath] = roles[sourcePath] && roles[sourcePath] !== role ? `${roles[sourcePath]}+${role}` : role;
  }
  return roles;
}

function generatedBoundaryDetails(sourcePaths) {
  const generatedSourcePaths = uniqueStrings(sourcePaths).filter(generatedProjectSourcePath);
  return generatedSourcePaths.length ? { generatedOutputBoundary: true, generatedSourcePaths } : {};
}

function moduleSplitPartition(baseModule, candidates) {
  return structuralPartition({
    sourceKeys: baseModule.baseShape.moduleItems.map((item) => item.key),
    targetRecords: candidates.map((candidate) => ({
      sourcePath: candidate.file.sourcePath,
      keys: candidate.file.branchShape.moduleItems.map((item) => item.key)
    })),
    duplicateField: 'duplicateMovedDeclarationKeys',
    missingField: 'missingMovedDeclarationKeys',
    extraField: 'extraTargetDeclarationKeys'
  });
}

function moduleMergePartition(branchModule, candidates) {
  return structuralPartition({
    sourceKeys: candidates.flatMap((candidate) => candidate.file.baseShape.moduleItems.map((item) => item.key)),
    targetRecords: [{
      sourcePath: branchModule.sourcePath,
      keys: branchModule.branchShape.moduleItems.map((item) => item.key)
    }],
    duplicateField: 'duplicateMovedDeclarationKeys',
    missingField: 'missingMovedDeclarationKeys',
    extraField: 'extraTargetDeclarationKeys'
  });
}

function classSplitPartition(baseClass, candidates) {
  return structuralPartition({
    sourceKeys: baseClass.classRecord.members.map((member) => member.key),
    targetRecords: candidates.map((candidate) => ({
      sourcePath: candidate.record.sourcePath,
      className: candidate.record.classRecord.name,
      keys: candidate.record.classRecord.members.map((member) => member.key)
    })),
    duplicateField: 'duplicateMovedMemberKeys',
    missingField: 'missingMovedMemberKeys',
    extraField: 'extraTargetMemberKeys'
  });
}

function classMergePartition(branchClass, candidates) {
  return structuralPartition({
    sourceKeys: candidates.flatMap((candidate) => candidate.record.classRecord.members.map((member) => member.key)),
    targetRecords: [{
      sourcePath: branchClass.sourcePath,
      className: branchClass.classRecord.name,
      keys: branchClass.classRecord.members.map((member) => member.key)
    }],
    duplicateField: 'duplicateMovedMemberKeys',
    missingField: 'missingMovedMemberKeys',
    extraField: 'extraTargetMemberKeys'
  });
}

function structuralPartition(options) {
  const sourceCounts = countKeys(options.sourceKeys);
  const targetCounts = countKeys(options.targetRecords.flatMap((record) => record.keys));
  const sourceKeys = [...sourceCounts.keys()];
  const targetKeys = [...targetCounts.keys()];
  const missing = sourceKeys.filter((key) => (targetCounts.get(key) ?? 0) < (sourceCounts.get(key) ?? 0));
  const duplicate = sourceKeys.filter((key) => (targetCounts.get(key) ?? 0) > (sourceCounts.get(key) ?? 0));
  const extra = targetKeys.filter((key) => !sourceCounts.has(key));
  const blockers = [
    duplicate.length ? 'duplicate-moved-structural-key' : undefined,
    missing.length ? 'missing-moved-structural-key' : undefined,
    extra.length ? 'extra-target-structural-key' : undefined
  ].filter(Boolean);
  const exact = blockers.length === 0;
  return compactRecord({
    exactStructuralPartition: exact,
    structuralPartitionStatus: exact ? 'passed' : 'blocked',
    structuralPartitionProof: exact ? 'one-to-one-source-target-key-count' : undefined,
    structuralPartitionBlockers: blockers.length ? blockers : undefined,
    [options.duplicateField]: duplicate.length ? duplicate : undefined,
    [options.missingField]: missing.length ? missing : undefined,
    [options.extraField]: extra.length ? extra : undefined
  });
}

function requiredEvidenceForPartition(requiredEvidence, partition) {
  return partition.exactStructuralPartition === false
    ? uniqueStrings([...requiredEvidence, exactStructuralPartitionEvidence])
    : requiredEvidence;
}

function splitMergeConflictDetails(details = {}, extraDetails = {}) {
  return compactRecord({
    ...details,
    ...extraDetails,
    requiredEvidence: uniqueStrings([...(details.requiredEvidence ?? []), ...(extraDetails.requiredEvidence ?? [])]),
    missingRequiredEvidence: uniqueStrings([...(details.missingRequiredEvidence ?? []), ...(extraDetails.missingRequiredEvidence ?? [])]),
    presentRequiredEvidence: uniqueStrings([...(details.presentRequiredEvidence ?? []), ...(extraDetails.presentRequiredEvidence ?? [])])
  });
}

function classIdentity(record) { return `${record.sourcePath}#${record.classRecord.name}`; }

function classificationFingerprint(value) {
  return hashSemanticValue(value).replace(/[^a-zA-Z0-9]+/g, '').slice(0, 16);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function countKeys(keys) {
  const counts = new Map();
  for (const key of keys) {
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export {
  classMergeClassification,
  classSplitClassification,
  classificationSummaryRecord,
  classifiedOperation,
  moduleMergeClassification,
  moduleSplitClassification,
  splitMergeConflictForPath
};
