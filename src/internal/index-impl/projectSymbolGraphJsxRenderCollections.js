import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function jsxRenderReturnCollectionRecord(expressionText) {
  const items = topLevelArrayItems(expressionText);
  if (items.length) return collectionRecord('array-literal', 'static-render-return-array-evidence', items, 'Array');
  const fragment = topLevelFragmentItems(expressionText);
  if (!fragment?.items.length) return undefined;
  return collectionRecord(fragment.kind, 'static-render-return-fragment-evidence', fragment.items, 'Fragment');
}

function collectionRecord(collectionKind, proofStatus, items, hashScope) {
  return compactRecord({
    proofStatus,
    collectionKind,
    itemCount: items.length,
    itemExpressionTexts: items,
    itemRecords: items.map((itemText, index) => ({
      ordinal: index + 1,
      expressionText: itemText,
      expressionHash: hashSemanticValue({
        kind: `frontier.lang.projectJsxRender${hashScope}ItemExpression`,
        expressionText: itemText
      }),
      signatureHash: hashSemanticValue({
        kind: `frontier.lang.projectJsxRender${hashScope}Item`,
        ordinal: index + 1,
        expressionText: itemText
      })
    })),
    signatureHash: hashSemanticValue({
      kind: `frontier.lang.projectJsxRender${hashScope}Return`,
      collectionKind,
      items
    })
  });
}

function topLevelArrayItems(expressionText) {
  const value = stripParens(normalizedText(expressionText));
  if (!value.startsWith('[') || !value.endsWith(']')) return [];
  const body = value.slice(1, -1);
  const items = splitTopLevelComma(body).map(normalizedText).filter(Boolean);
  return items.every((item) => isStaticRenderableArrayItem(item)) ? items : [];
}

function topLevelFragmentItems(expressionText) {
  const value = stripParens(normalizedText(expressionText));
  const shorthand = /^<>\s*([\s\S]*)\s*<\/>$/.exec(value);
  if (shorthand) return { kind: 'fragment-shorthand', items: topLevelJsxChildren(shorthand[1]) };
  const named = /^<(Fragment|React\.Fragment)(?:\s[^>]*)?>\s*([\s\S]*)\s*<\/\1>$/.exec(value);
  if (!named) return undefined;
  return { kind: named[1] === 'React.Fragment' ? 'fragment-react' : 'fragment-named', items: topLevelJsxChildren(named[2]) };
}

function topLevelJsxChildren(text) {
  const value = String(text ?? '');
  const items = [];
  let index = 0;
  while (index < value.length) {
    while (/\s/.test(value[index] ?? '')) index += 1;
    if (index >= value.length) break;
    const end = jsxElementEnd(value, index);
    if (end <= index) return [];
    items.push(normalizedText(value.slice(index, end)));
    index = end;
  }
  return items;
}

function jsxElementEnd(text, start) {
  const first = jsxTagAt(text, start);
  if (!first || first.closing) return -1;
  if (first.selfClosing) return first.end;
  const stack = [first.name];
  let index = first.end;
  while (index < text.length) {
    const next = text.indexOf('<', index);
    if (next < 0) return -1;
    const tag = jsxTagAt(text, next);
    if (!tag) { index = next + 1; continue; }
    if (tag.closing) {
      const open = stack.pop();
      if (open !== tag.name) return -1;
      if (!stack.length) return tag.end;
    } else if (!tag.selfClosing) stack.push(tag.name);
    index = tag.end;
  }
  return -1;
}

function jsxTagAt(text, start) {
  const value = String(text ?? '');
  if (value[start] !== '<') return undefined;
  const end = jsxTagEnd(value, start + 1);
  if (end < 0) return undefined;
  const tagText = value.slice(start, end + 1);
  if (tagText === '<>') return { name: '#fragment', closing: false, selfClosing: false, end: end + 1 };
  if (tagText === '</>') return { name: '#fragment', closing: true, selfClosing: false, end: end + 1 };
  const match = /^<\s*(\/?)\s*([A-Za-z][\w.$:-]*)[\s\S]*?>$/.exec(tagText);
  if (!match) return undefined;
  return { name: match[2], closing: Boolean(match[1]), selfClosing: /\/\s*>$/.test(tagText), end: end + 1 };
}

function jsxTagEnd(text, start) {
  let quote;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
    } else if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '>') return index;
  }
  return -1;
}

function splitTopLevelComma(text) {
  const value = String(text ?? '');
  const parts = [];
  let start = 0;
  let quote;
  let depth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (char === ',' && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function isStaticRenderableArrayItem(text) {
  const value = stripParens(normalizedText(text));
  return /^(?:<|React\s*\.\s*createElement\s*\(|null\b|false\b|undefined\b)/.test(value);
}

function stripParens(text) {
  const value = normalizedText(text);
  const wrapped = /^\(([\s\S]*)\)$/.exec(value);
  return wrapped ? normalizedText(wrapped[1]) : value;
}
function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxRenderReturnCollectionRecord };
