import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsProject,
  safeMergeJsTsSource
} from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';

const switchSource = [
  'export function loadByKind(kind, api, log) {',
  '  switch (kind) {',
  '    case "remote":',
  '      fetch(api);',
  '      break;',
  '    default:',
  '      log.push(kind);',
  '  }',
  '}',
  ''
].join('\n');
const switchSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/switch-order.ts',
  sourceText: switchSource
}), { generatedAt: 211 });
const networkRegion = switchSidecar.ownershipRegions
  .find((region) => region.symbolName === 'loadByKind:effect:network#1');
const defaultMutationRegion = switchSidecar.ownershipRegions
  .find((region) => region.symbolName === 'loadByKind:mutation:mutating-call#1');
assert.ok(networkRegion);
assert.ok(defaultMutationRegion);
assert.equal(sourceTextForSpan(switchSource, networkRegion.sourceSpan), 'fetch(api)');
assert.equal(networkRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].switchText, 'switch (kind)');
assert.equal(networkRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].caseText, 'case "remote":');
assert.equal(networkRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].caseKind, 'case');
assert.equal(defaultMutationRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].caseText, 'default:');
assert.equal(defaultMutationRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].caseKind, 'default');

const workerSource = switchSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })');
const headSource = switchSource.replace('case "remote":', 'case "online":');
const switchScript = createSemanticEditScript({
  id: 'semantic_switch_case_runtime_order_blocked',
  language: 'typescript',
  sourcePath: 'src/switch-order.ts',
  baseSourceText: switchSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 212
});
assert.equal(switchScript.admission.status, 'conflict');
const switchOperation = switchScript.operations
  .find((operation) => operation.anchor.symbolName === 'loadByKind:effect:network#1');
assert.ok(switchOperation);
assert.equal(switchOperation.status, 'conflict');
assert.equal(switchOperation.reasonCodes.includes('head-runtime-order-evidence-changed-since-base'), true);
assert.equal(switchOperation.reasonCodes.includes('runtime-order-switch-dispatch-merge-requires-case-selection-evidence'), true);
assert.equal(switchOperation.reasonCodes.includes('runtime-order-switch-case-merge-requires-case-arm-evidence'), true);

const switchMerge = safeMergeJsTsSource({
  id: 'semantic_switch_case_safe_merge_blocked',
  language: 'typescript',
  sourcePath: 'src/switch-order.ts',
  baseSourceText: switchSource,
  workerSourceText: workerSource,
  headSourceText: headSource
});
assert.equal(switchMerge.status, 'blocked');
assert.equal(switchMerge.mergedSourceText, undefined);

const fallthroughSource = [
  'export function fallthroughKind(kind, api, log) {',
  '  switch (kind) {',
  '    case "remote":',
  '      fetch(api);',
  '    case "local":',
  '      log.push(kind);',
  '      break;',
  '  }',
  '}',
  ''
].join('\n');
const fallthroughSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/switch-fallthrough.ts',
  sourceText: fallthroughSource
}), { generatedAt: 213 });
const fallthroughMutationRegion = fallthroughSidecar.ownershipRegions
  .find((region) => region.symbolName === 'fallthroughKind:mutation:mutating-call#1');
assert.ok(fallthroughMutationRegion);
assert.equal(fallthroughMutationRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].caseText, 'case "local":');
assert.equal(fallthroughMutationRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].previousCaseText, 'case "remote":');
assert.equal(fallthroughMutationRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].fallthroughFromPrevious, true);

const fallthroughWorkerSource = fallthroughSource.replace('log.push(kind);', 'log.push(String(kind));');
const fallthroughHeadSource = fallthroughSource.replace('      fetch(api);', '      fetch(api);\n      break;');
const fallthroughHeadSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/switch-fallthrough.ts',
  sourceText: fallthroughHeadSource
}), { generatedAt: 214 });
const fallthroughHeadMutationRegion = fallthroughHeadSidecar.ownershipRegions
  .find((region) => region.symbolName === 'fallthroughKind:mutation:mutating-call#1');
assert.ok(fallthroughHeadMutationRegion);
assert.equal(fallthroughHeadMutationRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].previousCaseCompletionKind, 'break');
assert.equal(fallthroughHeadMutationRegion.metadata.runtimeOrderEvidence.switchDispatchOrder[0].fallthroughFromPrevious, undefined);
const fallthroughScript = createSemanticEditScript({
  id: 'semantic_switch_fallthrough_completion_blocked',
  language: 'typescript',
  sourcePath: 'src/switch-fallthrough.ts',
  baseSourceText: fallthroughSource,
  workerSourceText: fallthroughWorkerSource,
  headSourceText: fallthroughHeadSource,
  generatedAt: 214
});
const fallthroughOperation = fallthroughScript.operations
  .find((operation) => operation.anchor.symbolName === 'fallthroughKind:mutation:mutating-call#1');
assert.equal(fallthroughScript.admission.status, 'conflict');
assert.equal(fallthroughOperation.status, 'conflict');
assert.equal(fallthroughOperation.reasonCodes.includes('head-runtime-order-evidence-changed-since-base'), true);
assert.equal(fallthroughOperation.reasonCodes.includes('runtime-order-switch-fallthrough-merge-requires-prior-case-completion-evidence'), true);

const baseRecord = runtimeRecordFromProject('switch_base', switchSource);
const workerRecord = runtimeRecordFromProject('switch_worker', workerSource);
const headRecord = runtimeRecordFromProject('switch_head', headSource);
assert.equal(baseRecord.runtimeOrderEvidence.switchDispatchOrder[0].caseText, 'case "remote":');
assert.equal(headRecord.runtimeOrderEvidence.switchDispatchOrder[0].caseText, 'case "online":');
assert.notEqual(baseRecord.signatureHash, headRecord.signatureHash);
const conflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}));
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].details.identityKey, 'runtime-region#src/switch-order.ts#loadByKind#effect#network#1');
assert.equal(conflicts[0].details.reasonCodes.includes('runtime-order-switch-dispatch-merge-requires-case-selection-evidence'), true);
assert.equal(conflicts[0].details.head.reasonCodes.includes('runtime-order-switch-case-merge-requires-case-arm-evidence'), true);
assert.equal(conflicts[0].details.head.runtimeOrderEvidence.switchDispatchOrder[0].caseText, 'case "online":');

function runtimeRecordFromProject(id, sourceText) {
  const result = safeMergeJsTsProject({
    id: `runtime_switch_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/switch-order.ts': sourceText },
    workerFiles: { 'src/switch-order.ts': sourceText },
    headFiles: { 'src/switch-order.ts': sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords
    .find((item) => item.publicContract && item.symbolName === 'loadByKind'
      && item.regionKind === 'effect' && item.runtimeKind === 'network');
  assert.ok(record);
  return record;
}

function runtimeDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { runtimeRegionRecords: [record] },
      summary: { runtimeRegionRecords: 1 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
