import { caseSensitiveIdFragment, idFragment, uniqueRecordsById, uniqueStrings } from './native-import-utils.js';

const semanticFactRegionKinds = new Set(['controlFlow', 'effect', 'mutation']);

export function semanticEffectRegionRecordsForImport(imported, semanticIndex, options = {}) {
  const symbolsById = new Map((semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const facts = (semanticIndex?.facts ?? []).filter((fact) => semanticFactRegionKinds.has(fact?.predicate)
    && semanticFactSubjectCanOwnRuntimeRegion(symbolsById.get(fact.subjectId)));
  if (!facts.length) return { symbols: [], ownershipRegions: [] };
  const sourceText = nativeImportSourceText(imported);
  const groups = semanticFactRegionGroups(facts);
  const ordinals = new Map();
  const records = groups.map((group, index) => {
    const fact = group.facts[0];
    const spanInfo = semanticFactSpanInfo(sourceText, group, fact, imported);
    const owner = symbolsById.get(fact.subjectId);
    const sourcePath = fact.value?.sourcePath ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
    const language = imported?.language ?? imported?.nativeSource?.language ?? imported?.nativeAst?.language;
    const signature = semanticFactRegionSignature(group);
    const ordinal = nextSemanticFactOrdinal(ordinals, group, fact, signature);
    const symbolName = `${owner?.name ?? fact.subjectId}:${group.regionKind}:${signature}#${ordinal}`;
    const key = semanticFactRegionKey(options.regionPrefix, sourcePath, group.regionKind, symbolName, index);
    const region = {
      id: `region_${caseSensitiveIdFragment(key)}`,
      key,
      regionKind: group.regionKind,
      granularity: 'semantic-fact-line',
      language,
      sourcePath,
      sourceHash: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? imported?.sourceHash,
      symbolId: `symbol:${language ?? 'source'}:${group.regionKind}:${idFragment(key)}`,
      symbolName,
      symbolKind: group.regionKind,
      nativeAstNodeId: owner?.nativeAstNodeId,
      sourceSpan: spanInfo.span,
      precision: spanInfo.precision,
      mergePolicy: semanticFactRegionMergePolicy(group.regionKind),
      metadata: {
        semanticRegionTaxonomy: true,
        factIds: group.facts.map((item) => item.id).filter(Boolean),
        factKinds: group.factKinds,
        factLine: group.line,
        predicate: group.regionKind,
        spanKind: spanInfo.kind,
        occurrenceOrdinal: ordinal,
        subjectId: fact.subjectId,
        subjectName: owner?.name
      }
    };
    return {
      region,
      symbol: {
        id: region.symbolId,
        name: symbolName,
        kind: group.regionKind,
        language,
        nativeAstNodeId: region.nativeAstNodeId,
        sourceSpan: region.sourceSpan,
        ownershipRegionId: region.id,
        ownershipKey: region.key,
        ownershipRegionKind: group.regionKind,
        readiness: 'needs-review'
      }
    };
  });
  return {
    symbols: uniqueRecordsById(records.map((record) => record.symbol)),
    ownershipRegions: uniqueRecordsById(records.map((record) => record.region))
  };
}

function semanticFactRegionGroups(facts) {
  const groups = new Map();
  for (const fact of facts) {
    const line = Number(fact?.value?.line);
    if (!Number.isFinite(line)) continue;
    const regionKind = String(fact.predicate);
    const key = [regionKind, fact.subjectId, fact.value?.sourcePath, line].join('\0');
    const group = groups.get(key) ?? { regionKind, line, sourcePath: fact.value?.sourcePath, facts: [] };
    group.facts.push(fact);
    group.factKinds = uniqueStrings(group.facts.map((item) => item.value?.kind).filter(Boolean));
    groups.set(key, group);
  }
  return [...groups.values()];
}

function semanticFactRegionSignature(group) {
  return (group.factKinds?.length ? group.factKinds : [group.regionKind]).join('+');
}

function nextSemanticFactOrdinal(ordinals, group, fact, signature) {
  const key = [group.regionKind, fact.subjectId, group.sourcePath, signature].join('\0');
  const next = (ordinals.get(key) ?? 0) + 1;
  ordinals.set(key, next);
  return next;
}

function semanticFactSubjectCanOwnRuntimeRegion(symbol) {
  if (!symbol) return true;
  if (symbol.metadata?.ownershipRegionKind === 'body') return true;
  return /function|method|action|effect|handler|constructor/
    .test(String(symbol.kind ?? '').toLowerCase());
}

function semanticFactSpanInfo(sourceText, group, fact, imported) {
  const lineNumber = Number(fact?.value?.line);
  if (!Number.isFinite(lineNumber)) return { span: undefined, precision: 'unknown', kind: 'unknown' };
  const line = String(sourceText ?? '').split(/\r\n|\n|\r/)[lineNumber - 1] ?? '';
  const leading = line.match(/^\s*/)?.[0].length ?? 0;
  const expression = semanticFactExpressionRange(line, group) ?? { start: leading, end: line.length, kind: 'line' };
  return {
    span: {
      sourceId: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? imported?.sourceHash,
      path: fact.value?.sourcePath ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath,
      startLine: lineNumber,
      endLine: lineNumber,
      startColumn: expression.start + 1,
      endColumn: expression.end + 1
    },
    precision: expression.kind === 'line' ? 'line' : 'expression',
    kind: expression.kind
  };
}

function semanticFactExpressionRange(line, group) {
  if (group.regionKind === 'effect') return effectRange(line, group.factKinds);
  if (group.regionKind === 'mutation') return mutationRange(line, group.factKinds);
  if (group.regionKind === 'controlFlow') return controlFlowRange(line, group.factKinds);
  return undefined;
}

function effectRange(line, kinds) {
  if (kinds.includes('network')) return namedCallRange(line, ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'], 'network-call');
  if (kinds.includes('scheduler')) return namedCallRange(line, ['setTimeout', 'setInterval', 'requestAnimationFrame', 'queueMicrotask'], 'scheduler-call');
  if (kinds.includes('storage')) return tokenExpressionRange(line, ['localStorage', 'sessionStorage', 'indexedDB', 'caches', 'cookie'], 'storage-effect');
  if (kinds.includes('host')) return tokenExpressionRange(line, ['console', 'process', 'Deno', 'Bun'], 'host-effect');
  if (kinds.includes('browser')) return tokenExpressionRange(line, ['document', 'window', 'navigator', 'location', 'history'], 'browser-effect');
  if (kinds.includes('async')) return keywordExpressionRange(line, 'await', 'async-effect');
  return undefined;
}

function mutationRange(line, kinds) {
  if (kinds.includes('mutating-call')) return mutatingCallRange(line);
  if (kinds.includes('delete')) return keywordExpressionRange(line, 'delete', 'delete-mutation');
  if (kinds.includes('assignment')) return assignmentRange(line);
  if (kinds.includes('update')) return updateRange(line);
  return undefined;
}

function controlFlowRange(line, kinds) {
  if (kinds.includes('exit')) return keywordExpressionRange(line, /(return|yield)\b/, 'control-exit');
  if (kinds.includes('branch')) return controlHeadRange(line, /(if|switch)\b/, 'control-branch')
    ?? caseHeadRange(line) ?? keywordExpressionRange(line, /else\b/, 'control-branch');
  if (kinds.includes('loop')) return controlHeadRange(line, /(for|while)\b/, 'control-loop')
    ?? keywordExpressionRange(line, /do\b/, 'control-loop');
  if (kinds.includes('exception')) return keywordExpressionRange(line, /(throw|catch|finally|try)\b/, 'control-exception');
  if (kinds.includes('async')) return keywordExpressionRange(line, /(await|async)\b/, 'control-async');
  return undefined;
}

function namedCallRange(line, names, kind) {
  for (const name of names) {
    const pattern = new RegExp(`(?:^|[^\\w$.])((?:window|globalThis|self)\\s*\\.\\s*)?${name}\\s*\\(`);
    const match = pattern.exec(line);
    if (!match) continue;
    const start = match.index + match[0].search(new RegExp(`((?:window|globalThis|self)\\s*\\.\\s*)?${name}\\s*\\(`));
    const open = line.indexOf('(', start);
    const close = matchingParenIndex(line, open);
    return { start, end: close === undefined ? statementEnd(line, open) : close + 1, kind };
  }
  return undefined;
}

function controlHeadRange(line, keyword, kind) {
  const match = keyword.exec(line);
  if (!match) return undefined;
  const open = line.indexOf('(', match.index);
  const close = matchingParenIndex(line, open);
  return close === undefined ? undefined : { start: match.index, end: close + 1, kind };
}

function caseHeadRange(line) {
  const match = /\b(case|default)\b/.exec(line);
  if (!match) return undefined;
  const colon = line.indexOf(':', match.index);
  return { start: match.index, end: colon === -1 ? statementEnd(line, match.index) : colon + 1, kind: 'control-branch' };
}

function mutatingCallRange(line) {
  const match = /[A-Za-z_$][\w$.[\]]*(?:\s*\.\s*[A-Za-z_$][\w$.[\]]*)*\s*\.\s*(?:push|pop|shift|unshift|splice|sort|reverse|set|add|delete|clear)\s*\(/.exec(line);
  if (!match) return undefined;
  const open = line.indexOf('(', match.index);
  const close = matchingParenIndex(line, open);
  return { start: match.index, end: close === undefined ? statementEnd(line, open) : close + 1, kind: 'mutating-call' };
}

function assignmentRange(line) {
  const match = /\b[A-Za-z_$][\w$.[\]]*\s*=(?!=|>)/.exec(line);
  return match ? { start: match.index, end: statementEnd(line, match.index), kind: 'assignment' } : undefined;
}

function updateRange(line) {
  const match = /\b[A-Za-z_$][\w$.[\]]*(?:\+\+|--|\s*(?:\+=|-=|\*=|\/=|%=|\|\|=|&&=|\?\?=))/.exec(line);
  return match ? { start: match.index, end: statementEnd(line, match.index), kind: 'update' } : undefined;
}

function tokenExpressionRange(line, tokens, kind) {
  const pattern = new RegExp(`\\b(?:${tokens.join('|')})\\b`);
  const match = pattern.exec(line);
  return match ? { start: match.index, end: statementEnd(line, match.index), kind } : undefined;
}

function keywordExpressionRange(line, keyword, kind) {
  const match = keyword instanceof RegExp ? keyword.exec(line) : new RegExp(`\\b${keyword}\\b`).exec(line);
  return match ? { start: match.index, end: statementEnd(line, match.index), kind } : undefined;
}

function statementEnd(line, start) {
  const semicolon = line.indexOf(';', Math.max(0, start));
  return semicolon === -1 ? line.length : semicolon + 1;
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
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') depth += 1;
    else if (char === ')' && --depth === 0) return index;
  }
  return undefined;
}

function semanticFactRegionKey(prefix = 'source', sourcePath, regionKind, symbolName, index) {
  return [prefix, sourcePath ?? 'memory', regionKind, symbolName || `unknown#${index + 1}`]
    .map((part) => String(part).replace(/\s+/g, ' ').trim())
    .join('#');
}

function semanticFactRegionMergePolicy(regionKind) {
  if (regionKind === 'controlFlow') return 'control-flow-review-required';
  if (regionKind === 'mutation') return 'mutation-boundary-review-required';
  return 'effect-boundary-review-required';
}

function nativeImportSourceText(imported) {
  return imported?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.universalAst?.metadata?.sourcePreservation?.sourceText;
}
