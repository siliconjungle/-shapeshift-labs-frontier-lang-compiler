import { readStaticMemberLiteral } from './staticMemberLiteral.js';
import { escapeRegExp, isIdentifierChar } from './projectSymbolGraphCssModuleUtils.js';

const IdentifierPattern = /^[A-Za-z_$][\w$]*$/;

function cssModuleMemberAccess(sourceText, receiverEnd, options = {}) {
  let index = receiverEnd;
  while (index < sourceText.length && /\s/.test(sourceText[index])) index += 1;
  if (sourceText[index] === '?' && sourceText[index + 1] === '.') index += 2;
  else if (sourceText[index] === '.') index += 1;
  else if (sourceText[index] === '[') return cssModuleComputedAccess(sourceText, index, options);
  else return undefined;
  while (index < sourceText.length && /\s/.test(sourceText[index])) index += 1;
  const match = /^[A-Za-z_$][\w$]*/.exec(sourceText.slice(index));
  return match ? { accessKind: 'dot', memberName: match[0], end: index + match[0].length } : undefined;
}

function cssModuleComputedAccess(sourceText, open, options = {}) {
  const close = findMatchingBracket(sourceText, open);
  if (close === -1) return { status: 'blocked', reasonCode: 'css-module-dynamic-member-access-unproved', end: open + 1 };
  let index = open + 1;
  while (index < close && /\s/.test(sourceText[index])) index += 1;
  const literal = readStaticMemberLiteral(sourceText, index, close);
  if (!literal || !IdentifierPattern.test(literal.value)) {
    const bounded = boundedDynamicMemberAccess(sourceText, open, close, options);
    if (bounded) return bounded;
    return { status: 'blocked', reasonCode: 'css-module-dynamic-member-access-unproved', end: close + 1, expressionText: sourceText.slice(open, close + 1) };
  }
  return { accessKind: literal.literalKind === 'static-template-literal' ? 'static-template' : 'static-bracket', memberName: literal.value, end: close + 1 };
}

function cssModuleStaticExpressionAccess(expressionText, localName) {
  const value = String(expressionText ?? '').trim();
  if (!value.startsWith(localName)) return undefined;
  if (isIdentifierChar(value[localName.length])) return undefined;
  const access = cssModuleMemberAccess(value, localName.length);
  if (!access || access.status === 'blocked' || access.memberNames || access.end !== value.length) return undefined;
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

function cssModuleExpressionHasBlockedAccess(expressionText, localName, options = {}) {
  const value = String(expressionText ?? '');
  for (const occurrence of identifierOccurrences(value, localName)) {
    const access = cssModuleMemberAccess(value, occurrence.end, options);
    if (access?.status === 'blocked') return true;
  }
  return false;
}

function boundedDynamicMemberAccess(sourceText, open, close, options = {}) {
  const expressionText = sourceText.slice(open + 1, close).trim();
  const contextSourceText = options.contextSourceText ?? sourceText;
  const contextExpressionStart = Number.isInteger(options.contextExpressionStart)
    ? options.contextExpressionStart + open + 1
    : open + 1;
  const domain = finiteStringDomainForExpression(contextSourceText, expressionText, contextExpressionStart);
  if (!domain.length) return undefined;
  return {
    accessKind: 'bounded-dynamic-bracket',
    memberNames: domain,
    memberName: domain[0],
    end: close + 1,
    dynamicKeyExpressionText: expressionText,
    dynamicKeyDomain: domain,
    dynamicKeyProofLevel: 'css-module-source-bound-finite-dynamic-key-domain',
    dynamicKeyProofSource: domain.source ?? 'source-text'
  };
}

function finiteStringDomainForExpression(sourceText, expressionText, expressionStart) {
  const value = String(expressionText ?? '').trim();
  return finiteDomainFromInlineConditional(value)
    ?? finiteDomainFromIdentifier(sourceText, value, expressionStart)
    ?? finiteDomainFromDottedProperty(sourceText, value, expressionStart)
    ?? [];
}

function finiteDomainFromInlineConditional(expressionText) {
  const match = /^[\s\S]+?\?\s*(['"`])((?:\\.|(?!\1).)*)\1\s*:\s*(['"`])((?:\\.|(?!\3).)*)\3\s*$/.exec(expressionText);
  if (!match) return undefined;
  if ((match[1] === '`' && /\$\{/.test(match[2])) || (match[3] === '`' && /\$\{/.test(match[4]))) return undefined;
  const domain = uniqueIdentifierStrings([unescapeLiteralText(match[2]), unescapeLiteralText(match[4])]);
  return domain.length === 2 ? withSource(domain, 'inline-conditional-literals') : undefined;
}

function finiteDomainFromIdentifier(sourceText, identifier, expressionStart) {
  if (!IdentifierPattern.test(identifier)) return undefined;
  const declaration = nearestTypedDeclaration(sourceText, identifier, expressionStart);
  if (!declaration) return undefined;
  const aliasDomains = typeAliasDomains(sourceText, expressionStart);
  return domainFromTypeText(declaration.typeText, aliasDomains, 'local-type-annotation');
}

function finiteDomainFromDottedProperty(sourceText, expressionText, expressionStart) {
  const match = /^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/.exec(expressionText);
  if (!match) return undefined;
  const [, objectName, propertyName] = match;
  const domain = nearestConstObjectPropertyDomain(sourceText, objectName, propertyName, expressionStart)
    ?? nearestObjectPropertyDomain(sourceText, objectName, propertyName, expressionStart);
  return domain?.length ? withSource(domain, domain.source ?? 'object-property-type-annotation') : undefined;
}

function nearestTypedDeclaration(sourceText, identifier, expressionStart) {
  const pattern = new RegExp(`\\b(?:const|let|var)\\s+${escapeRegExp(identifier)}\\s*:\\s*([^=;]+?)\\s*=`, 'g');
  let selected;
  for (const match of sourceText.matchAll(pattern)) {
    if (match.index > expressionStart) break;
    selected = { typeText: match[1], index: match.index };
  }
  return selected;
}

function nearestObjectPropertyDomain(sourceText, objectName, propertyName, expressionStart) {
  const aliasDomains = typeAliasDomains(sourceText, expressionStart);
  const objectPattern = new RegExp(`\\b${escapeRegExp(objectName)}\\s*:\\s*\\{([\\s\\S]*?)\\}`, 'g');
  let selected;
  for (const match of sourceText.matchAll(objectPattern)) {
    if (match.index > expressionStart) break;
    const property = propertyTypeText(match[1], propertyName);
    if (property) selected = domainFromTypeText(property, aliasDomains, 'object-property-type-annotation');
  }
  return selected;
}

function nearestConstObjectPropertyDomain(sourceText, objectName, propertyName, expressionStart) {
  const pattern = new RegExp(`\\bconst\\s+${escapeRegExp(objectName)}\\s*=\\s*([^;]+);`, 'g');
  let selected;
  for (const match of sourceText.matchAll(pattern)) {
    if (match.index > expressionStart) break;
    const domain = objectLiteralPropertyDomain(match[1], propertyName);
    if (domain.length && !hasAssignmentBetween(sourceText, objectName, match.index + match[0].length, expressionStart)) selected = domain;
  }
  return selected?.length ? withSource(selected, 'local-const-object-literal-domain') : undefined;
}

function objectLiteralPropertyDomain(initializerText, propertyName) {
  const values = [];
  const pattern = new RegExp(`\\{[^{}]*\\b${escapeRegExp(propertyName)}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1[^{}]*\\}`, 'g');
  for (const match of String(initializerText ?? '').matchAll(pattern)) {
    if (match[1] === '`' && /\$\{/.test(match[2])) return [];
    values.push(unescapeLiteralText(match[2]));
  }
  if (!values.length) return [];
  return uniqueIdentifierStrings(values);
}

function hasAssignmentBetween(sourceText, identifier, start, end) {
  const pattern = new RegExp(`\\b${escapeRegExp(identifier)}\\s*=`, 'g');
  pattern.lastIndex = start;
  const match = pattern.exec(sourceText);
  return Boolean(match && match.index < end);
}

function propertyTypeText(objectTypeText, propertyName) {
  const propertyPattern = new RegExp(`\\b${escapeRegExp(propertyName)}\\s*:\\s*([^;,}\\n]+(?:\\s*\\|\\s*[^;,}\\n]+)*)`);
  return propertyPattern.exec(objectTypeText)?.[1];
}

function typeAliasDomains(sourceText, beforeOffset) {
  const aliases = new Map();
  const pattern = /\btype\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+);/g;
  for (const match of sourceText.matchAll(pattern)) {
    if (match.index > beforeOffset) break;
    const domain = literalUnionDomain(match[2]);
    if (domain.length) aliases.set(match[1], domain);
  }
  return aliases;
}

function domainFromTypeText(typeText, aliases, source) {
  const direct = literalUnionDomain(typeText);
  if (direct.length) return withSource(direct, source);
  const aliasName = String(typeText ?? '').trim();
  const alias = IdentifierPattern.test(aliasName) ? aliases.get(aliasName) : undefined;
  return alias?.length ? withSource(alias, `${source}:type-alias`) : undefined;
}

const StringLiteralPattern = /(['"`])((?:\\.|(?!\1).)*)\1/g;

function literalUnionDomain(typeText) {
  const literals = stringLiteralsInText(typeText);
  if (!literals.length) return [];
  const remainder = String(typeText ?? '').replace(StringLiteralPattern, '').replace(/[|()\s]/g, '');
  if (remainder) return [];
  return uniqueIdentifierStrings(literals.map((literal) => literal.value));
}

function stringLiteralsInText(text) {
  const result = [];
  for (const match of String(text ?? '').matchAll(StringLiteralPattern)) {
    if (match[1] === '`' && /\$\{/.test(match[2])) return [];
    result.push({ value: unescapeLiteralText(match[2]) });
  }
  return result;
}

function unescapeLiteralText(text) {
  return String(text ?? '').replace(/\\(['"`\\])/g, '$1');
}

function uniqueIdentifierStrings(values) {
  const result = [...new Set(values.filter((value) => IdentifierPattern.test(value)))].sort();
  return result.length === values.length ? result : [];
}

function withSource(values, source) {
  return Object.assign([...values], { source });
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
