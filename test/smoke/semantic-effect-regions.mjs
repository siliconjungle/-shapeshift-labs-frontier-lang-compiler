import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

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
const sameLineEffectExpected = 'export function sync(api) { fetch(api, { cache: "reload" }); localStorage.setItem("k2", api); return api; }\n';
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
assert.equal(sameLineEffectScript.admission.status, 'auto-merge-candidate');
assert.equal(sameLineEffectScript.operations[0].anchor.symbolName, 'sync:effect:network#1');
const sameLineEffectProjection = projectSemanticEditScriptToSource({
  id: 'semantic_same_line_effect_projection',
  script: sameLineEffectScript,
  workerSourceText: sameLineEffectWorker,
  headSourceText: sameLineEffectHead
});
assert.equal(sameLineEffectProjection.status, 'projected');
assert.equal(sameLineEffectProjection.sourceText, sameLineEffectExpected);
const sameLineEffectReplay = replaySemanticEditProjection({
  id: 'semantic_same_line_effect_replay',
  projection: sameLineEffectProjection,
  currentSourceText: sameLineEffectHead
});
assert.equal(sameLineEffectReplay.status, 'accepted-clean');
assert.equal(sameLineEffectReplay.outputSourceText, sameLineEffectExpected);

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
