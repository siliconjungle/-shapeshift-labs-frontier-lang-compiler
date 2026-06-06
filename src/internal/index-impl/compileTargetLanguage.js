export function compileTargetLanguage(target) {
  if (!target) return undefined;
  if (typeof target === 'string') return target;
  return target.language ?? target.emitLanguage ?? target.target ?? target.name;
}
