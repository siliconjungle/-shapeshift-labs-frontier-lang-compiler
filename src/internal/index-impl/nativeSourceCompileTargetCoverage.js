import{normalizeNativeLanguageId}from'../../native-import-utils.js';
export function nativeSourceCompileTargetCoverage(matrix, language, target) {
  const sourceLanguage = normalizeNativeLanguageId(language);
  const entry = (matrix.languages ?? []).find((candidate) => {
    const ids = [candidate.language, ...(candidate.aliases ?? [])].map(normalizeNativeLanguageId);
    return ids.includes(sourceLanguage);
  });
  const coverage = entry?.targets?.find((candidate) => candidate.target === target);
  if (coverage) return coverage;
  return {
    target,
    lossClass: 'missingAdapter',
    supported: false,
    readiness: 'blocked',
    lossKinds: ['targetProjectionLoss'],
    categories: ['targetProjectionLoss'],
    reason: `No native-to-${target} projection coverage is available for ${language}.`,
    adapter: undefined,
    notes: ['Inject a source-language parser and target projection adapter before treating this cross-language output as merge-ready.']
  };
}
