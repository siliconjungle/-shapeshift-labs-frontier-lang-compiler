import { assert } from './helpers.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { jsxRenderReturnBranchDelta } from '../../src/js-ts-safe-project-merge-jsx-render-branch-proof.js';
import { jsxRenderRiskDelta } from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

const conditionalRecords = {
  base: conditionalRisk('base', 'ready', '<Button tone="base" />', '<Empty tone="base" />'),
  worker: conditionalRisk('worker', 'ready', '<Button tone="worker" />', '<Empty tone="base" />'),
  head: conditionalRisk('head', 'ready', '<Button tone="base" />', '<Empty tone="head" />'),
  output: conditionalRisk('output', 'ready', '<Button tone="worker" />', '<Empty tone="head" />')
};
const conditionalDelta = jsxRenderRiskDelta(conditionalRecords);
const conditionalMissing = projectGraphDeltaConflicts(conditionalDelta);
assert.equal(conditionalMissing.length, 1);
assert.equal(conditionalMissing[0].details.reasonCodes.includes('jsx-render-return-branch-proof-missing'), true);
assert.equal(conditionalMissing[0].details.routeId, 'prove-jsx-render-return-branch-arm-preservation');
assert.equal(conditionalMissing[0].details.jsxRenderReturnBranchProof.branchArmPreservationClaim, false);

const conditionalProof = branchProof(conditionalMissing[0].details.identityKey, conditionalRecords, {
  consequentOrigin: 'worker',
  alternateOrigin: 'head'
});
const conditionalPassed = projectGraphDeltaConflicts(conditionalDelta, { jsxRenderReturnBranchProofs: [conditionalProof] });
assert.equal(conditionalPassed.length, 0);
const conditionalGenericEvidencePassed = projectGraphDeltaConflicts(conditionalDelta, {
  evidence: [
    { identityKey: conditionalProof.identityKey, sourcePath: conditionalProof.sourcePath, status: 'passed' },
    conditionalProof
  ]
});
assert.equal(conditionalGenericEvidencePassed.length, 0);

const conditionalConditionRecords = {
  base: conditionalRisk('base', 'ready', '<Button tone="base" />', '<Empty tone="base" />'),
  worker: conditionalRisk('worker', 'ready', '<Button tone="worker" />', '<Empty tone="base" />'),
  head: conditionalRisk('head', 'enabled', '<Button tone="base" />', '<Empty tone="base" />'),
  output: conditionalRisk('output', 'enabled', '<Button tone="worker" />', '<Empty tone="base" />')
};
const conditionalConditionDelta = jsxRenderRiskDelta(conditionalConditionRecords);
const conditionalConditionMissing = projectGraphDeltaConflicts(conditionalConditionDelta);
assert.equal(conditionalConditionMissing.length, 1);
assert.equal(conditionalConditionMissing[0].details.reasonCodes.includes('jsx-render-return-branch-proof-missing'), true);
const conditionalConditionProof = branchProof(conditionalConditionMissing[0].details.identityKey, conditionalConditionRecords, {
  conditionOrigin: 'head',
  consequentOrigin: 'worker',
  alternateOrigin: 'base'
});
const conditionalConditionPassed = projectGraphDeltaConflicts(conditionalConditionDelta, { jsxRenderReturnBranchProof: conditionalConditionProof });
assert.equal(conditionalConditionPassed.length, 0);
const mismatchedConditionConflicts = projectGraphDeltaConflicts(conditionalConditionDelta, {
  jsxRenderReturnBranchProof: { ...conditionalConditionProof, conditionHash: 'wrong-condition' }
});
assert.equal(mismatchedConditionConflicts.length, 1);
assert.equal(mismatchedConditionConflicts[0].details.reasonCodes.includes('jsx-render-return-branch-proof-condition-hash-mismatch'), true);
assert.equal(mismatchedConditionConflicts[0].details.renderEquivalenceClaim, false);
assert.equal(mismatchedConditionConflicts[0].details.runtimeEquivalenceClaim, false);
const broadConditionalConditionClaimConflicts = projectGraphDeltaConflicts(conditionalConditionDelta, {
  jsxRenderReturnBranchProof: { ...conditionalConditionProof, renderEquivalenceClaim: true }
});
assert.equal(broadConditionalConditionClaimConflicts.length, 1);
assert.equal(broadConditionalConditionClaimConflicts[0].details.reasonCodes.includes('jsx-render-return-branch-proof-claim-flags-missing'), true);
assert.equal(broadConditionalConditionClaimConflicts[0].details.renderEquivalenceClaim, false);

const dynamicHandlerFactoryRecords = {
  base: conditionalRecords.base,
  worker: withDynamicEventHandlerFactoryRisk(conditionalRecords.worker, 'worker'),
  head: conditionalRecords.head,
  output: conditionalRecords.output
};
const dynamicHandlerFactoryProof = branchProof(conditionalMissing[0].details.identityKey, dynamicHandlerFactoryRecords, {
  consequentOrigin: 'worker',
  alternateOrigin: 'head'
});
const dynamicHandlerFactoryBlocked = projectGraphDeltaConflicts(jsxRenderRiskDelta(dynamicHandlerFactoryRecords), {
  jsxRenderReturnBranchProof: dynamicHandlerFactoryProof
});
assert.equal(dynamicHandlerFactoryBlocked.length, 1);
assert.equal(dynamicHandlerFactoryBlocked[0].details.reasonCodes.includes('jsx-render-return-branch-proof-non-render-risk-present'), true);
assert.equal(dynamicHandlerFactoryBlocked[0].details.reasonCodes.includes('jsx-render-event-handler-prop-call-expression-unsupported'), true);
assert.equal(dynamicHandlerFactoryBlocked[0].details.jsxRenderReturnBranchProof.branchArmPreservationClaim, false);
assert.equal(dynamicHandlerFactoryBlocked[0].details.renderEquivalenceClaim, false);
assert.equal(dynamicHandlerFactoryBlocked[0].details.runtimeEquivalenceClaim, false);

const staleProofConflicts = projectGraphDeltaConflicts(conditionalDelta, {
  jsxRenderReturnBranchProof: { ...conditionalProof, outputSourceHash: 'stale-output' }
});
assert.equal(staleProofConflicts.length, 1);
assert.equal(staleProofConflicts[0].details.reasonCodes.includes('jsx-render-return-branch-proof-source-hash-mismatch'), true);
assert.equal(staleProofConflicts[0].details.semanticEquivalenceClaim, false);

const mismatchedArmConflicts = projectGraphDeltaConflicts(conditionalDelta, {
  jsxRenderReturnBranchProof: { ...conditionalProof, outputConsequentHash: 'wrong-output-arm' }
});
assert.equal(mismatchedArmConflicts.length, 1);
assert.equal(mismatchedArmConflicts[0].details.reasonCodes.includes('jsx-render-return-branch-proof-arm-hash-mismatch'), true);

const logicalRecords = {
  base: logicalRisk('base', 'ready', '<Button tone="base" />'),
  worker: logicalRisk('worker', 'ready', '<Button tone="worker" />'),
  head: logicalRisk('head', 'enabled', '<Button tone="base" />'),
  output: logicalRisk('output', 'enabled', '<Button tone="worker" />')
};
const logicalDelta = jsxRenderRiskDelta(logicalRecords);
const logicalMissing = projectGraphDeltaConflicts(logicalDelta);
assert.equal(logicalMissing.length, 1);
assert.equal(logicalMissing[0].details.reasonCodes.includes('jsx-render-return-branch-proof-missing'), true);
const logicalProof = branchProof(logicalMissing[0].details.identityKey, logicalRecords, {
  leftOrigin: 'head',
  rightOrigin: 'worker'
});
const logicalPassed = projectGraphDeltaConflicts(logicalDelta, { jsxRenderReturnBranchProof: logicalProof });
assert.equal(logicalPassed.length, 0);
const badLogicalGuard = projectGraphDeltaConflicts(logicalDelta, {
  jsxRenderReturnBranchProof: { ...logicalProof, leftHash: 'wrong-guard' }
});
assert.equal(badLogicalGuard.length, 1);
assert.equal(badLogicalGuard[0].details.reasonCodes.includes('jsx-render-return-branch-proof-logical-guard-hash-mismatch'), true);

function branchProof(identityKey, records, origins) {
  const expected = jsxRenderReturnBranchDelta({
    identityKey,
    baseRecord: records.base,
    workerRecord: records.worker,
    headRecord: records.head,
    outputRecord: records.output
  });
  const proof = {
    schema: 'frontier.lang.jsxRenderReturnBranchProof.v1',
    kind: 'frontier.lang.jsxRenderReturnBranchProof',
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
    returnOrdinal: expected.returnOrdinal,
    returnKind: expected.returnKind,
    branchControlKind: expected.branchControlKind,
    branchArmPreservationHash: expected.branchArmPreservationHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    renderEquivalenceClaim: false,
    branchArmPreservationClaim: true,
    claimScope: 'static-render-return-branch-arm-preservation-only'
  };
  if (expected.branchControlKind === 'conditional-expression') {
    const conditionOrigin = origins.conditionOrigin ?? 'base';
    return {
      ...proof,
      ...(origins.conditionOrigin ? { conditionOrigin: origins.conditionOrigin } : {}),
      conditionHash: expected[conditionOrigin].conditionHash,
      outputConditionHash: expected.output.conditionHash,
      consequentOrigin: origins.consequentOrigin,
      consequentHash: expected[origins.consequentOrigin].consequentHash,
      outputConsequentHash: expected.output.consequentHash,
      alternateOrigin: origins.alternateOrigin,
      alternateHash: expected[origins.alternateOrigin].alternateHash,
      outputAlternateHash: expected.output.alternateHash
    };
  }
  return {
    ...proof,
    operator: expected.output.operator,
    leftOrigin: origins.leftOrigin,
    leftHash: expected[origins.leftOrigin].leftHash,
    outputLeftHash: expected.output.leftHash,
    rightOrigin: origins.rightOrigin,
    rightHash: expected[origins.rightOrigin].rightHash,
    outputRightHash: expected.output.rightHash
  };
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
  return renderRisk(stage, 'conditional-expression', {
    conditionalBranchRecord,
    expressionText: `${conditionText} ? ${consequentText} : ${alternateText}`,
    expressionHash: conditionalBranchRecord.signatureHash
  });
}

function logicalRisk(stage, leftText, rightText) {
  const logicalBranchRecord = {
    operator: '&&',
    leftText,
    leftHash: `left:${leftText}`,
    rightText,
    rightHash: `right:${rightText}`,
    signatureHash: `logical:&&:${leftText}:${rightText}`
  };
  return renderRisk(stage, 'logical-expression', {
    logicalBranchRecord,
    expressionText: `${leftText} && ${rightText}`,
    expressionHash: logicalBranchRecord.signatureHash
  });
}

function renderRisk(stage, branchControlKind, renderReturn) {
  const record = {
    ordinal: 1,
    returnKind: 'implicit-arrow-expression',
    proofStatus: 'static-render-return-branch-evidence',
    branchControlKind,
    ...renderReturn,
    signatureHash: renderReturn.expressionHash
  };
  return {
    id: `jsx_render_branch_${stage}`,
    sourcePath: 'src/view.tsx',
    tagName: 'Button',
    tagKey: 'Button#1',
    publicContract: true,
    publicOwnerName: 'View',
    renderRiskKinds: ['render-return-boundary', 'render-return-branch-control-flow'],
    renderRiskReasonCodes: [`jsx-render-return-${branchControlKind === 'logical-expression' ? 'logical' : 'conditional'}-branch-static-evidence`, 'jsx-render-return-branch-unsupported'],
    renderReturnRecords: [record],
    renderReturnCount: 1,
    renderReturnBranchCount: 1,
    renderReturnSignatureHash: `render-return:${stage}:${record.signatureHash}`,
    renderRiskSignatureHash: `render-risk:render-return:${stage}:${record.signatureHash}`,
    sourceHash: `source:${stage}`
  };
}

function withDynamicEventHandlerFactoryRisk(record, stage) {
  const propName = 'onClick';
  const expressionText = '{makeHandler(theme)}';
  return {
    ...record,
    renderRiskKinds: [...record.renderRiskKinds, 'event-handler-prop-boundary'],
    renderRiskReasonCodes: [
      ...record.renderRiskReasonCodes,
      'jsx-render-event-handler-prop-unsupported',
      'jsx-render-event-handler-prop-call-expression-unsupported'
    ],
    eventHandlerPropNames: [propName],
    eventHandlerPropRecords: [{
      propName,
      ordinal: 1,
      propKind: 'named',
      proofStatus: 'dynamic-event-handler-unsupported',
      dynamicExpressionText: expressionText,
      dynamicExpressionKind: 'call-expression',
      dynamicBlockerReasonCode: 'jsx-render-event-handler-prop-call-expression-unsupported',
      expressionHash: `event-handler-expression:${stage}:${expressionText}`,
      signatureHash: `event-handler:${stage}:${propName}:${expressionText}`
    }],
    eventHandlerPropCount: 1,
    eventHandlerSignatureHash: `event-handlers:${stage}:${propName}:${expressionText}`,
    renderRiskSignatureHash: `${record.renderRiskSignatureHash}:event-handler-factory`
  };
}
