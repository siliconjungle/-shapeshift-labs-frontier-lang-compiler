import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

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
