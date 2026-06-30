import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  createUniversalOwnershipConstraintEvidence,
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

const rustMoveTransferImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/move_transfer.rs',
  sourceText: [
    'pub fn consume(value: String) -> String {',
    '  let local = value;',
    '  audit(local);',
    '  let output = String::new();',
    '  output',
    '}',
    ''
  ].join('\n')
});
const rustMoveTransferSidecar = createSemanticImportSidecar(rustMoveTransferImport, { generatedAt: 141.9 });
const rustMoveTransferGraph = rustMoveTransferSidecar.resourceGraph;
const rustMoveTransfers = querySemanticResourceGraph(rustMoveTransferGraph, { kind: 'move' });
const rustMoveKinds = rustMoveTransfers.map((record) => record.moveKind);

assert.equal(rustMoveKinds.includes('rust-call-argument-move'), true);
assert.equal(rustMoveKinds.includes('rust-return-move'), true);
assert.equal(rustMoveTransferGraph.summary.moves >= 3, true);
assert.equal(rustMoveTransferSidecar.summary.resourceGraphMoves, rustMoveTransferGraph.summary.moves);

const rustMoveTransferConstraint = createUniversalOwnershipConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceGraph: rustMoveTransferGraph
});

assert.equal(rustMoveTransferConstraint.requiredKinds.includes('call-argument-ownership-transfer'), true);
assert.equal(rustMoveTransferConstraint.requiredKinds.includes('return-ownership-transfer'), true);
assert.equal(rustMoveTransferConstraint.missingEvidence.includes('translation-ownership-constraint:call-argument-ownership-transfer'), true);
assert.equal(rustMoveTransferConstraint.missingEvidence.includes('translation-ownership-constraint:return-ownership-transfer'), true);

const rustCopyCloneDropImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/copy_clone_drop.rs',
  sourceText: [
    'pub fn copy_clone_drop(source: String, count: usize) -> String {',
    '  let temp = String::new();',
    '  let copied = count;',
    '  let cloned = source.clone();',
    '  consume(cloned);',
    '  source',
    '}',
    ''
  ].join('\n')
});
const rustCopyCloneDropGraph = createSemanticImportSidecar(rustCopyCloneDropImport, { generatedAt: 142 }).resourceGraph;
const copyResources = rustCopyCloneDropGraph.resources.filter((record) => record.metadata?.copySemantics);
const cloneResources = rustCopyCloneDropGraph.resources.filter((record) => record.metadata?.cloneSemantics);
const destructorDrops = rustCopyCloneDropGraph.drops.filter((record) => record.metadata?.dropSemantics === 'rust-destructor-drop');
const countMoves = rustCopyCloneDropGraph.moves.filter((record) => record.metadata?.fromBinding === 'count' || record.metadata?.movedBinding === 'count');

assert.equal(copyResources.some((record) => record.name === 'count'), true);
assert.equal(copyResources.some((record) => record.name === 'copied'), true);
assert.equal(cloneResources.some((record) => record.metadata?.cloneSourceBinding === 'source'), true);
assert.equal(destructorDrops.length >= 1, true);
assert.equal(countMoves.length, 0);

const rustCopyCloneDropConstraint = createUniversalOwnershipConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceGraph: rustCopyCloneDropGraph
});

assert.equal(rustCopyCloneDropConstraint.requiredKinds.includes('copy-preserves-source'), true);
assert.equal(rustCopyCloneDropConstraint.requiredKinds.includes('clone-produces-owned-value'), true);
assert.equal(rustCopyCloneDropConstraint.requiredKinds.includes('destructor-drop-semantics'), true);
assert.equal(rustCopyCloneDropConstraint.missingEvidence.includes('translation-ownership-constraint:copy-preserves-source'), true);
