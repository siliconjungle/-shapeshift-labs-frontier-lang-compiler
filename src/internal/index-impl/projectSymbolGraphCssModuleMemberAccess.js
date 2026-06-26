import { readStaticMemberLiteral } from './staticMemberLiteral.js';
import { escapeRegExp, isIdentifierChar } from './projectSymbolGraphCssModuleUtils.js';

const IdentifierPattern = /^[A-Za-z_$][\w$]*$/;

function cssModuleMemberAccess(sourceText, receiverEnd) {
  let index = receiverEnd;
  while (index < sourceText.length && /\s/.test(sourceText[index])) index += 1;
  if (sourceText[index] === '?' && sourceText[index + 1] === '.') index += 2;
  else if (sourceText[index] === '.') index += 1;
  else if (sourceText[index] === '[') return cssModuleComputedAccess(sourceText, index);
  else return undefined;
  while (index < sourceText.length && /\s/.test(sourceText[index])) index += 1;
  const match = /^[A-Za-z_$][\w$]*/.exec(sourceText.slice(index));
  return match ? { accessKind: 'dot', memberName: match[0], end: index + match[0].length } : undefined;
}

function cssModuleComputedAccess(sourceText, open) {
  const close = findMatchingBracket(sourceText, open);
  if (close === -1) return { status: 'blocked', reasonCode: 'css-module-dynamic-member-access-unproved', end: open + 1 };
  let index = open + 1;
  while (index < close && /\s/.test(sourceText[index])) index += 1;
  const literal = readStaticMemberLiteral(sourceText, index, close);
  if (!literal || !IdentifierPattern.test(literal.value)) {
    return { status: 'blocked', reasonCode: 'css-module-dynamic-member-access-unproved', end: close + 1, expressionText: sourceText.slice(open, close + 1) };
  }
  return { accessKind: literal.literalKind === 'static-template-literal' ? 'static-template' : 'static-bracket', memberName: literal.value, end: close + 1 };
}

function cssModuleStaticExpressionAccess(expressionText, localName) {
  const value = String(expressionText ?? '').trim();
  if (!value.startsWith(localName)) return undefined;
  if (isIdentifierChar(value[localName.length])) return undefined;
  const access = cssModuleMemberAccess(value, localName.length);
  if (!access || access.status === 'blocked' || access.end !== value.length) return undefined;
  return {
    accessKind: access.accessKind,
    memberName: access.memberName,
    optional: /\?\./.test(value.slice(0, access.end))
  };
}

function cssModuleExpressionHasCall(expressionText) {
  const value = String(expressionText ?? '');
  return /\?\.\s*\(/.test(value) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(value);
}

function cssModuleExpressionHasBlockedAccess(expressionText, localName) {
  const value = String(expressionText ?? '');
  for (const occurrence of identifierOccurrences(value, localName)) {
    const access = cssModuleMemberAccess(value, occurrence.end);
    if (access?.status === 'blocked') return true;
  }
  return false;
}

function identifierOccurrences(sourceText, name) {
  const result = [];
  const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g');
  for (const match of sourceText.matchAll(pattern)) {
    const start = match.index;
    const end = start + name.length;
    if (isIdentifierChar(sourceText[start - 1]) || isIdentifierChar(sourceText[end])) continue;
    result.push({ start, end });
  }
  return result;
}

function findMatchingBracket(sourceText, open) {
  let depth = 0;
  for (let index = open; index < sourceText.length; index += 1) {
    if (sourceText[index] === '[') depth += 1;
    else if (sourceText[index] === ']' && --depth === 0) return index;
  }
  return -1;
}

export {
  cssModuleExpressionHasBlockedAccess,
  cssModuleExpressionHasCall,
  cssModuleMemberAccess,
  cssModuleStaticExpressionAccess,
  identifierOccurrences
};
