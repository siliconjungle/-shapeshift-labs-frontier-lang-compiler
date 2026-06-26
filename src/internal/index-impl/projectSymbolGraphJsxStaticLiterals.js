import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function parseStaticLiteralExpression(text) {
  return parseStaticLiteralExpressionResult(text).value;
}

function parseStaticObjectLiteralExpression(text) {
  const result = parseStaticLiteralExpressionResult(text);
  return result.value?.kind === 'object-literal' ? result : { reasonCode: result.reasonCode };
}

function parseStaticLiteralExpressionResult(text) {
  const state = { text: String(text ?? ''), index: 0 };
  const parsed = parseStaticLiteralValue(state);
  skipWhitespace(state);
  return parsed && state.index === state.text.length
    ? { value: parsed }
    : { reasonCode: state.errorReason };
}

function parseStaticLiteralValue(state) {
  skipWhitespace(state);
  const char = state.text[state.index];
  if (char === '"' || char === "'") return parseQuotedStaticString(state) ? { kind: 'string' } : undefined;
  if (char === '`') return parseStaticTemplateString(state) ? { kind: 'template-string' } : undefined;
  if (char === '{') {
    const parsed = parseStaticObjectLiteral(state);
    return parsed ? { kind: 'object-literal', entries: parsed.entries } : undefined;
  }
  if (char === '[') return parseStaticArrayLiteral(state) ? { kind: 'array-literal' } : undefined;
  if (looksLikeCallExpression(state.text.slice(state.index))) state.errorReason ??= 'jsx-render-prop-spread-call-expression-unsupported';
  const primitive = parseStaticPrimitiveToken(state);
  return primitive ? { kind: primitive } : undefined;
}

function parseStaticObjectLiteral(state) {
  state.index += 1;
  skipWhitespace(state);
  const entries = [];
  if (consumeChar(state, '}')) return { entries };
  while (state.index < state.text.length) {
    if (state.text.startsWith('...', state.index)) {
      state.errorReason ??= 'jsx-render-prop-spread-nested-spread-unsupported';
      return undefined;
    }
    if (state.text[state.index] === '[') {
      state.errorReason ??= 'jsx-render-prop-spread-computed-key-unsupported';
      return undefined;
    }
    const key = parseStaticObjectKey(state);
    if (!key) return undefined;
    skipWhitespace(state);
    if (!consumeChar(state, ':')) {
      if (key.propName === 'get' || key.propName === 'set') state.errorReason ??= 'jsx-render-prop-spread-getter-unsupported';
      else if (state.text[state.index] === '(') state.errorReason ??= 'jsx-render-prop-spread-method-unsupported';
      else state.errorReason ??= 'jsx-render-prop-spread-dynamic-object-unsupported';
      return undefined;
    }
    skipWhitespace(state);
    const valueStart = state.index;
    const value = parseStaticLiteralValue(state);
    if (!value) return undefined;
    const valueText = normalizedText(state.text.slice(valueStart, state.index));
    entries.push(staticSpreadPropEntry(key, value, valueText, entries.length + 1));
    skipWhitespace(state);
    if (consumeChar(state, '}')) return { entries };
    if (!consumeChar(state, ',')) return undefined;
    skipWhitespace(state);
    if (consumeChar(state, '}')) return { entries };
  }
  return undefined;
}

function parseStaticArrayLiteral(state) {
  state.index += 1;
  skipWhitespace(state);
  if (consumeChar(state, ']')) return true;
  while (state.index < state.text.length) {
    if (state.text.startsWith('...', state.index) || state.text[state.index] === ',') {
      state.errorReason ??= 'jsx-render-prop-spread-dynamic-object-unsupported';
      return false;
    }
    if (!parseStaticLiteralValue(state)) return false;
    skipWhitespace(state);
    if (consumeChar(state, ']')) return true;
    if (!consumeChar(state, ',')) return false;
    skipWhitespace(state);
    if (consumeChar(state, ']')) return true;
  }
  return false;
}

function parseStaticObjectKey(state) {
  skipWhitespace(state);
  const char = state.text[state.index];
  const start = state.index;
  if (char === '"' || char === "'") {
    if (!parseQuotedStaticString(state)) return undefined;
    const keyText = state.text.slice(start, state.index);
    return { propName: staticStringLiteralValue(keyText), keyText };
  }
  const numberStart = state.index;
  const number = parseStaticNumberToken(state);
  if (number) return { propName: number, keyText: number };
  state.index = numberStart;
  const identifier = parseIdentifierToken(state);
  return identifier ? { propName: identifier, keyText: identifier } : undefined;
}

function staticSpreadPropEntry(key, value, valueText, ordinal) {
  return {
    propName: key.propName,
    keyText: key.keyText,
    valueKind: value.kind,
    valueText,
    ordinal,
    entryHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxStaticObjectSpreadPropEntry',
      propName: key.propName,
      keyText: key.keyText,
      valueKind: value.kind,
      valueText,
      ordinal
    })
  };
}

function parseQuotedStaticString(state) {
  const quote = state.text[state.index];
  if (quote !== '"' && quote !== "'") return false;
  state.index += 1;
  while (state.index < state.text.length) {
    const char = state.text[state.index];
    if (char === '\\') {
      state.index += 2;
      continue;
    }
    state.index += 1;
    if (char === quote) return true;
  }
  return false;
}

function parseStaticTemplateString(state) {
  if (state.text[state.index] !== '`') return false;
  state.index += 1;
  while (state.index < state.text.length) {
    const char = state.text[state.index];
    if (char === '\\') {
      state.index += 2;
      continue;
    }
    if (char === '$' && state.text[state.index + 1] === '{') return false;
    state.index += 1;
    if (char === '`') return true;
  }
  return false;
}

function parseStaticPrimitiveToken(state) {
  const number = parseStaticNumberToken(state);
  if (number) return 'number';
  const identifierStart = state.index;
  const identifier = parseIdentifierToken(state);
  if (['true', 'false'].includes(identifier)) return 'boolean';
  if (identifier === 'null') return 'null';
  if (identifier === 'undefined') return 'undefined';
  state.index = identifierStart;
  return undefined;
}

function parseStaticNumberToken(state) {
  const match = /^[-]?(?:0|[1-9]\d*)(?:\.\d+)?/.exec(state.text.slice(state.index));
  if (!match) return undefined;
  state.index += match[0].length;
  return match[0];
}

function parseIdentifierToken(state) {
  const match = /^[A-Za-z_$][\w$]*/.exec(state.text.slice(state.index));
  if (!match) return undefined;
  state.index += match[0].length;
  return match[0];
}

function consumeChar(state, char) {
  if (state.text[state.index] !== char) return false;
  state.index += 1;
  return true;
}

function skipWhitespace(state) {
  while (/\s/.test(state.text[state.index] ?? '')) state.index += 1;
}

function staticStringLiteralValue(text) {
  const value = String(text ?? '');
  return value.slice(1, -1).replace(/\\([\s\S])/g, '$1');
}

function looksLikeCallExpression(text) {
  return /^\s*[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(String(text ?? ''));
}

function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }

export { parseStaticLiteralExpression, parseStaticObjectLiteralExpression };
