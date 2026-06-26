import {
  findMatchingParen,
  identifierRegExp,
  namespacesForDeclarationKind,
  nextSignificantCharIndex,
  typeNamespace,
  uniqueBindings,
  valueNamespace
} from './js-ts-semantic-scope-use-def-utils.js';
import {
  findStatementBoundary,
  hasTypeAliasAssignment,
  nextIdentifierToken
} from './js-ts-semantic-scope-use-def-scan.js';

const bindingKeywordKinds = Object.freeze({
  function: 'function',
  class: 'class',
  interface: 'interface',
  type: 'type',
  enum: 'enum',
  namespace: 'namespace',
  module: 'module'
});

function collectBindings(code, tokens, depthAt) {
  const bindings = [];
  collectImportBindings(code, bindings, depthAt);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (bindingKeywordKinds[token.value]) {
      collectDeclarationBinding(code, tokens, index, bindings, depthAt);
      if (token.value === 'function') collectFunctionParameters(code, token, bindings, depthAt);
    } else if (token.value === 'const' || token.value === 'let' || token.value === 'var') {
      collectVariableBindings(code, token, bindings, depthAt);
    } else if (token.value === 'catch') {
      collectCatchBinding(code, token, bindings, depthAt);
    }
  }
  collectArrowFunctionBindings(code, bindings, depthAt);
  return uniqueBindings(bindings);
}

function collectDeclarationBinding(code, tokens, index, bindings, depthAt) {
  const keyword = tokens[index];
  const kind = bindingKeywordKinds[keyword.value];
  const name = nextIdentifierToken(tokens, index + 1);
  if (!name || !identifierRegExp.test(name.value)) return;
  if (kind === 'type' && !hasTypeAliasAssignment(code, name.end)) return;
  bindings.push({
    kind,
    name: name.value,
    start: name.start,
    end: name.end,
    depth: depthAt[name.start] ?? 0,
    namespaces: namespacesForDeclarationKind(kind)
  });
}

function collectFunctionParameters(code, functionToken, bindings, depthAt) {
  const open = code.indexOf('(', functionToken.end);
  if (open === -1) return;
  const close = findMatchingParen(code, open);
  if (close === -1) return;
  const bodyStart = nextSignificantCharIndex(code, close + 1);
  if (bodyStart === -1 || code[bodyStart] !== '{') return;
  collectParameterListBindings(code.slice(open + 1, close), open + 1, bindings, depthAt, 'param');
}

function collectVariableBindings(code, token, bindings, depthAt) {
  const end = findStatementBoundary(code, token.end);
  const text = code.slice(token.end, end);
  const bindingDepth = depthAt[token.start] ?? 0;
  for (const declarator of splitTopLevelComma(text, token.end)) {
    collectVariableDeclaratorBinding(declarator.text, declarator.offset, token.value, bindings, depthAt, bindingDepth);
  }
}

function collectVariableDeclaratorBinding(text, baseOffset, kind, bindings, depthAt, bindingDepth) {
  const assignment = topLevelCharIndex(text, '=');
  const pattern = assignment === -1 ? text : text.slice(0, assignment);
  collectBindingPatternBindings(pattern, baseOffset, kind, bindings, depthAt, bindingDepth);
}

function collectBindingPatternBindings(text, baseOffset, kind, bindings, depthAt, bindingDepth) {
  const start = firstSignificantIndex(text);
  if (start === -1) return;
  if (text.slice(start).startsWith('...')) {
    collectBindingPatternBindings(text.slice(start + 3), baseOffset + start + 3, kind, bindings, depthAt, bindingDepth);
    return;
  }
  const char = text[start];
  if (char === '{') {
    const end = findMatchingDelimiter(text, start, '{', '}');
    if (end !== -1) collectObjectPatternBindings(text.slice(start + 1, end), baseOffset + start + 1, kind, bindings, depthAt, bindingDepth);
    return;
  }
  if (char === '[') {
    const end = findMatchingDelimiter(text, start, '[', ']');
    if (end !== -1) collectArrayPatternBindings(text.slice(start + 1, end), baseOffset + start + 1, kind, bindings, depthAt, bindingDepth);
    return;
  }
  collectIdentifierBinding(text, baseOffset, start, kind, bindings, depthAt, bindingDepth);
}

function collectObjectPatternBindings(text, baseOffset, kind, bindings, depthAt, bindingDepth) {
  for (const property of splitTopLevelComma(text, baseOffset)) {
    const start = firstSignificantIndex(property.text);
    if (start === -1) continue;
    if (property.text.slice(start).startsWith('...')) {
      collectBindingPatternBindings(property.text.slice(start + 3), property.offset + start + 3, kind, bindings, depthAt, bindingDepth);
      continue;
    }
    const colon = topLevelCharIndex(property.text, ':');
    if (colon !== -1) {
      collectBindingPatternBindings(property.text.slice(colon + 1), property.offset + colon + 1, kind, bindings, depthAt, bindingDepth);
      continue;
    }
    collectIdentifierBinding(property.text, property.offset, start, kind, bindings, depthAt, bindingDepth);
  }
}

function collectArrayPatternBindings(text, baseOffset, kind, bindings, depthAt, bindingDepth) {
  for (const element of splitTopLevelComma(text, baseOffset)) {
    const start = firstSignificantIndex(element.text);
    if (start === -1) continue;
    if (element.text.slice(start).startsWith('...')) {
      collectBindingPatternBindings(element.text.slice(start + 3), element.offset + start + 3, kind, bindings, depthAt, bindingDepth);
      continue;
    }
    collectBindingPatternBindings(element.text, element.offset, kind, bindings, depthAt, bindingDepth);
  }
}

function collectIdentifierBinding(text, baseOffset, start, kind, bindings, depthAt, bindingDepth) {
  const match = /^[A-Za-z_$][\w$]*/.exec(text.slice(start));
  if (!match) return;
  const name = match[0];
  const offset = baseOffset + start;
  bindings.push({
    kind,
    name,
    start: offset,
    end: offset + name.length,
    depth: bindingDepth ?? depthAt[offset] ?? 0,
    namespaces: [valueNamespace]
  });
}

function splitTopLevelComma(text, baseOffset) {
  const parts = [];
  let start = 0;
  const depth = { brace: 0, bracket: 0, paren: 0 };
  for (let index = 0; index < text.length; index += 1) {
    updateDelimiterDepth(depth, text[index]);
    if (text[index] === ',' && depth.brace === 0 && depth.bracket === 0 && depth.paren === 0) {
      parts.push({ text: text.slice(start, index), offset: baseOffset + start });
      start = index + 1;
    }
  }
  parts.push({ text: text.slice(start), offset: baseOffset + start });
  return parts;
}

function topLevelCharIndex(text, target) {
  const depth = { brace: 0, bracket: 0, paren: 0 };
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === target && depth.brace === 0 && depth.bracket === 0 && depth.paren === 0) return index;
    updateDelimiterDepth(depth, text[index]);
  }
  return -1;
}

function findMatchingDelimiter(text, open, openChar, closeChar) {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === openChar) depth += 1;
    else if (text[index] === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function updateDelimiterDepth(depth, char) {
  if (char === '{') depth.brace += 1;
  else if (char === '}') depth.brace = Math.max(0, depth.brace - 1);
  else if (char === '[') depth.bracket += 1;
  else if (char === ']') depth.bracket = Math.max(0, depth.bracket - 1);
  else if (char === '(') depth.paren += 1;
  else if (char === ')') depth.paren = Math.max(0, depth.paren - 1);
}

function firstSignificantIndex(text) {
  for (let index = 0; index < text.length; index += 1) {
    if (!/\s/.test(text[index])) return index;
  }
  return -1;
}

function collectCatchBinding(code, token, bindings, depthAt) {
  const open = nextSignificantCharIndex(code, token.end);
  if (open === -1 || code[open] !== '(') return;
  const close = findMatchingParen(code, open);
  if (close === -1) return;
  const text = code.slice(open + 1, close).trim();
  if (!identifierRegExp.test(text)) return;
  const start = code.indexOf(text, open + 1);
  bindings.push({ kind: 'catch', name: text, start, end: start + text.length, depth: (depthAt[start] ?? 0) + 1, namespaces: [valueNamespace] });
}

function collectImportBindings(code, bindings, depthAt) {
  for (const match of code.matchAll(/\bimport\b[\s\S]*?(?:;|$)/g)) {
    const text = match[0];
    if (!/\bfrom\b/.test(text)) continue;
    const typeOnly = /\bimport\s+type\b/.test(text);
    const fromIndex = text.search(/\bfrom\b/);
    const clause = text.slice('import'.length, fromIndex).trim().replace(/^type\b/, '').trim();
    collectImportClauseBindings(clause, match.index + text.indexOf(clause), typeOnly, bindings, depthAt);
  }
}

function collectImportClauseBindings(clause, baseOffset, typeOnly, bindings, depthAt) {
  const namespace = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
  if (namespace) {
    bindings.push(importBinding(namespace[1], baseOffset + namespace.index + namespace[0].lastIndexOf(namespace[1]), typeOnly, depthAt));
    return;
  }
  const namedStart = clause.indexOf('{');
  if (namedStart === -1) {
    const defaultName = clause.replace(/,.*/, '').trim();
    if (identifierRegExp.test(defaultName)) bindings.push(importBinding(defaultName, baseOffset + clause.indexOf(defaultName), typeOnly, depthAt));
    return;
  }
  const beforeNamed = clause.slice(0, namedStart).replace(/,$/, '').trim();
  if (identifierRegExp.test(beforeNamed)) bindings.push(importBinding(beforeNamed, baseOffset + clause.indexOf(beforeNamed), typeOnly, depthAt));
  const namedEnd = clause.indexOf('}', namedStart + 1);
  if (namedEnd === -1) return;
  let offset = baseOffset + namedStart + 1;
  for (const rawPart of clause.slice(namedStart + 1, namedEnd).split(',')) {
    const part = rawPart.trim();
    const clean = part.replace(/^type\s+/, '').trim();
    const local = clean.match(/\bas\s+([A-Za-z_$][\w$]*)$/)?.[1] ?? clean.match(/^([A-Za-z_$][\w$]*)/)?.[1];
    if (local) bindings.push(importBinding(local, offset + rawPart.indexOf(local), typeOnly || part.startsWith('type '), depthAt));
    offset += rawPart.length + 1;
  }
}

function importBinding(name, start, typeOnly, depthAt) {
  return {
    kind: 'import',
    name,
    start,
    end: start + name.length,
    depth: depthAt[start] ?? 0,
    namespaces: typeOnly ? [typeNamespace] : [valueNamespace, typeNamespace]
  };
}

function collectArrowFunctionBindings(code, bindings, depthAt) {
  for (const match of code.matchAll(/\(([^()]*)\)\s*=>/g)) {
    collectParameterListBindings(match[1], match.index + 1, bindings, depthAt, 'param');
  }
  for (const match of code.matchAll(/\b([A-Za-z_$][\w$]*)\s*=>/g)) {
    bindings.push({ kind: 'param', name: match[1], start: match.index, end: match.index + match[1].length, depth: (depthAt[match.index] ?? 0) + 1, namespaces: [valueNamespace] });
  }
}

function collectParameterListBindings(text, baseOffset, bindings, depthAt, kind) {
  for (const parameter of splitTopLevelComma(text, baseOffset)) {
    const pattern = parameterBindingPattern(parameter.text);
    const start = firstSignificantIndex(pattern);
    if (start === -1) continue;
    const bindingDepth = (depthAt[parameter.offset + start] ?? 0) + 1;
    collectBindingPatternBindings(pattern, parameter.offset, kind, bindings, depthAt, bindingDepth);
  }
}

function parameterBindingPattern(text) {
  const typeAnnotation = topLevelCharIndex(text, ':');
  const initializer = topLevelCharIndex(text, '=');
  const end = [typeAnnotation, initializer].filter((index) => index !== -1).sort((left, right) => left - right)[0];
  return end === undefined ? text : text.slice(0, end);
}

export { collectBindings };
