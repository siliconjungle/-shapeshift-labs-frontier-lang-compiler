import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const source = [
  'export function DuplicateStaticMapList() {',
  '  const rows = [',
  '    { id: "a", label: "A" },',
  '    { id: "a", label: "A again" }',
  '  ];',
  '  return rows.map((row) => <li key={row.id}>{row.label}</li>);',
  '}',
  ''
].join('\n');
const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_static_const_array_map_duplicate_keys',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/duplicate-static-map-list.tsx': source },
  workerFiles: { 'src/duplicate-static-map-list.tsx': source },
  headFiles: { 'src/duplicate-static-map-list.tsx': source },
  outputDiagnostics: []
});
const item = project.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'li');
assert.equal(item.renderRiskReasonCodes.includes('jsx-render-return-static-const-array-map-evidence'), true);
assert.equal(item.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-static-evidence'), false);
assert.equal(item.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-duplicate-keys-unsupported'), true);
assert.equal(item.renderReturnRecords[0].collectionRecord.keyedListRecord.proofStatus, 'static-render-return-keyed-list-duplicate-key-unsupported');
assert.deepEqual(item.renderReturnRecords[0].collectionRecord.keyedListRecord.duplicateKeyValues, ['a']);
assert.deepEqual(item.renderReturnRecords[0].collectionRecord.keyedListRecord.duplicateKeyOrdinals, [1, 2]);
assert.equal(item.renderReturnRecords[0].collectionRecord.keyedListRecord.renderEquivalenceClaim, false);

const duplicateArraySource = [
  'export function DuplicateArrayList() {',
  '  return [<li key="a">A</li>, <li key="a">A again</li>];',
  '}',
  ''
].join('\n');
const duplicateArrayProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_array_duplicate_keys',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/duplicate-array-list.tsx': duplicateArraySource },
  workerFiles: { 'src/duplicate-array-list.tsx': duplicateArraySource },
  headFiles: { 'src/duplicate-array-list.tsx': duplicateArraySource },
  outputDiagnostics: []
});
const duplicateArrayItem = duplicateArrayProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'li');
assert.equal(duplicateArrayItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-static-evidence'), false);
assert.equal(duplicateArrayItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-duplicate-keys-unsupported'), true);
assert.equal(duplicateArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.proofStatus, 'static-render-return-keyed-list-duplicate-key-unsupported');
assert.deepEqual(duplicateArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.duplicateKeyValues, ['a']);
assert.deepEqual(duplicateArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.duplicateKeyOrdinals, [1, 2]);
assert.equal(duplicateArrayItem.renderReturnRecords[0].collectionRecord.keyedListRecord.renderEquivalenceClaim, false);

const duplicateFragmentSource = [
  'export function DuplicateFragmentList() {',
  '  return <>',
  '    <li key="a">A</li>',
  '    <li key="a">A again</li>',
  '  </>;',
  '}',
  ''
].join('\n');
const duplicateFragmentProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_fragment_duplicate_keys',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/duplicate-fragment-list.tsx': duplicateFragmentSource },
  workerFiles: { 'src/duplicate-fragment-list.tsx': duplicateFragmentSource },
  headFiles: { 'src/duplicate-fragment-list.tsx': duplicateFragmentSource },
  outputDiagnostics: []
});
const duplicateFragmentItem = duplicateFragmentProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'li');
assert.equal(duplicateFragmentItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-static-evidence'), false);
assert.equal(duplicateFragmentItem.renderRiskReasonCodes.includes('jsx-render-return-keyed-list-duplicate-keys-unsupported'), true);
assert.equal(duplicateFragmentItem.renderReturnRecords[0].collectionRecord.keyedListRecord.proofStatus, 'static-render-return-keyed-list-duplicate-key-unsupported');
assert.deepEqual(duplicateFragmentItem.renderReturnRecords[0].collectionRecord.keyedListRecord.duplicateKeyValues, ['a']);
assert.deepEqual(duplicateFragmentItem.renderReturnRecords[0].collectionRecord.keyedListRecord.duplicateKeyOrdinals, [1, 2]);
assert.equal(duplicateFragmentItem.renderReturnRecords[0].collectionRecord.keyedListRecord.renderEquivalenceClaim, false);
