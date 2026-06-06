import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { scannedCImport, scannedRImport } from './scanned-languages.mjs';
import { createProjectionReadinessMatrix, ProjectionReadinessStatuses, queryProjectionReadinessMatrix } from './compiler-api.mjs';

const projectionReadinessMatrix = createProjectionReadinessMatrix({
  generatedAt: 654,
  imports: [scannedJsImport, scannedCImport, scannedRImport],
  adapters: [{
    id: 'fixture-js-rust-projection-slot',
    language: 'javascript',
    parser: 'estree',
    projectionTargets: ['rust']
  }],
  targets: ['javascript', 'rust', 'c']
});
assert.equal(projectionReadinessMatrix.kind, 'frontier.lang.projectionReadinessMatrix');
assert.equal(projectionReadinessMatrix.generatedAt, 654);
assert.deepEqual(projectionReadinessMatrix.metadata.statuses, [...ProjectionReadinessStatuses]);
assert.equal(projectionReadinessMatrix.metadata.featureCategories.includes('macroMetaprogramming'), true);
assert.ok(projectionReadinessMatrix.summary.featureCells >= projectionReadinessMatrix.summary.targetEntries);
assert.ok(projectionReadinessMatrix.summary.byFeatureStatus.macroMetaprogramming.lossy >= 1);

const jsSourcePreservationQuery = queryProjectionReadinessMatrix(projectionReadinessMatrix, {
  sourceLanguage: 'javascript',
  target: 'javascript',
  featureCategory: 'sourcePreservation'
});
assert.equal(jsSourcePreservationQuery.found, true);
assert.equal(jsSourcePreservationQuery.status, 'preserve');

const jsRustSyntaxQuery = queryProjectionReadinessMatrix(projectionReadinessMatrix, {
  sourceLanguage: 'javascript',
  target: 'rust',
  featureCategory: 'syntax'
});
assert.equal(jsRustSyntaxQuery.status, 'shim');

const jsRustSemanticQuery = queryProjectionReadinessMatrix(projectionReadinessMatrix, {
  sourceLanguage: 'javascript',
  target: 'rust',
  featureCategory: 'semantic'
});
assert.equal(jsRustSemanticQuery.status, 'lossy');
assert.equal(jsRustSemanticQuery.feature.lossKinds.includes('dynamicRuntime'), true);

const cMacroProjectionQuery = queryProjectionReadinessMatrix(projectionReadinessMatrix, {
  sourceLanguage: 'c',
  target: 'c',
  featureCategory: 'macroMetaprogramming'
});
assert.equal(cMacroProjectionQuery.status, 'lossy');
assert.equal(cMacroProjectionQuery.feature.lossKinds.includes('preprocessor'), true);

const rRustBlockedProjectionQuery = queryProjectionReadinessMatrix(projectionReadinessMatrix, {
  sourceLanguage: 'r',
  target: 'rust',
  featureCategory: 'semantic'
});
assert.equal(rRustBlockedProjectionQuery.status, 'blocked');

const jsRustLoweringMatrix = createProjectionReadinessMatrix({
  imports: [scannedJsImport],
  targets: ['rust'],
  targetAdapters: [{
    id: 'fixture-js-rust-readiness-lowerer',
    sourceLanguage: 'javascript',
    target: 'rust',
    coverage: { readiness: 'ready', handledLossKinds: ['dynamicRuntime'] },
    project() {
      return { output: 'pub fn add_todo_from_readiness_matrix() {}\n', readiness: 'ready' };
    }
  }]
});
const jsRustLoweringQuery = queryProjectionReadinessMatrix(jsRustLoweringMatrix, {
  sourceLanguage: 'javascript',
  target: 'rust',
  featureCategory: 'semantic'
});
assert.equal(jsRustLoweringQuery.status, 'lower');
assert.equal(jsRustLoweringQuery.readiness, 'ready');
assert.equal(jsRustLoweringMatrix.summary.lowerTargets >= 1, true);
