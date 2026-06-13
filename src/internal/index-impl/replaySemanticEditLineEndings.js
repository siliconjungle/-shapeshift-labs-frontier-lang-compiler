function replayReplacementText(edit, status, range, sourceText) {
  const replacement = edit.replacementText;
  if (status !== 'applied'
    || typeof replacement !== 'string'
    || !/[\r\n]/.test(replacement)
    || typeof sourceText !== 'string') return replacement;
  return replacement.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, replayLineEnding(sourceText, range));
}

function replayLineEnding(sourceText, range) {
  const offset = Math.max(0, Math.min(sourceText.length, range?.start ?? 0));
  return lineEndingInText(range ? sourceText.slice(range.start, range.end) : '')
    ?? nearbyLineEnding(sourceText, offset)
    ?? lineEndingInText(sourceText)
    ?? '\n';
}

function lineEndingInText(value) { return /\r\n|\r|\n/.exec(value)?.[0]; }

function nearbyLineEnding(sourceText, offset) {
  for (let distance = 0; distance <= sourceText.length; distance += 1) {
    const ending = lineEndingAt(sourceText, offset - distance - 1) ?? lineEndingAt(sourceText, offset + distance);
    if (ending) return ending;
  }
  return undefined;
}

function lineEndingAt(sourceText, index) {
  const char = sourceText[index];
  if (char === '\n') return sourceText[index - 1] === '\r' ? '\r\n' : '\n';
  return char === '\r' ? sourceText[index + 1] === '\n' ? '\r\n' : '\r' : undefined;
}

export { replayReplacementText };
