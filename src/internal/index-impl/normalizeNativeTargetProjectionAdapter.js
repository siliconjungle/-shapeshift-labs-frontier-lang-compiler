import{normalizeProjectionMatrixTargets}from'../../coverage-matrix-profiles.js';import{normalizeNativeLanguageId,normalizeStringList}from'../../native-import-utils.js';
import{normalizeAdapterDiagnostics}from'./normalizeAdapterDiagnostics.js';import{normalizeNativeTargetProjectionAdapterCoverage}from'./normalizeNativeTargetProjectionAdapterCoverage.js';
export function normalizeNativeTargetProjectionAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('Native target projection adapter must be an object');
  }
  if (!adapter.id) throw new Error('Native target projection adapter requires an id');
  const sourceLanguage = normalizeNativeLanguageId(adapter.sourceLanguage ?? adapter.language);
  if (!sourceLanguage) throw new Error(`Native target projection adapter ${adapter.id} requires a sourceLanguage`);
  const target = normalizeProjectionMatrixTargets([adapter.target ?? adapter.targetLanguage])[0];
  if (!target) throw new Error(`Native target projection adapter ${adapter.id} requires a target`);
  if (typeof adapter.project !== 'function') throw new Error(`Native target projection adapter ${adapter.id} requires a project function`);
  const capabilities = normalizeStringList(adapter.capabilities);
  const summaryInput = {
    id: String(adapter.id),
    sourceLanguage,
    language: sourceLanguage,
    target,
    parser: `target:${target}`,
    version: adapter.version === undefined ? undefined : String(adapter.version)
  };
  return Object.freeze({
    id: summaryInput.id,
    sourceLanguage,
    target,
    version: summaryInput.version,
    capabilities,
    supportedParsers: normalizeStringList(adapter.supportedParsers),
    supportedExtensions: normalizeStringList(adapter.supportedExtensions).map((extension) => extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`),
    coverage: normalizeNativeTargetProjectionAdapterCoverage(adapter.coverage, { capabilities }),
    diagnostics: normalizeAdapterDiagnostics(adapter.diagnostics, summaryInput, {
      language: sourceLanguage,
      parser: summaryInput.parser,
      parserVersion: summaryInput.version
    }, 'target-adapter')
  });
}
