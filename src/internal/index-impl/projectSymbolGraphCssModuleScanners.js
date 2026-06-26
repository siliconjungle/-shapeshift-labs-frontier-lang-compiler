import { readStaticMemberLiteral } from './staticMemberLiteral.js';
import {
  bindingsForSourcePath,
  escapeRegExp,
  isIdentifierChar,
  localKey,
  sourceSpanForRange
} from './projectSymbolGraphCssModuleUtils.js';
import {
  cssModuleAccessBlocker,
  cssModulePropBlocker,
  cssModuleUseSiteRecord
} from './projectSymbolGraphCssModuleRecords.js';

const IdentifierPattern = /^[A-Za-z_$][\w$]*$/;

function cssModuleLexicalUseSites(importBindings, sourceTextsByPath) {
  const useSites = [];
  const blockers = [];
  for (const binding of importBindings) {
    if (!binding.localName) continue;
    if (binding.importKind !== 'default' && binding.importKind !== 'namespace') continue;
    const sourceText = sourceTextsByPath.get(binding.sourcePath);
    if (typeof sourceText !== 'string') {
      blockers.push(cssModuleAccessBlocker(binding, '', 0, 0, 'css-module-import-resolution-unproved'));
      continue;
    }
    useSites.push(...cssModuleDestructuringUseSites(binding, sourceText, blockers));
    useSites.push(...cssModuleMemberUseSites(binding, sourceText, blockers));
  }
  return { useSites, blockers };
}

function cssModuleMemberUseSites(binding, sourceText, blockers) {
  const useSites = [];
  for (const occurrence of identifierOccurrences(sourceText, binding.localName)) {
    const access = cssModuleMemberAccess(sourceText, occurrence.end);
    if (!access) continue;
    if (access.status === 'blocked') {
      blockers.push(cssModuleAccessBlocker(binding, sourceText, occurrence.start, access.end ?? occurrence.end, access.reasonCode, access.expressionText));
      continue;
    }
    const writeOperation = memberWriteOperation(sourceText, occurrence.start, access.end);
    if (writeOperation) {
      blockers.push(cssModuleAccessBlocker(binding, sourceText, occurrence.start, access.end, 'css-module-member-write-unsupported', sourceText.slice(occurrence.start, access.end), { writeOperation }));
      continue;
    }
    useSites.push(cssModuleUseSiteRecord(binding, {
      useSiteKind: 'scope-member-read',
      accessKind: access.accessKind,
      exportName: access.memberName,
      receiverLocalName: binding.localName,
      expressionText: sourceText.slice(occurrence.start, access.end),
      sourcePath: binding.sourcePath,
      sourceHash: binding.sourceHash,
      sourceSpan: sourceSpanForRange(sourceText, binding.sourcePath, binding.sourceHash, occurrence.start, access.end)
    }));
  }
  return useSites;
}

function cssModuleDestructuringUseSites(binding, sourceText, blockers) {
  const useSites = [];
  const pattern = new RegExp(`\\b(?:const|let|var)\\s*\\{([\\s\\S]*?)\\}\\s*=\\s*${escapeRegExp(binding.localName)}\\b`, 'g');
  for (const match of sourceText.matchAll(pattern)) {
    const body = match[1] ?? '';
    const bodyStart = match.index + match[0].indexOf(body);
    for (const part of splitTopLevelComma(body, bodyStart)) {
      const text = part.text.trim();
      if (!text) continue;
      if (text.startsWith('...')) {
        blockers.push(cssModuleAccessBlocker(binding, sourceText, part.offset, part.offset + part.text.length, 'css-module-destructuring-rest-unsupported', part.text));
        continue;
      }
      const property = destructuringProperty(text);
      if (!property?.exportName) continue;
      useSites.push(cssModuleUseSiteRecord(binding, {
        useSiteKind: 'destructured-binding',
        accessKind: 'destructure',
        exportName: property.exportName,
        receiverLocalName: binding.localName,
        localReferenceName: property.localName,
        expressionText: text,
        sourcePath: binding.sourcePath,
        sourceHash: binding.sourceHash,
        sourceSpan: sourceSpanForRange(sourceText, binding.sourcePath, binding.sourceHash, part.offset, part.offset + part.text.length)
      }));
    }
  }
  return useSites;
}

function cssModuleJsxUseSites(bindingsByLocal, jsxPropRecords) {
  const useSites = [];
  const blockers = [];
  for (const prop of jsxPropRecords ?? []) {
    const root = prop.propValueReferenceRoot;
    const sourceBindings = root ? bindingsByLocal.get(localKey(prop.sourcePath, root)) ?? [] : [];
    useSites.push(...cssModuleJsxStaticUseSites(sourceBindings, prop));
    const classNameBindings = bindingsForSourcePath(bindingsByLocal, prop.sourcePath);
    if (prop.propName !== 'className' || !classNameBindings.length) continue;
    blockers.push(...cssModuleJsxBlockers(classNameBindings, prop));
  }
  return { useSites, blockers };
}

function cssModuleJsxStaticUseSites(sourceBindings, prop) {
  if (prop.propName !== 'className' || prop.propValueKind !== 'reference') return [];
  const referencePath = prop.propValueReferencePath ?? [];
  if (referencePath.length < 2) return [];
  return sourceBindings.map((binding) => cssModuleUseSiteRecord(binding, {
    useSiteKind: 'jsx-className',
    accessKind: 'dot',
    exportName: referencePath[1],
    receiverLocalName: referencePath[0],
    expressionText: prop.propValueExpressionText,
    sourcePath: prop.sourcePath,
    sourceHash: prop.sourceHash,
    sourceSpan: prop.sourceSpan,
    jsxPropRecordId: prop.id
  }));
}

function cssModuleJsxBlockers(classNameBindings, prop) {
  if (prop.propValueKind === 'string') {
    return classNameBindings.map((binding) => cssModulePropBlocker(binding, prop, 'css-module-string-literal-classname-unproved'));
  }
  if (!prop.propValueDynamicBlockerReasonCode) return [];
  const expressionText = prop.propValueExpressionText ?? prop.propValueDynamicText ?? '';
  return classNameBindings
    .filter((binding) => expressionText.includes(binding.localName))
    .map((binding) => cssModulePropBlocker(binding, prop, jsxDynamicReason(prop.propValueDynamicBlockerReasonCode)));
}

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

function memberWriteOperation(sourceText, start, end) {
  if (hasPrefixUpdateOperator(sourceText, start)) return 'update';
  let index = end;
  while (index < sourceText.length && /\s/.test(sourceText[index])) index += 1;
  if (sourceText.slice(index, index + 2) === '++' || sourceText.slice(index, index + 2) === '--') return 'update';
  return assignmentOperatorAt(sourceText, index) ? 'assignment' : undefined;
}

function assignmentOperatorAt(code, index) {
  for (const operator of ['>>>=', '**=', '<<=', '>>=', '&&=', '||=', '??=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '=']) {
    if (!code.startsWith(operator, index)) continue;
    if (operator === '=' && (code[index + 1] === '=' || code[index + 1] === '>')) return undefined;
    return operator;
  }
  return undefined;
}

function hasPrefixUpdateOperator(code, tokenStart) {
  let index = tokenStart - 1;
  while (index >= 0 && /\s/.test(code[index])) index -= 1;
  const operator = code.slice(index - 1, index + 1);
  if (operator !== '++' && operator !== '--') return false;
  let before = index - 2;
  while (before >= 0 && /\s/.test(code[before])) before -= 1;
  return before < 0 || !/[A-Za-z0-9_$)\]]/.test(code[before]);
}

function findMatchingBracket(sourceText, open) {
  let depth = 0;
  for (let index = open; index < sourceText.length; index += 1) {
    if (sourceText[index] === '[') depth += 1;
    else if (sourceText[index] === ']' && --depth === 0) return index;
  }
  return -1;
}

function destructuringProperty(text) {
  const value = String(text ?? '').trim();
  const [rawName, rawLocal] = value.split(':').map((part) => part.trim());
  const exportName = rawName?.match(/^([A-Za-z_$][\w$]*)$/)?.[1];
  const localName = (rawLocal ?? rawName)?.match(/^([A-Za-z_$][\w$]*)$/)?.[1];
  return exportName ? { exportName, localName } : undefined;
}

function splitTopLevelComma(text, baseOffset) {
  const parts = [];
  let start = 0;
  let brace = 0, bracket = 0, paren = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{') brace += 1;
    else if (char === '}') brace = Math.max(0, brace - 1);
    else if (char === '[') bracket += 1;
    else if (char === ']') bracket = Math.max(0, bracket - 1);
    else if (char === '(') paren += 1;
    else if (char === ')') paren = Math.max(0, paren - 1);
    if (char === ',' && brace === 0 && bracket === 0 && paren === 0) {
      parts.push({ text: text.slice(start, index), offset: baseOffset + start });
      start = index + 1;
    }
  }
  parts.push({ text: text.slice(start), offset: baseOffset + start });
  return parts;
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

function jsxDynamicReason(reasonCode) {
  if (reasonCode.includes('call')) return 'css-module-helper-call-unproved';
  if (reasonCode.includes('computed')) return 'css-module-dynamic-member-access-unproved';
  return 'css-module-helper-dynamic-argument-unsupported';
}

export { cssModuleJsxUseSites, cssModuleLexicalUseSites };
