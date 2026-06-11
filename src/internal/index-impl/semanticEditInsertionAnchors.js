export function semanticEditInsertionAnchor(region, context) {
  if (region.changeKind !== 'added') return undefined;
  const workerSymbol = symbolForRegion(context.workerSymbols, region);
  if (!workerSymbol?.sourceSpan) return fallbackInsertion(region, context, 'worker-symbol-span-missing');
  const workers = uniqueSymbols(context.workerSymbols)
    .filter((symbol) => symbol.id !== workerSymbol.id && symbol.key !== workerSymbol.key)
    .filter((symbol) => hasSymbol(context.baseSymbols, symbol));
  const before = nearestBefore(workers, workerSymbol);
  const after = nearestAfter(workers, workerSymbol);
  const anchor = before
    ? insertionFromSymbol('after', before, context, 'nearest-previous-base-symbol')
    : after
      ? insertionFromSymbol('before', after, context, 'nearest-next-base-symbol')
      : fallbackInsertion(region, context, 'no-neighbor-base-symbol');
  return compactRecord({
    ...anchor,
    insertedSymbolId: workerSymbol.id,
    insertedSymbolName: workerSymbol.name,
    insertedSymbolKind: workerSymbol.kind,
    insertedSourceSpan: workerSymbol.sourceSpan,
    insertedSourcePath: workerSymbol.sourcePath
  });
}

function insertionFromSymbol(mode, symbol, context, reasonCode) {
  const headSymbol = symbolForExisting(context.headSymbols, symbol);
  return compactRecord({
    mode,
    anchorKey: symbol.key ?? symbol.ownershipKey ?? symbol.id,
    anchorSymbolId: symbol.id,
    anchorSymbolName: symbol.name,
    anchorSymbolKind: symbol.kind,
    baseSpan: symbolForExisting(context.baseSymbols, symbol)?.sourceSpan,
    workerAnchorSpan: symbol.sourceSpan,
    headSpan: headSymbol?.sourceSpan,
    sourcePath: headSymbol?.sourcePath ?? symbol.sourcePath,
    reasonCodes: [headSymbol ? reasonCode : `${reasonCode}:head-anchor-missing`]
  });
}

function fallbackInsertion(region, context, reasonCode) {
  const mode = region.regionKind === 'import' ? 'file-start' : 'file-end';
  return compactRecord({
    mode,
    sourcePath: region.sourcePath ?? context.workerChangeSet.sourcePath,
    reasonCodes: [reasonCode, `fallback-${mode}`]
  });
}

function nearestBefore(symbols, target) {
  return symbols
    .filter((symbol) => spanEndLine(symbol.sourceSpan) <= spanStartLine(target.sourceSpan))
    .sort((left, right) => spanEndLine(right.sourceSpan) - spanEndLine(left.sourceSpan))[0];
}

function nearestAfter(symbols, target) {
  return symbols
    .filter((symbol) => spanStartLine(symbol.sourceSpan) >= spanEndLine(target.sourceSpan))
    .sort((left, right) => spanStartLine(left.sourceSpan) - spanStartLine(right.sourceSpan))[0];
}

function symbolForRegion(symbols, region) {
  return symbolForKeys(symbols, [region.key, region.symbolId, region.symbolName].filter(Boolean));
}

function symbolForExisting(symbols, symbol) {
  return symbolForKeys(symbols, symbolKeys(symbol));
}

function hasSymbol(symbols, symbol) {
  return Boolean(symbolForExisting(symbols, symbol));
}

function symbolForKeys(symbols, keys) {
  for (const key of keys) {
    const symbol = symbols.get(key);
    if (symbol) return symbol;
  }
  return undefined;
}

function uniqueSymbols(symbols) {
  const seen = new Set();
  const result = [];
  for (const symbol of symbols.values()) {
    const key = symbol.id ?? `${symbol.key}:${symbol.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(symbol);
  }
  return result;
}

function symbolKeys(symbol) {
  return [symbol.key, symbol.ownershipKey, symbol.id, symbol.name].filter(Boolean);
}

function spanStartLine(span) {
  return typeof span?.startLine === 'number' ? span.startLine : Number.MAX_SAFE_INTEGER;
}

function spanEndLine(span) {
  return typeof span?.endLine === 'number' ? span.endLine : spanStartLine(span);
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
