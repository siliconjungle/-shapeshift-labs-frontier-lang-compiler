import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionRouteEvidenceReceipt,
  queryUniversalConversionArtifacts
} from './compiler-api.mjs';

const semanticSidecarQuality = {
  schema: 'frontier.lang.semanticSidecarQuality.v1',
  imported: true,
  eligible: false,
  counts: { symbols: 2, ownershipRegions: 1, patchHints: 0 },
  warnings: [{ code: 'missing-patch-hints' }]
};

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
  semanticTransformIdentity: semanticTransformIdentity('receipt'),
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
    semanticSidecarQuality,
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
assert.equal(receipt.semanticTransformIds.includes('receipt_semantic_transform'), true);
assert.equal(receipt.semanticTransformKeys.includes('semantic-transform:javascript->typescript:function:receiptRenameUser'), true);
assert.equal(receipt.semanticTransformContentHashes.includes('receipt_transform_content_hash'), true);
assert.equal(receipt.projectionIdentityHashes.includes('receipt_projection_identity_hash'), true);
assert.equal(receipt.semanticTransformEvidenceIds.includes('receipt_transform_evidence'), true);
assert.equal(receipt.transformTargetLanguages.includes('typescript'), true);
assert.equal(receipt.targetPortabilityStatuses.includes('portable'), true);
assert.equal(receipt.semanticEditSidecarQualityRecords, 1);
assert.equal(receipt.semanticEditSidecarSymbolCount, 2);
assert.equal(receipt.semanticEditSidecarOwnershipRegionCount, 1);
assert.equal(receipt.semanticEditSidecarPatchHintCount, 0);
assert.equal(receipt.semanticEditSidecarWarningCount, 1);
assert.equal(receipt.semanticEditSidecarZeroRecordWarningCount, 1);
assert.equal(receipt.semanticEditSidecarWarningCodes.includes('missing-patch-hints'), true);
assert.equal(receipt.semanticEditSidecarZeroRecordWarningCodes.includes('missing-patch-hints'), true);
assert.equal(receipt.summary.semanticEdit.semanticEditScriptIds.receipt_semantic_edit_script, 1);
assert.equal(receipt.summary.semanticEdit.semanticEditReplayOutputHashes.receipt_output_hash, 1);
assert.equal(receipt.summary.semanticEdit.sourceBackprojectionModes['exact-source'], 1);
assert.equal(receipt.summary.semanticEdit.semanticTransformIds.receipt_semantic_transform, 1);
assert.equal(receipt.summary.semanticEdit.semanticEditSidecarWarningCodes['missing-patch-hints'], 1);
assert.equal(receipt.summary.semanticEdit.semanticEditSidecarZeroRecordWarningCodes['missing-patch-hints'], 1);
assert.equal(receipt.metadata.semanticEditEvidenceRequired, true);

const artifacts = createUniversalConversionArtifacts(route, { generatedAt: 806 });
assert.equal(artifacts.index.semanticEditSidecarSymbolCount, 2);
assert.equal(artifacts.index.semanticEditSidecarWarningCodes.includes('missing-patch-hints'), true);
assert.equal(artifacts.routeArtifacts[0].semanticEditSidecarQualityRecords, 1);
assert.equal(artifacts.routeArtifacts[0].semanticEditSidecarWarningCodes.includes('missing-patch-hints'), true);
assert.equal(artifacts.summary.compactCounts.semanticEdit.semanticEditScriptIds.receipt_semantic_edit_script, 1);
assert.equal(artifacts.summary.compactCounts.semanticEdit.semanticEditReplayOutputHashes.receipt_output_hash, 1);
assert.equal(artifacts.summary.compactCounts.semanticEdit.semanticTransformContentHashes.receipt_transform_content_hash, 1);
assert.equal(artifacts.summary.compactCounts.semanticEdit.semanticEditSidecarWarningCodes['missing-patch-hints'], 1);
assert.equal(artifacts.summary.compactCounts.semanticEdit.semanticEditSidecarZeroRecordWarningCodes['missing-patch-hints'], 1);
assert.equal(artifacts.summary.compactCounts.evidenceReceipts.semanticEdit.semanticEditScriptIds.receipt_semantic_edit_script, 1);
assert.equal(artifacts.summary.compactCounts.evidenceReceipts.semanticEdit.semanticTransformEvidenceIds.receipt_transform_evidence, 1);
assert.equal(artifacts.summary.compactCounts.evidenceReceipts.semanticEdit.targetPortabilityStatuses.portable, 1);
assert.equal(artifacts.summary.compactCounts.evidenceReceipts.semanticEdit.semanticEditSidecarWarningCodes['missing-patch-hints'], 1);
assert.equal(queryUniversalConversionArtifacts(artifacts, {
  semanticEditScriptId: 'receipt_semantic_edit_script',
  semanticEditReplayStatus: 'accepted-clean',
  semanticEditAdmissionStatus: 'ready',
  semanticEditReplayOutputHash: 'receipt_output_hash',
  semanticTransformId: 'receipt_semantic_transform',
  semanticTransformContentHash: 'receipt_transform_content_hash',
  projectionIdentityHash: 'receipt_projection_identity_hash',
  semanticTransformEvidenceId: 'receipt_transform_evidence',
  semanticEditSidecarWarningCode: 'missing-patch-hints',
  semanticEditSidecarZeroRecordWarningCode: 'missing-patch-hints',
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

function semanticTransformIdentity(prefix) {
  return {
    id: `${prefix}_semantic_transform`,
    transformKey: 'semantic-transform:javascript->typescript:function:receiptRenameUser',
    sourceLanguage: 'javascript',
    targetLanguage: 'typescript',
    sourcePath: 'src/user.js',
    targetPath: 'src/user.ts',
    semanticIdentityHash: `${prefix}_semantic_hash`,
    sourceIdentityHash: `${prefix}_source_hash`,
    transformIdentityHash: `${prefix}_transform_identity_hash`,
    projectionIdentityHash: `${prefix}_projection_identity_hash`,
    transformContentHash: `${prefix}_transform_content_hash`,
    readiness: 'ready',
    evidenceIds: [`${prefix}_transform_evidence`],
    sourceMapIds: [`${prefix}_semantic_edit_source_map`],
    sourceMapLinkIds: [`${prefix}_semantic_edit_link`],
    sourceMapMappingIds: [`${prefix}_semantic_edit_mapping`]
  };
}
