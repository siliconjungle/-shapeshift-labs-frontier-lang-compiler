function exitCompletionOrderEvidence(lines, lineNumber) {
  if (!Array.isArray(lines) || !Number.isFinite(Number(lineNumber))) return [];
  const line = String(lines[Number(lineNumber) - 1] ?? '');
  const record = exitCompletionRecord(line, Number(lineNumber));
  return record ? [record] : [];
}

function exitCompletionRecord(line, lineNumber) {
  const match = /\b(return|yield)\b\s*(\*)?/.exec(String(line ?? ''));
  if (!match) return undefined;
  const text = normalizeOrderEvidenceText(line.slice(match.index, statementEnd(line, match.index)));
  const expressionStart = match.index + match[0].length;
  const delegated = match[1] === 'yield' && Boolean(match[2]);
  const expressionText = normalizeOrderEvidenceText(line.slice(expressionStart, statementEnd(line, match.index)).replace(/;$/, ''));
  return compactRecord({
    kind: match[1],
    line: lineNumber,
    delegated: delegated || undefined,
    delegationKind: delegated ? 'iterator-delegation' : undefined,
    text,
    expressionText,
    delegatedIterableText: delegated ? expressionText : undefined,
    iteratorProtocolEquivalenceClaim: delegated ? false : undefined,
    delegatedCompletionPropagationClaim: delegated ? false : undefined
  });
}

function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function statementEnd(line, start) { const semicolon = String(line ?? '').indexOf(';', start); return semicolon === -1 ? String(line ?? '').length : semicolon + 1; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== '')); }

export { exitCompletionOrderEvidence };
