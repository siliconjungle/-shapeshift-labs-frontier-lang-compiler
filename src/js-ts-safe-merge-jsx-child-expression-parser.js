import { uniqueStrings } from './js-ts-safe-merge-context.js';

function parseJsxSource(sourceText) {
  const elements = [];
  const allElements = [];
  const reasonCodes = [];
  const ordinals = new Map();
  const stack = [];
  let index = 0;
  while (index < sourceText.length) {
    const start = sourceText.indexOf('<', index);
    if (start === -1) break;
    const closing = parseClosingTag(sourceText, start);
    if (closing) {
      const open = stack.pop();
      if (!open || open.tagName !== closing.tagName) {
        reasonCodes.push('jsx-child-expression-tag-mismatch');
        index = closing.end;
        continue;
      }
      const element = { ...open, closeStart: closing.start, closeEnd: closing.end, closeText: closing.text, text: sourceText.slice(open.start, closing.end) };
      elements.push(element);
      allElements.push(element);
      index = closing.end;
      continue;
    }
    const opening = parseOpeningTag(sourceText, start);
    if (!opening) {
      index = start + 1;
      continue;
    }
    const ordinal = (ordinals.get(opening.tagName) ?? 0) + 1;
    ordinals.set(opening.tagName, ordinal);
    const element = {
      tagName: opening.tagName,
      key: `${opening.tagName}#${ordinal}`,
      start,
      openEnd: opening.end,
      closeStart: opening.selfClosing ? opening.end : undefined,
      closeEnd: opening.selfClosing ? opening.end : undefined,
      openText: opening.text,
      closeText: opening.selfClosing ? '' : undefined,
      selfClosing: opening.selfClosing,
      text: opening.selfClosing ? opening.text : undefined
    };
    if (opening.selfClosing) allElements.push(element);
    else stack.push(element);
    index = opening.end;
  }
  if (stack.length) reasonCodes.push('jsx-child-expression-tag-unclosed');
  allElements.sort((left, right) => left.start - right.start);
  return {
    elements,
    allElements,
    byKey: new Map(elements.map((element) => [element.key, element])),
    byStart: new Map(allElements.map((element) => [element.start, element])),
    reasonCodes: uniqueStrings(reasonCodes)
  };
}

function parseDirectChildren(sourceText, parsed, element) {
  const tokens = [];
  const reasonCodes = [];
  const start = element.openEnd;
  const end = element.closeStart;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return { tokens, reasonCodes: ['jsx-child-expression-bounds-unsupported'] };
  }
  let cursor = start;
  while (cursor < end) {
    const childElement = parsed.byStart.get(cursor);
    if (childElement && childElement.closeEnd <= end) {
      tokens.push({
        kind: 'element',
        tagName: childElement.tagName,
        fragmentKind: childElement.fragmentKind,
        start: cursor,
        end: childElement.closeEnd,
        text: sourceText.slice(cursor, childElement.closeEnd),
        ...childElementIdentity(childElement)
      });
      cursor = childElement.closeEnd;
      continue;
    }
    if (sourceText[cursor] === '{') {
      const expressionEnd = bracedValueEnd(sourceText, cursor, end);
      if (expressionEnd === undefined) return { tokens, reasonCodes: ['jsx-child-expression-unterminated'] };
      tokens.push({ kind: 'expression', start: cursor, end: expressionEnd, text: sourceText.slice(cursor, expressionEnd) });
      cursor = expressionEnd;
      continue;
    }
    let next = cursor + 1;
    while (next < end && !parsed.byStart.has(next) && sourceText[next] !== '{') next += 1;
    tokens.push({ kind: 'text', start: cursor, end: next, text: sourceText.slice(cursor, next) });
    cursor = next;
  }
  return { tokens, reasonCodes };
}

function parseOpeningTag(sourceText, start) {
  const afterOpen = start + 1;
  if (sourceText[afterOpen] === '>') {
    return { tagName: 'Fragment', fragmentKind: 'shorthand', start, end: afterOpen + 1, text: '<>', selfClosing: false };
  }
  if (/[/!?>]/.test(sourceText[afterOpen] ?? '')) return undefined;
  const nameMatch = /^[A-Za-z_$][\w$]*(?:[.:][A-Za-z_$][\w$]*|-[\w$]+)*/.exec(sourceText.slice(afterOpen));
  if (!nameMatch) return undefined;
  const tagName = nameMatch[0];
  const end = openingTagEnd(sourceText, afterOpen + tagName.length);
  if (end === undefined) return undefined;
  const text = sourceText.slice(start, end);
  return { tagName, start, end, text, selfClosing: /\/\s*>$/.test(text) };
}

function parseClosingTag(sourceText, start) {
  if (sourceText[start] !== '<' || sourceText[start + 1] !== '/') return undefined;
  const afterSlash = start + 2;
  if (sourceText[afterSlash] === '>') {
    return { tagName: 'Fragment', fragmentKind: 'shorthand', start, end: afterSlash + 1, text: '</>' };
  }
  const nameMatch = /^[A-Za-z_$][\w$]*(?:[.:][A-Za-z_$][\w$]*|-[\w$]+)*/.exec(sourceText.slice(afterSlash));
  if (!nameMatch) return undefined;
  const tagName = nameMatch[0];
  let cursor = afterSlash + tagName.length;
  while (cursor < sourceText.length && /\s/.test(sourceText[cursor])) cursor += 1;
  if (sourceText[cursor] !== '>') return undefined;
  const end = cursor + 1;
  return { tagName, start, end, text: sourceText.slice(start, end) };
}

function openingTagEnd(sourceText, start) {
  let quote;
  let escaped = false;
  let braceDepth = 0;
  for (let index = start; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === '\'' || char === '`') quote = char;
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (char === '>' && braceDepth === 0) return index + 1;
  }
  return undefined;
}

function bracedValueEnd(sourceText, start, end) {
  let depth = 0;
  let quote;
  let escaped = false;
  for (let cursor = start; cursor < end; cursor += 1) {
    const char = sourceText[cursor];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === '\'' || char === '`') quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return cursor + 1;
    }
  }
  return undefined;
}

function childElementIdentity(element) {
  const key = stableJsxKey(element.openText);
  const hasSpreadProp = /\{\s*\.\.\./.test(String(element.openText ?? ''));
  return {
    keyPropValue: key?.value,
    keyPropText: key?.text,
    stableKey: key?.stable === true,
    childIdentityKey: key?.stable === true ? `key:${key.value}` : undefined,
    hasSpreadProp
  };
}

function stableJsxKey(openText) {
  const text = String(openText ?? '');
  let cursor = 1;
  const tagName = jsxAttributeNameAt(text, cursor);
  if (!tagName) return undefined;
  cursor += tagName.length;
  while (cursor < text.length) {
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
    if (text[cursor] === '/' || text[cursor] === '>') return undefined;
    if (text[cursor] === '{') {
      const expressionEnd = bracedValueEnd(text, cursor, text.length);
      if (expressionEnd === undefined) return undefined;
      cursor = expressionEnd;
      continue;
    }
    const attrStart = cursor;
    const attrName = jsxAttributeNameAt(text, cursor);
    if (!attrName) {
      cursor += 1;
      continue;
    }
    cursor += attrName.length;
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
    if (text[cursor] !== '=') continue;
    cursor += 1;
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
    const quote = text[cursor];
    if (quote === '"' || quote === '\'') {
      const valueStart = cursor + 1;
      const valueEnd = quotedStringEnd(text, cursor);
      if (valueEnd === undefined) return undefined;
      if (attrName === 'key') {
        return { stable: true, value: text.slice(valueStart, valueEnd - 1), text: text.slice(attrStart, valueEnd).trim() };
      }
      cursor = valueEnd;
      continue;
    }
    const valueEnd = skipJsxAttributeValue(text, cursor);
    if (valueEnd === undefined) return undefined;
    cursor = valueEnd;
  }
  return undefined;
}

function jsxAttributeNameAt(text, cursor) {
  const match = /^[A-Za-z_$][\w$]*(?:[-:.][A-Za-z_$][\w$]*)*/.exec(text.slice(cursor));
  return match?.[0];
}

function quotedStringEnd(text, start) {
  const quote = text[start];
  let escaped = false;
  for (let cursor = start + 1; cursor < text.length; cursor += 1) {
    const char = text[cursor];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === quote) return cursor + 1;
  }
  return undefined;
}

function skipJsxAttributeValue(text, cursor) {
  if (text[cursor] === '{') return bracedValueEnd(text, cursor, text.length);
  if (text[cursor] === '"' || text[cursor] === '\'' || text[cursor] === '`') return quotedStringEnd(text, cursor);
  let next = cursor;
  while (next < text.length && !/[\s/>]/.test(text[next])) next += 1;
  return next;
}

function hasConditionalChildExpressionOperator(text) {
  const value = String(text ?? '');
  let quote;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];
    if (lineComment) {
      if (char === '\n' || char === '\r') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === '\'' || char === '`') {
      quote = char;
      continue;
    }
    if ((char === '&' && next === '&') || (char === '|' && next === '|') || (char === '?' && next === '?')) return true;
    if (char === '?' && next !== '.' && next !== '?') return true;
  }
  return false;
}

export { hasConditionalChildExpressionOperator, parseDirectChildren, parseJsxSource };
