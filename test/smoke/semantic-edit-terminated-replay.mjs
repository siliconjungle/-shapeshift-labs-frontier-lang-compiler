import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const cases = [
  {
    language: 'erlang',
    sourcePath: 'src/counter.erl',
    baseSourceText: 'add(Count) ->\n  Count + 1.\n',
    workerSourceText: 'add(Count) ->\n  Count + 2.\n',
    prefix: '% prefix\n',
    spanEndLine: 2
  },
  {
    language: 'haskell',
    sourcePath: 'src/Counter.hs',
    baseSourceText: 'add count =\n  count + 1\n',
    workerSourceText: 'add count =\n  count + 2\n',
    prefix: '-- prefix\n',
    spanEndLine: 3
  },
  {
    language: 'sql',
    sourcePath: 'schema/counter.sql',
    baseSourceText: 'CREATE FUNCTION add_count(count int) RETURNS int AS $$\n  SELECT count + 1;\n$$ LANGUAGE sql;\n',
    workerSourceText: 'CREATE FUNCTION add_count(count int) RETURNS int AS $$\n  SELECT count + 2;\n$$ LANGUAGE sql;\n',
    prefix: '-- prefix\n',
    symbolName: 'add_count',
    spanEndLine: 3
  }
];

for (const testCase of cases) {
  const imported = importNativeSource({
    language: testCase.language,
    sourcePath: testCase.sourcePath,
    sourceText: testCase.baseSourceText
  });
  const symbolName = testCase.symbolName ?? 'add';
  assert.equal(imported.semanticIndex.symbols.find((symbol) => symbol.name === symbolName).definitionSpan.endLine, testCase.spanEndLine);

  const script = createSemanticEditScript({
    id: `semantic_edit_${testCase.language}_terminated_body`,
    language: testCase.language,
    sourcePath: testCase.sourcePath,
    baseSourceText: testCase.baseSourceText,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(script.admission.status, 'auto-merge-candidate');
  assert.equal(script.operations[0].spans.head.endLine, testCase.spanEndLine);

  const projection = projectSemanticEditScriptToSource({
    id: `semantic_edit_${testCase.language}_terminated_projection`,
    script,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(projection.status, 'projected');

  const replay = replaySemanticEditProjection({
    id: `semantic_edit_${testCase.language}_terminated_moved_replay`,
    projection,
    currentSourceText: `${testCase.prefix}${testCase.baseSourceText}`
  });
  assert.equal(replay.status, 'accepted-clean');
  assert.equal(replay.outputSourceText, `${testCase.prefix}${testCase.workerSourceText}`);
  assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
}
