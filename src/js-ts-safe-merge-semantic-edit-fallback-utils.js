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

export {
  semanticFallbackChangedExistingDeclarations,
  semanticFallbackConflictCode,
  semanticFallbackPhase,
  shouldTrySemanticEditFallback
};
