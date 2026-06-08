import{readStringArray}from'./readStringArray.js';

export function semanticSliceExpectationRecords(options={}) {
  const records = [];
  for (const ref of readStringArray(options.expectedSymbols ?? options.expectedSymbolRefs)) {
    records.push({ id: `expectedSymbol:${ref}`, category: 'symbol', ref, expected: true });
  }
  for (const ref of readStringArray(options.expectedRegions ?? options.expectedRegionRefs)) {
    records.push({ id: `expectedRegion:${ref}`, category: 'region', ref, expected: true });
  }
  for (const entry of semanticSliceSourceHashExpectationRecords(options.expectedSourceHashes)) {
    records.push(entry);
  }
  addSummaryCount(records, 'symbols', options.expectedSymbolCount);
  addSummaryCount(records, 'ownershipRegions', options.expectedRegionCount);
  addSummaryCount(records, 'sourceFiles', options.expectedSourceFileCount);
  return uniqueExpectationRecords(records);
}

export function semanticSliceSourceHashExpectationRecords(value) {
  const records = [];
  const add = (path, sourceHash) => {
    if (!sourceHash) return;
    const normalizedPath = path === undefined || path === null || path === '' ? undefined : String(path);
    records.push({
      id: `expectedSourceHash:${normalizedPath ?? '*'}`,
      category: 'sourceHash',
      path: normalizedPath,
      expected: String(sourceHash)
    });
  };
  if (!value) return records;
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (Array.isArray(entry)) {
        add(entry[0], entry[1]);
        continue;
      }
      if (entry && typeof entry === 'object') {
        add(entry.path ?? entry.sourcePath, entry.sourceHash ?? entry.hash ?? entry.expected);
      }
    }
    return records;
  }
  if (typeof value.entries === 'function') {
    for (const [path, sourceHash] of value.entries()) add(path, sourceHash);
    return records;
  }
  if (typeof value === 'object') {
    for (const [path, sourceHash] of Object.entries(value)) add(path, sourceHash);
  }
  return records;
}

function addSummaryCount(records, key, value) {
  if (!Number.isFinite(value)) return;
  records.push({
    id: `expectedCount:${key}`,
    category: 'summaryCount',
    key,
    expected: Math.max(0, Math.floor(value))
  });
}

function uniqueExpectationRecords(records) {
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
