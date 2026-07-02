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
  },
  {
    dialectRegistryId: 'dialect_registry_single',
    dialectRecordId: 'dialect_record_single',
    dialectConstructKind: 'macro',
    dialectExternKind: 'macroExpansion',
    dialectDisposition: 'review-required',
    dialectEvidenceId: 'evidence_macro_expansion',
    dialectLossId: 'loss_macro_hygiene'
  }
];

const compact = compactRouteDialectCounts(partialRows);
assert.equal(compact.routes, 4);
assert.equal(compact.externKinds.generatorArtifact, 1);
assert.equal(compact.evidenceIds.evidence_vite_routes_manifest, 1);
assert.equal(compact.constructKinds.runtime, 1);
assert.equal(compact.lossIds.loss_node_process_env_projection, 1);
assert.equal(compact.byReadiness.blocked, 1);
assert.equal(compact.dispositions.unsupported, 1);
assert.equal(compact.registryIds.dialect_registry_single, 1);
assert.equal(compact.recordIds.dialect_record_single, 1);
assert.equal(compact.constructKinds.macro, 1);
assert.equal(compact.externKinds.macroExpansion, 1);
assert.equal(compact.dispositions['review-required'], 1);
assert.equal(compact.evidenceIds.evidence_macro_expansion, 1);
assert.equal(compact.lossIds.loss_macro_hygiene, 1);

const index = dialectDenominatorIndex(partialRows);
assert.equal(index.dialectExternKinds.includes('generatorArtifact'), true);
assert.equal(index.dialectEvidenceIds.includes('evidence_vite_routes_manifest'), true);
assert.equal(index.dialectConstructKinds.includes('runtime'), true);
assert.equal(index.dialectLossIds.includes('loss_node_process_env_projection'), true);
assert.equal(index.dialectReadinesses.includes('blocked'), true);
assert.equal(index.dialectDispositions.includes('unsupported'), true);
assert.equal(index.dialectRegistryIds.includes('dialect_registry_single'), true);
assert.equal(index.dialectRecordIds.includes('dialect_record_single'), true);
assert.equal(index.dialectConstructKinds.includes('macro'), true);
assert.equal(index.dialectExternKinds.includes('macroExpansion'), true);
assert.equal(index.dialectDispositions.includes('review-required'), true);
assert.equal(index.dialectEvidenceIds.includes('evidence_macro_expansion'), true);
assert.equal(index.dialectLossIds.includes('loss_macro_hygiene'), true);

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
assert.equal(dialectDenominatorMatches(partialRows[3], {
  dialectRegistryId: 'dialect_registry_single',
  dialectRecordId: 'dialect_record_single',
  dialectConstructKind: 'macro',
  dialectExternKind: 'macroExpansion',
  dialectDisposition: 'review-required',
  dialectEvidenceId: 'evidence_macro_expansion',
  dialectLossId: 'loss_macro_hygiene'
}), true);
assert.equal(dialectDenominatorMatches(partialRows[0], { dialectExternKind: 'macroExpansion' }), false);
