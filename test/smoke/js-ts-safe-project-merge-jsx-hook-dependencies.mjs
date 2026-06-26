import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const sourceText = [
  'export function View({ theme, contexts, current }) {',
  '  const tone = useMemo(() => theme.tone, [theme, theme.palette.primary, contexts[current], computeTone(theme)]);',
  '  return <button data-tone={tone} />;',
  '}',
  ''
].join('\n');
const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_hook_dependencies',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': sourceText },
  workerFiles: { 'src/view.tsx': sourceText },
  headFiles: { 'src/view.tsx': sourceText },
  outputDiagnostics: []
});
assert.equal(project.status, 'merged');
const button = project.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'button');
assert.ok(button);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-hook-dependency-array-unsupported'), true);
assert.equal(button.hookDependencyCount, 1);
assert.deepEqual(button.hookDependencyRecords[0].dependencyTexts, [
  'theme',
  'theme.palette.primary',
  'contexts[current]',
  'computeTone(theme)'
]);
assert.equal(button.hookDependencyRecords[0].dependencyRecords[0].proofStatus, 'static-hook-dependency-evidence');
assert.equal(button.hookDependencyRecords[0].dependencyRecords[0].valueKind, 'reference');
assert.deepEqual(button.hookDependencyRecords[0].dependencyRecords[1].referencePath, ['theme', 'palette', 'primary']);
assert.equal(button.hookDependencyRecords[0].dependencyRecords[2].proofStatus, 'dynamic-hook-dependency-unsupported');
assert.equal(button.hookDependencyRecords[0].dependencyRecords[2].dynamicDependencyKind, 'computed-reference');
assert.equal(button.hookDependencyRecords[0].dependencyRecords[2].dynamicBlockerReasonCode, 'jsx-render-hook-dependency-computed-reference-unsupported');
assert.equal(button.hookDependencyRecords[0].dependencyRecords[3].dynamicDependencyKind, 'call-expression');
assert.equal(button.hookDependencyRecords[0].proofStatus, 'dynamic-dependency-array-unsupported');
assert.deepEqual(button.hookDependencyRecords[0].dynamicDependencyTexts, ['contexts[current]', 'computeTone(theme)']);
assert.deepEqual(button.hookDependencyRecords[0].dynamicDependencyReasonCodes, [
  'jsx-render-hook-dependency-computed-reference-unsupported',
  'jsx-render-hook-dependency-call-expression-unsupported'
]);
assert.equal(typeof button.hookDependencyRecords[0].dependencyArrayHash, 'string');
assert.equal(typeof button.hookDependencyRecords[0].dependencySignatureHash, 'string');

const staticOnlySource = [
  'export function StaticView({ theme }) {',
  '  const tone = useMemo(() => theme.tone, [theme, theme.palette?.primary, theme?.scale?.sm]);',
  '  return <button data-tone={tone} />;',
  '}',
  ''
].join('\n');
const staticProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_static_hook_dependencies',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': staticOnlySource },
  workerFiles: { 'src/view.tsx': staticOnlySource },
  headFiles: { 'src/view.tsx': staticOnlySource },
  outputDiagnostics: []
});
const staticButton = staticProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'button');
assert.equal(staticButton.renderRiskReasonCodes.includes('jsx-render-hook-dependency-array-static-evidence'), true);
assert.equal(staticButton.renderRiskReasonCodes.includes('jsx-render-hook-dependency-array-unsupported'), false);
assert.equal(staticButton.hookDependencyRecords[0].proofStatus, 'static-dependency-array-evidence');
assert.deepEqual(staticButton.hookDependencyRecords[0].dependencyTexts, ['theme', 'theme.palette?.primary', 'theme?.scale?.sm']);
assert.equal(staticButton.hookDependencyRecords[0].dependencyRecords[1].reasonCode, 'jsx-render-hook-dependency-static-optional-reference-evidence');
assert.deepEqual(staticButton.hookDependencyRecords[0].dependencyRecords[1].referencePath, ['theme', 'palette', 'primary']);
assert.deepEqual(staticButton.hookDependencyRecords[0].dependencyRecords[1].optionalReferenceSegments, ['primary']);
assert.deepEqual(staticButton.hookDependencyRecords[0].dependencyRecords[1].optionalReferenceSegmentIndexes, [2]);
assert.equal(staticButton.hookDependencyRecords[0].dependencyRecords[2].optionalNullishBoundaryCount, 2);
