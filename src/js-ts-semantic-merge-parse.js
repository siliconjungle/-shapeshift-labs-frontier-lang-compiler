function normalizeKind(kind) {
  const text = String(kind ?? '').toLowerCase();
  if (text === 'interface') return 'interface';
  if (text === 'type' || text === 'typealias' || text === 'type-alias') return 'type';
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

function parseMembers(body, kind) {
  const reasonCodes = [];
  const members = [];
  for (const segment of splitMemberSegments(body, kind)) {
    const trimmed = segment.text.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('...')) {
      reasonCodes.push('spread-member');
      continue;
    }
    if (trimmed.startsWith('[')) {
      reasonCodes.push('computed-key');
      continue;
    }
    if (kind === 'type' && isTypeAliasConflictMember(trimmed)) {
      reasonCodes.push('type-alias-conflict');
      continue;
    }
    const key = kind === 'object' ? objectMemberKey(trimmed) : typeMemberKey(trimmed);
    if (!key) {
      reasonCodes.push(`unsupported-${kind}-member`);
      continue;
    }
    members.push({ ...segment, key });
  }
  return { members, reasonCodes: uniqueStrings(reasonCodes) };
}

function splitMemberSegments(body, kind) {
  const entries = [];
  const text = String(body ?? '');
  let start = 0;
  let quote;
  let escaped = false;
  let blockComment = false;
  let lineComment = false;
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
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
    if (char === '{' || char === '[' || char === '(') depth += 1;
    else if (char === '}' || char === ']' || char === ')') depth -= 1;
    const separator = kind === 'object' ? ',' : ';';
    if (char === separator && depth === 0) {
      entries.push({ text: text.slice(start, index + 1), start, end: index + 1 });
      start = index + 1;
    }
  }
  entries.push({ text: text.slice(start), start, end: text.length });
  return entries.filter((entry) => entry.text.trim());
}

function objectMemberKey(text) {
  const colon = topLevelColon(text);
  if (colon < 0) return undefined;
  return propertyKey(text.slice(0, colon).trim());
}

function typeMemberKey(text) {
  const source = text.replace(/[;,]\s*$/, '').trim().replace(/^readonly\s+/, '');
  const methodMatch = source.match(/^(['"]?)([A-Za-z_$][\w$-]*)\1\??\s*(?:<[^({;]+>)?\s*\(/);
  if (methodMatch) return methodMatch[2];
  const colon = topLevelColon(source);
  if (colon < 0) return undefined;
  return propertyKey(source.slice(0, colon).trim().replace(/\?$/, '').trim());
}

function isTypeAliasConflictMember(text) {
  return /^\|/.test(text) || /^&/.test(text);
}

function propertyKey(source) {
  if (!source || source.startsWith('[')) return undefined;
  const quoted = source.match(/^(['"])([^'"\\]+)\1$/);
  if (quoted) return quoted[2];
  const identifier = source.match(/^[A-Za-z_$][\w$-]*$/);
  return identifier?.[0];
}

function topLevelColon(source) {
  let quote;
  let escaped = false;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') depth += 1;
    else if (char === '}' || char === ']' || char === ')') depth -= 1;
    else if (char === ':' && depth === 0) return index;
  }
  return -1;
}

function canonicalizeSourceBodies(sourceText, preparedRegions, side) {
  let output = sourceText;
  const replacements = preparedRegions
    .map((region) => ({ range: region[side], replacement: region.base.body }))
    .sort((left, right) => right.range.bodyStart - left.range.bodyStart);
  for (const { range, replacement } of replacements) output = `${output.slice(0, range.bodyStart)}${replacement}${output.slice(range.bodyEnd)}`;
  return output;
}

function applyMemberAdditions(headSourceText, preparedRegions) {
  let output = headSourceText;
  const replacements = preparedRegions
    .filter((region) => region.workerAddedMembers.length)
    .map((region) => ({ range: region.head, replacement: appendMembersToBody(region.head.body, region.workerAddedMembers) }))
    .sort((left, right) => right.range.bodyStart - left.range.bodyStart);
  for (const { range, replacement } of replacements) output = `${output.slice(0, range.bodyStart)}${replacement}${output.slice(range.bodyEnd)}`;
  return output;
}

function appendMembersToBody(body, members) {
  if (!members.length) return body;
  const indent = inferMemberIndent(body) ?? inferMemberIndent(members.map((member) => member.text).join('\n')) ?? '  ';
  const addedText = members.map((member) => normalizeMemberForInsertion(member.text, indent)).join('\n');
  const trailing = body.match(/\s*$/)?.[0] ?? '';
  const before = body.slice(0, body.length - trailing.length);
  if (!before.trim()) {
    const closingIndent = trailing.includes('\n') ? trailing.slice(trailing.lastIndexOf('\n') + 1) : '';
    return `\n${addedText}\n${closingIndent}`;
  }
  return `${before}${before.endsWith('\n') ? '' : '\n'}${addedText}${trailing.includes('\n') ? trailing : `\n${trailing}`}`;
}

function inferMemberIndent(text) {
  return String(text ?? '').match(/\n([ \t]*)\S/)?.[1];
}

function normalizeMemberForInsertion(text, indent) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  const commonIndent = minimumIndent(lines);
  return lines.map((line) => {
    const normalized = commonIndent ? line.slice(Math.min(commonIndent, leadingWhitespace(line))) : line;
    return normalized.trim() ? `${indent}${normalized}` : normalized;
  }).join('\n');
}

function minimumIndent(lines) {
  const indents = lines.filter((line) => line.trim()).map(leadingWhitespace);
  return indents.length ? Math.min(...indents) : 0;
}

function leadingWhitespace(line) {
  return line.match(/^[ \t]*/)?.[0].length ?? 0;
}

function normalizeMemberText(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map((line) => line.trimEnd()).join('\n').trim();
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export {
  applyMemberAdditions,
  canonicalizeSourceBodies,
  findContainer,
  normalizeKind,
  normalizeMemberText,
  parseMembers,
  uniqueStrings
};
