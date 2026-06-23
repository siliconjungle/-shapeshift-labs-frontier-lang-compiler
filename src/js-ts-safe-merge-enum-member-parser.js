import { normalizeLineEndings, uniqueStrings } from './js-ts-safe-merge-context.js';

function enumDeclarationsByName(sourceText) {
  const reasonCodes = [];
  const declarations = topLevelEnumDeclarations(sourceText)
    .map((declaration) => parseEnumDeclaration(sourceText, declaration))
    .filter(Boolean);
  const byName = new Map();
  for (const declaration of declarations) {
    if (byName.has(declaration.name)) reasonCodes.push('duplicate-enum-declaration-name');
    byName.set(declaration.name, declaration);
  }
  return { declarations, byName, reasonCodes: uniqueStrings(reasonCodes) };
}

function parseEnumDeclaration(sourceText, match) {
  const header = sourceText.slice(match.start, match.bodyStart);
  const nameMatch = /\benum\s+([A-Za-z_$][\w$]*)\s*$/u.exec(header);
  if (!nameMatch) return undefined;
  const body = sourceText.slice(match.bodyStart + 1, match.bodyEnd);
  const members = splitEnumMembers(body, match.bodyStart + 1);
  if (!members.length || members.some((member) => !member.name)) return undefined;
  const tailStart = members.at(-1).end;
  return {
    name: nameMatch[1],
    start: match.start,
    end: match.end,
    text: sourceText.slice(match.start, match.end),
    prefix: sourceText.slice(match.start, match.bodyStart + 1),
    tail: sourceText.slice(tailStart, match.bodyEnd),
    suffix: sourceText.slice(match.bodyEnd, match.end),
    members
  };
}

function topLevelEnumDeclarations(sourceText) {
  const declarations = [];
  let state = 'code';
  let depth = 0;
  for (let index = 0; index < sourceText.length; index += 1) {
    const nextIndex = advanceState(sourceText, index, state);
    if (nextIndex.state !== state || nextIndex.index !== index) {
      state = nextIndex.state;
      index = nextIndex.index;
      continue;
    }
    if (state !== 'code') continue;
    const char = sourceText[index];
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    if (depth !== 0 || !wordAt(sourceText, index, 'enum')) continue;
    const bodyStart = sourceText.indexOf('{', index);
    if (bodyStart === -1) continue;
    const bodyEnd = matchingBrace(sourceText, bodyStart);
    if (bodyEnd === -1) continue;
    declarations.push({
      start: enumDeclarationStart(sourceText, index),
      bodyStart,
      bodyEnd,
      end: enumDeclarationEnd(sourceText, bodyEnd + 1)
    });
    index = bodyEnd;
  }
  return declarations;
}

function splitEnumMembers(body, offset) {
  const members = [];
  let start = 0;
  let state = 'code';
  let depth = 0;
  for (let index = 0; index < body.length; index += 1) {
    const nextIndex = advanceState(body, index, state);
    if (nextIndex.state !== state || nextIndex.index !== index) {
      state = nextIndex.state;
      index = nextIndex.index;
      continue;
    }
    if (state !== 'code') continue;
    const char = body[index];
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    else if (char === ',' && depth === 0) {
      pushEnumMember(members, body, start, index, offset);
      start = index + 1;
    }
    if (depth < 0) return [];
  }
  if (state !== 'code' || depth !== 0) return [];
  pushEnumMember(members, body, start, body.length, offset);
  return members;
}

function pushEnumMember(members, body, start, end, offset) {
  let localStart = start;
  let localEnd = end;
  while (localStart < localEnd && /\s/u.test(body[localStart])) localStart += 1;
  while (localEnd > localStart && /\s/u.test(body[localEnd - 1])) localEnd -= 1;
  if (localStart === localEnd) return;
  const text = body.slice(start, localEnd);
  const trimmed = body.slice(localStart, localEnd);
  const name = enumMemberName(trimmed);
  members.push({ name, text, start: offset + start, end: offset + localEnd });
}

function enumMemberName(text) {
  const identifier = /^[A-Za-z_$][\w$]*/u.exec(text)?.[0];
  if (identifier) return identifier;
  const quoted = /^(["'])(.*?)\1/u.exec(text);
  return quoted ? quoted[2] : undefined;
}

function matchingBrace(sourceText, bodyStart) {
  let state = 'code';
  let depth = 0;
  for (let index = bodyStart; index < sourceText.length; index += 1) {
    const nextIndex = advanceState(sourceText, index, state);
    if (nextIndex.state !== state || nextIndex.index !== index) {
      state = nextIndex.state;
      index = nextIndex.index;
      continue;
    }
    if (state !== 'code') continue;
    if (sourceText[index] === '{') depth += 1;
    else if (sourceText[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function enumDeclarationStart(sourceText, enumOffset) {
  let start = sourceText.lastIndexOf('\n', enumOffset) + 1;
  const leading = sourceText.slice(start, enumOffset);
  if (/\b(?:export|declare|const)\s+$/u.test(leading)) return start;
  const exportIndex = leading.search(/\bexport\b/u);
  return exportIndex === -1 ? enumOffset : start + exportIndex;
}

function enumDeclarationEnd(sourceText, bodyCloseEnd) {
  let end = bodyCloseEnd;
  while (end < sourceText.length && /[ \t]/u.test(sourceText[end])) end += 1;
  if (sourceText[end] === ';') end += 1;
  if (sourceText[end] === '\r' && sourceText[end + 1] === '\n') return end + 2;
  if (sourceText[end] === '\n') return end + 1;
  return end;
}

function advanceState(sourceText, index, state) {
  const char = sourceText[index];
  const next = sourceText[index + 1];
  if (state === 'line-comment') return char === '\n' ? { state: 'code', index } : { state, index };
  if (state === 'block-comment') {
    return char === '*' && next === '/' ? { state: 'code', index: index + 1 } : { state, index };
  }
  if (state !== 'code') {
    if (char === '\\') return { state, index: index + 1 };
    return char === state ? { state: 'code', index } : { state, index };
  }
  if (char === '/' && next === '/') return { state: 'line-comment', index: index + 1 };
  if (char === '/' && next === '*') return { state: 'block-comment', index: index + 1 };
  if (char === '"' || char === "'" || char === '`') return { state: char, index };
  return { state, index };
}

function wordAt(sourceText, index, word) {
  return sourceText.slice(index, index + word.length) === word
    && !/[A-Za-z0-9_$]/u.test(sourceText[index - 1] ?? '')
    && !/[A-Za-z0-9_$]/u.test(sourceText[index + word.length] ?? '');
}

function sameEnumMemberText(left, right) {
  return normalizeLineEndings(String(left ?? '').trim(), '\n') === normalizeLineEndings(String(right ?? '').trim(), '\n');
}

function sameEnumShell(left, right) {
  return sameEnumMemberText(left.prefix, right.prefix) && sameEnumMemberText(left.suffix, right.suffix);
}

export {
  enumDeclarationsByName,
  sameEnumMemberText,
  sameEnumShell
};
