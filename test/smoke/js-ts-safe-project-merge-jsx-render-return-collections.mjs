import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

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
