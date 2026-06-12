import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const cBase = 'int add(int count) {\n  return count + 1;\n}\n';
const cWorker = 'int add(int count) {\n  return count + 2;\n}\n';
const cImport = importNativeSource({
  language: 'c',
  sourcePath: 'src/counter.c',
  sourceText: cBase
});
assert.equal(cImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add').definitionSpan.endLine, 3);

const cScript = createSemanticEditScript({
  id: 'semantic_edit_c_multiline_body',
  language: 'c',
  sourcePath: 'src/counter.c',
  baseSourceText: cBase,
  workerSourceText: cWorker,
  headSourceText: cBase
});
assert.equal(cScript.admission.status, 'auto-merge-candidate');

const cProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_c_multiline_projection',
  script: cScript,
  workerSourceText: cWorker,
  headSourceText: cBase
});
assert.equal(cProjection.status, 'projected');
assert.equal(cProjection.sourceText, cWorker);

const movedCReplay = replaySemanticEditProjection({
  id: 'semantic_edit_c_moved_replay',
  projection: cProjection,
  currentSourceText: `int zero(void) {\n  return 0;\n}\n${cBase}`
});
assert.equal(movedCReplay.status, 'accepted-clean');
assert.equal(movedCReplay.outputSourceText, `int zero(void) {\n  return 0;\n}\n${cWorker}`);
assert.equal(movedCReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const shiftedCReplay = replaySemanticEditProjection({
  id: 'semantic_edit_c_shifted_signature_replay',
  projection: cProjection,
  currentSourceText: 'int add(int count, int step) {\n  return count + 1;\n}\n'
});
assert.equal(shiftedCReplay.status, 'accepted-clean');
assert.equal(shiftedCReplay.outputSourceText, 'int add(int count, int step) {\n  return count + 2;\n}\n');
assert.equal(shiftedCReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
