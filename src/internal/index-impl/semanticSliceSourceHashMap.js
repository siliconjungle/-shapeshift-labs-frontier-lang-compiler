import{nativeImportEntries}from'./nativeImportEntries.js';
export function semanticSliceSourceHashMap(imported, universalAst, value, options) {
  const entries = new Map();
  const add = (path, sourceHash) => {
    if (!sourceHash) return;
    entries.set(path ?? '', sourceHash);
  };
  add(options.sourcePath, options.sourceHash);
  add(value?.sourcePath, value?.sourceHash);
  for (const item of [imported, ...(imported ? nativeImportEntries(imported) : [])]) {
    add(item?.sourcePath, item?.nativeSource?.sourceHash ?? item?.nativeAst?.sourceHash ?? item?.sourceHash);
  }
  for (const nativeSource of universalAst?.nativeSources ?? []) {
    add(nativeSource?.sourcePath, nativeSource?.sourceHash ?? nativeSource?.ast?.sourceHash);
  }
  for (const sourceMap of universalAst?.sourceMaps ?? []) add(sourceMap.sourcePath, sourceMap.sourceHash);
  return entries;
}
