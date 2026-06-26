import {
  analyzeJsTsBindingPattern,
  leadingJsTsBindingPatternText
} from './js-ts-safe-merge-binding-patterns.js';
import { normalizeLineEndings, uniqueStrings } from './js-ts-safe-merge-context.js';

function variableStatementsByKey(sourceText) {
  const reasonCodes = [];
  const statements = topLevelStatements(sourceText)
    .map((statement) => parseVariableStatement(statement))
    .filter(Boolean);
  const byKey = new Map();
  for (const statement of statements) {
    const key = statement.names.join('\0');
    if (byKey.has(key)) reasonCodes.push('duplicate-variable-declarator-statement-key');
    byKey.set(key, statement);
  }
  return { statements, byKey, reasonCodes: uniqueStrings(reasonCodes) };
}

function parseVariableStatement(statement) {
  const text = statement.text;
  if (/[`]/.test(text)) return undefined;
  const leading = text.match(/^\s*/)?.[0].length ?? 0;
  const meaningful = text.slice(leading);
  const match = /^(?:export\s+)?(?:declare\s+)?(?:const|let|var)\s+/u.exec(meaningful);
  if (!match) return undefined;
  const prefixEnd = leading + match[0].length;
  const suffixStart = statementSuffixStart(text);
  if (suffixStart <= prefixEnd) return undefined;
  const declaratorText = text.slice(prefixEnd, suffixStart);
  if (/[\r\n]/.test(declaratorText)) return undefined;
  const declarators = splitDeclarators(declaratorText, prefixEnd);
  if (declarators.length < 2 || declarators.some((entry) => !entry.key)) return undefined;
  return {
    start: statement.start,
    end: statement.end,
    text,
    prefix: text.slice(0, prefixEnd),
    suffix: text.slice(suffixStart),
    names: declarators.map((entry) => entry.key),
    declarators
  };
}

function statementSuffixStart(text) {
  let index = text.length;
  while (index > 0 && /\s/u.test(text[index - 1])) index -= 1;
  if (text[index - 1] === ';') index -= 1;
  while (index > 0 && /\s/u.test(text[index - 1])) index -= 1;
  return index;
}

function splitDeclarators(text, offset) {
  const parts = [];
  let start = 0;
  let state = 'code';
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        index += 1;
        state = 'code';
      }
      continue;
    }
    if (state !== 'code') {
      if (char === '\\') index += 1;
      else if (char === state) state = 'code';
      continue;
    }
    if (char === '/' && next === '/') {
      state = 'line-comment';
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      state = 'block-comment';
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      state = char;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    else if (char === ',' && depth === 0) {
      parts.push(declaratorPart(text, start, index, offset));
      start = index + 1;
    }
    if (depth < 0) return [];
  }
  if (state !== 'code' || depth !== 0) return [];
  parts.push(declaratorPart(text, start, text.length, offset));
  return parts;
}

function declaratorPart(text, start, end, offset) {
  let localStart = start;
  let localEnd = end;
  while (localStart < localEnd && /\s/u.test(text[localStart])) localStart += 1;
  while (localEnd > localStart && /\s/u.test(text[localEnd - 1])) localEnd -= 1;
  const value = text.slice(localStart, localEnd);
  const binding = declaratorBinding(value);
  return {
    name: binding?.name,
    key: binding?.key,
    binding,
    text: value,
    start: offset + localStart,
    end: offset + localEnd
  };
}

function declaratorBinding(value) {
  const identifier = /^[A-Za-z_$][\w$]*/u.exec(value)?.[0];
  if (identifier && value[identifier.length] !== '?') {
    return { kind: 'identifier', patternKind: 'identifier', name: identifier, key: identifier, reasonCodes: [] };
  }
  let start = 0;
  while (start < value.length && /\s/u.test(value[start])) start += 1;
  const open = value[start];
  if (open !== '{' && open !== '[') return undefined;
  const patternKind = open === '{' ? 'object' : 'array';
  const patternText = leadingJsTsBindingPatternText(value.slice(start), patternKind);
  if (!patternText) return undefined;
  const pattern = analyzeJsTsBindingPattern(patternText, patternKind);
  return {
    kind: 'binding-pattern',
    patternKind: pattern.patternKind,
    name: `binding-pattern:${pattern.patternKind}`,
    key: `binding-pattern:${pattern.patternKind}`,
    patternText,
    bindingNames: pattern.bindingNames,
    reasonCodes: pattern.reasonCodes
  };
}

function topLevelStatements(sourceText) {
  const statements = [];
  let start = 0;
  let state = 'code';
  let depth = 0;
  for (let index = 0; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    const next = sourceText[index + 1];
    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        index += 1;
        state = 'code';
      }
      continue;
    }
    if (state !== 'code') {
      if (char === '\\') index += 1;
      else if (char === state) state = 'code';
      continue;
    }
    if (char === '/' && next === '/') {
      state = 'line-comment';
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      state = 'block-comment';
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      state = char;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    else if (char === ';' && depth === 0) {
      statements.push({ start, end: index + 1, text: sourceText.slice(start, index + 1) });
      start = index + 1;
    }
  }
  if (sourceText.slice(start).trim()) statements.push({ start, end: sourceText.length, text: sourceText.slice(start) });
  return statements;
}

function sameVariableStatementShell(left, right) {
  return sameVariableDeclaratorText(left.prefix, right.prefix)
    && sameVariableDeclaratorText(left.suffix, right.suffix)
    && left.names.join('\0') === right.names.join('\0');
}

function sameVariableDeclaratorText(left, right) {
  return normalizeLineEndings(String(left ?? '').trim(), '\n') === normalizeLineEndings(String(right ?? '').trim(), '\n');
}

export {
  sameVariableDeclaratorText,
  sameVariableStatementShell,
  variableStatementsByKey
};
