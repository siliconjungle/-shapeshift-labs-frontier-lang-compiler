export function explicitSourceReplacementReplayRange(edit, symbolRange, sourceText) {
  if (edit.sourceRangeKind !== 'cross-language-explicit-source-replacement' || !symbolRange || typeof sourceText !== 'string') {
    return undefined;
  }
  const deleted = uniqueTextRange(sourceText, symbolRange, edit.deletedText, 'deleted-text');
  if (deleted.status === 'matched') return deleted;
  const replacement = uniqueTextRange(sourceText, symbolRange, edit.replacementText, 'replacement-text');
  if (replacement.status === 'matched') return replacement;
  const relative = relativeAnchorRange(edit, symbolRange);
  return {
    ...relative,
    conflictReasonCodes: [deleted.reasonCode, replacement.reasonCode].filter(Boolean)
  };
}

function uniqueTextRange(sourceText, symbolRange, needle, label) {
  if (typeof needle !== 'string' || needle.length === 0) {
    return { status: 'missing', reasonCode: `current-symbol-explicit-source-replacement-${label}-missing` };
  }
  const symbolText = sourceText.slice(symbolRange.start, symbolRange.end);
  const matches = [];
  for (let index = symbolText.indexOf(needle); index >= 0; index = symbolText.indexOf(needle, index + 1)) {
    const start = symbolRange.start + index;
    if (isCodeOffset(sourceText, start)) matches.push(start);
  }
  if (matches.length !== 1) {
    return { status: matches.length ? 'ambiguous' : 'missing', reasonCode: `current-symbol-explicit-source-replacement-${label}-${matches.length ? 'ambiguous' : 'missing'}` };
  }
  const first = matches[0] - symbolRange.start;
  return {
    status: 'matched',
    range: { start: symbolRange.start + first, end: symbolRange.start + first + needle.length },
    reasonCode: `current-symbol-explicit-source-replacement-${label}`
  };
}

function isCodeOffset(sourceText, offset) {
  let state = 'code';
  for (let index = 0; index < offset; index += 1) {
    const char = sourceText[index];
    const next = sourceText[index + 1];
    if (state === 'line-comment') {
      if (char === '\n' || char === '\r') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        index += 1;
        state = 'code';
      }
      continue;
    }
    if (state === 'single' || state === 'double' || state === 'template') {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if ((state === 'single' && char === "'") || (state === 'double' && char === '"') || (state === 'template' && char === '`')) state = 'code';
      continue;
    }
    if (char === '/' && next === '/') {
      index += 1;
      state = 'line-comment';
    } else if (char === '#') {
      state = 'line-comment';
    } else if (char === '/' && next === '*') {
      index += 1;
      state = 'block-comment';
    } else if (char === "'") state = 'single';
    else if (char === '"') state = 'double';
    else if (char === '`') state = 'template';
  }
  return state === 'code';
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
