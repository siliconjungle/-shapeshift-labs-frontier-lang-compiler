function staticMapCall(expressionText) {
  const value = normalizedReturnExpression(expressionText);
  const target = /^([A-Za-z_$][\w$]*)\s*\.\s*map\s*\(/.exec(value);
  if (!target) return undefined;
  const argsStart = target[0].length - 1;
  const argsEnd = matchingClose(value, argsStart, '(', ')');
  if (argsEnd !== value.length - 1) return undefined;
  return {
    arrayName: target[1],
    callbackText: normalizedText(value.slice(argsStart + 1, argsEnd))
  };
}

function staticMapCallback(callbackText) {
  const value = normalizedText(callbackText);
  const match = /^(?:\(\s*([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?\s*\)|([A-Za-z_$][\w$]*))\s*=>\s*([\s\S]*)$/.exec(value);
  if (!match) return undefined;
  const bodyExpressionText = normalizedReturnExpression(match[4]);
  if (bodyExpressionText.startsWith('{')) return undefined;
  return {
    callbackText: value,
    parameterName: match[1] ?? match[3],
    indexParameterName: match[2],
    bodyExpressionText
  };
}

function constArrayLiteralBinding(sourceText, arrayName) {
  const value = String(sourceText ?? '');
  const declaration = new RegExp(`\\bconst\\s+${escapeRegExp(arrayName)}\\s*=\\s*\\[`, 'g').exec(value);
  if (!declaration) return undefined;
  const arrayStart = value.indexOf('[', declaration.index);
  const arrayEnd = matchingClose(value, arrayStart, '[', ']');
  if (arrayEnd < 0) return undefined;
  return { arrayLiteralText: normalizedText(value.slice(arrayStart, arrayEnd + 1)) };
}

function staticMapSourceItemRecord(sourceItemExpressionText) {
  const literal = staticLiteralValue(sourceItemExpressionText);
  if (literal) return { kind: literal.kind, props: new Map() };
  const props = staticObjectLiteralProps(sourceItemExpressionText);
  return props ? { kind: 'object-literal', props } : undefined;
}

function staticObjectLiteralProps(sourceItemExpressionText) {
  const value = normalizedReturnExpression(sourceItemExpressionText);
  if (!value.startsWith('{') || !value.endsWith('}')) return undefined;
  const parts = splitTopLevel(value.slice(1, -1), ',').filter((part) => normalizedText(part));
  if (!parts.length) return undefined;
  const props = new Map();
  for (const part of parts) {
    const match = /^\s*([A-Za-z_$][\w$]*)\s*:\s*([\s\S]*?)\s*$/.exec(part);
    if (!match) return undefined;
    const literal = staticLiteralValue(match[2]);
    if (!literal) return undefined;
    props.set(match[1], literal);
  }
  return props;
}

function staticLiteralValue(text) {
  const value = normalizedText(text);
  const string = /^"([^"]*)"|'([^']*)'$/.exec(value);
  if (string) return { value: string[1] ?? string[2] ?? '', text: value, kind: 'string' };
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return { value: Number(value), text: value, kind: 'number' };
  if (value === 'true' || value === 'false') return { value: value === 'true', text: value, kind: 'boolean' };
  if (value === 'null') return { value: null, text: value, kind: 'null' };
  return undefined;
}

function mapKeyResolution(keyEvidence, parameterName, sourceItemProps) {
  if (!keyEvidence) return undefined;
  if (keyEvidence.keyValue !== undefined) return { keyValue: keyEvidence.keyValue, keyStatic: true };
  const prefix = `${parameterName}.`;
  if (!keyEvidence.keyExpressionText?.startsWith(prefix)) return { keyStatic: false };
  const keySourcePropName = keyEvidence.keyExpressionText.slice(prefix.length);
  if (!/^[A-Za-z_$][\w$]*$/.test(keySourcePropName)) return { keyStatic: false };
  const prop = sourceItemProps.get(keySourcePropName);
  return prop ? { keyValue: prop.value, keySourcePropName, keyStatic: true } : { keySourcePropName, keyStatic: false };
}

function jsxKeyEvidence(expressionText) {
  const openingTag = firstJsxOpeningTagText(expressionText);
  if (!openingTag) return undefined;
  const match = /\bkey\s*=\s*("[^"]*"|'[^']*'|\{[^}]*\})/.exec(openingTag);
  if (!match) return undefined;
  const rawValue = match[1].trim();
  const quoted = /^"([^"]*)"|'([^']*)'$/.exec(rawValue);
  const braced = /^\{\s*([\s\S]*?)\s*\}$/.exec(rawValue);
  return compactRecord({
    keyPropText: normalizedText(match[0]),
    keyValue: quoted ? quoted[1] ?? quoted[2] ?? '' : undefined,
    keyExpressionText: braced ? normalizedText(braced[1]) : undefined
  });
}

function firstJsxOpeningTagText(expressionText) {
  const value = normalizedReturnExpression(expressionText);
  const start = value.indexOf('<');
  if (start < 0 || value[start + 1] === '/' || value[start + 1] === '>') return undefined;
  let quote;
  let braceDepth = 0;
  for (let index = start + 1; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === '>' && braceDepth === 0) return value.slice(start, index + 1);
  }
  return undefined;
}

function directJsxChildren(text) {
  const value = normalizedText(text);
  const children = [];
  const childPattern = /<([A-Za-z][\w.]*)\b[^>]*\/>|<([A-Za-z][\w.]*)\b[^>]*>[\s\S]*?<\/\2>/g;
  for (const match of value.matchAll(childPattern)) children.push(normalizedText(match[0]));
  return children;
}

function isJsxExpression(text) {
  const value = normalizedReturnExpression(text);
  return /^<[A-Za-z][\w.]*(?:\s|>|\/>)/.test(value) || /^React\s*\.\s*createElement\s*\(/.test(value);
}

function splitTopLevel(text, delimiter) {
  const value = String(text ?? '');
  const parts = [];
  let quote;
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{' || char === '<') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (char === '>' && depth > 0) depth = Math.max(0, depth - 1);
    else if (depth === 0 && value.slice(index, index + delimiter.length) === delimiter) {
      parts.push(value.slice(start, index));
      start = index + delimiter.length;
      index += delimiter.length - 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function matchingClose(text, openIndex, openChar, closeChar) {
  const value = String(text ?? '');
  let quote;
  let depth = 0;
  for (let index = openIndex; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === openChar) depth += 1;
    else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function escapeRegExp(text) { return String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function normalizedReturnExpression(text) {
  const value = normalizedText(text);
  const wrapped = /^\(([\s\S]*)\)$/.exec(value);
  return wrapped ? normalizedText(wrapped[1]) : value;
}
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export {
  compactRecord,
  constArrayLiteralBinding,
  directJsxChildren,
  isJsxExpression,
  jsxKeyEvidence,
  mapKeyResolution,
  normalizedReturnExpression,
  normalizedText,
  splitTopLevel,
  staticMapCall,
  staticMapCallback,
  staticMapSourceItemRecord
};
