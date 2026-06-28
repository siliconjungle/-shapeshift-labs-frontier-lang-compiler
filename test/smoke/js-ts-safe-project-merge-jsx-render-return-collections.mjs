import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { jsxRenderReturnCollectionDelta } from '../../src/js-ts-safe-project-merge-jsx-render-collection-proof.js';
import { jsxRenderRiskDelta } from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

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

function sourceBoundCollectionProof(identityKey, records, itemOrigins) {
  const expected = jsxRenderReturnCollectionDelta({
    identityKey,
    baseRecord: records.base,
    workerRecord: records.worker,
    headRecord: records.head,
    outputRecord: records.output
  });
  return {
    schema: 'frontier.lang.jsxRenderReturnCollectionProof.v1',
    kind: 'frontier.lang.jsxRenderReturnCollectionProof',
    status: 'passed',
    sourcePath: expected.sourcePath,
    identityKey,
    baseSourceHash: expected.baseSourceHash,
    workerSourceHash: expected.workerSourceHash,
    headSourceHash: expected.headSourceHash,
    outputSourceHash: expected.outputSourceHash,
    publicOwnerName: expected.publicOwnerName,
    tagName: expected.tagName,
    tagKey: expected.tagKey,
    returnOrdinal: expected.returnOrdinal,
    returnKind: expected.returnKind,
    collectionKind: expected.collectionKind,
    items: itemOrigins.map((origin, index) => ({
      ordinal: index + 1,
      origin,
      itemHash: expected[origin].itemHashes[index],
      outputItemHash: expected.output.itemHashes[index]
    })),
    outputKeyedListHash: expected.output.keyedListHash,
    collectionItemPreservationHash: expected.collectionItemPreservationHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    collectionItemPreservationClaim: true,
    claimScope: 'static-render-return-collection-item-preservation-only'
  };
}

function collectionRisk(stage, itemHashes) {
  const itemRecords = itemHashes.map((itemHash, index) => ({
    ordinal: index + 1,
    proofStatus: 'static-render-return-collection-item-evidence',
    expressionText: `<li key="${index === 0 ? 'a' : 'b'}">${itemHash}</li>`,
    expressionHash: `expression:${itemHash}`,
    keyPropText: `key="${index === 0 ? 'a' : 'b'}"`,
    keyValue: index === 0 ? 'a' : 'b',
    keyStatic: true,
    signatureHash: itemHash
  }));
  const keyedListRecord = {
    proofStatus: 'static-render-return-keyed-list-evidence',
    reasonCode: 'jsx-render-return-keyed-list-static-evidence',
    claimScope: 'static-list-key-identity-only',
    renderEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    keyCount: itemRecords.length,
    keyRecords: itemRecords.map((item) => ({
      ordinal: item.ordinal,
      keyPropText: item.keyPropText,
      keyValue: item.keyValue,
      keyStatic: true
    })),
    keyValues: itemRecords.map((item) => item.keyValue),
    signatureHash: `keyed-list:${stage}:${itemHashes.join('|')}`
  };
  const collectionRecord = {
    proofStatus: 'static-render-return-array-evidence',
    reasonCode: 'jsx-render-return-array-static-evidence',
    collectionKind: 'array-literal',
    itemExpressionTexts: itemRecords.map((item) => item.expressionText),
    itemRecords,
    itemCount: itemRecords.length,
    keyedListRecord,
    signatureHash: `collection:${stage}:${itemHashes.join('|')}`
  };
  const renderReturnRecord = {
    ordinal: 1,
    proofStatus: 'static-render-return-evidence',
    returnKind: 'return-statement',
    branchControlKind: 'return-statement',
    expressionText: `[${collectionRecord.itemExpressionTexts.join(', ')}]`,
    expressionHash: `collection-expression:${stage}:${itemHashes.join('|')}`,
    collectionRecord,
    signatureHash: `render-return:${stage}:${itemHashes.join('|')}`
  };
  return {
    id: `jsx_render_collection_${stage}`,
    sourcePath: 'src/list.tsx',
    tagName: 'li',
    tagKey: 'li#1',
    publicContract: true,
    publicOwnerName: 'ListView',
    renderRiskKinds: ['render-return-boundary'],
    renderRiskReasonCodes: ['jsx-render-return-static-evidence', 'jsx-render-return-array-static-evidence', 'jsx-render-return-keyed-list-static-evidence'],
    renderReturnRecords: [renderReturnRecord],
    renderReturnCount: 1,
    renderReturnSignatureHash: `render-returns:${stage}:${itemHashes.join('|')}`,
    renderRiskSignatureHash: `render-risk:collection:${stage}:${itemHashes.join('|')}`,
    sourceHash: `source:${stage}`
  };
}

function withDynamicEventHandlerFactoryRisk(record, stage) {
  const propName = 'onClick';
  const expressionText = '{makeHandler(theme)}';
  return {
    ...record,
    renderRiskKinds: [...record.renderRiskKinds, 'event-handler-prop-boundary'],
    renderRiskReasonCodes: [
      ...record.renderRiskReasonCodes,
      'jsx-render-event-handler-prop-unsupported',
      'jsx-render-event-handler-prop-call-expression-unsupported'
    ],
    eventHandlerPropNames: [propName],
    eventHandlerPropRecords: [{
      propName,
      ordinal: 1,
      propKind: 'named',
      proofStatus: 'dynamic-event-handler-unsupported',
      dynamicExpressionText: expressionText,
      dynamicExpressionKind: 'call-expression',
      dynamicBlockerReasonCode: 'jsx-render-event-handler-prop-call-expression-unsupported',
      expressionHash: `event-handler-expression:${stage}:${expressionText}`,
      signatureHash: `event-handler:${stage}:${propName}:${expressionText}`
    }],
    eventHandlerPropCount: 1,
    eventHandlerSignatureHash: `event-handlers:${stage}:${propName}:${expressionText}`,
    renderRiskSignatureHash: `${record.renderRiskSignatureHash}:event-handler-factory`
  };
}
