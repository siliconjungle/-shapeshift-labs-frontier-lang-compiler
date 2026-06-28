import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const ContextWrapperRiskKinds = new Set([
  'context-provider-boundary',
  'context-provider-value-boundary',
  'context-provider-nesting',
  'context-consumer-boundary',
  'component-wrapper-boundary'
]);

const JsxContextWrapperSourceRoute = Object.freeze({
  routeId: 'prove-jsx-context-wrapper-source-preservation',
  routeLane: 'jsx-static-context-wrapper-render',
  routeNext: 'supply-jsx-context-wrapper-source-proof'
});

function jsxContextWrapperSourceProofAssessment(input, options = {}) {
  const delta = jsxContextWrapperSourceDelta(input);
  if (!delta) return undefined;
  const proof = jsxContextWrapperSourceProofFor(delta, options);
  const reasonCodes = [];
  if (!proof) reasonCodes.push('jsx-render-context-wrapper-source-proof-missing');
  else {
    if (proof.status !== 'passed' && proof.status !== 'verified') reasonCodes.push('jsx-render-context-wrapper-source-proof-status-not-passed');
    if (proof.schema !== 'frontier.lang.jsxContextWrapperSourceProof.v1' && proof.kind !== 'frontier.lang.jsxContextWrapperSourceProof') reasonCodes.push('jsx-render-context-wrapper-source-proof-schema-missing');
    if (proof.sourcePath !== delta.sourcePath) reasonCodes.push('jsx-render-context-wrapper-source-proof-source-path-mismatch');
    if (proof.identityKey !== undefined && proof.identityKey !== delta.identityKey) reasonCodes.push('jsx-render-context-wrapper-source-proof-identity-mismatch');
    if (proof.publicOwnerName !== delta.publicOwnerName || proof.tagName !== delta.tagName || proof.tagKey !== delta.tagKey) reasonCodes.push('jsx-render-context-wrapper-source-proof-identity-mismatch');
    for (const stage of ['base', 'worker', 'head', 'output']) {
      if (proof[`${stage}SourceHash`] !== delta[`${stage}SourceHash`]) reasonCodes.push('jsx-render-context-wrapper-source-proof-source-hash-mismatch');
      if (proof[`${stage}ContextWrapperSignatureHash`] !== delta[stage]?.contextWrapperSignatureHash) reasonCodes.push('jsx-render-context-wrapper-source-proof-signature-hash-mismatch');
    }
    if (delta.nonContextWrapperRiskPresent) reasonCodes.push('jsx-render-context-wrapper-source-proof-non-context-wrapper-risk-present');
    if (proof.contextWrapperSourcePreservationHash !== delta.contextWrapperSourcePreservationHash) reasonCodes.push('jsx-render-context-wrapper-source-proof-output-signature-mismatch');
    if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
      || proof.renderEquivalenceClaim !== false || proof.contextWrapperSourcePreservationClaim !== true
      || proof.claimScope !== 'static-context-wrapper-source-preservation-only') {
      reasonCodes.push('jsx-render-context-wrapper-source-proof-claim-flags-missing');
    }
  }
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    ...JsxContextWrapperSourceRoute,
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.jsxContextWrapperSourceProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.proofHash,
      ...JsxContextWrapperSourceRoute,
      reasonCodes: uniqueStrings(reasonCodes),
      expected: delta,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      contextWrapperSourcePreservationClaim: status === 'passed'
    })
  };
}

function jsxContextWrapperSourceDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  if (!Object.values(records).some((record) => hasContextWrapperBoundary(record))) return undefined;
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const delta = compactRecord({
    schema: 'frontier.lang.jsxContextWrapperSourceDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName: firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName),
    tagName: firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName),
    tagKey: firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash,
    nonContextWrapperRiskPresent: Object.values(records).some((record) => nonContextWrapperRiskPresent(record)) || undefined,
    base: contextWrapperSummary(baseRecord),
    worker: contextWrapperSummary(workerRecord),
    head: contextWrapperSummary(headRecord),
    output: contextWrapperSummary(outputRecord)
  });
  return { ...delta, contextWrapperSourcePreservationHash: jsxContextWrapperSourceProofHash(delta) };
}

function jsxContextWrapperSourceProofFor(delta, options = {}) {
  const matches = [
    options.jsxContextWrapperSourceProof,
    ...(Array.isArray(options.jsxContextWrapperSourceProofs) ? options.jsxContextWrapperSourceProofs : []),
    ...(Array.isArray(options.evidence) ? options.evidence : [])
  ].filter(Boolean).filter((proof) => proof.identityKey === delta.identityKey || (
    proof.sourcePath === delta.sourcePath
      && proof.publicOwnerName === delta.publicOwnerName
      && proof.tagKey === delta.tagKey
  ));
  return matches.find((proof) => isContextWrapperSourceProofCandidate(proof)) ?? matches[0];
}

function isContextWrapperSourceProofCandidate(proof) {
  return proof?.schema === 'frontier.lang.jsxContextWrapperSourceProof.v1'
    || proof?.kind === 'frontier.lang.jsxContextWrapperSourceProof'
    || proof?.claimScope === 'static-context-wrapper-source-preservation-only'
    || proof?.contextWrapperSourcePreservationHash !== undefined
    || proof?.contextWrapperSourcePreservationClaim !== undefined;
}

function jsxContextWrapperSourceProofHash(delta) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsxContextWrapperSourceProof.expected.v1',
    identityKey: delta.identityKey,
    sourcePath: delta.sourcePath,
    publicOwnerName: delta.publicOwnerName,
    tagName: delta.tagName,
    tagKey: delta.tagKey,
    baseSourceHash: delta.baseSourceHash,
    workerSourceHash: delta.workerSourceHash,
    headSourceHash: delta.headSourceHash,
    outputSourceHash: delta.outputSourceHash,
    base: delta.base,
    worker: delta.worker,
    head: delta.head,
    output: delta.output
  });
}

function contextWrapperSummary(record) {
  if (!record) return undefined;
  const summary = compactRecord({
    renderRiskKinds: (record.renderRiskKinds ?? []).filter((kind) => ContextWrapperRiskKinds.has(kind)),
    contextBoundaryKind: record.contextBoundaryKind,
    contextName: record.contextName,
    contextValuePropName: record.contextValuePropName,
    contextValueExpressionHash: record.contextValueExpressionHash,
    contextValueSignatureHash: record.contextValueSignatureHash,
    contextProviderPath: record.contextProviderPath,
    contextProviderAncestorTags: record.contextProviderAncestorTags,
    contextProviderAncestorCount: record.contextProviderAncestorCount,
    contextProviderNestingSignatureHash: record.contextProviderNestingSignatureHash,
    contextConsumerNames: record.contextConsumerNames,
    contextConsumerRecords: record.contextConsumerRecords,
    contextConsumerCount: record.contextConsumerCount,
    contextConsumerSignatureHash: record.contextConsumerSignatureHash,
    componentWrapperNames: record.componentWrapperNames,
    componentWrapperCalleeTexts: record.componentWrapperCalleeTexts,
    componentWrapperRecords: record.componentWrapperRecords,
    componentWrapperCount: record.componentWrapperCount,
    componentWrapperRenderEquivalenceClaim: record.componentWrapperRenderEquivalenceClaim,
    componentWrapperSignatureHash: record.componentWrapperSignatureHash
  });
  return {
    ...summary,
    contextWrapperSignatureHash: hashSemanticValue({
      kind: 'frontier.lang.jsxContextWrapperSignature.v1',
      ...summary
    })
  };
}

function hasContextWrapperBoundary(record) {
  return (record?.renderRiskKinds ?? []).some((kind) => ContextWrapperRiskKinds.has(kind));
}

function nonContextWrapperRiskPresent(record) {
  return (record?.renderRiskKinds ?? []).some((kind) => !ContextWrapperRiskKinds.has(kind));
}

function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  JsxContextWrapperSourceRoute,
  jsxContextWrapperSourceDelta,
  jsxContextWrapperSourceProofAssessment,
  jsxContextWrapperSourceProofHash
};
