import{idFragment}from'../../native-import-utils.js';
export function uniqueSemanticSliceRegions(regions) {
  const seen = new Set();
  const result = [];
  for (const region of regions ?? []) {
    if (!region) continue;
    const id = region.id ?? `region_${idFragment(region.key ?? region.sourcePath ?? region.symbolId ?? result.length)}`;
    const key = region.key ?? id;
    const dedupeKey = `${id}:${key}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    result.push({ ...region, id, key });
  }
  return result;
}
