import { assert } from './helpers.mjs';
import {
  compilerApi,
  compileFrontierSource,
  createUniversalAstFromDocument,
  emitForTarget,
  emitForTargetWithSourceMap,
  importNativeSource,
  normalizeCompileTarget,
  projectFrontierAst,
  renderTargetAst,
  renderTargetAstWithSourceMap,
  resolveCapabilityAdapters
} from './compiler-api.mjs';

export const source = `
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

view TodoList @id("view_todo_list") {
  reads TodoDb.todos
  dispatches action_add
  prop disabled @id("view_prop_disabled"): Boolean
  event save @id("view_event_save") action action_add input TodoInput
  render Button @id("render_save_button") {
    identity save
    text "Save"
    prop disabled disabled
    on press save
  }
}

action addTodo @id("action_add") {
  input TodoInput
  uses http.request
  writes field_tags
  returns Patch
}

effect PersistTodo @id("effect_persist") {
  capability storage.write
  input TodoInput
  returns Json
  resources TodoDb.todos
}

extern persistTodo @id("extern_persist") {
  language typescript
  symbol persistTodo
  input TodoInput
  returns Json
  effects storage.write
}

target typescript @id("target_ts") {
  language typescript
  package @example/todo
  emitPath src/generated/todo.ts
  moduleFormat esm
}

nativeSource TodoTypescript @id("native_todo_ts") {
  language typescript
  parser typescript
  sourcePath src/todo.ts
  sourceHash sha256:todo
  symbol Todo
  frontierNodes ent_todo, action_add
  loss unsupportedSyntax "decorator retained in native AST" severity warning
}

proof TodoProofs @id("proof_todo") {
  contract todoTitle @id("contract_todo_title") kind invariant subject ent_todo statement "Todo title remains renderable."
  obligation todoTitleRuntime @id("obligation_todo_title_runtime") kind runtime status open subject ent_todo contract contract_todo_title statement "A runtime probe covers title rendering."
  artifact todoTitleProbe @id("artifact_todo_title_probe") kind test status passed path reports/todo-title.json obligation obligation_todo_title_runtime command "npm test -- todo-title"
  assumption hostFetch @id("assumption_host_fetch") scope host subject cap_http description "The host fetch adapter preserves request semantics."
}

paradigm TodoSemantics @id("paradigm_todo") {
  bindingScope todoModule @id("scope_todo_module") kind module subject mod_todo statement "Todo module owns authored bindings."
  binding todoTitle @id("binding_todo_title") kind field subject field_title bindingScope scope_todo_module semanticNode ent_todo evidence contract_todo_title
  typeConstraint todoTitleText @id("type_constraint_todo_title") kind textField subject field_title binding binding_todo_title evidence contract_todo_title
  effectRegion persistWrite @id("effect_region_persist_write") kind storageWrite subject effect_persist effect effect_persist
  lowering todoTitleTypescript @id("lowering_todo_title_ts") kind projection subject field_title sourceRecord binding_todo_title targetRecord type_constraint_todo_title language typescript evidence artifact_todo_title_probe
}

operations TodoOperations @id("semantic_ops_todo") {
  operation addTodoWrite @id("op_add_todo_write") op effect language frontier semanticNode action_add semanticSymbol symbol:addTodo write TodoDb.todos effect effect_persist ownerKey action:addTodo conflictKey state:TodoDb.todos readiness ready evidence artifact_todo_title_probe summary "Add todo writes the todos collection."
  operation titleProjection @id("op_title_projection") op projection language typescript semanticNode ent_todo semanticSymbol symbol:Todo nativeAstNode ts_node_title readiness needs-review evidence contract_todo_title
}
`;

assert.equal(normalizeCompileTarget('ts'), 'typescript');
export const result = compileFrontierSource(source, { target: 'typescript' });
assert.equal(result.ok, true);
assert.match(result.hash, /^fnv1a32:/);
assert.equal(result.ast.kind, 'typescript.module');
assert.equal(renderTargetAst(result.ast, 'typescript'), result.output);
assert.equal(result.sourcePath, undefined);
assert.equal(result.sourceMap, undefined);
assert.match(result.output, /export interface Todo/);
assert.match(result.output, /export interface TodoDbState/);
assert.match(result.output, /export const TodoDbStateDescriptor/);
assert.match(result.output, /export const TodoListView/);
assert.match(result.output, /export function renderTodoListView\(props: \{ readonly disabled: boolean \}\): readonly FrontierRenderNode\[\]/);
assert.match(result.output, /disabled: props\.disabled/);
assert.match(result.output, /press: \{ action: "save" \}/);
assert.match(result.output, /export const addTodoAction/);
assert.match(result.output, /export const PersistTodoEffect/);
assert.match(result.output, /export async function runPersistTodoEffect\(input: TodoInput, env: FrontierEffectEnvironment\): Promise<unknown>/);
assert.match(result.output, /env\.invoke\("storage\.write", input/);
assert.match(result.output, /export const persistTodoExtern/);
assert.match(result.output, /export const typescriptTarget/);
assert.match(result.output, /export const TodoTypescriptNativeSource/);
assert.equal(result.document.metadata.proof.contracts[0].id, 'contract_todo_title');
const universalAst = createUniversalAstFromDocument(result.document);
assert.equal(universalAst.proof.id, 'proof_todo');
assert.equal(universalAst.proof.contracts[0].subjectId, 'ent_todo');
assert.equal(universalAst.proof.obligations[0].contractIds[0], 'contract_todo_title');
assert.equal(universalAst.proof.artifacts[0].command, 'npm test -- todo-title');
assert.equal(universalAst.paradigmSemantics.id, 'paradigm_todo');
assert.equal(universalAst.paradigmSemantics.bindings[0].bindingScopeId, 'scope_todo_module');
assert.equal(universalAst.paradigmSemantics.loweringRecords[0].targetRecordId, 'type_constraint_todo_title');
assert.equal(universalAst.semanticOperations.id, 'semantic_ops_todo');
assert.equal(universalAst.semanticOperations.operations[0].kind, 'frontier.lang.semanticOperation');
assert.equal(universalAst.semanticOperations.operations[0].writes[0], 'TodoDb.todos');
assert.equal(universalAst.semanticOperations.summary.byOperationKind.effect, 1);
assert.match(emitForTarget(result.document, 'javascript'), /export const TodoSchema/);
assert.match(emitForTarget(result.document, 'javascript'), /export const TodoDbStateDescriptor/);
assert.match(emitForTarget(result.document, 'javascript'), /export const TodoListView/);
assert.match(emitForTarget(result.document, 'javascript'), /export function renderTodoListView\(props = \{\}\)/);
assert.match(emitForTarget(result.document, 'javascript'), /disabled: props\.disabled/);
assert.match(emitForTarget(result.document, 'javascript'), /export const addTodoAction/);
assert.match(emitForTarget(result.document, 'javascript'), /export const PersistTodoEffect/);
assert.match(emitForTarget(result.document, 'javascript'), /export async function runPersistTodoEffect\(input, env\)/);
assert.match(emitForTarget(result.document, 'javascript'), /env\.invoke\("storage\.write", input/);
assert.match(emitForTarget(result.document, 'javascript'), /export const persistTodoExtern/);
assert.match(emitForTarget(result.document, 'javascript'), /export const typescriptTarget/);
assert.match(emitForTarget(result.document, 'javascript'), /export const TodoTypescriptNativeSource/);
const mappedCompile = compileFrontierSource(source, {
  target: 'javascript',
  fileName: 'todo.frontier',
  sourceMap: { targetPath: 'todo.js', semanticIndexId: 'semantic_index_todo' }
});
assert.equal(mappedCompile.ok, true);
assert.equal(mappedCompile.sourcePath, 'todo.frontier');
assert.match(mappedCompile.output, /export const TodoSchema/);
assert.equal(mappedCompile.sourceMap.kind, 'frontier.lang.sourceMap');
assert.equal(mappedCompile.sourceMap.sourcePath, 'todo.frontier');
assert.equal(mappedCompile.sourceMap.targetPath, 'todo.js');
assert.equal(mappedCompile.sourceMap.semanticIndexId, 'semantic_index_todo');
assert.equal(mappedCompile.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'ent_todo'), true);
const documentMappedCompile = compilerApi.compileFrontierDocument(result.document, {
  target: 'typescript',
  sourcePath: 'todo-doc.frontier',
  sourceMap: true
});
assert.equal(documentMappedCompile.ok, true);
assert.equal(documentMappedCompile.sourcePath, 'todo-doc.frontier');
assert.match(documentMappedCompile.output, /export interface Todo/);
assert.equal(documentMappedCompile.sourceMap.sourcePath, 'todo-doc.frontier');
assert.equal(documentMappedCompile.sourceMap.target.language, 'typescript');
assert.equal(documentMappedCompile.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'ent_todo'), true);
const javascriptMappedOutput = emitForTargetWithSourceMap(result.document, 'javascript', { targetPath: 'todo.js' });
assert.match(javascriptMappedOutput.code, /export const TodoSchema/);
assert.equal(javascriptMappedOutput.ast.kind, 'javascript.module');
assert.equal(javascriptMappedOutput.sourceMap.target.language, 'javascript');
assert.equal(javascriptMappedOutput.sourceMap.targetPath, 'todo.js');
assert.equal(javascriptMappedOutput.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'ent_todo'), true);
const rustMappedOutput = renderTargetAstWithSourceMap(projectFrontierAst(result.document, 'rust'), 'rust', { targetPath: 'todo.rs' });
assert.match(rustMappedOutput.code, /pub struct Todo/);
assert.match(rustMappedOutput.code, /pub struct TodoDbState/);
assert.match(rustMappedOutput.code, /pub todos: std::collections::BTreeMap<TodoId, Todo>/);
assert.match(rustMappedOutput.code, /pub fn addTodo\(_state: &TodoDbState, _input: TodoInput\)/);
assert.equal(rustMappedOutput.sourceMap.target.language, 'rust');
assert.equal(rustMappedOutput.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'ent_todo'), true);
assert.equal(rustMappedOutput.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'state_todo'), true);
const pythonMappedOutput = renderTargetAstWithSourceMap(projectFrontierAst(result.document, 'python'), 'python', { targetPath: 'todo.py' });
assert.match(pythonMappedOutput.code, /class TodoDbState/);
assert.match(pythonMappedOutput.code, /todos: Mapping\[TodoId, Todo\]/);
assert.match(pythonMappedOutput.code, /def addTodo\(state: TodoDbState, input: TodoInput/);
assert.equal(pythonMappedOutput.sourceMap.target.language, 'python');
assert.equal(pythonMappedOutput.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'state_todo'), true);
const cMappedOutput = renderTargetAstWithSourceMap(projectFrontierAst(result.document, 'c'), 'c', { targetPath: 'todo.h' });
assert.match(cMappedOutput.code, /typedef struct TodoDbState/);
assert.match(cMappedOutput.code, /frontier_json_value todos/);
assert.match(cMappedOutput.code, /frontier_patch_list addTodo\(const TodoDbState \* state, TodoInput input\)/);
assert.equal(cMappedOutput.sourceMap.target.language, 'c');
assert.equal(cMappedOutput.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'state_todo'), true);
assert.equal(projectFrontierAst(result.document, 'javascript').kind, 'javascript.module');
assert.equal(projectFrontierAst(result.document, 'rust').kind, 'rust.module');
assert.equal(projectFrontierAst(result.document, 'python').kind, 'python.module');
assert.equal(projectFrontierAst(result.document, 'c').kind, 'c.header');
assert.equal(resolveCapabilityAdapters(result.document, 'typescript', { platform: 'node' })[0].status, 'bound');
assert.equal(resolveCapabilityAdapters(result.document, 'rust', { platform: 'native' })[0].adapters[0].symbol, 'reqwest::Client::execute');
assert.equal(resolveCapabilityAdapters(result.document, 'c', { platform: 'embedded' })[0].status, 'unsupported');
export const nativeImport = importNativeSource({
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
assert.equal(nativeImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(nativeImport.mergeCandidates[0].metadata.nativeImportLossSummary.categories.includes('opaqueBodies'), true);
