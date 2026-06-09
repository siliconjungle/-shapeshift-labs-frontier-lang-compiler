import assert from 'node:assert/strict';
import {
  compileFrontierSource,
  createBidirectionalTargetChangeRecord,
  createSemanticLineageEvent,
  createSemanticLineageMap,
  inferSemanticLineageEvents,
  importNativeSource,
  resolveSemanticLineage
} from '../dist/index.js';

const targets = ['typescript', 'javascript', 'rust', 'python', 'c'];

export function runCoreFuzzCases() {
  for (let index = 0; index < 100; index += 1) {
    const source = `
module Fuzz${index} @id("mod_${index}")
type ItemInput @id("type_input_${index}") {
  value: Text
}
entity Item @id("ent_${index}") {
  value @id("field_value_${index}"): Text
}
action updateItem @id("action_${index}") {
  input ItemInput
  writes field_value_${index}
  returns Patch
}
`;
    const result = compileFrontierSource(source, { target: targets[index % targets.length] });
    assert.equal(result.ok, true);
    assert.ok(result.output.length > 0);
  }
  for (let index = 0; index < 50; index += 1) {
    const startKey = `fuzz#lineage#${index}#0`;
    const events = [];
    const width = 3 + (index % 7);
    for (let step = 0; step < width; step += 1) {
      events.push(createSemanticLineageEvent({
        id: `fuzz_lineage_${index}_${step}`,
        createdAt: step,
        eventKind: step === width - 1 && index % 5 === 0 ? 'renamed' : 'moved',
        from: { key: `fuzz#lineage#${index}#${step}` },
        to: { key: `fuzz#lineage#${index}#${step + 1}` },
        confidence: 1 - step / 100
      }));
    }
    if (index % 11 === 0) {
      events.push(createSemanticLineageEvent({
        id: `fuzz_lineage_${index}_cycle`,
        createdAt: width,
        eventKind: 'moved',
        from: { key: `fuzz#lineage#${index}#${width}` },
        to: { key: startKey }
      }));
    }
    const result = resolveSemanticLineage(createSemanticLineageMap(events), startKey, { maxDepth: 16 });
    assert.ok(['resolved', 'cycle'].includes(result.status));
    assert.ok(result.traversedEventIds.length <= 16);
    assert.equal(new Set(result.traversedEventIds).size, result.traversedEventIds.length);
  }
  const source = importNativeSource({
    language: 'typescript',
    sourcePath: 'src/fuzz-bidirectional.ts',
    sourceText: 'export function run(value: number): number { return value + 1; }\n'
  });
  const sourceSymbol = source.semanticIndex.symbols.find((symbol) => symbol.name === 'run');
  const sourceMapping = source.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === sourceSymbol.id);
  for (let index = 0; index < 30; index += 1) {
    const targetName = index % 3 === 0 ? 'missingRun' : 'run';
    const targetPath = `src/fuzz-${index}.rs`;
    const lineage = index % 3 === 1
      ? [
        createSemanticLineageEvent({
          eventKind: 'split',
          from: { key: 'source#src/fuzz-bidirectional.ts#body#run', symbolName: 'run' },
          to: [
            { key: 'source#src/fuzz-a.ts#body#runFast', symbolName: 'runFast' },
            { key: 'source#src/fuzz-b.ts#body#runSafe', symbolName: 'runSafe' }
          ]
        })
      ]
      : [];
    const record = createBidirectionalTargetChangeRecord({
      id: `fuzz_bidirectional_${index}`,
      source,
      targetLanguage: 'rust',
      targetPath,
      baseTarget: {
        language: 'rust',
        sourcePath: targetPath,
        sourceText: `pub fn ${targetName}(value: i32) -> i32 { value + ${index} }\n`
      },
      editedTarget: {
        language: 'rust',
        sourcePath: targetPath,
        sourceText: `pub fn ${targetName}(value: i32) -> i32 { value + ${index + 1} }\n`
      },
      ...(index % 4 === 0 ? { sourceMaps: [fuzzRustSourceMap(source, sourceSymbol, sourceMapping, targetPath, targetName, index)] } : {}),
      lineage
    });
    assert.equal(record.metadata.autoMergeClaim, false);
    assert.equal(record.metadata.semanticEquivalenceClaim, false);
    assert.ok(['needs-review', 'blocked'].includes(record.readiness));
    assert.equal(record.sourcePatchBundle.admission.autoMergeClaim, false);
    if (index % 4 === 0) assert.equal(record.summary.sourceMapBackedMatches >= 1, true);
  }
  for (let index = 0; index < 40; index += 1) {
    const name = `lineageFuzz${index}`;
    const beforePath = `src/lineage-before-${index}.ts`;
    const afterPath = index % 4 === 0 ? beforePath : `src/lineage-after-${index}.ts`;
    const afterSourceText = index % 7 === 0
      ? `export const lineageReplacement${index} = true;\n`
      : `export function ${name}(value: number) { return value + ${index}; }\n`;
    const inference = inferSemanticLineageEvents({
      id: `fuzz_lineage_inference_${index}`,
      before: {
        language: 'typescript',
        sourcePath: beforePath,
        sourceText: `export function ${name}(value: number) { return value + ${index}; }\n`
      },
      after: {
        language: 'typescript',
        sourcePath: afterPath,
        sourceText: afterSourceText
      }
    });
    assert.equal(inference.metadata.autoMergeClaim, false);
    assert.equal(inference.metadata.semanticEquivalenceClaim, false);
    assert.ok(['ready', 'needs-review', 'blocked'].includes(inference.readiness));
    assert.ok(inference.events.length <= inference.summary.beforeSymbols + inference.summary.afterSymbols);
  }
}

function fuzzRustSourceMap(source, sourceSymbol, sourceMapping, targetPath, targetName, index) {
  return {
    kind: 'frontier.lang.sourceMap',
    version: 1,
    id: `fuzz_source_map_${index}`,
    sourcePath: source.sourcePath,
    sourceHash: source.nativeSource.sourceHash,
    target: 'rust',
    targetPath,
    mappings: [{
      id: `fuzz_source_map_run_${index}`,
      semanticSymbolId: sourceSymbol.id,
      nativeAstNodeId: sourceSymbol.nativeAstNodeId,
      sourceSpan: sourceMapping.sourceSpan,
      generatedSpan: { path: targetPath, target: 'rust', targetPath, startLine: 1, startColumn: 1, endLine: 1, endColumn: 72, generatedName: targetName },
      target: 'rust',
      generatedName: targetName,
      precision: 'declaration',
      preservation: 'declaration'
    }]
  };
}
