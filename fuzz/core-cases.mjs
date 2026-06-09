import assert from 'node:assert/strict';
import {
  compileFrontierSource,
  createBidirectionalTargetChangeRecord,
  createSemanticLineageEvent,
  createSemanticLineageMap,
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
  for (let index = 0; index < 30; index += 1) {
    const targetName = index % 3 === 0 ? 'missingRun' : 'run';
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
      targetPath: `src/fuzz-${index}.rs`,
      baseTarget: {
        language: 'rust',
        sourcePath: `src/fuzz-${index}.rs`,
        sourceText: `pub fn ${targetName}(value: i32) -> i32 { value + ${index} }\n`
      },
      editedTarget: {
        language: 'rust',
        sourcePath: `src/fuzz-${index}.rs`,
        sourceText: `pub fn ${targetName}(value: i32) -> i32 { value + ${index + 1} }\n`
      },
      lineage
    });
    assert.equal(record.metadata.autoMergeClaim, false);
    assert.equal(record.metadata.semanticEquivalenceClaim, false);
    assert.ok(['needs-review', 'blocked'].includes(record.readiness));
    assert.equal(record.sourcePatchBundle.admission.autoMergeClaim, false);
  }
}
