import{uniqueStrings}from'../../native-import-utils.js';
import{swiftSyntaxName}from'./swiftSyntaxName.js';
export function swiftSyntaxModifierNames(node) {
  const modifiers = node.modifiers ?? node.Modifiers;
  if (!modifiers) return [];
  if (Array.isArray(modifiers)) {
    return uniqueStrings(modifiers.map((entry) => typeof entry === 'string' ? entry : swiftSyntaxName(entry.name ?? entry.modifier ?? entry)).filter(Boolean));
  }
  if (typeof modifiers === 'string') return uniqueStrings(modifiers.split(/\s+/).filter(Boolean));
  if (typeof modifiers === 'object') {
    return uniqueStrings(Object.entries(modifiers)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key));
  }
  return [];
}
