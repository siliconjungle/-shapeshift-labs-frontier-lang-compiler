import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function replayOutputBinding(input, outputSourceText, outputHash, options = {}) {
  const expectedOutputSourceText = firstString(input.expectedOutputSourceText, input.outputSourceText);
  const expectedOutputHash = firstString(
    input.expectedOutputHash,
    input.outputHash,
    typeof expectedOutputSourceText === 'string' ? hashSemanticValue(expectedOutputSourceText) : undefined
  );
  if (typeof expectedOutputSourceText !== 'string' && typeof expectedOutputHash !== 'string') {
    return { status: undefined, reasonCodes: [] };
  }
  if (options.replayStatus === 'stale' && typeof outputSourceText !== 'string' && typeof outputHash !== 'string') {
    return compactRecord({
      status: 'skipped',
      reasonCodes: [],
      expectedOutputHash,
      replayedOutputHash: outputHash,
      skippedReason: 'stale-current-source-requires-rerun'
    });
  }
  const reasonCodes = [];
  if (typeof expectedOutputSourceText === 'string') {
    if (typeof outputSourceText !== 'string') reasonCodes.push('semantic-edit-replay-output-source-missing');
    else if (outputSourceText !== expectedOutputSourceText) reasonCodes.push('semantic-edit-replay-output-source-mismatch');
  }
  if (typeof expectedOutputHash === 'string') {
    if (typeof outputHash !== 'string') reasonCodes.push('semantic-edit-replay-output-hash-missing');
    else if (outputHash !== expectedOutputHash) reasonCodes.push('semantic-edit-replay-output-hash-mismatch');
  }
  return compactRecord({
    status: reasonCodes.length ? 'failed' : 'bound',
    reasonCodes,
    expectedOutputHash,
    replayedOutputHash: outputHash
  });
}

function replayOutputSource(status, sourceText, edits) {
  if (typeof sourceText !== 'string') return undefined;
  if (status === 'already-applied') return sourceText;
  if (status !== 'accepted-clean') return undefined;
  return edits.filter((edit) => edit.status === 'applied')
    .sort(replaySourceEditSort)
    .reduce((text, edit) => text.slice(0, edit.start) + editReplacement(edit, edits) + text.slice(edit.end), sourceText);
}

function replaySourceEditSort(left, right) {
  return right.start - left.start || right.end - left.end || (right.editOrder ?? 0) - (left.editOrder ?? 0);
}

function editReplacement(edit, edits) {
  return edits.find((candidate) => candidate.operationId === edit.operationId)?.replacementText ?? '';
}

function firstString(...values) { return values.find((value) => typeof value === 'string'); }
function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}

export { replayOutputBinding, replayOutputSource };
