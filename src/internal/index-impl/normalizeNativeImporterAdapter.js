import{normalizeStringList}from'../../native-import-utils.js';
import{normalizeAdapterDiagnostics}from'./normalizeAdapterDiagnostics.js';import{normalizeNativeImporterAdapterCoverage}from'./normalizeNativeImporterAdapterCoverage.js';
export function normalizeNativeImporterAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('Native importer adapter must be an object');
  }
  if (!adapter.id) throw new Error('Native importer adapter requires an id');
  if (!adapter.language) throw new Error(`Native importer adapter ${adapter.id} requires a language`);
  if (!adapter.parser) throw new Error(`Native importer adapter ${adapter.id} requires a parser`);
  if (typeof adapter.parse !== 'function') throw new Error(`Native importer adapter ${adapter.id} requires a parse function`);
  const summaryInput = {
    id: String(adapter.id),
    language: adapter.language,
    parser: String(adapter.parser),
    version: adapter.version === undefined ? undefined : String(adapter.version)
  };
  const capabilities = normalizeStringList(adapter.capabilities);
  return Object.freeze({
    ...summaryInput,
    capabilities,
    coverage: normalizeNativeImporterAdapterCoverage(adapter.coverage, {
      capabilities,
      language: adapter.language,
      parser: String(adapter.parser)
    }),
    supportedExtensions: normalizeStringList(adapter.supportedExtensions).map((extension) => extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`),
    diagnostics: normalizeAdapterDiagnostics(adapter.diagnostics, summaryInput, {
      language: adapter.language,
      parser: String(adapter.parser),
      parserVersion: adapter.version === undefined ? undefined : String(adapter.version)
    }, 'adapter')
  });
}
