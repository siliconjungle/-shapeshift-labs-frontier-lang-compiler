export function pythonTargetName(target) {
  if (!target) return undefined;
  if (typeof target === 'string') return target;
  if (typeof target.id === 'string') return target.id;
  if (typeof target.name === 'string') return target.name;
  if (typeof target.arg === 'string') return target.arg;
  if (target.attr && target.value) {
    const base = pythonTargetName(target.value);
    return base ? `${base}.${target.attr}` : target.attr;
  }
  return undefined;
}
