import{normalizeNativeLanguageId}from'../../native-import-utils.js';
export function nativeCompileSourceLanguage(importResult, input) {
  return normalizeNativeLanguageId(
    importResult.language
      ?? importResult.nativeSource?.language
      ?? importResult.nativeAst?.language
      ?? importResult.nativeSource?.ast?.language
      ?? input?.language
  ) || String(importResult.language ?? input?.language ?? 'source');
}
