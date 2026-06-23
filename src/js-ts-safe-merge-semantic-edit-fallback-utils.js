import { JsTsSafeMergeConflictCodes } from './js-ts-safe-merge-constants.js';

const semanticFallbackConflictCodes = new Set([
  JsTsSafeMergeConflictCodes.changedExistingDeclaration,
  JsTsSafeMergeConflictCodes.typeAliasConflict
]);

function shouldTrySemanticEditFallback(result) {
  const conflicts = result.conflicts ?? [];
  return conflicts.length > 0 && conflicts.every((conflict) => semanticFallbackConflictCodes.has(conflict.code));
}

function semanticFallbackConflictCode(result) {
  return result.conflicts?.find((conflict) => semanticFallbackConflictCodes.has(conflict.code))?.code
    ?? JsTsSafeMergeConflictCodes.changedExistingDeclaration;
}

function semanticFallbackChangedExistingDeclarations(topLevelResult, resultBase, stagedFallback) {
  const conflictCount = (topLevelResult.conflicts ?? [])
    .filter((conflict) => semanticFallbackConflictCodes.has(conflict.code)).length;
  return Math.max(
    topLevelResult.summary?.changedExistingDeclarations ?? 0,
    resultBase?.summary?.changedExistingDeclarations ?? 0,
    stagedFallback?.neutralization?.summary?.workerChangedExistingDeclarations ?? 0,
    conflictCount
  );
}

function semanticFallbackPhase(fallback) {
  if (!fallback) return 'semantic-edit-fallback';
  return fallback.projectionMode === 'direct'
    ? 'staged-top-level-direct-semantic-edit-fallback'
    : 'staged-top-level-semantic-edit-fallback';
}

function semanticFallbackCandidates(stagedFallback) {
  if (!stagedFallback) return [undefined];
  const headChanged = (stagedFallback.neutralization?.summary?.headChangedExistingDeclarations ?? 0) > 0;
  const directFallback = stagedFallback.directProjectionHeadSourceText && (headChanged || stagedFallback.safeTopLevelChanges > 0)
    ? { ...stagedFallback, projectionMode: 'direct' }
    : undefined;
  if (headChanged) return directFallback ? [directFallback, undefined] : [undefined];
  return directFallback ? [stagedFallback, directFallback, undefined] : [stagedFallback];
}

export {
  semanticFallbackCandidates,
  semanticFallbackChangedExistingDeclarations,
  semanticFallbackConflictCode,
  semanticFallbackPhase,
  shouldTrySemanticEditFallback
};
