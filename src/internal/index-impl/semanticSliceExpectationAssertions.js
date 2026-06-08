import{semanticSliceAssertion}from'./semanticSliceAssertion.js';import{semanticSliceExpectationRecords}from'./semanticSliceExpectationRecords.js';import{semanticSliceRegionMatchesRef}from'./semanticSliceRegionMatchesRef.js';import{semanticSliceSymbolMatchesRef}from'./semanticSliceSymbolMatchesRef.js';

export function semanticSliceExpectationAssertions(slice, options = {}) {
  const assertions = [];
  for (const expectation of semanticSliceTestExpectations(slice, options)) {
    if (expectation.category === 'symbol') {
      const ok = (slice?.symbols ?? []).some((symbol) => semanticSliceSymbolMatchesRef(symbol, expectation.ref));
      assertions.push(semanticSliceAssertion(expectation.id, ok, ok ? `Expected symbol ${expectation.ref} is present.` : `Expected symbol ${expectation.ref} is missing.`, {
        expectedRef: expectation.ref,
        selectedSymbols: compactSymbols(slice?.symbols)
      }));
      continue;
    }
    if (expectation.category === 'region') {
      const ok = (slice?.ownershipRegions ?? []).some((region) => semanticSliceRegionMatchesRef(region, expectation.ref));
      assertions.push(semanticSliceAssertion(expectation.id, ok, ok ? `Expected region ${expectation.ref} is present.` : `Expected region ${expectation.ref} is missing.`, {
        expectedRef: expectation.ref,
        selectedRegions: compactRegions(slice?.ownershipRegions)
      }));
      continue;
    }
    if (expectation.category === 'sourceHash') {
      const actual = semanticSliceActualSourceHash(slice, expectation.path);
      const ok = Boolean(actual) && actual === expectation.expected;
      assertions.push(semanticSliceAssertion(expectation.id, ok, ok ? `Expected source hash matched for ${expectation.path ?? 'the selected source file'}.` : `Expected source hash did not match for ${expectation.path ?? 'the selected source file'}.`, {
        path: expectation.path,
        expectedSourceHash: expectation.expected,
        actualSourceHash: actual,
        selectedSourceHashes: slice?.mergeAdmission?.sourceHashes ?? []
      }));
      continue;
    }
    if (expectation.category === 'summaryCount') {
      const actual = semanticSliceSummaryCount(slice, expectation.key);
      const ok = actual === expectation.expected;
      assertions.push(semanticSliceAssertion(expectation.id, ok, ok ? `Expected ${expectation.key} count matched.` : `Expected ${expectation.key} count did not match.`, {
        key: expectation.key,
        expected: expectation.expected,
        actual
      }));
    }
  }
  return assertions;
}

function semanticSliceTestExpectations(slice, options) {
  const known = new Set(['symbol', 'region', 'sourceHash', 'summaryCount']);
  const records = [
    ...(slice?.verification?.expectedAssertions ?? []).filter((record) => known.has(record?.category)),
    ...semanticSliceExpectationRecords(options)
  ];
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = `${record.id}:${record.expected}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function semanticSliceActualSourceHash(slice, path) {
  const hashes = slice?.mergeAdmission?.sourceHashes ?? [];
  if (path) return hashes.find((entry) => entry.path === path)?.sourceHash ?? (slice?.sourceFiles ?? []).find((file) => file.path === path)?.sourceHash;
  if (hashes.length === 1) return hashes[0]?.sourceHash;
  if ((slice?.sourceFiles?.length ?? 0) === 1) return slice.sourceFiles[0]?.sourceHash;
  return undefined;
}

function semanticSliceSummaryCount(slice, key) {
  if (key === 'symbols') return slice?.summary?.symbols ?? slice?.symbols?.length ?? 0;
  if (key === 'ownershipRegions') return slice?.summary?.ownershipRegions ?? slice?.ownershipRegions?.length ?? 0;
  if (key === 'sourceFiles') return slice?.summary?.sourceFiles ?? slice?.sourceFiles?.length ?? 0;
  return undefined;
}

function compactSymbols(symbols) {
  return (symbols ?? []).map((symbol) => ({
    id: symbol.id,
    name: symbol.name,
    displayName: symbol.displayName,
    nativeAstNodeId: symbol.nativeAstNodeId,
    ownershipRegionId: symbol.ownershipRegionId ?? symbol.metadata?.ownershipRegionId,
    ownershipRegionKey: symbol.ownershipRegionKey ?? symbol.metadata?.ownershipRegionKey
  }));
}

function compactRegions(regions) {
  return (regions ?? []).map((region) => ({
    id: region.id,
    key: region.key,
    kind: region.kind ?? region.regionKind,
    granularity: region.granularity,
    symbolId: region.symbolId,
    symbolName: region.symbolName,
    sourcePath: region.sourcePath,
    nativeAstNodeId: region.nativeAstNodeId
  }));
}
