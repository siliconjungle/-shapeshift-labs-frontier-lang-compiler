import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const phpBase = '<?php\nclass Counter {\n  function add($count) {\n    return $count + 1;\n  }\n}\n';
const phpWorker = '<?php\nclass Counter {\n  function add($count) {\n    return $count + 2;\n  }\n}\n';

const cases = [
  {
    language: 'php',
    sourcePath: 'src/Counter.php',
    baseSourceText: phpBase,
    workerSourceText: phpWorker,
    movedSourceText: phpBase.replace('<?php\n', '<?php\n// prefix\n'),
    movedOutputText: phpWorker.replace('<?php\n', '<?php\n// prefix\n'),
    operationAnchor: 'Counter.add:controlFlow:exit#1',
    spans: { Counter: 6, 'Counter.add': 5 }
  },
  {
    language: 'kotlin',
    sourcePath: 'src/Counter.kt',
    baseSourceText: 'class Counter {\n  fun add(count: Int): Int {\n    return count + 1\n  }\n}\n',
    workerSourceText: 'class Counter {\n  fun add(count: Int): Int {\n    return count + 2\n  }\n}\n',
    operationAnchor: 'Counter.add:controlFlow:exit#1',
    spans: { Counter: 5, 'Counter.add': 4 }
  },
  {
    language: 'scala',
    sourcePath: 'src/Counter.scala',
    baseSourceText: 'class Counter {\n  def add(count: Int): Int = {\n    count + 1\n  }\n}\n',
    workerSourceText: 'class Counter {\n  def add(count: Int): Int = {\n    count + 2\n  }\n}\n',
    bodyReason: true,
    operationAnchor: 'Counter.add',
    spans: { Counter: 5, 'Counter.add': 4 }
  },
  {
    language: 'dart',
    sourcePath: 'lib/counter.dart',
    baseSourceText: 'class Counter {\n  int add(int count) {\n    return count + 1;\n  }\n}\n',
    workerSourceText: 'class Counter {\n  int add(int count) {\n    return count + 2;\n  }\n}\n',
    spans: { Counter: 5, add: 4 }
  },
  {
    language: 'zig',
    sourcePath: 'src/counter.zig',
    baseSourceText: 'fn add(count: i32) i32 {\n  return count + 1;\n}\n',
    workerSourceText: 'fn add(count: i32) i32 {\n  return count + 2;\n}\n',
    spans: { add: 3 }
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
    id: `semantic_edit_${testCase.language}_dynamic_brace_body`,
    language: testCase.language,
    sourcePath: testCase.sourcePath,
    baseSourceText: testCase.baseSourceText,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(script.admission.status, 'auto-merge-candidate');
  if (testCase.operationAnchor) assert.equal(script.operations[0].anchor.symbolName, testCase.operationAnchor);

  const projection = projectSemanticEditScriptToSource({
    id: `semantic_edit_${testCase.language}_dynamic_brace_projection`,
    script,
    workerSourceText: testCase.workerSourceText,
    headSourceText: testCase.baseSourceText
  });
  assert.equal(projection.status, 'projected');
  assert.equal(projection.sourceText, testCase.workerSourceText);

  const movedSourceText = testCase.movedSourceText ?? `// prefix\n${testCase.baseSourceText}`;
  const movedOutputText = testCase.movedOutputText ?? `// prefix\n${testCase.workerSourceText}`;
  const replay = replaySemanticEditProjection({
    id: `semantic_edit_${testCase.language}_dynamic_brace_moved_replay`,
    projection,
    currentSourceText: movedSourceText
  });
  assert.equal(replay.status, 'accepted-clean');
  assert.equal(replay.outputSourceText, movedOutputText);
  assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
  if (testCase.bodyReason) {
    assert.equal(replay.edits[0].reasonCodes.includes('current-symbol-body-matches-deleted'), true);
  }
}
