import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsProject,
  safeMergeJsTsSource
} from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { runtimeOrderReasonCodes } from '../../src/internal/index-impl/semanticEditRuntimeOrderReasons.js';

const consequentSource = [
  'export function ternaryLoad(api, state) {',
  '  state.ready ? fetch(api) : undefined;',
  '  return state.ready;',
  '}',
  ''
].join('\n');
const consequentSidecar = sidecar(consequentSource, 'src/ternary-effects.ts');
const consequentRegion = consequentSidecar.ownershipRegions.find((region) => region.symbolName === 'ternaryLoad:effect:network#1');
assert.ok(consequentRegion);
assert.equal(sourceTextForSpan(consequentSource, consequentRegion.sourceSpan), 'fetch(api)');
assert.equal(consequentRegion.metadata.runtimeOrderEvidence.sameLineConditionalExpression[0].kind, 'conditional-expression');
assert.equal(consequentRegion.metadata.runtimeOrderEvidence.sameLineConditionalExpression[0].guardText, 'state.ready');
assert.equal(consequentRegion.metadata.runtimeOrderEvidence.sameLineConditionalExpression[0].branch, 'consequent');

const alternateSource = consequentSource.replace('state.ready ? fetch(api) : undefined', 'state.ready ? undefined : fetch(api)');
const alternateRegion = sidecar(alternateSource, 'src/ternary-effects.ts').ownershipRegions
  .find((region) => region.symbolName === 'ternaryLoad:effect:network#1');
assert.ok(alternateRegion);
assert.equal(alternateRegion.metadata.runtimeOrderEvidence.sameLineConditionalExpression[0].branch, 'alternate');
assert.equal(alternateRegion.metadata.runtimeOrderEvidence.sameLineConditionalExpression[0].guardText, 'state.ready');

const guardNoiseSource = consequentSource
  .replace('state.ready ? fetch(api) : undefined', 'state.lookup?.(api); const label = "a ? b : c"; state.value ?? true; state.ready ? fetch(api) : undefined');
const guardNoiseRegion = sidecar(guardNoiseSource, 'src/ternary-noise.ts').ownershipRegions
  .find((region) => region.symbolName === 'ternaryLoad:effect:network#1');
assert.ok(guardNoiseRegion);
assert.equal(guardNoiseRegion.metadata.runtimeOrderEvidence.sameLineConditionalExpression[0].guardText, 'state.ready');

const workerSource = consequentSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })');
const headSource = consequentSource.replace('state.ready ? fetch(api) : undefined', 'state.enabled ? fetch(api) : undefined');
const script = createSemanticEditScript({
  id: 'semantic_conditional_effect_order_blocked',
  language: 'typescript',
  sourcePath: 'src/ternary-effects.ts',
  baseSourceText: consequentSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 211
});
assert.equal(script.admission.status, 'conflict');
const operation = script.operations.find((item) => item.anchor.symbolName === 'ternaryLoad:effect:network#1');
assert.ok(operation);
assert.equal(operation.reasonCodes.includes('head-runtime-order-evidence-changed-since-base'), true);
assert.equal(operation.reasonCodes.includes('runtime-order-conditional-expression-merge-requires-branch-selection-evidence'), true);
const merge = safeMergeJsTsSource({
  id: 'semantic_conditional_effect_safe_merge_blocked',
  language: 'typescript',
  sourcePath: 'src/ternary-effects.ts',
  baseSourceText: consequentSource,
  workerSourceText: workerSource,
  headSourceText: headSource
});
assert.equal(merge.status, 'blocked');
assert.equal(merge.mergedSourceText, undefined);

const baseRecord = runtimeRecordFromSource('conditional_base', consequentSource);
const workerRecord = runtimeRecordFromSource('conditional_worker', workerSource);
const headRecord = runtimeRecordFromSource('conditional_head', headSource);
assert.equal(baseRecord.runtimeOrderEvidence.sameLineConditionalExpression[0].guardText, 'state.ready');
assert.equal(headRecord.runtimeOrderEvidence.sameLineConditionalExpression[0].guardText, 'state.enabled');
assert.notEqual(baseRecord.signatureHash, headRecord.signatureHash);
assert.equal(runtimeOrderReasonCodes({ region: headRecord }).includes('runtime-order-conditional-expression-merge-requires-branch-selection-evidence'), true);
const conflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}));
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].details.identityKey, 'runtime-region#src/ternary-effects.ts#ternaryLoad#effect#network#1');
assert.equal(conflicts[0].details.head.runtimeOrderEvidence.sameLineConditionalExpression[0].guardText, 'state.enabled');

function sidecar(sourceText, sourcePath) {
  return createSemanticImportSidecar(importNativeSource({ language: 'typescript', sourcePath, sourceText }), { generatedAt: 211 });
}

function runtimeDelta(stages) {
  return { stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, { projectSymbolGraph: { runtimeRegionRecords: [record] }, summary: { runtimeRegionRecords: 1 } }])), summary: { stages: Object.keys(stages).length } };
}

function runtimeRecordFromSource(id, sourceText) {
  const result = safeMergeJsTsProject({
    id: `runtime_region_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/ternary-effects.ts': sourceText },
    workerFiles: { 'src/ternary-effects.ts': sourceText },
    headFiles: { 'src/ternary-effects.ts': sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((item) => item.publicContract
    && item.symbolName === 'ternaryLoad' && item.regionKind === 'effect' && item.runtimeKind === 'network');
  assert.ok(record);
  return record;
}

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
