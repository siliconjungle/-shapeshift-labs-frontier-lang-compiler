import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { jsxRenderReturnRisk, jsxRenderRiskDelta } from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

const singleReturnSource = [
  'export function View({ ready }) {',
  '  return <button data-ready={ready} />;',
  '}',
  ''
].join('\n');
const singleReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_static',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': singleReturnSource },
  workerFiles: { 'src/view.tsx': singleReturnSource },
  headFiles: { 'src/view.tsx': singleReturnSource },
  outputDiagnostics: []
});
const singleButton = singleReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'button');
assert.equal(singleButton.renderRiskKinds.includes('render-return-boundary'), true);
assert.equal(singleButton.renderRiskReasonCodes.includes('jsx-render-return-static-evidence'), true);
assert.equal(singleButton.renderRiskReasonCodes.includes('jsx-render-return-branch-unsupported'), false);
assert.equal(singleButton.renderReturnCount, 1);
assert.equal(singleButton.renderReturnRecords[0].branchControlKind, 'return-statement');
assert.equal(singleButton.renderReturnRecords[0].proofStatus, 'static-render-return-evidence');
assert.equal(typeof singleButton.renderReturnRecords[0].expressionHash, 'string');
assert.equal(typeof singleButton.renderReturnSignatureHash, 'string');

const implicitArrowSource = [
  'export const InlineView = ({ ready }) => (',
  '  <button data-ready={ready} />',
  ');',
  ''
].join('\n');
const implicitArrowProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_implicit_arrow',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/inline.tsx': implicitArrowSource },
  workerFiles: { 'src/inline.tsx': implicitArrowSource },
  headFiles: { 'src/inline.tsx': implicitArrowSource },
  outputDiagnostics: []
});
const implicitArrowButton = implicitArrowProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'button');
assert.equal(implicitArrowButton.renderRiskKinds.includes('render-return-boundary'), true);
assert.equal(implicitArrowButton.renderRiskReasonCodes.includes('jsx-render-return-implicit-arrow-static-evidence'), true);
assert.equal(implicitArrowButton.renderRiskReasonCodes.includes('jsx-render-return-branch-unsupported'), false);
assert.equal(implicitArrowButton.renderReturnCount, 1);
assert.equal(implicitArrowButton.renderReturnRecords[0].returnKind, 'implicit-arrow-expression');
assert.equal(implicitArrowButton.renderReturnRecords[0].branchControlKind, 'return-statement');
assert.equal(implicitArrowButton.renderReturnRecords[0].expressionText, '<button data-ready={ready} />');

const conditionalReturnSource = [
  'export const ConditionalView = ({ ready }) => ready ? <button data-ready /> : <span data-empty />;',
  ''
].join('\n');
const conditionalReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_conditional_branch',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/conditional.tsx': conditionalReturnSource },
  workerFiles: { 'src/conditional.tsx': conditionalReturnSource },
  headFiles: { 'src/conditional.tsx': conditionalReturnSource },
  outputDiagnostics: []
});
const conditionalButton = conditionalReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'button');
assert.equal(conditionalButton.renderRiskKinds.includes('render-return-branch-control-flow'), true);
assert.equal(conditionalButton.renderRiskReasonCodes.includes('jsx-render-return-conditional-branch-static-evidence'), true);
assert.equal(conditionalButton.renderRiskReasonCodes.includes('jsx-render-return-branch-unsupported'), true);
assert.equal(conditionalButton.renderReturnCount, 1);
assert.equal(conditionalButton.renderReturnBranchCount, 1);
assert.equal(conditionalButton.renderReturnRecords[0].returnKind, 'implicit-arrow-expression');
assert.equal(conditionalButton.renderReturnRecords[0].branchControlKind, 'conditional-expression');
assert.equal(conditionalButton.renderReturnRecords[0].conditionalBranchRecord.conditionText, 'ready');
assert.equal(conditionalButton.renderReturnRecords[0].conditionalBranchRecord.consequentText, '<button data-ready />');
assert.equal(conditionalButton.renderReturnRecords[0].conditionalBranchRecord.alternateText, '<span data-empty />');
assert.equal(typeof conditionalButton.renderReturnRecords[0].conditionalBranchRecord.signatureHash, 'string');

const logicalReturnSource = [
  'export const LogicalView = ({ ready }) => ready && <button data-ready />;',
  ''
].join('\n');
const logicalReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_logical_branch',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/logical.tsx': logicalReturnSource },
  workerFiles: { 'src/logical.tsx': logicalReturnSource },
  headFiles: { 'src/logical.tsx': logicalReturnSource },
  outputDiagnostics: []
});
const logicalButton = logicalReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'button');
assert.equal(logicalButton.renderRiskKinds.includes('render-return-branch-control-flow'), true);
assert.equal(logicalButton.renderRiskReasonCodes.includes('jsx-render-return-logical-branch-static-evidence'), true);
assert.equal(logicalButton.renderRiskReasonCodes.includes('jsx-render-return-branch-unsupported'), true);
assert.equal(logicalButton.renderReturnCount, 1);
assert.equal(logicalButton.renderReturnBranchCount, 1);
assert.equal(logicalButton.renderReturnRecords[0].branchControlKind, 'logical-expression');
assert.equal(logicalButton.renderReturnRecords[0].logicalBranchRecord.operator, '&&');
assert.equal(logicalButton.renderReturnRecords[0].logicalBranchRecord.leftText, 'ready');
assert.equal(logicalButton.renderReturnRecords[0].logicalBranchRecord.rightText, '<button data-ready />');
assert.equal(typeof logicalButton.renderReturnRecords[0].logicalBranchRecord.signatureHash, 'string');

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

const wrapperSource = [
  'import { memo, forwardRef } from "react";',
  'export const Button = memo(forwardRef(function ButtonImpl({ ready }, ref) {',
  '  return <button ref={ref} data-ready={ready} />;',
  '}));',
  ''
].join('\n');
const wrapperProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_component_wrappers',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/wrapper.tsx': wrapperSource },
  workerFiles: { 'src/wrapper.tsx': wrapperSource },
  headFiles: { 'src/wrapper.tsx': wrapperSource },
  outputDiagnostics: []
});
const wrapperButton = wrapperProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'button');
assert.equal(wrapperButton.renderRiskKinds.includes('component-wrapper-boundary'), true);
assert.equal(wrapperButton.renderRiskReasonCodes.includes('jsx-render-component-wrapper-static-evidence'), true);
assert.equal(wrapperButton.renderRiskReasonCodes.includes('jsx-render-component-wrapper-render-equivalence-unproved'), true);
assert.deepEqual(wrapperButton.componentWrapperNames, ['memo', 'forwardRef']);
assert.equal(wrapperButton.componentWrapperCount, 2);
assert.equal(wrapperButton.componentWrapperRenderEquivalenceClaim, false);
assert.equal(wrapperButton.componentWrapperRecords[0].wrapperCalleeText, 'memo');
assert.equal(wrapperButton.componentWrapperRecords[1].wrapperCalleeText, 'forwardRef');
assert.equal(wrapperButton.componentWrapperRecords[1].innerComponentName, 'ButtonImpl');
assert.equal(wrapperButton.componentWrapperRecords.every((record) => record.renderEquivalenceClaim === false), true);
assert.equal(typeof wrapperButton.componentWrapperSignatureHash, 'string');

const lazyWrapperSource = [
  'import React from "react";',
  'export const LazyPanel = React.lazy(() => import("./Panel.tsx"));',
  'export function Shell() {',
  '  return <LazyPanel mode="compact" />;',
  '}',
  ''
].join('\n');
const lazyWrapperProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_lazy_wrappers',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/lazy-wrapper.tsx': lazyWrapperSource },
  workerFiles: { 'src/lazy-wrapper.tsx': lazyWrapperSource },
  headFiles: { 'src/lazy-wrapper.tsx': lazyWrapperSource },
  outputDiagnostics: []
});
const lazyPanel = lazyWrapperProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'LazyPanel');
assert.deepEqual(lazyPanel.componentWrapperNames, ['lazy']);
assert.equal(lazyPanel.renderRiskReasonCodes.includes('jsx-render-component-wrapper-lazy-boundary-evidence'), true);
assert.equal(lazyPanel.renderRiskReasonCodes.includes('jsx-render-component-wrapper-lazy-runtime-equivalence-unproved'), true);
assert.equal(lazyPanel.componentWrapperRecords[0].wrapperCalleeText, 'React.lazy');
assert.equal(lazyPanel.componentWrapperRecords[0].wrapperArgumentKind, 'lazy-import-factory');
assert.equal(lazyPanel.componentWrapperRecords[0].lazyImportFactory, true);
assert.equal(lazyPanel.componentWrapperRecords[0].lazyImportSpecifier, './Panel.tsx');
assert.equal(lazyPanel.componentWrapperLazyBoundaryCount, 1);
assert.equal(lazyPanel.componentWrapperLazyLoadEquivalenceClaim, false);

const branchReturnSource = [
  'export function BranchView({ ready }) {',
  '  if (!ready) return null;',
  '  return <button data-ready={ready} />;',
  '}',
  ''
].join('\n');
const branchReturnProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_render_return_branches',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/branch.tsx': branchReturnSource },
  workerFiles: { 'src/branch.tsx': branchReturnSource },
  headFiles: { 'src/branch.tsx': branchReturnSource },
  outputDiagnostics: []
});
const branchButton = branchReturnProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'button');
assert.equal(branchButton.renderRiskKinds.includes('render-return-branch-control-flow'), true);
assert.equal(branchButton.renderRiskReasonCodes.includes('jsx-render-return-branch-unsupported'), true);
assert.equal(branchButton.renderReturnCount, 2);
assert.equal(branchButton.renderReturnBranchCount, 1);
assert.equal(branchButton.renderReturnRecords[0].expressionText, 'null');
assert.equal(branchButton.renderReturnRecords[0].ifConditionText, '!ready');
assert.equal(branchButton.renderReturnRecords[1].expressionText, '<button data-ready={ready} />');

const renderReturnDelta = jsxRenderRiskDelta({
  base: jsxRenderReturnRisk('base', ['<button />']),
  worker: jsxRenderReturnRisk('worker', ['null', '<button data-worker />']),
  head: jsxRenderReturnRisk('head', ['null', '<button data-head />']),
  output: jsxRenderReturnRisk('output', ['null', '<button data-worker data-head />'])
});
const renderReturnConflicts = projectGraphDeltaConflicts(renderReturnDelta);
assert.equal(renderReturnConflicts.length, 1);
assert.equal(renderReturnConflicts[0].details.reasonCodes.includes('jsx-render-return-branch-unsupported'), true);
assert.equal(renderReturnConflicts[0].details.worker.renderReturnCount, 2);
assert.equal(renderReturnConflicts[0].details.worker.renderReturnBranchCount, 1);
assert.equal(renderReturnConflicts[0].details.worker.renderReturnRecords[1].expressionText, '<button data-worker />');

const wrapperDelta = jsxRenderRiskDelta({
  base: jsxRenderWrapperRisk('base', ['memo']),
  worker: jsxRenderWrapperRisk('worker', ['memo', 'forwardRef']),
  head: jsxRenderWrapperRisk('head', ['observer']),
  output: jsxRenderWrapperRisk('output', ['observer', 'forwardRef'])
});
const wrapperConflicts = projectGraphDeltaConflicts(wrapperDelta);
assert.equal(wrapperConflicts.length, 1);
assert.equal(wrapperConflicts[0].details.reasonCodes.includes('jsx-render-component-wrapper-static-evidence'), true);
assert.equal(wrapperConflicts[0].details.worker.componentWrapperCount, 2);
assert.equal(wrapperConflicts[0].details.worker.componentWrapperRenderEquivalenceClaim, false);
assert.deepEqual(wrapperConflicts[0].details.head.componentWrapperNames, ['observer']);

function jsxRenderWrapperRisk(stage, wrapperNames) {
  const records = wrapperNames.map((wrapperName, index) => ({
    ordinal: index + 1,
    proofStatus: 'static-component-wrapper-evidence',
    reasonCode: 'jsx-render-component-wrapper-static-evidence',
    wrapperName,
    wrapperCalleeText: wrapperName,
    wrapperArgumentKind: index === wrapperNames.length - 1 ? 'function-expression' : 'wrapper-call',
    innerComponentName: 'ViewImpl',
    ownerName: 'View',
    renderEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    signatureHash: `component-wrapper:${stage}:${index + 1}:${wrapperName}`
  }));
  return {
    id: `jsx_wrapper_${stage}`,
    sourcePath: 'src/view.tsx',
    tagName: 'button',
    tagKey: 'button#1',
    publicContract: true,
    publicOwnerName: 'View',
    renderRiskKinds: ['component-wrapper-boundary'],
    renderRiskReasonCodes: ['jsx-render-component-wrapper-static-evidence', 'jsx-render-component-wrapper-render-equivalence-unproved'],
    componentWrapperNames: wrapperNames,
    componentWrapperCalleeTexts: wrapperNames,
    componentWrapperRecords: records,
    componentWrapperCount: records.length,
    componentWrapperRenderEquivalenceClaim: false,
    componentWrapperSignatureHash: `component-wrappers:${stage}:${wrapperNames.join('|')}`,
    renderRiskSignatureHash: `render-risk:component-wrappers:${stage}`,
    sourceHash: `source:${stage}`
  };
}
