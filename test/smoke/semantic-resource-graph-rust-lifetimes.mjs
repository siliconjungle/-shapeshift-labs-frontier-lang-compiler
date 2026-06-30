import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
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
