import{normalizeNativeLanguageId}from'../../native-import-utils.js';
import{externalLanguageNameByNumber}from'./externalLanguageNameByNumber.js';
export function normalizeExternalSemanticLanguage(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = typeof value === 'number' ? externalLanguageNameByNumber[value] : String(value);
  return normalizeNativeLanguageId(raw);
}
