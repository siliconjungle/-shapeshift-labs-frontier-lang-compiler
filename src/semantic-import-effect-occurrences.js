import { uniqueStrings } from './native-import-utils.js';

const schedulerEffectNames = ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'queueMicrotask', 'setImmediate', 'clearImmediate'];

function splitEffectFactOccurrences(group, sourceText) {
  const concreteKinds = group.factKinds.filter((kind) => kind !== 'async');
  const line = sourceLine(sourceText, group.line);
  const asyncRanges = group.factKinds.includes('async') ? effectOccurrenceRanges(line, 'async') : [];
  if (!concreteKinds.length && group.factKinds.includes('async')) {
    return asyncRanges.length
      ? asyncRanges.map((range, occurrenceIndex) => ({ ...group, factKinds: ['async'], occurrenceRange: range, occurrenceOrdinalHint: occurrenceIndex + 1 }))
      : [group];
  }
  if (!concreteKinds.length) return [group];
  const concreteRanges = concreteKinds.flatMap((factKind) => effectOccurrenceRanges(line, factKind));
  const concreteGroups = concreteKinds.flatMap((factKind, index) => {
    const base = {
      ...group,
      facts: group.facts.filter((fact) => fact.value?.kind === factKind
        || (index === 0 && fact.value?.kind === 'async')),
      factKinds: uniqueStrings([factKind, index === 0 && group.factKinds.includes('async') ? 'async' : undefined])
    };
    const ranges = effectOccurrenceRanges(line, factKind);
    return ranges.length > 1
      ? ranges.map((range, occurrenceIndex) => ({ ...base, occurrenceRange: range, occurrenceOrdinalHint: occurrenceIndex + 1 }))
      : [base];
  });
  const uncoveredAsyncRanges = asyncRanges.filter((range) => !concreteRanges.some((concreteRange) => rangesOverlap(range, concreteRange)));
  return uncoveredAsyncRanges.length
    ? [
      ...concreteGroups,
      ...uncoveredAsyncRanges.map((range, occurrenceIndex) => ({
        ...group,
        facts: group.facts.filter((fact) => fact.value?.kind === 'async'),
        factKinds: ['async'],
        occurrenceRange: range,
        occurrenceOrdinalHint: occurrenceIndex + 1
      }))
    ]
    : concreteGroups;
}

function splitMutationFactOccurrences(group, sourceText) {
  const line = sourceLine(sourceText, group.line);
  return group.factKinds.flatMap((factKind) => {
    const base = {
      ...group,
      facts: group.facts.filter((fact) => fact.value?.kind === factKind),
      factKinds: [factKind]
    };
    const ranges = mutationOccurrenceRanges(line, factKind);
    return ranges.length > 1
      ? ranges.map((range, occurrenceIndex) => ({ ...base, occurrenceRange: range, occurrenceOrdinalHint: occurrenceIndex + 1 }))
      : [base];
  });
}

function effectOccurrenceRanges(line, factKind) {
  if (factKind === 'network') return namedCallRanges(line, ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'], 'network-call');
  if (factKind === 'scheduler') return namedCallRanges(line, schedulerEffectNames, 'scheduler-call');
  if (factKind === 'storage') return tokenExpressionRanges(line, ['localStorage', 'sessionStorage', 'indexedDB', 'caches', 'cookie'], 'storage-effect');
  if (factKind === 'host-context') return importMetaRanges(line);
  if (factKind === 'host') return tokenExpressionRanges(line, ['console', 'process', 'Deno', 'Bun'], 'host-effect');
  if (factKind === 'browser') return sortedRanges([
    ...namedCallRanges(line, ['Worker', 'SharedWorker'], 'browser-constructor'),
    ...tokenExpressionRanges(line, ['document', 'window', 'navigator', 'location', 'history'], 'browser-effect')
  ]);
  if (factKind === 'tagged-template') return taggedTemplateRanges(line);
  if (factKind === 'template-interpolation' || factKind === 'template-literal') return templateLiteralRanges(line);
  if (factKind === 'async') return asyncEffectRanges(line);
  if (factKind === 'generator') return yieldEffectRanges(line);
  return [];
}

function mutationOccurrenceRanges(line, factKind) {
  if (factKind === 'mutating-call') return mutatingCallRanges(line);
  if (factKind === 'delete') return deleteMutationRanges(line);
  if (factKind === 'assignment') return assignmentRanges(line);
  if (factKind === 'update') return updateRanges(line);
  return [];
}

function namedCallRanges(line, names, kind) {
  const text = String(line ?? '');
  const ranges = [];
  for (let index = 0; index < text.length; index += 1) {
    const match = namedCallAt(text, index, names);
    if (!match) continue;
    const open = text.indexOf('(', match.start);
    const close = matchingParenIndex(text, open);
    ranges.push({ start: match.start, end: close === undefined ? statementEnd(text, open) : close + 1, kind });
    index = Math.max(index, open);
  }
  return sortedRanges([...ranges, ...globalBracketCallRanges(text, names, kind)]);
}

function globalBracketCallRanges(text, names, kind) {
  const ranges = [];
  for (const name of names) {
    const pattern = new RegExp(`(?:^|[^\\w$.])((?:new\\s+)?(?:window|globalThis|self)\\s*(?:\\?\\.)?\\s*\\[\\s*(['"\`])${name}\\2\\s*\\]\\s*(?:\\?\\.)?\\s*\\()`, 'g');
    for (const match of text.matchAll(pattern)) {
      const start = match.index + match[0].indexOf(match[1]);
      const open = text.indexOf('(', start);
      const close = matchingParenIndex(text, open);
      ranges.push({ start, end: close === undefined ? statementEnd(text, open) : close + 1, kind });
    }
  }
  return ranges;
}

function mutatingCallRanges(line) {
  const text = String(line ?? '');
  const ranges = [];
  const pattern = /[A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*\s*(?:(?:\.|\?\.)\s*(?:push|pop|shift|unshift|splice|sort|reverse|set|add|delete|clear)\s*(?:\?\.)?|\s*(?:\?\.)?\s*\[\s*(['"`])(?:push|pop|shift|unshift|splice|sort|reverse|set|add|delete|clear)\1\s*\]\s*(?:\?\.)?)\s*\(/g;
  for (const match of text.matchAll(pattern)) {
    const open = text.indexOf('(', match.index);
    const close = matchingParenIndex(text, open);
    ranges.push({ start: match.index, end: close === undefined ? statementEnd(text, open) : close + 1, kind: 'mutating-call' });
  }
  return ranges;
}

function deleteMutationRanges(line) {
  const text = String(line ?? '');
  return [...text.matchAll(/\bdelete\s+[A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*/g)]
    .map((match) => ({ start: match.index, end: statementEnd(text, match.index), kind: 'delete-mutation' }));
}

function assignmentRanges(line) {
  const text = String(line ?? '');
  return [...text.matchAll(/(^|[^\w$])([A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)\s*=(?!=|>)/g)]
    .map((match) => ({ start: match.index + match[1].length, end: statementEnd(text, match.index + match[1].length), kind: 'assignment' }));
}

function updateRanges(line) {
  const text = String(line ?? '');
  return [...text.matchAll(/(^|[^\w$])((?:\+\+|--)\s*)?[A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*(?:\s*(?:\+\+|--|\+=|-=|\*=|\/=|%=|\|\|=|&&=|\?\?=))/g)]
    .map((match) => ({ start: match.index + match[1].length, end: statementEnd(text, match.index + match[1].length), kind: 'update' }));
}

function tokenExpressionRanges(line, tokens, kind) {
  const text = String(line ?? '');
  const pattern = new RegExp(`\\b(?:${tokens.join('|')})\\b`, 'g');
  return [...text.matchAll(pattern)].map((match) => ({
    start: match.index,
    end: statementEnd(text, match.index),
    kind
  }));
}

function awaitEffectRanges(line) {
  const text = String(line ?? '');
  return [...text.matchAll(/\bawait\b/g)]
    .map((match) => ({ start: match.index, end: statementEnd(text, match.index), kind: 'async-effect' }));
}

function asyncEffectRanges(line) {
  const awaitRanges = awaitEffectRanges(line);
  const importRanges = dynamicImportRanges(line)
    .filter((range) => !awaitRanges.some((awaitRange) => rangesOverlap(range, awaitRange)));
  return sortedRanges([...awaitRanges, ...importRanges]);
}

function dynamicImportRanges(line) {
  const text = String(line ?? '');
  const ranges = [];
  for (let index = 0; index < text.length; index += 1) {
    if (!dynamicImportAt(text, index)) continue;
    const open = text.indexOf('(', index);
    const close = matchingParenIndex(text, open);
    ranges.push({ start: index, end: close === undefined ? statementEnd(text, open) : close + 1, kind: 'dynamic-import' });
    index = close === undefined ? ranges[ranges.length - 1].end : close;
  }
  return ranges;
}

function dynamicImportAt(text, index) {
  if (text.slice(index, index + 6) !== 'import' || isIdentifierPart(text[index - 1]) || isIdentifierPart(text[index + 6])) return false;
  return text[skipSpaces(text, index + 6)] === '(';
}

function yieldEffectRanges(line) {
  const text = String(line ?? '');
  return [...text.matchAll(/\byield\s*\*?/g)]
    .map((match) => ({ start: match.index, end: statementEnd(text, match.index), kind: 'generator-effect' }));
}

function importMetaRanges(line) {
  const text = String(line ?? '');
  return [...text.matchAll(/\bimport\s*\.\s*meta(?:\s*\.\s*[A-Za-z_$][\w$]*)*/g)]
    .map((match) => ({ start: match.index, end: statementEnd(text, match.index), kind: 'import-meta-host-context' }));
}

function taggedTemplateRanges(line) {
  const text = String(line ?? '');
  const ranges = [];
  const pattern = /(?:^|[^\w$.)\]])([A-Za-z_$][\w$]*(?:(?:\s*\.\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)\s*`/g;
  for (const match of text.matchAll(pattern)) {
    const start = match.index + match[0].indexOf(match[1]);
    const tick = text.indexOf('`', start);
    ranges.push({ start, end: templateEnd(text, tick), kind: 'tagged-template' });
  }
  return ranges;
}

function templateLiteralRanges(line) {
  const text = String(line ?? '');
  const ranges = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '`') continue;
    const end = templateEnd(text, index);
    ranges.push({ start: index, end, kind: 'template-literal' });
    index = Math.max(index, end - 1);
  }
  return ranges;
}

function namedCallAt(text, index, names) {
  if (isIdentifierPart(text[index - 1]) || text[index - 1] === '.' || text[index - 1] === '$') return undefined;
  const receiverLength = receiverPrefixLength(text, index);
  const start = index + receiverLength;
  for (const name of names) {
    if (text.slice(start, start + name.length) !== name || isIdentifierPart(text[start + name.length])) continue;
    const open = optionalCallOpen(text, skipSpaces(text, start + name.length));
    if (text[open] === '(') return { start: constructorStartBefore(text, index) ?? index };
  }
  return undefined;
}

function receiverPrefixLength(text, index) {
  for (const prefix of ['window?.', 'globalThis?.', 'self?.', 'window.', 'globalThis.', 'self.']) {
    if (text.slice(index, index + prefix.length) === prefix) return prefix.length;
  }
  return 0;
}

function optionalCallOpen(text, index) {
  return text[index] === '?' && text[index + 1] === '.' ? skipSpaces(text, index + 2) : index;
}

function constructorStartBefore(text, index) {
  let cursor = index - 1;
  while (/\s/.test(text[cursor] ?? '')) cursor -= 1;
  const end = cursor + 1;
  const start = end - 3;
  return text.slice(start, end) === 'new' && !isIdentifierPart(text[start - 1]) ? start : undefined;
}

function sortedRanges(ranges) {
  return ranges.slice().sort((left, right) => left.start - right.start || left.end - right.end);
}

function rangesOverlap(left, right) {
  return Math.max(left.start, right.start) < Math.min(left.end, right.end);
}

function sourceLine(sourceText, lineNumber) {
  return String(sourceText ?? '').split(/\r\n|\n|\r/)[Number(lineNumber) - 1] ?? '';
}

function statementEnd(line, start) {
  const semicolon = String(line ?? '').indexOf(';', Math.max(0, start));
  return semicolon === -1 ? String(line ?? '').length : semicolon + 1;
}

function templateEnd(line, start) {
  for (let index = start + 1, escaped = false; index < line.length; index += 1) {
    if (escaped) escaped = false;
    else if (line[index] === '\\') escaped = true;
    else if (line[index] === '`') return index + 1;
  }
  return line.length;
}

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

function skipSpaces(text, index) { let cursor = index; while (/\s/.test(text[cursor] ?? '')) cursor += 1; return cursor; }
function isIdentifierPart(char) { return /[A-Za-z0-9_$]/.test(char ?? ''); }

export { splitEffectFactOccurrences, splitMutationFactOccurrences };
