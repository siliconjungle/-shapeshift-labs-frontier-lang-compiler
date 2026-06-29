import { compactRecord } from './js-ts-safe-merge-context.js';
import { FRONTIER_SOURCE_BOUND_RUNTIME_PROOF_KIND, validateRuntimeProofAgainstProbe } from './js-ts-safe-project-merge-runtime-proof-capsule.js';

const JsxRuntimeProofRoute = Object.freeze({
  routeId: 'prove-jsx-render-runtime-source-boundary',
  routeLane: 'jsx-runtime-render-boundaries',
  routeNext: 'supply-jsx-render-runtime-proof'
});

function jsxRenderRuntimeProofAssessment(input, options = {}) {
  const delta = jsxRenderRuntimeProofDelta(input);
  if (!delta) return undefined;
  const candidates = jsxRenderRuntimeProofCandidates(options);
  if (candidates.length === 0) return jsxRenderRuntimeProofResult(delta, undefined, undefined, ['jsx-render-runtime-proof-missing']);
  let firstFailed;
  for (const proof of candidates) {
    if (!isJsxRuntimeProofCandidate(proof)) continue;
    const validation = jsxRenderRuntimeProofValidation(delta, proof);
    if (validation.ok) return jsxRenderRuntimeProofResult(delta, proof, validation, []);
    firstFailed ??= { proof, validation };
  }
  if (firstFailed) {
    return jsxRenderRuntimeProofResult(delta, firstFailed.proof, firstFailed.validation, [
      'jsx-render-runtime-proof-validation-failed',
      ...firstFailed.validation.reasonCodes
    ]);
  }
  return jsxRenderRuntimeProofResult(delta, candidates[0], undefined, ['jsx-render-runtime-proof-kind-invalid']);
}

function jsxRenderRuntimeProofDelta({ identityKey, baseRecord, workerRecord, headRecord, outputRecord } = {}) {
  const records = { base: baseRecord, worker: workerRecord, head: headRecord, output: outputRecord };
  if (!Object.values(records).some((record) => Array.isArray(record?.renderRiskKinds) && record.renderRiskKinds.length > 0)) return undefined;
  const sourcePath = firstString(outputRecord?.sourcePath, workerRecord?.sourcePath, headRecord?.sourcePath, baseRecord?.sourcePath);
  const publicOwnerName = firstString(outputRecord?.publicOwnerName, workerRecord?.publicOwnerName, headRecord?.publicOwnerName, baseRecord?.publicOwnerName);
  const tagName = firstString(outputRecord?.tagName, workerRecord?.tagName, headRecord?.tagName, baseRecord?.tagName);
  const tagKey = firstString(outputRecord?.tagKey, workerRecord?.tagKey, headRecord?.tagKey, baseRecord?.tagKey);
  const renderRiskKinds = uniqueStrings(Object.values(records).flatMap((record) => record?.renderRiskKinds ?? []));
  const renderRiskReasonCodes = uniqueStrings(Object.values(records).flatMap((record) => record?.renderRiskReasonCodes ?? []));
  return compactRecord({
    schema: 'frontier.lang.jsxRenderRuntimeProofDelta.v1',
    identityKey,
    sourcePath,
    publicOwnerName,
    tagName,
    tagKey,
    boundaryKeys: uniqueStrings([identityKey, stableKey(['jsx-render-runtime', sourcePath, publicOwnerName, tagName, tagKey])]),
    recordKeys: uniqueStrings([stableKey(['project-graph-delta', 'jsx-render-risk', identityKey])]),
    reasonCodes: uniqueStrings(['jsx-render-runtime-boundary', ...renderRiskReasonCodes]),
    renderRiskKinds,
    renderRiskReasonCodes,
    requiredRuntimeSignals: jsxRuntimeRequiredSignals(renderRiskKinds, renderRiskReasonCodes),
    baseSourceHash: baseRecord?.sourceHash,
    workerSourceHash: workerRecord?.sourceHash,
    headSourceHash: headRecord?.sourceHash,
    outputSourceHash: outputRecord?.sourceHash
  });
}

function jsxRenderRuntimeProofValidation(delta, proof) {
  const validation = validateRuntimeProofAgainstProbe(proof, {
    id: stableKey(['jsx-render-runtime-proof', delta.identityKey]) ?? 'jsx-render-runtime-proof',
    sourcePath: delta.sourcePath,
    reasonCode: delta.reasonCodes,
    boundaryKey: delta.boundaryKeys,
    recordKey: delta.recordKeys,
    sourceHashes: {
      base: delta.baseSourceHash,
      worker: delta.workerSourceHash,
      head: delta.headSourceHash,
      output: delta.outputSourceHash
    },
    requiredSourceRoles: ['base', 'worker', 'head', 'output'],
    requiredSignals: delta.requiredRuntimeSignals,
    requireRuntimeProofCapsule: true,
    requireSourceBoundProof: true,
    rejectBroadClaims: true,
    requireTelemetryHash: true,
    requireDomSnapshotHash: true,
    requireComputedStyleHash: true,
    requireLayoutSnapshotHash: true,
    requireEventTraceHash: jsxRuntimeRequiresEventTrace(delta),
    requireAccessibilitySnapshotHash: true,
    requireFocusSnapshotHash: true,
    maxCumulativeLayoutShift: typeof proof?.maxCumulativeLayoutShift === 'number' ? proof.maxCumulativeLayoutShift : 0.01
  });
  const localReasonCodes = jsxRuntimeNestedBroadClaimReasonCodes(proof);
  if (localReasonCodes.length === 0) return validation;
  return {
    ...validation,
    ok: false,
    reasonCodes: uniqueStrings([...(validation.reasonCodes ?? []), ...localReasonCodes])
  };
}

function jsxRenderRuntimeProofResult(delta, proof, validation, reasonCodes) {
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    ...JsxRuntimeProofRoute,
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.jsxRenderRuntimeProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.hash ?? proof?.sourceBoundRuntimeProofHash,
      ...JsxRuntimeProofRoute,
      reasonCodes: uniqueStrings(reasonCodes),
      expected: delta,
      runtimeCommand: validation?.ok ? validation.metadata.command : undefined,
      runtimeProbeId: validation?.ok ? validation.metadata.probeId : undefined,
      runtimeEvidenceHash: validation?.ok ? validation.metadata.evidenceHash : undefined,
      runtimeSignals: validation?.ok ? validation.metadata.signals : undefined,
      runtimeProofCapsule: validation?.ok ? validation.metadata.capsule : undefined,
      runtimeProofCapsuleHash: validation?.ok ? validation.metadata.capsule?.hash : undefined,
      runtimeTelemetryHash: validation?.ok ? validation.metadata.capsule?.telemetryHash : undefined,
      runtimeDomSnapshotHash: validation?.ok ? validation.metadata.capsule?.domSnapshotHash : undefined,
      runtimeComputedStyleHash: validation?.ok ? validation.metadata.capsule?.computedStyleHash : undefined,
      runtimeLayoutSnapshotHash: validation?.ok ? validation.metadata.capsule?.layoutSnapshotHash : undefined,
      runtimeEventTraceHash: validation?.ok ? validation.metadata.capsule?.eventTraceHash : undefined,
      runtimeAccessibilitySnapshotHash: validation?.ok ? validation.metadata.capsule?.accessibilitySnapshotHash : undefined,
      runtimeFocusSnapshotHash: validation?.ok ? validation.metadata.capsule?.focusSnapshotHash : undefined,
      runtimeCumulativeLayoutShift: validation?.ok ? validation.metadata.capsule?.cumulativeLayoutShift : undefined,
      sourceBoundRuntimeProofKind: proof?.kind,
      runtimeEvidenceBound: status === 'passed',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      renderEquivalenceClaim: false,
      browserRuntimeEquivalenceClaim: false,
      browserRenderEquivalenceClaim: false
    })
  };
}

function jsxRuntimeRequiredSignals(kinds, reasonCodes) {
  const text = [...kinds, ...reasonCodes].join(' ').toLowerCase();
  const signals = ['jsx-render-runtime', 'tsx-browser-runtime', 'browser-runtime'];
  if (text.includes('hook-dependency')) signals.unshift('jsx-hook-dependency-runtime');
  if (text.includes('hook-effect')) signals.unshift('jsx-hook-effect-runtime');
  if (text.includes('context')) signals.unshift('jsx-context-runtime');
  if (text.includes('wrapper')) signals.unshift('jsx-wrapper-runtime');
  if (text.includes('event-handler')) signals.unshift('jsx-event-handler-runtime');
  if (text.includes('branch') || text.includes('collection') || text.includes('fragment') || text.includes('child')) signals.unshift('jsx-render-layout-runtime');
  return uniqueStrings(signals);
}

function jsxRuntimeRequiresEventTrace(delta) {
  const text = [...(delta.renderRiskKinds ?? []), ...(delta.renderRiskReasonCodes ?? [])].join(' ').toLowerCase();
  return text.includes('hook') || text.includes('context') || text.includes('event-handler') || text.includes('wrapper');
}

function jsxRenderRuntimeProofCandidates(options = {}) {
  return [
    options.jsxRenderRuntimeProof,
    options.jsxRuntimeProof,
    ...(Array.isArray(options.jsxRenderRuntimeProofs) ? options.jsxRenderRuntimeProofs : []),
    ...(Array.isArray(options.jsxRuntimeProofs) ? options.jsxRuntimeProofs : []),
    ...(Array.isArray(options.runtimeProofs) ? options.runtimeProofs : []),
    ...(Array.isArray(options.evidence) ? options.evidence : [])
  ].filter(Boolean);
}

function isJsxRuntimeProofCandidate(proof) {
  return proof?.kind === FRONTIER_SOURCE_BOUND_RUNTIME_PROOF_KIND || proof?.runtimeProofCapsule !== undefined;
}

function jsxRuntimeNestedBroadClaimReasonCodes(proof) {
  const records = [
    proof?.runtimeProofCapsule,
    proof?.proofCapsule,
    proof?.fixtureCapsule,
    proof?.evidence,
    proof?.runtimeEvidence,
    proof?.browserEvidence,
    proof?.runtimeEvidence?.capsule,
    proof?.browserEvidence?.capsule,
    proof?.evidence?.capsule
  ].filter((record) => record && typeof record === 'object' && !Array.isArray(record));
  return records.some((record) => hasBroadEquivalenceClaim(record))
    ? ['jsx-render-runtime-proof-nested-broad-claim-present']
    : [];
}

function hasBroadEquivalenceClaim(record) {
  return record.autoMergeClaim === true
    || record.semanticEquivalenceClaim === true
    || record.runtimeEquivalenceClaim === true
    || record.renderEquivalenceClaim === true
    || record.browserRuntimeEquivalenceClaim === true
    || record.browserRenderEquivalenceClaim === true;
}

function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  JsxRuntimeProofRoute,
  jsxRenderRuntimeProofAssessment,
  jsxRenderRuntimeProofDelta
};
