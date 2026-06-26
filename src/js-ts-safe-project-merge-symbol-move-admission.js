import {
  createExactBranchProjectSemanticEditAdmissionFile,
  summarizeProjectSemanticEditAdmissions
} from './js-ts-safe-project-merge-admission.js';
import { hasFailedTypeScriptRefactorEvidence } from './internal/index-impl/typeScriptCompilerFacts.js';

const symbolMoveKinds = new Set(['exported-symbol-move', 'imported-symbol-move']);

function maybeAdmitProjectSymbolMoveFile(fileResult, file, input, classifications) {
  const explicitAdmission = allowsProjectSymbolMove(input);
  const defaultAdmission = allowsDefaultProjectSymbolMove(input, classifications);
  if (!explicitAdmission && !defaultAdmission) return undefined;
  if (hasFailedTypeScriptRefactorEvidence(classifications)) return undefined;
  return createExactBranchProjectSemanticEditAdmissionFile({
    fileResult,
    file,
    classifications,
    admissionKind: 'js-ts-project-symbol-move-admission',
    action: 'apply-project-symbol-move',
    operation: 'merged-project-symbol-move',
    summaryKey: 'projectSymbolMoveAdmissions',
    evidenceKey: 'projectSymbolMoveAdmissionEvidence',
    requireOtherBranchUnchanged: true,
    requireBaseForOtherBranchUnchanged: false,
    allowExistingExactOutput: false,
    classificationFilter: (classification) => symbolMoveKinds.has(classification.kind),
    admissionFields: (classification) => ({
      moveKind: classification.kind,
      defaultAdmission: !explicitAdmission && defaultAdmission ? true : undefined,
      typeScriptRefactorEvidenceId: classification.details?.typeScriptRefactorEvidence?.id
    })
  });
}

function projectSymbolMoveAdmissionSummary(admissions = []) {
  return summarizeProjectSemanticEditAdmissions(admissions, {
    totalKey: 'symbolMoveAdmissions',
    byKind: [
      { key: 'exportedSymbolMoveAdmissions', property: 'moveKind', value: 'exported-symbol-move' },
      { key: 'importedSymbolMoveAdmissions', property: 'moveKind', value: 'imported-symbol-move' }
    ],
    evidenceIdsKey: 'symbolMoveAdmissionEvidenceIds'
  });
}

function allowsProjectSymbolMove(input) {
  return (input?.allowProjectSymbolMoves === true || input?.allowSymbolMoves === true)
    && input?.requireOutputDiagnostics === true
    && input?.requireDeclarationOutput === true;
}

function allowsDefaultProjectSymbolMove(input, classifications = []) {
  return input?.includeProjectGraphDelta === true
    && input?.requireOutputDiagnostics === true
    && input?.requireDeclarationOutput === true
    && classifications.length > 0
    && classifications.every((classification) => (
      symbolMoveKinds.has(classification.kind)
        && classification.details?.defaultAdmissionProof?.status === 'passed'
    ));
}

export { maybeAdmitProjectSymbolMoveFile, projectSymbolMoveAdmissionSummary };
