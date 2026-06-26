import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const sourceText = [
  'const ThemeContext = React.createContext({ tone: "neutral" });',
  'function Button() { return <button />; }',
  'export function StaticObjectView({ theme, featureFlag }) {',
  '  return <ThemeContext.Provider value={{ tone: theme.tone, flags: [featureFlag, true], mode: "dark" }}><Button /></ThemeContext.Provider>;',
  '}',
  'export function StaticArrayView({ theme, featureFlag }) {',
  '  return <ThemeContext.Provider value={[theme.tone, featureFlag, "dark"]}><Button /></ThemeContext.Provider>;',
  '}',
  'export function StaticReferenceView({ theme }) {',
  '  return <ThemeContext.Provider value={theme.palette}><Button /></ThemeContext.Provider>;',
  '}',
  'export function StaticOptionalReferenceView({ theme }) {',
  '  return <ThemeContext.Provider value={theme?.palette}><Button /></ThemeContext.Provider>;',
  '}',
  'export function StaticDeepOptionalReferenceView({ theme }) {',
  '  return <ThemeContext.Provider value={theme?.colors?.primary}><Button /></ThemeContext.Provider>;',
  '}',
  'export function ComputedDynamicView({ theme, mode }) {',
  '  return <ThemeContext.Provider value={theme[mode]}><Button /></ThemeContext.Provider>;',
  '}',
  'export function OptionalComputedDynamicView({ theme, mode }) {',
  '  return <ThemeContext.Provider value={theme?.[mode]}><Button /></ThemeContext.Provider>;',
  '}',
  'export function OptionalCallDynamicView({ theme }) {',
  '  return <ThemeContext.Provider value={computeTheme?.(theme)}><Button /></ThemeContext.Provider>;',
  '}',
  'export function DynamicView({ theme }) {',
  '  return <ThemeContext.Provider value={computeTheme(theme)}><Button /></ThemeContext.Provider>;',
  '}',
  ''
].join('\n');

const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_context_values',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/context-values.tsx': sourceText },
  workerFiles: { 'src/context-values.tsx': sourceText },
  headFiles: { 'src/context-values.tsx': sourceText },
  outputDiagnostics: []
});

assert.equal(project.status, 'merged');
const providers = project.outputProjectSymbolGraph.jsxElementRecords.filter((record) => record.tagName === 'ThemeContext.Provider');
assert.equal(providers.length, 9);

const staticObject = providerForOwner('StaticObjectView');
assert.equal(staticObject.contextValueRecord.proofStatus, 'static-data-context-value-evidence');
assert.equal(staticObject.contextValueRecord.staticValueKind, 'object');
assert.equal(staticObject.contextValueRecord.staticValueText.includes('theme.tone'), true);
assert.equal(staticObject.renderRiskReasonCodes.includes('jsx-render-context-provider-value-static-data-evidence'), true);
assert.equal(staticObject.renderRiskReasonCodes.includes('jsx-render-context-provider-value-unsupported'), false);
assert.equal(typeof staticObject.contextValueExpressionHash, 'string');
assert.equal(typeof staticObject.contextValueSignatureHash, 'string');

const staticArray = providerForOwner('StaticArrayView');
assert.equal(staticArray.contextValueRecord.proofStatus, 'static-data-context-value-evidence');
assert.equal(staticArray.contextValueRecord.staticValueKind, 'array');
assert.equal(staticArray.contextValueRecord.staticValueText.includes('featureFlag'), true);
assert.equal(staticArray.renderRiskReasonCodes.includes('jsx-render-context-provider-value-static-data-evidence'), true);

const staticReference = providerForOwner('StaticReferenceView');
assert.equal(staticReference.contextValueRecord.proofStatus, 'static-reference-context-value-evidence');
assert.equal(staticReference.contextValueRecord.staticValueKind, 'reference');
assert.equal(staticReference.contextValueRecord.staticValueText, 'theme.palette');
assert.equal(staticReference.contextValueRecord.staticReferenceRoot, 'theme');
assert.deepEqual(staticReference.contextValueRecord.staticReferencePath, ['theme', 'palette']);
assert.deepEqual(staticReference.contextValueRecord.staticReferenceMemberPath, ['palette']);
assert.equal(staticReference.contextValueRecord.referenceBindingStatus, 'static-reference-binding-evidence');
assert.equal(staticReference.contextValueRecord.referenceBindingScope, 'jsx-context-provider-value-reference');
assert.equal(typeof staticReference.contextValueRecord.referenceBindingHash, 'string');
assert.equal(staticReference.renderRiskReasonCodes.includes('jsx-render-context-provider-value-static-reference-evidence'), true);

const staticOptionalReference = providerForOwner('StaticOptionalReferenceView');
assert.equal(staticOptionalReference.contextValueRecord.proofStatus, 'static-optional-reference-context-value-evidence');
assert.equal(staticOptionalReference.contextValueRecord.reasonCode, 'jsx-render-context-provider-value-static-optional-reference-evidence');
assert.equal(staticOptionalReference.contextValueRecord.staticValueKind, 'optional-reference');
assert.equal(staticOptionalReference.contextValueRecord.staticValueText, 'theme?.palette');
assert.equal(staticOptionalReference.contextValueRecord.staticReferenceRoot, 'theme');
assert.deepEqual(staticOptionalReference.contextValueRecord.staticReferencePath, ['theme', 'palette']);
assert.deepEqual(staticOptionalReference.contextValueRecord.staticReferenceMemberPath, ['palette']);
assert.equal(staticOptionalReference.contextValueRecord.optionalReference, true);
assert.deepEqual(staticOptionalReference.contextValueRecord.optionalReferenceSegments, ['palette']);
assert.deepEqual(staticOptionalReference.contextValueRecord.optionalReferenceSegmentIndexes, [1]);
assert.equal(staticOptionalReference.contextValueRecord.optionalNullishBoundaryCount, 1);
assert.equal(staticOptionalReference.contextValueRecord.referenceBindingStatus, 'static-optional-reference-binding-evidence');
assert.equal(staticOptionalReference.contextValueRecord.referenceBindingScope, 'jsx-context-provider-value-optional-reference');
assert.equal(staticOptionalReference.renderRiskReasonCodes.includes('jsx-render-context-provider-value-static-optional-reference-evidence'), true);

const staticDeepOptionalReference = providerForOwner('StaticDeepOptionalReferenceView');
assert.equal(staticDeepOptionalReference.contextValueRecord.proofStatus, 'static-optional-reference-context-value-evidence');
assert.equal(staticDeepOptionalReference.contextValueRecord.staticValueText, 'theme?.colors?.primary');
assert.deepEqual(staticDeepOptionalReference.contextValueRecord.staticReferencePath, ['theme', 'colors', 'primary']);
assert.deepEqual(staticDeepOptionalReference.contextValueRecord.optionalReferenceSegments, ['colors', 'primary']);
assert.deepEqual(staticDeepOptionalReference.contextValueRecord.optionalReferenceSegmentIndexes, [1, 2]);
assert.equal(staticDeepOptionalReference.contextValueRecord.optionalNullishBoundaryCount, 2);

const computedDynamicValue = providerForOwner('ComputedDynamicView');
assert.equal(computedDynamicValue.contextValueRecord.proofStatus, 'dynamic-context-value-unsupported');
assert.equal(computedDynamicValue.contextValueRecord.reasonCode, 'jsx-render-context-provider-value-unsupported');
assert.equal(computedDynamicValue.contextValueRecord.dynamicValueKind, 'computed-reference');
assert.equal(computedDynamicValue.contextValueRecord.dynamicValueText, 'theme[mode]');
assert.equal(computedDynamicValue.contextValueRecord.dynamicBlockerReasonCode, 'jsx-render-context-provider-value-computed-reference-unsupported');
assert.equal(computedDynamicValue.renderRiskReasonCodes.includes('jsx-render-context-provider-value-unsupported'), true);

const optionalComputedDynamicValue = providerForOwner('OptionalComputedDynamicView');
assert.equal(optionalComputedDynamicValue.contextValueRecord.proofStatus, 'dynamic-context-value-unsupported');
assert.equal(optionalComputedDynamicValue.contextValueRecord.dynamicValueKind, 'computed-reference');
assert.equal(optionalComputedDynamicValue.contextValueRecord.dynamicBlockerReasonCode, 'jsx-render-context-provider-value-computed-reference-unsupported');

const optionalCallDynamicValue = providerForOwner('OptionalCallDynamicView');
assert.equal(optionalCallDynamicValue.contextValueRecord.proofStatus, 'dynamic-context-value-unsupported');
assert.equal(optionalCallDynamicValue.contextValueRecord.dynamicValueKind, 'call-expression');
assert.equal(optionalCallDynamicValue.contextValueRecord.dynamicBlockerReasonCode, 'jsx-render-context-provider-value-call-expression-unsupported');

const dynamicValue = providerForOwner('DynamicView');
assert.equal(dynamicValue.contextValueRecord.proofStatus, 'dynamic-context-value-unsupported');
assert.equal(dynamicValue.contextValueRecord.dynamicValueKind, 'call-expression');
assert.equal(dynamicValue.contextValueRecord.dynamicBlockerReasonCode, 'jsx-render-context-provider-value-call-expression-unsupported');
assert.equal(dynamicValue.renderRiskReasonCodes.includes('jsx-render-context-provider-value-unsupported'), true);

function providerForOwner(ownerName) {
  const provider = providers.find((record) => record.publicOwnerName === ownerName);
  assert.ok(provider, ownerName);
  return provider;
}
