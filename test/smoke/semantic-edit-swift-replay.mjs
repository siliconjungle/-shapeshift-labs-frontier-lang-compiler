import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const swiftBase = 'struct Counter {\n  func add(count: Int) -> Int {\n    return count + 1\n  }\n}\n';
const swiftWorker = 'struct Counter {\n  func add(count: Int) -> Int {\n    return count + 2\n  }\n}\n';
const swiftImport = importNativeSource({
  language: 'swift',
  sourcePath: 'Sources/Counter.swift',
  sourceText: swiftBase
});
assert.equal(swiftImport.semanticIndex.symbols.find((symbol) => symbol.name === 'Counter').definitionSpan.endLine, 5);
assert.equal(swiftImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add').definitionSpan.endLine, 4);

const swiftScript = createSemanticEditScript({
  id: 'semantic_edit_swift_multiline_body',
  language: 'swift',
  sourcePath: 'Sources/Counter.swift',
  baseSourceText: swiftBase,
  workerSourceText: swiftWorker,
  headSourceText: swiftBase
});
assert.equal(swiftScript.admission.status, 'auto-merge-candidate');

const swiftProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_swift_multiline_projection',
  script: swiftScript,
  workerSourceText: swiftWorker,
  headSourceText: swiftBase
});
assert.equal(swiftProjection.status, 'projected');
assert.equal(swiftProjection.sourceText, swiftWorker);

const movedSwiftReplay = replaySemanticEditProjection({
  id: 'semantic_edit_swift_moved_replay',
  projection: swiftProjection,
  currentSourceText: `struct Prefix {}\n${swiftBase}`
});
assert.equal(movedSwiftReplay.status, 'accepted-clean');
assert.equal(movedSwiftReplay.outputSourceText, `struct Prefix {}\n${swiftWorker}`);
assert.equal(movedSwiftReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const shiftedSwiftReplay = replaySemanticEditProjection({
  id: 'semantic_edit_swift_shifted_signature_replay',
  projection: swiftProjection,
  currentSourceText: 'struct Counter {\n  func add(count: Int, step: Int) -> Int {\n    return count + 1\n  }\n}\n'
});
assert.equal(shiftedSwiftReplay.status, 'accepted-clean');
assert.equal(shiftedSwiftReplay.outputSourceText, 'struct Counter {\n  func add(count: Int, step: Int) -> Int {\n    return count + 2\n  }\n}\n');
assert.equal(shiftedSwiftReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
