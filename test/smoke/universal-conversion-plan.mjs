import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { scannedCImport } from './scanned-languages.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
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
assert.equal(conversionArtifacts.summary.semanticOperations, conversionPlan.routes.length);
assert.equal(conversionArtifacts.summary.autoMergeClaims, 0);
assert.equal(conversionArtifacts.summary.semanticEquivalenceClaims, 0);

const jsArtifact = queryUniversalConversionArtifacts(conversionArtifacts, { routeId: jsToJs.id })[0];
assert.equal(jsArtifact.history.kind, 'frontier.lang.semanticHistoryRecord');
assert.equal(jsArtifact.history.id, jsToJs.mergeRefs.historyIds[0]);
assert.equal(jsArtifact.patchBundle.kind, 'frontier.lang.semanticPatchBundleRecord');
assert.equal(jsArtifact.patchBundle.historyIds.includes(jsArtifact.history.id), true);
assert.equal(jsArtifact.patchBundle.admission.autoMergeClaim, false);
assert.equal(jsArtifact.semanticOperations.kind, 'frontier.lang.semanticOperationSet');
assert.equal(jsArtifact.semanticOperations.operations[0].operationKind, 'sourcePreservation');
assert.equal(jsArtifact.semanticOperations.operations[0].autoMergeClaim, false);
assert.equal(jsArtifact.patchBundle.semanticOperationIds.includes(jsArtifact.semanticOperations.operations[0].id), true);
assert.equal(jsArtifact.materialization.semanticOperationIds.includes(jsArtifact.semanticOperations.operations[0].id), true);
assert.equal(jsArtifact.materialization.status, 'materialized');
assert.equal(jsArtifact.materialization.plannedHistoryIds.includes(jsToJs.mergeRefs.historyIds[0]), true);
assert.equal(jsArtifact.materialization.materializedHistoryIds.includes(jsArtifact.history.id), true);
assert.equal(jsArtifact.autoMergeClaim, false);
assert.equal(jsArtifact.semanticEquivalenceClaim, false);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, { sourcePath: scannedJsImport.sourcePath }).length >= 1, true);
assert.equal(queryUniversalConversionArtifacts(conversionArtifacts, {
  semanticOperationKind: 'sourcePreservation'
}).some((artifact) => artifact.routeId === jsToJs.id), true);

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
assert.equal(cArtifact.semanticOperations.operations[0].opaque, true);
assert.equal(cArtifact.semanticOperations.operations[0].operationKind, 'merge');
assert.equal(cArtifact.history.admission.reasonCodes.some((reason) => reason.includes('missing:target-adapter')), true);

const blockedQuery = queryUniversalConversionPlan(conversionPlan, {
  sourceLanguage: 'fortran',
  target: 'rust'
});
assert.equal(blockedQuery.found, false);
assert.equal(blockedQuery.reasons.length, 1);
