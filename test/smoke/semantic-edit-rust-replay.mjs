import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const rustBase = 'pub fn add(count: i32) -> i32 {\n  count + 1\n}\n';
const rustWorker = 'pub fn add(count: i32) -> i32 {\n  count + 2\n}\n';
const rustScript = createSemanticEditScript({
  id: 'semantic_edit_rust_multiline_body',
  language: 'rust',
  sourcePath: 'src/counter.rs',
  baseSourceText: rustBase,
  workerSourceText: rustWorker,
  headSourceText: rustBase
});
assert.equal(rustScript.admission.status, 'auto-merge-candidate');
assert.equal(rustScript.operations[0].spans.head.endLine, 3);

const rustProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_rust_multiline_projection',
  script: rustScript,
  workerSourceText: rustWorker,
  headSourceText: rustBase
});
assert.equal(rustProjection.status, 'projected');
assert.equal(rustProjection.sourceText, rustWorker);

const movedRustReplay = replaySemanticEditProjection({
  id: 'semantic_edit_rust_moved_replay',
  projection: rustProjection,
  currentSourceText: `const ZERO: i32 = 0;\n${rustBase}`
});
assert.equal(movedRustReplay.status, 'accepted-clean');
assert.equal(movedRustReplay.outputSourceText, `const ZERO: i32 = 0;\n${rustWorker}`);
assert.equal(movedRustReplay.edits[0].reasonCodes.includes('current-symbol-body-matches-deleted'), true);
assert.equal(movedRustReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const shiftedRustReplay = replaySemanticEditProjection({
  id: 'semantic_edit_rust_shifted_signature_replay',
  projection: rustProjection,
  currentSourceText: 'pub fn add(count: i32, step: i32) -> i32 {\n  count + 1\n}\n'
});
assert.equal(shiftedRustReplay.status, 'accepted-clean');
assert.equal(shiftedRustReplay.outputSourceText, 'pub fn add(count: i32, step: i32) -> i32 {\n  count + 2\n}\n');
assert.equal(shiftedRustReplay.edits[0].reasonCodes.includes('current-symbol-body-matches-deleted'), true);
