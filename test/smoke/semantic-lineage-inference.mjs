import { assert } from './helpers.mjs';
import {
  diffNativeSources,
  inferSemanticLineageEvents,
  importNativeSource,
  resolveSemanticLineage
} from './compiler-api.mjs';

const movedBefore = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  sourceText: 'export function step(value: number) { return value + 1; }\n'
});
const movedAfter = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-core.ts',
  sourceText: 'export function step(value: number) { return value + 1; }\n'
});
const movedInference = inferSemanticLineageEvents({
  id: 'lineage_inference_move_smoke',
  before: movedBefore,
  after: movedAfter,
  generatedAt: 10
});
assert.equal(movedInference.kind, 'frontier.lang.semanticLineageInference');
assert.equal(movedInference.summary.moved, 1);
assert.equal(movedInference.summary.renamed, 0);
assert.equal(movedInference.metadata.autoMergeClaim, false);
assert.equal(movedInference.metadata.semanticEquivalenceClaim, false);
assert.equal(movedInference.readiness, 'needs-review');
const movedEvent = movedInference.events.find((event) => event.eventKind === 'moved');
assert.ok(movedEvent);
assert.equal(movedEvent.evidence.bodyHashMatch, true);
assert.equal(movedEvent.metadata.autoMergeClaim, false);
assert.equal(movedEvent.metadata.semanticEquivalenceClaim, false);
const movedResolution = resolveSemanticLineage(movedInference.lineageMap, {
  anchorKey: movedEvent.from.key,
  generatedAt: 11
});
assert.equal(movedResolution.status, 'resolved');
assert.equal(movedResolution.currentAnchors[0].sourcePath, 'src/runtime-core.ts');

const renamedInference = inferSemanticLineageEvents({
  id: 'lineage_inference_rename_smoke',
  before: parserImportFixture({
    id: 'parser_before_step',
    symbolName: 'step',
    sourceText: 'export function step(value: number) { return value + 1; }\n'
  }),
  after: parserImportFixture({
    id: 'parser_after_advance',
    symbolName: 'advance',
    sourceText: 'export function advance(value: number) { return value + 1; }\n'
  }),
  generatedAt: 20
});
assert.equal(renamedInference.summary.renamed, 1);
const renamedEvent = renamedInference.events.find((event) => event.eventKind === 'renamed');
assert.ok(renamedEvent);
assert.equal(renamedEvent.evidence.signatureHashMatch, true);
assert.equal(renamedEvent.metadata.renamed, true);

const deletedInference = inferSemanticLineageEvents({
  id: 'lineage_inference_delete_smoke',
  before: importNativeSource({
    language: 'typescript',
    sourcePath: 'src/runtime.ts',
    sourceText: 'export function obsolete() { return false; }\n'
  }),
  after: importNativeSource({
    language: 'typescript',
    sourcePath: 'src/runtime.ts',
    sourceText: 'export const runtimeReady = true;\n'
  }),
  generatedAt: 30
});
assert.equal(deletedInference.summary.deleted, 1);
assert.equal(deletedInference.events.some((event) => event.eventKind === 'deleted'), true);
assert.equal(deletedInference.reasons.includes('deleted-anchor-lineage-inferred'), true);
const deletedEvent = deletedInference.events.find((event) => event.eventKind === 'deleted');
assert.equal(deletedEvent.confidence <= 0.8, true);
assert.equal(deletedEvent.metadata.deletionEvidenceScope, 'same-source-file');

const diffResult = diffNativeSources({
  id: 'lineage_inference_native_diff_smoke',
  language: 'typescript',
  beforeSourceText: 'export function load() { return "before"; }\n',
  afterSourceText: 'export function load() { return "after"; }\n',
  sourcePath: 'src/load.ts',
  generatedAt: 40
});
assert.equal(diffResult.lineageInference.kind, 'frontier.lang.semanticLineageInference');
assert.equal(diffResult.metadata.semanticLineageInferenceSummary.beforeSymbols >= 1, true);
assert.equal(diffResult.evidence.some((record) => record.metadata?.semanticLineageInferenceSummary), true);

function parserImportFixture({ id, symbolName, sourceText }) {
  const sourcePath = 'src/runtime.ts';
  const sourceHash = `fixture_hash_${id}`;
  const span = {
    path: sourcePath,
    startLine: 1,
    startColumn: 1,
    endLine: 1,
    endColumn: sourceText.length + 1
  };
  const symbol = {
    id: `symbol_${symbolName}`,
    name: symbolName,
    kind: 'function',
    language: 'typescript',
    nativeAstNodeId: `node_${symbolName}`,
    definitionSpan: span,
    signatureHash: 'fixture_signature_step_body'
  };
  return {
    kind: 'frontier.lang.importResult',
    version: 1,
    id,
    language: 'typescript',
    sourcePath,
    nativeSource: {
      id: `native_source_${id}`,
      language: 'typescript',
      sourcePath,
      sourceHash,
      metadata: { sourcePreservation: { sourceText } }
    },
    nativeAst: {
      id: `native_ast_${id}`,
      language: 'typescript',
      sourcePath,
      sourceHash,
      nodes: {
        [`node_${symbolName}`]: {
          id: `node_${symbolName}`,
          kind: 'function',
          name: symbolName,
          span
        }
      },
      metadata: { sourcePreservation: { sourceText } }
    },
    semanticIndex: {
      id: `semantic_index_${id}`,
      symbols: [symbol],
      relations: [],
      occurrences: [],
      facts: []
    },
    sourceMaps: [{
      id: `source_map_${id}`,
      mappings: [{
        id: `mapping_${id}`,
        semanticSymbolId: symbol.id,
        nativeAstNodeId: symbol.nativeAstNodeId,
        sourceSpan: span,
        precision: 'declaration'
      }]
    }],
    evidence: []
  };
}
