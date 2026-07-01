import { assert } from './helpers.mjs';
import { createUniversalConversionWorklist, queryUniversalConversionWorklist } from './compiler-api.mjs';

const semanticEditPlan = {
  kind: 'frontier.lang.universalConversionPlan',
  version: 1,
  generatedAt: 805,
  id: 'semantic_edit_worklist_plan',
  routes: [{
    id: 'conversion_javascript_to_typescript_semantic_edit',
    sourceLanguage: 'javascript',
    languageIds: ['javascript'],
    target: 'typescript',
    mode: 'preserve-source',
    readiness: 'ready',
    admissionAction: 'admit',
    routeAction: 'preserve-source',
    priority: 'normal',
    lossClass: 'none',
    missingEvidence: ['semantic-edit-replay-proof'],
    blockers: [],
    review: [],
    mergeRefs: {
      sourceMapIds: ['semantic_edit_source_map'],
      sourceMapMappingIds: ['semantic_edit_mapping'],
      sourceMapLinkIds: ['semantic_edit_link'],
      evidenceIds: [],
      proofIds: [],
      sources: [],
      semanticOwnershipKeys: [],
      conflictKeys: []
    },
    semanticEditScript: {
      id: 'semantic_edit_script_worklist',
      operations: [{
        id: 'semantic_edit_op_worklist',
        status: 'ready',
        semanticKey: 'function:renameUser',
        semanticIdentityHash: 'semantic_hash_worklist',
        sourceIdentityHash: 'source_hash_worklist',
        operationContentHash: 'op_hash_worklist',
        metadata: { sourceBackprojection: { mode: 'exact-source' } }
      }]
    },
    semanticEditProjection: {
      id: 'semantic_edit_projection_worklist',
      status: 'projected',
      edits: [semanticEdit('edit_hash_worklist')],
      metadata: { sourceBackprojectionMode: 'exact-source' }
    },
    semanticEditReplay: {
      id: 'semantic_edit_replay_worklist',
      scriptId: 'semantic_edit_script_worklist',
      projectionId: 'semantic_edit_projection_worklist',
      status: 'accepted-clean',
      currentHash: 'current_hash_worklist',
      outputHash: 'output_hash_worklist',
      admission: { action: 'apply', reasonCodes: ['semantic-edit-replay-clean'] },
      edits: [semanticEdit('edit_hash_worklist')],
      metadata: { sourceBackprojectionMode: 'exact-source' }
    },
    semanticEditAdmission: { status: 'ready', action: 'admit', readiness: 'ready' },
    semanticTransformIdentity: semanticTransformIdentity('worklist'),
    patchBundle: {
      index: {
        semanticTransformReadinesses: ['ready'],
        transformSourceLanguages: ['javascript'],
        transformTargetLanguages: ['typescript'],
        transformSourcePaths: ['src/user.js'],
        transformTargetPaths: ['src/user.ts'],
        transformCrossLanguages: ['true'],
        transformSourceMapIds: ['semantic_edit_source_map'],
        transformSourceMapLinkIds: ['semantic_edit_link'],
        transformSourceMapMappingIds: ['semantic_edit_mapping'],
        transformBaseHashes: ['base_hash_worklist'],
        transformTargetHashes: ['target_hash_worklist'],
        targetPortabilityStatuses: ['portable'],
        targetPortabilityActions: ['port-with-source-map'],
        targetPortabilityReasonCodes: ['source-map-exact']
      }
    },
    metadata: {
      semanticEditSummary: {
        sourceBackprojectionModes: ['exact-source'],
        semanticEditReplayOutputHashes: ['output_hash_worklist']
      }
    }
  }],
  summary: {}
};

const semanticEditWorklist = createUniversalConversionWorklist(semanticEditPlan);
assert.equal(semanticEditWorklist.summary.semanticEditScriptIds.includes('semantic_edit_script_worklist'), true);
assert.equal(semanticEditWorklist.summary.semanticEditReplayStatuses.includes('accepted-clean'), true);
assert.equal(semanticEditWorklist.summary.semanticEditReplayActions.includes('apply'), true);
assert.equal(semanticEditWorklist.summary.semanticEditAdmissionStatuses.includes('ready'), true);
assert.equal(semanticEditWorklist.summary.semanticEditAdmissionActions.includes('admit'), true);
assert.equal(semanticEditWorklist.summary.semanticEditReplayOutputHashes.includes('output_hash_worklist'), true);
assert.equal(semanticEditWorklist.summary.semanticEditKeys.includes('function:renameUser'), true);
assert.equal(semanticEditWorklist.summary.sourceBackprojectionModes.includes('exact-source'), true);
assert.equal(semanticEditWorklist.summary.semanticTransformIds.includes('worklist_semantic_transform'), true);
assert.equal(semanticEditWorklist.summary.semanticTransformKeys.includes('semantic-transform:javascript->typescript:function:renameUser'), true);
assert.equal(semanticEditWorklist.summary.semanticTransformIdentityHashes.includes('worklist_transform_identity_hash'), true);
assert.equal(semanticEditWorklist.summary.semanticTransformContentHashes.includes('worklist_transform_content_hash'), true);
assert.equal(semanticEditWorklist.summary.projectionIdentityHashes.includes('worklist_projection_identity_hash'), true);
assert.equal(semanticEditWorklist.summary.semanticTransformReadinesses.includes('ready'), true);
assert.equal(semanticEditWorklist.summary.semanticTransformEvidenceIds.includes('worklist_transform_evidence'), true);
assert.equal(semanticEditWorklist.summary.transformTargetLanguages.includes('typescript'), true);
assert.equal(semanticEditWorklist.summary.targetPortabilityStatuses.includes('portable'), true);

const semanticEditQuery = queryUniversalConversionWorklist(semanticEditWorklist, {
  kind: 'collect-translation-proof',
  semanticEditScriptId: 'semantic_edit_script_worklist',
  semanticEditReplayStatus: 'accepted-clean',
  semanticEditReplayAction: 'apply',
  semanticEditAdmissionStatus: 'ready',
  semanticEditAdmissionAction: 'admit',
  semanticEditReplayOutputHash: 'output_hash_worklist',
  semanticEditKey: 'function:renameUser',
  sourceBackprojectionMode: 'exact-source',
  semanticTransformId: 'worklist_semantic_transform',
  semanticTransformContentHash: 'worklist_transform_content_hash',
  projectionIdentityHash: 'worklist_projection_identity_hash',
  semanticTransformEvidenceId: 'worklist_transform_evidence',
  semanticTransformReadiness: 'ready',
  transformTargetLanguage: 'typescript',
  transformSourceMapId: 'semantic_edit_source_map',
  targetPortabilityStatus: 'portable'
});
assert.equal(semanticEditQuery.found, true);
assert.equal(semanticEditQuery.bestItem.semanticTransformIds.includes('worklist_semantic_transform'), true);
assert.equal(semanticEditQuery.bestItem.semanticEditReplayOutputHashes.includes('output_hash_worklist'), true);

const filtered = createUniversalConversionWorklist(semanticEditPlan, {
  semanticEditAdmissionStatus: 'ready',
  semanticTransformKey: 'semantic-transform:javascript->typescript:function:renameUser',
  semanticEditReplayOutputHash: 'output_hash_worklist',
  sourceBackprojectionMode: 'exact-source'
});
assert.equal(filtered.items.length, 1);
assert.equal(filtered.summary.semanticEditReplayOutputHashes.includes('output_hash_worklist'), true);

function semanticEdit(editContentHash) {
  return {
    semanticKey: 'function:renameUser',
    semanticIdentityHash: 'semantic_hash_worklist',
    sourceIdentityHash: 'source_hash_worklist',
    operationContentHash: 'op_hash_worklist',
    editContentHash,
    sourcePath: 'src/user.js'
  };
}

function semanticTransformIdentity(prefix) {
  return {
    id: `${prefix}_semantic_transform`,
    transformKey: 'semantic-transform:javascript->typescript:function:renameUser',
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
    sourceMapIds: ['semantic_edit_source_map'],
    sourceMapLinkIds: ['semantic_edit_link'],
    sourceMapMappingIds: ['semantic_edit_mapping']
  };
}
