import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const JsxHookDependencySourceRoute = Object.freeze({
  routeId: 'prove-jsx-hook-dependency-array-source-preservation',
  routeLane: 'jsx-static-hook-dependencies',
  routeNext: 'supply-jsx-hook-dependency-source-proof'
});

function jsxHookDependencySourceProofAssessment(input, options = {}) {
  const delta = jsxHookDependencySourceDelta(input);
  if (!delta) return undefined;
  const proof = jsxHookDependencySourceProofFor(delta, options);
  const reasonCodes = [];
  if (!proof) reasonCodes.push('jsx-render-hook-dependency-source-proof-missing');
  else {
    if (proof.status !== 'passed' && proof.status !== 'verified') reasonCodes.push('jsx-render-hook-dependency-source-proof-status-not-passed');
    if (proof.schema !== 'frontier.lang.jsxHookDependencySourceProof.v1' && proof.kind !== 'frontier.lang.jsxHookDependencySourceProof') reasonCodes.push('jsx-render-hook-dependency-source-proof-schema-missing');
    if (proof.sourcePath !== delta.sourcePath) reasonCodes.push('jsx-render-hook-dependency-source-proof-source-path-mismatch');
    for (const stage of ['base', 'worker', 'head', 'output']) {
      if (proof[`${stage}SourceHash`] !== delta[`${stage}SourceHash`]) reasonCodes.push('jsx-render-hook-dependency-source-proof-source-hash-mismatch');
      if (proof[`${stage}DependencyArrayHash`] !== delta[stage]?.dependencyArrayHash) reasonCodes.push('jsx-render-hook-dependency-source-proof-array-hash-mismatch');
    }
    if (proof.identityKey !== undefined && proof.identityKey !== delta.identityKey) reasonCodes.push('jsx-render-hook-dependency-source-proof-identity-mismatch');
    if (proof.publicOwnerName !== delta.publicOwnerName || proof.tagName !== delta.tagName || proof.tagKey !== delta.tagKey) reasonCodes.push('jsx-render-hook-dependency-source-proof-identity-mismatch');
    if (proof.hookName !== delta.hookName || proof.hookOrdinal !== delta.hookOrdinal) reasonCodes.push('jsx-render-hook-dependency-source-proof-hook-identity-mismatch');
    if (delta.nonHookDependencyRiskPresent) reasonCodes.push('jsx-render-hook-dependency-source-proof-non-hook-dependency-risk-present');
    if (delta.hookDependencyCountUnsupported) reasonCodes.push('jsx-render-hook-dependency-source-proof-count-unsupported');
    if (delta.dynamicHookDependencyPresent) reasonCodes.push('jsx-render-hook-dependency-source-proof-dynamic-dependency-unsupported');
    reasonCodes.push(...hookDependencySourceReasonCodes(delta, proof));
    if (proof.hookDependencySourcePreservationHash !== delta.hookDependencySourcePreservationHash) reasonCodes.push('jsx-render-hook-dependency-source-proof-output-signature-mismatch');
    if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
      || proof.renderEquivalenceClaim !== false || proof.hookDependencySourcePreservationClaim !== true
      || proof.claimScope !== 'static-hook-dependency-array-source-preservation-only') {
      reasonCodes.push('jsx-render-hook-dependency-source-proof-claim-flags-missing');
    }
  }
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    ...JsxHookDependencySourceRoute,
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.jsxHookDependencySourceProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.proofHash,
      ...JsxHookDependencySourceRoute,
      reasonCodes: uniqueStrings(reasonCodes),
      expected: delta,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      hookDependencySourcePreservationClaim: status === 'passed'
    })
  };
}

function jsxHookDependencySourceDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  if (!Object.values(records).some((record) => hasHookDependencyBoundary(record))) return undefined;
  const dependencies = Object.fromEntries(Object.entries(records).map(([stage, record]) => [stage, singleHookDependency(record)]));
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const delta = compactRecord({
    schema: 'frontier.lang.jsxHookDependencySourceDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName: firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName),
    tagName: firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName),
    tagKey: firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash,
    hookName: firstString(dependencies.output?.hookName, dependencies.worker?.hookName, dependencies.head?.hookName, dependencies.base?.hookName),
    hookOrdinal: firstNumber(dependencies.output?.ordinal, dependencies.worker?.ordinal, dependencies.head?.ordinal, dependencies.base?.ordinal),
    nonHookDependencyRiskPresent: Object.values(records).some((record) => nonHookDependencyRiskPresent(record)) || undefined,
    hookDependencyCountUnsupported: Object.values(dependencies).some((dependency) => !dependency) || undefined,
    dynamicHookDependencyPresent: Object.values(dependencies).some((dependency) => dynamicHookDependencyPresent(dependency)) || undefined,
    base: hookDependencySummary(dependencies.base),
    worker: hookDependencySummary(dependencies.worker),
    head: hookDependencySummary(dependencies.head),
    output: hookDependencySummary(dependencies.output)
  });
  return { ...delta, hookDependencySourcePreservationHash: jsxHookDependencySourceProofHash(delta) };
}

function hookDependencySourceReasonCodes(delta, proof) {
  const reasons = [];
  const merge = hookDependencyAdditiveMerge(delta);
  if (!merge.addOnly) reasons.push('jsx-render-hook-dependency-source-proof-non-additive-dependency-change');
  if (merge.overlappingAdditions) reasons.push('jsx-render-hook-dependency-source-proof-overlapping-addition');
  if (!sameStrings(delta.output?.dependencyTexts, merge.expectedOutputDependencyTexts)) reasons.push('jsx-render-hook-dependency-source-proof-output-dependencies-mismatch');
  if (!sameStrings(proof.outputDependencyTexts, delta.output?.dependencyTexts)) reasons.push('jsx-render-hook-dependency-source-proof-output-dependencies-mismatch');
  if (!sameStrings(proof.workerAddedDependencyTexts, merge.workerAddedDependencyTexts)) reasons.push('jsx-render-hook-dependency-source-proof-additions-mismatch');
  if (!sameStrings(proof.headAddedDependencyTexts, merge.headAddedDependencyTexts)) reasons.push('jsx-render-hook-dependency-source-proof-additions-mismatch');
  if (proof.outputDependencySignatureHash !== delta.output?.dependencySignatureHash) reasons.push('jsx-render-hook-dependency-source-proof-output-signature-mismatch');
  return reasons;
}

function jsxHookDependencySourceProofFor(delta, options = {}) {
  const matches = [
    options.jsxHookDependencySourceProof,
    ...(Array.isArray(options.jsxHookDependencySourceProofs) ? options.jsxHookDependencySourceProofs : []),
    ...(Array.isArray(options.evidence) ? options.evidence : [])
  ].filter(Boolean).filter((proof) => proof.identityKey === delta.identityKey || (
    proof.sourcePath === delta.sourcePath
      && proof.publicOwnerName === delta.publicOwnerName
      && proof.tagKey === delta.tagKey
      && proof.hookName === delta.hookName
      && proof.hookOrdinal === delta.hookOrdinal
  ));
  return matches.find((proof) => isHookDependencySourceProofCandidate(proof)) ?? matches[0];
}

function isHookDependencySourceProofCandidate(proof) {
  return proof?.schema === 'frontier.lang.jsxHookDependencySourceProof.v1'
    || proof?.kind === 'frontier.lang.jsxHookDependencySourceProof'
    || proof?.claimScope === 'static-hook-dependency-array-source-preservation-only'
    || proof?.hookDependencySourcePreservationHash !== undefined
    || proof?.hookDependencySourcePreservationClaim !== undefined;
}

function jsxHookDependencySourceProofHash(delta) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsxHookDependencySourceProof.expected.v1',
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

function hookDependencyAdditiveMerge(delta) {
  const base = delta.base?.dependencyTexts ?? [];
  const worker = delta.worker?.dependencyTexts ?? [];
  const head = delta.head?.dependencyTexts ?? [];
  const output = delta.output?.dependencyTexts ?? [];
  const workerAddedDependencyTexts = additions(base, worker);
  const headAddedDependencyTexts = additions(base, head);
  const addOnly = orderedSubsequence(base, worker) && orderedSubsequence(base, head) && orderedSubsequence(base, output);
  const overlappingAdditions = workerAddedDependencyTexts.some((item) => headAddedDependencyTexts.includes(item));
  return {
    addOnly,
    overlappingAdditions,
    workerAddedDependencyTexts,
    headAddedDependencyTexts,
    expectedOutputDependencyTexts: uniqueOrdered([...base, ...workerAddedDependencyTexts, ...headAddedDependencyTexts])
  };
}

function additions(base, side) {
  return side.filter((item) => !base.includes(item));
}

function orderedSubsequence(needle, haystack) {
  let index = 0;
  for (const item of haystack) if (item === needle[index]) index += 1;
  return index === needle.length;
}

function uniqueOrdered(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function hasHookDependencyBoundary(record) {
  return (record?.renderRiskKinds ?? []).includes('hook-dependency-boundary')
    || (Array.isArray(record?.hookDependencyRecords) && record.hookDependencyRecords.length > 0);
}

function singleHookDependency(record) {
  const dependencies = Array.isArray(record?.hookDependencyRecords) ? record.hookDependencyRecords : [];
  return dependencies.length === 1 ? dependencies[0] : undefined;
}

function hookDependencySummary(dependency) {
  if (!dependency) return undefined;
  return compactRecord({
    hookName: dependency.hookName,
    ordinal: dependency.ordinal,
    proofStatus: dependency.proofStatus,
    dependencyCount: dependency.dependencyCount,
    dependencyTexts: dependency.dependencyTexts,
    dependencyRecords: dependency.dependencyRecords,
    dynamicDependencyTexts: dependency.dynamicDependencyTexts,
    dynamicDependencyReasonCodes: dependency.dynamicDependencyReasonCodes,
    dependencyArrayHash: dependency.dependencyArrayHash,
    dependencySignatureHash: dependency.dependencySignatureHash
  });
}

function nonHookDependencyRiskPresent(record) {
  return (record?.renderRiskKinds ?? []).some((kind) => kind !== 'hook-owner-render-scope' && kind !== 'hook-dependency-boundary');
}

function dynamicHookDependencyPresent(dependency) {
  if (!dependency) return false;
  const records = Array.isArray(dependency.dependencyRecords) ? dependency.dependencyRecords : [];
  return dependency.proofStatus !== 'static-dependency-array-evidence'
    || Boolean(dependency.dynamicDependencyTexts?.length || dependency.dynamicDependencyReasonCodes?.length)
    || records.some((record) => record?.proofStatus !== undefined && record.proofStatus !== 'static-hook-dependency-evidence');
}

function sameStrings(left = [], right = []) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => item === right[index]);
}
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function firstNumber(...values) { return values.find((value) => Number.isFinite(value)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  JsxHookDependencySourceRoute,
  jsxHookDependencySourceDelta,
  jsxHookDependencySourceProofAssessment,
  jsxHookDependencySourceProofHash
};
