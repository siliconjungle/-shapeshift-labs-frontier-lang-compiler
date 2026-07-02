import { assert } from './helpers.mjs';
import {
  compileFrontierSource,
  emitForTargetWithSourceMap,
  projectFrontierAst,
  renderTargetAstWithSourceMap
} from './compiler-api.mjs';
import { result, source } from './compile-core.mjs';

const swiftUiCompile = compileFrontierSource(source, {
  target: 'swiftui',
  fileName: 'todo.frontier',
  sourceMap: { targetPath: 'TodoViews.swift', semanticIndexId: 'semantic_index_todo_swiftui' }
});
assert.equal(swiftUiCompile.ok, true);
assert.equal(swiftUiCompile.target, 'swiftui');
assert.equal(swiftUiCompile.ast.kind, 'frontier.lang.swiftui.module');
assert.match(swiftUiCompile.output, /import SwiftUI/);
assert.match(swiftUiCompile.output, /struct TodoListView: View/);
assert.match(swiftUiCompile.output, /var disabled: Bool/);
assert.match(swiftUiCompile.output, /Button\("Save"\) \{ action_add\(\) \}\.disabled\(disabled\)/);
assert.equal(swiftUiCompile.sourceMap.target.framework, 'swiftui');
assert.equal(swiftUiCompile.sourceMap.sourcePath, 'todo.frontier');
assert.equal(swiftUiCompile.sourceMap.targetPath, 'TodoViews.swift');
assert.equal(swiftUiCompile.sourceMap.semanticIndexId, 'semantic_index_todo_swiftui');
assert.equal(swiftUiCompile.sourceMap.metadata.runtimeEquivalenceClaim, false);
assert.equal(swiftUiCompile.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'view_todo_list'), true);

const swiftUiMappedOutput = renderTargetAstWithSourceMap(projectFrontierAst(result.document, 'swift'), 'swift', { targetPath: 'TodoViews.swift' });
assert.equal(swiftUiMappedOutput.sourceMap.target.framework, 'swiftui');
assert.match(swiftUiMappedOutput.code, /struct TodoListView: View/);

const emittedSwiftUi = emitForTargetWithSourceMap(result.document, 'swiftui', { targetPath: 'TodoViews.swift' });
assert.equal(emittedSwiftUi.ast.kind, 'frontier.lang.swiftui.module');
assert.equal(emittedSwiftUi.sourceMap.targetPath, 'TodoViews.swift');
assert.equal(emittedSwiftUi.sourceMap.metadata.runtimeEquivalenceClaim, false);
