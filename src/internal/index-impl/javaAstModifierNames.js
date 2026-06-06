import{uniqueStrings}from'../../native-import-utils.js';
import{javaAstName}from'./javaAstName.js';
export function javaAstModifierNames(node) {
  const modifiers = node.modifiers ?? node.Modifiers ?? node.flags;
  if (!modifiers) return [];
  if (Array.isArray(modifiers)) {
    return uniqueStrings(modifiers.map((entry) => typeof entry === 'string' ? entry : javaAstName(entry) ?? entry.keyword ?? entry.kind).filter(Boolean));
  }
  if (typeof modifiers === 'string') return uniqueStrings(modifiers.split(/\s+/).filter(Boolean));
  if (typeof modifiers === 'object') {
    return uniqueStrings(Object.entries(modifiers)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key));
  }
  return [];
}
