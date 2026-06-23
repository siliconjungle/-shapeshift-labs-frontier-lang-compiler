import { importSpecifierCanonical } from './js-ts-safe-merge-ledger.js';

export function importEntryBindings(entry) {
  const importInfo = entry?.importInfo;
  if (!importInfo || importInfo.sideEffectOnly) return [];
  return [
    ...(importInfo.defaultLocalName ? [{
      localName: importInfo.defaultLocalName,
      importedName: 'default',
      typeOnly: importInfo.typeOnly,
      canonical: `default:${importInfo.defaultLocalName}`
    }] : []),
    ...(importInfo.namespaceLocalName ? [{
      localName: importInfo.namespaceLocalName,
      importedName: '*',
      typeOnly: importInfo.typeOnly,
      canonical: `namespace:${importInfo.namespaceLocalName}`
    }] : []),
    ...importInfo.specifiers.map((specifier) => ({
      localName: specifier.localName,
      importedName: specifier.importedName,
      typeOnly: specifier.typeOnly,
      canonical: importSpecifierCanonical(specifier)
    }))
  ];
}

export function mergedNewImportBindings(workerPlan, headPlan) {
  const seen = new Set();
  const bindings = [];
  for (const entry of [...(workerPlan.newImportEntries ?? []), ...(headPlan.newImportEntries ?? [])]) {
    for (const binding of importEntryBindings(entry)) {
      const key = `${entry.key}:${binding.canonical}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bindings.push({ ...binding, importKey: entry.key });
    }
  }
  return bindings;
}
