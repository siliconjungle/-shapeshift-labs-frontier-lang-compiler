import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const cases = [
  {
    sourcePath: 'src/counter.madeup',
    baseSourceText: 'function add(count) {\n  return count + 1\n}\n',
    workerSourceText: 'function add(count) {\n  return count + 2\n}\n'
  },
  {
    sourcePath: 'src/counter2.madeup',
    baseSourceText: 'def add(count)\n  count + 1\nend\n',
    workerSourceText: 'def add(count)\n  count + 2\nend\n'
  }
];

for (const testCase of cases) {
  const imported = importNativeSource({
    language: 'madeuplang',
    sourcePath: testCase.sourcePath,
    sourceText: testCase.baseSourceText
  });
  assert.equal(imported.semanticIndex.symbols[0].definitionSpan.endLine, 3);

  const script = createSemanticEditScript({
    id: `semantic_edit_generic_fallback_${testCase.sourcePath.replace(/\W+/g, '_')}`,
    language: 'madeuplang',
    sourcePath: testCase.sourcePath,
    baseSourceText: testCase.baseSourceText,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(script.admission.status, 'auto-merge-candidate');

  const projection = projectSemanticEditScriptToSource({
    id: `semantic_edit_generic_fallback_projection_${testCase.sourcePath.replace(/\W+/g, '_')}`,
    script,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(projection.status, 'projected');

  const replay = replaySemanticEditProjection({
    id: `semantic_edit_generic_fallback_moved_${testCase.sourcePath.replace(/\W+/g, '_')}`,
    projection,
    currentSourceText: `# prefix\n${testCase.baseSourceText}`
  });
  assert.equal(replay.status, 'accepted-clean');
  assert.equal(replay.outputSourceText, `# prefix\n${testCase.workerSourceText}`);
  assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
}
