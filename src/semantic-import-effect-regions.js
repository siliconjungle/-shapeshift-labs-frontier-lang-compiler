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
      sourceSpan: semanticFactLineSpan(sourceText, fact, imported),
      precision: sourceText ? 'line' : 'unknown',
      mergePolicy: semanticFactRegionMergePolicy(group.regionKind),
      metadata: {
        semanticRegionTaxonomy: true,
        factIds: group.facts.map((item) => item.id).filter(Boolean),
        factKinds: group.factKinds,
        factLine: group.line,
        predicate: group.regionKind,
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

function semanticFactLineSpan(sourceText, fact, imported) {
  const lineNumber = Number(fact?.value?.line);
  if (!Number.isFinite(lineNumber)) return undefined;
  const line = String(sourceText ?? '').split(/\r\n|\n|\r/)[lineNumber - 1] ?? '';
  const leading = line.match(/^\s*/)?.[0].length ?? 0;
  return {
    sourceId: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? imported?.sourceHash,
    path: fact.value?.sourcePath ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath,
    startLine: lineNumber,
    endLine: lineNumber,
    startColumn: leading + 1,
    endColumn: line.length + 1
  };
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
