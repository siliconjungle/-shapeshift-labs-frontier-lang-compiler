import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const JsxHookEffectSourceRoute = Object.freeze({
  routeId: 'prove-jsx-hook-effect-callback-cleanup-source-preservation',
  routeLane: 'jsx-static-hook-effects',
  routeNext: 'supply-jsx-hook-effect-source-proof'
});

function jsxHookEffectSourceProofAssessment(input, options = {}) {
  const delta = jsxHookEffectSourceDelta(input);
  if (!delta) return undefined;
  const proof = jsxHookEffectSourceProofFor(delta, options);
  const reasonCodes = [];
  if (!proof) reasonCodes.push('jsx-render-hook-effect-source-proof-missing');
  else {
    if (proof.status !== 'passed' && proof.status !== 'verified') reasonCodes.push('jsx-render-hook-effect-source-proof-status-not-passed');
    if (proof.schema !== 'frontier.lang.jsxHookEffectSourceProof.v1' && proof.kind !== 'frontier.lang.jsxHookEffectSourceProof') reasonCodes.push('jsx-render-hook-effect-source-proof-schema-missing');
    if (proof.sourcePath !== delta.sourcePath) reasonCodes.push('jsx-render-hook-effect-source-proof-source-path-mismatch');
    for (const stage of ['base', 'worker', 'head', 'output']) {
      if (proof[`${stage}SourceHash`] !== delta[`${stage}SourceHash`]) reasonCodes.push('jsx-render-hook-effect-source-proof-source-hash-mismatch');
    }
    if (proof.identityKey !== undefined && proof.identityKey !== delta.identityKey) reasonCodes.push('jsx-render-hook-effect-source-proof-identity-mismatch');
    if (proof.publicOwnerName !== delta.publicOwnerName || proof.tagName !== delta.tagName || proof.tagKey !== delta.tagKey) reasonCodes.push('jsx-render-hook-effect-source-proof-identity-mismatch');
    if (proof.hookName !== delta.hookName || proof.hookOrdinal !== delta.hookOrdinal) reasonCodes.push('jsx-render-hook-effect-source-proof-hook-identity-mismatch');
    if (delta.nonHookEffectRiskPresent) reasonCodes.push('jsx-render-hook-effect-source-proof-non-hook-effect-risk-present');
    if (delta.hookEffectCountUnsupported) reasonCodes.push('jsx-render-hook-effect-source-proof-count-unsupported');
    if (delta.dynamicHookEffectPresent) reasonCodes.push('jsx-render-hook-effect-source-proof-dynamic-effect-unsupported');
    reasonCodes.push(...hookEffectSourceReasonCodes(delta, proof));
    if (proof.hookEffectSourcePreservationHash !== delta.hookEffectSourcePreservationHash) reasonCodes.push('jsx-render-hook-effect-source-proof-output-signature-mismatch');
    if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
      || proof.renderEquivalenceClaim !== false || proof.hookEffectSourcePreservationClaim !== true
      || proof.claimScope !== 'static-hook-effect-callback-cleanup-source-preservation-only') {
      reasonCodes.push('jsx-render-hook-effect-source-proof-claim-flags-missing');
    }
  }
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    ...JsxHookEffectSourceRoute,
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.jsxHookEffectSourceProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.proofHash,
      ...JsxHookEffectSourceRoute,
      reasonCodes: uniqueStrings(reasonCodes),
      expected: delta,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      hookEffectSourcePreservationClaim: status === 'passed'
    })
  };
}

function jsxHookEffectSourceDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  if (!Object.values(records).some((record) => hasHookEffectBoundary(record))) return undefined;
  const effects = Object.fromEntries(Object.entries(records).map(([stage, record]) => [stage, singleHookEffect(record)]));
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const delta = compactRecord({
    schema: 'frontier.lang.jsxHookEffectSourceDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName: firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName),
    tagName: firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName),
    tagKey: firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash,
    hookName: firstString(effects.output?.hookName, effects.worker?.hookName, effects.head?.hookName, effects.base?.hookName),
    hookOrdinal: firstNumber(effects.output?.ordinal, effects.worker?.ordinal, effects.head?.ordinal, effects.base?.ordinal),
    nonHookEffectRiskPresent: Object.values(records).some((record) => nonHookEffectRiskPresent(record)) || undefined,
    hookEffectCountUnsupported: Object.values(effects).some((effect) => !effect) || undefined,
    dynamicHookEffectPresent: Object.values(effects).some((effect) => dynamicHookEffectPresent(effect)) || undefined,
    base: hookEffectSummary(effects.base),
    worker: hookEffectSummary(effects.worker),
    head: hookEffectSummary(effects.head),
    output: hookEffectSummary(effects.output)
  });
  return { ...delta, hookEffectSourcePreservationHash: jsxHookEffectSourceProofHash(delta) };
}

function hookEffectSourceReasonCodes(delta, proof) {
  const reasons = [];
  if (proof.callbackOrigin === undefined) reasons.push('jsx-render-hook-effect-source-proof-output-origin-missing');
  if (proof.outputCallbackHash !== delta.output?.callbackHash) reasons.push('jsx-render-hook-effect-source-proof-callback-hash-mismatch');
  if (proof.callbackHash !== effectHash(delta, proof.callbackOrigin, 'callbackHash')) reasons.push('jsx-render-hook-effect-source-proof-callback-hash-mismatch');
  if (delta.output?.callbackHash !== effectHash(delta, proof.callbackOrigin, 'callbackHash')) reasons.push('jsx-render-hook-effect-source-proof-callback-hash-mismatch');
  const cleanupRequired = Boolean(delta.output?.cleanupReturnPresent || delta.base?.cleanupReturnPresent || delta.worker?.cleanupReturnPresent || delta.head?.cleanupReturnPresent);
  if (!cleanupRequired) {
    if (proof.cleanupReturnOrigin !== undefined || proof.cleanupReturnHash !== undefined || proof.outputCleanupReturnHash !== undefined) {
      reasons.push('jsx-render-hook-effect-source-proof-cleanup-hash-mismatch');
    }
    return reasons;
  }
  if (proof.cleanupReturnOrigin === undefined) reasons.push('jsx-render-hook-effect-source-proof-output-origin-missing');
  if (proof.outputCleanupReturnHash !== delta.output?.cleanupReturnHash) reasons.push('jsx-render-hook-effect-source-proof-cleanup-hash-mismatch');
  if (proof.cleanupReturnHash !== effectHash(delta, proof.cleanupReturnOrigin, 'cleanupReturnHash')) reasons.push('jsx-render-hook-effect-source-proof-cleanup-hash-mismatch');
  if (delta.output?.cleanupReturnHash !== effectHash(delta, proof.cleanupReturnOrigin, 'cleanupReturnHash')) reasons.push('jsx-render-hook-effect-source-proof-cleanup-hash-mismatch');
  return reasons;
}

function jsxHookEffectSourceProofFor(delta, options = {}) {
  const matches = [
    options.jsxHookEffectSourceProof,
    ...(Array.isArray(options.jsxHookEffectSourceProofs) ? options.jsxHookEffectSourceProofs : []),
    ...(Array.isArray(options.evidence) ? options.evidence : [])
  ].filter(Boolean).filter((proof) => proof.identityKey === delta.identityKey || (
    proof.sourcePath === delta.sourcePath
      && proof.publicOwnerName === delta.publicOwnerName
      && proof.tagKey === delta.tagKey
      && proof.hookName === delta.hookName
      && proof.hookOrdinal === delta.hookOrdinal
  ));
  return matches.find((proof) => isHookEffectSourceProofCandidate(proof)) ?? matches[0];
}

function isHookEffectSourceProofCandidate(proof) {
  return proof?.schema === 'frontier.lang.jsxHookEffectSourceProof.v1'
    || proof?.kind === 'frontier.lang.jsxHookEffectSourceProof'
    || proof?.claimScope === 'static-hook-effect-callback-cleanup-source-preservation-only'
    || proof?.hookEffectSourcePreservationHash !== undefined
    || proof?.hookEffectSourcePreservationClaim !== undefined;
}

function jsxHookEffectSourceProofHash(delta) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsxHookEffectSourceProof.expected.v1',
    identityKey: delta.identityKey,
    sourcePath: delta.sourcePath,
    publicOwnerName: delta.publicOwnerName,
    tagName: delta.tagName,
    tagKey: delta.tagKey,
    baseSourceHash: delta.baseSourceHash,
    workerSourceHash: delta.workerSourceHash,
    headSourceHash: delta.headSourceHash,
    outputSourceHash: delta.outputSourceHash,
    hookName: delta.hookName,
    hookOrdinal: delta.hookOrdinal,
    base: delta.base,
    worker: delta.worker,
    head: delta.head,
    output: delta.output
  });
}

function hasHookEffectBoundary(record) {
  return (record?.renderRiskKinds ?? []).includes('hook-effect-boundary')
    || (Array.isArray(record?.hookEffectRecords) && record.hookEffectRecords.length > 0);
}

function singleHookEffect(record) {
  const effects = Array.isArray(record?.hookEffectRecords) ? record.hookEffectRecords : [];
  return effects.length === 1 ? effects[0] : undefined;
}

function hookEffectSummary(effect) {
  if (!effect) return undefined;
  return compactRecord({
    hookName: effect.hookName,
    ordinal: effect.ordinal,
    proofStatus: effect.proofStatus,
    callbackKind: effect.callbackKind,
    callbackHash: effect.callbackHash,
    dynamicCallbackKind: effect.dynamicCallbackKind,
    dynamicCallbackBlockerReasonCode: effect.dynamicCallbackBlockerReasonCode,
    cleanupProofStatus: effect.cleanupProofStatus,
    cleanupReturnKind: effect.cleanupReturnKind,
    cleanupReturnHash: effect.cleanupReturnHash,
    dynamicCleanupReturnKind: effect.dynamicCleanupReturnKind,
    dynamicCleanupReturnBlockerReasonCode: effect.dynamicCleanupReturnBlockerReasonCode,
    cleanupReturnPresent: effect.cleanupReturnPresent,
    runtimeEquivalenceClaim: effect.runtimeEquivalenceClaim,
    signatureHash: effect.signatureHash
  });
}

function nonHookEffectRiskPresent(record) {
  return (record?.renderRiskKinds ?? []).some((kind) => kind !== 'hook-owner-render-scope' && kind !== 'hook-effect-boundary');
}

function dynamicHookEffectPresent(effect) {
  if (!effect) return false;
  return effect.proofStatus !== 'static-effect-callback-source-evidence'
    || Boolean(effect.dynamicCallbackText || effect.dynamicCallbackKind || effect.dynamicCallbackBlockerReasonCode)
    || (effect.cleanupReturnPresent && effect.cleanupProofStatus !== 'static-effect-cleanup-source-evidence')
    || Boolean(effect.dynamicCleanupReturnText || effect.dynamicCleanupReturnKind || effect.dynamicCleanupReturnBlockerReasonCode)
    || effect.runtimeEquivalenceClaim !== false;
}

function effectHash(delta, origin, field) {
  return ['base', 'worker', 'head', 'output'].includes(origin) ? delta[origin]?.[field] : undefined;
}

function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function firstNumber(...values) { return values.find((value) => Number.isFinite(value)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  JsxHookEffectSourceRoute,
  jsxHookEffectSourceDelta,
  jsxHookEffectSourceProofAssessment,
  jsxHookEffectSourceProofHash
};
