import{uniqueStrings,upperFirst}from'../../native-import-utils.js';
import{kotlinPsiName}from'./kotlinPsiName.js';
export function kotlinPsiModifiers(node) {
  const raw = node.modifiers ?? node.modifierList?.modifiers ?? node.modifierList?.children;
  const names = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const name = typeof entry === 'string' ? entry : kotlinPsiName(entry) ?? entry?.keyword ?? entry?.tokenType ?? entry?.text;
      if (name) names.push(String(name).toLowerCase());
    }
  } else if (typeof raw === 'string') {
    names.push(...raw.split(/\s+/).filter(Boolean).map((entry) => entry.toLowerCase()));
  } else if (raw && typeof raw === 'object') {
    for (const [key, enabled] of Object.entries(raw)) {
      if (enabled === true) names.push(key.toLowerCase());
    }
  }
  for (const key of ['suspend', 'expect', 'actual', 'inline', 'operator', 'infix', 'tailrec', 'external', 'override', 'data', 'sealed', 'value']) {
    if (node[key] === true || node[`is${upperFirst(key)}`] === true) names.push(key);
  }
  return uniqueStrings(names.map((entry) => entry.replace(/keyword$/i, '').replace(/_keyword$/i, '').replace(/[_\s-]+/g, '').toLowerCase()).filter(Boolean));
}
