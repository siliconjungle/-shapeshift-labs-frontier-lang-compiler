import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const javaBase = 'class Counter {\n  int add(int count) {\n    return count + 1;\n  }\n}\n';
const javaWorker = 'class Counter {\n  int add(int count) {\n    return count + 2;\n  }\n}\n';
const javaImport = importNativeSource({
  language: 'java',
  sourcePath: 'src/Counter.java',
  sourceText: javaBase
});
assert.equal(javaImport.semanticIndex.symbols.find((symbol) => symbol.name === 'Counter').definitionSpan.endLine, 5);
assert.equal(javaImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add').definitionSpan.endLine, 4);

const javaScript = createSemanticEditScript({
  id: 'semantic_edit_java_multiline_body',
  language: 'java',
  sourcePath: 'src/Counter.java',
  baseSourceText: javaBase,
  workerSourceText: javaWorker,
  headSourceText: javaBase
});
assert.equal(javaScript.admission.status, 'auto-merge-candidate');

const javaProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_java_multiline_projection',
  script: javaScript,
  workerSourceText: javaWorker,
  headSourceText: javaBase
});
assert.equal(javaProjection.status, 'projected');
assert.equal(javaProjection.sourceText, javaWorker);

const movedJavaReplay = replaySemanticEditProjection({
  id: 'semantic_edit_java_moved_replay',
  projection: javaProjection,
  currentSourceText: `final class Prefix {}\n${javaBase}`
});
assert.equal(movedJavaReplay.status, 'accepted-clean');
assert.equal(movedJavaReplay.outputSourceText, `final class Prefix {}\n${javaWorker}`);
assert.equal(movedJavaReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const shiftedJavaReplay = replaySemanticEditProjection({
  id: 'semantic_edit_java_shifted_signature_replay',
  projection: javaProjection,
  currentSourceText: 'class Counter {\n  int add(int count, int step) {\n    return count + 1;\n  }\n}\n'
});
assert.equal(shiftedJavaReplay.status, 'accepted-clean');
assert.equal(shiftedJavaReplay.outputSourceText, 'class Counter {\n  int add(int count, int step) {\n    return count + 2;\n  }\n}\n');
assert.equal(shiftedJavaReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
