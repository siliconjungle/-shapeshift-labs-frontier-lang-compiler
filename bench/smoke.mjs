import { performance } from 'node:perf_hooks';
import {
  compileFrontierSource,
  createEstreeNativeImporterAdapter,
  importNativeSource,
  runNativeImporterAdapter
} from '../dist/index.js';

const source = `
module Bench @id("mod_bench")
type TodoInput @id("type_input") {
  title: Text
}
entity Todo @id("ent_todo") {
  title @id("field_title"): Text
}
action addTodo @id("action_add") {
  input TodoInput
  writes field_title
  returns Patch
}
`;

const targets = ['typescript', 'javascript', 'rust', 'python', 'c'];
const start = performance.now();
let bytes = 0;
for (let index = 0; index < 250; index += 1) {
  bytes += compileFrontierSource(source, { target: targets[index % targets.length] }).output.length;
}
const compileDurationMs = performance.now() - start;

const importStart = performance.now();
const estreeAdapter = createEstreeNativeImporterAdapter();
let nativeSymbols = 0;
for (let index = 0; index < 150; index += 1) {
  const imported = index % 2 === 0
    ? importNativeSource({
      language: 'javascript',
      sourcePath: `src/bench-${index}.js`,
      sourceText: `export function bench${index}() { return ${index}; }\n`
    })
    : await runNativeImporterAdapter(estreeAdapter, {
      sourcePath: `src/bench-${index}.js`,
      sourceText: `export function bench${index}() { return ${index}; }\n`,
      adapterOptions: {
        ast: {
          type: 'Program',
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 42 } },
          body: [{
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: `bench${index}` },
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 42 } }
          }]
        }
      }
    });
  nativeSymbols += imported.semanticIndex?.symbols?.length ?? 0;
}
const importDurationMs = performance.now() - importStart;

console.log(JSON.stringify({
  compiles: 250,
  bytes,
  compileDurationMs: Number(compileDurationMs.toFixed(2)),
  nativeImports: 150,
  nativeSymbols,
  nativeImportDurationMs: Number(importDurationMs.toFixed(2))
}));
