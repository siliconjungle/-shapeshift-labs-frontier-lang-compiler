import{normalizeNativeLanguageId}from'../../native-import-utils.js';
export function nativeSourceCompileTargetExtension(target) {
  const normalized = normalizeNativeLanguageId(target);
  if (normalized === 'typescript') return '.ts';
  if (normalized === 'javascript') return '.js';
  if (normalized === 'rust') return '.rs';
  if (normalized === 'python') return '.py';
  if (normalized === 'c') return '.h';
  return undefined;
}
