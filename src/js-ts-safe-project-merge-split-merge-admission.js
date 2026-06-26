import {
  createExactBranchProjectSemanticEditAdmissionFile,
  summarizeProjectSemanticEditAdmissions
} from './js-ts-safe-project-merge-admission.js';
import { generatedProjectSourcePath } from './js-ts-safe-project-merge-split-merge-shapes.js';

const splitMergeKinds = new Set(['module-split', 'module-merge', 'class-split', 'class-merge']);

function maybeAdmitProjectSplitMergeFile(fileResult, file, input, classifications) {
  if (!classifications.every((classification) => allowsProjectSplitMerge(input, classification))) return undefined;
  if (!hasProjectSplitMergeAdmissionEvidence(input)) return undefined;
  if (classifications.some((classification) => classification.details?.exactStructuralPartition === false)) return undefined;
  if (classifications.some(classificationTouchesGeneratedOutputBoundary)) return undefined;
  return createExactBranchProjectSemanticEditAdmissionFile({
    fileResult,
    file,
    classifications,
    admissionKind: 'js-ts-project-split-merge-admission',
    action: 'apply-project-split-merge',
    operation: 'merged-project-split-merge',
    summaryKey: 'projectSplitMergeAdmissions',
    evidenceKey: 'projectSplitMergeAdmissionEvidence',
    metadataKey: 'projectSplitMergeAdmissions',
    requireOtherBranchUnchanged: true,
    requireBaseForOtherBranchUnchanged: false,
    allowDeletedBranchOutput: true,
    classificationFilter: (classification) => splitMergeKinds.has(classification.kind),
    admissionFields: (classification) => ({ structuralEditKind: classification.kind }),
    details: admittedSplitMergeDetails
  });
}

function projectSplitMergeAdmissionSummary(admissions = []) {
  return summarizeProjectSemanticEditAdmissions(admissions, {
    totalKey: 'splitMergeAdmissions',
    byKind: [
      { key: 'moduleSplitAdmissions', property: 'structuralEditKind', value: 'module-split' },
      { key: 'moduleMergeAdmissions', property: 'structuralEditKind', value: 'module-merge' },
      { key: 'classSplitAdmissions', property: 'structuralEditKind', value: 'class-split' },
      { key: 'classMergeAdmissions', property: 'structuralEditKind', value: 'class-merge' }
    ],
    evidenceIdsKey: 'splitMergeAdmissionEvidenceIds'
  });
}

function allowsProjectSplitMerge(input, classification) {
  if (input?.allowProjectSplitMerges === true || input?.allowSplitMerges === true) return true;
  if (classification?.kind === 'module-split') return input?.allowProjectModuleSplits === true || input?.allowModuleSplits === true;
  if (classification?.kind === 'module-merge') return input?.allowProjectModuleMerges === true || input?.allowModuleMerges === true;
  if (classification?.kind === 'class-split') return input?.allowProjectClassSplits === true || input?.allowClassSplits === true;
  if (classification?.kind === 'class-merge') return input?.allowProjectClassMerges === true || input?.allowClassMerges === true;
  return false;
}

function hasProjectSplitMergeAdmissionEvidence(input = {}) {
  return hasOutputProjectGraphEvidence(input)
    && hasOutputDiagnosticsEvidence(input)
    && hasOutputDeclarationEvidence(input);
}

function hasOutputProjectGraphEvidence(input = {}) {
  return input.includeOutputProjectSymbolGraph === true;
}

function hasOutputDiagnosticsEvidence(input = {}) {
  return input.requireOutputDiagnostics === true
    || Object.hasOwn(input, 'outputDiagnostics')
    || Boolean(input.typescript ?? input.ts ?? input.typescriptModule);
}

function hasOutputDeclarationEvidence(input = {}) {
  return input.requireDeclarationOutput === true
    || input.includeDeclarationOutput === true
    || input.outputDeclarations !== undefined
    || input.outputDeclarationFiles !== undefined;
}

function classificationTouchesGeneratedOutputBoundary(classification) {
  return classification.details?.generatedOutputBoundary === true
    || (classification.sourcePaths ?? []).some(generatedProjectSourcePath);
}

function admittedSplitMergeDetails(classification) {
  return {
    ...(classification.details ?? {}),
    presentRequiredEvidence: classification.details?.requiredEvidence,
    missingRequiredEvidence: []
  };
}

export {
  allowsProjectSplitMerge,
  hasProjectSplitMergeAdmissionEvidence,
  maybeAdmitProjectSplitMergeFile,
  projectSplitMergeAdmissionSummary
};
