import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { jsxSpreadEffectivePropMergeProofAssessment, projectJsxPropDeltaConflicts } from '../../src/js-ts-safe-project-merge-jsx-graph-conflicts.js';
import { jsxDelta, jsxStaticSpreadEntry, jsxStaticSpreadProp } from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

const spreadPrecedenceSource = [
  'type ButtonProps = { tone?: string; size?: string; disabled?: boolean };',
  'function Button(_props: ButtonProps) { return null; }',
  'const constProps = { tone: "muted", disabled: false };',
  'const getterProps = { get tone() { return "dark"; } };',
  'const computedProps = { [toneKey]: "dark" };',
  'export function SpreadPrecedenceView() {',
  '  return <section><Button tone="before" {...constProps} tone="after" /><Button {...{ size: "m", disabled: true }} size="l" /><Button {...makeProps()} /><Button {...getterProps} /><Button {...computedProps} /></section>;',
  '}',
  ''
].join('\n');
const spreadPrecedenceFiles = { 'src/spread-precedence.tsx': spreadPrecedenceSource };
const spreadPrecedenceProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_static_spread_precedence_graph',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: spreadPrecedenceFiles,
  workerFiles: spreadPrecedenceFiles,
  headFiles: spreadPrecedenceFiles,
  outputDiagnostics: []
});
const spreadPrecedenceProps = spreadPrecedenceProject.outputProjectSymbolGraph.jsxPropRecords.filter((record) => record.propKind === 'spread');
const constSpread = spreadPrecedenceProps.find((record) => record.propValueStaticSpreadSourceName === 'constProps');
assert.equal(Boolean(constSpread), true);
assert.deepEqual(constSpread.propValueStaticSpreadPropNames, ['tone', 'disabled']);
assert.deepEqual(constSpread.propValueStaticSpreadExplicitOverridePropNames, ['tone']);
assert.deepEqual(constSpread.propValueStaticSpreadOverridesExplicitPropNames, ['tone']);
assert.deepEqual(constSpread.propValueStaticSpreadEffectivePropNames, ['disabled']);
assert.equal(constSpread.propValueStaticSpreadPrecedenceStatus, 'static-spread-between-explicit-props');
assert.equal(constSpread.propValueRenderEquivalenceClaim, false);
const inlineSpread = spreadPrecedenceProps.find((record) => record.propValueStaticSpreadSourceKind === 'inline-object-literal');
assert.equal(Boolean(inlineSpread), true);
assert.deepEqual(inlineSpread.propValueStaticSpreadPropNames, ['size', 'disabled']);
assert.deepEqual(inlineSpread.propValueStaticSpreadExplicitOverridePropNames, ['size']);
assert.deepEqual(inlineSpread.propValueStaticSpreadEffectivePropNames, ['disabled']);
assert.equal(inlineSpread.propValueStaticSpreadPrecedenceStatus, 'static-spread-overridden-by-later-explicit-prop');
const callSpread = spreadPrecedenceProps.find((record) => record.propValueDynamicBlockerReasonCode === 'jsx-render-prop-spread-call-expression-unsupported');
assert.equal(Boolean(callSpread), true);
assert.equal(callSpread.propValueProofStatus, 'dynamic-jsx-prop-spread-unsupported');
assert.equal(callSpread.propValueRenderEquivalenceClaim, false);
const getterSpread = spreadPrecedenceProps.find((record) => record.propValueExpressionText === 'getterProps');
assert.equal(getterSpread.propValueProofStatus, 'dynamic-jsx-prop-spread-unsupported');
assert.equal(getterSpread.propValueDynamicBlockerReasonCode, 'jsx-render-prop-spread-getter-unsupported');
const computedSpread = spreadPrecedenceProps.find((record) => record.propValueExpressionText === 'computedProps');
assert.equal(computedSpread.propValueProofStatus, 'dynamic-jsx-prop-spread-unsupported');
assert.equal(computedSpread.propValueDynamicBlockerReasonCode, 'jsx-render-prop-spread-computed-key-unsupported');

const baseTone = jsxStaticSpreadEntry('tone', '"neutral"');
const baseSize = jsxStaticSpreadEntry('size', '"m"');
const workerTone = jsxStaticSpreadEntry('tone', '"accent"');
const headSize = jsxStaticSpreadEntry('size', '"l"');
const spreadEffectiveDelta = jsxDelta({
  base: jsxStaticSpreadProp('base', [baseTone, baseSize]),
  worker: jsxStaticSpreadProp('worker', [workerTone, baseSize]),
  head: jsxStaticSpreadProp('head', [baseTone, headSize]),
  output: jsxStaticSpreadProp('output', [workerTone, headSize])
});
assert.equal(projectJsxPropDeltaConflicts(spreadEffectiveDelta).length, 0);
const spreadEffectiveProof = jsxSpreadEffectivePropMergeProofAssessment({
  identityKey: 'jsx-prop#src/view.tsx#View#Button#1#Button#...spread#1',
  baseRecord: spreadEffectiveDelta.stages.base.projectSymbolGraph.jsxPropRecords[0],
  workerRecord: spreadEffectiveDelta.stages.worker.projectSymbolGraph.jsxPropRecords[0],
  headRecord: spreadEffectiveDelta.stages.head.projectSymbolGraph.jsxPropRecords[0],
  outputRecord: spreadEffectiveDelta.stages.output.projectSymbolGraph.jsxPropRecords[0]
});
assert.equal(spreadEffectiveProof.status, 'passed');
assert.deepEqual(spreadEffectiveProof.record.delta.branchMerge.workerChangedPropNames, ['tone']);
assert.deepEqual(spreadEffectiveProof.record.delta.branchMerge.headChangedPropNames, ['size']);
assert.deepEqual(spreadEffectiveProof.record.delta.branchMerge.expectedOutputEffectivePropEntries.map((entry) => entry.propName), ['size', 'tone']);
assert.equal(spreadEffectiveProof.record.effectivePropCommutationClaim, true);
assert.equal(spreadEffectiveProof.record.renderEquivalenceClaim, false);
assert.equal(spreadEffectiveProof.record.autoMergeClaim, false);

const overlapSpreadDelta = jsxDelta({
  base: jsxStaticSpreadProp('base', [baseTone, baseSize]),
  worker: jsxStaticSpreadProp('worker', [workerTone, baseSize]),
  head: jsxStaticSpreadProp('head', [jsxStaticSpreadEntry('tone', '"danger"'), baseSize]),
  output: jsxStaticSpreadProp('output', [workerTone, baseSize])
});
const overlapSpreadConflicts = projectJsxPropDeltaConflicts(overlapSpreadDelta);
assert.equal(overlapSpreadConflicts.length, 1);
assert.equal(overlapSpreadConflicts[0].details.reasonCodes.includes('jsx-spread-effective-prop-overlapping-branch-change'), true);
assert.equal(overlapSpreadConflicts[0].details.routeId, 'admit-jsx-spread-effective-prop-commutation');
assert.equal(overlapSpreadConflicts[0].details.jsxSpreadEffectivePropMergeProof.status, 'failed');
assert.equal(overlapSpreadConflicts[0].details.jsxSpreadEffectivePropMergeProof.renderEquivalenceClaim, false);

const mismatchSpreadDelta = jsxDelta({
  base: jsxStaticSpreadProp('base', [baseTone, baseSize]),
  worker: jsxStaticSpreadProp('worker', [workerTone, baseSize]),
  head: jsxStaticSpreadProp('head', [baseTone, headSize]),
  output: jsxStaticSpreadProp('output', [workerTone, baseSize])
});
const mismatchSpreadConflicts = projectJsxPropDeltaConflicts(mismatchSpreadDelta);
assert.equal(mismatchSpreadConflicts.length, 1);
assert.equal(mismatchSpreadConflicts[0].details.reasonCodes.includes('jsx-spread-effective-prop-output-effective-props-mismatch'), true);

const literalContextSource = 'const ThemeContext = React.createContext("light");\nexport function LiteralView() {\n  return <ThemeContext.Provider value="dark"><button /></ThemeContext.Provider>;\n}\n';
const literalContextFiles = { 'src/literal.tsx': literalContextSource };
const literalContextProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_literal_context_value_graph',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: literalContextFiles,
  workerFiles: literalContextFiles,
  headFiles: literalContextFiles,
  outputDiagnostics: []
});
const literalProvider = literalContextProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'ThemeContext.Provider');
assert.equal(Boolean(literalProvider?.publicContract), true);
assert.deepEqual(literalProvider.renderRiskKinds, ['context-provider-boundary', 'context-provider-value-boundary', 'render-return-boundary']);
assert.deepEqual(literalProvider.renderRiskReasonCodes, ['jsx-render-context-provider-boundary', 'jsx-render-context-provider-value-literal-evidence', 'jsx-render-return-static-evidence']);
assert.equal(literalProvider.contextValueRecord.proofStatus, 'literal-context-value-evidence');
assert.equal(literalProvider.contextValueRecord.literalValueKind, 'string');
assert.equal(literalProvider.contextValueRecord.literalValueText, '"dark"');
assert.equal(typeof literalProvider.contextValueRecord.expressionHash, 'string');
