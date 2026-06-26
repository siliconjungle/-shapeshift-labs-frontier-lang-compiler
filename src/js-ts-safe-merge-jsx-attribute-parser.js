import { uniqueStrings } from './js-ts-safe-merge-context.js';

export function parseJsxTags(sourceText) {
  const tags = [];
  const reasonCodes = [];
  const ordinals = new Map();
  let index = 0;
  while (index < sourceText.length) {
    const start = sourceText.indexOf('<', index);
    if (start === -1) break;
    const parsed = parseOpeningTag(sourceText, start);
    if (!parsed) {
      index = start + 1;
      continue;
    }
    if (parsed.reasonCodes.length) reasonCodes.push(...parsed.reasonCodes);
    const ordinal = (ordinals.get(parsed.tagName) ?? 0) + 1;
    ordinals.set(parsed.tagName, ordinal);
    tags.push({ ...parsed, key: `${parsed.tagName}#${ordinal}` });
    index = parsed.end;
  }
  return { tags, byKey: new Map(tags.map((tag) => [tag.key, tag])), reasonCodes: uniqueStrings(reasonCodes) };
}

export function attributeMap(tag) {
  const byName = new Map();
  const duplicateNames = [];
  for (const attribute of tag.attributes) {
    if (byName.has(attribute.name)) duplicateNames.push(attribute.name);
    byName.set(attribute.name, attribute);
  }
  return { byName, reasonCodes: duplicateNames.length ? ['jsx-attribute-duplicate-name'] : [] };
}

export function sameAttributeNames(left, right) {
  return left.attributes.map((attr) => attr.name).join('\0') === right.attributes.map((attr) => attr.name).join('\0');
}

export function sameTagText(left, right) {
  return String(left?.text ?? '').trim() === String(right?.text ?? '').trim();
}

export function sameAttrText(left, right) {
  return String(left?.text ?? '').trim() === String(right?.text ?? '').trim();
}

export function isJsxSpreadAttribute(attribute) {
  return attribute?.kind === 'spread' || attribute?.spread === true;
}

export function isJsxComponentTag(tagName) {
  const firstSegment = String(tagName ?? '').split(/[.:]/)[0] ?? '';
  return /^[A-Z]/.test(firstSegment);
}

export function jsxContextProviderBoundary(tagName) {
  const segments = String(tagName ?? '').split(/[.:]/).filter(Boolean);
  if (segments.length < 2 || segments[segments.length - 1] !== 'Provider') return undefined;
  return { kind: 'context-provider', contextName: segments.slice(0, -1).join('.') };
}

export function jsxContextProviderAncestorMap(tags, sourceText) {
  const tagsByStart = new Map(tags.map((tag) => [tag.start, tag]));
  const ancestorsByStart = new Map();
  const providerStack = [];
  for (const token of jsxTagTokens(sourceText)) {
    if (token.kind === 'closing') {
      closeContextProviderStack(providerStack, token.tagName);
      continue;
    }
    const tag = tagsByStart.get(token.start);
    if (tag) ancestorsByStart.set(tag.start, providerStack.map((provider) => ({ ...provider })));
    const boundary = jsxContextProviderBoundary(token.tagName);
    if (boundary && !token.selfClosing) {
      providerStack.push({
        tagName: token.tagName,
        contextName: boundary.contextName,
        contextBoundaryKind: boundary.kind,
        start: token.start,
        end: token.end
      });
    }
  }
  return ancestorsByStart;
}

function closeContextProviderStack(providerStack, tagName) {
  for (let index = providerStack.length - 1; index >= 0; index -= 1) {
    if (providerStack[index].tagName !== tagName) continue;
    providerStack.splice(index);
    return;
  }
}

export function jsxTagTokens(sourceText) {
  const tokens = [];
  let index = 0;
  while (index < sourceText.length) {
    const start = sourceText.indexOf('<', index);
    if (start === -1) break;
    if (sourceText[start + 1] === '/') {
      const token = jsxClosingTagToken(sourceText, start);
      if (token) tokens.push(token);
      index = token?.end ?? start + 1;
      continue;
    }
    const token = jsxOpeningTagToken(sourceText, start);
    if (token) tokens.push(token);
    index = token?.end ?? start + 1;
  }
  return tokens;
}

function jsxOpeningTagToken(sourceText, start) {
  const parsed = parseOpeningTag(sourceText, start);
  if (!parsed) return undefined;
  return { kind: 'opening', tagName: parsed.tagName, start: parsed.start, end: parsed.end, selfClosing: jsxOpeningTagSelfClosing(sourceText, parsed.end) };
}

function jsxClosingTagToken(sourceText, start) {
  const afterOpen = start + 2;
  const nameMatch = /^[A-Za-z_$][\w$]*(?:[.:][A-Za-z_$][\w$]*|-[\w$]+)*/.exec(sourceText.slice(afterOpen));
  if (!nameMatch) return undefined;
  const end = sourceText.indexOf('>', afterOpen + nameMatch[0].length);
  if (end === -1) return undefined;
  return { kind: 'closing', tagName: nameMatch[0], start, end: end + 1 };
}

function jsxOpeningTagSelfClosing(sourceText, end) {
  let cursor = end - 2;
  while (cursor >= 0 && /\s/.test(sourceText[cursor])) cursor -= 1;
  return sourceText[cursor] === '/';
}

function parseOpeningTag(sourceText, start) {
  const afterOpen = start + 1;
  if (/[/!?>]/.test(sourceText[afterOpen] ?? '')) return undefined;
  const nameMatch = /^[A-Za-z_$][\w$]*(?:[.:][A-Za-z_$][\w$]*|-[\w$]+)*/.exec(sourceText.slice(afterOpen));
  if (!nameMatch) return undefined;
  const tagName = nameMatch[0];
  const nameEnd = afterOpen + tagName.length;
  const end = openingTagEnd(sourceText, nameEnd);
  if (end === undefined) return undefined;
  const attributes = parseAttributes(sourceText, nameEnd, end - 1);
  return {
    tagName,
    start,
    end,
    text: sourceText.slice(start, end),
    attributes: attributes.values,
    reasonCodes: attributes.reasonCodes
  };
}

function parseAttributes(sourceText, start, end) {
  const values = [];
  const reasonCodes = [];
  let cursor = start;
  let spreadOrdinal = 0;
  while (cursor < end) {
    while (cursor < end && /\s/.test(sourceText[cursor])) cursor += 1;
    if (sourceText[cursor] === '/') {
      cursor += 1;
      continue;
    }
    const attrStart = cursor;
    const spreadEnd = spreadAttributeEnd(sourceText, cursor, end);
    if (spreadEnd !== undefined) {
      spreadOrdinal += 1;
      values.push({
        kind: 'spread',
        spread: true,
        spreadOrdinal,
        name: `...spread#${spreadOrdinal}`,
        start: attrStart,
        end: spreadEnd,
        text: sourceText.slice(attrStart, spreadEnd),
        expressionText: spreadExpressionText(sourceText, attrStart, spreadEnd)
      });
      cursor = spreadEnd;
      continue;
    }
    const nameMatch = /^[A-Za-z_$][\w$:-]*/.exec(sourceText.slice(cursor, end));
    if (!nameMatch) {
      reasonCodes.push('jsx-attribute-token-unsupported');
      break;
    }
    const name = nameMatch[0];
    cursor += name.length;
    while (cursor < end && /\s/.test(sourceText[cursor])) cursor += 1;
    if (sourceText[cursor] === '=') {
      cursor += 1;
      while (cursor < end && /\s/.test(sourceText[cursor])) cursor += 1;
      cursor = attributeValueEnd(sourceText, cursor, end);
      if (cursor === undefined) return { values, reasonCodes: ['jsx-attribute-value-unterminated'] };
    }
    values.push({ name, start: attrStart, end: cursor, text: sourceText.slice(attrStart, cursor) });
  }
  return { values, reasonCodes: uniqueStrings(reasonCodes) };
}

function spreadAttributeEnd(sourceText, start, end) {
  if (sourceText[start] !== '{') return undefined;
  let cursor = start + 1;
  while (cursor < end && /\s/.test(sourceText[cursor])) cursor += 1;
  if (sourceText.slice(cursor, cursor + 3) !== '...') return undefined;
  return bracedValueEnd(sourceText, start, end);
}

function spreadExpressionText(sourceText, start, end) {
  let cursor = start + 1;
  while (cursor < end && /\s/.test(sourceText[cursor])) cursor += 1;
  cursor += 3;
  return sourceText.slice(cursor, Math.max(cursor, end - 1)).trim();
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

function attributeValueEnd(sourceText, start, end) {
  const first = sourceText[start];
  if (first === '"' || first === '\'') return quotedValueEnd(sourceText, start, end, first);
  if (first === '{') return bracedValueEnd(sourceText, start, end);
  let cursor = start;
  while (cursor < end && !/[\s/]/.test(sourceText[cursor])) cursor += 1;
  return cursor;
}

function quotedValueEnd(sourceText, start, end, quote) {
  let escaped = false;
  for (let cursor = start + 1; cursor < end; cursor += 1) {
    const char = sourceText[cursor];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === quote) return cursor + 1;
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
