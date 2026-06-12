import { caseSensitiveIdFragment, idFragment, uniqueRecordsById } from './native-import-utils.js';

export function semanticCallsiteRecordsForImport(imported, semanticIndex, options = {}) {
  const relations = (semanticIndex?.relations ?? []).filter((relation) => relation?.predicate === 'calls');
  if (!relations.length) return { symbols: [], ownershipRegions: [] };
  const symbolsById = new Map((semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const occurrences = semanticIndex?.occurrences ?? [];
  const occurrencesById = new Map(occurrences.map((occurrence) => [occurrence.id, occurrence]));
  const sourceText = nativeImportSourceText(imported);
  const records = relations.map((relation, index) => {
    const occurrence = occurrenceForRelation(relation, occurrencesById, occurrences);
    const rawSpan = relation.metadata?.sourceSpan ?? occurrence?.span;
    const spanInfo = callsiteSpan(sourceText, rawSpan);
    const sourceName = relation.metadata?.sourceName ?? symbolsById.get(relation.sourceId)?.name ?? relation.sourceId;
    const targetName = relation.metadata?.targetName ?? symbolsById.get(relation.targetId)?.name ?? relation.targetId;
    const sourcePath = spanInfo.span?.path ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
    const language = imported?.language ?? imported?.nativeSource?.language ?? imported?.nativeAst?.language;
    const symbolName = `${sourceName}->${targetName}`;
    const key = callsiteKey(options.regionPrefix, sourcePath, symbolName, spanInfo.span, index);
    const region = {
      id: `region_${caseSensitiveIdFragment(key)}`,
      key,
      regionKind: 'call',
      granularity: 'callsite',
      language,
      sourcePath,
      sourceHash: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? imported?.sourceHash,
      symbolId: `symbol:${language ?? 'source'}:call:${idFragment(relation.id ?? key)}`,
      symbolName,
      symbolKind: 'call',
      nativeAstNodeId: occurrence?.nativeAstNodeId,
      sourceSpan: spanInfo.span,
      precision: spanInfo.expanded ? 'callsite' : spanInfo.span ? 'line' : 'unknown',
      mergePolicy: 'callsite-overlap-review-required',
      metadata: {
        semanticRegionTaxonomy: true,
        relationId: relation.id,
        occurrenceId: occurrence?.id ?? relation.metadata?.occurrenceId,
        sourceSymbolId: relation.sourceId,
        targetSymbolId: relation.targetId,
        sourceName,
        targetName
      }
    };
    return {
      region,
      symbol: {
        id: region.symbolId,
        name: symbolName,
        kind: 'call',
        language,
        nativeAstNodeId: region.nativeAstNodeId,
        semanticOccurrenceId: region.metadata.occurrenceId,
        sourceSpan: region.sourceSpan,
        ownershipRegionId: region.id,
        ownershipKey: region.key,
        ownershipRegionKind: 'call',
        readiness: 'needs-review'
      }
    };
  });
  return {
    symbols: uniqueRecordsById(records.map((record) => record.symbol)),
    ownershipRegions: uniqueRecordsById(records.map((record) => record.region))
  };
}

function occurrenceForRelation(relation, occurrencesById, occurrences) {
  const explicit = occurrencesById.get(relation.metadata?.occurrenceId);
  if (explicit) return explicit;
  return occurrences.find((occurrence) => occurrence.symbolId === relation.targetId
    && (!relation.metadata?.nativeAstNodeId || occurrence.nativeAstNodeId === relation.metadata.nativeAstNodeId));
}

function callsiteKey(prefix = 'source', sourcePath, symbolName, span, index) {
  const location = span ? `${span.startLine ?? 0}:${span.startColumn ?? 0}` : `unknown:${index + 1}`;
  return [prefix, sourcePath ?? 'memory', 'call', `${symbolName}@${location}`]
    .map((part) => String(part).replace(/\s+/g, ' ').trim())
    .join('#');
}

function callsiteSpan(sourceText, span) {
  if (typeof sourceText !== 'string' || !span || typeof span.startLine !== 'number') {
    return { span, expanded: false };
  }
  const line = sourceText.split(/\r\n|\n|\r/)[span.startLine - 1];
  if (line === undefined) return { span, expanded: false };
  const nameEnd = Math.max(0, Number(span.endColumn ?? span.startColumn ?? 1) - 1);
  const open = nextNonSpaceIndex(line, nameEnd);
  if (line[open] !== '(') return { span, expanded: false };
  const close = matchingParenIndex(line, open);
  if (close === undefined) return { span, expanded: false };
  return {
    span: {
      ...span,
      endColumn: close + 2
    },
    expanded: true
  };
}

function nextNonSpaceIndex(line, index) {
  for (let cursor = index; cursor < line.length; cursor += 1) {
    if (!/\s/.test(line[cursor])) return cursor;
  }
  return -1;
}

function matchingParenIndex(line, open) {
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

function nativeImportSourceText(imported) {
  return imported?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.universalAst?.metadata?.sourcePreservation?.sourceText;
}
