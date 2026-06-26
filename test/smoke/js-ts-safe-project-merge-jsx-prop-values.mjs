import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const propValueSource = [
  'function Child(_props) { return null; }',
  'function StaticLabel({ label, tone, dynamic }) { return <span data-label={label} data-tone={tone} data-dynamic={dynamic} />; }',
  'function MemberChild({ label }) { return <span data-label={label} />; }',
  'function Transforming({ label }) { return <span data-label={formatLabel(label)} />; }',
  'const UI = { Child: MemberChild };',
  'export function View({ label, values, id, Component }) {',
  '  const Target = Component;',
  '  return <section><Child title="Hello" count={1} label={label} nested={values[id]} delayed={makeLabel(id)} optional={values?.label} optionalDeep={values?.meta?.label} optionalComputed={values?.[id]} optionalCall={makeLabel?.(id)} disabled /><StaticLabel label={label} tone="calm" dynamic={makeLabel(id)} /><Transforming label={label} /><Target label={label} /><UI.Child label={label} /></section>;',
  '}',
  ''
].join('\n');

const propValueProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_prop_value_flow_graph',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/prop-values.tsx': propValueSource },
  workerFiles: { 'src/prop-values.tsx': propValueSource },
  headFiles: { 'src/prop-values.tsx': propValueSource },
  outputDiagnostics: []
});

const propValueGraph = propValueProject.outputProjectSymbolGraph;
const propValueRecord = (tagName, propName) => propValueGraph.jsxPropRecords
  .find((record) => record.tagName === tagName && record.propName === propName);

const titleProp = propValueRecord('Child', 'title');
assert.equal(titleProp.propValueProofStatus, 'static-literal-jsx-prop-value-evidence');
assert.equal(titleProp.propValueReasonCode, 'jsx-render-prop-value-literal-evidence');
assert.equal(titleProp.propValueKind, 'string');
assert.equal(titleProp.propValueText, '"Hello"');
assert.equal(typeof titleProp.propValueExpressionHash, 'string');
assert.equal(typeof titleProp.propValueSignatureHash, 'string');

const countProp = propValueRecord('Child', 'count');
assert.equal(countProp.propValueProofStatus, 'static-literal-jsx-prop-value-evidence');
assert.equal(countProp.propValueKind, 'number');
assert.equal(countProp.propValueExpressionText, '1');

const disabledProp = propValueRecord('Child', 'disabled');
assert.equal(disabledProp.propValueKind, 'boolean-shorthand');
assert.equal(disabledProp.propValueText, 'true');

const labelProp = propValueRecord('Child', 'label');
assert.equal(labelProp.propValueProofStatus, 'static-reference-jsx-prop-value-evidence');
assert.equal(labelProp.propValueReasonCode, 'jsx-render-prop-value-static-reference-evidence');
assert.equal(labelProp.propValueKind, 'reference');
assert.equal(labelProp.propValueText, 'label');
assert.equal(labelProp.propValueReferenceRoot, 'label');
assert.deepEqual(labelProp.propValueReferencePath, ['label']);
assert.equal(labelProp.componentPropRenderFlowStatus, 'component-prop-render-flow-unsupported');
assert.equal(labelProp.componentPropRenderFlowReasonCode, 'jsx-render-component-prop-flow-unsupported');
assert.equal(labelProp.componentPropRenderFlowClaim, false);
assert.equal(labelProp.componentPropRenderFlowRenderEquivalenceClaim, false);
assert.equal(typeof labelProp.componentPropRenderFlowSignatureHash, 'string');

const staticLabelProp = propValueRecord('StaticLabel', 'label');
assert.equal(staticLabelProp.propValueProofStatus, 'static-reference-jsx-prop-value-evidence');
assert.equal(staticLabelProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(staticLabelProp.componentPropRenderFlowReasonCode, 'jsx-render-component-prop-flow-static-passthrough-evidence');
assert.equal(staticLabelProp.componentPropRenderFlowClaim, true);
assert.equal(staticLabelProp.componentPropRenderFlowClaimScope, 'static-prop-passthrough-only');
assert.equal(staticLabelProp.componentPropRenderFlowRenderEquivalenceClaim, false);
assert.equal(staticLabelProp.componentPropRenderFlowScope, 'same-file-plain-component-static-prop-passthrough');
assert.equal(staticLabelProp.componentPropRenderFlowTargetName, 'StaticLabel');
assert.equal(staticLabelProp.componentPropRenderFlowTargetOwnerName, 'StaticLabel');
assert.equal(staticLabelProp.componentPropRenderFlowComponentPropName, 'label');
assert.equal(staticLabelProp.componentPropRenderFlowRenderedTagName, 'span');
assert.equal(staticLabelProp.componentPropRenderFlowRenderedPropName, 'data-label');
assert.equal(staticLabelProp.componentPropRenderFlowPassthroughExpressionText, 'label');
assert.equal(staticLabelProp.componentPropRenderFlowBindingKind, 'destructured-parameter');
assert.equal(staticLabelProp.componentPropRenderFlowReturnOrdinal, 1);
assert.equal(typeof staticLabelProp.componentPropRenderFlowTargetSignatureHash, 'string');
assert.equal(typeof staticLabelProp.componentPropRenderFlowSignatureHash, 'string');

const staticToneProp = propValueRecord('StaticLabel', 'tone');
assert.equal(staticToneProp.propValueProofStatus, 'static-literal-jsx-prop-value-evidence');
assert.equal(staticToneProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(staticToneProp.componentPropRenderFlowRenderedPropName, 'data-tone');
assert.equal(staticToneProp.componentPropRenderFlowRenderEquivalenceClaim, false);

const staticDynamicProp = propValueRecord('StaticLabel', 'dynamic');
assert.equal(staticDynamicProp.propValueProofStatus, 'dynamic-jsx-prop-value-unsupported');
assert.equal(staticDynamicProp.propValueDynamicBlockerReasonCode, 'jsx-render-prop-value-call-expression-unsupported');
assert.equal(staticDynamicProp.componentPropRenderFlowStatus, 'component-prop-render-flow-unsupported');
assert.equal(staticDynamicProp.componentPropRenderFlowReasonCode, 'jsx-render-component-prop-flow-dynamic-value-unsupported');
assert.equal(staticDynamicProp.componentPropRenderFlowDynamicBlockerReasonCode, 'jsx-render-prop-value-call-expression-unsupported');
assert.equal(staticDynamicProp.componentPropRenderFlowClaim, false);
assert.equal(staticDynamicProp.componentPropRenderFlowRenderEquivalenceClaim, false);

const transformingLabelProp = propValueRecord('Transforming', 'label');
assert.equal(transformingLabelProp.propValueProofStatus, 'static-reference-jsx-prop-value-evidence');
assert.equal(transformingLabelProp.componentPropRenderFlowStatus, 'component-prop-render-flow-unsupported');
assert.equal(transformingLabelProp.componentPropRenderFlowReasonCode, 'jsx-render-component-prop-flow-unsupported');
assert.equal(transformingLabelProp.componentPropRenderFlowClaim, false);
assert.equal(transformingLabelProp.componentPropRenderFlowRenderEquivalenceClaim, false);

const nestedProp = propValueRecord('Child', 'nested');
assert.equal(nestedProp.propValueProofStatus, 'dynamic-jsx-prop-value-unsupported');
assert.equal(nestedProp.propValueReasonCode, 'jsx-render-prop-value-unsupported');
assert.equal(nestedProp.propValueDynamicBlockerReasonCode, 'jsx-render-prop-value-computed-reference-unsupported');

const delayedProp = propValueRecord('Child', 'delayed');
assert.equal(delayedProp.propValueDynamicBlockerReasonCode, 'jsx-render-prop-value-call-expression-unsupported');

const optionalProp = propValueRecord('Child', 'optional');
assert.equal(optionalProp.propValueProofStatus, 'static-optional-reference-jsx-prop-value-evidence');
assert.equal(optionalProp.propValueReasonCode, 'jsx-render-prop-value-static-optional-reference-evidence');
assert.equal(optionalProp.propValueKind, 'optional-reference');
assert.equal(optionalProp.propValueText, 'values?.label');
assert.equal(optionalProp.propValueReferenceRoot, 'values');
assert.deepEqual(optionalProp.propValueReferencePath, ['values', 'label']);
assert.equal(optionalProp.propValueOptionalReference, true);
assert.deepEqual(optionalProp.propValueOptionalReferenceSegments, ['label']);
assert.deepEqual(optionalProp.propValueOptionalReferenceSegmentIndexes, [1]);
assert.equal(optionalProp.propValueOptionalNullishBoundaryCount, 1);
assert.equal(optionalProp.propValueDynamicBlockerReasonCode, undefined);

const optionalDeepProp = propValueRecord('Child', 'optionalDeep');
assert.equal(optionalDeepProp.propValueProofStatus, 'static-optional-reference-jsx-prop-value-evidence');
assert.equal(optionalDeepProp.propValueText, 'values?.meta?.label');
assert.deepEqual(optionalDeepProp.propValueReferencePath, ['values', 'meta', 'label']);
assert.deepEqual(optionalDeepProp.propValueOptionalReferenceSegments, ['meta', 'label']);
assert.deepEqual(optionalDeepProp.propValueOptionalReferenceSegmentIndexes, [1, 2]);
assert.equal(optionalDeepProp.propValueOptionalNullishBoundaryCount, 2);

const optionalComputedProp = propValueRecord('Child', 'optionalComputed');
assert.equal(optionalComputedProp.propValueProofStatus, 'dynamic-jsx-prop-value-unsupported');
assert.equal(optionalComputedProp.propValueDynamicBlockerReasonCode, 'jsx-render-prop-value-computed-reference-unsupported');

const optionalCallProp = propValueRecord('Child', 'optionalCall');
assert.equal(optionalCallProp.propValueProofStatus, 'dynamic-jsx-prop-value-unsupported');
assert.equal(optionalCallProp.propValueDynamicBlockerReasonCode, 'jsx-render-prop-value-call-expression-unsupported');

const targetLabelProp = propValueRecord('Target', 'label');
assert.equal(targetLabelProp.propValueProofStatus, 'static-reference-jsx-prop-value-evidence');
assert.equal(targetLabelProp.componentPropRenderFlowStatus, 'component-prop-render-flow-unsupported');
assert.equal(targetLabelProp.componentPropRenderFlowClaim, false);

const memberLabelProp = propValueRecord('UI.Child', 'label');
assert.equal(memberLabelProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(memberLabelProp.componentPropRenderFlowScope, 'same-file-member-component-static-prop-passthrough');
assert.equal(memberLabelProp.componentPropRenderFlowTargetLookupStatus, 'same-file-member-component-target-evidence');
assert.equal(memberLabelProp.componentPropRenderFlowTargetLookupScope, 'same-file-member-component');
assert.equal(memberLabelProp.componentPropRenderFlowTargetName, 'UI.Child');
assert.equal(memberLabelProp.componentPropRenderFlowTargetOwnerName, 'MemberChild');
assert.equal(memberLabelProp.componentPropRenderFlowMemberObjectName, 'UI');
assert.equal(memberLabelProp.componentPropRenderFlowMemberPropertyName, 'Child');
assert.equal(memberLabelProp.componentPropRenderFlowMemberLocalName, 'MemberChild');
assert.equal(memberLabelProp.componentPropRenderFlowMemberBindingKind, 'const');
assert.equal(memberLabelProp.componentPropRenderFlowRenderedPropName, 'data-label');
assert.equal(memberLabelProp.componentPropRenderFlowRenderEquivalenceClaim, false);
assert.equal(typeof memberLabelProp.componentPropRenderFlowMemberBindingHash, 'string');
assert.equal(typeof memberLabelProp.componentPropRenderFlowTargetLookupHash, 'string');

const importedPropFlowFiles = {
  'src/label.tsx': [
    'export function Label({ label, tone, dynamic }) {',
    '  return <span data-label={label} data-tone={tone} data-dynamic={dynamic} />;',
    '}',
    'export default function DefaultLabel({ label }) {',
    '  return <strong data-label={label} />;',
    '}',
    'export const UI = { Child: Label };',
    ''
  ].join('\n'),
  'src/barrel.ts': 'export { Label as BarrelLabel, UI as BarrelUI } from "./label.js";\n',
  'src/view.tsx': [
    'import DefaultLabel, { Label as ImportedLabel, UI as ImportedUI } from "./label.js";',
    'import { BarrelLabel, BarrelUI } from "./barrel.js";',
    'export function View({ label, tone, makeLabel, UI }) {',
    '  return <section><ImportedLabel label={label} tone="calm" dynamic={makeLabel(label)} /><DefaultLabel label={label} /><BarrelLabel label={label} /><ImportedUI.Child label={label} /><BarrelUI.Child label={label} /><UI.Child label={label} /></section>;',
    '}',
    ''
  ].join('\n')
};

const importedPropFlowProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_imported_component_prop_flow_graph',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: importedPropFlowFiles,
  workerFiles: importedPropFlowFiles,
  headFiles: importedPropFlowFiles,
  outputDiagnostics: []
});

const importedPropFlowGraph = importedPropFlowProject.outputProjectSymbolGraph;
const importedPropFlowRecord = (tagName, propName) => importedPropFlowGraph.jsxPropRecords
  .find((record) => record.sourcePath === 'src/view.tsx' && record.tagName === tagName && record.propName === propName);

const importedLabelProp = importedPropFlowRecord('ImportedLabel', 'label');
assert.equal(importedLabelProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(importedLabelProp.componentPropRenderFlowScope, 'project-import-direct-component-static-prop-passthrough');
assert.equal(importedLabelProp.componentPropRenderFlowTargetLookupStatus, 'project-import-component-target-evidence');
assert.equal(importedLabelProp.componentPropRenderFlowTargetLookupScope, 'project-import-direct-component');
assert.equal(importedLabelProp.componentPropRenderFlowTargetName, 'ImportedLabel');
assert.equal(importedLabelProp.componentPropRenderFlowTargetOwnerName, 'Label');
assert.equal(importedLabelProp.componentPropRenderFlowTargetSourcePath, 'src/label.tsx');
assert.equal(importedLabelProp.componentPropRenderFlowImportKind, 'named');
assert.equal(importedLabelProp.componentPropRenderFlowImportedName, 'Label');
assert.equal(importedLabelProp.componentPropRenderFlowLocalName, 'ImportedLabel');
assert.equal(importedLabelProp.componentPropRenderFlowTargetExportName, 'Label');
assert.equal(importedLabelProp.componentPropRenderFlowRenderedTagName, 'span');
assert.equal(importedLabelProp.componentPropRenderFlowRenderedPropName, 'data-label');
assert.equal(importedLabelProp.componentPropRenderFlowRenderEquivalenceClaim, false);
assert.equal(typeof importedLabelProp.componentPropRenderFlowImportEdgeId, 'string');
assert.equal(typeof importedLabelProp.componentPropRenderFlowTargetLookupHash, 'string');

const importedToneProp = importedPropFlowRecord('ImportedLabel', 'tone');
assert.equal(importedToneProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(importedToneProp.componentPropRenderFlowRenderedPropName, 'data-tone');
assert.equal(importedToneProp.componentPropRenderFlowImportKind, 'named');

const importedDynamicProp = importedPropFlowRecord('ImportedLabel', 'dynamic');
assert.equal(importedDynamicProp.componentPropRenderFlowStatus, 'component-prop-render-flow-unsupported');
assert.equal(importedDynamicProp.componentPropRenderFlowReasonCode, 'jsx-render-component-prop-flow-dynamic-value-unsupported');
assert.equal(importedDynamicProp.componentPropRenderFlowTargetLookupScope, 'project-import-direct-component');
assert.equal(importedDynamicProp.componentPropRenderFlowDynamicBlockerReasonCode, 'jsx-render-prop-value-call-expression-unsupported');
assert.equal(importedDynamicProp.componentPropRenderFlowRenderEquivalenceClaim, false);

const defaultLabelProp = importedPropFlowRecord('DefaultLabel', 'label');
assert.equal(defaultLabelProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(defaultLabelProp.componentPropRenderFlowTargetOwnerName, 'DefaultLabel');
assert.equal(defaultLabelProp.componentPropRenderFlowImportKind, 'default');
assert.equal(defaultLabelProp.componentPropRenderFlowImportedName, 'default');
assert.equal(defaultLabelProp.componentPropRenderFlowTargetExportName, 'default');
assert.equal(defaultLabelProp.componentPropRenderFlowRenderedTagName, 'strong');
assert.equal(defaultLabelProp.componentPropRenderFlowRenderedPropName, 'data-label');

const barrelLabelProp = importedPropFlowRecord('BarrelLabel', 'label');
assert.equal(barrelLabelProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(barrelLabelProp.componentPropRenderFlowScope, 'project-import-reexport-component-static-prop-passthrough');
assert.equal(barrelLabelProp.componentPropRenderFlowTargetLookupStatus, 'project-import-reexport-component-target-evidence');
assert.equal(barrelLabelProp.componentPropRenderFlowTargetLookupScope, 'project-import-reexport-component');
assert.equal(barrelLabelProp.componentPropRenderFlowTargetOwnerName, 'Label');
assert.equal(barrelLabelProp.componentPropRenderFlowTargetSourcePath, 'src/label.tsx');
assert.equal(barrelLabelProp.componentPropRenderFlowImportKind, 'named');
assert.equal(barrelLabelProp.componentPropRenderFlowImportedName, 'BarrelLabel');
assert.equal(barrelLabelProp.componentPropRenderFlowTargetExportName, 'Label');
assert.equal(barrelLabelProp.componentPropRenderFlowReExportSourcePath, 'src/barrel.ts');
assert.equal(barrelLabelProp.componentPropRenderFlowReExportExportedName, 'BarrelLabel');
assert.equal(barrelLabelProp.componentPropRenderFlowReExportLocalName, 'Label');
assert.equal(barrelLabelProp.componentPropRenderFlowReExportTargetSourcePath, 'src/label.tsx');
assert.equal(barrelLabelProp.componentPropRenderFlowReExportKind, 'named');
assert.equal(typeof barrelLabelProp.componentPropRenderFlowReExportEdgeId, 'string');

const importedMemberLabelProp = importedPropFlowRecord('ImportedUI.Child', 'label');
assert.equal(importedMemberLabelProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(importedMemberLabelProp.componentPropRenderFlowScope, 'project-import-member-component-static-prop-passthrough');
assert.equal(importedMemberLabelProp.componentPropRenderFlowTargetLookupStatus, 'project-import-member-component-target-evidence');
assert.equal(importedMemberLabelProp.componentPropRenderFlowTargetLookupScope, 'project-import-member-component');
assert.equal(importedMemberLabelProp.componentPropRenderFlowTargetName, 'ImportedUI.Child');
assert.equal(importedMemberLabelProp.componentPropRenderFlowTargetOwnerName, 'Label');
assert.equal(importedMemberLabelProp.componentPropRenderFlowTargetSourcePath, 'src/label.tsx');
assert.equal(importedMemberLabelProp.componentPropRenderFlowImportedName, 'UI');
assert.equal(importedMemberLabelProp.componentPropRenderFlowLocalName, 'ImportedUI');
assert.equal(importedMemberLabelProp.componentPropRenderFlowMemberObjectName, 'ImportedUI');
assert.equal(importedMemberLabelProp.componentPropRenderFlowMemberPropertyName, 'Child');
assert.equal(importedMemberLabelProp.componentPropRenderFlowMemberLocalName, 'Label');
assert.equal(importedMemberLabelProp.componentPropRenderFlowRenderedPropName, 'data-label');
assert.equal(typeof importedMemberLabelProp.componentPropRenderFlowMemberBindingHash, 'string');

const barrelMemberLabelProp = importedPropFlowRecord('BarrelUI.Child', 'label');
assert.equal(barrelMemberLabelProp.componentPropRenderFlowStatus, 'static-component-prop-render-flow-evidence');
assert.equal(barrelMemberLabelProp.componentPropRenderFlowScope, 'project-import-reexport-member-component-static-prop-passthrough');
assert.equal(barrelMemberLabelProp.componentPropRenderFlowTargetLookupStatus, 'project-import-reexport-member-component-target-evidence');
assert.equal(barrelMemberLabelProp.componentPropRenderFlowReExportSourcePath, 'src/barrel.ts');
assert.equal(barrelMemberLabelProp.componentPropRenderFlowReExportTargetSourcePath, 'src/label.tsx');
assert.equal(barrelMemberLabelProp.componentPropRenderFlowMemberObjectName, 'BarrelUI');
assert.equal(typeof barrelMemberLabelProp.componentPropRenderFlowTargetLookupHash, 'string');

const parameterMemberLabelProp = importedPropFlowRecord('UI.Child', 'label');
assert.equal(parameterMemberLabelProp.componentPropRenderFlowStatus, 'component-prop-render-flow-unsupported');
assert.equal(parameterMemberLabelProp.componentPropRenderFlowTargetKind, 'member-component');
assert.equal(parameterMemberLabelProp.componentPropRenderFlowClaim, false);
