import { semanticReplayCurrentHeadCommutationProofRoute } from './js-ts-safe-project-merge-semantic-replay-routes.js';

function boundedCurrentHeadRouteForFact(fact, level) {
  return boundedCurrentHeadRouteValidation(fact, level).route;
}

function boundedCurrentHeadRouteReasonCodes(fact, level) {
  return boundedCurrentHeadRouteValidation(fact, level).reasonCodes;
}

function boundedCurrentHeadRouteValidation(fact, level) {
  if (!hasBoundedCurrentHeadRouteMetadata(fact)) {
    return { route: undefined, reasonCodes: ['semantic-edit-replay-current-head-proof-metadata-missing'] };
  }
  const expectedRoute = semanticReplayCurrentHeadCommutationProofRoute({
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
  if (!expectedRoute) return { route: undefined, reasonCodes: [] };
  if (!fact.proofRoute) {
    return { route: undefined, reasonCodes: ['semantic-edit-replay-current-head-proof-missing'] };
  }
  const reasonCodes = boundedCurrentHeadProofRouteMismatchReasonCodes(fact.proofRoute, expectedRoute);
  return {
    route: reasonCodes.length ? undefined : expectedRoute,
    reasonCodes
  };
}

function hasBoundedCurrentHeadRouteMetadata(fact) {
  return typeof fact.sourcePath === 'string' &&
    typeof fact.replayId === 'string' &&
    fact.appliedOperations.length > 0;
}

function boundedCurrentHeadProofRouteMismatchReasonCodes(route, expected) {
  if (route?.routeId !== expected.routeId || route?.proofKind !== expected.proofKind || route?.status !== expected.status || route?.action !== expected.action || route?.routeNext !== expected.routeNext) {
    return ['semantic-edit-replay-current-head-proof-route-mismatch'];
  }
  return uniqueStrings([
    route.sourcePath === expected.sourcePath ? undefined : 'semantic-edit-replay-current-head-proof-source-path-mismatch',
    route.replayId === expected.replayId ? undefined : 'semantic-edit-replay-current-head-proof-replay-id-mismatch',
    sameStringList(array(route.appliedOperations).filter(isString), expected.appliedOperations) ? undefined : 'semantic-edit-replay-current-head-proof-applied-operations-mismatch',
    route.outputBindingStatus === expected.outputBindingStatus ? undefined : 'semantic-edit-replay-current-head-proof-output-binding-mismatch',
    route.expectedCurrentHash === expected.expectedCurrentHash && route.replayCurrentHash === expected.replayCurrentHash ? undefined : 'semantic-edit-replay-current-head-proof-current-hash-mismatch',
    route.expectedOutputHash === expected.expectedOutputHash && route.replayOutputHash === expected.replayOutputHash ? undefined : 'semantic-edit-replay-current-head-proof-output-hash-mismatch',
    route.projectionOutputHash === expected.projectionOutputHash ? undefined : 'semantic-edit-replay-current-head-proof-projection-output-hash-mismatch',
    route.autoMergeClaim === false && route.semanticEquivalenceClaim === false ? undefined : 'semantic-edit-replay-current-head-proof-claim-mismatch'
  ]);
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
function sameStringList(left, right) { return left.length === right.length && left.every((value, index) => value === right[index]); }
function isString(value) { return typeof value === 'string' && value.length > 0; }
function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }

export { boundedCurrentHeadAggregateRoute, boundedCurrentHeadRouteForFact, boundedCurrentHeadRouteReasonCodes, replayAppliedOperations };
