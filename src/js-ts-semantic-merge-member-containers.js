function normalizeKind(kind) {
  const text = String(kind ?? '').toLowerCase();
  if (text === 'interface') return 'interface';
  if (text === 'type' || text === 'typealias' || text === 'type-alias') return 'type';
  if (text === 'class') return 'class';
  if (text === 'object' || text === 'object-literal') return 'object';
  return undefined;
}

function findContainer(sourceText, region) {
  const kind = normalizeKind(region.kind);
  const pattern = containerPattern(kind, region.name);
  const matches = [];
  let match;
  while ((match = pattern.exec(sourceText))) {
    const openIndex = sourceText.indexOf('{', match.index);
    if (openIndex < 0 || openIndex >= pattern.lastIndex) continue;
    const closeIndex = findMatchingBrace(sourceText, openIndex);
    if (closeIndex < 0) return { reasonCodes: ['unterminated-container'] };
    matches.push({
      kind,
      name: region.name,
      start: match.index,
      openStart: openIndex,
      bodyStart: openIndex + 1,
      bodyEnd: closeIndex,
      end: closeIndex + 1,
      body: sourceText.slice(openIndex + 1, closeIndex)
    });
  }
  if (!matches.length) return { reasonCodes: ['container-not-found'] };
  if (matches.length > 1) return { reasonCodes: ['ambiguous-container'] };
  return { reasonCodes: [], value: matches[0] };
}

function containerPattern(kind, name) {
  const escapedName = escapeRegExp(name);
  if (kind === 'interface') return new RegExp(`\\b(?:export\\s+)?interface\\s+${escapedName}\\b[^{};=]*\\{`, 'g');
  if (kind === 'type') return new RegExp(`\\b(?:export\\s+)?type\\s+${escapedName}\\b\\s*=\\s*\\{`, 'g');
  if (kind === 'class') return new RegExp(`\\b(?:export\\s+)?(?:default\\s+)?(?:abstract\\s+)?class\\s+${escapedName}\\b[^{};=]*\\{`, 'g');
  return new RegExp(`\\b(?:export\\s+)?(?:const|let|var)\\s+${escapedName}\\b[^=;{}]*=\\s*\\{`, 'g');
}

function findMatchingBrace(sourceText, openIndex) {
  let depth = 0;
  let quote;
  let escaped = false;
  let blockComment = false;
  let lineComment = false;
  for (let index = openIndex; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    const next = sourceText[index + 1];
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
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export {
  findContainer,
  normalizeKind
};
