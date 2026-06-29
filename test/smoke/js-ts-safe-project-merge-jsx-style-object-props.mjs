import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { jsxStyleObjectMergeProofAssessment, projectJsxPropDeltaConflicts } from '../../src/js-ts-safe-project-merge-jsx-graph-conflicts.js';
import { jsxDelta, jsxProp } from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

const styleObjectSource = [
  'function Box(_props) { return null; }',
  'const baseStyle = { opacity: 0.5 };',
  'export function View({ gapKey }) {',
  '  return <section><Box style={{ color: "red", marginTop: 8, "--accent": `blue` }} /><Box style={{ color: "red", color: "blue" }} /><Box style={{ [gapKey]: "1" }} /><Box style={{ ...baseStyle, color: "red" }} /><Box style={{ color: makeColor() }} /></section>;',
  '}',
  ''
].join('\n');

const styleObjectProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_static_style_object_graph',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/style-object.tsx': styleObjectSource },
  workerFiles: { 'src/style-object.tsx': styleObjectSource },
  headFiles: { 'src/style-object.tsx': styleObjectSource },
  outputDiagnostics: []
});

const styleProps = styleObjectProject.outputProjectSymbolGraph.jsxPropRecords.filter((record) => record.propName === 'style');
const staticStyle = styleProps.find((record) => record.propValueStaticStyleObjectProofStatus === 'static-style-object-jsx-prop-value-evidence' && record.propValueStaticStyleObjectPropertyNames?.includes('--accent'));
assert.equal(Boolean(staticStyle), true);
assert.equal(staticStyle.propValueKind, 'object-literal');
assert.deepEqual(staticStyle.propValueStaticStyleObjectEntries.map((entry) => [entry.stylePropertyName, entry.valueKind, entry.valueText, entry.ordinal]), [
  ['color', 'string', '"red"', 1],
  ['marginTop', 'number', '8', 2],
  ['--accent', 'template-string', '`blue`', 3]
]);
assert.deepEqual(staticStyle.propValueStaticStyleObjectPropertyNames, ['color', 'marginTop', '--accent']);
assert.equal(staticStyle.propValueStaticStyleObjectPropertyCount, 3);
assert.deepEqual(staticStyle.propValueStaticStyleObjectDuplicatePropertyNames, []);
assert.equal(staticStyle.propValueStaticStyleObjectClaimScope, 'static-jsx-style-object-properties-only');
assert.equal(staticStyle.propValueStaticStyleObjectRenderEquivalenceClaim, false);

const duplicateStyle = styleProps.find((record) => record.propValueStaticStyleObjectDuplicatePropertyNames?.includes('color'));
assert.equal(Boolean(duplicateStyle), true);
assert.deepEqual(duplicateStyle.propValueStaticStyleObjectPropertyNames, ['color', 'color']);
assert.deepEqual(duplicateStyle.propValueStaticStyleObjectDuplicatePropertyNames, ['color']);

const computedStyle = styleProps.find((record) => record.propValueDynamicBlockerReasonCode === 'jsx-render-prop-value-computed-reference-unsupported');
assert.equal(Boolean(computedStyle), true);
const spreadStyle = styleProps.find((record) => record.propValueDynamicBlockerReasonCode === 'jsx-render-prop-value-object-spread-unsupported');
assert.equal(Boolean(spreadStyle), true);
const callStyle = styleProps.find((record) => record.propValueDynamicBlockerReasonCode === 'jsx-render-prop-value-call-expression-unsupported');
assert.equal(Boolean(callStyle), true);

const baseColor = jsxStaticStyleEntry('color', '"red"');
const baseMargin = jsxStaticStyleEntry('marginTop', '4', 'number');
const workerColor = jsxStaticStyleEntry('color', '"blue"');
const headMargin = jsxStaticStyleEntry('marginTop', '8', 'number');
const styleDelta = jsxDelta({
  base: jsxStaticStyleProp('base', [baseColor, baseMargin]),
  worker: jsxStaticStyleProp('worker', [workerColor, baseMargin]),
  head: jsxStaticStyleProp('head', [baseColor, headMargin]),
  output: jsxStaticStyleProp('output', [workerColor, headMargin])
});
assert.equal(projectJsxPropDeltaConflicts(styleDelta).length, 0);
const styleProof = jsxStyleObjectMergeProofAssessment({
  identityKey: 'jsx-prop#src/view.tsx#View#Button#1#Button#style',
  baseRecord: styleDelta.stages.base.projectSymbolGraph.jsxPropRecords[0],
  workerRecord: styleDelta.stages.worker.projectSymbolGraph.jsxPropRecords[0],
  headRecord: styleDelta.stages.head.projectSymbolGraph.jsxPropRecords[0],
  outputRecord: styleDelta.stages.output.projectSymbolGraph.jsxPropRecords[0]
});
assert.equal(styleProof.status, 'passed');
assert.deepEqual(styleProof.record.delta.branchMerge.workerChangedPropertyNames, ['color']);
assert.deepEqual(styleProof.record.delta.branchMerge.headChangedPropertyNames, ['marginTop']);
assert.deepEqual(styleProof.record.delta.branchMerge.expectedOutputStyleObjectEntries.map((entry) => entry.stylePropertyName), ['color', 'marginTop']);
assert.equal(styleProof.record.styleObjectPropertyCommutationClaim, true);
assert.equal(styleProof.record.renderEquivalenceClaim, false);
assert.equal(styleProof.record.autoMergeClaim, false);

const overlapStyleDelta = jsxDelta({
  base: jsxStaticStyleProp('base', [baseColor, baseMargin]),
  worker: jsxStaticStyleProp('worker', [workerColor, baseMargin]),
  head: jsxStaticStyleProp('head', [jsxStaticStyleEntry('color', '"green"'), baseMargin]),
  output: jsxStaticStyleProp('output', [workerColor, baseMargin])
});
const overlapStyleConflicts = projectJsxPropDeltaConflicts(overlapStyleDelta);
assert.equal(overlapStyleConflicts.length, 1);
assert.equal(overlapStyleConflicts[0].details.reasonCodes.includes('jsx-style-object-overlapping-branch-change'), true);
assert.equal(overlapStyleConflicts[0].details.routeId, 'admit-jsx-style-object-property-commutation');
assert.equal(overlapStyleConflicts[0].details.jsxStyleObjectMergeProof.status, 'failed');
assert.equal(overlapStyleConflicts[0].details.jsxStyleObjectMergeProof.renderEquivalenceClaim, false);

const mismatchStyleDelta = jsxDelta({
  base: jsxStaticStyleProp('base', [baseColor, baseMargin]),
  worker: jsxStaticStyleProp('worker', [workerColor, baseMargin]),
  head: jsxStaticStyleProp('head', [baseColor, headMargin]),
  output: jsxStaticStyleProp('output', [workerColor, baseMargin])
});
const mismatchStyleConflicts = projectJsxPropDeltaConflicts(mismatchStyleDelta);
assert.equal(mismatchStyleConflicts.length, 1);
assert.equal(mismatchStyleConflicts[0].details.reasonCodes.includes('jsx-style-object-output-properties-mismatch'), true);

function jsxStaticStyleProp(stage, styleObjectEntries, signatureHash = `jsx:style:${stage}`) {
  return {
    ...jsxProp(stage, signatureHash),
    propName: 'style',
    propKind: 'named',
    propValueProofStatus: 'static-literal-jsx-prop-value-evidence',
    propValueReasonCode: 'jsx-render-prop-value-literal-evidence',
    propValueKind: 'object-literal',
    propValueExpressionText: `{ ${styleObjectEntries.map((entry) => `${entry.keyText}: ${entry.valueText}`).join(', ')} }`,
    propValueStaticStyleObjectProofStatus: 'static-style-object-jsx-prop-value-evidence',
    propValueStaticStyleObjectEntries: styleObjectEntries,
    propValueStaticStyleObjectPropertyNames: styleObjectEntries.map((entry) => entry.stylePropertyName),
    propValueStaticStyleObjectPropertyCount: styleObjectEntries.length,
    propValueStaticStyleObjectDuplicatePropertyNames: [],
    propValueStaticStyleObjectClaimScope: 'static-jsx-style-object-properties-only',
    propValueStaticStyleObjectRenderEquivalenceClaim: false,
    propValueExpressionHash: `style-expression:${stage}`,
    propValueSignatureHash: signatureHash
  };
}

function jsxStaticStyleEntry(stylePropertyName, valueText, valueKind = 'string') {
  return {
    stylePropertyName,
    keyText: stylePropertyName,
    valueKind,
    valueText,
    entryHash: `static-style-entry:${stylePropertyName}:${valueKind}:${valueText}`
  };
}
