import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord, localKey } from './projectSymbolGraphCssModuleUtils.js';
import { cssModuleMemberAccess, identifierOccurrences } from './projectSymbolGraphCssModuleMemberAccess.js';

const KnownClassHelperModules = new Set(['clsx', 'classnames']);
const LocalClassHelperNames = new Set(['cx', 'cn', 'clsx', 'classnames', 'classNames']);

function cssModuleClassHelperCalleeEvidence(importEdges = []) {
  const result = new Map();
  for (const edge of importEdges ?? []) {
    if (!edge?.sourcePath || !edge.localName || !KnownClassHelperModules.has(edge.moduleSpecifier)) continue;
    if (String(edge.importKind ?? '').startsWith('type')) continue;
    result.set(localKey(edge.sourcePath, edge.localName), compactRecord({
      helperCalleeName: edge.localName,
      helperCalleeRoot: edge.localName,
      helperCalleeSource: 'known-package-import',
      helperModuleSpecifier: edge.moduleSpecifier,
      helperImportKind: edge.importKind,
      helperImportedName: edge.importedName,
      helperImportEdgeId: edge.id
    }));
  }
  return result;
}

function cssModuleClassHelperCallProof(expressionText, binding, prop, helperCalleeEvidence) {
  const call = readTopLevelClassHelperCall(expressionText);
  if (!call) return undefined;
  const calleeEvidence = helperCalleeEvidence.get(localKey(prop.sourcePath, call.calleeRoot))
    ?? localClassHelperCalleeEvidence(call);
  if (!calleeEvidence) return undefined;
  if (classHelperCallHasUnsafeSyntax(expressionText, call.open)) return undefined;
  const accessRecords = cssModuleHelperAccessRecords(expressionText, binding);
  if (!accessRecords.length) return undefined;
  const helperCallGraphHash = hashSemanticValue({
    kind: 'frontier.lang.cssModuleClassNameHelperCallGraph.v1',
    proofLevel: 'css-module-class-helper-source-bounded-token-graph',
    sourcePath: prop.sourcePath,
    sourceHash: prop.sourceHash,
    cssModuleImportBindingId: binding.id,
    cssModuleSourcePath: binding.cssModuleSourcePath,
    cssModuleHash: binding.cssModuleHash,
    jsxPropRecordId: prop.id,
    helperCalleeName: call.calleeText,
    helperCalleeRoot: call.calleeRoot,
    helperCalleeSource: calleeEvidence.helperCalleeSource,
    helperModuleSpecifier: calleeEvidence.helperModuleSpecifier,
    expressionText,
    accessRecords
  });
  return compactRecord({
    proofLevel: 'css-module-class-helper-source-bounded-token-graph',
    helperCallGraphHash,
    helperCalleeName: call.calleeText,
    helperCalleeRoot: call.calleeRoot,
    helperCalleeSource: calleeEvidence.helperCalleeSource,
    helperModuleSpecifier: calleeEvidence.helperModuleSpecifier,
    helperImportEdgeId: calleeEvidence.helperImportEdgeId
  });
}

function cssModuleHelperArgumentIsConditional(expressionText, occurrenceStart) {
  const prefix = expressionText.slice(0, occurrenceStart);
  const suffix = expressionText.slice(occurrenceStart);
  const lastComma = prefix.lastIndexOf(',');
  const argumentPrefix = prefix.slice(lastComma + 1);
  const nextComma = suffix.indexOf(',');
  const argumentText = `${argumentPrefix}${nextComma === -1 ? suffix : suffix.slice(0, nextComma)}`;
  return /(?:&&|\|\||\?)/.test(argumentText);
}

function cssModuleMemberWriteOperation(sourceText, start, end) {
  if (hasPrefixUpdateOperator(sourceText, start)) return 'update';
  let index = end;
  while (index < sourceText.length && /\s/.test(sourceText[index])) index += 1;
  if (sourceText.slice(index, index + 2) === '++' || sourceText.slice(index, index + 2) === '--') return 'update';
  return assignmentOperatorAt(sourceText, index) ? 'assignment' : undefined;
}

function localClassHelperCalleeEvidence(call) {
  return LocalClassHelperNames.has(call.calleeRoot)
    ? { helperCalleeName: call.calleeText, helperCalleeRoot: call.calleeRoot, helperCalleeSource: 'local-name-convention' }
    : undefined;
}

function cssModuleHelperAccessRecords(expressionText, binding) {
  const records = [];
  for (const occurrence of identifierOccurrences(expressionText, binding.localName)) {
    const access = cssModuleMemberAccess(expressionText, occurrence.end);
    if (!access || access.status === 'blocked') return [];
    if (cssModuleMemberWriteOperation(expressionText, occurrence.start, access.end)) return [];
    records.push({
      receiverLocalName: binding.localName,
      exportName: access.memberName,
      accessKind: access.accessKind,
      expressionText: expressionText.slice(occurrence.start, access.end),
      start: occurrence.start,
      end: access.end,
      conditionalRuntimePresence: cssModuleHelperArgumentIsConditional(expressionText, occurrence.start) || undefined
    });
  }
  return records;
}

function readTopLevelClassHelperCall(expressionText) {
  const value = String(expressionText ?? '').trim();
  const callee = /^(?:[A-Za-z_$][\w$]*|this)(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*/.exec(value)?.[0];
  if (!callee) return undefined;
  let index = callee.length;
  while (index < value.length && /\s/.test(value[index])) index += 1;
  if (value[index] !== '(') return undefined;
  const close = findMatchingDelimiter(value, index, '(', ')');
  if (close === -1) return undefined;
  let tail = close + 1;
  while (tail < value.length && /\s/.test(value[tail])) tail += 1;
  if (tail !== value.length) return undefined;
  const calleeText = callee.replace(/\s+/g, '');
  return { calleeText, calleeRoot: calleeText.split(/[?.]+/)[0], open: index };
}

function classHelperCallHasUnsafeSyntax(expressionText, topLevelOpen) {
  const value = String(expressionText ?? '');
  if (value.includes('...') || value.includes('=>') || /\b(?:function|class|new|await|yield)\b/.test(value)) return true;
  if (/`[\s\S]*\$\{[\s\S]*`/.test(value)) return true;
  if (/(?:\+\+|--|\*\*=|>>>=|<<=|>>=|&&=|\|\|=|\?\?=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=)/.test(value)) return true;
  if (/(^|[^=!<>])=(?!=|>)/.test(value)) return true;
  for (const callOpen of callOpenIndexes(value)) if (callOpen !== topLevelOpen) return true;
  return !delimitersAreBalanced(value);
}

function callOpenIndexes(sourceText) {
  const indexes = [];
  for (let index = 0; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (char === '\'' || char === '"' || char === '`') {
      const end = readQuotedOrStaticTemplateEnd(sourceText, index, char);
      if (end === -1) return [...indexes, -1];
      index = end;
      continue;
    }
    if (char !== '(') continue;
    let before = index - 1;
    while (before >= 0 && /\s/.test(sourceText[before])) before -= 1;
    if (before >= 0 && /[A-Za-z0-9_$\].]/.test(sourceText[before])) indexes.push(index);
  }
  return indexes;
}

function delimitersAreBalanced(sourceText) {
  const stack = [];
  const pairs = { '(': ')', '[': ']', '{': '}' };
  for (let index = 0; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (char === '\'' || char === '"' || char === '`') {
      const end = readQuotedOrStaticTemplateEnd(sourceText, index, char);
      if (end === -1) return false;
      index = end;
      continue;
    }
    if (pairs[char]) stack.push(pairs[char]);
    else if ((char === ')' || char === ']' || char === '}') && stack.pop() !== char) return false;
  }
  return stack.length === 0;
}

function findMatchingDelimiter(sourceText, open, openChar, closeChar) {
  let depth = 0;
  for (let index = open; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (char === '\'' || char === '"' || char === '`') {
      const end = readQuotedOrStaticTemplateEnd(sourceText, index, char);
      if (end === -1) return -1;
      index = end;
      continue;
    }
    if (char === openChar) depth += 1;
    else if (char === closeChar && --depth === 0) return index;
  }
  return -1;
}

function readQuotedOrStaticTemplateEnd(sourceText, start, quote) {
  for (let index = start + 1; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (quote === '`' && char === '$' && sourceText[index + 1] === '{') return -1;
    if (char === quote) return index;
  }
  return -1;
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

export {
  cssModuleClassHelperCalleeEvidence,
  cssModuleClassHelperCallProof,
  cssModuleHelperArgumentIsConditional,
  cssModuleMemberWriteOperation
};
