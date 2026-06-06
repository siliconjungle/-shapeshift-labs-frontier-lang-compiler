import{createNativeProjectImportResult}from'./createNativeProjectImportResult.js';import{importNativeSource}from'./importNativeSource.js';import{resolveNativeProjectAdapter}from'./resolveNativeProjectAdapter.js';import{runNativeImporterAdapter}from'./runNativeImporterAdapter.js';
export async function importNativeProject(input = {}) {
  const sources = input.sources ?? [];
  const adapters = input.adapters ?? [];
  const imports = [];
  for (const [index, source] of sources.entries()) {
    const adapter = source.adapter && typeof source.adapter === 'object'
      ? source.adapter
      : resolveNativeProjectAdapter(source, adapters, input);
    if (adapter) {
      imports.push(await runNativeImporterAdapter(adapter, {
        ...source,
        adapterOptions: source.adapterOptions ?? input.adapterOptions,
        adapterMetadata: {
          projectImportId: input.id,
          sourceIndex: index,
          ...input.adapterMetadata,
          ...source.adapterMetadata
        }
      }));
    } else {
      imports.push(importNativeSource(source));
    }
  }
  return createNativeProjectImportResult(input, imports);
}
