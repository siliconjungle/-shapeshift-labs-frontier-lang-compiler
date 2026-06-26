import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection,
  safeMergeJsTsSource
} from './compiler-api.mjs';
import { semanticEffectRegionRecordsForImport } from '../../src/semantic-import-effect-regions.js';

const baseSource = [
  'export function loadTodo(api, state) {',
  '  if (!state.ready) state.ready = true;',
  '  fetch(api);',
  '  state.items.push(api);',
  '  return state.items;',
  '}',
  ''
].join('\n');
const workerSource = [
  'export function loadTodo(api, state) {',
  '  if (!state.ready) state.ready = true;',
  "  fetch(api, { cache: 'no-store' });",
  '  state.items.push(api);',
  '  return state.items;',
  '}',
  ''
].join('\n');

const workerImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/effects.ts',
  sourceText: workerSource
});
const workerSidecar = createSemanticImportSidecar(workerImport, { generatedAt: 200 });
for (const kind of ['controlFlow', 'effect', 'mutation']) {
  assert.equal(workerSidecar.regionTaxonomy.presentKinds.includes(kind), true);
}
const effectRegion = workerSidecar.ownershipRegions.find((region) => region.regionKind === 'effect'
  && region.symbolName === 'loadTodo:effect:network#1');
assert.ok(effectRegion);
assert.equal(effectRegion.precision, 'expression');
assert.equal(effectRegion.metadata.spanKind, 'network-call');
assert.equal(sourceTextForSpan(workerSource, effectRegion.sourceSpan), "fetch(api, { cache: 'no-store' })");
const branchRegion = workerSidecar.ownershipRegions.find((region) => region.symbolName === 'loadTodo:controlFlow:branch#1');
const mutationRegion = workerSidecar.ownershipRegions.find((region) => region.symbolName === 'loadTodo:mutation:assignment#1');
assert.ok(branchRegion);
assert.ok(mutationRegion);
assert.equal(sourceTextForSpan(workerSource, branchRegion.sourceSpan), 'if (!state.ready)');
assert.equal(sourceTextForSpan(workerSource, mutationRegion.sourceSpan), 'state.ready = true;');
const mutatingCallRegion = workerSidecar.ownershipRegions.find((region) => region.symbolName === 'loadTodo:mutation:mutating-call#1');
assert.ok(mutatingCallRegion);
assert.equal(sourceTextForSpan(workerSource, mutatingCallRegion.sourceSpan), 'state.items.push(api)');
assert.equal(workerSidecar.patchHints.some((hint) => hint.ownershipKey === effectRegion.key
  && hint.supportedOperations.includes('replace-effect-boundary')), true);

const script = createSemanticEditScript({
  id: 'semantic_effect_replace',
  language: 'typescript',
  sourcePath: 'src/effects.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  generatedAt: 201
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.summary.byKind.replaceEffect, 1);
assert.equal(script.operations.some((operation) => operation.anchor.regionKind === 'body'
  && operation.anchor.symbolName === 'loadTodo'), false);
const effectOperation = script.operations.find((operation) => operation.kind === 'replaceEffect');
assert.ok(effectOperation);
assert.equal(effectOperation.anchor.symbolName, 'loadTodo:effect:network#1');
assert.equal(sourceTextForSpan(workerSource, effectOperation.spans.worker), "fetch(api, { cache: 'no-store' })");

const projection = projectSemanticEditScriptToSource({
  id: 'semantic_effect_projection',
  script,
  workerSourceText: workerSource,
  headSourceText: baseSource
});
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, workerSource);
assert.equal(projection.edits.length, 1);
assert.equal(projection.edits[0].kind, 'replaceEffect');

const sameLineEffectBase = 'export function sync(api) { fetch(api); localStorage.setItem("k", api); return api; }\n';
const sameLineEffectWorker = 'export function sync(api) { fetch(api, { cache: "reload" }); localStorage.setItem("k", api); return api; }\n';
const sameLineEffectHead = 'export function sync(api) { fetch(api); localStorage.setItem("k2", api); return api; }\n';
const sameLineEffectSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/same-line-effects.ts',
  sourceText: sameLineEffectBase
}), { generatedAt: 202 });
const sameLineEffectRegions = sameLineEffectSidecar.ownershipRegions.filter((region) => region.regionKind === 'effect');
assert.deepEqual(sameLineEffectRegions.map((region) => region.symbolName), [
  'sync:effect:network#1',
  'sync:effect:storage#1'
]);
assert.equal(sourceTextForSpan(sameLineEffectBase, sameLineEffectRegions[0].sourceSpan), 'fetch(api)');
assert.equal(sourceTextForSpan(sameLineEffectBase, sameLineEffectRegions[1].sourceSpan), 'localStorage.setItem("k", api);');
const sameLineEffectScript = createSemanticEditScript({
  id: 'semantic_same_line_effect_independence',
  language: 'typescript',
  sourcePath: 'src/same-line-effects.ts',
  baseSourceText: sameLineEffectBase,
  workerSourceText: sameLineEffectWorker,
  headSourceText: sameLineEffectHead,
  generatedAt: 203
});
assert.equal(sameLineEffectScript.admission.status, 'conflict');
assert.equal(sameLineEffectScript.operations[0].anchor.symbolName, 'sync:effect:network#1');
assert.equal(sameLineEffectScript.operations[0].status, 'conflict');
assert.equal(sameLineEffectScript.operations[0].reasonCodes.includes('head-order-sensitive-peer-changed-since-base'), true);
assert.equal(sameLineEffectScript.operations[0].reasonCodes.includes('runtime-order-sensitive-merge-requires-explicit-evidence'), true);
assert.equal(sameLineEffectScript.operations[0].reasonCodes.includes('effect-network-merge-requires-io-order-evidence'), true);
assert.equal(sameLineEffectScript.operations[0].reasonCodes.includes('effect-storage-merge-requires-storage-order-evidence'), true);
const sameLineEffectProjection = projectSemanticEditScriptToSource({
  id: 'semantic_same_line_effect_projection',
  script: sameLineEffectScript,
  workerSourceText: sameLineEffectWorker,
  headSourceText: sameLineEffectHead
});
assert.equal(sameLineEffectProjection.status, 'blocked');
assert.equal(sameLineEffectProjection.sourceText, undefined);
const sameLineEffectReplay = replaySemanticEditProjection({
  id: 'semantic_same_line_effect_replay',
  projection: sameLineEffectProjection,
  currentSourceText: sameLineEffectHead
});
assert.equal(sameLineEffectReplay.status, 'blocked');
assert.equal(sameLineEffectReplay.outputSourceText, undefined);
const sameLineEffectMerge = safeMergeJsTsSource({
  id: 'semantic_same_line_effect_safe_merge_blocked',
  language: 'typescript',
  sourcePath: 'src/same-line-effects.ts',
  baseSourceText: sameLineEffectBase,
  workerSourceText: sameLineEffectWorker,
  headSourceText: sameLineEffectHead
});
assert.equal(sameLineEffectMerge.status, 'blocked');
assert.equal(sameLineEffectMerge.mergedSourceText, undefined);
assert.equal(sameLineEffectMerge.admission.reasonCodes.includes('effect-merge-requires-effect-order-evidence'), true);

const controlOrderBase = [
  'export function decide(value) {',
  '  if (value > 0) return value;',
  '  return 0;',
  '}',
  ''
].join('\n');
const controlOrderWorker = controlOrderBase.replace('value > 0', 'value >= 0');
const controlOrderHead = controlOrderBase.replace('return 0;', 'return -1;');
const controlOrderScript = createSemanticEditScript({
  id: 'semantic_control_flow_peer_order_blocked',
  language: 'typescript',
  sourcePath: 'src/control-order.ts',
  baseSourceText: controlOrderBase,
  workerSourceText: controlOrderWorker,
  headSourceText: controlOrderHead,
  generatedAt: 203
});
assert.equal(controlOrderScript.admission.status, 'conflict');
const controlOrderOperation = controlOrderScript.operations.find((operation) => operation.anchor.symbolName === 'decide:controlFlow:branch#1');
assert.ok(controlOrderOperation);
assert.equal(controlOrderOperation.status, 'conflict');
assert.equal(controlOrderOperation.reasonCodes.includes('control-flow-branch-merge-requires-condition-order-evidence'), true);
assert.equal(controlOrderOperation.reasonCodes.includes('control-flow-exit-merge-requires-return-yield-order-evidence'), true);

const assignmentOrderBase = 'export function update(state) { if (!state.ready) state.ready = true; return state.ready; }\n';
const assignmentOrderWorker = assignmentOrderBase.replace('state.ready = true', 'state.ready = false');
const assignmentOrderHead = assignmentOrderBase.replace('if (!state.ready)', 'if (state.pending && !state.ready)');
const assignmentOrderScript = createSemanticEditScript({
  id: 'semantic_assignment_peer_order_blocked',
  language: 'typescript',
  sourcePath: 'src/assignment-order.ts',
  baseSourceText: assignmentOrderBase,
  workerSourceText: assignmentOrderWorker,
  headSourceText: assignmentOrderHead,
  generatedAt: 203
});
assert.equal(assignmentOrderScript.admission.status, 'conflict');
const assignmentOrderOperation = assignmentOrderScript.operations.find((operation) => operation.anchor.symbolName === 'update:mutation:assignment#1');
assert.ok(assignmentOrderOperation);
assert.equal(assignmentOrderOperation.status, 'conflict');
assert.equal(assignmentOrderOperation.reasonCodes.includes('mutation-assignment-merge-requires-assignment-order-evidence'), true);
assert.equal(assignmentOrderOperation.reasonCodes.includes('control-flow-branch-merge-requires-condition-order-evidence'), true);

const runtimeApiEffectSource = [
  'export function connectRuntime(url, key, timer) {',
  '  const socket = new WebSocket(url);',
  '  const worker = new Worker(url);',
  '  localStorage.setItem(key, socket.url);',
  '  indexedDB.open(key);',
  '  clearTimeout(timer);',
  '  return worker;',
  '}',
  ''
].join('\n');
const runtimeApiEffectImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-effects.ts',
  sourceText: runtimeApiEffectSource
});
const runtimeApiEffectSymbol = runtimeApiEffectImport.semanticIndex.symbols.find((symbol) => symbol.name === 'connectRuntime');
const runtimeApiEffectFacts = runtimeApiEffectImport.semanticIndex.facts
  .filter((fact) => fact.subjectId === runtimeApiEffectSymbol.id && fact.predicate === 'effect')
  .map((fact) => `${fact.value.kind}:${fact.value.line}`);
assert.deepEqual(runtimeApiEffectFacts, [
  'network:2',
  'browser:3',
  'storage:4',
  'storage:5',
  'scheduler:6'
]);
const runtimeApiEffectSidecar = createSemanticImportSidecar(runtimeApiEffectImport, { generatedAt: 204 });
const runtimeApiEffectRegions = runtimeApiEffectSidecar.ownershipRegions.filter((region) => region.regionKind === 'effect');
assert.deepEqual(runtimeApiEffectRegions.map((region) => region.symbolName), [
  'connectRuntime:effect:network#1',
  'connectRuntime:effect:browser#1',
  'connectRuntime:effect:storage#1',
  'connectRuntime:effect:storage#2',
  'connectRuntime:effect:scheduler#1'
]);
assert.equal(runtimeApiEffectRegions.every((region) => region.mergePolicy === 'effect-boundary-review-required'), true);

const getterEffectSource = 'export function read(model) { const value = model.current; return value; }\n';
const getterEffectRecords = semanticEffectRegionRecordsForImport({
  language: 'typescript',
  sourcePath: 'src/getter-effects.ts',
  sourceHash: 'source:getter-effects',
  metadata: { sourcePreservation: { sourceText: getterEffectSource } }
}, {
  symbols: [{
    id: 'symbol:typescript:read',
    name: 'read',
    kind: 'function',
    metadata: { ownershipRegionKind: 'body' }
  }],
  facts: [{
    id: 'fact_getter_read_current',
    predicate: 'effect',
    subjectId: 'symbol:typescript:read',
    value: {
      kind: 'getter',
      line: 1,
      sourcePath: 'src/getter-effects.ts'
    }
  }]
});
const getterEffectRegion = getterEffectRecords.ownershipRegions.find((region) => region.symbolName === 'read:effect:getter#1');
assert.ok(getterEffectRegion);
assert.equal(getterEffectRegion.precision, 'expression');
assert.equal(getterEffectRegion.metadata.spanKind, 'getter-access');
assert.equal(sourceTextForSpan(getterEffectSource, getterEffectRegion.sourceSpan), 'model.current');

const templateEffectSource = [
  'export function renderTemplate(name, tag) {',
  '  const plain = `hello world`;',
  '  const message = `hello ${name}`;',
  '  const html = tag`<p>${name}</p>`;',
  '  return `${plain}${message}${html}`;',
  '}',
  ''
].join('\n');
const templateEffectImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/template-effects.ts',
  sourceText: templateEffectSource
});
const templateEffectSymbol = templateEffectImport.semanticIndex.symbols.find((symbol) => symbol.name === 'renderTemplate');
const templateEffectFacts = templateEffectImport.semanticIndex.facts.filter((fact) => fact.subjectId === templateEffectSymbol.id
  && fact.predicate === 'effect').map((fact) => `${fact.value.kind}:${fact.value.line}`);
assert.equal(templateEffectFacts.includes('template-literal:2'), true);
assert.equal(templateEffectFacts.includes('template-interpolation:3'), true);
assert.equal(templateEffectFacts.includes('tagged-template:4'), true);
const templateEffectSidecar = createSemanticImportSidecar(templateEffectImport, { generatedAt: 205 });
const taggedTemplateRegion = templateEffectSidecar.ownershipRegions.find((region) => region.symbolName === 'renderTemplate:effect:tagged-template#1');
assert.ok(taggedTemplateRegion);
assert.equal(taggedTemplateRegion.metadata.spanKind, 'tagged-template');
assert.equal(sourceTextForSpan(templateEffectSource, taggedTemplateRegion.sourceSpan), 'tag`<p>${name}</p>`');

const plainTemplateScript = createSemanticEditScript({
  id: 'semantic_plain_template_text_edit',
  language: 'typescript', sourcePath: 'src/plain-template.ts',
  baseSourceText: 'export function label() { return `hello`; }\n',
  workerSourceText: 'export function label() { return `hello world`; }\n',
  headSourceText: 'export function label() { return `hello`; }\n',
  generatedAt: 206
});
assert.equal(plainTemplateScript.admission.status, 'auto-merge-candidate');
assert.equal(plainTemplateScript.operations.every((operation) => operation.status !== 'blocked'), true);

const interpolatedTemplateScript = createSemanticEditScript({
  id: 'semantic_interpolated_template_blocked',
  language: 'typescript', sourcePath: 'src/interpolated-template.ts',
  baseSourceText: 'export function label(name) { return `hello ${name}`; }\n',
  workerSourceText: 'export function label(name) { return `hello ${name.trim()}`; }\n',
  headSourceText: 'export function label(name) { return `hello ${name}`; }\n',
  generatedAt: 207
});
assert.equal(interpolatedTemplateScript.admission.status, 'blocked');
assert.equal(interpolatedTemplateScript.admission.reasonCodes.includes('template-interpolation-merge-requires-expression-order-evidence'), true);

const taggedTemplateScript = createSemanticEditScript({
  id: 'semantic_tagged_template_blocked',
  language: 'typescript',
  sourcePath: 'src/tagged-template.ts',
  baseSourceText: 'export function label(name, tag) { return tag`hello ${name}`; }\n',
  workerSourceText: 'export function label(name, tag) { return tag`hello ${name.trim()}`; }\n',
  headSourceText: 'export function label(name, tag) { return tag`hello ${name}`; }\n',
  generatedAt: 208
});
assert.equal(taggedTemplateScript.admission.status, 'blocked');
assert.equal(taggedTemplateScript.admission.reasonCodes.includes('tagged-template-merge-requires-tag-effect-evidence'), true);

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1]; return line.slice(span.startColumn - 1, span.endColumn - 1);
}
