import { assert } from './helpers.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import {
  jsxContextConsumerRisk,
  jsxEventHandlerRisk,
  jsxHookDependencyRisk,
  jsxRenderRiskDelta
} from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

const hookDependencyDelta = jsxRenderRiskDelta({
  base: jsxHookDependencyRisk('base', ['theme']),
  worker: jsxHookDependencyRisk('worker', ['theme', 'locale']),
  head: jsxHookDependencyRisk('head', ['theme', 'featureFlag']),
  output: jsxHookDependencyRisk('output', ['theme', 'locale', 'featureFlag'])
});
const hookDependencyMissing = projectGraphDeltaConflicts(hookDependencyDelta);
assert.equal(hookDependencyMissing.length, 1);
assert.equal(hookDependencyMissing[0].details.routeId, 'prove-jsx-hook-dependency-array-source-preservation');
assert.equal(hookDependencyMissing[0].details.reasonCodes.includes('jsx-render-hook-dependency-source-proof-missing'), true);
assert.equal(hookDependencyMissing[0].details.jsxHookDependencySourceProof.hookDependencySourcePreservationClaim, false);

const hookDependencyExpected = hookDependencyMissing[0].details.jsxHookDependencySourceProof.expected;
const hookDependencyProof = hookDependencyProofFor(hookDependencyExpected);
assert.equal(projectGraphDeltaConflicts(hookDependencyDelta, { jsxHookDependencySourceProof: hookDependencyProof }).length, 0);

const hookDependencyStale = projectGraphDeltaConflicts(hookDependencyDelta, {
  jsxHookDependencySourceProof: { ...hookDependencyProof, outputSourceHash: 'source:stale-output' }
});
assert.equal(hookDependencyStale.length, 1);
assert.equal(hookDependencyStale[0].details.reasonCodes.includes('jsx-render-hook-dependency-source-proof-source-hash-mismatch'), true);

const hookDependencyBroadClaim = projectGraphDeltaConflicts(hookDependencyDelta, {
  jsxHookDependencySourceProofs: [{ ...hookDependencyProof, renderEquivalenceClaim: true }]
});
assert.equal(hookDependencyBroadClaim.length, 1);
assert.equal(hookDependencyBroadClaim[0].details.reasonCodes.includes('jsx-render-hook-dependency-source-proof-claim-flags-missing'), true);

const hookDependencyRemovalDelta = jsxRenderRiskDelta({
  base: jsxHookDependencyRisk('base', ['theme']),
  worker: jsxHookDependencyRisk('worker', ['theme', 'locale']),
  head: jsxHookDependencyRisk('head', []),
  output: jsxHookDependencyRisk('output', ['locale'])
});
const hookDependencyRemovalMissing = projectGraphDeltaConflicts(hookDependencyRemovalDelta);
const hookDependencyRemovalProof = hookDependencyProofFor(hookDependencyRemovalMissing[0].details.jsxHookDependencySourceProof.expected);
const hookDependencyRemovalBlocked = projectGraphDeltaConflicts(hookDependencyRemovalDelta, {
  jsxHookDependencySourceProof: hookDependencyRemovalProof
});
assert.equal(hookDependencyRemovalBlocked.length, 1);
assert.equal(hookDependencyRemovalBlocked[0].details.reasonCodes.includes('jsx-render-hook-dependency-source-proof-non-additive-dependency-change'), true);

const baseClickSignature = 'event-handler:stable:onClick:handler:base:click';
const eventHandlerDelta = jsxRenderRiskDelta({
  base: jsxEventHandlerRisk('base', [{ propName: 'onClick', expressionHash: 'handler:base:click', signatureHash: baseClickSignature }]),
  worker: jsxEventHandlerRisk('worker', [
    { propName: 'onClick', expressionHash: 'handler:base:click', signatureHash: baseClickSignature },
    { propName: 'onMouseEnter', expressionHash: 'handler:worker:hover' }
  ]),
  head: jsxEventHandlerRisk('head', [
    { propName: 'onClick', expressionHash: 'handler:base:click', signatureHash: baseClickSignature },
    { propName: 'onKeyDown', expressionHash: 'handler:head:key' }
  ]),
  output: jsxEventHandlerRisk('output', [
    { propName: 'onClick', expressionHash: 'handler:base:click', signatureHash: baseClickSignature },
    { propName: 'onMouseEnter', expressionHash: 'handler:worker:hover', signatureHash: 'event-handler:worker:onMouseEnter:handler:worker:hover' },
    { propName: 'onKeyDown', expressionHash: 'handler:head:key', signatureHash: 'event-handler:head:onKeyDown:handler:head:key' }
  ])
});
const eventHandlerMissing = projectGraphDeltaConflicts(eventHandlerDelta);
assert.equal(eventHandlerMissing.length, 1);
assert.equal(eventHandlerMissing[0].details.routeId, 'prove-jsx-event-handler-source-preservation');
assert.equal(eventHandlerMissing[0].details.reasonCodes.includes('jsx-render-event-handler-source-proof-missing'), true);
assert.equal(eventHandlerMissing[0].details.jsxEventHandlerSourceProof.eventHandlerSourcePreservationClaim, false);

const eventHandlerExpected = eventHandlerMissing[0].details.jsxEventHandlerSourceProof.expected;
const eventHandlerProof = eventHandlerProofFor(eventHandlerExpected);
assert.equal(projectGraphDeltaConflicts(eventHandlerDelta, { evidence: [eventHandlerProof] }).length, 0);

const eventHandlerStale = projectGraphDeltaConflicts(eventHandlerDelta, {
  jsxEventHandlerSourceProof: { ...eventHandlerProof, outputSourceHash: 'source:stale-output' }
});
assert.equal(eventHandlerStale.length, 1);
assert.equal(eventHandlerStale[0].details.reasonCodes.includes('jsx-render-event-handler-source-proof-source-hash-mismatch'), true);

const eventHandlerBroadClaim = projectGraphDeltaConflicts(eventHandlerDelta, {
  jsxEventHandlerSourceProof: { ...eventHandlerProof, runtimeEquivalenceClaim: true }
});
assert.equal(eventHandlerBroadClaim.length, 1);
assert.equal(eventHandlerBroadClaim[0].details.reasonCodes.includes('jsx-render-event-handler-source-proof-claim-flags-missing'), true);

const eventHandlerModificationDelta = jsxRenderRiskDelta({
  base: jsxEventHandlerRisk('base', [{ propName: 'onClick', expressionHash: 'handler:base:click', signatureHash: baseClickSignature }]),
  worker: jsxEventHandlerRisk('worker', [
    { propName: 'onClick', expressionHash: 'handler:base:click', signatureHash: baseClickSignature },
    { propName: 'onMouseEnter', expressionHash: 'handler:worker:hover' }
  ]),
  head: jsxEventHandlerRisk('head', [
    { propName: 'onClick', expressionHash: 'handler:head:click' },
    { propName: 'onKeyDown', expressionHash: 'handler:head:key' }
  ]),
  output: jsxEventHandlerRisk('output', [
    { propName: 'onClick', expressionHash: 'handler:head:click', signatureHash: 'event-handler:head:onClick:handler:head:click' },
    { propName: 'onMouseEnter', expressionHash: 'handler:worker:hover', signatureHash: 'event-handler:worker:onMouseEnter:handler:worker:hover' },
    { propName: 'onKeyDown', expressionHash: 'handler:head:key', signatureHash: 'event-handler:head:onKeyDown:handler:head:key' }
  ])
});
const eventHandlerModificationMissing = projectGraphDeltaConflicts(eventHandlerModificationDelta);
const eventHandlerModificationProof = eventHandlerProofFor(eventHandlerModificationMissing[0].details.jsxEventHandlerSourceProof.expected);
const eventHandlerModificationBlocked = projectGraphDeltaConflicts(eventHandlerModificationDelta, {
  jsxEventHandlerSourceProof: eventHandlerModificationProof
});
assert.equal(eventHandlerModificationBlocked.length, 1);
assert.equal(eventHandlerModificationBlocked[0].details.reasonCodes.includes('jsx-render-event-handler-source-proof-existing-handler-modification'), true);

const contextConsumerDelta = jsxRenderRiskDelta({
  base: jsxContextConsumerRisk('base', ['ThemeContext']),
  worker: jsxContextConsumerRisk('worker', ['ThemeContext', 'LocaleContext']),
  head: jsxContextConsumerRisk('head', ['ThemeContext', 'FeatureFlagContext']),
  output: jsxContextConsumerRisk('output', ['ThemeContext', 'LocaleContext', 'FeatureFlagContext'])
});
const contextConsumerMissing = projectGraphDeltaConflicts(contextConsumerDelta);
assert.equal(contextConsumerMissing.length, 1);
assert.equal(contextConsumerMissing[0].details.routeId, 'prove-jsx-context-wrapper-source-preservation');
assert.equal(contextConsumerMissing[0].details.reasonCodes.includes('jsx-render-context-wrapper-source-proof-missing'), true);
assert.equal(contextConsumerMissing[0].details.jsxContextWrapperSourceProof.contextWrapperSourcePreservationClaim, false);

const contextConsumerExpected = contextConsumerMissing[0].details.jsxContextWrapperSourceProof.expected;
const contextConsumerProof = contextWrapperProofFor(contextConsumerExpected);
assert.equal(projectGraphDeltaConflicts(contextConsumerDelta, { jsxContextWrapperSourceProof: contextConsumerProof }).length, 0);

const contextConsumerStale = projectGraphDeltaConflicts(contextConsumerDelta, {
  jsxContextWrapperSourceProof: { ...contextConsumerProof, outputSourceHash: 'source:stale-output' }
});
assert.equal(contextConsumerStale.length, 1);
assert.equal(contextConsumerStale[0].details.reasonCodes.includes('jsx-render-context-wrapper-source-proof-source-hash-mismatch'), true);

const contextConsumerIdentityMismatch = projectGraphDeltaConflicts(contextConsumerDelta, {
  jsxContextWrapperSourceProof: { ...contextConsumerProof, publicOwnerName: 'OtherView' }
});
assert.equal(contextConsumerIdentityMismatch.length, 1);
assert.equal(contextConsumerIdentityMismatch[0].details.reasonCodes.includes('jsx-render-context-wrapper-source-proof-identity-mismatch'), true);

const wrapperDelta = jsxRenderRiskDelta({
  base: jsxRenderWrapperRisk('base', ['memo']),
  worker: jsxRenderWrapperRisk('worker', ['memo', 'forwardRef']),
  head: jsxRenderWrapperRisk('head', ['observer']),
  output: jsxRenderWrapperRisk('output', ['observer', 'forwardRef'])
});
const wrapperMissing = projectGraphDeltaConflicts(wrapperDelta);
assert.equal(wrapperMissing.length, 1);
assert.equal(wrapperMissing[0].details.routeId, 'prove-jsx-context-wrapper-source-preservation');
assert.equal(wrapperMissing[0].details.reasonCodes.includes('jsx-render-context-wrapper-source-proof-missing'), true);
assert.equal(wrapperMissing[0].details.jsxContextWrapperSourceProof.expected.output.componentWrapperNames.includes('forwardRef'), true);

const wrapperProof = contextWrapperProofFor(wrapperMissing[0].details.jsxContextWrapperSourceProof.expected);
assert.equal(projectGraphDeltaConflicts(wrapperDelta, { evidence: [wrapperProof] }).length, 0);

const wrapperBroadClaim = projectGraphDeltaConflicts(wrapperDelta, {
  jsxContextWrapperSourceProofs: [{ ...wrapperProof, renderEquivalenceClaim: true }]
});
assert.equal(wrapperBroadClaim.length, 1);
assert.equal(wrapperBroadClaim[0].details.reasonCodes.includes('jsx-render-context-wrapper-source-proof-claim-flags-missing'), true);

function hookDependencyProofFor(delta) {
  const workerAddedDependencyTexts = delta.worker.dependencyTexts.filter((item) => !delta.base.dependencyTexts.includes(item));
  const headAddedDependencyTexts = delta.head.dependencyTexts.filter((item) => !delta.base.dependencyTexts.includes(item));
  return {
    schema: 'frontier.lang.jsxHookDependencySourceProof.v1',
    kind: 'frontier.lang.jsxHookDependencySourceProof',
    status: 'passed',
    sourcePath: delta.sourcePath,
    identityKey: delta.identityKey,
    publicOwnerName: delta.publicOwnerName,
    tagName: delta.tagName,
    tagKey: delta.tagKey,
    hookName: delta.hookName,
    hookOrdinal: delta.hookOrdinal,
    baseSourceHash: delta.baseSourceHash,
    workerSourceHash: delta.workerSourceHash,
    headSourceHash: delta.headSourceHash,
    outputSourceHash: delta.outputSourceHash,
    baseDependencyArrayHash: delta.base.dependencyArrayHash,
    workerDependencyArrayHash: delta.worker.dependencyArrayHash,
    headDependencyArrayHash: delta.head.dependencyArrayHash,
    outputDependencyArrayHash: delta.output.dependencyArrayHash,
    outputDependencySignatureHash: delta.output.dependencySignatureHash,
    outputDependencyTexts: delta.output.dependencyTexts,
    workerAddedDependencyTexts,
    headAddedDependencyTexts,
    hookDependencySourcePreservationHash: delta.hookDependencySourcePreservationHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    hookDependencySourcePreservationClaim: true,
    claimScope: 'static-hook-dependency-array-source-preservation-only'
  };
}

function contextWrapperProofFor(delta) {
  return {
    schema: 'frontier.lang.jsxContextWrapperSourceProof.v1',
    kind: 'frontier.lang.jsxContextWrapperSourceProof',
    status: 'passed',
    sourcePath: delta.sourcePath,
    identityKey: delta.identityKey,
    publicOwnerName: delta.publicOwnerName,
    tagName: delta.tagName,
    tagKey: delta.tagKey,
    baseSourceHash: delta.baseSourceHash,
    workerSourceHash: delta.workerSourceHash,
    headSourceHash: delta.headSourceHash,
    outputSourceHash: delta.outputSourceHash,
    baseContextWrapperSignatureHash: delta.base.contextWrapperSignatureHash,
    workerContextWrapperSignatureHash: delta.worker.contextWrapperSignatureHash,
    headContextWrapperSignatureHash: delta.head.contextWrapperSignatureHash,
    outputContextWrapperSignatureHash: delta.output.contextWrapperSignatureHash,
    contextWrapperSourcePreservationHash: delta.contextWrapperSourcePreservationHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    contextWrapperSourcePreservationClaim: true,
    claimScope: 'static-context-wrapper-source-preservation-only'
  };
}

function eventHandlerProofFor(delta) {
  const baseNames = new Set(delta.base.eventHandlerPropNames);
  const workerAddedEventHandlerPropNames = delta.worker.eventHandlerPropNames.filter((name) => !baseNames.has(name));
  const headAddedEventHandlerPropNames = delta.head.eventHandlerPropNames.filter((name) => !baseNames.has(name));
  return {
    schema: 'frontier.lang.jsxEventHandlerSourceProof.v1',
    kind: 'frontier.lang.jsxEventHandlerSourceProof',
    status: 'passed',
    sourcePath: delta.sourcePath,
    identityKey: delta.identityKey,
    publicOwnerName: delta.publicOwnerName,
    tagName: delta.tagName,
    tagKey: delta.tagKey,
    baseSourceHash: delta.baseSourceHash,
    workerSourceHash: delta.workerSourceHash,
    headSourceHash: delta.headSourceHash,
    outputSourceHash: delta.outputSourceHash,
    baseEventHandlerSignatureHash: delta.base.eventHandlerSignatureHash,
    workerEventHandlerSignatureHash: delta.worker.eventHandlerSignatureHash,
    headEventHandlerSignatureHash: delta.head.eventHandlerSignatureHash,
    outputEventHandlerSignatureHash: delta.output.eventHandlerSignatureHash,
    outputEventHandlerPropNames: delta.output.eventHandlerPropNames,
    workerAddedEventHandlerPropNames,
    headAddedEventHandlerPropNames,
    eventHandlerSourcePreservationHash: delta.eventHandlerSourcePreservationHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    eventHandlerSourcePreservationClaim: true,
    claimScope: 'static-event-handler-source-preservation-only'
  };
}

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
