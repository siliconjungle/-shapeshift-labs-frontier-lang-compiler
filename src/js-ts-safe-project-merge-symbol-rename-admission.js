import {
  createExactBranchProjectSemanticEditAdmissionFile,
  summarizeProjectSemanticEditAdmissions
} from './js-ts-safe-project-merge-admission.js';
import { hasFailedTypeScriptRefactorEvidence } from './internal/index-impl/typeScriptCompilerFacts.js';

function maybeAdmitProjectSymbolRenameFile(fileResult, file, input, classifications) {
  const explicitAdmission = allowsProjectSymbolRename(input);
  const defaultAdmission = allowsDefaultProjectSymbolRename(input, classifications);
  if (!explicitAdmission && !defaultAdmission) return undefined;
  if (hasFailedTypeScriptRefactorEvidence(classifications)) return undefined;
  return createExactBranchProjectSemanticEditAdmissionFile({
    fileResult,
    file,
    classifications,
    admissionKind: 'js-ts-project-symbol-rename-admission',
    action: 'apply-project-symbol-rename',
    operation: (result) => result.status !== 'merged' || result.operation === 'merged-source'
      ? 'merged-project-symbol-rename'
      : `${result.operation}+project-symbol-rename`,
    summaryKey: 'projectSymbolRenameAdmissions',
    evidenceKey: 'projectSymbolRenameAdmissionEvidence',
    metadataKey: 'projectSymbolRenameAdmissions',
    requireOtherBranchUnchanged: true,
    allowExistingExactOutput: true,
    admissionFields: (classification) => ({
      defaultAdmission: !explicitAdmission && defaultAdmission ? true : undefined,
      typeScriptRefactorEvidenceId: classification.details?.typeScriptRefactorEvidence?.id
    })
  });
}

function projectSymbolRenameAdmissionSummary(admissions = []) {
  return summarizeProjectSemanticEditAdmissions(admissions, {
    totalKey: 'admissions',
    byKind: [{
      key: 'crossFileSymbolRenameAdmissions',
      property: 'kind',
      value: 'js-ts-project-symbol-rename-admission'
    }],
    evidenceIdsKey: 'admissionEvidenceIds'
  });
}

function allowsProjectSymbolRename(input) {
  return (input?.allowProjectSymbolRenames === true || input?.allowCrossFileSymbolRenames === true)
    && input?.requireOutputDiagnostics === true
    && input?.requireDeclarationOutput === true;
}

function allowsDefaultProjectSymbolRename(input, classifications = []) {
  return input?.includeProjectGraphDelta === true
    && input?.requireOutputDiagnostics === true
    && input?.requireDeclarationOutput === true
    && classifications.length > 0
    && classifications.every((classification) => classification.details?.defaultAdmissionProof?.status === 'passed');
}

export { allowsProjectSymbolRename, maybeAdmitProjectSymbolRenameFile, projectSymbolRenameAdmissionSummary };
