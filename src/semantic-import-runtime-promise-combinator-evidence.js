function promiseCombinatorEvidenceRecords(line, start, end) {
  const text = String(line ?? '');
  return promiseCombinatorCalls(text)
    .filter((call) => start >= call.open && end <= call.close + 1)
    .sort((left, right) => right.open - left.open)
    .slice(0, 1)
    .map((call) => promiseCombinatorRecord(text, call, start, end))
    .filter(Boolean);
}

function promiseCombinatorContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-promise-combinator-merge-requires-concurrency-evidence',
    record?.arrayElementOrdinal ? 'runtime-order-promise-combinator-merge-requires-element-order-evidence' : undefined,
    record?.methodName === 'all' ? 'runtime-order-promise-all-merge-requires-all-settlement-evidence' : undefined,
    record?.methodName === 'allSettled' ? 'runtime-order-promise-all-settled-merge-requires-settlement-record-evidence' : undefined,
    record?.methodName === 'race' ? 'runtime-order-promise-race-merge-requires-first-settlement-evidence' : undefined,
    record?.methodName === 'any' ? 'runtime-order-promise-any-merge-requires-first-fulfillment-evidence' : undefined,
    record?.runtimeEquivalenceClaim === false ? 'runtime-order-promise-combinator-runtime-equivalence-not-proven' : undefined
  ]);
}

function promiseCombinatorCalls(text) {
  const calls = [];
  const state = scanState();
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index], next = text[index + 1];
    if (advanceIgnoredState(state, char, next)) { if (state.skipNext) { state.skipNext = false; index += 1; } continue; }
    if (!wordAt(text, index, 'Promise')) continue;
    const dot = skipSpaces(text, index + 'Promise'.length);
    if (text[dot] !== '.') continue;
    const methodStart = skipSpaces(text, dot + 1);
    const methodName = promiseMethodNameAt(text, methodStart);
    if (!methodName) continue;
    const open = skipSpaces(text, methodStart + methodName.length);
    if (text[open] !== '(') continue;
    const close = matchingIndex(text, open, '(', ')');
    if (close !== undefined) calls.push({ methodName, open, close, start: index });
  }
  return calls;
}

function promiseCombinatorRecord(text, call, start, end) {
  const argument = segmentContaining(text, call.open + 1, call.close, start, end);
  const array = arrayElementContaining(text, argument, start, end);
  return compactRecord({
    kind: 'promise-combinator',
    methodName: call.methodName,
    concurrencySemantics: promiseConcurrencySemantics(call.methodName),
    settlementPolicy: promiseSettlementPolicy(call.methodName),
    callText: normalizeOrderEvidenceText(text.slice(call.start, call.close + 1)),
    argumentOrdinal: argument?.ordinal,
    argumentText: argument ? normalizeOrderEvidenceText(text.slice(argument.start, argument.end)) : undefined,
    directArrayArgument: array ? true : undefined,
    arrayElementOrdinal: array?.ordinal,
    arrayElementCount: array?.count,
    arrayElementText: array?.text,
    regionWithinCombinator: true,
    runtimeEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  });
}

function arrayElementContaining(text, argument, start, end) {
  if (!argument) return undefined;
  const arrayStart = skipSpaces(text, argument.start);
  if (text[arrayStart] !== '[') return undefined;
  const arrayEnd = matchingIndex(text, arrayStart, '[', ']');
  if (arrayEnd === undefined || start < arrayStart || end > arrayEnd + 1) return undefined;
  const segment = segmentContaining(text, arrayStart + 1, arrayEnd, start, end);
  return segment && { ...segment, count: topLevelSegments(text, arrayStart + 1, arrayEnd).length, text: normalizeOrderEvidenceText(text.slice(segment.start, segment.end)) };
}

function segmentContaining(text, start, end, targetStart, targetEnd) {
  return topLevelSegments(text, start, end)
    .find((segment) => targetStart >= segment.start && targetEnd <= segment.end + 1);
}

function topLevelSegments(text, start, end) {
  const segments = [];
  const state = scanState();
  let segmentStart = start;
  for (let index = start; index < end; index += 1) {
    const char = text[index], next = text[index + 1];
    if (advanceIgnoredState(state, char, next)) { if (state.skipNext) { state.skipNext = false; index += 1; } continue; }
    if (char === '(') { state.parenDepth += 1; continue; }
    if (char === ')') { state.parenDepth = Math.max(0, state.parenDepth - 1); continue; }
    if (char === '[') { state.bracketDepth += 1; continue; }
    if (char === ']') { state.bracketDepth = Math.max(0, state.bracketDepth - 1); continue; }
    if (char === '{') { state.braceDepth += 1; continue; }
    if (char === '}') { state.braceDepth = Math.max(0, state.braceDepth - 1); continue; }
    if (char === ',' && !state.parenDepth && !state.bracketDepth && !state.braceDepth) {
      segments.push({ start: skipSpaces(text, segmentStart), end: trimEnd(text, segmentStart, index), ordinal: segments.length + 1 });
      segmentStart = index + 1;
    }
  }
  segments.push({ start: skipSpaces(text, segmentStart), end: trimEnd(text, segmentStart, end), ordinal: segments.length + 1 });
  return segments.filter((segment) => segment.start <= segment.end);
}

function matchingIndex(text, open, openChar, closeChar) {
  const state = scanState();
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index], next = text[index + 1];
    if (advanceIgnoredState(state, char, next)) { if (state.skipNext) { state.skipNext = false; index += 1; } continue; }
    if (char === openChar) depth += 1;
    else if (char === closeChar && --depth === 0) return index;
  }
  return undefined;
}

function advanceIgnoredState(state, char, next) {
  if (state.lineComment) return true;
  if (state.blockComment) { if (char === '*' && next === '/') { state.blockComment = false; state.skipNext = true; } return true; }
  if (state.quote) {
    if (state.escaped) state.escaped = false;
    else if (char === '\\') state.escaped = true;
    else if (char === state.quote) state.quote = undefined;
    return true;
  }
  if (char === '/' && next === '/') { state.lineComment = true; return true; }
  if (char === '/' && next === '*') { state.blockComment = true; state.skipNext = true; return true; }
  if (char === '\'' || char === '"' || char === '`') { state.quote = char; return true; }
  return false;
}

function promiseMethodNameAt(text, index) {
  for (const name of ['allSettled', 'all', 'race', 'any']) {
    if (wordAt(text, index, name)) return name;
  }
  return undefined;
}

function promiseConcurrencySemantics(methodName) {
  return ({
    all: 'concurrent-all-inputs',
    allSettled: 'concurrent-all-settled-inputs',
    race: 'concurrent-first-settled-input',
    any: 'concurrent-first-fulfilled-input'
  })[methodName];
}

function promiseSettlementPolicy(methodName) {
  return ({
    all: 'fulfill-array-or-first-reject',
    allSettled: 'settled-record-array',
    race: 'first-settled-wins',
    any: 'first-fulfilled-or-aggregate-reject'
  })[methodName];
}

function wordAt(text, index, word) {
  return text.slice(index, index + word.length) === word
    && !isIdentifierPart(text[index - 1]) && !isIdentifierPart(text[index + word.length]);
}

function skipSpaces(text, index) { let cursor = index; while (/\s/.test(text[cursor] ?? '')) cursor += 1; return cursor; }
function trimEnd(text, start, end) { let cursor = end; while (cursor > start && /\s/.test(text[cursor - 1] ?? '')) cursor -= 1; return cursor; }
function scanState() { return { parenDepth: 0, bracketDepth: 0, braceDepth: 0 }; }
function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function isIdentifierPart(char) { return /[A-Za-z0-9_$]/.test(char ?? ''); }
function uniqueStrings(values) { return [...new Set((values ?? []).filter(Boolean).map(String))]; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }

export { promiseCombinatorContextReasonCodes, promiseCombinatorEvidenceRecords };
