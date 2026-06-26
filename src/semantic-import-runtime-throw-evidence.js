function throwOrderEvidenceRecords(line, start, end) {
  const text = String(line ?? '');
  const index = throwTokenIndex(text, Math.max(0, Math.min(start, end)));
  if (index < 0) return [];
  const statementEndIndex = statementEnd(text, index);
  const expressionStart = index + 'throw'.length;
  const expressionText = normalizeOrderEvidenceText(text.slice(expressionStart, statementEndIndex).replace(/;$/, ''));
  return [compactRecord({
    kind: 'throw',
    text: normalizeOrderEvidenceText(text.slice(index, statementEndIndex)),
    expressionText,
    throwColumn: index + 1,
    regionWithinThrow: start >= index && start <= statementEndIndex || undefined
  })];
}

function throwTokenIndex(text, beforeIndex) {
  let quote;
  let escaped = false;
  let latest = -1;
  for (let index = 0; index < text.length && index <= beforeIndex; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (text.slice(index, index + 5) === 'throw' && !isIdentifierPart(text[index - 1]) && !isIdentifierPart(text[index + 5])) latest = index;
  }
  return latest;
}

function statementEnd(text, start) {
  const semicolon = String(text ?? '').indexOf(';', Math.max(0, start));
  return semicolon === -1 ? String(text ?? '').length : semicolon + 1;
}

function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function isIdentifierPart(char) { return /[A-Za-z0-9_$]/.test(char ?? ''); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== '')); }

export { throwOrderEvidenceRecords };
