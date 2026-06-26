function tryCatchOrderEvidence(lines, lineNumber, enclosingControlFlow) {
  if (!Array.isArray(lines) || lineNumber <= 1) return [];
  const records = [];
  const catchBlock = lastRecord(enclosingControlFlow, (record) => record.kind === 'exception' && /^catch\b/.test(record.text ?? ''));
  if (catchBlock) records.push({ kind: 'catch-handler', line: catchBlock.line, text: catchBlock.text, completion: 'catch-handler-runs-after-matched-throw' });
  const tryBlock = lastRecord(enclosingControlFlow, (record) => record.kind === 'exception' && /^try\b/.test(record.text ?? ''));
  const catchForTry = tryBlock ? findCatchForTry(lines, tryBlock.line) : undefined;
  if (tryBlock && catchForTry) {
    records.push({
      kind: 'try-catch',
      tryLine: tryBlock.line,
      catchLine: catchForTry.line,
      catchText: catchForTry.text,
      completion: 'catch-handler-runs-for-try-throw-before-continuation'
    });
  }
  return records;
}

function tryFinallyOrderEvidence(lines, lineNumber, enclosingControlFlow) {
  if (!Array.isArray(lines) || lineNumber <= 1) return [];
  const records = [];
  const finalizer = lastRecord(enclosingControlFlow, (record) => record.kind === 'exception' && /^finally\b/.test(record.text ?? ''));
  if (finalizer) {
    records.push({ kind: 'finalizer', line: finalizer.line, text: finalizer.text, completion: 'finally-before-completion-propagates' });
  }
  const tryBlock = lastRecord(enclosingControlFlow, (record) => record.kind === 'exception' && /^try\b/.test(record.text ?? ''));
  const finalizerForTry = tryBlock ? findFinallyForTry(lines, tryBlock.line) : undefined;
  if (tryBlock && finalizerForTry) {
    const loop = lastRecord(enclosingControlFlow, (record) => record.kind === 'loop');
    records.push(compactRecord({
      kind: 'try-finally',
      tryLine: tryBlock.line,
      finallyLine: finalizerForTry.line,
      finalizerText: finalizerForTry.text,
      completion: 'finalizer-runs-before-try-completion-propagates',
      enclosingLoop: loop ? { line: loop.line, text: loop.text } : undefined
    }));
  }
  return records;
}

function findCatchForTry(lines, tryLine) {
  const startLine = Number(tryLine);
  if (!Number.isFinite(startLine) || startLine < 1 || startLine > lines.length) return undefined;
  let depth = 0;
  let started = false;
  let quote;
  let escaped = false;
  for (let lineIndex = startLine - 1; lineIndex < lines.length; lineIndex += 1) {
    const line = String(lines[lineIndex] ?? '');
    let index = lineIndex === startLine - 1 ? tryKeywordIndex(line) : 0;
    if (index < 0) return undefined;
    for (; index < line.length; index += 1) {
      const char = line[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = undefined;
        continue;
      }
      if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
      if (char === '{') { depth += 1; started = true; }
      else if (char === '}' && started) {
        depth = Math.max(0, depth - 1);
        if (depth === 0) return catchAfterTryClose(lines, lineIndex, index);
      }
    }
  }
  return undefined;
}

function findFinallyForTry(lines, tryLine) {
  const startLine = Number(tryLine);
  if (!Number.isFinite(startLine) || startLine < 1 || startLine > lines.length) return undefined;
  let depth = 0;
  let started = false;
  let quote;
  let escaped = false;
  for (let lineIndex = startLine - 1; lineIndex < lines.length; lineIndex += 1) {
    const line = String(lines[lineIndex] ?? '');
    let index = lineIndex === startLine - 1 ? tryKeywordIndex(line) : 0;
    if (index < 0) return undefined;
    for (; index < line.length; index += 1) {
      const char = line[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = undefined;
        continue;
      }
      if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
      if (char === '{') { depth += 1; started = true; }
      else if (char === '}' && started) {
        depth = Math.max(0, depth - 1);
        if (depth === 0) return finallyAfterTryClose(lines, lineIndex, index);
      }
    }
  }
  return undefined;
}

function catchAfterTryClose(lines, closeLineIndex, closeColumn) {
  const sameLine = catchRecord(lines[closeLineIndex], closeLineIndex + 1, closeColumn + 1);
  if (sameLine) return sameLine;
  for (let index = closeLineIndex + 1; index < lines.length; index += 1) {
    const line = String(lines[index] ?? '');
    if (!line.trim()) continue;
    return catchRecord(line, index + 1, 0);
  }
  return undefined;
}

function finallyAfterTryClose(lines, closeLineIndex, closeColumn) {
  const sameLine = finallyRecord(lines[closeLineIndex], closeLineIndex + 1, closeColumn + 1);
  if (sameLine) return sameLine;
  for (let index = closeLineIndex + 1; index < lines.length; index += 1) {
    const line = String(lines[index] ?? '');
    if (!line.trim()) continue;
    return finallyRecord(line, index + 1, 0);
  }
  return undefined;
}

function catchRecord(line, lineNumber, startIndex) {
  const text = String(line ?? '');
  const match = /\bcatch\b/.exec(text.slice(startIndex));
  if (!match) return undefined;
  const catchIndex = startIndex + match.index;
  const open = text.indexOf('(', catchIndex);
  const close = matchingParenIndex(text, open);
  const catchText = open >= 0 && close !== undefined ? text.slice(catchIndex, close + 1) : text.slice(catchIndex, statementEnd(text, catchIndex));
  return { line: lineNumber, text: normalizeOrderEvidenceText(catchText) || 'catch' };
}

function finallyRecord(line, lineNumber, startIndex) {
  const match = /\bfinally\b/.exec(String(line ?? '').slice(startIndex));
  return match ? { line: lineNumber, text: 'finally' } : undefined;
}

function lastRecord(records, predicate) {
  for (let index = (records?.length ?? 0) - 1; index >= 0; index -= 1) {
    if (predicate(records[index])) return records[index];
  }
  return undefined;
}

function tryKeywordIndex(line) { const match = /\btry\b/.exec(line); return match ? match.index : -1; }
function statementEnd(line, start) { const semicolon = String(line ?? '').indexOf(';', Math.max(0, start)); return semicolon === -1 ? String(line ?? '').length : semicolon + 1; }
function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function matchingParenIndex(line, open) {
  if (open < 0) return undefined;
  let depth = 0;
  let quote;
  let escaped = false;
  for (let index = open; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (char === '(') depth += 1;
    else if (char === ')' && --depth === 0) return index;
  }
  return undefined;
}
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { tryCatchOrderEvidence, tryFinallyOrderEvidence };
