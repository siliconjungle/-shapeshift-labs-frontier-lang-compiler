import { normalizeKind, uniqueStrings } from './js-ts-semantic-merge-parse.js';

export function classBodyInvariantReasons(region, side, body) {
  const reasonCodes = [];
  for (const segment of splitClassElementSegments(body)) {
    const text = segment.text.trim();
    if (!text) continue;
    if (hasClassDecorator(text)) reasonCodes.push(regionReason(region, `decorator-member:${side}`));
    if (hasStaticBlock(text)) reasonCodes.push(regionReason(region, `static-block-ordering:${side}`));
  }
  return uniqueStrings(reasonCodes);
}

export function classPrivateScopeReasons(region, side, baseMembers, sideMembers, sideAddedKeys) {
  const reasonCodes = [];
  const basePrivateNames = privateDeclarationNames(baseMembers);
  const sidePrivateNames = privateDeclarationNames(sideMembers);
  for (const name of duplicatePrivateDeclarationNames(sideMembers)) {
    reasonCodes.push(regionReason(region, `private-name-scope:${side}:${name}`));
  }
  for (const key of sideAddedKeys) {
    const member = sideMembers.find((candidate) => candidate.key === key);
    if (!member) continue;
    const declaredName = privateNameFromKey(member.key);
    if (declaredName && basePrivateNames.has(declaredName)) {
      reasonCodes.push(regionReason(region, `private-name-scope:${side}:${declaredName}`));
    }
    for (const name of privateReferences(member)) {
      if (!basePrivateNames.has(name) && !sidePrivateNames.has(name)) {
        reasonCodes.push(regionReason(region, `private-name-scope:${side}:${name}`));
      }
    }
  }
  return uniqueStrings(reasonCodes);
}

export function classPrivateAddedCollisionReasons(region, workerAddedKeys, headAddedKeys, workerByKey, headByKey) {
  const workerNames = privateNamesForKeys(workerAddedKeys, workerByKey);
  const headNames = privateNamesForKeys(headAddedKeys, headByKey);
  return [...workerNames].filter((name) => headNames.has(name))
    .map((name) => regionReason(region, `private-name-scope:worker-head:${name}`));
}

export function isAccessorMember(member) {
  return member?.memberKind === 'accessor';
}

export function isPrivateMemberKey(key) {
  return Boolean(privateNameFromKey(key));
}

export function privateNameFromKey(key) {
  const normalized = String(key ?? '').replace(/^static\./, '');
  return normalized.startsWith('#') ? normalized : undefined;
}

function regionReason(region, reason) {
  return `${reason}:${normalizeKind(region.kind)}:${region.name}`;
}

function privateNamesForKeys(keys, byKey) {
  const names = new Set();
  for (const key of keys) {
    const name = privateNameFromKey(byKey.get(key)?.key);
    if (name) names.add(name);
  }
  return names;
}

function privateDeclarationNames(members) {
  const names = new Set();
  for (const member of members) {
    const name = privateNameFromKey(member.key);
    if (name) names.add(name);
  }
  return names;
}

function duplicatePrivateDeclarationNames(members) {
  const namesByPrivateName = new Map();
  for (const member of members) {
    const name = privateNameFromKey(member.key);
    if (!name) continue;
    const keys = namesByPrivateName.get(name) ?? new Set();
    keys.add(member.key);
    namesByPrivateName.set(name, keys);
  }
  return [...namesByPrivateName]
    .filter(([, keys]) => keys.size > 1)
    .map(([name]) => name);
}

function privateReferences(member) {
  const declarations = new Set();
  const declaredName = privateNameFromKey(member?.key);
  if (declaredName) declarations.add(declaredName);
  return privateNameTokens(member?.text).filter((name) => !declarations.has(name));
}

function privateNameTokens(text) {
  const names = [];
  const source = String(text ?? '');
  let quote;
  let escaped = false;
  let blockComment = false;
  let lineComment = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
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
    if (char === '#' && /[A-Za-z_$]/.test(next ?? '')) {
      let end = index + 2;
      while (/[\w$]/.test(source[end] ?? '')) end += 1;
      names.push(source.slice(index, end));
      index = end - 1;
    }
  }
  return uniqueStrings(names);
}

function hasClassDecorator(text) {
  return String(text ?? '').trimStart().startsWith('@');
}

function hasStaticBlock(text) {
  return /^static\s*\{/.test(String(text ?? '').trimStart());
}

function splitClassElementSegments(body) {
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
