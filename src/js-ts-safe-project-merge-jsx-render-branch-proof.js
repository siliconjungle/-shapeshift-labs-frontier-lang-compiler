import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const JsxRenderReturnBranchRoute = Object.freeze({
  routeId: 'prove-jsx-render-return-branch-arm-preservation',
  routeLane: 'jsx-static-render-return-branches',
  routeNext: 'supply-jsx-render-return-branch-proof'
});

function jsxRenderReturnBranchProofAssessment(input, options = {}) {
  const delta = jsxRenderReturnBranchDelta(input);
  if (!delta) return undefined;
  const proof = jsxRenderReturnBranchProofFor(delta, options);
  const reasonCodes = [];
  if (!proof) reasonCodes.push('jsx-render-return-branch-proof-missing');
  else {
    if (proof.status !== 'passed' && proof.status !== 'verified') reasonCodes.push('jsx-render-return-branch-proof-status-not-passed');
    if (proof.schema !== 'frontier.lang.jsxRenderReturnBranchProof.v1' && proof.kind !== 'frontier.lang.jsxRenderReturnBranchProof') reasonCodes.push('jsx-render-return-branch-proof-schema-missing');
    if (proof.sourcePath !== delta.sourcePath) reasonCodes.push('jsx-render-return-branch-proof-source-path-mismatch');
    for (const stage of ['base', 'worker', 'head', 'output']) {
      if (proof[`${stage}SourceHash`] !== delta[`${stage}SourceHash`]) reasonCodes.push('jsx-render-return-branch-proof-source-hash-mismatch');
    }
    if (proof.identityKey !== undefined && proof.identityKey !== delta.identityKey) reasonCodes.push('jsx-render-return-branch-proof-identity-mismatch');
    if (proof.publicOwnerName !== delta.publicOwnerName || proof.tagName !== delta.tagName || proof.tagKey !== delta.tagKey) reasonCodes.push('jsx-render-return-branch-proof-identity-mismatch');
    if (proof.returnOrdinal !== delta.returnOrdinal || proof.returnKind !== delta.returnKind || proof.branchControlKind !== delta.branchControlKind) reasonCodes.push('jsx-render-return-branch-proof-branch-kind-unsupported');
    if (delta.nonRenderRiskPresent) reasonCodes.push('jsx-render-return-branch-proof-non-render-risk-present');
    if (delta.branchCountUnsupported) reasonCodes.push('jsx-render-return-branch-proof-branch-count-unsupported');
    reasonCodes.push(...branchReasonCodes(delta, proof));
    if (proof.branchArmPreservationHash !== delta.branchArmPreservationHash) reasonCodes.push('jsx-render-return-branch-proof-output-signature-mismatch');
    if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
      || proof.renderEquivalenceClaim !== false || proof.branchArmPreservationClaim !== true
      || proof.claimScope !== 'static-render-return-branch-arm-preservation-only') {
      reasonCodes.push('jsx-render-return-branch-proof-claim-flags-missing');
    }
  }
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    ...JsxRenderReturnBranchRoute,
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.jsxRenderReturnBranchProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.proofHash,
      ...JsxRenderReturnBranchRoute,
      reasonCodes: uniqueStrings(reasonCodes),
      expected: delta,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      branchArmPreservationClaim: status === 'passed'
    })
  };
}

function jsxRenderReturnBranchDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  const branches = Object.fromEntries(Object.entries(records).map(([stage, record]) => [stage, singleBranch(record)]));
  if (!Object.values(records).some((record) => hasBranchUnsupported(record))) return undefined;
  const outputBranch = branches.output;
  const branchControlKind = firstString(outputBranch?.branchControlKind, branches.worker?.branchControlKind, branches.head?.branchControlKind, branches.base?.branchControlKind);
  if (branchControlKind !== 'conditional-expression' && branchControlKind !== 'logical-expression') return undefined;
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const delta = compactRecord({
    schema: 'frontier.lang.jsxRenderReturnBranchDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName: firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName),
    tagName: firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName),
    tagKey: firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash,
    returnOrdinal: outputBranch?.ordinal,
    returnKind: outputBranch?.returnKind,
    branchControlKind,
    nonRenderRiskPresent: nonRenderRiskPresent(outputRecord ?? workerRecord ?? headRecord ?? baseRecord) || undefined,
    branchCountUnsupported: Object.values(branches).some((branch) => !branch) || undefined,
    base: branchSummary(branches.base),
    worker: branchSummary(branches.worker),
    head: branchSummary(branches.head),
    output: branchSummary(branches.output)
  });
  return { ...delta, branchArmPreservationHash: jsxRenderReturnBranchProofHash(delta) };
}

function branchReasonCodes(delta, proof) {
  if (delta.branchControlKind === 'conditional-expression') return conditionalBranchReasonCodes(delta, proof);
  if (delta.branchControlKind === 'logical-expression') return logicalBranchReasonCodes(delta, proof);
  return ['jsx-render-return-branch-proof-branch-kind-unsupported'];
}

function conditionalBranchReasonCodes(delta, proof) {
  const reasons = [];
  if (proof.conditionHash !== delta.base?.conditionHash || proof.outputConditionHash !== delta.output?.conditionHash) reasons.push('jsx-render-return-branch-proof-condition-hash-mismatch');
  if (proof.consequentOrigin === undefined || proof.alternateOrigin === undefined) reasons.push('jsx-render-return-branch-proof-output-arm-origin-missing');
  if (proof.outputConsequentHash !== delta.output?.consequentHash || proof.outputAlternateHash !== delta.output?.alternateHash) reasons.push('jsx-render-return-branch-proof-arm-hash-mismatch');
  if (proof.consequentHash !== armHash(delta, proof.consequentOrigin, 'consequentHash')) reasons.push('jsx-render-return-branch-proof-arm-hash-mismatch');
  if (proof.alternateHash !== armHash(delta, proof.alternateOrigin, 'alternateHash')) reasons.push('jsx-render-return-branch-proof-arm-hash-mismatch');
  if (delta.output?.consequentHash !== armHash(delta, proof.consequentOrigin, 'consequentHash')) reasons.push('jsx-render-return-branch-proof-arm-hash-mismatch');
  if (delta.output?.alternateHash !== armHash(delta, proof.alternateOrigin, 'alternateHash')) reasons.push('jsx-render-return-branch-proof-arm-hash-mismatch');
  return reasons;
}

function logicalBranchReasonCodes(delta, proof) {
  const reasons = [];
  if (proof.operator !== delta.output?.operator) reasons.push('jsx-render-return-branch-proof-branch-kind-unsupported');
  if (proof.leftOrigin === undefined || proof.rightOrigin === undefined) reasons.push('jsx-render-return-branch-proof-output-arm-origin-missing');
  if (proof.outputLeftHash !== delta.output?.leftHash || proof.outputRightHash !== delta.output?.rightHash) reasons.push('jsx-render-return-branch-proof-arm-hash-mismatch');
  if (proof.leftHash !== armHash(delta, proof.leftOrigin, 'leftHash')) reasons.push('jsx-render-return-branch-proof-logical-guard-hash-mismatch');
  if (proof.rightHash !== armHash(delta, proof.rightOrigin, 'rightHash')) reasons.push('jsx-render-return-branch-proof-arm-hash-mismatch');
  if (delta.output?.leftHash !== armHash(delta, proof.leftOrigin, 'leftHash')) reasons.push('jsx-render-return-branch-proof-logical-guard-hash-mismatch');
  if (delta.output?.rightHash !== armHash(delta, proof.rightOrigin, 'rightHash')) reasons.push('jsx-render-return-branch-proof-arm-hash-mismatch');
  return reasons;
}

function jsxRenderReturnBranchProofFor(delta, options = {}) {
  return [
    options.jsxRenderReturnBranchProof,
    ...(Array.isArray(options.jsxRenderReturnBranchProofs) ? options.jsxRenderReturnBranchProofs : [])
  ].filter(Boolean).find((proof) => proof.identityKey === delta.identityKey || (
    proof.sourcePath === delta.sourcePath && proof.publicOwnerName === delta.publicOwnerName && proof.tagKey === delta.tagKey
  ));
}

function jsxRenderReturnBranchProofHash(delta) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsxRenderReturnBranchProof.expected.v1',
    identityKey: delta.identityKey,
    sourcePath: delta.sourcePath,
    publicOwnerName: delta.publicOwnerName,
    tagName: delta.tagName,
    tagKey: delta.tagKey,
    baseSourceHash: delta.baseSourceHash,
    workerSourceHash: delta.workerSourceHash,
    headSourceHash: delta.headSourceHash,
    outputSourceHash: delta.outputSourceHash,
    returnOrdinal: delta.returnOrdinal,
    returnKind: delta.returnKind,
    branchControlKind: delta.branchControlKind,
    base: delta.base,
    worker: delta.worker,
    head: delta.head,
    output: delta.output
  });
}

function singleBranch(record) {
  const returns = Array.isArray(record?.renderReturnRecords) ? record.renderReturnRecords : [];
  if (returns.length !== 1) return undefined;
  const item = returns[0];
  const branch = item.conditionalBranchRecord ?? item.logicalBranchRecord;
  return branch ? { ...item, ...branch } : undefined;
}

function branchSummary(branch) {
  if (!branch) return undefined;
  return compactRecord({
    ordinal: branch.ordinal,
    returnKind: branch.returnKind,
    branchControlKind: branch.branchControlKind,
    conditionHash: branch.conditionHash,
    consequentHash: branch.consequentHash,
    alternateHash: branch.alternateHash,
    operator: branch.operator,
    leftHash: branch.leftHash,
    rightHash: branch.rightHash,
    signatureHash: branch.signatureHash
  });
}

function nonRenderRiskPresent(record) {
  return (record?.renderRiskKinds ?? []).some((kind) => kind !== 'render-return-boundary' && kind !== 'render-return-branch-control-flow');
}
function hasBranchUnsupported(record) { return (record?.renderRiskReasonCodes ?? []).includes('jsx-render-return-branch-unsupported'); }
function armHash(delta, origin, field) { return ['base', 'worker', 'head', 'output'].includes(origin) ? delta[origin]?.[field] : undefined; }
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  JsxRenderReturnBranchRoute,
  jsxRenderReturnBranchDelta,
  jsxRenderReturnBranchProofAssessment,
  jsxRenderReturnBranchProofHash
};
