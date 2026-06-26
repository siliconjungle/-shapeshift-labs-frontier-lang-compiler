function replayRerunRoute(status, reasonCodes, input, currentHash) {
  const staleReasons = reasonList(reasonCodes.filter(isRerunnableStaleReasonCode));
  return status === 'stale' && staleReasons.length ? compactRecord({
    routeId: 'rerun-semantic-edit-replay-current-head',
    routeLane: 'source-files',
    routeNext: 'rerun-semantic-edit-replay-on-current-head',
    action: 'rerun',
    reasonCodes: staleReasons,
    expectedCurrentHash: input.currentSourceHash,
    observedCurrentHash: currentHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  }) : undefined;
}

function isRerunnableStaleReasonCode(code) {
  return code === 'current-source-hash-mismatch';
}

function reasonList(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))];
}
function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}

export { isRerunnableStaleReasonCode, replayRerunRoute };
