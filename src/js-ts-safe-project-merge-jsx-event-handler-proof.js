import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const StaticEventHandlerStatuses = new Set([
  'static-event-handler-reference-evidence',
  'static-optional-event-handler-reference-evidence',
  'static-inline-event-handler-evidence'
]);

const JsxEventHandlerSourceRoute = Object.freeze({
  routeId: 'prove-jsx-event-handler-source-preservation',
  routeLane: 'jsx-static-event-handlers',
  routeNext: 'supply-jsx-event-handler-source-proof'
});

function jsxEventHandlerSourceProofAssessment(input, options = {}) {
  const delta = jsxEventHandlerSourceDelta(input);
  if (!delta) return undefined;
  const proof = jsxEventHandlerSourceProofFor(delta, options);
  const reasonCodes = [];
  if (!proof) reasonCodes.push('jsx-render-event-handler-source-proof-missing');
  else {
    if (proof.status !== 'passed' && proof.status !== 'verified') reasonCodes.push('jsx-render-event-handler-source-proof-status-not-passed');
    if (proof.schema !== 'frontier.lang.jsxEventHandlerSourceProof.v1' && proof.kind !== 'frontier.lang.jsxEventHandlerSourceProof') reasonCodes.push('jsx-render-event-handler-source-proof-schema-missing');
    if (proof.sourcePath !== delta.sourcePath) reasonCodes.push('jsx-render-event-handler-source-proof-source-path-mismatch');
    for (const stage of ['base', 'worker', 'head', 'output']) {
      if (proof[`${stage}SourceHash`] !== delta[`${stage}SourceHash`]) reasonCodes.push('jsx-render-event-handler-source-proof-source-hash-mismatch');
      if (proof[`${stage}EventHandlerSignatureHash`] !== delta[stage]?.eventHandlerSignatureHash) reasonCodes.push('jsx-render-event-handler-source-proof-signature-hash-mismatch');
    }
    if (proof.identityKey !== undefined && proof.identityKey !== delta.identityKey) reasonCodes.push('jsx-render-event-handler-source-proof-identity-mismatch');
    if (proof.publicOwnerName !== delta.publicOwnerName || proof.tagName !== delta.tagName || proof.tagKey !== delta.tagKey) reasonCodes.push('jsx-render-event-handler-source-proof-identity-mismatch');
    if (delta.nonEventHandlerRiskPresent) reasonCodes.push('jsx-render-event-handler-source-proof-non-event-handler-risk-present');
    if (delta.dynamicEventHandlerPresent) reasonCodes.push('jsx-render-event-handler-source-proof-dynamic-handler-unsupported');
    reasonCodes.push(...eventHandlerSourceReasonCodes(delta, proof));
    if (proof.eventHandlerSourcePreservationHash !== delta.eventHandlerSourcePreservationHash) reasonCodes.push('jsx-render-event-handler-source-proof-output-signature-mismatch');
    if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
      || proof.renderEquivalenceClaim !== false || proof.eventHandlerSourcePreservationClaim !== true
      || proof.claimScope !== 'static-event-handler-source-preservation-only') {
      reasonCodes.push('jsx-render-event-handler-source-proof-claim-flags-missing');
    }
  }
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    ...JsxEventHandlerSourceRoute,
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.jsxEventHandlerSourceProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.proofHash,
      ...JsxEventHandlerSourceRoute,
      reasonCodes: uniqueStrings(reasonCodes),
      expected: delta,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      eventHandlerSourcePreservationClaim: status === 'passed'
    })
  };
}

function jsxEventHandlerSourceDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  if (!Object.values(records).some((record) => hasEventHandlerBoundary(record))) return undefined;
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const delta = compactRecord({
    schema: 'frontier.lang.jsxEventHandlerSourceDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName: firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName),
    tagName: firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName),
    tagKey: firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash,
    nonEventHandlerRiskPresent: Object.values(records).some((record) => nonEventHandlerRiskPresent(record)) || undefined,
    dynamicEventHandlerPresent: Object.values(records).some((record) => dynamicEventHandlerPresent(record)) || undefined,
    base: eventHandlerSummary(baseRecord),
    worker: eventHandlerSummary(workerRecord),
    head: eventHandlerSummary(headRecord),
    output: eventHandlerSummary(outputRecord)
  });
  return { ...delta, eventHandlerSourcePreservationHash: jsxEventHandlerSourceProofHash(delta) };
}

function eventHandlerSourceReasonCodes(delta, proof) {
  const reasons = [];
  const merge = eventHandlerAdditiveMerge(delta);
  if (!merge.addOnly) reasons.push('jsx-render-event-handler-source-proof-non-additive-handler-change');
  if (merge.existingHandlerModification) reasons.push('jsx-render-event-handler-source-proof-existing-handler-modification');
  if (merge.overlappingAdditions) reasons.push('jsx-render-event-handler-source-proof-overlapping-addition');
  if (!sameStrings(delta.output?.eventHandlerPropNames, merge.expectedOutputEventHandlerPropNames)) reasons.push('jsx-render-event-handler-source-proof-output-handlers-mismatch');
  if (!sameStrings(proof.outputEventHandlerPropNames, delta.output?.eventHandlerPropNames)) reasons.push('jsx-render-event-handler-source-proof-output-handlers-mismatch');
  if (!sameStrings(proof.workerAddedEventHandlerPropNames, merge.workerAddedEventHandlerPropNames)) reasons.push('jsx-render-event-handler-source-proof-additions-mismatch');
  if (!sameStrings(proof.headAddedEventHandlerPropNames, merge.headAddedEventHandlerPropNames)) reasons.push('jsx-render-event-handler-source-proof-additions-mismatch');
  if (proof.outputEventHandlerSignatureHash !== delta.output?.eventHandlerSignatureHash) reasons.push('jsx-render-event-handler-source-proof-output-signature-mismatch');
  return reasons;
}

function jsxEventHandlerSourceProofFor(delta, options = {}) {
  const matches = [
    options.jsxEventHandlerSourceProof,
    ...(Array.isArray(options.jsxEventHandlerSourceProofs) ? options.jsxEventHandlerSourceProofs : []),
    ...(Array.isArray(options.evidence) ? options.evidence : [])
  ].filter(Boolean).filter((proof) => proof.identityKey === delta.identityKey || (
    proof.sourcePath === delta.sourcePath
      && proof.publicOwnerName === delta.publicOwnerName
      && proof.tagKey === delta.tagKey
  ));
  return matches.find((proof) => isEventHandlerSourceProofCandidate(proof)) ?? matches[0];
}

function isEventHandlerSourceProofCandidate(proof) {
  return proof?.schema === 'frontier.lang.jsxEventHandlerSourceProof.v1'
    || proof?.kind === 'frontier.lang.jsxEventHandlerSourceProof'
    || proof?.claimScope === 'static-event-handler-source-preservation-only'
    || proof?.eventHandlerSourcePreservationHash !== undefined
    || proof?.eventHandlerSourcePreservationClaim !== undefined;
}

function jsxEventHandlerSourceProofHash(delta) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsxEventHandlerSourceProof.expected.v1',
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

function eventHandlerAdditiveMerge(delta) {
  const base = recordMap(delta.base?.eventHandlerPropRecords);
  const worker = recordMap(delta.worker?.eventHandlerPropRecords);
  const head = recordMap(delta.head?.eventHandlerPropRecords);
  const output = recordMap(delta.output?.eventHandlerPropRecords);
  const workerAddedEventHandlerPropNames = addedPropNames(base, worker);
  const headAddedEventHandlerPropNames = addedPropNames(base, head);
  const overlappingAdditions = workerAddedEventHandlerPropNames.some((name) => headAddedEventHandlerPropNames.includes(name));
  const existingHandlerModification = [...base.keys()].some((name) =>
    (worker.has(name) && !sameHandlerRecord(base.get(name), worker.get(name)))
    || (head.has(name) && !sameHandlerRecord(base.get(name), head.get(name)))
  );
  const expectedOutputEventHandlerPropNames = uniqueStrings([
    ...(delta.base?.eventHandlerPropNames ?? []),
    ...workerAddedEventHandlerPropNames,
    ...headAddedEventHandlerPropNames
  ]);
  const outputPreservesExpected = expectedOutputEventHandlerPropNames.every((name) => output.has(name))
    && output.size === expectedOutputEventHandlerPropNames.length
    && [...base.entries()].every(([name, record]) => sameHandlerRecord(record, output.get(name)))
    && workerAddedEventHandlerPropNames.every((name) => sameHandlerRecord(worker.get(name), output.get(name)))
    && headAddedEventHandlerPropNames.every((name) => sameHandlerRecord(head.get(name), output.get(name)));
  return {
    addOnly: !existingHandlerModification && outputPreservesExpected,
    existingHandlerModification,
    overlappingAdditions,
    workerAddedEventHandlerPropNames,
    headAddedEventHandlerPropNames,
    expectedOutputEventHandlerPropNames
  };
}

function addedPropNames(base, side) {
  return [...side.keys()].filter((name) => !base.has(name));
}

function recordMap(records = []) {
  const map = new Map();
  for (const record of records) {
    if (!record?.propName || map.has(record.propName)) continue;
    map.set(record.propName, record);
  }
  return map;
}

function sameHandlerRecord(left, right) {
  return left?.propName === right?.propName
    && left?.propKind === right?.propKind
    && left?.proofStatus === right?.proofStatus
    && left?.handlerReferenceText === right?.handlerReferenceText
    && left?.handlerDeclarationHash === right?.handlerDeclarationHash
    && left?.inlineHandlerExpressionHash === right?.inlineHandlerExpressionHash
    && left?.expressionHash === right?.expressionHash
    && left?.signatureHash === right?.signatureHash;
}

function hasEventHandlerBoundary(record) {
  return (record?.renderRiskKinds ?? []).includes('event-handler-prop-boundary')
    || (Array.isArray(record?.eventHandlerPropRecords) && record.eventHandlerPropRecords.length > 0);
}

function eventHandlerSummary(record) {
  if (!record) return undefined;
  return compactRecord({
    eventHandlerPropNames: record.eventHandlerPropNames,
    eventHandlerPropCount: record.eventHandlerPropCount,
    eventHandlerSignatureHash: record.eventHandlerSignatureHash,
    eventHandlerPropRecords: (record.eventHandlerPropRecords ?? []).map(eventHandlerRecordSummary)
  });
}

function eventHandlerRecordSummary(record) {
  return compactRecord({
    propName: record.propName,
    ordinal: record.ordinal,
    propKind: record.propKind,
    proofStatus: record.proofStatus,
    reasonCode: record.reasonCode,
    handlerReferenceText: record.handlerReferenceText,
    handlerReferenceRoot: record.handlerReferenceRoot,
    handlerReferencePath: record.handlerReferencePath,
    optionalReference: record.optionalReference,
    optionalReferenceSegments: record.optionalReferenceSegments,
    optionalReferenceSegmentIndexes: record.optionalReferenceSegmentIndexes,
    optionalNullishBoundaryCount: record.optionalNullishBoundaryCount,
    handlerDeclarationKind: record.handlerDeclarationKind,
    handlerDeclarationName: record.handlerDeclarationName,
    handlerDeclarationOwnerName: record.handlerDeclarationOwnerName,
    handlerDeclarationHash: record.handlerDeclarationHash,
    inlineHandlerText: record.inlineHandlerText,
    inlineHandlerExpressionHash: record.inlineHandlerExpressionHash,
    dynamicExpressionText: record.dynamicExpressionText,
    dynamicExpressionKind: record.dynamicExpressionKind,
    dynamicBlockerReasonCode: record.dynamicBlockerReasonCode,
    expressionHash: record.expressionHash,
    signatureHash: record.signatureHash
  });
}

function nonEventHandlerRiskPresent(record) {
  return (record?.renderRiskKinds ?? []).some((kind) => kind !== 'event-handler-prop-boundary');
}

function dynamicEventHandlerPresent(record) {
  return (record?.eventHandlerPropRecords ?? []).some((handler) =>
    !StaticEventHandlerStatuses.has(handler?.proofStatus)
    || Boolean(handler?.dynamicExpressionText || handler?.dynamicExpressionKind || handler?.dynamicBlockerReasonCode)
  );
}

function sameStrings(left = [], right = []) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => item === right[index]);
}
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  JsxEventHandlerSourceRoute,
  jsxEventHandlerSourceDelta,
  jsxEventHandlerSourceProofAssessment,
  jsxEventHandlerSourceProofHash
};
