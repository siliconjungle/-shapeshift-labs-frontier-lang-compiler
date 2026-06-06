import{normalizeProjectionMatrixTargets}from'../../coverage-matrix-profiles.js';import{normalizeNativeLanguageId}from'../../native-import-utils.js';
import{safeNativeTargetProjectionAdapterSummary}from'./safeNativeTargetProjectionAdapterSummary.js';
export function nativeTargetProjectionAdapterMatches(adapter, input = {}) {
  const summary = safeNativeTargetProjectionAdapterSummary(adapter);
  if (!summary) return false;
  if (input.sourceLanguage && normalizeNativeLanguageId(input.sourceLanguage) !== summary.sourceLanguage) return false;
  const target = normalizeProjectionMatrixTargets([input.target])[0] ?? String(input.target ?? '').toLowerCase();
  if (target && target !== summary.target) return false;
  const parser = input.parser ? String(input.parser).toLowerCase() : undefined;
  if (parser && summary.supportedParsers.length && !summary.supportedParsers.map((item) => item.toLowerCase()).includes(parser)) return false;
  const sourcePath = String(input.sourcePath ?? '').toLowerCase();
  if (sourcePath && summary.supportedExtensions.length) {
    return summary.supportedExtensions.some((extension) => sourcePath.endsWith(extension));
  }
  return true;
}
