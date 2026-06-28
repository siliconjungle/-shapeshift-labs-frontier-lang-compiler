import { semanticReplayCurrentHeadCommutationProofRoute } from './js-ts-safe-project-merge-semantic-replay-routes.js';

function boundedCurrentHeadRouteForFact(fact, level) {
  if (!hasBoundedCurrentHeadRouteMetadata(fact)) return undefined;
  return semanticReplayCurrentHeadCommutationProofRoute({
    status: fact.replayStatus,
    proofLevel: level,
    sourcePath: fact.sourcePath,
    replayId: fact.replayId,
    appliedOperations: fact.appliedOperations,
    outputBindingStatus: fact.outputBindingStatus,
    expectedCurrentHash: fact.expectedCurrentHash,
    replayCurrentHash: fact.replayCurrentHash,
    expectedOutputHash: fact.expectedOutputHash,
    projectionOutputHash: fact.projectionOutputHash,
    replayOutputHash: fact.replayOutputHash
  });
}

function hasBoundedCurrentHeadRouteMetadata(fact) {
  return typeof fact.sourcePath === 'string' &&
    typeof fact.replayId === 'string' &&
    fact.appliedOperations.length > 0;
}

function boundedCurrentHeadAggregateRoute(routes, level) {
  return {
    routeId: 'admit-independent-semantic-edit-current-head-commutation',
    routeLane: 'source-files',
    routeNext: 'apply-source-bound-semantic-edit-replay',
    action: 'apply',
    proofKind: 'bounded-current-head-commutation',
    status: 'passed',
    proofLevel: level,
    reasonCodes: ['semantic-edit-current-head-commutation-bound'],
    sourcePaths: uniqueStrings(routes.map((route) => route.sourcePath)),
    replayIds: uniqueStrings(routes.map((route) => route.replayId)),
    expectedCurrentHashes: uniqueStrings(routes.map((route) => route.expectedCurrentHash)),
    replayCurrentHashes: uniqueStrings(routes.map((route) => route.replayCurrentHash)),
    expectedOutputHashes: uniqueStrings(routes.map((route) => route.expectedOutputHash)),
    projectionOutputHashes: uniqueStrings(routes.map((route) => route.projectionOutputHash)),
    replayOutputHashes: uniqueStrings(routes.map((route) => route.replayOutputHash)),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function replayAppliedOperations(replay) {
  return uniqueStrings([
    ...array(replay?.appliedOperations),
    ...array(replay?.appliedOperationIds),
    ...array(replay?.edits)
      .filter((edit) => edit?.status === 'applied')
      .map((edit) => edit.operationId)
  ]);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}
function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }

export { boundedCurrentHeadAggregateRoute, boundedCurrentHeadRouteForFact, replayAppliedOperations };
