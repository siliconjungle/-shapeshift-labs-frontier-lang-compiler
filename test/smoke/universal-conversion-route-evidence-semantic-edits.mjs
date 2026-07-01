import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionRouteEvidenceReceipt,
  queryUniversalConversionArtifacts
} from './compiler-api.mjs';

const route = {
  id: 'conversion_javascript_to_typescript_receipt_semantic_edit',
  sourceLanguage: 'javascript',
  languageIds: ['javascript'],
  target: 'typescript',
  mode: 'preserve-source',
  readiness: 'ready',
  admissionAction: 'admit',
  routeAction: 'preserve-source',
  priority: 'normal',
  lossClass: 'none',
  missingEvidence: [],
  blockers: [],
  review: [],
  mergeRefs: {
    sourceMapIds: ['receipt_semantic_edit_source_map'],
    sourceMapMappingIds: ['receipt_semantic_edit_mapping'],
    sourceMapLinkIds: ['receipt_semantic_edit_link'],
    evidenceIds: ['receipt_semantic_edit_gate'],
    proofIds: ['receipt_semantic_edit_gate'],
    sources: [{ sourcePath: 'src/user.js', sourceHash: 'source_hash_worklist' }],
    semanticOwnershipKeys: [],
    conflictKeys: []
  },
  semanticEditScript: {
    id: 'receipt_semantic_edit_script',
    operations: [{
      id: 'receipt_semantic_edit_op',
      status: 'ready',
      semanticKey: 'function:receiptRenameUser',
      semanticIdentityHash: 'receipt_semantic_hash',
      sourceIdentityHash: 'receipt_source_hash',
      operationContentHash: 'receipt_op_hash',
      metadata: { sourceBackprojection: { mode: 'exact-source' } }
    }]
  },
  semanticEditProjection: {
    id: 'receipt_semantic_edit_projection',
    status: 'projected',
    edits: [semanticEdit('receipt_edit_hash')],
    metadata: { sourceBackprojectionMode: 'exact-source' }
  },
  semanticEditReplay: {
    id: 'receipt_semantic_edit_replay',
    scriptId: 'receipt_semantic_edit_script',
    projectionId: 'receipt_semantic_edit_projection',
    status: 'accepted-clean',
    currentHash: 'receipt_current_hash',
    outputHash: 'receipt_output_hash',
    admission: { action: 'apply', reasonCodes: ['semantic-edit-replay-clean'] },
    edits: [semanticEdit('receipt_edit_hash')],
    metadata: { sourceBackprojectionMode: 'exact-source' }
  },
  semanticEditAdmission: { status: 'ready', action: 'admit', readiness: 'ready' },
  patchBundle: {
    index: {
      semanticTransformReadinesses: ['ready'],
      transformSourceLanguages: ['javascript'],
      transformTargetLanguages: ['typescript'],
      transformSourcePaths: ['src/user.js'],
      transformTargetPaths: ['src/user.ts'],
      transformCrossLanguages: ['true'],
      transformSourceMapIds: ['receipt_semantic_edit_source_map'],
      transformSourceMapLinkIds: ['receipt_semantic_edit_link'],
      transformSourceMapMappingIds: ['receipt_semantic_edit_mapping'],
      transformBaseHashes: ['receipt_base_hash'],
      transformTargetHashes: ['receipt_target_hash'],
      targetPortabilityStatuses: ['portable'],
      targetPortabilityActions: ['port-with-source-map'],
      targetPortabilityReasonCodes: ['source-map-exact']
    }
  },
  metadata: {
    semanticEditSummary: {
      sourceBackprojectionModes: ['exact-source'],
      semanticEditReplayOutputHashes: ['receipt_output_hash']
    }
  }
};

const receipt = createUniversalConversionRouteEvidenceReceipt(route);
assert.equal(receipt.semanticEditScriptIds.includes('receipt_semantic_edit_script'), true);
assert.equal(receipt.semanticEditReplayStatuses.includes('accepted-clean'), true);
assert.equal(receipt.semanticEditAdmissionStatuses.includes('ready'), true);
assert.equal(receipt.semanticEditReplayOutputHashes.includes('receipt_output_hash'), true);
assert.equal(receipt.semanticEditKeys.includes('function:receiptRenameUser'), true);
assert.equal(receipt.sourceBackprojectionModes.includes('exact-source'), true);
assert.equal(receipt.transformTargetLanguages.includes('typescript'), true);
assert.equal(receipt.targetPortabilityStatuses.includes('portable'), true);
assert.equal(receipt.summary.semanticEdit.semanticEditScriptIds.receipt_semantic_edit_script, 1);
assert.equal(receipt.summary.semanticEdit.semanticEditReplayOutputHashes.receipt_output_hash, 1);
assert.equal(receipt.summary.semanticEdit.sourceBackprojectionModes['exact-source'], 1);
assert.equal(receipt.metadata.semanticEditEvidenceRequired, true);

const artifacts = createUniversalConversionArtifacts(route, { generatedAt: 806 });
assert.equal(artifacts.summary.compactCounts.semanticEdit.semanticEditScriptIds.receipt_semantic_edit_script, 1);
assert.equal(artifacts.summary.compactCounts.semanticEdit.semanticEditReplayOutputHashes.receipt_output_hash, 1);
assert.equal(artifacts.summary.compactCounts.evidenceReceipts.semanticEdit.semanticEditScriptIds.receipt_semantic_edit_script, 1);
assert.equal(artifacts.summary.compactCounts.evidenceReceipts.semanticEdit.targetPortabilityStatuses.portable, 1);
assert.equal(queryUniversalConversionArtifacts(artifacts, {
  semanticEditScriptId: 'receipt_semantic_edit_script',
  semanticEditReplayStatus: 'accepted-clean',
  semanticEditAdmissionStatus: 'ready',
  semanticEditReplayOutputHash: 'receipt_output_hash',
  sourceBackprojectionMode: 'exact-source'
})[0].routeId, route.id);

function semanticEdit(editContentHash) {
  return {
    semanticKey: 'function:receiptRenameUser',
    semanticIdentityHash: 'receipt_semantic_hash',
    sourceIdentityHash: 'receipt_source_hash',
    operationContentHash: 'receipt_op_hash',
    editContentHash,
    sourcePath: 'src/user.js'
  };
}
