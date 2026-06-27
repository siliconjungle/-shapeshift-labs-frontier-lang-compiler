const semanticReplaySignals = Object.freeze({
  missingProof: 'semantic-edit-replay-proof-not-produced',
  outputMismatch: 'semantic-edit-replay-proof-output-mismatch',
  staleCurrentSource: 'semantic-edit-replay-proof-stale-current-source'
});

function semanticReplayMissingSignal(status, facts, failed, stale) {
  if (!facts.length || status === 'passed') return undefined;
  if (stale.length) return semanticReplaySignals.staleCurrentSource;
  if (failed.some((fact) => fact.outputBindingStatus === 'failed')) return semanticReplaySignals.outputMismatch;
  return semanticReplaySignals.missingProof;
}

function semanticReplayNextMissingEvidence(input) {
  const failedOrMissing = [...input.failed, ...input.missing];
  const stale = input.stale ?? [];
  if (stale.length) return staleReplayEvidenceRoute(input, stale);
  const outputMismatched = failedOrMissing.filter((fact) => fact.outputBindingStatus === 'failed');
  if (outputMismatched.length) return outputMismatchEvidenceRoute(input, outputMismatched);
  return missingReplayEvidenceRoute(input, failedOrMissing);
}

function semanticReplayNextAction(nextMissingEvidence, missingSignal) {
  if (!missingSignal) return undefined;
  if (nextMissingEvidence?.action === 'rerun') {
    return 'Rerun semantic edit replay against the current project head hash before admission.';
  }
  if (nextMissingEvidence?.action === 'reject-proof') {
    return 'Reject the output-mismatched semantic edit replay proof and inspect the replay output binding before admission.';
  }
  return 'Produce semantic edit replay diagnostics and require accepted-clean replay plus already-applied verification before admission.';
}

function semanticReplayProofRoute(status, reasonCodes, rerunRoute, binding = {}) {
  if (rerunRoute) return rerunRoute;
  const routeReasonCodes = uniqueStrings([
    ...reasonCodes,
    ...semanticReplayOutputMismatchReasonCodes(binding)
  ]);
  const outputMismatchReasons = routeReasonCodes.filter(isReplayOutputMismatchReasonCode);
  if ((status === 'blocked' || status === 'accepted-clean') && outputMismatchReasons.length) return {
    routeId: 'reject-semantic-edit-replay-output-mismatch',
    routeLane: 'source-files',
    routeNext: 'inspect-semantic-edit-replay-output-binding',
    action: 'reject-proof',
    reasonCodes: uniqueStrings(outputMismatchReasons),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
  return semanticReplayCurrentHeadCommutationProofRoute({
    ...binding,
    status,
    reasonCodes: routeReasonCodes
  });
}

function semanticReplayCurrentHeadCommutationProofRoute(input = {}) {
  const reasonCodes = uniqueStrings(input.reasonCodes ?? []);
  if (input.status !== 'accepted-clean' || reasonCodes.length) return undefined;
  const outputBindingStatus = input.outputBindingStatus ?? input.outputBinding?.status;
  if (outputBindingStatus !== 'bound') return undefined;
  const expectedCurrentHash = firstString(input.expectedCurrentHash, input.currentSourceHash);
  const replayCurrentHash = firstString(input.replayCurrentHash, input.currentHash, input.observedCurrentHash);
  if (!expectedCurrentHash || expectedCurrentHash !== replayCurrentHash) return undefined;
  const expectedOutputHash = firstString(
    input.expectedOutputHash,
    input.outputBinding?.expectedOutputHash
  );
  const projectionOutputHash = firstString(
    input.projectionOutputHash,
    input.projectedHash,
    input.outputBinding?.projectionOutputHash,
    input.outputBinding?.projectedHash
  );
  const replayOutputHash = firstString(
    input.replayOutputHash,
    input.outputHash,
    input.outputBinding?.replayedOutputHash,
    input.outputBinding?.replayOutputHash
  );
  if (!expectedOutputHash || expectedOutputHash !== replayOutputHash) return undefined;
  if (projectionOutputHash && projectionOutputHash !== expectedOutputHash) return undefined;
  if (projectionOutputHash && projectionOutputHash !== replayOutputHash) return undefined;
  return compactRecord({
    routeId: 'admit-independent-semantic-edit-current-head-commutation',
    routeLane: 'source-files',
    routeNext: 'apply-source-bound-semantic-edit-replay',
    action: 'apply',
    proofKind: 'bounded-current-head-commutation',
    status: 'passed',
    proofLevel: input.proofLevel,
    reasonCodes: ['semantic-edit-current-head-commutation-bound'],
    sourcePath: input.sourcePath,
    replayId: input.replayId,
    appliedOperations: input.appliedOperations,
    expectedCurrentHash,
    replayCurrentHash,
    expectedOutputHash,
    projectionOutputHash,
    replayOutputHash,
    outputBindingStatus,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function semanticReplayOutputMismatchReasonCodes(binding = {}) {
  const expectedOutputHash = firstString(
    binding.expectedOutputHash,
    binding.outputBinding?.expectedOutputHash
  );
  const projectionOutputHash = firstString(
    binding.projectionOutputHash,
    binding.projectedHash,
    binding.outputBinding?.projectionOutputHash,
    binding.outputBinding?.projectedHash
  );
  const replayOutputHash = firstString(
    binding.replayOutputHash,
    binding.outputHash,
    binding.outputBinding?.replayedOutputHash,
    binding.outputBinding?.replayOutputHash
  );
  return uniqueStrings([
    expectedOutputHash && replayOutputHash && expectedOutputHash !== replayOutputHash
      ? 'semantic-edit-replay-output-hash-mismatch'
      : undefined,
    expectedOutputHash && projectionOutputHash && expectedOutputHash !== projectionOutputHash
      ? 'semantic-edit-projection-output-hash-mismatch'
      : undefined,
    projectionOutputHash && replayOutputHash && projectionOutputHash !== replayOutputHash
      ? 'semantic-edit-replay-projection-output-hash-mismatch'
      : undefined
  ]);
}

function staleReplayEvidenceRoute(input, stale) {
  return {
    code: input.missingSignal,
    kind: 'proof-level',
    scope: 'source-files',
    status: 'stale',
    proofLevel: input.level,
    action: 'rerun',
    routeId: 'rerun-semantic-edit-replay-current-head',
    routeLane: 'source-files',
    routeNext: 'rerun-semantic-edit-replay-on-current-head',
    reasonCodes: uniqueStrings(stale.flatMap((fact) => fact.reasonCodes)),
    sourceBindingStatuses: uniqueStrings(stale.map((fact) => fact.sourceBindingStatus)),
    expectedCurrentHashes: uniqueStrings(stale.map((fact) => fact.expectedCurrentHash)),
    replayCurrentHashes: uniqueStrings(stale.map((fact) => fact.replayCurrentHash)),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function outputMismatchEvidenceRoute(input, outputMismatched) {
  return {
    code: input.missingSignal,
    kind: 'proof-level',
    scope: 'source-files',
    status: 'failed',
    proofLevel: input.level,
    action: 'reject-proof',
    routeId: 'reject-semantic-edit-replay-output-mismatch',
    routeLane: 'source-files',
    routeNext: 'inspect-semantic-edit-replay-output-binding',
    reasonCodes: uniqueStrings(outputMismatched.flatMap((fact) => fact.reasonCodes)),
    outputBindingStatuses: uniqueStrings(outputMismatched.map((fact) => fact.outputBindingStatus)),
    expectedOutputHashes: uniqueStrings(outputMismatched.map((fact) => fact.expectedOutputHash)),
    projectionOutputHashes: uniqueStrings(outputMismatched.map((fact) => fact.projectionOutputHash)),
    replayOutputHashes: uniqueStrings(outputMismatched.map((fact) => fact.replayOutputHash)),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function missingReplayEvidenceRoute(input, failedOrMissing) {
  return {
    code: input.missingSignal,
    kind: 'proof-level',
    scope: 'source-files',
    status: input.status === 'failed' ? 'failed' : 'missing',
    proofLevel: input.level,
    action: 'review',
    routeId: 'produce-semantic-edit-replay-proof',
    routeLane: 'source-files',
    routeNext: 'run-semantic-edit-replay-diagnostics',
    reasonCodes: uniqueStrings(failedOrMissing.flatMap((fact) => fact.reasonCodes)),
    outputBindingStatuses: uniqueStrings(failedOrMissing.map((fact) => fact.outputBindingStatus)),
    sourceBindingStatuses: uniqueStrings(failedOrMissing.map((fact) => fact.sourceBindingStatus)),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function isReplayOutputMismatchReasonCode(code) {
  return code === 'semantic-edit-replay-output-source-mismatch'
    || code === 'semantic-edit-replay-output-hash-mismatch'
    || code === 'semantic-edit-projection-output-source-mismatch'
    || code === 'semantic-edit-projection-output-hash-mismatch'
    || code === 'semantic-edit-replay-projection-output-source-mismatch'
    || code === 'semantic-edit-replay-projection-output-hash-mismatch'
    || code === 'semantic-edit-replay-output-mismatch';
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))];
}
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}

export {
  semanticReplayCurrentHeadCommutationProofRoute,
  semanticReplayMissingSignal,
  semanticReplayNextAction,
  semanticReplayNextMissingEvidence,
  semanticReplayProofRoute,
  semanticReplaySignals
};
