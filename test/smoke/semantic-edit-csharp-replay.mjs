import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const csharpBase = 'class Counter {\n  int Add(int count) {\n    return count + 1;\n  }\n}\n';
const csharpWorker = 'class Counter {\n  int Add(int count) {\n    return count + 2;\n  }\n}\n';
const csharpImport = importNativeSource({
  language: 'csharp',
  sourcePath: 'src/Counter.cs',
  sourceText: csharpBase
});
assert.equal(csharpImport.semanticIndex.symbols.find((symbol) => symbol.name === 'Counter').definitionSpan.endLine, 5);
assert.equal(csharpImport.semanticIndex.symbols.find((symbol) => symbol.name === 'Add').definitionSpan.endLine, 4);

const csharpScript = createSemanticEditScript({
  id: 'semantic_edit_csharp_multiline_body',
  language: 'csharp',
  sourcePath: 'src/Counter.cs',
  baseSourceText: csharpBase,
  workerSourceText: csharpWorker,
  headSourceText: csharpBase
});
assert.equal(csharpScript.admission.status, 'auto-merge-candidate');

const csharpProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_csharp_multiline_projection',
  script: csharpScript,
  workerSourceText: csharpWorker,
  headSourceText: csharpBase
});
assert.equal(csharpProjection.status, 'projected');
assert.equal(csharpProjection.sourceText, csharpWorker);

const movedCsharpReplay = replaySemanticEditProjection({
  id: 'semantic_edit_csharp_moved_replay',
  projection: csharpProjection,
  currentSourceText: `sealed class Prefix {}\n${csharpBase}`
});
assert.equal(movedCsharpReplay.status, 'accepted-clean');
assert.equal(movedCsharpReplay.outputSourceText, `sealed class Prefix {}\n${csharpWorker}`);
assert.equal(movedCsharpReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const shiftedCsharpReplay = replaySemanticEditProjection({
  id: 'semantic_edit_csharp_shifted_signature_replay',
  projection: csharpProjection,
  currentSourceText: 'class Counter {\n  int Add(int count, int step) {\n    return count + 1;\n  }\n}\n'
});
assert.equal(shiftedCsharpReplay.status, 'accepted-clean');
assert.equal(shiftedCsharpReplay.outputSourceText, 'class Counter {\n  int Add(int count, int step) {\n    return count + 2;\n  }\n}\n');
assert.equal(shiftedCsharpReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
