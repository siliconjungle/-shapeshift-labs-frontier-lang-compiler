import{uniqueStrings}from'../../native-import-utils.js';
export function nativeImporterAdapterCoverage(defaults = {}, overrides = {}) {
  return {
    ...defaults,
    ...overrides,
    semanticCoverage: {
      ...(defaults.semanticCoverage ?? {}),
      ...(overrides.semanticCoverage ?? {})
    },
    notes: uniqueStrings([...(defaults.notes ?? []), ...(overrides.notes ?? [])])
  };
}
