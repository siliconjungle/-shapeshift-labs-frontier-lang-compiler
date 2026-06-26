import { uniqueStrings } from './js-ts-safe-merge-context.js';

function analyzeJsTsBindingPattern(patternText, patternKind) {
  const reasonCodes = [];
  const inner = patternText.slice(1, -1);
  if (patternKind === 'array') reasonCodes.push('binding-pattern-array-order-blocked');
  if (containsJsTsCodeToken(patternText, '...')) reasonCodes.push('binding-pattern-rest-spread-blocked');
  if (containsJsTsCodeToken(patternText, '=')) reasonCodes.push('binding-pattern-default-initializer-blocked');
  if (patternKind === 'object' && containsJsTsCodeToken(patternText, ':')) reasonCodes.push('binding-pattern-rename-blocked');
  const entries = splitJsTsTopLevelCommaText(inner).filter((part) => part.trim());
  const bindingNames = patternKind === 'object' && reasonCodes.length === 0
    ? entries.map((part) => simpleIdentifier(part.trim())).filter(Boolean)
    : [];
  if (patternKind === 'object' && reasonCodes.length === 0 && bindingNames.length !== entries.length) {
    reasonCodes.push('binding-pattern-unsupported-shape-blocked');
  }
  if (patternKind === 'object' && reasonCodes.length === 0 && bindingNames.length === 0) {
    reasonCodes.push('binding-pattern-empty-object-blocked');
  }
  return {
    patternKind,
    bindingNames,
    reasonCodes: uniqueStrings([
      ...reasonCodes,
      ...(reasonCodes.length ? ['binding-pattern-merge-requires-binding-use-evidence'] : [])
    ])
  };
}

function jsTsFunctionParameterBindingPatternReasonCodes(baseText, workerText) {
  const baseParameters = functionParameterText(baseText);
  const workerParameters = functionParameterText(workerText);
  if (baseParameters === undefined || workerParameters === undefined) return [];
  if (sameParameterText(baseParameters, workerParameters)) return [];
  const base = bindingPatternParameterAnalysis(baseParameters);
  const worker = bindingPatternParameterAnalysis(workerParameters);
  if (!base.hasBindingPattern && !worker.hasBindingPattern) return [];
  return uniqueStrings([
    ...base.reasonCodes,
    ...worker.reasonCodes,
    'binding-pattern-parameter-merge-requires-binding-use-evidence'
  ]);
}

function bindingPatternParameterAnalysis(parameters) {
  const reasonCodes = [];
  let hasBindingPattern = false;
  for (const parameter of splitJsTsTopLevelCommaText(parameters).map((part) => part.trim()).filter(Boolean)) {
    const text = parameter.startsWith('...') ? parameter.slice(3).trim() : parameter;
    if (parameter.startsWith('...')) reasonCodes.push('binding-pattern-rest-spread-blocked');
    if (!text.startsWith('{') && !text.startsWith('[')) continue;
    hasBindingPattern = true;
    const patternKind = text[0] === '{' ? 'object' : 'array';
    const patternText = leadingJsTsBindingPatternText(text, patternKind);
    if (!patternText) {
      reasonCodes.push('binding-pattern-unsupported-shape-blocked');
      continue;
    }
    reasonCodes.push(...analyzeJsTsBindingPattern(patternText, patternKind).reasonCodes);
  }
  return { hasBindingPattern, reasonCodes: uniqueStrings(reasonCodes) };
}

function leadingJsTsBindingPatternText(text, patternKind) {
  const open = patternKind === 'object' ? '{' : '[';
  const close = patternKind === 'object' ? '}' : ']';
  if (text[0] !== open) return undefined;
  const end = matchingJsTsBracketEnd(text, 0, open, close);
  return end === undefined ? undefined : text.slice(0, end + 1);
}

function matchingJsTsBracketEnd(text, start, open, close) {
  let state = 'code';
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    const step = scanStep(text, index, state);
    state = step.state;
    if (step.skipTo !== undefined) {
      index = step.skipTo;
      continue;
    }
    if (state !== 'code') continue;
    const char = text[index];
    if (char === open || char === '{' || char === '[') depth += 1;
    else if (char === close || char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) return index;
    }
    if (depth < 0) return undefined;
  }
  return undefined;
}

function functionParameterText(text) {
  const source = String(text ?? '');
  const open = source.indexOf('(');
  if (open < 0) return undefined;
  const end = matchingJsTsBracketEnd(source, open, '(', ')');
  return end === undefined ? undefined : source.slice(open + 1, end);
}

function splitJsTsTopLevelCommaText(text) {
  const parts = [];
  let start = 0;
  let state = 'code';
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const step = scanStep(text, index, state);
    state = step.state;
    if (step.skipTo !== undefined) {
      index = step.skipTo;
      continue;
    }
    if (state !== 'code') continue;
    const char = text[index];
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    else if (char === ',' && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function containsJsTsCodeToken(text, token) {
  let state = 'code';
  for (let index = 0; index < text.length; index += 1) {
    const step = scanStep(text, index, state);
    state = step.state;
    if (step.skipTo !== undefined) {
      index = step.skipTo;
      continue;
    }
    if (state === 'code' && text.startsWith(token, index)) return true;
  }
  return false;
}

function scanStep(text, index, state) {
  const char = text[index];
  const next = text[index + 1];
  if (state === 'line-comment') return { state: char === '\n' ? 'code' : state };
  if (state === 'block-comment') {
    return char === '*' && next === '/' ? { state: 'code', skipTo: index + 1 } : { state };
  }
  if (state !== 'code') {
    if (char === '\\') return { state, skipTo: index + 1 };
    return { state: char === state ? 'code' : state };
  }
  if (char === '/' && next === '/') return { state: 'line-comment', skipTo: index + 1 };
  if (char === '/' && next === '*') return { state: 'block-comment', skipTo: index + 1 };
  if (char === '"' || char === "'" || char === '`') return { state: char };
  return { state };
}

function sameParameterText(left, right) {
  return String(left ?? '').replace(/\s+/g, ' ').trim() === String(right ?? '').replace(/\s+/g, ' ').trim();
}

function simpleIdentifier(text) {
  return /^[A-Za-z_$][\w$]*$/u.test(text) ? text : undefined;
}

export {
  analyzeJsTsBindingPattern,
  jsTsFunctionParameterBindingPatternReasonCodes,
  leadingJsTsBindingPatternText
};
