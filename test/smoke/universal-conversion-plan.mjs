import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { scannedCImport } from './scanned-languages.mjs';
import { createUniversalConversionPlan, queryUniversalConversionPlan } from './compiler-api.mjs';

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

const blockedQuery = queryUniversalConversionPlan(conversionPlan, {
  sourceLanguage: 'fortran',
  target: 'rust'
});
assert.equal(blockedQuery.found, false);
assert.equal(blockedQuery.reasons.length, 1);
