import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { semanticReplayCurrentHeadCommutationProofRoute } from '../../src/js-ts-safe-project-merge-semantic-replay-routes.js';

const currentHash = hashSemanticValue('export const value = 1;\n');
const outputHash = hashSemanticValue('export const value = 2;\n');
const baseRoute = {
  status: 'accepted-clean',
  sourcePath: 'src/value.ts',
  replayId: 'semantic_edit_replay_value',
  appliedOperations: ['operation_value'],
  outputBindingStatus: 'bound',
  expectedCurrentHash: currentHash,
  replayCurrentHash: currentHash,
  expectedOutputHash: outputHash,
  replayOutputHash: outputHash
};

assert.equal(semanticReplayCurrentHeadCommutationProofRoute(baseRoute), undefined);
assert.equal(semanticReplayCurrentHeadCommutationProofRoute({ ...baseRoute, projectionOutputHash: 'wrong' }), undefined);

const boundRoute = semanticReplayCurrentHeadCommutationProofRoute({ ...baseRoute, projectionOutputHash: outputHash });
assert.equal(boundRoute.routeId, 'admit-independent-semantic-edit-current-head-commutation');
assert.equal(boundRoute.projectionOutputHash, outputHash);
assert.equal(boundRoute.autoMergeClaim, false);
assert.equal(boundRoute.semanticEquivalenceClaim, false);
