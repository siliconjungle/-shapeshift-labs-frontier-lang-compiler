import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { addProjectGraphDeltaConflictSummary } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { runtimeOrderReasonCodes } from '../../src/internal/index-impl/semanticEditRuntimeOrderReasons.js';

const sourceText = [
  'export function loadTodo(api, state) {',
  '  if (!state.ready) state.ready = true;',
  '  fetch(api);',
  '  state.items.push(api);',
  '  return state.items;',
  '}',
  ''
].join('\n');
const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_runtime_region_output_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/effects.ts': sourceText },
  workerFiles: { 'src/effects.ts': sourceText },
  headFiles: { 'src/effects.ts': sourceText }
});
const runtimeRecords = project.outputProjectSymbolGraph.runtimeRegionRecords;
assert.equal(project.status, 'merged');
assert.equal(project.outputProjectImport.projectSymbolGraph.runtimeRegionRecords.length, runtimeRecords.length);
assert.equal(project.outputProjectSymbolGraph.remainingFields.includes('runtimeRegionRecords'), false);
assert.equal(project.outputProjectSymbolGraph.runtimeRegionRecords.some((record) => record.publicContract
  && record.symbolName === 'loadTodo' && record.regionKind === 'effect' && record.runtimeKind === 'network'), true);
assert.equal(project.outputProjectSymbolGraph.runtimeRegionRecords.some((record) => record.publicContract
  && record.regionKind === 'mutation' && record.runtimeKind === 'assignment'), true);
assert.equal(project.outputProjectSymbolGraph.runtimeRegionRecords.some((record) => record.publicContract
  && record.regionKind === 'controlFlow' && record.runtimeKind === 'exit'), true);

const delta = runtimeDelta({
  base: runtimeRecord('base', 'runtime:base'),
  worker: runtimeRecord('worker', 'runtime:worker'),
  head: runtimeRecord('head', 'runtime:head'),
  output: runtimeRecord('output', 'runtime:output')
});
const conflicts = projectRuntimeRegionDeltaConflicts(delta);
const summarized = addProjectGraphDeltaConflictSummary(delta, conflicts);
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].code, 'project-public-runtime-region-delta-conflict');
assert.equal(conflicts[0].details.identityKey, 'runtime-region#src/effects.ts#loadTodo#effect#network#1');
assert.equal(conflicts[0].details.worker.signatureHash, 'runtime:worker');
assert.equal(summarized.summary.runtimeRegionConflicts, 1);

const unrelatedHeadDelta = runtimeDelta({
  base: runtimeRecord('base', 'runtime:base'),
  worker: runtimeRecord('worker', 'runtime:worker'),
  head: runtimeRecord('head', 'runtime:base')
});
assert.equal(projectRuntimeRegionDeltaConflicts(unrelatedHeadDelta).length, 0);

const guardedBaseSource = [
  'export function guardedLoad(api, state) {',
  '  if (state.ready) {',
  '    fetch(api);',
  '  }',
  '  return state.ready;',
  '}',
  ''
].join('\n');
const guardedWorkerSource = guardedBaseSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })');
const guardedHeadSource = guardedBaseSource.replace('if (state.ready)', 'if (state.ready && !state.blocked)');
const guardedBaseRecord = runtimeRecordFromSource('guarded_base', guardedBaseSource);
const guardedWorkerRecord = runtimeRecordFromSource('guarded_worker', guardedWorkerSource);
const guardedHeadRecord = runtimeRecordFromSource('guarded_head', guardedHeadSource);
assert.equal(guardedBaseRecord.runtimeOrderEvidence.enclosingControlFlow[0].text, 'if (state.ready)');
assert.equal(guardedHeadRecord.runtimeOrderEvidence.enclosingControlFlow[0].text, 'if (state.ready && !state.blocked)');
assert.notEqual(guardedBaseRecord.signatureHash, guardedHeadRecord.signatureHash);
const guardedConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: guardedBaseRecord,
  worker: guardedWorkerRecord,
  head: guardedHeadRecord,
  output: guardedWorkerRecord
}));
assert.equal(guardedConflicts.length, 1);
assert.equal(guardedConflicts[0].details.identityKey, 'runtime-region#src/guarded-effects.ts#guardedLoad#effect#network#1');
assert.equal(guardedConflicts[0].details.head.runtimeOrderEvidence.enclosingControlFlow[0].text, 'if (state.ready && !state.blocked)');

const shortCircuitBaseSource = [
  'export function guardedShortCircuit(api, state) {',
  '  state.ready && fetch(api);',
  '  return state.ready;',
  '}',
  ''
].join('\n');
const shortCircuitWorkerSource = shortCircuitBaseSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })');
const shortCircuitHeadSource = shortCircuitBaseSource.replace('state.ready && fetch(api)', 'state.ready && !state.blocked && fetch(api)');
const shortCircuitBaseRecord = runtimeRecordFromSource('short_circuit_base', shortCircuitBaseSource, {
  sourcePath: 'src/short-circuit-effects.ts',
  symbolName: 'guardedShortCircuit'
});
const shortCircuitWorkerRecord = runtimeRecordFromSource('short_circuit_worker', shortCircuitWorkerSource, {
  sourcePath: 'src/short-circuit-effects.ts',
  symbolName: 'guardedShortCircuit'
});
const shortCircuitHeadRecord = runtimeRecordFromSource('short_circuit_head', shortCircuitHeadSource, {
  sourcePath: 'src/short-circuit-effects.ts',
  symbolName: 'guardedShortCircuit'
});
assert.equal(shortCircuitBaseRecord.runtimeOrderEvidence.sameLineShortCircuit[0].guardText, 'state.ready');
assert.equal(shortCircuitHeadRecord.runtimeOrderEvidence.sameLineShortCircuit[0].guardText, 'state.ready && !state.blocked');
assert.notEqual(shortCircuitBaseRecord.signatureHash, shortCircuitHeadRecord.signatureHash);
const shortCircuitConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: shortCircuitBaseRecord,
  worker: shortCircuitWorkerRecord,
  head: shortCircuitHeadRecord,
  output: shortCircuitWorkerRecord
}));
assert.equal(shortCircuitConflicts.length, 1);
assert.equal(shortCircuitConflicts[0].details.identityKey, 'runtime-region#src/short-circuit-effects.ts#guardedShortCircuit#effect#network#1');
assert.equal(shortCircuitConflicts[0].details.head.runtimeOrderEvidence.sameLineShortCircuit[0].guardText, 'state.ready && !state.blocked');

const optionalMutationBaseSource = [
  'export function optionalDrain(state, item) {',
  '  state.items.push(item);',
  '  return state.items.length;',
  '}',
  ''
].join('\n');
const optionalMutationWorkerSource = optionalMutationBaseSource.replace('push(item)', 'push({ item })');
const optionalMutationHeadSource = optionalMutationBaseSource.replace('state.items.push(item)', 'state.items?.push(item)');
const optionalMutationBaseRecord = runtimeRecordFromSource('optional_mutation_base', optionalMutationBaseSource, { sourcePath: 'src/optional-mutation.ts', symbolName: 'optionalDrain', regionKind: 'mutation', runtimeKind: 'mutating-call' });
const optionalMutationWorkerRecord = runtimeRecordFromSource('optional_mutation_worker', optionalMutationWorkerSource, { sourcePath: 'src/optional-mutation.ts', symbolName: 'optionalDrain', regionKind: 'mutation', runtimeKind: 'mutating-call' });
const optionalMutationHeadRecord = runtimeRecordFromSource('optional_mutation_head', optionalMutationHeadSource, { sourcePath: 'src/optional-mutation.ts', symbolName: 'optionalDrain', regionKind: 'mutation', runtimeKind: 'mutating-call' });
assert.equal(optionalMutationBaseRecord.runtimeOrderEvidence.sameLineOptionalChain, undefined);
assert.equal(optionalMutationHeadRecord.runtimeOrderEvidence.sameLineOptionalChain[0].kind, 'optional-chain');
assert.notEqual(optionalMutationBaseRecord.signatureHash, optionalMutationHeadRecord.signatureHash);
assert.equal(runtimeOrderReasonCodes({ region: optionalMutationHeadRecord }).includes('runtime-order-optional-chain-merge-requires-nullish-boundary-evidence'), true);
const optionalMutationConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({ base: optionalMutationBaseRecord, worker: optionalMutationWorkerRecord, head: optionalMutationHeadRecord, output: optionalMutationWorkerRecord }));
assert.equal(optionalMutationConflicts.length, 1);
assert.equal(optionalMutationConflicts[0].details.identityKey, 'runtime-region#src/optional-mutation.ts#optionalDrain#mutation#mutating-call#1');
assert.equal(optionalMutationConflicts[0].details.head.runtimeOrderEvidence.sameLineOptionalChain[0].kind, 'optional-chain');

const awaitOrderBaseSource = 'export async function awaitLoad(api, state) {\n  const value = await fetch(api);\n  return value;\n}\n';
const awaitOrderWorkerSource = awaitOrderBaseSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })');
const awaitOrderHeadSource = awaitOrderBaseSource.replace('await fetch(api)', 'await (state.ready, fetch(api))');
const awaitOrderBaseRecord = runtimeRecordFromSource('await_order_base', awaitOrderBaseSource, { sourcePath: 'src/await-order-effects.ts', symbolName: 'awaitLoad' });
const awaitOrderWorkerRecord = runtimeRecordFromSource('await_order_worker', awaitOrderWorkerSource, { sourcePath: 'src/await-order-effects.ts', symbolName: 'awaitLoad' });
const awaitOrderHeadRecord = runtimeRecordFromSource('await_order_head', awaitOrderHeadSource, { sourcePath: 'src/await-order-effects.ts', symbolName: 'awaitLoad' });
assert.equal(awaitOrderHeadRecord.runtimeOrderEvidence.sameLineAwaitOrder[0].text, 'await (state.ready,');
const awaitOrderConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({ base: awaitOrderBaseRecord, worker: awaitOrderWorkerRecord, head: awaitOrderHeadRecord, output: awaitOrderWorkerRecord }));
assert.equal(awaitOrderConflicts[0].details.identityKey, 'runtime-region#src/await-order-effects.ts#awaitLoad#effect#network#1');

const importMetaHostBaseSource = 'export function assetUrl(name) {\n  return new URL(name, import.meta.url).href;\n}\n';
const importMetaHostWorkerSource = importMetaHostBaseSource.replace('import.meta.url', 'import.meta.resolve(name)');
const importMetaHostHeadSource = importMetaHostBaseSource.replace('import.meta.url', 'import.meta.env.BASE_URL');
const importMetaHostBaseRecord = runtimeRecordFromSource('import_meta_host_base', importMetaHostBaseSource, {
  sourcePath: 'src/import-meta-host.ts',
  symbolName: 'assetUrl',
  runtimeKind: 'host-context'
});
const importMetaHostWorkerRecord = runtimeRecordFromSource('import_meta_host_worker', importMetaHostWorkerSource, {
  sourcePath: 'src/import-meta-host.ts',
  symbolName: 'assetUrl',
  runtimeKind: 'host-context'
});
const importMetaHostHeadRecord = runtimeRecordFromSource('import_meta_host_head', importMetaHostHeadSource, {
  sourcePath: 'src/import-meta-host.ts',
  symbolName: 'assetUrl',
  runtimeKind: 'host-context'
});
assert.equal(importMetaHostBaseRecord.spanKind, 'import-meta-host-context');
assert.equal(importMetaHostBaseRecord.runtimeOrderEvidence.hostContext, 'import.meta');
assert.deepEqual(importMetaHostBaseRecord.runtimeOrderEvidence.importMetaMemberNames, ['url']);
assert.equal(importMetaHostHeadRecord.runtimeOrderEvidence.importMetaHostContext[0].memberPath.join('.'), 'env.BASE_URL');
assert.equal(runtimeOrderReasonCodes({ region: importMetaHostBaseRecord }).includes('effect-import-meta-merge-requires-host-context-evidence'), true);
assert.equal(runtimeOrderReasonCodes({ region: importMetaHostBaseRecord }).includes('runtime-order-import-meta-merge-requires-host-context-evidence'), true);
const importMetaHostConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: importMetaHostBaseRecord,
  worker: importMetaHostWorkerRecord,
  head: importMetaHostHeadRecord,
  output: importMetaHostWorkerRecord
}));
assert.equal(importMetaHostConflicts.length, 1);
assert.equal(importMetaHostConflicts[0].details.identityKey, 'runtime-region#src/import-meta-host.ts#assetUrl#effect#host-context#1');
assert.equal(importMetaHostConflicts[0].details.reasonCodes.includes('runtime-order-import-meta-merge-requires-host-context-evidence'), true);

const tryFinallyLoopSource = [
  'export function drain(queue, log) {',
  '  try {',
  '    while (queue.length) {',
  '      queue.shift();',
  '      return queue.length;',
  '    }',
  '  } finally {',
  '    log.push(queue.length);',
  '  }',
  '  return 0;',
  '}',
  ''
].join('\n');
const tryFinallyLoopRecord = runtimeRecordFromSource('try_finally_loop', tryFinallyLoopSource, {
  sourcePath: 'src/try-finally-order.ts',
  symbolName: 'drain',
  regionKind: 'mutation',
  runtimeKind: 'mutating-call',
  ordinal: 1
});
assert.equal(tryFinallyLoopRecord.runtimeOrderEvidence.tryFinallyOrder[0].kind, 'try-finally');
assert.equal(tryFinallyLoopRecord.runtimeOrderEvidence.tryFinallyOrder[0].finallyLine, 7);
assert.equal(tryFinallyLoopRecord.runtimeOrderEvidence.tryFinallyOrder[0].enclosingLoop.text, 'while (queue.length)');

const tryCatchThrowBaseSource = [
  'export function parseOrFallback(input, log) {',
  '  try {',
  '    throw new Error(input);',
  '  } catch (error) {',
  '    log.push(error.message);',
  '    return null;',
  '  }',
  '}',
  ''
].join('\n');
const tryCatchThrowWorkerSource = tryCatchThrowBaseSource.replace('throw new Error(input);', 'throw new TypeError(input);');
const tryCatchThrowHeadSource = tryCatchThrowBaseSource
  .replace('catch (error)', 'catch (caught)')
  .replace('error.message', 'caught.message');
const tryCatchThrowBaseRecord = runtimeRecordFromSource('try_catch_throw_base', tryCatchThrowBaseSource, {
  sourcePath: 'src/try-catch-order.ts',
  symbolName: 'parseOrFallback',
  regionKind: 'controlFlow',
  runtimeKind: 'exception',
  spanText: 'throw new Error(input);'
});
const tryCatchThrowWorkerRecord = runtimeRecordFromSource('try_catch_throw_worker', tryCatchThrowWorkerSource, {
  sourcePath: 'src/try-catch-order.ts',
  symbolName: 'parseOrFallback',
  regionKind: 'controlFlow',
  runtimeKind: 'exception',
  spanText: 'throw new TypeError(input);'
});
const tryCatchThrowHeadRecord = runtimeRecordFromSource('try_catch_throw_head', tryCatchThrowHeadSource, {
  sourcePath: 'src/try-catch-order.ts',
  symbolName: 'parseOrFallback',
  regionKind: 'controlFlow',
  runtimeKind: 'exception',
  spanText: 'throw new Error(input);'
});
assert.equal(tryCatchThrowBaseRecord.ordinal, 2);
assert.equal(tryCatchThrowBaseRecord.runtimeOrderEvidence.sameLineThrow, true);
assert.equal(tryCatchThrowBaseRecord.runtimeOrderEvidence.sameLineThrowOrder[0].kind, 'throw');
assert.equal(tryCatchThrowBaseRecord.runtimeOrderEvidence.sameLineThrowOrder[0].expressionText, 'new Error(input)');
assert.equal(tryCatchThrowBaseRecord.runtimeOrderEvidence.sameLineThrowOrder[0].regionWithinThrow, true);
assert.equal(tryCatchThrowBaseRecord.runtimeOrderEvidence.tryCatchOrder[0].kind, 'try-catch');
assert.equal(tryCatchThrowBaseRecord.runtimeOrderEvidence.tryCatchOrder[0].catchText, 'catch (error)');
assert.equal(tryCatchThrowHeadRecord.runtimeOrderEvidence.tryCatchOrder[0].catchText, 'catch (caught)');
assert.equal(runtimeOrderReasonCodes({ region: tryCatchThrowBaseRecord }).includes('runtime-order-throw-merge-requires-exception-path-evidence'), true);
assert.notEqual(tryCatchThrowBaseRecord.signatureHash, tryCatchThrowHeadRecord.signatureHash);
const tryCatchThrowConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: tryCatchThrowBaseRecord,
  worker: tryCatchThrowWorkerRecord,
  head: tryCatchThrowHeadRecord,
  output: tryCatchThrowWorkerRecord
}));
assert.equal(tryCatchThrowConflicts.length, 1);
assert.equal(tryCatchThrowConflicts[0].details.identityKey, 'runtime-region#src/try-catch-order.ts#parseOrFallback#controlFlow#exception#2');
assert.equal(tryCatchThrowConflicts[0].details.head.runtimeOrderEvidence.tryCatchOrder[0].catchText, 'catch (caught)');
assert.equal(tryCatchThrowConflicts[0].details.reasonCodes.includes('runtime-order-throw-merge-requires-exception-path-evidence'), true);

function runtimeDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { runtimeRegionRecords: record ? [record] : [] },
      summary: { runtimeRegionRecords: record ? 1 : 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function runtimeRecord(stage, signatureHash) {
  return {
    id: `runtime_${stage}`,
    sourcePath: 'src/effects.ts',
    symbolName: 'loadTodo',
    symbolKind: 'function',
    regionKind: 'effect',
    runtimeKind: 'network',
    runtimeKinds: ['network'],
    ordinal: 1,
    line: 3,
    spanKind: 'network-call',
    signatureHash,
    sourceHash: `source:${stage}`,
    publicContract: true
  };
}

function runtimeRecordFromSource(id, sourceText, options = {}) {
  const sourcePath = options.sourcePath ?? 'src/guarded-effects.ts';
  const symbolName = options.symbolName ?? 'guardedLoad';
  const regionKind = options.regionKind ?? 'effect';
  const runtimeKind = options.runtimeKind ?? 'network';
  const result = safeMergeJsTsProject({
    id: `runtime_region_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { [sourcePath]: sourceText },
    workerFiles: { [sourcePath]: sourceText },
    headFiles: { [sourcePath]: sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((item) => item.publicContract
    && item.symbolName === symbolName
    && item.regionKind === regionKind
    && item.runtimeKind === runtimeKind
    && (options.ordinal === undefined || item.ordinal === options.ordinal)
    && (options.spanText === undefined || sourceTextForSpan(sourceText, item.sourceSpan) === options.spanText));
  assert.ok(record);
  return record;
}

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
