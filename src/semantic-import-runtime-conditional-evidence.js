function conditionalExpressionEvidenceRecords(line, start, end) {
  const text = String(line ?? '');
  return conditionalExpressionPairs(text)
    .map((pair) => conditionalExpressionRecord(text, pair, start, end))
    .filter(Boolean)
    .sort((left, right) => right.questionIndex - left.questionIndex)
    .slice(0, 1)
    .map(({ questionIndex: _questionIndex, ...record }) => record);
}

function conditionalExpressionPairs(text) {
  const pairs = [];
  const stack = [];
  const state = scanState();
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (advanceIgnoredState(state, char, next)) { if (state.skipNext) { state.skipNext = false; index += 1; } continue; }
    if (char === '(') { state.parenDepth += 1; continue; }
    if (char === ')') { state.parenDepth = Math.max(0, state.parenDepth - 1); continue; }
    if (char === '[') { state.bracketDepth += 1; continue; }
    if (char === ']') { state.bracketDepth = Math.max(0, state.bracketDepth - 1); continue; }
    if (char === '{') { state.braceDepth += 1; continue; }
    if (char === '}') { state.braceDepth = Math.max(0, state.braceDepth - 1); continue; }
    if (char === '?' && conditionalQuestionMark(text, index)) stack.push({ questionIndex: index, ...depthSnapshot(state) });
    else if (char === ':') {
      const stackIndex = lastMatchingQuestionIndex(stack, state);
      if (stackIndex >= 0) pairs.push({ ...stack.splice(stackIndex, 1)[0], colonIndex: index });
    }
  }
  return pairs;
}

function conditionalExpressionRecord(text, pair, start, end) {
  const expressionEnd = conditionalExpressionEnd(text, pair.colonIndex);
  const branch = conditionalBranch(pair, expressionEnd, start, end);
  if (!branch) return undefined;
  const guardStart = conditionalGuardStart(text, pair);
  const guardText = normalizeConditionalGuardText(text.slice(guardStart, pair.questionIndex));
  if (!guardText) return undefined;
  return compactRecord({
    kind: 'conditional-expression',
    branch,
    guardText,
    text: normalizeOrderEvidenceText(text.slice(guardStart, expressionEnd)),
    questionColumn: pair.questionIndex + 1,
    colonColumn: pair.colonIndex + 1,
    questionIndex: pair.questionIndex
  });
}

function conditionalBranch(pair, expressionEnd, start, end) {
  if (start >= pair.questionIndex + 1 && end <= pair.colonIndex) return 'consequent';
  if (start >= pair.colonIndex + 1 && end <= expressionEnd) return 'alternate';
  return undefined;
}

function conditionalGuardStart(text, pair) {
  let start = 0;
  const state = scanState();
  for (let index = 0; index < pair.questionIndex; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (advanceIgnoredState(state, char, next)) { if (state.skipNext) { state.skipNext = false; index += 1; } continue; }
    if (char === '(') { state.parenDepth += 1; if (sameDepth(state, pair)) start = index + 1; continue; }
    if (char === '[') { state.bracketDepth += 1; if (sameDepth(state, pair)) start = index + 1; continue; }
    if (char === '{') { state.braceDepth += 1; if (sameDepth(state, pair)) start = index + 1; continue; }
    if (sameDepth(state, pair) && (char === ';' || char === ',' || char === ':')) start = index + 1;
    if (sameDepth(state, pair) && char === '=' && assignmentBoundary(text, index)) start = index + 1;
    if (char === ')') state.parenDepth = Math.max(0, state.parenDepth - 1);
    else if (char === ']') state.bracketDepth = Math.max(0, state.bracketDepth - 1);
    else if (char === '}') state.braceDepth = Math.max(0, state.braceDepth - 1);
  }
  return start;
}

function conditionalExpressionEnd(text, colonIndex) {
  const semicolon = text.indexOf(';', colonIndex);
  return semicolon === -1 ? text.length : semicolon + 1;
}

function advanceIgnoredState(state, char, next) {
  if (state.lineComment) return true;
  if (state.blockComment) {
    if (char === '*' && next === '/') { state.blockComment = false; state.skipNext = true; }
    return true;
  }
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

function lastMatchingQuestionIndex(stack, state) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (sameDepth(state, stack[index])) return index;
  }
  return -1;
}

function conditionalQuestionMark(text, index) {
  return text[index - 1] !== '?' && text[index + 1] !== '?' && text[index + 1] !== '.';
}

function assignmentBoundary(text, index) {
  return text[index - 1] !== '=' && text[index + 1] !== '=' && text[index - 1] !== '!'
    && text[index - 1] !== '<' && text[index - 1] !== '>' && text[index + 1] !== '>'
    && text[index - 1] !== '&' && text[index - 1] !== '|' && text[index - 1] !== '?';
}

function sameDepth(left, right) {
  return left.parenDepth === right.parenDepth && left.bracketDepth === right.bracketDepth
    && left.braceDepth === right.braceDepth;
}

function depthSnapshot(state) {
  return { parenDepth: state.parenDepth, bracketDepth: state.bracketDepth, braceDepth: state.braceDepth };
}

function scanState() { return { parenDepth: 0, bracketDepth: 0, braceDepth: 0 }; }
function normalizeConditionalGuardText(value) {
  return normalizeOrderEvidenceText(String(value ?? '').replace(/^(?:return|throw|yield|await)\s+/, ''));
}
function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}

export { conditionalExpressionEvidenceRecords };
