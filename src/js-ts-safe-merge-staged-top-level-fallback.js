import { safeMergeJsTsImportsAndDeclarations } from './js-ts-safe-merge.js';
import { JsTsSafeMergeStatuses } from './js-ts-safe-merge-constants.js';
import { createJsTsChangedDeclarationReplay, neutralizeJsTsSafeTopLevelMergeSources } from './js-ts-safe-merge-top-level-neutralization.js';

function createStagedTopLevelSemanticFallback(input, topLevelResult) {
  const neutralization = neutralizeJsTsSafeTopLevelMergeSources(input);
  if (!neutralization.ok) return undefined;
  const stagedTopLevelResult = safeMergeJsTsImportsAndDeclarations({
    ...input,
    baseSourceText: neutralization.baseSourceText,
    workerSourceText: neutralization.topLevelWorkerSourceText,
    headSourceText: neutralization.topLevelHeadSourceText
  });
  if (stagedTopLevelResult.status !== JsTsSafeMergeStatuses.merged) return undefined;
  const safeTopLevelChanges = safeTopLevelChangeCount(stagedTopLevelResult.summary);
  const declarationReplay = createJsTsChangedDeclarationReplay(input, neutralization, stagedTopLevelResult.mergedSourceText);
  const directSemanticHeadReplay = createJsTsChangedDeclarationReplay(input, neutralization, stagedTopLevelResult.mergedSourceText, 'head');
  const workerDeclarationChanges = neutralization.summary.workerChangedExistingDeclarations ?? 0;
  if (safeTopLevelChanges === 0 && workerDeclarationChanges === 0) return undefined;
  return {
    neutralization,
    declarationReplay,
    safeTopLevelChanges,
    stagedTopLevelResult,
    scriptInput: {
      ...input,
      workerSourceText: neutralization.semanticWorkerSourceText,
      headSourceText: neutralization.semanticHeadSourceText,
      workerSourceHash: undefined,
      headSourceHash: undefined
    },
    projectionHeadSourceText: stagedTopLevelResult.mergedSourceText,
    directProjectionHeadSourceText: directSemanticHeadReplay.outputSourceText,
    replayCurrentSourceText: stagedTopLevelResult.mergedSourceText,
    directReplayCurrentSourceText: directSemanticHeadReplay.outputSourceText,
    metadata: {
      stagedTopLevelSummary: stagedTopLevelResult.summary,
      declarationReplay: {
        edits: declarationReplay.edits.length,
        reasonCodes: declarationReplay.reasonCodes
      },
      directSemanticHeadReplay: {
        edits: directSemanticHeadReplay.edits.length,
        reasonCodes: directSemanticHeadReplay.reasonCodes
      },
      neutralization: neutralization.summary,
      originalReasonCodes: topLevelResult.admission?.reasonCodes ?? []
    }
  };
}

function safeTopLevelChangeCount(summary = {}) {
  return (summary.importSpecifierAdditions ?? 0)
    + (summary.importDeclarationAdditions ?? 0)
    + (summary.topLevelDeclarationAdditions ?? 0);
}

export {
  createStagedTopLevelSemanticFallback
};
