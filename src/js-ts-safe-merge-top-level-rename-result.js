import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';
import { uniqueStrings } from './native-import-utils.js';

function topLevelRenameBlockedResult(input, topLevelResult, topLevelRenameAdmission) {
  const reasonCodes = uniqueStrings([
    ...(topLevelResult.admission?.reasonCodes ?? []),
    ...(topLevelRenameAdmission.reasonCodes ?? [])
  ]);
  const conflict = {
    code: JsTsSafeMergeConflictCodes.topLevelRenamePublicExportContract,
    gateId: JsTsSafeMergeGateIds.stableExistingDeclarations,
    message: 'Top-level rename changes a public export contract without project-level evidence.',
    side: 'worker',
    sourcePath: input.sourcePath ?? topLevelResult.sourcePath,
    details: {
      ...topLevelRenameAdmission.summary,
      reasonCodes: topLevelRenameAdmission.reasonCodes
    }
  };
  return {
    ...topLevelResult,
    conflicts: [...(topLevelResult.conflicts ?? []), conflict],
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    summary: {
      ...topLevelResult.summary,
      conflicts: (topLevelResult.conflicts?.length ?? 0) + 1,
      topLevelDeclarationRenames: 1
    },
    metadata: {
      ...topLevelResult.metadata,
      topLevelRenameAdmission: topLevelRenameAdmission.summary
    }
  };
}

export { topLevelRenameBlockedResult };
