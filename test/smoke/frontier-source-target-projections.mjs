import { assert } from './helpers.mjs';
import {
  createUniversalAstFromDocument,
  createUniversalConversionPlanFromFrontierSource,
  createUniversalConversionWorklist,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist
} from './compiler-api.mjs';

const source = `
module TargetProjectionEvidence @id("mod_target_projection_evidence")

conversion TsToRust @id("conversion_ts_rust") {
  sourceLanguage typescript
  target rust
}

target rust @id("target_rust") {
  language rust
  package example_todo
  emitPath src/generated/todo.rs
  moduleFormat crate
  projection rustAdapter @id("target_projection_rust") disposition target-adapter readiness needs-review adapter rust_codegen represented semantic-symbol|source-map missing semantic-ownership evidence artifact_projection proof artifact_projection loss loss_borrow_scope missingEvidence translation-borrow-scope:borrow-across-await review adapter-review
  layer ownership @id("target_layer_rust_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
}

nativeSource TodoTypescript @id("native_todo_ts") {
  language typescript
  parser typescript
  sourcePath src/todo.ts
  sourceHash sha256:todo
  symbol Todo
  evidence projectionProbe @id("artifact_projection") kind test status passed path reports/projection.json summary "Projection evidence is source-bound."
  sourceMap todoProjection @id("sourcemap_todo_ts") target typescript targetPath src/generated/todo.ts evidence artifact_projection
  mapping todoTitle @id("map_todo_title") sourceMap sourcemap_todo_ts semanticNode field_title nativeSource native_todo_ts semanticSymbol symbol:Todo.title sourceSpan src/todo.ts:1:1-1:12 generatedSpan src/generated/todo.ts:1:1-1:20 precision exact evidence artifact_projection
  mergeCandidate todoTitle @id("candidate_todo_title") symbol symbol:Todo.title semanticNode field_title conflictKey symbol:Todo.title readiness ready evidence artifact_projection sourceMap sourcemap_todo_ts sourceMapMapping map_todo_title reason "exact source map"
}
`;

const plan = createUniversalConversionPlanFromFrontierSource(source, { generatedAt: 1201 });
const ast = createUniversalAstFromDocument(plan.document);
assert.equal(ast.metadata.authoredTargetProjectionContractIds.includes('target_projection_rust'), true);
assert.equal(ast.metadata.authoredTargetProjectionLayerIds.includes('target_layer_rust_ownership'), true);
assert.equal(ast.metadata.authoredTargetProjectionProofEvidenceIds.includes('artifact_projection'), true);
assert.equal(ast.metadata.authoredTargetProjectionMissingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
assert.equal(ast.metadata.targetProjectionSummary.claims.autoMergeClaim, false);
assert.equal(ast.metadata.targetProjectionSummary.claims.semanticEquivalenceClaim, false);
assert.equal(plan.metadata.authoredFrontierSource.targetProjectionContractIds.includes('target_projection_rust'), true);
assert.equal(plan.metadata.authoredFrontierSource.targetProjectionAdapterIds.includes('rust_codegen'), true);

const route = queryUniversalConversionPlan(plan, {
  sourceLanguage: 'typescript',
  target: 'rust',
  targetProjectionContractId: 'target_projection_rust',
  targetProjectionMissingLayerKind: 'semantic-ownership'
}).bestRoute;
assert.equal(Boolean(route), true);
assert.equal(route.targetProjectionAdapterIds.includes('rust_codegen'), true);
assert.equal(route.targetProjectionProofEvidenceIds.includes('artifact_projection'), true);
assert.equal(route.targetProjectionLossIds.includes('loss_borrow_scope'), true);
assert.equal(route.targetProjectionMissingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
assert.equal(route.review.includes('adapter-review'), true);
assert.equal(route.autoMergeClaim, false);
assert.equal(route.semanticEquivalenceClaim, false);

const worklist = createUniversalConversionWorklist(plan);
assert.equal(worklist.summary.targetProjectionContractIds.includes('target_projection_rust'), true);
assert.equal(worklist.summary.authoredTargetProjectionAdapterIds.includes('rust_codegen'), true);
assert.equal(worklist.summary.targetProjectionReadinesses.includes('needs-review'), true);
assert.equal(worklist.summary.autoMergeClaims, 0);
assert.equal(worklist.summary.semanticEquivalenceClaims, 0);
const proofQuery = queryUniversalConversionWorklist(worklist, {
  targetProjectionProofEvidenceId: 'artifact_projection',
  targetProjectionMissingEvidence: 'translation-borrow-scope:borrow-across-await'
});
assert.equal(proofQuery.found, true);
assert.equal(proofQuery.bestItem.targetProjectionContractIds.includes('target_projection_rust'), true);
assert.equal(proofQuery.bestItem.autoMergeClaim, false);
assert.equal(proofQuery.bestItem.semanticEquivalenceClaim, false);

const targetOnlyPlan = createUniversalConversionPlanFromFrontierSource(source.replace('  target rust\\n', ''), { generatedAt: 1202 });
assert.equal(queryUniversalConversionPlan(targetOnlyPlan, {
  sourceLanguage: 'typescript',
  target: 'rust',
  targetProjectionContractId: 'target_projection_rust'
}).found, true);
