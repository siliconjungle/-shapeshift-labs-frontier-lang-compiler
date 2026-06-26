import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const callArgumentEvidenceReasonCodes = [
  'callsite-argument-merge-requires-callee-signature-evidence',
  'callsite-argument-merge-requires-argument-effect-evidence',
  'callsite-argument-merge-requires-argument-order-evidence'
];

const baseSource = [
  'export function helper(value) { return value; }',
  'export function run(value) { return helper(value); }',
  ''
].join('\n');
const workerSource = [
  'export function helper(value) { return value; }',
  'export function run(value) { return helper(value, { trace: true }); }',
  ''
].join('\n');

const workerImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  sourceText: workerSource
});
const workerSidecar = createSemanticImportSidecar(workerImport, { generatedAt: 200 });
const callRegion = workerSidecar.ownershipRegions.find((region) => region.regionKind === 'call'
  && region.symbolName === 'run->helper');
assert.ok(callRegion);
assert.equal(sourceTextForSpan(workerSource, callRegion.sourceSpan), 'helper(value, { trace: true })');
assert.equal(callRegion.precision, 'callsite');
assert.equal(workerSidecar.regionTaxonomy.presentKinds.includes('call'), true);
assert.equal(workerSidecar.patchHints.some((hint) => hint.ownershipKey === callRegion.key
  && hint.operation === 'replace-callsite'), true);

const script = createSemanticEditScript({
  id: 'semantic_callsite_replace',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  generatedAt: 201
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.summary.byKind.replaceCallsite, 1);
assert.equal(script.operations.some((operation) => operation.anchor.regionKind === 'body'
  && operation.anchor.symbolName === 'run'), false);
const callOperation = script.operations.find((operation) => operation.kind === 'replaceCallsite');
assert.ok(callOperation);
assert.equal(callOperation.anchor.symbolName, 'run->helper');
assert.equal(sourceTextForSpan(workerSource, callOperation.spans.worker), 'helper(value, { trace: true })');

const projection = projectSemanticEditScriptToSource({
  id: 'semantic_callsite_projection',
  script,
  workerSourceText: workerSource,
  headSourceText: baseSource
});
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, workerSource);
assert.equal(projection.edits.length, 1);
assert.equal(projection.edits[0].kind, 'replaceCallsite');
assert.equal(projection.edits[0].replacementText, 'helper(value, { trace: true })');
assert.equal(projection.edits[0].deletedBytes, 'helper(value)'.length);

const callArgumentBaseSource = [
  'export function helper(...args) { return args; }',
  'export function trace() { return true; }',
  'export function cache() { return true; }',
  'export function run(value) { return helper(value); }',
  ''
].join('\n');
const callArgumentWorkerSource = callArgumentBaseSource.replace('return helper(value);', 'return helper(value, trace());');
const callArgumentHeadSource = callArgumentBaseSource.replace('return helper(value);', 'return helper(value, cache());');
const callArgumentScript = createSemanticEditScript({
  id: 'semantic_callsite_stable_callee_argument_order_blocked',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: callArgumentBaseSource,
  workerSourceText: callArgumentWorkerSource,
  headSourceText: callArgumentHeadSource,
  generatedAt: 202
});
assert.equal(callArgumentScript.admission.status, 'conflict');
const blockedCallOperation = callArgumentScript.operations.find((operation) => operation.kind === 'replaceCallsite'
  && operation.anchor.symbolName === 'run->helper');
assert.ok(blockedCallOperation);
assert.equal(blockedCallOperation.status, 'conflict');
for (const reasonCode of callArgumentEvidenceReasonCodes) {
  assert.equal(blockedCallOperation.reasonCodes.includes(reasonCode), true, `${reasonCode}: blocked operation`);
  assert.equal(callArgumentScript.admission.reasonCodes.includes(reasonCode), true, `${reasonCode}: admission`);
}

const callArgumentProjection = projectSemanticEditScriptToSource({
  id: 'semantic_callsite_stable_callee_argument_order_projection',
  script: callArgumentScript,
  workerSourceText: callArgumentWorkerSource,
  headSourceText: callArgumentHeadSource
});
assert.equal(callArgumentProjection.status, 'blocked');
assert.equal(callArgumentProjection.sourceText, undefined);
assert.equal(callArgumentProjection.admission.reasonCodes.some((reason) => reason.startsWith(`operation-not-portable:${blockedCallOperation.id}`)), true);

const callArgumentReplay = replaySemanticEditProjection({
  id: 'semantic_callsite_stable_callee_argument_order_replay',
  projection: callArgumentProjection,
  currentSourceText: callArgumentHeadSource,
  currentSourcePath: 'src/calls.ts',
  language: 'typescript'
});
assert.equal(callArgumentReplay.status, 'blocked');
assert.equal(callArgumentReplay.admission.action, 'block');
assert.equal(callArgumentReplay.outputSourceText, undefined);

const pureCallArgumentHeadSource = callArgumentBaseSource.replace('return helper(value);', 'return helper(value, { cache: true });');
const pureCallArgumentWorkerSource = callArgumentBaseSource.replace('return helper(value);', 'return helper(value, { trace: true });');
const pureCallArgumentExpectedSource = callArgumentBaseSource.replace('return helper(value);', 'return helper(value, { trace: true }, { cache: true });');
const pureCallArgumentScript = createSemanticEditScript({
  id: 'semantic_callsite_rest_callee_pure_argument_append',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: callArgumentBaseSource,
  workerSourceText: pureCallArgumentWorkerSource,
  headSourceText: pureCallArgumentHeadSource,
  generatedAt: 203
});
assert.equal(pureCallArgumentScript.admission.status, 'auto-merge-candidate');
const pureCallOperation = pureCallArgumentScript.operations.find((operation) => operation.kind === 'replaceCallsite'
  && operation.anchor.symbolName === 'run->helper');
assert.ok(pureCallOperation);
assert.equal(pureCallOperation.status, 'portable');
assert.equal(pureCallOperation.metadata.sourceBackprojection.mode, 'same-language-callsite-argument-append');
assert.equal(pureCallOperation.reasonCodes.includes('callsite-argument-append-rest-callee-signature-evidence'), true);
assert.equal(pureCallOperation.reasonCodes.includes('callsite-argument-append-pure-argument-effect-evidence'), true);
assert.equal(pureCallOperation.reasonCodes.includes('callsite-argument-append-order-evidence'), true);

const pureCallArgumentProjection = projectSemanticEditScriptToSource({
  id: 'semantic_callsite_rest_callee_pure_argument_append_projection',
  script: pureCallArgumentScript,
  workerSourceText: pureCallArgumentWorkerSource,
  headSourceText: pureCallArgumentHeadSource
});
assert.equal(pureCallArgumentProjection.status, 'projected');
assert.equal(pureCallArgumentProjection.sourceText, pureCallArgumentExpectedSource);
assert.equal(pureCallArgumentProjection.edits[0].sourceRangeKind, 'same-language-callsite-argument-append');

const staleHeadSpanProjection = projectSemanticEditScriptToSource({
  id: 'semantic_callsite_rest_callee_pure_argument_append_stale_head_span_projection',
  script: pureCallArgumentScript,
  workerSourceText: pureCallArgumentWorkerSource,
  headSourceText: `// shifted by current head\n${pureCallArgumentHeadSource}`
});
assert.equal(staleHeadSpanProjection.status, 'blocked');
assert.equal(staleHeadSpanProjection.admission.reasonCodes.some((reason) => reason.startsWith('head-span-hash-mismatch:')), true);

const pureCallArgumentReplay = replaySemanticEditProjection({
  id: 'semantic_callsite_rest_callee_pure_argument_append_replay',
  projection: pureCallArgumentProjection,
  currentSourceText: pureCallArgumentHeadSource,
  currentSourcePath: 'src/calls.ts',
  language: 'typescript'
});
assert.equal(pureCallArgumentReplay.status, 'accepted-clean');
assert.equal(pureCallArgumentReplay.outputSourceText, pureCallArgumentExpectedSource);

const shiftedPureCallArgumentReplay = replaySemanticEditProjection({
  id: 'semantic_callsite_rest_callee_pure_argument_append_shifted_replay',
  projection: pureCallArgumentProjection,
  currentSourceText: `// shifted by replay current\n${pureCallArgumentHeadSource}`,
  currentSourcePath: 'src/calls.ts',
  language: 'typescript'
});
assert.equal(shiftedPureCallArgumentReplay.status, 'accepted-clean');
assert.equal(shiftedPureCallArgumentReplay.outputSourceText, `// shifted by replay current\n${pureCallArgumentExpectedSource}`);

const pureCallArgumentMerge = safeMergeJsTsSource({
  id: 'safe_merge_callsite_rest_callee_pure_argument_append',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: callArgumentBaseSource,
  workerSourceText: pureCallArgumentWorkerSource,
  headSourceText: pureCallArgumentHeadSource
});
assert.equal(pureCallArgumentMerge.status, 'merged');
assert.equal(pureCallArgumentMerge.mergedSourceText, pureCallArgumentExpectedSource);
assert.equal(pureCallArgumentMerge.semanticArtifacts.status, 'verified');

const commentedBaseArgumentSource = callArgumentBaseSource.replace('return helper(value);', 'return helper(value /* kept, comma */);');
const commentedBaseArgumentExpectedSource = commentedBaseArgumentSource.replace(
  'return helper(value /* kept, comma */);',
  'return helper(value /* kept, comma */, { trace: true }, { cache: true });'
);
const commentedBaseArgumentMerge = safeMergeJsTsSource({
  id: 'safe_merge_callsite_commented_base_argument_append',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: commentedBaseArgumentSource,
  workerSourceText: commentedBaseArgumentSource.replace('return helper(value /* kept, comma */);', 'return helper(value /* kept, comma */, { trace: true });'),
  headSourceText: commentedBaseArgumentSource.replace('return helper(value /* kept, comma */);', 'return helper(value /* kept, comma */, { cache: true });')
});
assert.equal(commentedBaseArgumentMerge.status, 'merged');
assert.equal(commentedBaseArgumentMerge.mergedSourceText, commentedBaseArgumentExpectedSource);

const callArgumentMerge = safeMergeJsTsSource({
  id: 'safe_merge_callsite_stable_callee_argument_order_blocked',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: callArgumentBaseSource,
  workerSourceText: callArgumentWorkerSource,
  headSourceText: callArgumentHeadSource
});
assert.equal(callArgumentMerge.status, 'blocked');
assert.equal(callArgumentMerge.mergedSourceText, undefined);
for (const reasonCode of callArgumentEvidenceReasonCodes) {
  assert.equal(callArgumentMerge.admission.reasonCodes.includes(reasonCode), true, `${reasonCode}: safe merge`);
}

const sameArgumentBaseSource = [
  'export function helper(value, mode) { return mode; }',
  'export function run(value, options) { return helper(value, options.mode); }',
  ''
].join('\n');
const sameArgumentMerge = safeMergeJsTsSource({
  id: 'safe_merge_callsite_same_argument_blocked',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: sameArgumentBaseSource,
  workerSourceText: sameArgumentBaseSource.replace('options.mode', 'options.workerMode'),
  headSourceText: sameArgumentBaseSource.replace('options.mode', 'options.headMode')
});
assert.equal(sameArgumentMerge.status, 'blocked');
assert.equal(sameArgumentMerge.mergedSourceText, undefined);
assert.equal(sameArgumentMerge.admission.reasonCodes.includes('callsite-argument-merge-requires-argument-order-evidence'), true);

const nonRestCalleeBaseSource = callArgumentBaseSource.replace('helper(...args)', 'helper(value)');
const nonRestCalleeMerge = safeMergeJsTsSource({
  id: 'safe_merge_callsite_non_rest_callee_argument_append_blocked',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: nonRestCalleeBaseSource,
  workerSourceText: nonRestCalleeBaseSource.replace('return helper(value);', 'return helper(value, { trace: true });'),
  headSourceText: nonRestCalleeBaseSource.replace('return helper(value);', 'return helper(value, { cache: true });')
});
assert.equal(nonRestCalleeMerge.status, 'blocked');
assert.equal(nonRestCalleeMerge.admission.reasonCodes.includes('callsite-argument-merge-requires-callee-signature-evidence'), true);

const optionalCalleeBaseSource = callArgumentBaseSource.replace('return helper(value);', 'return helper?.(value);');
const methodCalleeBaseSource = [
  'export function helper(...args) { return args; }',
  'export const obj = { helper(value) { return value; } };',
  'export function run(value) { return obj.helper(value); }',
  ''
].join('\n');
const commentedSignatureBaseSource = [
  '/* function helper(...args) { return args; } */',
  'export function helper(value) { return value; }',
  'export function run(value) { return helper(value); }',
  ''
].join('\n');
const nestedSignatureBaseSource = [
  'export function outer() { function helper(...args) { return args; } }',
  'export function helper(value) { return value; }',
  'export function run(value) { return helper(value); }',
  ''
].join('\n');
for (const testCase of [
  { id: 'safe_merge_callsite_duplicate_object_literal_whitespace_blocked', base: callArgumentBaseSource, from: 'return helper(value);', worker: 'return helper(value, { trace: true });', head: 'return helper(value, {trace:true});' },
  { id: 'safe_merge_callsite_object_spread_argument_blocked', base: callArgumentBaseSource, from: 'return helper(value);', worker: 'return helper(value, { ...traceOptions });', head: 'return helper(value, { cache: true });' },
  { id: 'safe_merge_callsite_nested_call_argument_blocked', base: callArgumentBaseSource, from: 'return helper(value);', worker: 'return helper(value, wrap({ trace: true }));', head: 'return helper(value, { cache: true });' },
  { id: 'safe_merge_callsite_optional_callee_blocked', base: optionalCalleeBaseSource, from: 'return helper?.(value);', worker: 'return helper?.(value, { trace: true });', head: 'return helper?.(value, { cache: true });' },
  { id: 'safe_merge_callsite_method_callee_blocked', base: methodCalleeBaseSource, from: 'return obj.helper(value);', worker: 'return obj.helper(value, { trace: true });', head: 'return obj.helper(value, { cache: true });' },
  { id: 'safe_merge_callsite_commented_signature_false_positive_blocked', base: commentedSignatureBaseSource, from: 'return helper(value);', worker: 'return helper(value, { trace: true });', head: 'return helper(value, { cache: true });', reasonCode: 'callsite-argument-merge-requires-callee-signature-evidence' },
  { id: 'safe_merge_callsite_nested_signature_false_positive_blocked', base: nestedSignatureBaseSource, from: 'return helper(value);', worker: 'return helper(value, { trace: true });', head: 'return helper(value, { cache: true });', reasonCode: 'callsite-argument-merge-requires-callee-signature-evidence' }
]) {
  const merge = safeMergeJsTsSource({ id: testCase.id, language: 'typescript', sourcePath: 'src/calls.ts', baseSourceText: testCase.base, workerSourceText: testCase.base.replace(testCase.from, testCase.worker), headSourceText: testCase.base.replace(testCase.from, testCase.head) });
  assert.equal(merge.status, 'blocked', testCase.id);
  assert.equal(merge.mergedSourceText, undefined, testCase.id);
  if (testCase.reasonCode) assert.equal(merge.admission.reasonCodes.includes(testCase.reasonCode), true, testCase.id);
}

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
