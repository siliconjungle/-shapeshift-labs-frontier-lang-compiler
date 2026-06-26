import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsProject,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const sourceText = [
  'export function routeWork(queue, state) {',
  '  if (state.ready) {',
  '    fetch(state.url);',
  '  }',
  '  while (queue.length) {',
  '    queue.shift();',
  '  }',
  '  return queue.length;',
  '}',
  ''
].join('\n');

const sidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-branch-loop.ts',
  sourceText
}), { generatedAt: 211 });

const branchRegion = sidecar.ownershipRegions
  .find((region) => region.symbolName === 'routeWork:controlFlow:branch#1');
const loopRegion = sidecar.ownershipRegions
  .find((region) => region.symbolName === 'routeWork:controlFlow:loop#1');
const networkRegion = sidecar.ownershipRegions
  .find((region) => region.symbolName === 'routeWork:effect:network#1');
const loopMutationRegion = sidecar.ownershipRegions
  .find((region) => region.symbolName === 'routeWork:mutation:mutating-call#1');

assert.ok(branchRegion);
assert.ok(loopRegion);
assert.ok(networkRegion);
assert.ok(loopMutationRegion);
assert.equal(sourceTextForSpan(sourceText, branchRegion.sourceSpan), 'if (state.ready)');
assert.equal(branchRegion.metadata.runtimeOrderEvidence.branchOrder[0].line, 2);
assert.equal(branchRegion.metadata.runtimeOrderEvidence.branchOrder[0].text, 'if (state.ready)');
assert.equal(sourceTextForSpan(sourceText, loopRegion.sourceSpan), 'while (queue.length)');
assert.equal(loopRegion.metadata.runtimeOrderEvidence.loopOrder[0].line, 5);
assert.equal(loopRegion.metadata.runtimeOrderEvidence.loopOrder[0].text, 'while (queue.length)');
assert.equal(networkRegion.metadata.runtimeOrderEvidence.enclosingControlFlow[0].text, 'if (state.ready)');
assert.equal(loopMutationRegion.metadata.runtimeOrderEvidence.enclosingControlFlow[0].text, 'while (queue.length)');

const branchWorkerSource = sourceText.replace('fetch(state.url);', 'fetch(state.url, { cache: "reload" });');
const branchHeadSource = sourceText.replace('if (state.ready)', 'if (state.ready && !state.blocked)');
const branchScript = createSemanticEditScript({
  id: 'semantic_runtime_branch_order_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-branch-loop.ts',
  baseSourceText: sourceText,
  workerSourceText: branchWorkerSource,
  headSourceText: branchHeadSource,
  generatedAt: 212
});
const branchOperation = branchScript.operations
  .find((operation) => operation.anchor.symbolName === 'routeWork:effect:network#1');
assert.equal(branchScript.admission.status, 'conflict');
assert.equal(branchOperation.status, 'conflict');
assert.equal(branchOperation.reasonCodes.includes('head-order-sensitive-peer-changed-since-base'), true);
assert.equal(branchOperation.reasonCodes.includes('control-flow-branch-merge-requires-condition-order-evidence'), true);

const loopWorkerSource = sourceText.replace('queue.shift();', 'queue.pop();');
const loopHeadSource = sourceText.replace('while (queue.length)', 'while (queue.length > 1)');
const loopScript = createSemanticEditScript({
  id: 'semantic_runtime_loop_order_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-branch-loop.ts',
  baseSourceText: sourceText,
  workerSourceText: loopWorkerSource,
  headSourceText: loopHeadSource,
  generatedAt: 213
});
const loopOperation = loopScript.operations
  .find((operation) => operation.anchor.symbolName === 'routeWork:mutation:mutating-call#1');
assert.equal(loopScript.admission.status, 'conflict');
assert.equal(loopOperation.status, 'conflict');
assert.equal(loopOperation.reasonCodes.includes('head-runtime-order-evidence-changed-since-base'), true);
assert.equal(loopOperation.reasonCodes.includes('runtime-order-loop-iteration-merge-requires-loop-header-evidence'), true);
assert.equal(loopOperation.reasonCodes.includes('runtime-order-while-loop-merge-requires-condition-evidence'), true);

const project = safeMergeJsTsProject({
  id: 'semantic_runtime_branch_loop_project_records',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/runtime-branch-loop.ts': sourceText },
  workerFiles: { 'src/runtime-branch-loop.ts': sourceText },
  headFiles: { 'src/runtime-branch-loop.ts': sourceText }
});
const branchRecord = project.outputProjectSymbolGraph.runtimeRegionRecords
  .find((record) => record.symbolName === 'routeWork' && record.regionKind === 'controlFlow' && record.runtimeKind === 'branch');
const loopRecord = project.outputProjectSymbolGraph.runtimeRegionRecords
  .find((record) => record.symbolName === 'routeWork' && record.regionKind === 'controlFlow' && record.runtimeKind === 'loop');
assert.equal(project.status, 'merged');
assert.equal(branchRecord.runtimeOrderEvidence.branchOrder[0].text, 'if (state.ready)');
assert.equal(loopRecord.runtimeOrderEvidence.loopOrder[0].text, 'while (queue.length)');

const forOfSource = [
  'export function syncItems(items, api, log) {',
  '  for (const item of items) {',
  '    fetch(api + item);',
  '    log.push(item);',
  '  }',
  '}',
  ''
].join('\n');
const forOfSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-for-of.ts',
  sourceText: forOfSource
}), { generatedAt: 214 });
const forOfNetworkRegion = forOfSidecar.ownershipRegions
  .find((region) => region.symbolName === 'syncItems:effect:network#1');
const forOfMutationRegion = forOfSidecar.ownershipRegions
  .find((region) => region.symbolName === 'syncItems:mutation:mutating-call#1');
assert.ok(forOfNetworkRegion);
assert.ok(forOfMutationRegion);
assert.equal(forOfNetworkRegion.metadata.runtimeOrderEvidence.loopIterationOrder[0].loopKind, 'for-of');
assert.equal(forOfNetworkRegion.metadata.runtimeOrderEvidence.loopIterationOrder[0].iteratorText, 'const item');
assert.equal(forOfNetworkRegion.metadata.runtimeOrderEvidence.loopIterationOrder[0].iterableText, 'items');
assert.equal(forOfMutationRegion.metadata.runtimeOrderEvidence.loopIterationOrder[0].loopText, 'for (const item of items)');

const forOfWorkerSource = forOfSource.replace('fetch(api + item)', 'fetch(api + item, { cache: "reload" })');
const forOfHeadSource = forOfSource.replace('for (const item of items)', 'for (const item of items.filter(Boolean))');
const forOfScript = createSemanticEditScript({
  id: 'semantic_runtime_for_of_iteration_order_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-for-of.ts',
  baseSourceText: forOfSource,
  workerSourceText: forOfWorkerSource,
  headSourceText: forOfHeadSource,
  generatedAt: 215
});
const forOfOperation = forOfScript.operations
  .find((operation) => operation.anchor.symbolName === 'syncItems:effect:network#1');
assert.equal(forOfScript.admission.status, 'conflict');
assert.equal(forOfOperation.status, 'conflict');
assert.equal(forOfOperation.reasonCodes.includes('head-runtime-order-evidence-changed-since-base'), true);
assert.equal(forOfOperation.reasonCodes.includes('runtime-order-loop-iteration-merge-requires-loop-header-evidence'), true);
assert.equal(forOfOperation.reasonCodes.includes('runtime-order-loop-iterator-merge-requires-iteration-source-evidence'), true);

const forOfMerge = safeMergeJsTsSource({
  id: 'semantic_runtime_for_of_safe_merge_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-for-of.ts',
  baseSourceText: forOfSource,
  workerSourceText: forOfWorkerSource,
  headSourceText: forOfHeadSource
});
assert.equal(forOfMerge.status, 'blocked');
assert.equal(forOfMerge.mergedSourceText, undefined);

const transferSource = [
  'export function transferItems(items, api, log) {',
  '  for (const item of items) {',
  '    if (!item.ready) continue;',
  '    fetch(api + item.id);',
  '    if (item.stop) break;',
  '    log.push(item.id);',
  '  }',
  '}',
  ''
].join('\n');
const transferSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-transfer.ts',
  sourceText: transferSource
}), { generatedAt: 216 });
const continueRegion = transferSidecar.ownershipRegions
  .find((region) => region.symbolName === 'transferItems:controlFlow:transfer#1');
const breakRegion = transferSidecar.ownershipRegions
  .find((region) => region.symbolName === 'transferItems:controlFlow:transfer#2');
const transferNetworkRegion = transferSidecar.ownershipRegions
  .find((region) => region.symbolName === 'transferItems:effect:network#1');
assert.ok(continueRegion);
assert.ok(breakRegion);
assert.ok(transferNetworkRegion);
assert.equal(sourceTextForSpan(transferSource, continueRegion.sourceSpan), 'continue;');
assert.equal(continueRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].transferKind, 'continue');
assert.equal(sourceTextForSpan(transferSource, breakRegion.sourceSpan), 'break;');
assert.equal(breakRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].transferKind, 'break');
assert.equal(transferNetworkRegion.metadata.runtimeOrderEvidence.previousRuntimeKind, 'transfer');

const transferWorkerSource = transferSource.replace('fetch(api + item.id)', 'fetch(api + item.id, { cache: "reload" })');
const transferHeadSource = transferSource.replace('continue;', 'break;');
const transferScript = createSemanticEditScript({
  id: 'semantic_runtime_transfer_order_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-transfer.ts',
  baseSourceText: transferSource,
  workerSourceText: transferWorkerSource,
  headSourceText: transferHeadSource,
  generatedAt: 217
});
const transferOperation = transferScript.operations
  .find((operation) => operation.anchor.symbolName === 'transferItems:effect:network#1');
assert.equal(transferScript.admission.status, 'conflict');
assert.equal(transferOperation.status, 'conflict');
assert.equal(transferOperation.reasonCodes.includes('head-order-sensitive-peer-changed-since-base'), true);
assert.equal(transferOperation.reasonCodes.includes('control-flow-transfer-merge-requires-break-continue-order-evidence'), true);
assert.equal(transferOperation.reasonCodes.includes('runtime-order-control-transfer-merge-requires-break-continue-evidence'), true);
assert.equal(transferOperation.reasonCodes.includes('runtime-order-continue-merge-requires-next-iteration-evidence'), true);

const labeledTransferSource = [
  'export function labeledTransfer(groups, log) {',
  '  outer: for (const group of groups) {',
  '    for (const item of group.items) {',
  '      if (item.skip) continue outer;',
  '      if (item.done) break outer;',
  '      log.push(item.id);',
  '    }',
  '  }',
  '}',
  ''
].join('\n');
const labeledTransferSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-labeled-transfer.ts',
  sourceText: labeledTransferSource
}), { generatedAt: 218 });
const labeledContinueRegion = labeledTransferSidecar.ownershipRegions
  .find((region) => region.symbolName === 'labeledTransfer:controlFlow:transfer#1');
const labeledBreakRegion = labeledTransferSidecar.ownershipRegions
  .find((region) => region.symbolName === 'labeledTransfer:controlFlow:transfer#2');
assert.ok(labeledContinueRegion);
assert.ok(labeledBreakRegion);
assert.equal(labeledContinueRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].labelText, 'outer');
assert.equal(labeledContinueRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].labelLine, 2);
assert.equal(labeledContinueRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].labelTargetLine, 2);
assert.equal(labeledContinueRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].labelTargetKind, 'loop');
assert.equal(labeledContinueRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].labelTargetText, 'for (const group of groups)');
assert.equal(labeledBreakRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].labelText, 'outer');
assert.equal(labeledBreakRegion.metadata.runtimeOrderEvidence.controlTransferOrder[0].labelTargetKind, 'loop');

const labeledTransferWorkerSource = labeledTransferSource.replace('log.push(item.id);', 'log.push(String(item.id));');
const labeledTransferHeadSource = labeledTransferSource.replace('continue outer;', 'continue;');
const labeledTransferScript = createSemanticEditScript({
  id: 'semantic_runtime_labeled_transfer_target_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-labeled-transfer.ts',
  baseSourceText: labeledTransferSource,
  workerSourceText: labeledTransferWorkerSource,
  headSourceText: labeledTransferHeadSource,
  generatedAt: 219
});
const labeledTransferOperation = labeledTransferScript.operations
  .find((operation) => operation.anchor.symbolName === 'labeledTransfer:mutation:mutating-call#1');
assert.equal(labeledTransferScript.admission.status, 'conflict');
assert.equal(labeledTransferOperation.status, 'conflict');
assert.equal(labeledTransferOperation.reasonCodes.includes('runtime-order-labeled-transfer-merge-requires-label-target-evidence'), true);
assert.equal(labeledTransferOperation.reasonCodes.includes('runtime-order-labeled-transfer-target-lexical-evidence'), true);

const exitSource = [
  'export function exitAfter(items, log) {',
  '  if (!items.length) return null;',
  '  log.push(items[0]);',
  '  return items[0];',
  '}',
  ''
].join('\n');
const exitSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-exit.ts',
  sourceText: exitSource
}), { generatedAt: 220 });
const earlyReturnRegion = exitSidecar.ownershipRegions
  .find((region) => region.symbolName === 'exitAfter:controlFlow:exit#1');
assert.ok(earlyReturnRegion);
assert.equal(sourceTextForSpan(exitSource, earlyReturnRegion.sourceSpan), 'return null;');
assert.equal(earlyReturnRegion.metadata.runtimeOrderEvidence.exitOrder[0].kind, 'return');
assert.equal(earlyReturnRegion.metadata.runtimeOrderEvidence.exitOrder[0].expressionText, 'null');

const exitWorkerSource = exitSource.replace('log.push(items[0]);', 'log.push(String(items[0]));');
const exitHeadSource = exitSource.replace('return null;', 'return undefined;');
const exitScript = createSemanticEditScript({
  id: 'semantic_runtime_exit_completion_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-exit.ts',
  baseSourceText: exitSource,
  workerSourceText: exitWorkerSource,
  headSourceText: exitHeadSource,
  generatedAt: 221
});
const exitOperation = exitScript.operations
  .find((operation) => operation.anchor.symbolName === 'exitAfter:mutation:mutating-call#1');
assert.equal(exitScript.admission.status, 'conflict');
assert.equal(exitOperation.status, 'conflict');
assert.equal(exitOperation.reasonCodes.includes('control-flow-exit-merge-requires-return-yield-order-evidence'), true);
assert.equal(exitOperation.reasonCodes.includes('runtime-order-exit-merge-requires-completion-value-evidence'), true);

function sourceTextForSpan(source, span) {
  const line = String(source).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
