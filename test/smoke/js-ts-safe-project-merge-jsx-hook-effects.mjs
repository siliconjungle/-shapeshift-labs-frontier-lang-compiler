import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { jsxHookEffectSourceDelta } from '../../src/js-ts-safe-project-merge-jsx-hook-effect-proof.js';
import { jsxHookEffectRisk, jsxRenderRiskDelta } from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

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

const hookEffectProofRecords = {
  base: jsxHookEffectRisk('base', 'effect:callback:base', 'effect:cleanup:base'),
  worker: jsxHookEffectRisk('worker', 'effect:callback:worker', 'effect:cleanup:base'),
  head: jsxHookEffectRisk('head', 'effect:callback:base', 'effect:cleanup:head'),
  output: jsxHookEffectRisk('output', 'effect:callback:worker', 'effect:cleanup:head')
};
const hookEffectProofDelta = jsxRenderRiskDelta(hookEffectProofRecords);
const missingProofConflicts = projectGraphDeltaConflicts(hookEffectProofDelta);
assert.equal(missingProofConflicts.length, 1);
assert.equal(missingProofConflicts[0].details.reasonCodes.includes('jsx-render-hook-effect-source-proof-missing'), true);
assert.equal(missingProofConflicts[0].details.routeId, 'prove-jsx-hook-effect-callback-cleanup-source-preservation');
assert.equal(missingProofConflicts[0].details.jsxHookEffectSourceProof.hookEffectSourcePreservationClaim, false);

const hookEffectSourceProof = sourceProof(missingProofConflicts[0].details.identityKey, hookEffectProofRecords, {
  callbackOrigin: 'worker',
  cleanupReturnOrigin: 'head'
});
const passedProofConflicts = projectGraphDeltaConflicts(hookEffectProofDelta, {
  evidence: [hookEffectSourceProof]
});
assert.equal(passedProofConflicts.length, 0);

const staleProofConflicts = projectGraphDeltaConflicts(hookEffectProofDelta, {
  evidence: [{ ...hookEffectSourceProof, outputSourceHash: 'stale-output-source' }]
});
assert.equal(staleProofConflicts.length, 1);
assert.equal(staleProofConflicts[0].details.reasonCodes.includes('jsx-render-hook-effect-source-proof-source-hash-mismatch'), true);
assert.equal(staleProofConflicts[0].details.runtimeEquivalenceClaim, false);

const claimBearingProofConflicts = projectGraphDeltaConflicts(hookEffectProofDelta, {
  evidence: [{ ...hookEffectSourceProof, runtimeEquivalenceClaim: true }]
});
assert.equal(claimBearingProofConflicts.length, 1);
assert.equal(claimBearingProofConflicts[0].details.reasonCodes.includes('jsx-render-hook-effect-source-proof-claim-flags-missing'), true);

const dynamicHookEffectRecords = {
  base: hookEffectProofRecords.base,
  worker: dynamicHookEffectRisk('worker', 'effect:cleanup:base'),
  head: hookEffectProofRecords.head,
  output: dynamicHookEffectRisk('output', 'effect:cleanup:head')
};
const dynamicHookEffectDelta = jsxRenderRiskDelta(dynamicHookEffectRecords);
const dynamicHookEffectExpected = jsxHookEffectSourceDelta({
  identityKey: missingProofConflicts[0].details.identityKey,
  baseRecord: dynamicHookEffectRecords.base,
  workerRecord: dynamicHookEffectRecords.worker,
  headRecord: dynamicHookEffectRecords.head,
  outputRecord: dynamicHookEffectRecords.output
});
const dynamicProofConflicts = projectGraphDeltaConflicts(dynamicHookEffectDelta, {
  evidence: [sourceProof(missingProofConflicts[0].details.identityKey, dynamicHookEffectRecords, {
    callbackOrigin: 'worker',
    cleanupReturnOrigin: 'head',
    expected: dynamicHookEffectExpected
  })]
});
assert.equal(dynamicProofConflicts.length, 1);
assert.equal(dynamicProofConflicts[0].details.reasonCodes.includes('jsx-render-hook-effect-source-proof-dynamic-effect-unsupported'), true);
assert.equal(dynamicProofConflicts[0].details.jsxHookEffectSourceProof.hookEffectSourcePreservationClaim, false);

function sourceProof(identityKey, records, origins) {
  const expected = origins.expected ?? jsxHookEffectSourceDelta({
    identityKey,
    baseRecord: records.base,
    workerRecord: records.worker,
    headRecord: records.head,
    outputRecord: records.output
  });
  return {
    schema: 'frontier.lang.jsxHookEffectSourceProof.v1',
    kind: 'frontier.lang.jsxHookEffectSourceProof',
    status: 'passed',
    sourcePath: expected.sourcePath,
    identityKey,
    baseSourceHash: expected.baseSourceHash,
    workerSourceHash: expected.workerSourceHash,
    headSourceHash: expected.headSourceHash,
    outputSourceHash: expected.outputSourceHash,
    publicOwnerName: expected.publicOwnerName,
    tagName: expected.tagName,
    tagKey: expected.tagKey,
    hookName: expected.hookName,
    hookOrdinal: expected.hookOrdinal,
    callbackOrigin: origins.callbackOrigin,
    callbackHash: expected[origins.callbackOrigin].callbackHash,
    outputCallbackHash: expected.output.callbackHash,
    cleanupReturnOrigin: origins.cleanupReturnOrigin,
    cleanupReturnHash: expected[origins.cleanupReturnOrigin].cleanupReturnHash,
    outputCleanupReturnHash: expected.output.cleanupReturnHash,
    hookEffectSourcePreservationHash: expected.hookEffectSourcePreservationHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    hookEffectSourcePreservationClaim: true,
    claimScope: 'static-hook-effect-callback-cleanup-source-preservation-only'
  };
}

function dynamicHookEffectRisk(stage, cleanupReturnHash) {
  const record = jsxHookEffectRisk(stage, `effect:callback:${stage}`, cleanupReturnHash);
  return {
    ...record,
    renderRiskReasonCodes: [
      ...record.renderRiskReasonCodes,
      'jsx-render-hook-effect-unsupported',
      'jsx-render-hook-effect-callback-call-expression-unsupported'
    ],
    hookEffectRecords: [{
      ...record.hookEffectRecords[0],
      proofStatus: 'dynamic-effect-callback-unsupported',
      callbackKind: undefined,
      callbackText: undefined,
      dynamicCallbackText: 'makeEffect(theme)',
      dynamicCallbackKind: 'call-expression',
      dynamicCallbackBlockerReasonCode: 'jsx-render-hook-effect-callback-call-expression-unsupported',
      signatureHash: `hook-effect-signature:${stage}:dynamic:${cleanupReturnHash}`
    }],
    hookEffectSignatureHash: `hook-effect:${stage}:dynamic:${cleanupReturnHash}`,
    renderRiskSignatureHash: `render-risk:hook-effect:${stage}:dynamic`
  };
}
