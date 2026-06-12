import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const goBase = 'package main\n\nfunc add(count int) int {\n  return count + 1\n}\n';
const goWorker = 'package main\n\nfunc add(count int) int {\n  return count + 2\n}\n';
const goImport = importNativeSource({
  language: 'go',
  sourcePath: 'src/counter.go',
  sourceText: goBase
});
assert.equal(goImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add').definitionSpan.endLine, 5);

const goScript = createSemanticEditScript({
  id: 'semantic_edit_go_multiline_body',
  language: 'go',
  sourcePath: 'src/counter.go',
  baseSourceText: goBase,
  workerSourceText: goWorker,
  headSourceText: goBase
});
assert.equal(goScript.admission.status, 'auto-merge-candidate');

const goProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_go_multiline_projection',
  script: goScript,
  workerSourceText: goWorker,
  headSourceText: goBase
});
assert.equal(goProjection.status, 'projected');
assert.equal(goProjection.sourceText, goWorker);

const movedGoReplay = replaySemanticEditProjection({
  id: 'semantic_edit_go_moved_replay',
  projection: goProjection,
  currentSourceText: `const zero = 0\n${goBase}`
});
assert.equal(movedGoReplay.status, 'accepted-clean');
assert.equal(movedGoReplay.outputSourceText, `const zero = 0\n${goWorker}`);
assert.equal(movedGoReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const shiftedGoReplay = replaySemanticEditProjection({
  id: 'semantic_edit_go_shifted_signature_replay',
  projection: goProjection,
  currentSourceText: 'package main\n\nfunc add(count int, step int) int {\n  return count + 1\n}\n'
});
assert.equal(shiftedGoReplay.status, 'accepted-clean');
assert.equal(shiftedGoReplay.outputSourceText, 'package main\n\nfunc add(count int, step int) int {\n  return count + 2\n}\n');
