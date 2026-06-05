import assert from 'node:assert/strict';
import {
  compileFrontierSource,
  createUniversalAstFromDocument,
  emitForTarget,
  importNativeSource,
  normalizeCompileTarget,
  projectFrontierAst,
  readUniversalAstJson,
  renderTargetAst,
  resolveCapabilityAdapters,
  runNativeImporterAdapter,
  writeUniversalAstJson
} from '../dist/index.js';

const source = `
module TodoApp @id("mod_todo")

type TodoId @id("type_todo_id") {
  = Text
}

type TodoInput @id("type_todo_input") {
  title: Text
}

lattice TagSet @id("lat_tags") {
  carrier Set<Text>
  laws semilattice, commutative
  frontierCrdt createCrdtOrSetLattice
}

capability HttpRequest @id("cap_http") {
  capability http.request
  category network
  input Json
  returns Json
  adapter typescript symbol fetch platform node package undici kind library
  adapter rust symbol reqwest::Client::execute platform native package reqwest kind library
  unsupported c platform embedded reason "requires a host socket adapter"
}

entity Todo @id("ent_todo") {
  title @id("field_title"): Text
  tags @id("field_tags"): Set<Text> {
    merge union lattice lat_tags crdt or-set
  }
}

state TodoDb @id("state_todo") {
  todos @id("collection_todos"): Map<TodoId, Todo>
}

action addTodo @id("action_add") {
  input TodoInput
  uses http.request
  writes field_tags
  returns Patch
}
`;

assert.equal(normalizeCompileTarget('ts'), 'typescript');
const result = compileFrontierSource(source, { target: 'typescript' });
assert.equal(result.ok, true);
assert.match(result.hash, /^fnv1a32:/);
assert.equal(result.ast.kind, 'typescript.module');
assert.equal(renderTargetAst(result.ast, 'typescript'), result.output);
assert.match(result.output, /export interface Todo/);
assert.match(emitForTarget(result.document, 'javascript'), /export const TodoSchema/);
assert.equal(projectFrontierAst(result.document, 'javascript').kind, 'javascript.module');
assert.equal(projectFrontierAst(result.document, 'rust').kind, 'rust.module');
assert.equal(projectFrontierAst(result.document, 'python').kind, 'python.module');
assert.equal(projectFrontierAst(result.document, 'c').kind, 'c.header');
assert.equal(resolveCapabilityAdapters(result.document, 'typescript', { platform: 'node' })[0].status, 'bound');
assert.equal(resolveCapabilityAdapters(result.document, 'rust', { platform: 'native' })[0].adapters[0].symbol, 'reqwest::Client::execute');
assert.equal(resolveCapabilityAdapters(result.document, 'c', { platform: 'embedded' })[0].status, 'unsupported');
const nativeImport = importNativeSource({
  language: 'javascript',
  parser: 'estree',
  sourcePath: 'src/todo.js',
  rootId: 'program',
  nodes: {
    program: { id: 'program', kind: 'Program', languageKind: 'ESTree.Program', children: ['fn_add'] },
    fn_add: { id: 'fn_add', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: 'src/todo.js', startLine: 1, endLine: 3 } }
  },
  semanticIndex: {
    kind: 'frontier.lang.semanticIndex',
    version: 1,
    id: 'index_todo_js',
    documents: [{ id: 'doc_todo_js', path: 'src/todo.js', language: 'javascript', nativeSourceId: 'native_source_src_todo_js' }],
    symbols: [{ id: 'symbol:addTodo', scheme: 'frontier', name: 'addTodo', kind: 'function', language: 'javascript', nativeAstNodeId: 'fn_add' }],
    occurrences: [{ id: 'occ_add_def', documentId: 'doc_todo_js', symbolId: 'symbol:addTodo', role: 'definition', nativeAstNodeId: 'fn_add' }],
    relations: [{ id: 'rel_doc_defines_add', sourceId: 'doc_todo_js', predicate: 'defines', targetId: 'symbol:addTodo' }],
    facts: []
  },
  losses: [{ id: 'loss_body', severity: 'warning', kind: 'opaqueNative', message: 'Function body retained as native AST.' }]
});
assert.equal(nativeImport.kind, 'frontier.lang.importResult');
assert.equal(nativeImport.nativeSource.kind, 'nativeSource');
assert.equal(nativeImport.semanticIndex.symbols[0].id, 'symbol:addTodo');
assert.equal(nativeImport.universalAst.semanticIndex.id, 'index_todo_js');
assert.equal(nativeImport.sourceMaps[0].kind, 'frontier.lang.sourceMap');
assert.equal(nativeImport.sourceMaps[0].mappings[0].nativeAstNodeId, 'fn_add');
assert.equal(nativeImport.universalAst.sourceMaps[0].id, nativeImport.sourceMaps[0].id);
assert.equal(nativeImport.patch.operations[0].op, 'upsertNode');
assert.equal(nativeImport.evidence[0].status, 'passed');
assert.equal(nativeImport.mergeCandidates.length, 1);
assert.equal(nativeImport.mergeCandidates[0].kind, 'frontier.lang.semanticMergeCandidate');
const adapterImport = await runNativeImporterAdapter({
  id: 'fixture-estree-importer',
  language: 'javascript',
  parser: 'estree',
  version: '1.0.0',
  capabilities: ['nativeAst', 'diagnostics'],
  supportedExtensions: ['js', '.mjs'],
  diagnostics: [{ severity: 'info', code: 'adapter.ready', message: 'Fixture adapter is available.' }],
  parse(input) {
    assert.equal(input.adapterId, 'fixture-estree-importer');
    assert.equal(input.language, 'javascript');
    assert.equal(input.parser, 'estree');
    assert.equal(input.parserVersion, '1.0.0');
    assert.equal(input.sourceHash.startsWith('fnv1a32:'), true);
    assert.equal(input.options.mode, 'smoke');
    return {
      rootId: 'adapter_program',
      nodes: {
        adapter_program: { id: 'adapter_program', kind: 'Program', languageKind: 'ESTree.Program', children: ['adapter_fn'] },
        adapter_fn: { id: 'adapter_fn', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: input.sourcePath, startLine: 1, endLine: 1 } }
      },
      diagnostics: [{ severity: 'warning', code: 'adapter.opaqueBody', kind: 'opaqueNative', message: 'Function body retained as native AST.', span: { path: input.sourcePath, startLine: 1, endLine: 1 } }]
    };
  }
}, {
  sourcePath: 'src/adapter.js',
  sourceText: 'export function fromAdapter() { return true; }\n',
  adapterOptions: { mode: 'smoke' },
  metadata: { requestId: 'adapter-smoke' }
});
assert.equal(adapterImport.kind, 'frontier.lang.importResult');
assert.equal(adapterImport.adapter.id, 'fixture-estree-importer');
assert.deepEqual(adapterImport.adapter.capabilities, ['nativeAst', 'diagnostics']);
assert.deepEqual(adapterImport.adapter.supportedExtensions, ['.js', '.mjs']);
assert.equal(adapterImport.nativeAst.parser, 'estree');
assert.equal(adapterImport.nativeAst.parserVersion, '1.0.0');
assert.equal(adapterImport.nativeAst.metadata.adapterId, 'fixture-estree-importer');
assert.equal(adapterImport.sourceMaps[0].mappings.some((mapping) => mapping.nativeAstNodeId === 'adapter_fn'), true);
assert.equal(adapterImport.metadata.adapterId, 'fixture-estree-importer');
assert.equal(adapterImport.metadata.requestId, 'adapter-smoke');
assert.equal(adapterImport.diagnostics.length, 2);
assert.equal(adapterImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.opaqueBody'), true);
assert.equal(adapterImport.losses.some((loss) => loss.metadata?.diagnosticCode === 'adapter.opaqueBody'), true);
assert.equal(adapterImport.evidence.some((record) => record.id === 'evidence_fixture_estree_importer_native_importer_adapter' && record.status === 'passed'), true);
const failedAdapterImport = await runNativeImporterAdapter({
  id: 'throwing-typescript-importer',
  language: 'typescript',
  parser: 'typescript-compiler-api',
  parse() {
    throw new Error('fixture parser failure');
  }
}, {
  sourcePath: 'src/broken.ts',
  sourceText: 'export const = ;\n'
});
assert.equal(failedAdapterImport.kind, 'frontier.lang.importResult');
assert.equal(failedAdapterImport.nativeAst.rootId, 'adapter_error_root');
assert.equal(failedAdapterImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parse.threw'), true);
assert.equal(failedAdapterImport.losses.some((loss) => loss.severity === 'error'), true);
assert.equal(failedAdapterImport.evidence.some((record) => record.id === 'evidence_throwing_typescript_importer_native_importer_adapter' && record.status === 'failed'), true);
const scannedJsImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/scanned.js',
  sourceText: 'import { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title }; }\nexport class TodoStore {}\n'
});
assert.equal(scannedJsImport.nativeAst.rootId, 'native_root');
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoStore'), true);
assert.equal(scannedJsImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(scannedJsImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('addtodo')), true);
assert.equal(scannedJsImport.losses.some((loss) => loss.kind === 'opaqueNative'), true);
const scannedLossKinds = scannedJsImport.losses.map((loss) => loss.kind);
assert.equal(scannedLossKinds.includes('declarationOnlyCoverage'), true);
assert.equal(scannedLossKinds.includes('partialSemanticIndex'), true);
assert.equal(scannedLossKinds.includes('sourceMapApproximation'), true);
assert.equal(scannedLossKinds.includes('sourcePreservation'), true);
assert.equal(scannedJsImport.mergeCandidates[0].readiness, 'ready-with-losses');
const scannedPythonImport = importNativeSource({
  language: 'python',
  sourcePath: 'todo.py',
  sourceText: 'import json\nclass TodoStore:\n    pass\ndef add_todo(title):\n    return title\n'
});
assert.equal(scannedPythonImport.semanticIndex.symbols.some((symbol) => symbol.name === 'add_todo'), true);
assert.equal(scannedPythonImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('add_todo')), true);
const scannedRustImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/lib.rs',
  sourceText: 'use std::sync::Arc;\npub struct Todo;\npub fn add_todo(title: String) {}\nmacro_rules! todo_macro { () => {} }\n'
});
assert.equal(scannedRustImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(scannedRustImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('todo')), true);
const scannedCImport = importNativeSource({
  language: 'c',
  sourcePath: 'todo.h',
  sourceText: '#include <stdint.h>\n#define TODO_MAX 32\ntypedef struct Todo { int done; } Todo;\nvoid add_todo(void);\n'
});
assert.equal(scannedCImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TODO_MAX'), true);
assert.equal(scannedCImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('todo_max')), true);
assert.equal(scannedCImport.losses.some((loss) => loss.kind === 'preprocessor'), true);
const scannedJavaImport = importNativeSource({
  language: 'java',
  sourcePath: 'Todo.java',
  sourceText: 'package demo;\nimport java.util.List;\npublic class Todo {\n  public void addTodo(String title) {}\n}\n'
});
assert.equal(scannedJavaImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
const scannedGoImport = importNativeSource({
  language: 'go',
  sourcePath: 'todo.go',
  sourceText: 'package todo\nimport "fmt"\ntype Todo struct {}\nfunc AddTodo(title string) {}\n'
});
assert.equal(scannedGoImport.semanticIndex.symbols.some((symbol) => symbol.name === 'AddTodo'), true);
const scannedSwiftImport = importNativeSource({
  language: 'swift',
  sourcePath: 'Todo.swift',
  sourceText: 'import Foundation\nstruct Todo {\n  let title: String\n}\nfunc addTodo(_ title: String) {}\n'
});
assert.equal(scannedSwiftImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
const scannedCSharpImport = importNativeSource({
  language: 'csharp',
  sourcePath: 'Todo.cs',
  sourceText: 'using System;\nnamespace Demo;\npublic class Todo {\n  public void AddTodo(string title) {}\n}\n'
});
assert.equal(scannedCSharpImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
const scannedPhpImport = importNativeSource({
  language: 'php',
  sourcePath: 'Todo.php',
  sourceText: '<?php\nnamespace Demo;\nuse Psr\\Log\\LoggerInterface;\nclass Todo {}\nfunction addTodo($title) {}\n'
});
assert.equal(scannedPhpImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo'), true);
const scannedRubyImport = importNativeSource({
  language: 'ruby',
  sourcePath: 'todo.rb',
  sourceText: 'require "json"\nmodule Demo\nclass Todo\nend\ndef add_todo(title)\nend\nend\n'
});
assert.equal(scannedRubyImport.semanticIndex.symbols.some((symbol) => symbol.name === 'add_todo'), true);
const universalAst = createUniversalAstFromDocument(result.document, { id: 'uast_todo', evidence: nativeImport.evidence });
const universalJson = writeUniversalAstJson(universalAst);
assert.equal(readUniversalAstJson(universalJson).document.id, 'mod_todo');
assert.match(compileFrontierSource(source, { target: 'rust' }).output, /pub struct Todo/);
assert.match(compileFrontierSource(source, { target: 'python' }).output, /class Todo/);
assert.match(compileFrontierSource(source, { target: 'c' }).output, /typedef struct Todo/);

const bad = compileFrontierSource('module Bad @id("mod_bad")\nentity Bad @id("ent_bad") { missing: UnknownType }', { target: 'typescript' });
assert.equal(bad.ok, false);
assert.equal(bad.ast, undefined);
assert.equal(bad.output, '');
