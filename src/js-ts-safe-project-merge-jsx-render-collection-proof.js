import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const SupportedCollectionKinds = new Set([
  'array-literal',
  'fragment-shorthand',
  'fragment-named',
  'fragment-react',
  'static-const-array-map'
]);

const SourceOrigins = new Set(['base', 'worker', 'head']);

const JsxRenderReturnCollectionRoute = Object.freeze({
  routeId: 'prove-jsx-render-return-collection-item-preservation',
  routeLane: 'jsx-static-render-return-collections',
  routeNext: 'supply-jsx-render-return-collection-proof'
});

function jsxRenderReturnCollectionProofAssessment(input, options = {}) {
  const delta = jsxRenderReturnCollectionDelta(input);
  if (!delta) return undefined;
  const proof = jsxRenderReturnCollectionProofFor(delta, options);
  const reasonCodes = [];
  if (!proof) reasonCodes.push('jsx-render-return-collection-proof-missing');
  else {
    if (proof.status !== 'passed' && proof.status !== 'verified') reasonCodes.push('jsx-render-return-collection-proof-status-not-passed');
    if (proof.schema !== 'frontier.lang.jsxRenderReturnCollectionProof.v1' && proof.kind !== 'frontier.lang.jsxRenderReturnCollectionProof') reasonCodes.push('jsx-render-return-collection-proof-schema-missing');
    if (proof.sourcePath !== delta.sourcePath) reasonCodes.push('jsx-render-return-collection-proof-source-path-mismatch');
    for (const stage of ['base', 'worker', 'head', 'output']) {
      if (proof[`${stage}SourceHash`] !== delta[`${stage}SourceHash`]) reasonCodes.push('jsx-render-return-collection-proof-source-hash-mismatch');
    }
    if (proof.identityKey !== undefined && proof.identityKey !== delta.identityKey) reasonCodes.push('jsx-render-return-collection-proof-identity-mismatch');
    if (proof.publicOwnerName !== delta.publicOwnerName || proof.tagName !== delta.tagName || proof.tagKey !== delta.tagKey) reasonCodes.push('jsx-render-return-collection-proof-identity-mismatch');
    if (proof.returnOrdinal !== delta.returnOrdinal || proof.returnKind !== delta.returnKind || proof.collectionKind !== delta.collectionKind) reasonCodes.push('jsx-render-return-collection-proof-collection-kind-unsupported');
    if (delta.nonCollectionRiskPresent) reasonCodes.push('jsx-render-return-collection-proof-non-collection-risk-present');
    if (delta.collectionCountUnsupported) reasonCodes.push('jsx-render-return-collection-proof-count-unsupported');
    if (delta.collectionKindUnsupported) reasonCodes.push('jsx-render-return-collection-proof-collection-kind-unsupported');
    if (delta.itemCountUnsupported) reasonCodes.push('jsx-render-return-collection-proof-item-count-unsupported');
    if (delta.dynamicCollectionPresent) reasonCodes.push('jsx-render-return-collection-proof-dynamic-collection-unsupported');
    reasonCodes.push(...collectionUnsupportedReasonCodes(delta));
    reasonCodes.push(...collectionItemReasonCodes(delta, proof));
    if (proof.collectionItemPreservationHash !== delta.collectionItemPreservationHash) reasonCodes.push('jsx-render-return-collection-proof-output-signature-mismatch');
    if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
      || proof.renderEquivalenceClaim !== false || proof.collectionItemPreservationClaim !== true
      || proof.claimScope !== 'static-render-return-collection-item-preservation-only') {
      reasonCodes.push('jsx-render-return-collection-proof-claim-flags-missing');
    }
  }
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    ...JsxRenderReturnCollectionRoute,
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.jsxRenderReturnCollectionProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.proofHash,
      ...JsxRenderReturnCollectionRoute,
      reasonCodes: uniqueStrings(reasonCodes),
      expected: delta,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      collectionItemPreservationClaim: status === 'passed'
    })
  };
}

function jsxRenderReturnCollectionDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  if (!Object.values(records).some((record) => hasCollectionBoundary(record))) return undefined;
  const returns = Object.fromEntries(Object.entries(records).map(([stage, record]) => [stage, singleCollectionReturn(record)]));
  const outputReturn = returns.output;
  const outputCollection = outputReturn?.collectionRecord;
  const collectionKind = firstString(outputCollection?.collectionKind, returns.worker?.collectionRecord?.collectionKind, returns.head?.collectionRecord?.collectionKind, returns.base?.collectionRecord?.collectionKind);
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const collectionKinds = uniqueStrings(Object.values(returns).map((record) => record?.collectionRecord?.collectionKind));
  const itemCounts = uniqueNumbers(Object.values(returns).map((record) => record?.collectionRecord?.itemCount));
  const itemCountInconsistent = Object.values(returns).some((record) => {
    const collection = record?.collectionRecord;
    return collection && collection.itemCount !== collectionItemHashes(collection).length;
  });
  const delta = compactRecord({
    schema: 'frontier.lang.jsxRenderReturnCollectionDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName: firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName),
    tagName: firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName),
    tagKey: firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash,
    returnOrdinal: outputReturn?.ordinal,
    returnKind: outputReturn?.returnKind,
    collectionKind,
    nonCollectionRiskPresent: Object.values(records).some((record) => nonCollectionRiskPresent(record)) || undefined,
    collectionCountUnsupported: Object.values(returns).some((record) => !record) || undefined,
    collectionKindUnsupported: (!SupportedCollectionKinds.has(collectionKind) || collectionKinds.length !== 1) || undefined,
    itemCountUnsupported: (itemCounts.length !== 1 || itemCountInconsistent) || undefined,
    dynamicCollectionPresent: Object.values(returns).some((record) => dynamicCollectionPresent(record?.collectionRecord)) || undefined,
    base: collectionSummary(returns.base),
    worker: collectionSummary(returns.worker),
    head: collectionSummary(returns.head),
    output: collectionSummary(returns.output)
  });
  return { ...delta, collectionItemPreservationHash: jsxRenderReturnCollectionProofHash(delta) };
}

function collectionUnsupportedReasonCodes(delta) {
  return uniqueStrings(['base', 'worker', 'head', 'output'].map((stage) => {
    const summary = delta?.[stage];
    return summary?.keyedListProofStatus && summary.keyedListProofStatus !== 'static-render-return-keyed-list-evidence'
      ? summary.keyedListReasonCode
      : undefined;
  }));
}

function collectionItemReasonCodes(delta, proof) {
  const reasons = [];
  const items = Array.isArray(proof.items) ? proof.items : [];
  const outputItemHashes = delta.output?.itemHashes ?? [];
  if (items.length !== outputItemHashes.length) reasons.push('jsx-render-return-collection-proof-item-count-mismatch');
  for (let index = 0; index < outputItemHashes.length; index += 1) {
    const item = items[index];
    if (!item) continue;
    if (item.ordinal !== index + 1) reasons.push('jsx-render-return-collection-proof-item-ordinal-mismatch');
    if (!SourceOrigins.has(item.origin)) reasons.push(item.origin === undefined ? 'jsx-render-return-collection-proof-output-origin-missing' : 'jsx-render-return-collection-proof-output-origin-unsupported');
    const originItemHash = collectionItemHash(delta, item.origin, index);
    if (item.outputItemHash !== outputItemHashes[index]) reasons.push('jsx-render-return-collection-proof-item-hash-mismatch');
    if (item.itemHash !== originItemHash) reasons.push('jsx-render-return-collection-proof-item-hash-mismatch');
    if (outputItemHashes[index] !== originItemHash) reasons.push('jsx-render-return-collection-proof-item-hash-mismatch');
  }
  if (delta.output?.keyedListHash !== undefined && proof.outputKeyedListHash !== delta.output.keyedListHash) {
    reasons.push('jsx-render-return-collection-proof-keyed-list-hash-mismatch');
  }
  return reasons;
}

function jsxRenderReturnCollectionProofFor(delta, options = {}) {
  const matches = [
    options.jsxRenderReturnCollectionProof,
    ...(Array.isArray(options.jsxRenderReturnCollectionProofs) ? options.jsxRenderReturnCollectionProofs : []),
    ...(Array.isArray(options.evidence) ? options.evidence : [])
  ].filter(Boolean).filter((proof) => proof.identityKey === delta.identityKey || (
    proof.sourcePath === delta.sourcePath
      && proof.publicOwnerName === delta.publicOwnerName
      && proof.tagKey === delta.tagKey
      && proof.returnOrdinal === delta.returnOrdinal
      && proof.collectionKind === delta.collectionKind
  ));
  return matches.find((proof) => isRenderReturnCollectionProofCandidate(proof)) ?? matches[0];
}

function isRenderReturnCollectionProofCandidate(proof) {
  return proof?.schema === 'frontier.lang.jsxRenderReturnCollectionProof.v1'
    || proof?.kind === 'frontier.lang.jsxRenderReturnCollectionProof'
    || proof?.claimScope === 'static-render-return-collection-item-preservation-only'
    || proof?.collectionItemPreservationHash !== undefined
    || proof?.collectionItemPreservationClaim !== undefined;
}

function jsxRenderReturnCollectionProofHash(delta) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsxRenderReturnCollectionProof.expected.v1',
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
    collectionKind: delta.collectionKind,
    base: delta.base,
    worker: delta.worker,
    head: delta.head,
    output: delta.output
  });
}

function hasCollectionBoundary(record) {
  return (Array.isArray(record?.renderReturnRecords) ? record.renderReturnRecords : [])
    .some((item) => item?.collectionRecord);
}

function singleCollectionReturn(record) {
  const returns = Array.isArray(record?.renderReturnRecords) ? record.renderReturnRecords : [];
  if (returns.length !== 1) return undefined;
  const item = returns[0];
  return item?.collectionRecord ? item : undefined;
}

function collectionSummary(record) {
  const collection = record?.collectionRecord;
  if (!collection) return undefined;
  return compactRecord({
    ordinal: record.ordinal,
    returnKind: record.returnKind,
    branchControlKind: record.branchControlKind,
    expressionHash: record.expressionHash,
    signatureHash: record.signatureHash,
    proofStatus: record.proofStatus,
    collectionProofStatus: collection.proofStatus,
    collectionKind: collection.collectionKind,
    collectionClaimScope: collection.claimScope,
    collectionRenderEquivalenceClaim: collection.renderEquivalenceClaim,
    collectionRuntimeEquivalenceClaim: collection.runtimeEquivalenceClaim,
    sourceArrayName: collection.sourceArrayName,
    sourceArrayItemCount: collection.sourceArrayItemCount,
    sourceItemHashes: (collection.itemRecords ?? []).map((item) => item.sourceItemExpressionHash).filter(Boolean),
    mapCallbackHash: collection.mapCallbackExpressionText ? hashSemanticValue({ kind: 'frontier.lang.projectJsxRenderReturnMapCallback', text: collection.mapCallbackExpressionText }) : undefined,
    itemCount: collection.itemCount,
    itemHashes: collectionItemHashes(collection),
    keyedListHash: collection.keyedListRecord?.signatureHash,
    keyedListProofStatus: collection.keyedListRecord?.proofStatus,
    keyedListReasonCode: collection.keyedListRecord?.reasonCode,
    keyValues: collection.keyedListRecord?.keyValues,
    missingKeyOrdinals: collection.keyedListRecord?.missingKeyOrdinals,
    ambiguousKeyOrdinals: collection.keyedListRecord?.ambiguousKeyOrdinals,
    duplicateKeyValues: collection.keyedListRecord?.duplicateKeyValues,
    duplicateKeyOrdinals: collection.keyedListRecord?.duplicateKeyOrdinals,
    collectionSignatureHash: collection.signatureHash
  });
}

function nonCollectionRiskPresent(record) {
  return (record?.renderRiskKinds ?? []).some((kind) => kind !== 'render-return-boundary');
}

function dynamicCollectionPresent(collection) {
  if (!collection) return false;
  if (!['static-render-return-array-evidence', 'static-render-return-fragment-evidence', 'static-render-return-map-evidence'].includes(collection.proofStatus)) return true;
  return collection.renderEquivalenceClaim === true
    || collection.runtimeEquivalenceClaim === true
    || (collection.keyedListRecord && collection.keyedListRecord.proofStatus !== 'static-render-return-keyed-list-evidence')
    || collection.keyedListRecord?.renderEquivalenceClaim === true
    || collection.keyedListRecord?.runtimeEquivalenceClaim === true;
}

function collectionItemHashes(collection) {
  return (collection?.itemRecords ?? []).map((item) => item?.signatureHash).filter(Boolean);
}

function collectionItemHash(delta, origin, index) {
  return SourceOrigins.has(origin) ? delta[origin]?.itemHashes?.[index] : undefined;
}

function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function uniqueNumbers(values) { return [...new Set(values.filter((value) => Number.isFinite(value)))]; }

export {
  JsxRenderReturnCollectionRoute,
  jsxRenderReturnCollectionDelta,
  jsxRenderReturnCollectionProofAssessment,
  jsxRenderReturnCollectionProofHash
};
