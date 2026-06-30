import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  createUniversalBorrowScopeConstraintEvidence,
  createUniversalLifetimeConstraintEvidence,
  importNativeSource,
  querySemanticResourceGraph
} from './compiler-api.mjs';

const rustLifetimeRelationImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/lifetime_relation.rs',
  sourceText: [
    "pub fn choose<'long: 'short, 'short>(input: &'long str, fallback: &'short str) -> &'short str {",
    '  fallback',
    '}',
    ''
  ].join('\n')
});
const rustLifetimeRelationSidecar = createSemanticImportSidecar(rustLifetimeRelationImport, { generatedAt: 141.7 });
const rustLifetimeRelationGraph = rustLifetimeRelationSidecar.resourceGraph;
const rustOutlivesRelations = querySemanticResourceGraph(rustLifetimeRelationGraph, {
  kind: 'lifetime-relation',
  lifetimeRelationKind: 'rust-outlives'
});

assert.equal(rustLifetimeRelationGraph.summary.lifetimeRelations >= 4, true);
assert.equal(rustOutlivesRelations.length, 1);
assert.equal(rustOutlivesRelations[0].metadata?.longer, "'long");
assert.equal(rustOutlivesRelations[0].metadata?.shorter, "'short");
assert.equal(rustLifetimeRelationSidecar.summary.resourceGraphLifetimeRelations, rustLifetimeRelationGraph.summary.lifetimeRelations);

const rustOutlivesLifetime = createUniversalLifetimeConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceGraph: rustLifetimeRelationGraph
});

assert.equal(rustOutlivesLifetime.requiredKinds.includes('outlives-relation'), true);
assert.equal(rustOutlivesLifetime.missingKinds.includes('outlives-relation'), true);
assert.equal(rustOutlivesLifetime.missingEvidence.includes('translation-lifetime-constraint:outlives-relation'), true);

const rustAsyncBorrowImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/async_borrow.rs',
  sourceText: [
    "pub async fn fetch<'a>(client: &'a mut Client) -> &'a str {",
    '  if client.ready() {',
    '    return client.name().await;',
    '  }',
    '  client.fallback().await',
    '}',
    ''
  ].join('\n')
});
const rustAsyncBorrowSidecar = createSemanticImportSidecar(rustAsyncBorrowImport, { generatedAt: 141.8 });
const rustAsyncBorrowGraph = rustAsyncBorrowSidecar.resourceGraph;
const rustAsyncBorrowScopes = querySemanticResourceGraph(rustAsyncBorrowGraph, {
  kind: 'borrow-scope',
  borrowScopeConstraintKind: 'borrow-across-await'
});

assert.equal(rustAsyncBorrowGraph.summary.borrowScopes >= 1, true);
assert.equal(rustAsyncBorrowScopes.length, 1);
assert.equal(rustAsyncBorrowScopes[0].constraintKinds.includes('exclusive-borrow-branch-join'), true);
assert.equal(rustAsyncBorrowScopes[0].constraintKinds.includes('no-escape-flow'), true);
assert.equal(rustAsyncBorrowSidecar.borrowScopes.length, rustAsyncBorrowGraph.summary.borrowScopes);
assert.equal(rustAsyncBorrowSidecar.summary.resourceGraphBorrowScopes, rustAsyncBorrowGraph.summary.borrowScopes);

const rustAsyncBorrowConstraint = createUniversalBorrowScopeConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceBorrowScopes: rustAsyncBorrowGraph.borrowScopes
});

assert.equal(rustAsyncBorrowConstraint.requiredKinds.includes('borrow-across-await'), true);
assert.equal(rustAsyncBorrowConstraint.requiredKinds.includes('exclusive-borrow-branch-join'), true);
assert.equal(rustAsyncBorrowConstraint.requiredKinds.includes('no-escape-flow'), true);
assert.equal(rustAsyncBorrowConstraint.missingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
assert.equal(rustAsyncBorrowConstraint.claims.borrowCheckerClaim, false);
