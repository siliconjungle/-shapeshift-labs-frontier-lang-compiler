import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const baseSource = 'export const Button = React.forwardRef((props, ref) => {\n  return <button ref={ref}>{props.label}</button>;\n});\n';
const workerSource = baseSource.replace('props.label}</button>', 'props.label.toUpperCase()}</button>');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;

const imported = importNativeSource({
  language: 'tsx',
  sourcePath: 'src/button.tsx',
  sourceText: baseSource
});
assert.equal(imported.semanticIndex.facts.some((fact) => fact.predicate === 'mutation'), false);

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.symbols.some((symbol) => symbol.kind === 'mutation'), false);
assert.equal(sidecar.symbols.some((symbol) => symbol.name === 'Button:controlFlow:exit#1'), true);

const script = createSemanticEditScript({
  id: 'semantic_edit_tsx_jsx_attribute',
  language: 'tsx',
  sourcePath: 'src/button.tsx',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 180
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'Button:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: headSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, expectedSource);

const attributeBaseSource = 'export function View() {\n  return <Button tone="base" size="m" />;\n}\n';
const attributeWorkerSource = attributeBaseSource.replace('tone="base"', 'tone="worker"');
const attributeHeadSource = `// layout wrapper moved\n${attributeBaseSource}`;

const attributeScript = createSemanticEditScript({
  id: 'semantic_edit_tsx_jsx_actual_attribute',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: attributeBaseSource,
  workerSourceText: attributeWorkerSource,
  headSourceText: attributeHeadSource,
  generatedAt: 181
});
assert.equal(attributeScript.admission.status, 'conflict');
assert.equal(attributeScript.operations.length, 1);
assert.equal(attributeScript.operations[0].kind, 'replaceControlFlow');
assert.equal(attributeScript.operations[0].anchor.symbolName, 'View:controlFlow:exit#1');
assert.equal(attributeScript.operations[0].reasonCodes.includes('runtime-order-sensitive-merge-requires-explicit-evidence'), true);

const attributeProjection = projectSemanticEditScriptToSource({
  script: attributeScript,
  workerSourceText: attributeWorkerSource,
  headSourceText: attributeHeadSource
});
assert.equal(attributeProjection.status, 'blocked');
assert.equal(attributeProjection.admission.reasonCodes.includes('script-not-auto-merge-candidate'), true);
assert.equal(attributeProjection.admission.reasonCodes.some((reason) => reason.startsWith('operation-not-portable:')), true);

const sameRegionHeadSource = attributeBaseSource.replace('size="m"', 'size="l"');
const sameRegionExpectedSource = 'export function View() {\n  return <Button tone="worker" size="l" />;\n}\n';
const sameRegionMerge = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_attribute_same_region',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: attributeBaseSource,
  workerSourceText: attributeWorkerSource,
  headSourceText: sameRegionHeadSource
});
assert.equal(sameRegionMerge.status, 'merged');
assert.equal(sameRegionMerge.mergedSourceText, sameRegionExpectedSource);
assert.equal(sameRegionMerge.semanticArtifacts.status, 'verified');
assert.equal(sameRegionMerge.summary.jsxAttributeEdits, 1);
assert.equal(sameRegionMerge.summary.jsxComponentPropContractCandidates, 1);

const sameAttributeConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_attribute_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: attributeBaseSource,
  workerSourceText: attributeWorkerSource,
  headSourceText: attributeBaseSource.replace('tone="base"', 'tone="head"')
});
assert.equal(sameAttributeConflict.status, 'blocked');
assert.equal(sameAttributeConflict.admission.reasonCodes.includes('jsx-attribute-conflict'), true);

const spreadAttributeBaseSource = 'export function View({ baseProps }) {\n  return <Button {...baseProps} tone="base" />;\n}\n';
const spreadAttributeWorkerSource = spreadAttributeBaseSource.replace('{...baseProps}', '{...baseProps.worker}');
const spreadAttributeHeadSource = spreadAttributeBaseSource.replace('tone="base"', 'tone="head"');
const spreadAttributeMerge = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_spread_explicit_precedence_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: spreadAttributeBaseSource,
  workerSourceText: spreadAttributeWorkerSource,
  headSourceText: spreadAttributeHeadSource
});
assert.equal(spreadAttributeMerge.status, 'blocked');
assert.equal(spreadAttributeMerge.admission.reasonCodes.includes('jsx-attribute-spread-explicit-precedence-unsupported'), true);
const explicitSpreadAttributeMerge = safeMergeJsTsSource({ id: 'semantic_edit_tsx_jsx_explicit_spread_precedence_conflict', language: 'tsx', sourcePath: 'src/view.tsx', baseSourceText: spreadAttributeBaseSource, workerSourceText: spreadAttributeHeadSource, headSourceText: spreadAttributeWorkerSource });
assert.equal(explicitSpreadAttributeMerge.admission.reasonCodes.includes('jsx-attribute-spread-explicit-precedence-unsupported'), true);

const sameSpreadAttributeConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_spread_attribute_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: spreadAttributeBaseSource,
  workerSourceText: spreadAttributeWorkerSource,
  headSourceText: spreadAttributeBaseSource.replace('{...baseProps}', '{...baseProps.head}')
});
assert.equal(sameSpreadAttributeConflict.status, 'blocked');

const spreadAttributeReorderConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_spread_attribute_reorder_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: spreadAttributeBaseSource,
  workerSourceText: 'export function View({ baseProps }) {\n  return <Button tone="base" {...baseProps} />;\n}\n',
  headSourceText: spreadAttributeBaseSource.replace('tone="base"', 'tone="head"')
});
assert.equal(spreadAttributeReorderConflict.status, 'blocked');
assert.equal(spreadAttributeReorderConflict.admission.reasonCodes.includes('jsx-attribute-shape-changed'), true);

const expressionBaseSource = 'export function View({ a, b }) {\n  return <div>{a}<span data-id="x">x</span>{b}</div>;\n}\n';
const expressionWorkerSource = expressionBaseSource.replace('{a}', '{a + 1}');
const expressionHeadSource = expressionBaseSource.replace('{b}', '{b + 1}');
const expressionExpectedSource = 'export function View({ a, b }) {\n  return <div>{a + 1}<span data-id="x">x</span>{b + 1}</div>;\n}\n';
const expressionMerge = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_child_expression_disjoint',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: expressionBaseSource,
  workerSourceText: expressionWorkerSource,
  headSourceText: expressionHeadSource
});
assert.equal(expressionMerge.status, 'merged');
assert.equal(expressionMerge.mergedSourceText, expressionExpectedSource);
assert.equal(expressionMerge.semanticArtifacts.status, 'verified');
assert.equal(expressionMerge.summary.jsxChildExpressionElements, 1);
assert.equal(expressionMerge.summary.jsxChildExpressionEdits, 1);
assert.equal(expressionMerge.metadata.composed.phases.includes('jsx-child-expression'), true);

const conditionalChildExpressionBaseSource = 'export function View({ show, count }) {\n  return <div>{show ? <Panel mode="base" /> : null}{count}</div>;\n}\n';
const conditionalChildExpressionConflict = safeMergeJsTsSource({ id: 'semantic_edit_tsx_jsx_conditional_child_expression_conflict', language: 'tsx', sourcePath: 'src/view.tsx', baseSourceText: conditionalChildExpressionBaseSource, workerSourceText: conditionalChildExpressionBaseSource.replace('mode="base"', 'mode="worker"'), headSourceText: conditionalChildExpressionBaseSource.replace('{count}', '{count + 1}') });
assert.equal(conditionalChildExpressionConflict.status, 'blocked');
assert.equal(conditionalChildExpressionConflict.admission.reasonCodes.includes('jsx-child-conditional-expression-unsupported'), true);
assert.equal(conditionalChildExpressionConflict.admission.semanticEquivalenceClaim, false);

const sameExpressionConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_child_expression_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: expressionBaseSource,
  workerSourceText: expressionWorkerSource,
  headSourceText: expressionBaseSource.replace('{a}', '{a + 2}')
});
assert.equal(sameExpressionConflict.status, 'blocked');

const sameInsertionChildConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_child_same_insertion_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: 'export function View() {\n  return <div><span>A</span></div>;\n}\n',
  workerSourceText: 'export function View() {\n  return <div><span>A</span><span>B</span></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><span>A</span><span>C</span></div>;\n}\n'
});
assert.equal(sameInsertionChildConflict.status, 'blocked');

const childAdditionBaseSource = 'export function View() {\n  return <div><span>A</span></div>;\n}\n';
const childAdditionMerge = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_child_additions_distinct_gaps',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: childAdditionBaseSource,
  workerSourceText: 'export function View() {\n  return <div><span>B</span><span>A</span></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><span>A</span><span>C</span></div>;\n}\n'
});
assert.equal(childAdditionMerge.status, 'merged');
assert.equal(childAdditionMerge.mergedSourceText, 'export function View() {\n  return <div><span>B</span><span>A</span><span>C</span></div>;\n}\n');
assert.equal(childAdditionMerge.semanticArtifacts.status, 'verified');
assert.equal(childAdditionMerge.summary.jsxChildAdditions, 1);

const keyedChildAdditionBaseSource = 'export function View() {\n  return <div><Item key="a" label="A" /></div>;\n}\n';
const keyedChildAdditionMerge = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_keyed_child_additions_distinct_gaps',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: keyedChildAdditionBaseSource,
  workerSourceText: 'export function View() {\n  return <div><Item key="b" label="B" /><Item key="a" label="A" /></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><Item key="a" label="A" /><Item key="c" label="C" /></div>;\n}\n'
});
assert.equal(keyedChildAdditionMerge.status, 'merged');
assert.equal(keyedChildAdditionMerge.mergedSourceText, 'export function View() {\n  return <div><Item key="b" label="B" /><Item key="a" label="A" /><Item key="c" label="C" /></div>;\n}\n');
assert.equal(keyedChildAdditionMerge.summary.jsxChildAdditions, 1);
assert.equal(keyedChildAdditionMerge.summary.jsxKeyedChildAdditions, 1);
assert.equal(keyedChildAdditionMerge.metadata.composed.phases.includes('jsx-child-expression'), true);

const sameGapKeyedChildConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_keyed_child_same_gap_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: keyedChildAdditionBaseSource,
  workerSourceText: 'export function View() {\n  return <div><Item key="a" label="A" /><Item key="b" label="B" /></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><Item key="a" label="A" /><Item key="c" label="C" /></div>;\n}\n'
});
assert.equal(sameGapKeyedChildConflict.status, 'blocked');
assert.equal(sameGapKeyedChildConflict.admission.reasonCodes.includes('jsx-child-addition-same-gap-conflict'), true);

const keyedFragmentAdditionMerge = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_keyed_fragment_additions_distinct_gaps',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  workerSourceText: 'export function View() {\n  return <div><React.Fragment key="b"><Item label="B" /></React.Fragment><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment><React.Fragment key="c"><Item label="C" /></React.Fragment></div>;\n}\n'
});
assert.equal(keyedFragmentAdditionMerge.status, 'merged');
assert.equal(keyedFragmentAdditionMerge.mergedSourceText, 'export function View() {\n  return <div><React.Fragment key="b"><Item label="B" /></React.Fragment><React.Fragment key="a"><Item label="A" /></React.Fragment><React.Fragment key="c"><Item label="C" /></React.Fragment></div>;\n}\n');
assert.equal(keyedFragmentAdditionMerge.summary.jsxChildAdditions, 1);
assert.equal(keyedFragmentAdditionMerge.summary.jsxKeyedChildAdditions, 1);
assert.equal(keyedFragmentAdditionMerge.summary.jsxKeyedFragmentAdditions, 1);

const duplicateKeyedFragmentComponentAdditionConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_keyed_fragment_component_duplicate_key_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  workerSourceText: 'export function View() {\n  return <div><React.Fragment key="b"><Item label="B" /></React.Fragment><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment><Item key="b" label="B2" /></div>;\n}\n'
});
assert.equal(duplicateKeyedFragmentComponentAdditionConflict.status, 'blocked');
assert.equal(duplicateKeyedFragmentComponentAdditionConflict.admission.reasonCodes.includes('jsx-child-duplicate-key'), true);

const sameGapKeyedFragmentConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_keyed_fragment_same_gap_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  workerSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment><React.Fragment key="b"><Item label="B" /></React.Fragment></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment><React.Fragment key="c"><Item label="C" /></React.Fragment></div>;\n}\n'
});
assert.equal(sameGapKeyedFragmentConflict.status, 'blocked');
assert.equal(sameGapKeyedFragmentConflict.admission.reasonCodes.includes('jsx-child-addition-same-gap-conflict'), true);

const spreadKeyedFragmentAdditionConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_keyed_fragment_spread_prop_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: 'export function View({ props }) {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  workerSourceText: 'export function View({ props }) {\n  return <div><React.Fragment key="b" {...props}><Item label="B" /></React.Fragment><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  headSourceText: 'export function View({ props }) {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment><React.Fragment key="c"><Item label="C" /></React.Fragment></div>;\n}\n'
});
assert.equal(spreadKeyedFragmentAdditionConflict.status, 'blocked');
assert.equal(spreadKeyedFragmentAdditionConflict.admission.reasonCodes.includes('jsx-child-spread-prop-addition-unsupported'), true);

const dataKeyFragmentAdditionConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_fragment_data_key_not_stable_key',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  workerSourceText: 'export function View() {\n  return <div><React.Fragment data-key="b"><Item label="B" /></React.Fragment><React.Fragment key="a"><Item label="A" /></React.Fragment></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><React.Fragment key="a"><Item label="A" /></React.Fragment><React.Fragment key="c"><Item label="C" /></React.Fragment></div>;\n}\n'
});
assert.equal(dataKeyFragmentAdditionConflict.status, 'blocked');
assert.equal(dataKeyFragmentAdditionConflict.admission.reasonCodes.includes('jsx-child-fragment-addition-unsupported'), true);

const shorthandFragmentAdditionConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_shorthand_fragment_addition_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: 'export function View() {\n  return <div><Item key="a" label="A" /></div>;\n}\n',
  workerSourceText: 'export function View() {\n  return <div><><Item label="B" /></><Item key="a" label="A" /></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><Item key="a" label="A" /><Item key="c" label="C" /></div>;\n}\n'
});
assert.equal(shorthandFragmentAdditionConflict.status, 'blocked');
assert.equal(shorthandFragmentAdditionConflict.admission.reasonCodes.includes('jsx-child-fragment-addition-unsupported'), true);

const keyedChildReorderConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_keyed_child_reorder_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: 'export function View() {\n  return <div><Item key="a" label="A" /><Item key="b" label="B" /><Item key="c" label="C" /></div>;\n}\n',
  workerSourceText: 'export function View() {\n  return <div><Item key="b" label="B" /><Item key="a" label="A" /><Item key="c" label="C" /></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><Item key="a" label="A" /><Item key="b" label="B" /><Item key="c" label="C" /><Item key="d" label="D" /></div>;\n}\n'
});
assert.equal(keyedChildReorderConflict.status, 'blocked');
assert.equal(keyedChildReorderConflict.admission.reasonCodes.includes('jsx-child-reorder-unsupported'), true);

const spreadChildAdditionConflict = safeMergeJsTsSource({
  id: 'semantic_edit_tsx_jsx_spread_child_addition_conflict',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: keyedChildAdditionBaseSource,
  workerSourceText: 'export function View() {\n  return <div><Item key="b" {...props} /><Item key="a" label="A" /></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><Item key="a" label="A" /><Item key="c" label="C" /></div>;\n}\n'
});
assert.equal(spreadChildAdditionConflict.status, 'blocked');
assert.equal(spreadChildAdditionConflict.admission.reasonCodes.includes('jsx-child-spread-prop-addition-unsupported'), true);
