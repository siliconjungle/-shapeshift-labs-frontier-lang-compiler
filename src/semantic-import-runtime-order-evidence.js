import { tryCatchOrderEvidence, tryFinallyOrderEvidence } from './semantic-import-runtime-try-finally-evidence.js';
import { conditionalExpressionEvidenceRecords } from './semantic-import-runtime-conditional-evidence.js';
import { exitCompletionOrderEvidence } from './semantic-import-runtime-exit-evidence.js';
import { controlTransferOrderEvidence, loopIterationOrderEvidence, switchDispatchOrderEvidence } from './semantic-import-runtime-switch-evidence.js';
import { importMetaHostContextEvidence } from './semantic-import-runtime-import-meta-evidence.js';
import { mutationTargetOrderEvidence, mutationTargetSignatureEvidence } from './semantic-import-runtime-mutation-evidence.js';
import { effectTargetOrderEvidence, effectTargetSignatureEvidence } from './semantic-import-runtime-effect-target-evidence.js';
import { reachabilityOrderEvidence } from './semantic-import-runtime-reachability-evidence.js';
import { throwOrderEvidenceRecords } from './semantic-import-runtime-throw-evidence.js';
import { promiseCombinatorEvidenceRecords } from './semantic-import-runtime-promise-combinator-evidence.js';
import { promiseChainEvidenceRecords } from './semantic-import-runtime-promise-chain-evidence.js';
import { dynamicImportEvidenceRecords, dynamicImportSignatureEvidence } from './semantic-import-runtime-dynamic-import-evidence.js';
function semanticFactOrderInfo(groups) {
  const bySubject = new Map();
  const info = new Map();
  for (const group of groups) {
    const fact = group.facts[0];
    const key = [fact?.subjectId, group.sourcePath].join('\0');
    const entries = bySubject.get(key) ?? [];
    const previous = entries[entries.length - 1];
    const entry = {
      runtimeOrderIndex: entries.length + 1,
      previousRegionKind: previous?.regionKind,
      previousRuntimeKind: previous?.runtimeKind,
      previousRuntimeKinds: previous?.runtimeKinds
    };
    info.set(group, entry);
    entries.push({ regionKind: group.regionKind, runtimeKind: group.factKinds?.[0] ?? group.regionKind, runtimeKinds: group.factKinds });
    bySubject.set(key, entries);
  }
  return info;
}
function semanticFactRuntimeOrderEvidence(sourceText, group, fact, spanInfo, orderInfo) {
  const lineNumber = Number(group.line);
  const lines = sourceLines(sourceText);
  const line = lines[lineNumber - 1] ?? '';
  const start = Math.max(0, Number(spanInfo?.span?.startColumn ?? 1) - 1);
  const end = Math.max(start, Number(spanInfo?.span?.endColumn ?? start + 1) - 1);
  const sameLineEvidence = sameLineRuntimeOrderEvidence(line, start, end);
  const enclosingControlFlow = enclosingControlFlowEvidence(lines, lineNumber);
  const controlFlowOrder = controlFlowOrderEvidence(line, lineNumber, group);
  const tryCatchOrder = tryCatchOrderEvidence(lines, lineNumber, enclosingControlFlow);
  const tryFinallyOrder = tryFinallyOrderEvidence(lines, lineNumber, enclosingControlFlow);
  const switchDispatchOrder = switchDispatchOrderEvidence(lines, lineNumber), loopIterationOrder = loopIterationOrderEvidence(lines, lineNumber), controlTransferOrder = controlTransferOrderEvidence(lines, lineNumber), exitOrder = exitCompletionOrderEvidence(lines, lineNumber), reachabilityOrder = reachabilityOrderEvidence(lines, lineNumber), mutationTargetOrder = mutationTargetOrderEvidence(line, lineNumber, group, start, end), effectTargetOrder = effectTargetOrderEvidence(line, lineNumber, group, start, end, lines);
  const evidence = compactRecord({
    schema: 'frontier.lang.runtimeOrderEvidence.v1',
    source: 'lexical-source-scan',
    subjectId: fact?.subjectId,
    runtimeScope: fact?.value?.runtimeScope, topLevelAwait: fact?.value?.topLevelAwait === true || undefined,
    regionKind: group.regionKind,
    runtimeKinds: group.factKinds,
    line: lineNumber,
    runtimeOrderIndex: orderInfo?.runtimeOrderIndex,
    previousRegionKind: orderInfo?.previousRegionKind,
    previousRuntimeKind: orderInfo?.previousRuntimeKind,
    previousRuntimeKinds: orderInfo?.previousRuntimeKinds,
    branchOrder: controlFlowOrder.branch,
    loopOrder: controlFlowOrder.loop,
    sameLineControlFlow: sameLineEvidence.controlFlow,
    sameLineShortCircuit: sameLineEvidence.shortCircuit,
    sameLineAwait: sameLineEvidence.await,
    sameLineAwaitOrder: sameLineEvidence.awaitOrder,
    sameLineOptionalChain: sameLineEvidence.optionalChain,
    sameLineConditionalExpression: sameLineEvidence.conditionalExpression,
    sameLineDynamicImport: sameLineEvidence.dynamicImport,
    sameLinePromiseCombinator: sameLineEvidence.promiseCombinator,
    sameLinePromiseChain: sameLineEvidence.promiseChain,
    sameLineThrow: sameLineEvidence.throw,
    sameLineThrowOrder: sameLineEvidence.throwOrder,
    enclosingControlFlow: enclosingControlFlow.length ? enclosingControlFlow : undefined,
    switchDispatchOrder: switchDispatchOrder.length ? switchDispatchOrder : undefined, loopIterationOrder: loopIterationOrder.length ? loopIterationOrder : undefined, controlTransferOrder: controlTransferOrder.length ? controlTransferOrder : undefined, exitOrder: exitOrder.length ? exitOrder : undefined, reachabilityOrder: reachabilityOrder.length ? reachabilityOrder : undefined,
    mutationTargetOrder: mutationTargetOrder.length ? mutationTargetOrder : undefined, effectTargetOrder: effectTargetOrder.length ? effectTargetOrder : undefined,
    tryCatchOrder: tryCatchOrder.length ? tryCatchOrder : undefined,
    tryFinallyOrder: tryFinallyOrder.length ? tryFinallyOrder : undefined
  });
  return importMetaHostContextEvidence(String(line).slice(start, end), evidence);
}
function semanticFactRuntimeOrderSignatureEvidence(evidence) {
  return compactRecord({
    previousRegionKind: evidence?.previousRegionKind,
    previousRuntimeKind: evidence?.previousRuntimeKind,
    previousRuntimeKinds: evidence?.previousRuntimeKinds,
    branchOrder: evidence?.branchOrder,
    loopOrder: evidence?.loopOrder,
    sameLineShortCircuit: evidence?.sameLineShortCircuit,
    sameLineAwait: evidence?.sameLineAwait,
    sameLineAwaitOrder: evidence?.sameLineAwaitOrder,
    sameLineOptionalChain: evidence?.sameLineOptionalChain,
    sameLineConditionalExpression: evidence?.sameLineConditionalExpression,
    sameLineDynamicImport: evidence?.sameLineDynamicImport?.map(dynamicImportSignatureEvidence),
    sameLinePromiseCombinator: evidence?.sameLinePromiseCombinator,
    sameLinePromiseChain: evidence?.sameLinePromiseChain,
    sameLineThrow: evidence?.sameLineThrow,
    sameLineThrowOrder: evidence?.sameLineThrowOrder,
    hostContext: evidence?.hostContext, importMetaHostContext: evidence?.importMetaHostContext, importMetaMemberNames: evidence?.importMetaMemberNames,
    switchDispatchOrder: evidence?.switchDispatchOrder, loopIterationOrder: evidence?.loopIterationOrder, controlTransferOrder: evidence?.controlTransferOrder, exitOrder: evidence?.exitOrder?.map(({ line: _line, ...record }) => record), reachabilityOrder: evidence?.reachabilityOrder?.map(({ completionLine: _completionLine, targetLine: _targetLine, ...record }) => record),
    mutationTargetOrder: evidence?.mutationTargetOrder?.map(mutationTargetSignatureEvidence), effectTargetOrder: evidence?.effectTargetOrder?.map(effectTargetSignatureEvidence),
    tryCatchOrder: evidence?.tryCatchOrder,
    tryFinallyOrder: evidence?.tryFinallyOrder
  });
}
function sameLineRuntimeOrderEvidence(line, start, end) {
  const prefix = String(line ?? '').slice(0, start);
  const controlFlow = controlHeadEvidenceRecords(prefix), shortCircuit = shortCircuitEvidenceRecords(prefix), awaitOrder = awaitOrderEvidenceRecords(prefix);
  const optionalChain = optionalChainEvidenceRecords(line, start, end), conditionalExpression = conditionalExpressionEvidenceRecords(line, start, end);
  const dynamicImport = dynamicImportEvidenceRecords(line, start, end), promiseCombinator = promiseCombinatorEvidenceRecords(line, start, end), promiseChain = promiseChainEvidenceRecords(line, start, end), throwOrder = throwOrderEvidenceRecords(line, start, end);
  return {
    controlFlow: controlFlow.length ? controlFlow : undefined,
    shortCircuit: shortCircuit.length ? shortCircuit : undefined,
    await: awaitOrder.length ? true : undefined,
    awaitOrder: awaitOrder.length ? awaitOrder : undefined,
    optionalChain: optionalChain.length ? optionalChain : undefined,
    conditionalExpression: conditionalExpression.length ? conditionalExpression : undefined,
    dynamicImport: dynamicImport.length ? dynamicImport : undefined,
    promiseCombinator: promiseCombinator.length ? promiseCombinator : undefined,
    promiseChain: promiseChain.length ? promiseChain : undefined,
    throw: throwOrder.length ? true : /\bthrow\b/.test(prefix) || undefined,
    throwOrder: throwOrder.length ? throwOrder : undefined
  };
}
function controlFlowOrderEvidence(line, lineNumber, group) {
  if (group?.regionKind !== 'controlFlow') return {};
  const kinds = new Set(group.factKinds ?? []);
  const records = controlHeadEvidenceRecords(line)
    .filter((record) => (record.kind === 'branch' && kinds.has('branch'))
      || (record.kind === 'loop' && kinds.has('loop')))
    .map((record) => compactRecord({ ...record, line: lineNumber }));
  return {
    branch: records.filter((record) => record.kind === 'branch'),
    loop: records.filter((record) => record.kind === 'loop')
  };
}
function optionalChainEvidenceRecords(line, start, end) {
  const expression = String(line ?? '').slice(Math.max(0, start), Math.max(start, end));
  const matches = [...expression.matchAll(/\?\.(?:\s*\(|\s*[A-Za-z_$][\w$]*|\s*\[)/g)];
  return matches.map((match, index) => compactRecord({
    kind: match[0].includes('(') ? 'optional-call' : 'optional-chain',
    ordinal: index + 1,
    text: normalizeOrderEvidenceText(expression.slice(Math.max(0, match.index - 24), match.index + match[0].length + 24))
  }));
}
function awaitOrderEvidenceRecords(prefix) {
  const text = String(prefix ?? '');
  const tokens = awaitTokenIndexes(text);
  if (!tokens.length) return [];
  const start = statementStartBefore(text, tokens[tokens.length - 1]);
  return tokens.filter((index) => index >= start).slice(-3)
    .map((index, ordinal, items) => compactRecord({ kind: 'await', ordinal: ordinal + 1, text: normalizeOrderEvidenceText(text.slice(index, items[ordinal + 1] ?? text.length)) }))
    .filter((record) => record.text);
}

function awaitTokenIndexes(text) {
  const indexes = [];
  let quote;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (text.slice(index, index + 5) === 'await' && !isIdentifierPart(text[index - 1]) && !isIdentifierPart(text[index + 5])) indexes.push(index);
  }
  return indexes;
}
function shortCircuitEvidenceRecords(prefix) {
  const text = String(prefix ?? '');
  const operators = shortCircuitOperators(text);
  if (!operators.length) return [];
  const last = operators[operators.length - 1];
  const start = statementStartBefore(text, last.index);
  const statementOperators = operators.filter((operator) => operator.index >= start).map((operator) => operator.operator);
  const guardText = normalizeShortCircuitGuardText(text.slice(start));
  return guardText ? [{ kind: 'short-circuit', operators: uniqueStrings(statementOperators), guardText }] : [];
}

function shortCircuitOperators(text) {
  const operators = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') parenDepth += 1;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    if (parenDepth || bracketDepth) continue;
    const pair = `${char}${next}`;
    if (pair === '&&' || pair === '||' || pair === '??') {
      operators.push({ operator: text[index + 2] === '=' ? `${pair}=` : pair, index });
      index += 1;
    }
  }
  return operators;
}

function statementStartBefore(text, endIndex) {
  for (let index = endIndex - 1; index >= 0; index -= 1) {
    if (text[index] === ';' || text[index] === '{' || text[index] === '}' || text[index] === '\n' || text[index] === '\r') return index + 1;
  }
  return 0;
}

function normalizeShortCircuitGuardText(value) {
  return normalizeOrderEvidenceText(String(value ?? '')
    .replace(/\s*(?:&&|\|\||\?\?)=?\s*$/, '')
    .replace(/^(?:return|throw|yield|await)\s+/, ''));
}

function enclosingControlFlowEvidence(lines, lineNumber) {
  if (!Array.isArray(lines) || lineNumber <= 1) return [];
  const stack = [];
  let depth = 0;
  for (let index = 0; index < lineNumber - 1; index += 1) {
    const line = lines[index] ?? '';
    const leadingClose = leadingCloseBraceCount(line);
    if (leadingClose) {
      depth = Math.max(0, depth - leadingClose);
      while (stack.length && stack[stack.length - 1].depth > depth) stack.pop();
    }
    const heads = controlHeadEvidenceRecords(line);
    const opens = openBraceCount(line);
    const closes = closeBraceCount(line) - leadingClose;
    if (heads.length && opens > 0) {
      stack.push({ line: index + 1, depth: depth + 1, kind: heads[heads.length - 1].kind, text: heads[heads.length - 1].text });
    }
    depth = Math.max(0, depth + opens - Math.max(0, closes));
    while (stack.length && stack[stack.length - 1].depth > depth) stack.pop();
  }
  return stack.slice(-3).map(({ depth: _depth, ...entry }) => entry);
}

function controlHeadEvidenceRecords(line) {
  const text = String(line ?? '');
  const records = [];
  const branch = parenthesizedControlHead(text, /\b(?:else\s+)?if\b/g, 'branch') ?? parenthesizedControlHead(text, /\bswitch\b/g, 'branch') ?? caseControlHead(text) ?? keywordControlHead(text, /\belse\b/g, 'branch');
  const loop = parenthesizedControlHead(text, /\bfor\b/g, 'loop') ?? parenthesizedControlHead(text, /\bwhile\b/g, 'loop') ?? keywordControlHead(text, /\bdo\b/g, 'loop');
  const exception = parenthesizedControlHead(text, /\bcatch\b/g, 'exception') ?? keywordControlHead(text, /\b(?:try|finally)\b/g, 'exception');
  for (const record of [branch, loop, exception].filter(Boolean)) records.push(record);
  return records;
}

function parenthesizedControlHead(line, pattern, kind) {
  for (const match of line.matchAll(pattern)) {
    const open = line.indexOf('(', match.index);
    const close = matchingParenIndex(line, open);
    if (open >= 0 && close !== undefined) return { kind, text: normalizeOrderEvidenceText(line.slice(match.index, close + 1)) };
  }
  return undefined;
}
function keywordControlHead(line, pattern, kind) { const match = pattern.exec(line); return match ? { kind, text: normalizeOrderEvidenceText(match[0]) } : undefined; }
function caseControlHead(line) {
  const match = /\b(?:case|default)\b/.exec(line);
  if (!match) return undefined;
  const colon = line.indexOf(':', match.index);
  return { kind: 'branch', text: normalizeOrderEvidenceText(line.slice(match.index, colon === -1 ? statementEnd(line, match.index) : colon + 1)) };
}

function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function uniqueStrings(values) { return [...new Set((values ?? []).filter(Boolean).map(String))]; }
function sourceLines(sourceText) { return typeof sourceText === 'string' ? sourceText.split(/\r\n|\n|\r/) : []; }
function leadingCloseBraceCount(line) { const match = String(line ?? '').match(/^\s*}+/); return match ? match[0].replace(/\s/g, '').length : 0; }
function openBraceCount(line) { return countCharsOutsideStrings(line, '{'); }
function closeBraceCount(line) { return countCharsOutsideStrings(line, '}'); }
function isIdentifierPart(char) { return /[A-Za-z0-9_$]/.test(char ?? ''); }
function countCharsOutsideStrings(line, target) {
  let count = 0;
  let quote;
  let escaped = false;
  for (const char of String(line ?? '')) {
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (char === target) count += 1;
  }
  return count;
}
function statementEnd(line, start) { const semicolon = line.indexOf(';', start); return semicolon === -1 ? line.length : semicolon + 1; }
function matchingParenIndex(line, open) {
  if (open < 0) return undefined;
  let depth = 0;
  let quote;
  let escaped = false;
  for (let index = open; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') { quote = char; continue; }
    if (char === '(') depth += 1;
    else if (char === ')' && --depth === 0) return index;
  }
  return undefined;
}
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
export { semanticFactOrderInfo, semanticFactRuntimeOrderEvidence, semanticFactRuntimeOrderSignatureEvidence };
