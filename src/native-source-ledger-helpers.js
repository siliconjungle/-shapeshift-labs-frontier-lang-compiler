const regexStartKeywords = new Set(['case', 'delete', 'else', 'in', 'instanceof', 'new', 'return', 'throw', 'typeof', 'void', 'yield']);

export function isSourceMapComment(text) {
  return /^(?:\/\/|\/\*)[#@]\s*source(?:Mapping)?URL=/.test(String(text).trim());
}

export function readToLineEnd(text, start) {
  let index = start;
  while (index < text.length && text[index] !== '\n' && text[index] !== '\r') index += 1;
  return index;
}

export function readBlockCommentEnd(text, start) {
  const end = text.indexOf('*/', start + 2);
  return end === -1 ? text.length : end + 2;
}

export function readQuotedEnd(text, start, quote) {
  let escaped = false;
  for (let index = start + 1; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === quote) {
      return index + 1;
    } else if (char === '\n' || char === '\r') {
      return index;
    }
  }
  return text.length;
}

export function readTemplateEnd(text, start) {
  let escaped = false;
  for (let index = start + 1; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === '`') return index + 1;
  }
  return text.length;
}

export function readRegexEnd(text, start) {
  let escaped = false;
  let inClass = false;
  for (let index = start + 1; index < text.length; index += 1) {
    const char = text[index];
    if (char === '\n' || char === '\r') return undefined;
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === '[') inClass = true;
    else if (char === ']') inClass = false;
    else if (char === '/' && !inClass) return readWhile(text, index + 1, (value) => /[A-Za-z]/.test(value));
  }
  return undefined;
}

export function readJsxRegionEnd(text, start) {
  let index = start;
  let depth = 0;
  while (index < text.length) {
    if (text[index] === '{') {
      index = readBalancedBraceEnd(text, index);
      continue;
    }
    if (text[index] !== '<') {
      index += 1;
      continue;
    }
    const tag = readJsxTag(text, index);
    if (!tag) return index > start ? index : start + 1;
    if (tag.close) depth -= 1;
    else if (!tag.selfClosing) depth += 1;
    index = tag.end;
    if (depth <= 0) return index;
  }
  return text.length;
}

export function readStatementEnd(text, start) {
  const end = readToLineEnd(text, start);
  const semicolon = text.indexOf(';', start);
  return semicolon !== -1 && semicolon < end ? semicolon + 1 : end;
}

export function readWhile(text, start, predicate) {
  let index = start;
  while (index < text.length && predicate(text[index])) index += 1;
  return index;
}

export function endPosition(start, text) {
  let line = start.line;
  let column = start.column;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\r') {
      if (text[index + 1] === '\n') index += 1;
      line += 1;
      column = 1;
    } else if (text[index] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { offset: start.offset + text.length, line, column };
}

export function looksLikeJsxStart(text, offset, previous) {
  if (text[offset] !== '<' || !(isIdentifierStart(text[offset + 1]) || text[offset + 1] === '>')) return false;
  if (!previous) return true;
  if (previous.kind === 'operator' || ['(', '[', '{', ',', ':', '?', '=>'].includes(previous.text)) return true;
  return previous.kind === 'keyword' && ['return', 'case', 'throw'].includes(previous.text);
}

export function mayStartRegex(previous) {
  if (!previous) return true;
  if (previous.kind === 'operator') return true;
  if (previous.kind === 'keyword') return regexStartKeywords.has(previous.text);
  return ['(', '[', '{', ',', ';', ':', '?'].includes(previous.text);
}

export function braceMetadata(char, stack, tokenId) {
  const kind = char === '{' || char === '}' ? 'curly' : char === '(' || char === ')' ? 'paren' : 'bracket';
  if (char === '{' || char === '(' || char === '[') {
    stack.push({ char, tokenId, kind });
    return { braceKind: kind, side: 'open', depth: stack.length };
  }
  const open = char === '}' ? '{' : char === ')' ? '(' : '[';
  const matchIndex = stack.map((entry) => entry.char).lastIndexOf(open);
  const matched = matchIndex >= 0 ? stack.splice(matchIndex, 1)[0] : undefined;
  return { braceKind: kind, side: 'close', depth: stack.length + 1, openTokenId: matched?.tokenId };
}

export function isBrace(char) {
  return char === '{' || char === '}' || char === '(' || char === ')' || char === '[' || char === ']';
}

export function isHorizontalWhitespace(char) {
  return char === ' ' || char === '\t' || char === '\v' || char === '\f';
}

export function isIdentifierStart(char) {
  return /[A-Za-z_$]/.test(char ?? '');
}

export function isIdentifierPart(char) {
  return /[A-Za-z0-9_$]/.test(char ?? '');
}

function readJsxTag(text, start) {
  if (text[start + 1] === '!' && text.startsWith('<!--', start)) {
    const end = text.indexOf('-->', start + 4);
    return { end: end === -1 ? text.length : end + 3, selfClosing: true, close: false };
  }
  let index = start + 1;
  const close = text[index] === '/';
  if (close) index += 1;
  if (text[index] === '>') return { end: index + 1, selfClosing: false, close };
  if (!isIdentifierStart(text[index])) return undefined;
  let quote = undefined;
  for (; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
    } else if (char === '\'' || char === '"') {
      quote = char;
    } else if (char === '>') {
      return { end: index + 1, selfClosing: text[index - 1] === '/', close };
    }
  }
  return { end: text.length, selfClosing: true, close };
}

function readBalancedBraceEnd(text, start) {
  let depth = 1;
  for (let index = start + 1; index < text.length; index += 1) {
    const char = text[index];
    if (char === '\'' || char === '"') index = readQuotedEnd(text, index, char) - 1;
    else if (char === '`') index = readTemplateEnd(text, index) - 1;
    else if (char === '/' && text[index + 1] === '/') index = readToLineEnd(text, index) - 1;
    else if (char === '/' && text[index + 1] === '*') index = readBlockCommentEnd(text, index) - 1;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return text.length;
}
