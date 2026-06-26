function promiseChainEvidenceRecords(line, start, end) {
  const text = String(line ?? '');
  const statement = statementAround(text, start, end);
  const steps = promiseChainSteps(text, statement.start, statement.end);
  if (!steps.length || start < statement.start || end > statement.end) return [];
  const methodNames = steps.map((step) => step.methodName);
  const handlerStep = steps.find((step) => start >= step.open + 1 && end <= step.close);
  return [compactRecord({
    kind: 'promise-chain',
    regionRole: handlerStep ? 'chain-handler' : end <= steps[0].dot ? 'source-promise' : 'chain-expression',
    handlerMethodName: handlerStep?.methodName,
    handlerStepOrdinal: handlerStep ? steps.indexOf(handlerStep) + 1 : undefined,
    chainMethods: methodNames,
    stepCount: steps.length,
    hasThen: methodNames.includes('then') || undefined,
    hasCatch: methodNames.includes('catch') || undefined,
    hasFinally: methodNames.includes('finally') || undefined,
    chainText: normalizeOrderEvidenceText(text.slice(statement.start, statement.end)),
    steps: steps.map((step, index) => compactRecord({
      ordinal: index + 1,
      methodName: step.methodName,
      handlerText: normalizeOrderEvidenceText(text.slice(step.open + 1, step.close)),
      handlerOrdinal: index + 1
    })),
    regionWithinPromiseChain: true,
    handlerExecutionEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  })];
}

function promiseChainContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-promise-chain-merge-requires-handler-order-evidence',
    record?.hasCatch ? 'runtime-order-promise-chain-merge-requires-rejection-flow-evidence' : undefined,
    record?.hasFinally ? 'runtime-order-promise-chain-merge-requires-finalizer-evidence' : undefined,
    record?.handlerExecutionEquivalenceClaim === false ? 'runtime-order-promise-chain-handler-equivalence-not-proven' : undefined,
    record?.runtimeEquivalenceClaim === false ? 'runtime-order-promise-chain-runtime-equivalence-not-proven' : undefined
  ]);
}

function promiseChainSteps(text, start, end) {
  const steps = [];
  const state = scanState();
  for (let index = start; index < end; index += 1) {
    const char = text[index], next = text[index + 1];
    if (advanceIgnoredState(state, char, next)) { if (state.skipNext) { state.skipNext = false; index += 1; } continue; }
    if (char !== '.') continue;
    const methodStart = skipSpaces(text, index + 1);
    const methodName = chainMethodNameAt(text, methodStart);
    if (!methodName) continue;
    const open = skipSpaces(text, methodStart + methodName.length);
    if (text[open] !== '(') continue;
    const close = matchingIndex(text, open, '(', ')');
    if (close === undefined || close > end) continue;
    steps.push({ methodName, dot: index, open, close });
    index = close;
  }
  return steps.length && steps[0].dot > start ? steps : [];
}

function statementAround(text, start, end) {
  return { start: statementStartBefore(text, start), end: statementEndAfter(text, end) };
}
function statementStartBefore(text, endIndex) {
  for (let index = endIndex - 1; index >= 0; index -= 1) if (';{}\n\r'.includes(text[index])) return index + 1;
  return 0;
}
function statementEndAfter(text, startIndex) {
  const semi = text.indexOf(';', startIndex);
  return semi >= 0 ? semi : text.length;
}
function chainMethodNameAt(text, index) {
  for (const name of ['finally', 'catch', 'then']) if (wordAt(text, index, name)) return name;
  return undefined;
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
  if (state.blockComment) { if (char === '*' && next === '/') { state.blockComment = false; state.skipNext = true; } return true; }
  if (state.quote) { if (state.escaped) state.escaped = false; else if (char === '\\') state.escaped = true; else if (char === state.quote) state.quote = undefined; return true; }
  if (char === '/' && next === '*') { state.blockComment = true; state.skipNext = true; return true; }
  if (char === '\'' || char === '"' || char === '`') { state.quote = char; return true; }
  return false;
}
function wordAt(text, index, word) { return text.slice(index, index + word.length) === word && !isIdentifierPart(text[index - 1]) && !isIdentifierPart(text[index + word.length]); }
function skipSpaces(text, index) { let cursor = index; while (/\s/.test(text[cursor] ?? '')) cursor += 1; return cursor; }
function scanState() { return {}; }
function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function isIdentifierPart(char) { return /[A-Za-z0-9_$]/.test(char ?? ''); }
function uniqueStrings(values) { return [...new Set((values ?? []).filter(Boolean).map(String))]; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }

export { promiseChainContextReasonCodes, promiseChainEvidenceRecords };
