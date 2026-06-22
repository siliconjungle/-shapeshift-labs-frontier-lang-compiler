import {
  hasComputedMemberKey,
  hasSpreadLikeMember,
  isTypeAliasConflictMember,
  memberKey
} from './js-ts-semantic-merge-member-keys.js';
import { uniqueStrings } from './js-ts-semantic-merge-member-utils.js';

function parseMembers(body, kind) {
  const reasonCodes = [];
  const members = [];
  for (const segment of splitMemberSegments(body, kind)) {
    const trimmed = segment.text.trim();
    if (!trimmed) continue;
    if (hasSpreadLikeMember(trimmed)) {
      reasonCodes.push('spread-like-member');
      continue;
    }
    if (hasComputedMemberKey(trimmed)) {
      reasonCodes.push('computed-key');
      continue;
    }
    if (kind === 'type' && isTypeAliasConflictMember(trimmed)) {
      reasonCodes.push('type-alias-conflict');
      continue;
    }
    const parsed = memberKey(trimmed, kind);
    if (!parsed?.key) {
      reasonCodes.push(`unsupported-${kind}-member`);
      continue;
    }
    members.push({ ...segment, ...parsed });
  }
  return { members, reasonCodes: uniqueStrings(reasonCodes) };
}

function splitMemberSegments(body, kind) {
  if (kind === 'class') return splitClassMemberSegments(body);
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

function splitClassMemberSegments(body) {
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
    if (char === '{' || char === '[' || char === '(') {
      depth += 1;
      continue;
    }
    if (char === '}' || char === ']' || char === ')') {
      depth -= 1;
      if (depth === 0 && char === '}') {
        const nextIndex = nextSignificantIndex(text, index + 1);
        if (text[nextIndex] !== ';') {
          entries.push({ text: text.slice(start, index + 1), start, end: index + 1 });
          start = index + 1;
        }
      }
      continue;
    }
    if (char === ';' && depth === 0) {
      entries.push({ text: text.slice(start, index + 1), start, end: index + 1 });
      start = index + 1;
    }
  }
  entries.push({ text: text.slice(start), start, end: text.length });
  return entries.filter((entry) => entry.text.trim());
}

function nextSignificantIndex(text, offset) {
  let index = offset;
  while (index < text.length) {
    if (/\s/.test(text[index])) {
      index += 1;
      continue;
    }
    if (text[index] === '/' && text[index + 1] === '/') {
      index += 2;
      while (index < text.length && text[index] !== '\n' && text[index] !== '\r') index += 1;
      continue;
    }
    if (text[index] === '/' && text[index + 1] === '*') {
      index += 2;
      while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) index += 1;
      index += 2;
      continue;
    }
    break;
  }
  return index;
}

export {
  parseMembers
};
