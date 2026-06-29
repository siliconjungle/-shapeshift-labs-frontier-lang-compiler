import { createSourceBoundRuntimeProof } from '@shapeshift-labs/frontier-runtime-proof';
import { assert } from './helpers.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import {
  jsxContextConsumerRisk,
  jsxHookDependencyRisk,
  jsxRenderRiskDelta
} from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

const hookDelta = jsxRenderRiskDelta({
  base: jsxHookDependencyRisk('base', ['theme']),
  worker: jsxHookDependencyRisk('worker', ['theme', 'locale']),
  head: jsxHookDependencyRisk('head', ['theme', 'featureFlag']),
  output: jsxHookDependencyRisk('output', ['theme', 'locale', 'featureFlag'])
});
const hookMissing = projectGraphDeltaConflicts(hookDelta);
assert.equal(hookMissing.length, 1);
assert.equal(hookMissing[0].details.reasonCodes.includes('jsx-render-runtime-proof-missing'), true);

const hookRuntimeProof = runtimeProofFor(hookMissing[0], ['jsx-hook-dependency-runtime']);
assert.equal(projectGraphDeltaConflicts(hookDelta, { jsxRenderRuntimeProof: hookRuntimeProof }).length, 0);

const staleHookRuntimeProof = projectGraphDeltaConflicts(hookDelta, {
  jsxRenderRuntimeProof: { ...hookRuntimeProof, outputSourceHash: 'source:stale-output' }
});
assert.equal(staleHookRuntimeProof.length, 1);
assert.equal(staleHookRuntimeProof[0].details.reasonCodes.includes('source-bound-runtime-proof-source-hash-mismatch'), true);
assert.equal(staleHookRuntimeProof[0].details.jsxRenderRuntimeProof.runtimeEvidenceBound, false);
assert.equal(staleHookRuntimeProof[0].details.renderEquivalenceClaim, false);

const missingLayoutProof = {
  ...hookRuntimeProof,
  runtimeProofCapsule: {
    ...hookRuntimeProof.runtimeProofCapsule,
    layoutSnapshotHash: undefined,
    telemetry: {
      ...hookRuntimeProof.runtimeProofCapsule.telemetry,
      layoutSnapshotHash: undefined
    }
  }
};
const missingLayoutConflicts = projectGraphDeltaConflicts(hookDelta, { jsxRenderRuntimeProof: missingLayoutProof });
assert.equal(missingLayoutConflicts.length, 1);
assert.equal(missingLayoutConflicts[0].details.reasonCodes.includes('runtime-proof-layout-snapshot-hash-missing'), true);

const missingAccessibilityProof = {
  ...hookRuntimeProof,
  runtimeProofCapsule: {
    ...hookRuntimeProof.runtimeProofCapsule,
    accessibilitySnapshotHash: undefined,
    telemetry: {
      ...hookRuntimeProof.runtimeProofCapsule.telemetry,
      accessibilitySnapshotHash: undefined
    }
  }
};
const missingAccessibilityConflicts = projectGraphDeltaConflicts(hookDelta, { jsxRenderRuntimeProof: missingAccessibilityProof });
assert.equal(missingAccessibilityConflicts.length, 1);
assert.equal(missingAccessibilityConflicts[0].details.reasonCodes.includes('runtime-proof-accessibility-snapshot-hash-missing'), true);

const missingEventTraceProof = {
  ...hookRuntimeProof,
  runtimeProofCapsule: {
    ...hookRuntimeProof.runtimeProofCapsule,
    eventTraceHash: undefined,
    telemetry: {
      ...hookRuntimeProof.runtimeProofCapsule.telemetry,
      eventTraceHash: undefined
    }
  }
};
const missingEventTraceConflicts = projectGraphDeltaConflicts(hookDelta, { jsxRenderRuntimeProof: missingEventTraceProof });
assert.equal(missingEventTraceConflicts.length, 1);
assert.equal(missingEventTraceConflicts[0].details.reasonCodes.includes('runtime-proof-event-trace-hash-missing'), true);

const broadClaimConflicts = projectGraphDeltaConflicts(hookDelta, {
  jsxRenderRuntimeProof: { ...hookRuntimeProof, renderEquivalenceClaim: true }
});
assert.equal(broadClaimConflicts.length, 1);
assert.equal(broadClaimConflicts[0].details.reasonCodes.includes('source-bound-runtime-proof-broad-claim-present'), true);

const nestedBroadClaimConflicts = projectGraphDeltaConflicts(hookDelta, {
  jsxRenderRuntimeProof: {
    ...hookRuntimeProof,
    runtimeProofCapsule: {
      ...hookRuntimeProof.runtimeProofCapsule,
      renderEquivalenceClaim: true
    }
  }
});
assert.equal(nestedBroadClaimConflicts.length, 1);
assert.equal(nestedBroadClaimConflicts[0].details.reasonCodes.includes('jsx-render-runtime-proof-nested-broad-claim-present'), true);
assert.equal(nestedBroadClaimConflicts[0].details.jsxRenderRuntimeProof.runtimeEvidenceBound, false);
assert.equal(nestedBroadClaimConflicts[0].details.renderEquivalenceClaim, false);

const contextDelta = jsxRenderRiskDelta({
  base: jsxContextConsumerRisk('base', ['ThemeContext']),
  worker: jsxContextConsumerRisk('worker', ['ThemeContext', 'LocaleContext']),
  head: jsxContextConsumerRisk('head', ['ThemeContext', 'FeatureFlagContext']),
  output: jsxContextConsumerRisk('output', ['ThemeContext', 'LocaleContext', 'FeatureFlagContext'])
});
const contextMissing = projectGraphDeltaConflicts(contextDelta);
assert.equal(contextMissing.length, 1);
assert.equal(projectGraphDeltaConflicts(contextDelta, {
  evidence: [runtimeProofFor(contextMissing[0], ['jsx-context-runtime'])]
}).length, 0);

const branchDelta = jsxRenderRiskDelta({
  base: conditionalRisk('base', 'ready', '<Card tone="base" />', '<Empty />'),
  worker: conditionalRisk('worker', 'ready', '<Card tone="worker" />', '<Empty />'),
  head: conditionalRisk('head', 'enabled', '<Card tone="base" />', '<Fallback />'),
  output: conditionalRisk('output', 'enabled', '<Card tone="worker" />', '<Fallback />')
});
const branchMissing = projectGraphDeltaConflicts(branchDelta);
assert.equal(branchMissing.length, 1);
assert.equal(projectGraphDeltaConflicts(branchDelta, {
  jsxRuntimeProofs: [runtimeProofFor(branchMissing[0], ['jsx-render-layout-runtime'])]
}).length, 0);

const wrapperDelta = jsxRenderRiskDelta({
  base: wrapperRisk('base', ['memo']),
  worker: wrapperRisk('worker', ['memo', 'forwardRef']),
  head: wrapperRisk('head', ['observer']),
  output: wrapperRisk('output', ['observer', 'forwardRef'])
});
const wrapperMissing = projectGraphDeltaConflicts(wrapperDelta);
assert.equal(wrapperMissing.length, 1);
assert.equal(projectGraphDeltaConflicts(wrapperDelta, {
  runtimeProofs: [runtimeProofFor(wrapperMissing[0], ['jsx-wrapper-runtime'])]
}).length, 0);

function runtimeProofFor(conflict, signals) {
  const details = conflict.details;
  return createSourceBoundRuntimeProof({
    id: `runtime-proof:${details.identityKey}`,
    sourcePath: details.sourcePath,
    reasonCode: 'jsx-render-runtime-boundary',
    boundaryKey: details.identityKey,
    recordKey: details.conflictKey,
    requiredSignals: signals,
    baseSourceHash: details.base.sourceHash,
    workerSourceHash: details.worker.sourceHash,
    headSourceHash: details.head.sourceHash,
    outputSourceHash: details.output.sourceHash,
    runtimeProofCapsule: {
      mode: 'isolated-fixture',
      status: 'passed',
      command: 'playwright test jsx-runtime-proof-bridge.spec.ts --project=chromium',
      probeId: `jsx:render-runtime:${details.identityKey}`,
      evidenceHash: `jsx-runtime-evidence:${details.identityKey}`,
      signals,
      telemetry: {
        hash: `telemetry:${details.identityKey}`,
        domSnapshotHash: `dom:${details.identityKey}`,
        computedStyleHash: `style:${details.identityKey}`,
        layoutSnapshotHash: `layout:${details.identityKey}`,
        eventTraceHash: `events:${details.identityKey}`,
        accessibilitySnapshotHash: `accessibility:${details.identityKey}`,
        focusSnapshotHash: `focus:${details.identityKey}`,
        cumulativeLayoutShift: 0
      }
    }
  }, {
    requiredSignals: signals,
    requireTelemetryHash: true,
    maxCumulativeLayoutShift: 0.01
  });
}

function conditionalRisk(stage, conditionText, consequentText, alternateText) {
  const conditionalBranchRecord = {
    conditionText,
    conditionHash: `condition:${conditionText}`,
    consequentText,
    consequentHash: `consequent:${consequentText}`,
    alternateText,
    alternateHash: `alternate:${alternateText}`,
    signatureHash: `conditional:${conditionText}:${consequentText}:${alternateText}`
  };
  return {
    id: `jsx_runtime_branch_${stage}`,
    sourcePath: 'src/view.tsx',
    tagName: 'Card',
    tagKey: 'Card#1',
    publicContract: true,
    publicOwnerName: 'View',
    renderRiskKinds: ['render-return-boundary', 'render-return-branch-control-flow'],
    renderRiskReasonCodes: ['jsx-render-return-conditional-branch-static-evidence', 'jsx-render-return-branch-unsupported'],
    renderReturnRecords: [{
      ordinal: 1,
      returnKind: 'implicit-arrow-expression',
      proofStatus: 'static-render-return-branch-evidence',
      branchControlKind: 'conditional-expression',
      conditionalBranchRecord,
      expressionHash: conditionalBranchRecord.signatureHash,
      signatureHash: conditionalBranchRecord.signatureHash
    }],
    renderReturnCount: 1,
    renderReturnBranchCount: 1,
    renderReturnSignatureHash: `render-return:${stage}:${conditionalBranchRecord.signatureHash}`,
    renderRiskSignatureHash: `render-risk:branch:${stage}:${conditionalBranchRecord.signatureHash}`,
    sourceHash: `source:${stage}`
  };
}

function wrapperRisk(stage, wrapperNames) {
  return {
    id: `jsx_runtime_wrapper_${stage}`,
    sourcePath: 'src/wrapped.tsx',
    tagName: 'button',
    tagKey: 'button#1',
    publicContract: true,
    publicOwnerName: 'WrappedView',
    renderRiskKinds: ['component-wrapper-boundary'],
    renderRiskReasonCodes: ['jsx-render-component-wrapper-static-evidence', 'jsx-render-component-wrapper-render-equivalence-unproved'],
    componentWrapperNames: wrapperNames,
    componentWrapperCalleeTexts: wrapperNames,
    componentWrapperRecords: wrapperNames.map((wrapperName, index) => ({
      ordinal: index + 1,
      proofStatus: 'static-component-wrapper-evidence',
      wrapperName,
      wrapperCalleeText: wrapperName,
      renderEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      signatureHash: `wrapper:${stage}:${index + 1}:${wrapperName}`
    })),
    componentWrapperCount: wrapperNames.length,
    componentWrapperRenderEquivalenceClaim: false,
    componentWrapperSignatureHash: `wrappers:${stage}:${wrapperNames.join('|')}`,
    renderRiskSignatureHash: `render-risk:wrappers:${stage}:${wrapperNames.join('|')}`,
    sourceHash: `source:${stage}`
  };
}
