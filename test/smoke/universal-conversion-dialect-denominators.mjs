import { assert } from './helpers.mjs';
import {
  compactRouteDialectCounts,
  dialectDenominatorIndex,
  dialectDenominatorMatches
} from '../../dist/universal-conversion-dialect-routing.js';

const partialRows = [
  {
    dialectExternKinds: ['generatorArtifact'],
    dialectEvidenceIds: ['evidence_vite_routes_manifest']
  },
  {
    dialectConstructKinds: ['runtime'],
    dialectLossIds: ['loss_node_process_env_projection']
  },
  {
    dialectReadiness: 'blocked',
    dialectDispositions: ['unsupported']
  }
];

const compact = compactRouteDialectCounts(partialRows);
assert.equal(compact.routes, 3);
assert.equal(compact.externKinds.generatorArtifact, 1);
assert.equal(compact.evidenceIds.evidence_vite_routes_manifest, 1);
assert.equal(compact.constructKinds.runtime, 1);
assert.equal(compact.lossIds.loss_node_process_env_projection, 1);
assert.equal(compact.byReadiness.blocked, 1);
assert.equal(compact.dispositions.unsupported, 1);

const index = dialectDenominatorIndex(partialRows);
assert.equal(index.dialectExternKinds.includes('generatorArtifact'), true);
assert.equal(index.dialectEvidenceIds.includes('evidence_vite_routes_manifest'), true);
assert.equal(index.dialectConstructKinds.includes('runtime'), true);
assert.equal(index.dialectLossIds.includes('loss_node_process_env_projection'), true);
assert.equal(index.dialectReadinesses.includes('blocked'), true);
assert.equal(index.dialectDispositions.includes('unsupported'), true);

assert.equal(dialectDenominatorMatches(partialRows[0], {
  dialectExternKind: 'generatorArtifact',
  dialectEvidenceId: 'evidence_vite_routes_manifest'
}), true);
assert.equal(dialectDenominatorMatches(partialRows[1], {
  dialectConstructKind: 'runtime',
  dialectLossId: 'loss_node_process_env_projection'
}), true);
assert.equal(dialectDenominatorMatches(partialRows[2], {
  dialectReadiness: 'blocked',
  dialectDisposition: 'unsupported'
}), true);
assert.equal(dialectDenominatorMatches(partialRows[0], { dialectExternKind: 'macroExpansion' }), false);
