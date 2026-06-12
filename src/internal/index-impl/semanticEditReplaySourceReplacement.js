export function explicitSourceReplacementReplayRange(edit, symbolRange, sourceText) {
  if (edit.sourceRangeKind !== 'cross-language-explicit-source-replacement' || !symbolRange || typeof sourceText !== 'string') {
    return undefined;
  }
  const deleted = uniqueTextRange(sourceText, symbolRange, edit.deletedText, 'deleted-text');
  if (deleted) return deleted;
  return relativeAnchorRange(edit, symbolRange);
}

function uniqueTextRange(sourceText, symbolRange, needle, label) {
  if (typeof needle !== 'string' || needle.length === 0) return undefined;
  const symbolText = sourceText.slice(symbolRange.start, symbolRange.end);
  const first = symbolText.indexOf(needle);
  if (first < 0 || symbolText.indexOf(needle, first + 1) >= 0) return undefined;
  return {
    range: { start: symbolRange.start + first, end: symbolRange.start + first + needle.length },
    reasonCode: `current-symbol-explicit-source-replacement-${label}`
  };
}

function relativeAnchorRange(edit, symbolRange) {
  if (!Number.isFinite(edit.headAnchorStart) || !Number.isFinite(edit.headAnchorEnd)) return undefined;
  if (!Number.isFinite(edit.headStart) || !Number.isFinite(edit.headEnd)) return undefined;
  const offset = edit.headStart - edit.headAnchorStart;
  const length = edit.headEnd - edit.headStart;
  if (offset < 0 || length < 0) return undefined;
  const range = { start: symbolRange.start + offset, end: symbolRange.start + offset + length };
  if (range.start < symbolRange.start || range.end > symbolRange.end) return undefined;
  return { range, reasonCode: 'current-symbol-explicit-source-replacement-relative-offset' };
}
