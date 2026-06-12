import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const cases = [
  {
    language: 'r',
    sourcePath: 'R/counter.R',
    baseSourceText: 'add <- function(count) {\n  count + 1\n}\n',
    workerSourceText: 'add <- function(count) {\n  count + 2\n}\n'
  },
  {
    language: 'shell',
    sourcePath: 'scripts/counter.sh',
    baseSourceText: 'add() {\n  echo $((count + 1))\n}\n',
    workerSourceText: 'add() {\n  echo $((count + 2))\n}\n'
  }
];

for (const testCase of cases) {
  const imported = importNativeSource({
    language: testCase.language,
    sourcePath: testCase.sourcePath,
    sourceText: testCase.baseSourceText
  });
  assert.equal(imported.semanticIndex.symbols.find((symbol) => symbol.name === 'add').definitionSpan.endLine, 3);

  const script = createSemanticEditScript({
    id: `semantic_edit_${testCase.language}_script_brace_body`,
    language: testCase.language,
    sourcePath: testCase.sourcePath,
    baseSourceText: testCase.baseSourceText,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(script.admission.status, 'auto-merge-candidate');
  assert.equal(script.operations[0].spans.head.endLine, 3);

  const projection = projectSemanticEditScriptToSource({
    id: `semantic_edit_${testCase.language}_script_brace_projection`,
    script,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(projection.status, 'projected');

  const replay = replaySemanticEditProjection({
    id: `semantic_edit_${testCase.language}_script_brace_moved_replay`,
    projection,
    currentSourceText: `# prefix\n${testCase.baseSourceText}`
  });
  assert.equal(replay.status, 'accepted-clean');
  assert.equal(replay.outputSourceText, `# prefix\n${testCase.workerSourceText}`);
  assert.equal(replay.edits[0].reasonCodes.includes('current-symbol-body-matches-deleted'), true);
  assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
}
