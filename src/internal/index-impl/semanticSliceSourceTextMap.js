import{nativeImportEntries}from'./nativeImportEntries.js';import{nativeImportSourceText}from'./nativeImportSourceText.js';
export function semanticSliceSourceTextMap(imported, universalAst, value, options) {
  const entries = new Map();
  const add = (path, sourceText) => {
    if (typeof sourceText !== 'string') return;
    entries.set(path ?? '', sourceText);
  };
  add(options.sourcePath, options.sourceText);
  add(value?.sourcePath, value?.sourceText);
  for (const item of [imported, ...(imported ? nativeImportEntries(imported) : [])]) {
    add(item?.sourcePath, nativeImportSourceText(item));
    add(item?.nativeSource?.sourcePath, item?.nativeSource?.metadata?.sourcePreservation?.sourceText);
  }
  for (const nativeSource of universalAst?.nativeSources ?? []) {
    add(nativeSource?.sourcePath, nativeSource?.metadata?.sourcePreservation?.sourceText);
    add(nativeSource?.sourcePath, nativeSource?.ast?.metadata?.sourcePreservation?.sourceText);
  }
  return entries;
}
