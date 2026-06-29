import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { jsxRenderRiskDelta } from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';
import { collectionRisk, sourceBoundCollectionProof, withDynamicEventHandlerFactoryRisk } from './jsx-render-return-collection-fixtures.mjs';

const arrayReturnSource = [
  'export function ListView() {',
  '  return [<li key="a">A</li>, <li key="b">B</li>];',
  '}',
  ''
].join('\n');
const arrayReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_array',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/list.tsx': arrayReturnSource },
  workerFiles: { 'src/list.tsx': arrayReturnSource },
  headFiles: { 'src/list.tsx': arrayReturnSource },
  outputDiagnostics: []
});
const arrayItem = arrayReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'li');
assert.equal(arrayItem.renderRiskReasonCodes.includes('jsx-render-return-array-static-evidence'), true);
assert.equal(arrayItem.renderReturnCount, 1);
assert.equal(arrayItem.renderReturnRecords[0].collectionRecord.collectionKind, 'array-literal');
assert.equal(arrayItem.renderReturnRecords[0].collectionRecord.itemCount, 2);
assert.deepEqual(arrayItem.renderReturnRecords[0].collectionRecord.itemExpressionTexts, ['<li key="a">A</li>', '<li key="b">B</li>']);
assert.equal(arrayItem.renderReturnRecords[0].collectionRecord.itemRecords[0].ordinal, 1);
assert.equal(typeof arrayItem.renderReturnRecords[0].collectionRecord.itemRecords[1].signatureHash, 'string');
assert.equal(arrayItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-static-evidence'), true);
assert.deepEqual(arrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.keyValues, ['a', 'b']);
assert.equal(arrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.renderEquivalenceClaim, false);

const staticMapReturnSource = [
  'export function StaticMapList() {',
  '  const rows = [',
  '    { id: "a", label: "A" },',
  '    { id: "b", label: "B" }',
  '  ];',
  '  return rows.map((row) => <li key={row.id}>{row.label}</li>);',
  '}',
  ''
].join('\n');
const staticMapReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_static_const_array_map',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/static-map-list.tsx': staticMapReturnSource },
  workerFiles: { 'src/static-map-list.tsx': staticMapReturnSource },
  headFiles: { 'src/static-map-list.tsx': staticMapReturnSource },
  outputDiagnostics: []
});
const staticMapItem = staticMapReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'li');
assert.equal(staticMapItem.renderRiskReasonCodes.includes('jsx-render-return-static-const-array-map-evidence'), true);
assert.equal(staticMapItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-static-evidence'), true);
assert.equal(staticMapItem.renderReturnCount, 1);
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.collectionKind, 'static-const-array-map');
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.sourceArrayName, 'rows');
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.sourceArrayItemCount, 2);
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.mapParameterName, 'row');
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.callbackExpressionText, '<li key={row.id}>{row.label}</li>');
assert.deepEqual(staticMapItem.renderReturnRecords[0].collectionRecord.sourceItemExpressionTexts, ['{ id: "a", label: "A" }', '{ id: "b", label: "B" }']);
assert.deepEqual(staticMapItem.renderReturnRecords[0].collectionRecord.keyedListRecord.keyValues, ['a', 'b']);
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.itemRecords[0].keySourcePropName, 'id');
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.itemRecords[1].keyValue, 'b');
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.renderEquivalenceClaim, false);
assert.equal(staticMapItem.renderReturnRecords[0].collectionRecord.runtimeEquivalenceClaim, false);

const fragmentReturnSource = [
  'export function FragmentList() {',
  '  return <>',
  '    <li key="a">A</li>',
  '    <li key="b">B</li>',
  '  </>;',
  '}',
  ''
].join('\n');
const fragmentReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_fragment',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/fragment-list.tsx': fragmentReturnSource },
  workerFiles: { 'src/fragment-list.tsx': fragmentReturnSource },
  headFiles: { 'src/fragment-list.tsx': fragmentReturnSource },
  outputDiagnostics: []
});
const fragmentItem = fragmentReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'li');
assert.equal(fragmentItem.renderRiskReasonCodes.includes('jsx-render-return-fragment-static-evidence'), true);
assert.equal(fragmentItem.renderReturnRecords[0].collectionRecord.proofStatus, 'static-render-return-fragment-evidence');
assert.equal(fragmentItem.renderReturnRecords[0].collectionRecord.collectionKind, 'fragment-shorthand');
assert.equal(fragmentItem.renderReturnRecords[0].collectionRecord.itemCount, 2);
assert.deepEqual(fragmentItem.renderReturnRecords[0].collectionRecord.itemExpressionTexts, ['<li key="a">A</li>', '<li key="b">B</li>']);
assert.equal(typeof fragmentItem.renderReturnRecords[0].collectionRecord.itemRecords[0].signatureHash, 'string');

const nestedFragmentReturnSource = [
  'export function NestedFragmentList() {',
  '  return <>',
  '    <>',
  '      <li key="a">A</li>',
  '    </>',
  '    <li key="b">B</li>',
  '  </>;',
  '}',
  ''
].join('\n');
const nestedFragmentReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_nested_fragment',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/nested-fragment-list.tsx': nestedFragmentReturnSource },
  workerFiles: { 'src/nested-fragment-list.tsx': nestedFragmentReturnSource },
  headFiles: { 'src/nested-fragment-list.tsx': nestedFragmentReturnSource },
  outputDiagnostics: []
});
const nestedFragmentItem = nestedFragmentReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'li');
assert.equal(nestedFragmentItem.renderRiskReasonCodes.includes('jsx-render-return-fragment-static-evidence'), false);
assert.equal(nestedFragmentItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-static-evidence'), false);
assert.equal(nestedFragmentItem.renderReturnRecords[0].collectionRecord, undefined);

const missingKeyArrayReturnSource = [
  'export function MissingKeyList() {',
  '  return [<li>A</li>, <li>B</li>];',
  '}',
  ''
].join('\n');
const missingKeyArrayReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_missing_key_array',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/missing-key-list.tsx': missingKeyArrayReturnSource },
  workerFiles: { 'src/missing-key-list.tsx': missingKeyArrayReturnSource },
  headFiles: { 'src/missing-key-list.tsx': missingKeyArrayReturnSource },
  outputDiagnostics: []
});
const missingKeyArrayItem = missingKeyArrayReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'li');
assert.equal(missingKeyArrayItem.renderRiskReasonCodes.includes('jsx-render-return-array-static-evidence'), true);
assert.equal(missingKeyArrayItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-static-evidence'), false);
assert.equal(missingKeyArrayItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-missing-keys-unsupported'), true);
assert.equal(missingKeyArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.proofStatus, 'static-render-return-keyed-list-missing-key-unsupported');
assert.deepEqual(missingKeyArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.missingKeyOrdinals, [1, 2]);
assert.equal(missingKeyArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.renderEquivalenceClaim, false);

const ambiguousKeyArrayReturnSource = [
  'export function AmbiguousKeyList({ activeId }) {',
  '  return [<li key={activeId}>A</li>, <li key="b">B</li>];',
  '}',
  ''
].join('\n');
const ambiguousKeyArrayReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_ambiguous_key_array',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/ambiguous-key-list.tsx': ambiguousKeyArrayReturnSource },
  workerFiles: { 'src/ambiguous-key-list.tsx': ambiguousKeyArrayReturnSource },
  headFiles: { 'src/ambiguous-key-list.tsx': ambiguousKeyArrayReturnSource },
  outputDiagnostics: []
});
const ambiguousKeyArrayItem = ambiguousKeyArrayReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'li');
assert.equal(ambiguousKeyArrayItem.renderRiskReasonCodes.includes('jsx-render-return-array-static-evidence'), true);
assert.equal(ambiguousKeyArrayItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-static-evidence'), false);
assert.equal(ambiguousKeyArrayItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-ambiguous-keys-unsupported'), true);
assert.equal(ambiguousKeyArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.proofStatus, 'static-render-return-keyed-list-ambiguous-key-unsupported');
assert.deepEqual(ambiguousKeyArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.ambiguousKeyOrdinals, [1]);
assert.equal(ambiguousKeyArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.renderEquivalenceClaim, false);

const conditionalReturnSource = [
  'export function ConditionalList({ ok }) {',
  '  return ok ? [<li key="a">A</li>] : [<li key="b">B</li>];',
  '}',
  ''
].join('\n');
const conditionalReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_conditional_array',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/conditional-list.tsx': conditionalReturnSource },
  workerFiles: { 'src/conditional-list.tsx': conditionalReturnSource },
  headFiles: { 'src/conditional-list.tsx': conditionalReturnSource },
  outputDiagnostics: []
});
const conditionalItem = conditionalReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'li');
assert.equal(conditionalItem.renderRiskReasonCodes.includes('jsx-render-return-conditional-branch-static-evidence'), true);
assert.equal(conditionalItem.renderRiskReasonCodes.includes('jsx-render-return-branch-unsupported'), true);
assert.equal(conditionalItem.renderReturnRecords[0].collectionRecord, undefined);
assert.equal(conditionalItem.renderReturnRecords[0].branchControlKind, 'conditional-expression');

const helperReturnSource = [
  'export function HelperReturnList() {',
  '  function helper() {',
  '    return [<li key="helper">Helper</li>];',
  '  }',
  '  return [<li key="view">View</li>];',
  '}',
  ''
].join('\n');
const helperReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_helper_array',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/helper-return-list.tsx': helperReturnSource },
  workerFiles: { 'src/helper-return-list.tsx': helperReturnSource },
  headFiles: { 'src/helper-return-list.tsx': helperReturnSource },
  outputDiagnostics: []
});
const helperReturnItem = helperReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'li');
assert.equal(helperReturnItem.renderReturnCount, 2);
assert.equal(helperReturnItem.renderRiskReasonCodes.includes('jsx-render-return-branch-unsupported'), true);
assert.deepEqual(
  helperReturnItem.renderReturnRecords.map((record) => record.collectionRecord?.collectionKind),
  ['array-literal', 'array-literal']
);

const collectionProofRecords = {
  base: collectionRisk('base', ['item:a:base', 'item:b:base']),
  worker: collectionRisk('worker', ['item:a:worker', 'item:b:base']),
  head: collectionRisk('head', ['item:a:base', 'item:b:head']),
  output: collectionRisk('output', ['item:a:worker', 'item:b:head'])
};
const collectionProofDelta = jsxRenderRiskDelta(collectionProofRecords);
const collectionMissing = projectGraphDeltaConflicts(collectionProofDelta);
assert.equal(collectionMissing.length, 1);
assert.equal(collectionMissing[0].details.reasonCodes.includes('jsx-render-return-collection-proof-missing'), true);
assert.equal(collectionMissing[0].details.routeId, 'prove-jsx-render-return-collection-item-preservation');
assert.equal(collectionMissing[0].details.jsxRenderReturnCollectionProof.collectionItemPreservationClaim, false);
assert.equal(collectionMissing[0].details.renderEquivalenceClaim, false);
assert.equal(collectionMissing[0].details.runtimeEquivalenceClaim, false);

const collectionProof = sourceBoundCollectionProof(collectionMissing[0].details.identityKey, collectionProofRecords, ['worker', 'head']);
const collectionPassed = projectGraphDeltaConflicts(collectionProofDelta, {
  evidence: [collectionProof]
});
assert.equal(collectionPassed.length, 0);

const staleCollectionProof = projectGraphDeltaConflicts(collectionProofDelta, {
  evidence: [{ ...collectionProof, outputSourceHash: 'stale-output-source' }]
});
assert.equal(staleCollectionProof.length, 1);
assert.equal(staleCollectionProof[0].details.reasonCodes.includes('jsx-render-return-collection-proof-source-hash-mismatch'), true);
assert.equal(staleCollectionProof[0].details.renderEquivalenceClaim, false);

const badItemCollectionProof = projectGraphDeltaConflicts(collectionProofDelta, {
  evidence: [{ ...collectionProof, items: [{ ...collectionProof.items[0], itemHash: 'wrong-item' }, collectionProof.items[1]] }]
});
assert.equal(badItemCollectionProof.length, 1);
assert.equal(badItemCollectionProof[0].details.reasonCodes.includes('jsx-render-return-collection-proof-item-hash-mismatch'), true);

const broadCollectionClaim = projectGraphDeltaConflicts(collectionProofDelta, {
  evidence: [{ ...collectionProof, renderEquivalenceClaim: true }]
});
assert.equal(broadCollectionClaim.length, 1);
assert.equal(broadCollectionClaim[0].details.reasonCodes.includes('jsx-render-return-collection-proof-claim-flags-missing'), true);
assert.equal(broadCollectionClaim[0].details.renderEquivalenceClaim, false);

const dynamicEventHandlerRecords = {
  ...collectionProofRecords,
  worker: withDynamicEventHandlerFactoryRisk(collectionProofRecords.worker, 'worker')
};
const dynamicEventHandlerProof = sourceBoundCollectionProof(collectionMissing[0].details.identityKey, dynamicEventHandlerRecords, ['worker', 'head']);
const dynamicEventHandlerBlocked = projectGraphDeltaConflicts(jsxRenderRiskDelta(dynamicEventHandlerRecords), {
  evidence: [dynamicEventHandlerProof]
});
assert.equal(dynamicEventHandlerBlocked.length, 1);
assert.equal(dynamicEventHandlerBlocked[0].details.reasonCodes.includes('jsx-render-return-collection-proof-non-collection-risk-present'), true);
assert.equal(dynamicEventHandlerBlocked[0].details.reasonCodes.includes('jsx-render-event-handler-prop-call-expression-unsupported'), true);
assert.equal(dynamicEventHandlerBlocked[0].details.jsxRenderReturnCollectionProof.collectionItemPreservationClaim, false);
assert.equal(dynamicEventHandlerBlocked[0].details.runtimeEquivalenceClaim, false);

const duplicateKeyRecords = {
  ...collectionProofRecords,
  output: collectionRisk('output-duplicate-key', ['item:a:worker', 'item:b:head'], { duplicateKeys: true })
};
const duplicateKeyProof = sourceBoundCollectionProof(collectionMissing[0].details.identityKey, duplicateKeyRecords, ['worker', 'head']);
const duplicateKeyBlocked = projectGraphDeltaConflicts(jsxRenderRiskDelta(duplicateKeyRecords), {
  evidence: [duplicateKeyProof]
});
assert.equal(duplicateKeyBlocked.length, 1);
assert.equal(duplicateKeyBlocked[0].details.reasonCodes.includes('jsx-render-return-keyed-list-duplicate-keys-unsupported'), true);
assert.equal(duplicateKeyBlocked[0].details.reasonCodes.includes('jsx-render-return-collection-proof-dynamic-collection-unsupported'), true);
assert.equal(duplicateKeyBlocked[0].details.jsxRenderReturnCollectionProof.collectionItemPreservationClaim, false);
assert.equal(duplicateKeyBlocked[0].details.renderEquivalenceClaim, false);

const missingKeyRecords = {
  ...collectionProofRecords,
  output: collectionRisk('output-missing-key', ['item:a:worker', 'item:b:head'], { missingKeyOrdinals: [2] })
};
const missingKeyProof = sourceBoundCollectionProof(collectionMissing[0].details.identityKey, missingKeyRecords, ['worker', 'head']);
const missingKeyBlocked = projectGraphDeltaConflicts(jsxRenderRiskDelta(missingKeyRecords), {
  evidence: [missingKeyProof]
});
assert.equal(missingKeyBlocked.length, 1);
assert.equal(missingKeyBlocked[0].details.reasonCodes.includes('jsx-render-return-keyed-list-missing-keys-unsupported'), true);
assert.equal(missingKeyBlocked[0].details.reasonCodes.includes('jsx-render-return-collection-proof-dynamic-collection-unsupported'), true);
assert.equal(missingKeyBlocked[0].details.jsxRenderReturnCollectionProof.collectionItemPreservationClaim, false);
assert.equal(missingKeyBlocked[0].details.renderEquivalenceClaim, false);

const ambiguousKeyRecords = {
  ...collectionProofRecords,
  output: collectionRisk('output-ambiguous-key', ['item:a:worker', 'item:b:head'], { ambiguousKeyOrdinals: [1] })
};
const ambiguousKeyProof = sourceBoundCollectionProof(collectionMissing[0].details.identityKey, ambiguousKeyRecords, ['worker', 'head']);
const ambiguousKeyBlocked = projectGraphDeltaConflicts(jsxRenderRiskDelta(ambiguousKeyRecords), {
  evidence: [ambiguousKeyProof]
});
assert.equal(ambiguousKeyBlocked.length, 1);
assert.equal(ambiguousKeyBlocked[0].details.reasonCodes.includes('jsx-render-return-keyed-list-ambiguous-keys-unsupported'), true);
assert.equal(ambiguousKeyBlocked[0].details.reasonCodes.includes('jsx-render-return-collection-proof-dynamic-collection-unsupported'), true);
assert.equal(ambiguousKeyBlocked[0].details.jsxRenderReturnCollectionProof.collectionItemPreservationClaim, false);
assert.equal(ambiguousKeyBlocked[0].details.renderEquivalenceClaim, false);
