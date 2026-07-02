import { assert } from './helpers.mjs';
import {
  compilerApi,
  compileFrontierDeclaredTargets,
  compileFrontierSourceDeclaredTargets
} from './compiler-api.mjs';
import { result, source } from './compile-core.mjs';

const declaredTargetCompile = compileFrontierDeclaredTargets(result.document, {
  sourcePath: 'todo.frontier',
  sourceMap: true
});
assert.equal(declaredTargetCompile.kind, 'frontier.lang.declaredTargetCompilation');
assert.equal(declaredTargetCompile.ok, true);
assert.equal(declaredTargetCompile.sourcePath, 'todo.frontier');
assert.equal(declaredTargetCompile.summary.targets, 3);
assert.equal(declaredTargetCompile.summary.emitted, 3);

const typescriptArtifact = artifactByNode(declaredTargetCompile, 'target_ts');
assert.equal(typescriptArtifact.target, 'typescript');
assert.equal(typescriptArtifact.packageName, '@example/todo');
assert.equal(typescriptArtifact.moduleFormat, 'esm');
assert.equal(typescriptArtifact.targetPath, 'src/generated/todo.ts');
assert.match(typescriptArtifact.output, /export interface Todo/);
assert.equal(typescriptArtifact.sourceMap.targetPath, 'src/generated/todo.ts');
assert.equal(typescriptArtifact.sourceMap.sourcePath, 'todo.frontier');
assert.equal(typescriptArtifact.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'target_ts'), true);

const rustArtifact = artifactByNode(declaredTargetCompile, 'target_rust');
assert.equal(rustArtifact.target, 'rust');
assert.equal(rustArtifact.packageName, 'example_todo');
assert.equal(rustArtifact.moduleFormat, 'crate');
assert.equal(rustArtifact.targetPath, 'src/generated/todo.rs');
assert.match(rustArtifact.output, /pub struct Todo/);
assert.equal(rustArtifact.sourceMap.targetPath, 'src/generated/todo.rs');
assert.equal(rustArtifact.projectionContract.id, 'declared_target_projection_contract_target_rust');
assert.equal(rustArtifact.projectionContract.disposition, 'target-adapter');
assert.equal(rustArtifact.projectionContract.semanticEquivalenceClaim, false);
assert.equal(rustArtifact.projectionContract.autoMergeClaim, false);
assert.equal(rustArtifact.projectionContract.missingLayerKinds.includes('semantic-ownership'), true);
assert.equal(rustArtifact.projectionContract.missingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
assert.equal(rustArtifact.metadata.projectionContractId, rustArtifact.projectionContract.id);
assert.equal(rustArtifact.sourceMap.metadata.declaredTargetProjectionContractId, rustArtifact.projectionContract.id);
assert.equal(rustArtifact.sourceMap.metadata.semanticEquivalenceClaim, false);

const swiftUiArtifact = artifactByNode(declaredTargetCompile, 'target_swiftui');
assert.equal(swiftUiArtifact.target, 'swiftui');
assert.equal(swiftUiArtifact.packageName, 'example_todo');
assert.equal(swiftUiArtifact.moduleFormat, 'swiftui');
assert.equal(swiftUiArtifact.targetPath, 'src/generated/TodoViews.swift');
assert.match(swiftUiArtifact.output, /import SwiftUI/);
assert.match(swiftUiArtifact.output, /struct TodoListView: View/);
assert.match(swiftUiArtifact.output, /Button\("Save"\) \{ action_add\(\) \}\.disabled\(disabled\)/);
assert.equal(swiftUiArtifact.sourceMap.target.framework, 'swiftui');
assert.equal(swiftUiArtifact.sourceMap.targetPath, 'src/generated/TodoViews.swift');
assert.equal(swiftUiArtifact.sourceMap.sourcePath, 'todo.frontier');
assert.equal(swiftUiArtifact.sourceMap.metadata.runtimeEquivalenceClaim, false);
assert.equal(swiftUiArtifact.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'view_todo_list'), true);

const declaredSourceCompile = compileFrontierSourceDeclaredTargets(source, {
  fileName: 'todo-source.frontier',
  sourceMap: true,
  targetLanguages: ['rust']
});
assert.equal(declaredSourceCompile.ok, true);
assert.equal(declaredSourceCompile.sourcePath, 'todo-source.frontier');
assert.equal(declaredSourceCompile.summary.targets, 1);
assert.equal(declaredSourceCompile.artifacts[0].targetNodeId, 'target_rust');
assert.equal(declaredSourceCompile.artifacts[0].sourceMap.sourcePath, 'todo-source.frontier');
assert.equal(declaredSourceCompile.artifacts[0].projectionContract.id, 'declared_target_projection_contract_target_rust');

const declaredSwiftAliasCompile = compileFrontierSourceDeclaredTargets(source, {
  fileName: 'todo-source.frontier',
  sourceMap: true,
  targetLanguages: ['swift']
});
assert.equal(declaredSwiftAliasCompile.ok, true);
assert.equal(declaredSwiftAliasCompile.summary.targets, 1);
assert.equal(declaredSwiftAliasCompile.artifacts[0].targetNodeId, 'target_swiftui');
assert.equal(declaredSwiftAliasCompile.artifacts[0].target, 'swiftui');
assert.equal(declaredSwiftAliasCompile.artifacts[0].sourceMap.target.framework, 'swiftui');

const missingTargets = compilerApi.compileFrontierSourceDeclaredTargets('module Empty @id("mod_empty")', {});
assert.equal(missingTargets.ok, false);
assert.equal(missingTargets.summary.targets, 0);
assert.equal(missingTargets.diagnostics[0].code, 'target.none');

const unsupportedTargets = compilerApi.compileFrontierSourceDeclaredTargets(`
module UnsupportedTarget @id("mod_unsupported_target")
target brainfuck @id("target_brainfuck") {
  language brainfuck
  emitPath generated.bf
}
`);
assert.equal(unsupportedTargets.ok, false);
assert.equal(unsupportedTargets.artifacts[0].ok, false);
assert.equal(unsupportedTargets.artifacts[0].diagnostics[0].code, 'target.unsupported');

function artifactByNode(result, targetNodeId) {
  const artifact = result.artifacts.find((candidate) => candidate.targetNodeId === targetNodeId);
  assert.ok(artifact, `missing declared target artifact ${targetNodeId}`);
  return artifact;
}
