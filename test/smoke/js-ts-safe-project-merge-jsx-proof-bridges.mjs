import { assert } from './helpers.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import {
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
