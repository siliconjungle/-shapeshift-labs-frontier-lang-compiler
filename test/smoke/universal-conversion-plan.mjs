import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { scannedJsImport } from './scanned-js.mjs';
import { scannedCImport } from './scanned-languages.mjs';
import {
  createSemanticEditScript,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  projectSemanticEditScriptToSource,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const jsRustAdapter = {
  id: 'fixture-js-rust-conversion-plan-adapter',
  sourceLanguage: 'javascript',
  target: 'rust',
  coverage: {
    readiness: 'ready',
    handledLossKinds: [
      'declarationOnlyCoverage',
      'dynamicDispatch',
      'dynamicRuntime',
      'opaqueNative',
      'partialSemanticIndex',
      'sourceMapApproximation',
      'sourcePreservation',
      'targetProjectionLoss',
      'typeInference'
    ]
  },
  project() {
    return { output: 'pub fn add_todo_from_conversion_plan() {}\n', readiness: 'ready' };
  }
};

const conversionPlan = createUniversalConversionPlan({
  generatedAt: 777,
  imports: [scannedJsImport, scannedCImport],
  targetAdapters: [jsRustAdapter],
  targets: ['javascript', 'rust']
});
assert.equal(conversionPlan.kind, 'frontier.lang.universalConversionPlan');
assert.equal(conversionPlan.id.includes('javascript'), true);
assert.equal(conversionPlan.generatedAt, 777);
assert.equal(conversionPlan.summary.routes >= 2, true);
assert.equal(conversionPlan.summary.autoMergeClaims, 0);
assert.equal(conversionPlan.summary.semanticEquivalenceClaims, 0);
assert.equal(conversionPlan.metadata.autoMergeClaim, false);
assert.equal(conversionPlan.metadata.semanticEquivalenceClaim, false);

const jsToJs = queryUniversalConversionPlan(conversionPlan, {
  sourceLanguage: 'javascript',
  target: 'javascript'
}).bestRoute;
assert.equal(jsToJs.mode, 'preserve-source');
assert.equal(jsToJs.routeAction, 'preserve-source');
assert.equal(jsToJs.lossClass, 'exactSourceProjection');
assert.equal(jsToJs.autoMergeClaim, false);
assert.equal(jsToJs.semanticEquivalenceClaim, false);
assert.equal(jsToJs.mergeRefs.planId, conversionPlan.id);
assert.equal(jsToJs.mergeRefs.sources[0].sourcePath, scannedJsImport.sourcePath);
assert.equal(jsToJs.mergeRefs.sourceMapIds.length >= 1, true);
assert.equal(jsToJs.mergeRefs.semanticOwnershipKeys.length >= 1, true);
assert.equal(jsToJs.mergeScore.schema, 'frontier.lang.semanticMergeScore.v1');
assert.equal(jsToJs.mergeScore.components.projectionPath.status, 'strong');

const conversionArtifacts = createUniversalConversionArtifacts(conversionPlan, { generatedAt: 778 });
assert.equal(conversionArtifacts.kind, 'frontier.lang.universalConversionArtifacts');
assert.equal(conversionArtifacts.generatedAt, 778);
assert.equal(conversionArtifacts.summary.routes, conversionPlan.routes.length);
assert.equal(conversionArtifacts.summary.histories, conversionPlan.routes.length);
assert.equal(conversionArtifacts.summary.patchBundles, conversionPlan.routes.length);
assert.equal(conversionArtifacts.summary.admissionRecords, conversionPlan.routes.length);
assert.equal(conversionArtifacts.summary.semanticOperations, conversionPlan.routes.length);
assert.equal(conversionArtifacts.summary.blocked >= 1, true);
assert.equal(conversionArtifacts.summary.admissionBlocked >= 1, true);
assert.equal(conversionArtifacts.summary.highRisk >= 1, true);
assert.equal(conversionArtifacts.summary.reasonCodes >= conversionArtifacts.summary.routes, true);
assert.equal(conversionArtifacts.summary.autoMergeClaims, 0);
assert.equal(conversionArtifacts.summary.semanticEquivalenceClaims, 0);

const directConversionArtifacts = createUniversalConversionArtifacts({
  imports: [scannedJsImport],
  targets: ['javascript']
});
assert.equal(directConversionArtifacts.kind, 'frontier.lang.universalConversionArtifacts');
assert.equal(directConversionArtifacts.summary.semanticOperations, directConversionArtifacts.summary.routes);

const jsArtifact = queryUniversalConversionArtifacts(conversionArtifacts, { routeId: jsToJs.id })[0];
assert.equal(jsArtifact.history.kind, 'frontier.lang.semanticHistoryRecord');
assert.equal(jsArtifact.history.id, jsToJs.mergeRefs.historyIds[0]);
assert.equal(jsArtifact.patchBundle.kind, 'frontier.lang.semanticPatchBundleRecord');
assert.equal(jsArtifact.patchBundle.historyIds.includes(jsArtifact.history.id), true);
assert.equal(jsArtifact.patchBundle.admission.autoMergeClaim, false);
assert.equal(jsArtifact.admissionRecord.kind, 'frontier.lang.universalConversionAdmissionRecord');
assert.equal(jsArtifact.admissionRecord.admissionBucket, 'blocked');
assert.equal(jsArtifact.admissionRecord.ids.historyId, jsArtifact.history.id);
assert.equal(jsArtifact.admissionRecord.ids.patchBundleId, jsArtifact.patchBundle.id);
assert.equal(jsArtifact.admissionRecord.semanticOperations.total, jsArtifact.semanticOperations.operations.length);
assert.equal(jsArtifact.admissionRecord.autoMergeClaim, false);
assert.equal(jsArtifact.semanticOperations.kind, 'frontier.lang.semanticOperationSet');
assert.equal(jsArtifact.semanticOperations.operations[0].operationKind, 'sourcePreservation');
assert.equal(jsArtifact.semanticOperations.operations[0].autoMergeClaim, false);
assert.equal(jsArtifact.patchBundle.semanticOperationIds.includes(jsArtifact.semanticOperations.operations[0].id), true);
assert.equal(jsArtifact.materialization.semanticOperationIds.includes(jsArtifact.semanticOperations.operations[0].id), true);
assert.equal(jsArtifact.materialization.status, 'materialized');
assert.equal(jsArtifact.materialization.plannedHistoryIds.includes(jsToJs.mergeRefs.historyIds[0]), true);
assert.equal(jsArtifact.materialization.materializedHistoryIds.includes(jsArtifact.history.id), true);
const jsSourceMapId = jsToJs.mergeRefs.sourceMapIds[0], jsSourceMapMappingId = jsToJs.mergeRefs.sourceMapMappingIds[0], jsSourceMapLinkId = jsArtifact.materialization.sourceMapLinkIds[0];
assert.equal(jsArtifact.materialization.sourceMapIds.includes(jsSourceMapId), true);
assert.equal(jsArtifact.admissionRecord.ids.sourceMapIds.includes(jsSourceMapId), true);
assert.equal(conversionArtifacts.index.sourceMapIds.includes(jsSourceMapId), true);
assert.equal(conversionArtifacts.summary.compactCounts.sourceMaps.mappingIds[jsSourceMapMappingId] >= 1, true);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, { sourceMapId: jsSourceMapId, sourceMapMappingId: jsSourceMapMappingId, sourceMapLinkId: jsSourceMapLinkId })[0].routeId, jsToJs.id);
assert.equal(jsArtifact.autoMergeClaim, false);
assert.equal(jsArtifact.semanticEquivalenceClaim, false);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, { sourcePath: scannedJsImport.sourcePath }).length >= 1, true);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, {
  semanticOperationKind: 'sourcePreservation'
}).some((artifact) => artifact.routeId === jsToJs.id), true);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, {
  admissionBucket: 'blocked'
}).some((artifact) => artifact.routeId === jsToJs.id), true);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, {
  admissionRecordId: jsArtifact.admissionRecord.id,
  risk: 'high'
})[0].routeId, jsToJs.id);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, {
  representationConstructKind: 'source-import'
}).length >= 1, true);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, {
  constructKind: 'source-import'
}).length >= 1, true);

const directReadyArtifact = createUniversalConversionArtifacts({
  id: 'manual-ready-route',
  sourceLanguage: 'javascript',
  target: 'javascript',
  mode: 'preserve-source',
  routeAction: 'preserve-source',
  priority: 'high',
  readiness: 'ready',
  admissionAction: 'admit',
  missingEvidence: [],
  blockers: [],
  review: [],
  mergeScore: {
    schema: 'frontier.lang.semanticMergeScore.v1',
    version: 1,
    value: 92,
    uncappedValue: 92,
    sortKey: 3292,
    higherIsBetter: true,
    readiness: 'ready',
    risk: 'low',
    action: 'admit',
    components: {},
    penalties: []
  },
  mergeRefs: {
    sources: [{ sourcePath: 'src/manual-ready.js', sourceHash: 'hash-ready' }],
    semanticOwnershipKeys: ['content.manualReady'],
    conflictKeys: ['content.manualReady']
  }
});
assert.equal(directReadyArtifact.summary.mergeReady, 0);
assert.equal(directReadyArtifact.routeArtifacts[0].admissionStatus, 'needs-review');
assert.equal(directReadyArtifact.admissionRecords[0].admissionBucket, 'needs-evidence');
assert.equal(directReadyArtifact.admissionRecords[0].evidence.missing.includes('route-bound-evidence'), true);

const editBase = 'export function convert(count) { return count + 1; }\n';
const editWorker = 'export function convert(count, step) { return count + step; }\n';
const editScript = createSemanticEditScript({
  id: 'conversion_artifact_semantic_edit',
  language: 'javascript',
  sourcePath: 'src/conversion-edit.js',
  baseSourceText: editBase,
  workerSourceText: editWorker,
  headSourceText: editBase,
  generatedAt: 779
});
const editProjection = projectSemanticEditScriptToSource({
  id: 'conversion_artifact_semantic_projection',
  script: editScript,
  workerSourceText: editWorker,
  headSourceText: editBase,
  headSourcePath: 'src/conversion-edit.js'
});
const editReplay = replaySemanticEditProjection({
  id: 'conversion_artifact_semantic_replay',
  projection: editProjection,
  currentSourceText: editBase,
  currentSourcePath: 'src/conversion-edit.js',
  currentSourceHash: hashSemanticValue(editBase),
  expectedOutputSourceText: editProjection.sourceText,
  expectedOutputHash: editProjection.projectedHash
});
const editArtifacts = createUniversalConversionArtifacts({
  id: 'semantic-edit-route',
  sourceLanguage: 'javascript',
  target: 'javascript',
  mode: 'preserve-source',
  routeAction: 'preserve-source',
  priority: 'high',
  readiness: 'ready',
  admissionAction: 'admit',
  missingEvidence: [],
  blockers: [],
  review: [],
  mergeScore: {
    schema: 'frontier.lang.semanticMergeScore.v1',
    version: 1,
    value: 96,
    uncappedValue: 96,
    sortKey: 3396,
    higherIsBetter: true,
    readiness: 'ready',
    risk: 'low',
    action: 'admit',
    components: {},
    penalties: []
  },
  mergeRefs: {
    sources: [{ sourcePath: 'src/conversion-edit.js', sourceHash: 'hash-conversion-edit' }],
    semanticOwnershipKeys: ['content.conversionEdit'],
    conflictKeys: ['content.conversionEdit']
  },
  metadata: {
    semanticEditScripts: [editScript],
    semanticEditProjections: [editProjection],
    semanticEditReplays: [editReplay],
    semanticEditEvidence: [{
      id: 'evidence_conversion_artifact_semantic_edit_gate',
      kind: 'test',
      status: 'passed',
      scope: 'semantic-edit:auto-merge'
    }]
  }
});
const editArtifact = editArtifacts.routeArtifacts[0];
const editOperation = editScript.operations[0];
const editProjectionRecord = editProjection.edits[0];
assert.equal(editArtifact.patchBundle.semanticEditScriptIds.includes(editScript.id), true);
assert.equal(editArtifact.patchBundle.semanticEditProjectionIds.includes(editProjection.id), true);
assert.equal(editArtifact.patchBundle.semanticEditReplayIds.includes(editReplay.id), true);
assert.equal(editArtifacts.index.semanticEditStatuses.includes('accepted-clean'), true);
assert.equal(editArtifacts.index.semanticEditAdmissionStatuses.includes('ready'), true);
assert.equal(editArtifacts.index.semanticEditReplayOutputHashes.includes(editReplay.outputHash), true);
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  semanticEditStatus: 'accepted-clean'
})[0].routeId, 'semantic-edit-route');
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  semanticEditAdmission: 'ready'
})[0].routeId, 'semantic-edit-route');
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  semanticEditAdmissionAction: 'admit'
})[0].routeId, 'semantic-edit-route');
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  semanticEditReplayOutputHash: editReplay.outputHash
})[0].routeId, 'semantic-edit-route');
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  semanticEditHash: editReplay.outputHash
})[0].routeId, 'semantic-edit-route');
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  semanticIdentityHash: editOperation.semanticIdentityHash
})[0].routeId, 'semantic-edit-route');
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  operationContentHash: editOperation.operationContentHash
})[0].routeId, 'semantic-edit-route');
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  editContentHash: editProjectionRecord.editContentHash
})[0].routeId, 'semantic-edit-route');
assert.equal(queryUniversalConversionArtifacts(editArtifacts, {
  semanticEditKey: editOperation.semanticKey
})[0].routeId, 'semantic-edit-route');

const jsToRust = queryUniversalConversionPlan(conversionPlan, {
  sourceLanguage: 'javascript',
  target: 'rust'
}).bestRoute;
assert.equal(jsToRust.mode, 'target-adapter');
assert.equal(jsToRust.routeAction, 'run-target-adapter');
assert.equal(jsToRust.adapter, jsRustAdapter.id);
assert.equal(jsToRust.missingEvidence.includes('proof-or-replay-evidence'), true);
assert.equal(jsToRust.mergeScore.sortKey > jsToRust.mergeScore.value, true);

const cToRust = queryUniversalConversionPlan(conversionPlan, {
  sourceLanguage: 'c',
  target: 'rust'
}).bestRoute;
assert.equal(cToRust.mode, 'semantic-index-only');
assert.equal(cToRust.routeAction, 'add-target-adapter');
assert.equal(cToRust.missingEvidence.includes('target-adapter'), true);
assert.equal(cToRust.tasks.some((task) => task.includes('target adapter')), true);
assert.equal(cToRust.mergeScore.action, 'reject');

const cArtifact = queryUniversalConversionArtifacts(conversionArtifacts, {
  routeId: cToRust.id,
  admissionStatus: 'blocked'
})[0];
assert.equal(cArtifact.mode, 'semantic-index-only');
assert.equal(cArtifact.patchBundle.admission.status, 'blocked');
assert.equal(cArtifact.history.admission.status, 'blocked');
assert.equal(cArtifact.admissionBucket, 'blocked');
assert.equal(cArtifact.admissionRecord.admissionBucket, 'blocked');
assert.equal(cArtifact.admissionRecord.risk, 'high');
assert.equal(cArtifact.semanticOperations.operations[0].opaque, true);
assert.equal(cArtifact.semanticOperations.operations[0].operationKind, 'merge');
assert.equal(cArtifact.history.admission.reasonCodes.some((reason) => reason.includes('missing:target-adapter')), true);

const blockedQuery = queryUniversalConversionPlan(conversionPlan, {
  sourceLanguage: 'fortran',
  target: 'rust'
});
assert.equal(blockedQuery.found, false);
assert.equal(blockedQuery.reasons.length, 1);
