import{uniqueStrings}from'../../native-import-utils.js';
import{csharpRoslynName}from'./csharpRoslynName.js';
export function csharpRoslynModifierNames(node) {
  const modifiers = node.modifiers ?? node.Modifiers;
  if (!modifiers) return [];
  if (Array.isArray(modifiers)) {
    return uniqueStrings(modifiers.map((entry) => typeof entry === 'string' ? entry : csharpRoslynName(entry) ?? entry.kind).filter(Boolean));
  }
  if (typeof modifiers === 'string') return uniqueStrings(modifiers.split(/\s+/).filter(Boolean));
  if (typeof modifiers === 'object') {
    return uniqueStrings(Object.entries(modifiers)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key));
  }
  return [];
}
