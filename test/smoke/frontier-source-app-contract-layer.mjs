import { validateUniversalAstEnvelope } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import {
  compileFrontierSource,
  createUniversalAstFromDocument
} from './compiler-api.mjs';

const source = `
module AppContractLayer @id("mod_app_contract_layer")

type TodoInput @id("type_todo_input") {
  title: Text
}

entity Todo @id("ent_todo") {
  title @id("field_title"): Text
  done @id("field_done"): Boolean
}

state TodoDb @id("state_todo") {
  todos @id("collection_todos"): Map<Text, Todo>
}

capability HttpRequest @id("cap_http") {
  capability http.request
  category network
  adapter typescript symbol fetch platform node package undici kind library
  adapter rust symbol reqwest::Client::execute platform native package reqwest kind library
}

effect PersistTodo @id("effect_persist") {
  capability storage.write
  input TodoInput
  returns Json
  resources TodoDb.todos
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
  writes TodoDb.todos
  returns Patch
}

target rust @id("target_rust") {
  language rust
  package example_todo
  projection rustProjection @id("target_projection_rust") disposition target-adapter readiness needs-review represented semantic-symbol missing semantic-ownership
}
`;

const result = compileFrontierSource(source, { target: 'typescript' });
assert.equal(result.ok, true);

const universalAst = createUniversalAstFromDocument(result.document);
const appContracts = universalAst.layers.appContracts;

assert.equal(appContracts.layer, 'appContracts');
assert.equal(appContracts.metadata.semanticEquivalenceClaim, false);
assert.equal(appContracts.metadata.autoMergeClaim, false);
assert.equal(appContracts.summary.byNodeKind.action, 1);
assert.equal(appContracts.summary.byNodeKind.view, 1);
assert.equal(appContracts.summary.byContractKind['runtime-capability'], 2);
assert.equal(appContracts.summary.stateCollections, 1);
assert.equal(appContracts.summary.entityFields, 2);
assert.equal(appContracts.summary.typeFields, 1);
assert.equal(appContracts.summary.actionWrites, 1);
assert.equal(appContracts.summary.viewRenders, 1);
assert.equal(appContracts.summary.capabilityAdapters, 2);
assert.equal(appContracts.semanticNodeIds.includes('action_add'), true);
assert.equal(appContracts.effectIds.includes('http.request'), true);
assert.equal(appContracts.records.find((record) => record.nodeId === 'action_add').writes[0], 'TodoDb.todos');
assert.equal(appContracts.records.find((record) => record.nodeId === 'view_todo_list').renderIds[0], 'render_save_button');
assert.equal(appContracts.records.find((record) => record.nodeId === 'effect_persist').capability, 'storage.write');
assert.equal(appContracts.records.find((record) => record.nodeId === 'target_rust').projectionContractIds[0], 'target_projection_rust');
assert.equal(appContracts.references.some((reference) => reference.kind === 'semanticNode' && reference.id === 'action_add'), true);

const disabledAppContractAst = createUniversalAstFromDocument(result.document, { appContracts: false });
assert.equal(disabledAppContractAst.layers.appContracts, undefined);
assert.deepEqual(validateUniversalAstEnvelope(universalAst), []);
assert.deepEqual(validateUniversalAstEnvelope(disabledAppContractAst), []);

const custom = createUniversalAstFromDocument(result.document, {
  layers: { appContracts: { id: 'layer:custom_app_contracts', layer: 'appContracts', records: [] } }
});
assert.equal(custom.layers.appContracts.id, 'layer:custom_app_contracts');
