import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

function projectFor(sourceText, id) {
  return safeMergeJsTsProject({
    id,
    language: 'tsx',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/view.tsx': sourceText },
    workerFiles: { 'src/view.tsx': sourceText },
    headFiles: { 'src/view.tsx': sourceText },
    outputDiagnostics: []
  });
}

const staticSource = [
  'export function View({ theme }) {',
  '  useEffect(() => { const token = subscribe(theme); return () => unsubscribe(token); }, [theme]);',
  '  return <section />;',
  '}',
  ''
].join('\n');
const staticProject = projectFor(staticSource, 'js_ts_project_safe_merge_jsx_static_hook_effects');
const section = staticProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'section');
assert.equal(staticProject.status, 'merged');
assert.equal(section.renderRiskReasonCodes.includes('jsx-render-hook-effect-static-callback-evidence'), true);
assert.equal(section.renderRiskReasonCodes.includes('jsx-render-hook-effect-static-cleanup-evidence'), true);
assert.equal(section.renderRiskReasonCodes.includes('jsx-render-hook-effect-runtime-equivalence-unproved'), true);
assert.equal(section.renderRiskReasonCodes.includes('jsx-render-hook-effect-unsupported'), false);
assert.equal(section.hookEffectRecords[0].proofStatus, 'static-effect-callback-source-evidence');
assert.equal(section.hookEffectRecords[0].callbackKind, 'arrow-function');
assert.equal(section.hookEffectRecords[0].callbackText.includes('subscribe(theme)'), true);
assert.equal(section.hookEffectRecords[0].cleanupProofStatus, 'static-effect-cleanup-source-evidence');
assert.equal(section.hookEffectRecords[0].cleanupReturnKind, 'arrow-function');
assert.equal(section.hookEffectRecords[0].cleanupReturnText.includes('unsubscribe(token)'), true);
assert.equal(section.hookEffectRecords[0].runtimeEquivalenceClaim, false);
assert.equal(typeof section.hookEffectRecords[0].signatureHash, 'string');

const dynamicSource = [
  'export function DynamicView({ theme }) {',
  '  useEffect(makeEffect(theme), [theme]);',
  '  return <section />;',
  '}',
  ''
].join('\n');
const dynamicProject = projectFor(dynamicSource, 'js_ts_project_safe_merge_jsx_dynamic_hook_effects');
const dynamicSection = dynamicProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'section');
assert.equal(dynamicSection.renderRiskReasonCodes.includes('jsx-render-hook-effect-unsupported'), true);
assert.equal(dynamicSection.renderRiskReasonCodes.includes('jsx-render-hook-effect-runtime-equivalence-unproved'), true);
assert.equal(dynamicSection.renderRiskReasonCodes.includes('jsx-render-hook-effect-callback-call-expression-unsupported'), true);
assert.equal(dynamicSection.hookEffectRecords[0].proofStatus, 'dynamic-effect-callback-unsupported');
assert.equal(dynamicSection.hookEffectRecords[0].dynamicCallbackText, 'makeEffect(theme)');
assert.equal(dynamicSection.hookEffectRecords[0].dynamicCallbackKind, 'call-expression');
assert.equal(dynamicSection.hookEffectRecords[0].dynamicCallbackBlockerReasonCode, 'jsx-render-hook-effect-callback-call-expression-unsupported');
assert.equal(dynamicSection.hookEffectRecords[0].callbackText, undefined);
assert.equal(dynamicSection.hookEffectRecords[0].runtimeEquivalenceClaim, false);

const referenceSource = [
  'export function ReferenceView({ effectRef }) {',
  '  useLayoutEffect(effectRef, [effectRef]);',
  '  return <section />;',
  '}',
  ''
].join('\n');
const referenceProject = projectFor(referenceSource, 'js_ts_project_safe_merge_jsx_reference_hook_effects');
const referenceSection = referenceProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'section');
assert.equal(referenceSection.hookEffectRecords[0].proofStatus, 'static-effect-callback-source-evidence');
assert.equal(referenceSection.hookEffectRecords[0].callbackKind, 'reference');
assert.equal(referenceSection.hookEffectRecords[0].callbackText, 'effectRef');
assert.equal(referenceSection.hookEffectRecords[0].callbackReferenceRoot, 'effectRef');
assert.deepEqual(referenceSection.hookEffectRecords[0].callbackReferencePath, ['effectRef']);
assert.equal(referenceSection.renderRiskReasonCodes.includes('jsx-render-hook-effect-static-callback-evidence'), true);

const optionalReferenceSource = [
  'export function OptionalReferenceView({ effects }) {',
  '  useInsertionEffect(effects?.mount, [effects]);',
  '  return <section />;',
  '}',
  ''
].join('\n');
const optionalReferenceProject = projectFor(optionalReferenceSource, 'js_ts_project_safe_merge_jsx_optional_reference_hook_effects');
const optionalReferenceSection = optionalReferenceProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'section');
assert.equal(optionalReferenceSection.renderRiskReasonCodes.includes('jsx-render-hook-effect-static-optional-callback-evidence'), true);
assert.equal(optionalReferenceSection.hookEffectRecords[0].proofStatus, 'static-effect-callback-source-evidence');
assert.equal(optionalReferenceSection.hookEffectRecords[0].callbackKind, 'optional-reference');
assert.equal(optionalReferenceSection.hookEffectRecords[0].callbackOptionalReference, true);
assert.deepEqual(optionalReferenceSection.hookEffectRecords[0].callbackReferencePath, ['effects', 'mount']);
assert.deepEqual(optionalReferenceSection.hookEffectRecords[0].callbackOptionalReferenceSegments, ['mount']);
assert.deepEqual(optionalReferenceSection.hookEffectRecords[0].callbackOptionalReferenceSegmentIndexes, [1]);
assert.equal(optionalReferenceSection.hookEffectRecords[0].callbackOptionalNullishBoundaryCount, 1);

const dynamicCleanupSource = [
  'export function DynamicCleanupView({ cleanups, current }) {',
  '  useEffect(() => { return cleanups[current]; }, [cleanups, current]);',
  '  return <section />;',
  '}',
  ''
].join('\n');
const dynamicCleanupProject = projectFor(dynamicCleanupSource, 'js_ts_project_safe_merge_jsx_dynamic_cleanup_hook_effects');
const dynamicCleanupSection = dynamicCleanupProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'section');
assert.equal(dynamicCleanupSection.renderRiskReasonCodes.includes('jsx-render-hook-effect-unsupported'), true);
assert.equal(dynamicCleanupSection.renderRiskReasonCodes.includes('jsx-render-hook-effect-cleanup-computed-reference-unsupported'), true);
assert.equal(dynamicCleanupSection.hookEffectRecords[0].cleanupProofStatus, 'dynamic-effect-cleanup-unsupported');
assert.equal(dynamicCleanupSection.hookEffectRecords[0].dynamicCleanupReturnText, 'cleanups[current]');
assert.equal(dynamicCleanupSection.hookEffectRecords[0].dynamicCleanupReturnKind, 'computed-reference');
assert.equal(dynamicCleanupSection.hookEffectRecords[0].dynamicCleanupReturnBlockerReasonCode, 'jsx-render-hook-effect-cleanup-computed-reference-unsupported');
