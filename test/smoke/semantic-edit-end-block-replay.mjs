import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const cases = [
  {
    language: 'ruby',
    sourcePath: 'lib/counter.rb',
    baseSourceText: 'class Counter\n  def add(count)\n    count + 1\n  end\nend\n',
    workerSourceText: 'class Counter\n  def add(count)\n    count + 2\n  end\nend\n',
    prefix: '# prefix\n',
    spans: { Counter: 5, 'Counter.instance.add': 4 }
  },
  {
    language: 'lua',
    sourcePath: 'src/counter.lua',
    baseSourceText: 'function add(count)\n  return count + 1\nend\n',
    workerSourceText: 'function add(count)\n  return count + 2\nend\n',
    prefix: '-- prefix\n',
    spans: { add: 3 }
  },
  {
    language: 'elixir',
    sourcePath: 'lib/counter.ex',
    baseSourceText: 'defmodule Counter do\n  def add(count) do\n    count + 1\n  end\nend\n',
    workerSourceText: 'defmodule Counter do\n  def add(count) do\n    count + 2\n  end\nend\n',
    prefix: '# prefix\n',
    spans: { Counter: 5, add: 4 }
  }
];

for (const testCase of cases) {
  const imported = importNativeSource({
    language: testCase.language,
    sourcePath: testCase.sourcePath,
    sourceText: testCase.baseSourceText
  });
  for (const [name, endLine] of Object.entries(testCase.spans)) {
    assert.equal(imported.semanticIndex.symbols.find((symbol) => symbol.name === name).definitionSpan.endLine, endLine);
  }

  const script = createSemanticEditScript({
    id: `semantic_edit_${testCase.language}_end_block_body`,
    language: testCase.language,
    sourcePath: testCase.sourcePath,
    baseSourceText: testCase.baseSourceText,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(script.admission.status, 'auto-merge-candidate');

  const projection = projectSemanticEditScriptToSource({
    id: `semantic_edit_${testCase.language}_end_block_projection`,
    script,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(projection.status, 'projected');
  assert.equal(projection.sourceText, testCase.workerSourceText);

  const replay = replaySemanticEditProjection({
    id: `semantic_edit_${testCase.language}_end_block_moved_replay`,
    projection,
    currentSourceText: `${testCase.prefix}${testCase.baseSourceText}`
  });
  assert.equal(replay.status, 'accepted-clean');
  assert.equal(replay.outputSourceText, `${testCase.prefix}${testCase.workerSourceText}`);
  assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
}
