import { assert, assertScannedSymbol, mappedSymbol, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import { importNativeSource, NativeImportLanguageProfiles } from './compiler-api.mjs';

const javascriptProfile = NativeImportLanguageProfiles.find((profile) => profile.language === 'javascript');
assert.equal(javascriptProfile.aliases.includes('jsx'), true);
assert.equal(javascriptProfile.extensions.includes('.jsx'), true);
assert.equal(javascriptProfile.notes.some((note) => note.includes('.jsx sources are classified as javascript')), true);
const typescriptProfile = NativeImportLanguageProfiles.find((profile) => profile.language === 'typescript');
assert.equal(typescriptProfile.aliases.includes('tsx'), true);
assert.equal(typescriptProfile.extensions.includes('.tsx'), true);
assert.equal(typescriptProfile.notes.some((note) => note.includes('.tsx sources are classified as typescript')), true);

export const scannedJsxImport = importNativeSource({
  language: 'jsx',
  sourcePath: 'TodoView.jsx',
  sourceText: 'import React from "react";\nexport function TodoView({ title }) { return <div>{title}</div>; }\n'
});
assertScannedSymbol(scannedJsxImport, 'TodoView', 'todoview');
assert.equal(nativeNodeForSymbol(scannedJsxImport, 'TodoView').kind, 'FunctionDeclaration');
assert.equal(scannedJsxImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);

export const scannedTsxImport = importNativeSource({
  language: 'tsx',
  sourcePath: 'TodoCard.tsx',
  sourceText: 'import type { Todo } from "./types.js";\ninterface TodoProps { title: string; }\nexport function TodoCard(props: TodoProps) { return <span>{props.title}</span>; }\n'
});
assertScannedSymbol(scannedTsxImport, 'TodoProps', 'todoprops');
assertScannedSymbol(scannedTsxImport, 'TodoCard', 'todocard');
assert.equal(nativeNodeForSymbol(scannedTsxImport, 'TodoProps').kind, 'InterfaceDeclaration');
assert.equal(nativeNodeForSymbol(scannedTsxImport, 'TodoCard').kind, 'FunctionDeclaration');
assert.equal(scannedTsxImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);

export const scannedPythonImport = importNativeSource({
  language: 'python',
  sourcePath: 'todo.py',
  sourceText: 'import json\nclass TodoStore:\n    pass\ndef add_todo(title):\n    return json.dumps(title)\n'
});
assert.equal(scannedPythonImport.semanticIndex.symbols.some((symbol) => symbol.name === 'add_todo'), true);
assert.equal(scannedPythonImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('add_todo')), true);
assert.equal(scannedPythonImport.semanticIndex.relations.some((relation) => relation.predicate === 'uses'), true);
export const scannedRustImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/lib.rs',
  sourceText: 'use std::sync::Arc;\npub struct Todo;\npub fn add_todo(title: String) { Arc::new(title); }\nmacro_rules! todo_macro { () => {} }\n'
});
assert.equal(scannedRustImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(scannedRustImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('todo')), true);
assert.equal(scannedRustImport.semanticIndex.relations.some((relation) => relation.predicate === 'uses'), true);
export const scannedCImport = importNativeSource({
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
  sourceText: 'package todo\nimport (\n  tasklog "example.com/project/log"\n)\ntype TodoId = string\ntype Todo struct {}\ntype Store struct {}\nfunc AddTodo(title string) {}\nfunc (store *Store) Save[T any](title string) error { AddTodo(title); return nil }\n'
});
assert.equal(scannedGoImport.semanticIndex.symbols.some((symbol) => symbol.name === 'AddTodo'), true);
assert.equal(scannedGoImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(scannedGoImport.semanticIndex.relations.some((relation) => relation.predicate === 'calls'), true);
assert.equal(symbolByName(scannedGoImport, 'TodoId').kind, 'type');
assert.equal(symbolByName(scannedGoImport, 'Store.Save').kind, 'method');
const scannedGoReceiverNode = nativeNodeForSymbol(scannedGoImport, 'Store.Save');
assert.equal(scannedGoReceiverNode.kind, 'MethodDecl');
assert.equal(scannedGoReceiverNode.fields.methodName, 'Save');
assert.deepEqual(scannedGoReceiverNode.fields.receiver, { raw: 'store *Store', name: 'store', rawType: '*Store', type: 'Store' });
assert.deepEqual(scannedGoReceiverNode.fields.typeParameters, ['T any']);
const scannedSwiftImport = importNativeSource({
  language: 'swift',
  sourcePath: 'Todo.swift',
  sourceText: 'import Foundation\nprotocol TodoRenderable {}\nextension TodoRenderable where Self: AnyObject {\n  func renderTodo() {}\n}\nstruct Todo {\n  public var title: String { get }\n}\npublic extension Todo: Sendable {\n  static var empty: Todo { Todo() }\n}\nfunc addTodo(_ title: String) {}\n'
});
assert.equal(scannedSwiftImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(symbolByName(scannedSwiftImport, 'TodoRenderable').kind, 'protocol');
const scannedSwiftProtocolExtensionNode = nativeNodeForSymbol(scannedSwiftImport, 'TodoRenderable.protocolExtension');
assert.equal(scannedSwiftProtocolExtensionNode.kind, 'ProtocolExtensionDecl');
assert.equal(scannedSwiftProtocolExtensionNode.fields.extendedType, 'TodoRenderable');
assert.equal(scannedSwiftProtocolExtensionNode.fields.constraints, 'Self: AnyObject');
const scannedSwiftExtensionNode = nativeNodeForSymbol(scannedSwiftImport, 'Todo.extension');
assert.equal(scannedSwiftExtensionNode.kind, 'ExtensionDecl');
assert.deepEqual(scannedSwiftExtensionNode.fields.conformances, ['Sendable']);
const scannedSwiftPropertyNode = nativeNodeForSymbol(scannedSwiftImport, 'title');
assert.equal(scannedSwiftPropertyNode.kind, 'PropertyDecl');
assert.equal(scannedSwiftPropertyNode.fields.valueType, 'String');
const scannedCSharpImport = importNativeSource({
  language: 'csharp',
  sourcePath: 'Todo.cs',
  sourceText: 'using System;\nusing JsonMap = System.Collections.Generic.Dictionary<string, object>;\nnamespace Demo;\npublic delegate void TodoChanged(object sender, EventArgs args);\npublic class Todo {\n  public string Title { get; init; }\n  public event EventHandler? Changed;\n  public void AddTodo(string title) {}\n}\npublic static class TodoExtensions {\n  public static string Label(this Todo todo) => todo.Title;\n}\n'
});
assert.equal(scannedCSharpImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(symbolByName(scannedCSharpImport, 'JsonMap').kind, 'type');
assert.equal(nativeNodeForSymbol(scannedCSharpImport, 'JsonMap').fields.target, 'System.Collections.Generic.Dictionary<string, object>');
assert.equal(symbolByName(scannedCSharpImport, 'TodoChanged').kind, 'type');
assert.deepEqual(nativeNodeForSymbol(scannedCSharpImport, 'TodoChanged').fields.parameters, ['object sender', 'EventArgs args']);
const scannedCSharpPropertyNode = nativeNodeForSymbol(scannedCSharpImport, 'Title');
assert.equal(scannedCSharpPropertyNode.kind, 'PropertyDeclaration');
assert.deepEqual(scannedCSharpPropertyNode.fields.accessors, ['get', 'init']);
const scannedCSharpEventNode = nativeNodeForSymbol(scannedCSharpImport, 'Changed');
assert.equal(scannedCSharpEventNode.kind, 'EventDeclaration');
assert.equal(scannedCSharpEventNode.fields.eventType, 'EventHandler?');
const scannedCSharpExtensionMethodNode = nativeNodeForSymbol(scannedCSharpImport, 'Label');
assert.equal(scannedCSharpExtensionMethodNode.kind, 'ExtensionMethodDeclaration');
assert.deepEqual(scannedCSharpExtensionMethodNode.fields.extensionReceiver, { type: 'Todo', name: 'todo' });
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
assert.equal(scannedRubyImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Demo.instance.add_todo'), true);
const scannedKotlinImport = importNativeSource({
  language: 'kotlin',
  sourcePath: 'Todo.kt',
  sourceText: 'package demo\nimport kotlinx.coroutines.CoroutineScope\nclass TodoStore\nfun addTodo(title: String) = title\n'
});
assertScannedSymbol(scannedKotlinImport, 'addTodo', 'addtodo');
assert.equal(scannedKotlinImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
const scannedKotlinMethodImport = importNativeSource({
  language: 'kotlin',
  sourcePath: 'Store.kt',
  sourceText: 'class Store {\n  fun save(title: String): String { return title }\n}\nfun Store.label(): String { return "store" }\n'
});
assert.equal(symbolByName(scannedKotlinMethodImport, 'Store.save').kind, 'method');
assert.equal(nativeNodeForSymbol(scannedKotlinMethodImport, 'Store.extension.label').fields.receiverKind, 'extension');
const scannedScalaImport = importNativeSource({
  language: 'scala',
  sourcePath: 'Todo.scala',
  sourceText: 'package demo\nimport scala.collection.mutable.ListBuffer\ncase class Todo(title: String)\ndef addTodo(title: String) = title\n'
});
assertScannedSymbol(scannedScalaImport, 'addTodo', 'addtodo');
const scannedScalaMethodImport = importNativeSource({
  language: 'scala',
  sourcePath: 'Store.scala',
  sourceText: 'class Store {\n  def save(title: String): String = { title }\n}\nobject Store {\n  def label(title: String): String = { title }\n}\n'
});
assert.equal(symbolByName(scannedScalaMethodImport, 'Store.save').kind, 'method');
assert.equal(nativeNodeForSymbol(scannedScalaMethodImport, 'Store.object.label').fields.receiverKind, 'object');
const scannedDartImport = importNativeSource({
  language: 'dart',
  sourcePath: 'todo.dart',
  sourceText: 'import "dart:convert";\nclass TodoStore {}\nString addTodo(String title) => title;\n'
});
assertScannedSymbol(scannedDartImport, 'addTodo', 'addtodo');
const scannedLuaImport = importNativeSource({
  language: 'lua',
  sourcePath: 'todo.lua',
  sourceText: 'local json = require("json")\nfunction add_todo(title)\n  return title\nend\n'
});
assertScannedSymbol(scannedLuaImport, 'add_todo', 'add_todo');
const scannedShellImport = importNativeSource({
  language: 'shell',
  sourcePath: 'todo.sh',
  sourceText: 'source ./lib.sh\nadd_todo() {\n  echo "$1"\n}\n'
});
assertScannedSymbol(scannedShellImport, 'add_todo', 'add_todo');
const scannedSqlImport = importNativeSource({
  language: 'sql',
  sourcePath: 'todo.sql',
  sourceText: 'CREATE TABLE todos (id INTEGER PRIMARY KEY);\nCREATE VIEW todo_titles AS SELECT id FROM todos;\n'
});
assertScannedSymbol(scannedSqlImport, 'todos');
const scannedSqlQueryImport = importNativeSource({
  language: 'sql',
  sourcePath: 'query.sql',
  sourceText: 'SELECT * FROM todos;\n'
});
assert.equal(scannedSqlQueryImport.semanticIndex.symbols.length, 0);
assert.equal(scannedSqlQueryImport.losses.some((loss) => loss.kind === 'declarationOnlyCoverage'), true);
const scannedZigImport = importNativeSource({
  language: 'zig',
  sourcePath: 'src/todo.zig',
  sourceText: 'const std = @import("std");\npub const Todo = struct { title: []const u8 };\npub fn addTodo(title: []const u8) void {}\ncomptime { @compileError("generated"); }\n'
});
assert.equal(symbolByName(scannedZigImport, 'addTodo').id, 'symbol:zig:addtodo');
assert.equal(scannedZigImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedZigImport, 'symbol:zig:addtodo').sourceSpan.startLine, 3);
assert.equal(scannedZigImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
const scannedElixirImport = importNativeSource({
  language: 'elixir',
  sourcePath: 'lib/todo.ex',
  sourceText: 'defmodule Demo.Todo do\n  alias Demo.Repo\n  use GenServer\n  def add_todo(title), do: title\n  defmacro generated(), do: quote(do: :ok)\nend\n'
});
assert.equal(symbolByName(scannedElixirImport, 'add_todo').id, 'symbol:elixir:add_todo');
assert.equal(scannedElixirImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedElixirImport, 'symbol:elixir:add_todo').sourceSpan.startLine, 4);
assert.equal(scannedElixirImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
const scannedErlangImport = importNativeSource({
  language: 'erlang',
  sourcePath: 'src/todo.erl',
  sourceText: '-module(todo).\n-include("todo.hrl").\n-define(TODO(Name), {todo, Name}).\n-record(todo, {title}).\nadd_todo(Title) -> ?TODO(Title).\n'
});
assert.equal(symbolByName(scannedErlangImport, 'add_todo').id, 'symbol:erlang:add_todo');
assert.equal(scannedErlangImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedErlangImport, 'symbol:erlang:add_todo').sourceSpan.startLine, 5);
assert.equal(scannedErlangImport.losses.some((loss) => loss.kind === 'preprocessor'), true);
assert.equal(scannedErlangImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
const scannedHaskellImport = importNativeSource({
  language: 'haskell',
  sourcePath: 'src/Todo.hs',
  sourceText: "{-# LANGUAGE TemplateHaskell #-}\nmodule Todo where\nimport qualified Data.Text as T\ndata Todo = Todo Text\naddTodo :: Text -> Todo\naddTodo title = Todo title\n$(deriveJSON defaultOptions ''Todo)\n"
});
const scannedHaskellSymbols = scannedHaskellImport.semanticIndex.symbols.filter((symbol) => symbol.name === 'addTodo');
assert.equal(scannedHaskellSymbols.some((symbol) => symbol.id === 'symbol:haskell:signature:addtodo'), true);
assert.equal(scannedHaskellSymbols.some((symbol) => symbol.id === 'symbol:haskell:addtodo'), true);
assert.equal(scannedHaskellImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedHaskellImport, 'symbol:haskell:signature:addtodo').sourceSpan.startLine, 5);
assert.equal(mappedSymbol(scannedHaskellImport, 'symbol:haskell:addtodo').sourceSpan.startLine, 6);
assert.equal(scannedHaskellImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
export const scannedRImport = importNativeSource({
  language: 'r',
  sourcePath: 'todo.R',
  sourceText: 'library(dplyr)\nTodo <- R6Class("Todo", list())\nadd_todo <- function(title) { title }\nsetClass("TodoRecord", slots = list(title = "character"))\neval(parse(text = "generated <- TRUE"))\n'
});
assert.equal(symbolByName(scannedRImport, 'add_todo').id, 'symbol:r:add_todo');
assert.equal(scannedRImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedRImport, 'symbol:r:add_todo').sourceSpan.startLine, 3);
assert.equal(scannedRImport.losses.some((loss) => loss.kind === 'dynamicRuntime'), true);
