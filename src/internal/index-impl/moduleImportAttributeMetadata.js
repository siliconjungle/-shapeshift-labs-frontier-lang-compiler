import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

export function moduleImportAttributeMetadata(node) {
  const entries = [
    ...attributeListEntries(node?.attributes),
    ...attributeListEntries(node?.assertions),
    ...assertClauseEntries(node?.assertClause),
    ...importCallOptionEntries(node?.options),
    ...importCallOptionEntries(Array.isArray(node?.arguments) ? node.arguments[1] : undefined)
  ];
  return importAttributeMetadataFromEntries(entries, hasImportAttributeSyntax(node), importAttributeSyntaxSource(node));
}

export function importAttributeMetadataFromSource(source) {
  const scan = scanImportAttributeSource(source);
  return importAttributeMetadataFromEntries(scan.entries, scan.syntaxPresent, source);
}

function importAttributeMetadataFromEntries(entries, syntaxPresent, syntaxSource) {
  const normalized = normalizeEntries(entries);
  if (!normalized.length && syntaxPresent) return {
    hasImportAttributes: true,
    importAttributeCount: 0,
    importAttributeKeys: [],
    importAttributeHash: hashSemanticValue({
      kind: 'frontier.lang.importAttributeStaticEvidenceMissing.v1',
      sourceText: importAttributeSourceText(syntaxSource)
    }),
    importAttributes: []
  };
  if (!normalized.length) return {};
  const keys = [...new Set(normalized.map((entry) => entry.key))].sort();
  return {
    hasImportAttributes: true,
    importAttributeCount: normalized.length,
    importAttributeKeys: keys,
    importAttributeHash: hashSemanticValue(normalized.map((entry) => [entry.key, entry.value])),
    importAttributes: normalized
  };
}

function scanImportAttributeSource(source) {
  const text = String(source ?? '');
  const clauseBodies = attributeClauseBodies(text);
  const optionBodies = ['with', 'assert'].flatMap((key) => attributeOptionBodies(text, key));
  return {
    syntaxPresent: clauseBodies.length > 0 || optionBodies.length > 0,
    entries: [...clauseBodies, ...optionBodies].flatMap((body) => sourceAttributeEntries(body))
  };
}

function attributeClauseBodies(source) {
  const bodies = [];
  const pattern = /\b(?:with|assert)\s*\{/g;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    const open = source.indexOf('{', match.index);
    const close = matchingBraceIndex(source, open);
    if (close >= 0) {
      bodies.push(source.slice(open + 1, close));
      pattern.lastIndex = close + 1;
    }
  }
  return bodies;
}

function attributeOptionBodies(source, key) {
  const bodies = [];
  const pattern = new RegExp(`(?:^|[,{])\\s*(?:${key}|["']${key}["'])\\s*:\\s*\\{`, 'g');
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    const open = pattern.lastIndex - 1;
    const close = matchingBraceIndex(source, open);
    if (close >= 0) {
      bodies.push(source.slice(open + 1, close));
      pattern.lastIndex = close + 1;
    }
  }
  return bodies;
}

function matchingBraceIndex(source, open) {
  if (open < 0) return -1;
  let depth = 0, quote = '', escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return index;
  }
  return -1;
}

function sourceAttributeEntries(body) {
  return splitTopLevelCommas(body).map((part) => {
    const colon = part.indexOf(':');
    if (colon < 0) return undefined;
    const key = sourcePropertyKey(part.slice(0, colon).trim());
    const value = sourceStringLiteral(part.slice(colon + 1).trim());
    return key && value !== undefined ? { key, value } : undefined;
  }).filter(Boolean);
}

function splitTopLevelCommas(source) {
  const parts = [];
  let start = 0, quote = '', escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === ',') {
      parts.push(source.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(source.slice(start));
  return parts;
}

function sourcePropertyKey(text) {
  return sourceStringLiteral(text) ?? text.match(/^[A-Za-z_$][\w$]*$/)?.[0];
}

function sourceStringLiteral(text) {
  const quote = text[0];
  if (quote !== '"' && quote !== "'") return undefined;
  let value = '', escaped = false;
  for (let index = 1; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      value += decodeEscape(char);
      escaped = false;
    } else if (char === '\\') escaped = true;
    else if (char === quote) return value;
    else value += char;
  }
  return undefined;
}

function decodeEscape(char) {
  return ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0' })[char] ?? char;
}

export function moduleImportAttributeEdgeFields(metadata) {
  return compactRecord({
    hasImportAttributes: metadata?.hasImportAttributes,
    importAttributeCount: metadata?.importAttributeCount,
    importAttributeKeys: metadata?.importAttributeKeys,
    importAttributeHash: metadata?.importAttributeHash,
    importAttributes: metadata?.importAttributes
  });
}

function attributeListEntries(list) {
  const entries = Array.isArray(list) ? list : Array.isArray(list?.elements) ? list.elements : [];
  return entries.map((entry) => attributeEntry(entry)).filter(Boolean);
}

function assertClauseEntries(assertClause) {
  return attributeListEntries(assertClause?.elements);
}

function attributeEntry(entry) {
  const key = propertyKeyName(entry?.key ?? entry?.name);
  const value = literalString(entry?.value ?? entry?.initializer);
  return key && value !== undefined ? { key, value } : undefined;
}

function importCallOptionEntries(options) {
  const object = objectProperties(options);
  if (!object.length) return [];
  const attributes = [];
  for (const property of object) {
    const key = propertyKeyName(property.key ?? property.name);
    if (key !== 'with' && key !== 'assert') continue;
    for (const nested of objectProperties(property.value ?? property.initializer)) {
      const nestedKey = propertyKeyName(nested.key ?? nested.name);
      const nestedValue = literalString(nested.value ?? nested.initializer);
      if (nestedKey && nestedValue !== undefined) attributes.push({ key: nestedKey, value: nestedValue });
    }
  }
  return attributes;
}

function objectProperties(node) {
  if (!node) return [];
  if (Array.isArray(node.properties)) return node.properties;
  if (typeof node.with === 'object') return [{ key: { name: 'with' }, value: node.with }];
  if (typeof node.assert === 'object') return [{ key: { name: 'assert' }, value: node.assert }];
  return [];
}

function propertyKeyName(node) {
  if (!node) return undefined;
  if (typeof node.name === 'string') return node.name;
  if (typeof node.text === 'string') return node.text;
  if (typeof node.value === 'string') return node.value;
  if (typeof node.escapedText === 'string') return node.escapedText;
  return undefined;
}

function literalString(node) {
  if (!node) return undefined;
  if (typeof node.value === 'string') return node.value;
  if (typeof node.text === 'string') return node.text;
  if (typeof node.escapedText === 'string') return node.escapedText;
  return undefined;
}

function normalizeEntries(entries) {
  const seen = new Set();
  return entries
    .filter((entry) => entry?.key && entry.value !== undefined)
    .map((entry) => ({ key: entry.key, value: entry.value }))
    .sort((left, right) => left.key.localeCompare(right.key) || left.value.localeCompare(right.value))
    .filter((entry) => {
      const id = `${entry.key}\0${entry.value}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function importAttributeSourceText(source) {
  return typeof source === 'string' && source.trim()
    ? source.trim()
    : '<import-attribute-syntax-present>';
}

function importAttributeSyntaxSource(node) {
  if (!node) return undefined;
  if (typeof node.getText === 'function') {
    try {
      const text = node.getText();
      if (typeof text === 'string' && text.trim()) return text.trim();
    } catch {}
  }
  if (typeof node.raw === 'string') return node.raw;
  if (typeof node.sourceText === 'string') return node.sourceText;
  return String(node.type ?? node.kindName ?? node.kind ?? '');
}

function hasImportAttributeSyntax(node) {
  return Boolean(
    node?.attributes
    || node?.assertions
    || node?.assertClause
    || node?.options
    || (Array.isArray(node?.arguments) && node.arguments.length > 1)
  );
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
