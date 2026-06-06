import{uniqueStrings}from'../../native-import-utils.js';
import{kotlinPsiName}from'./kotlinPsiName.js';
export function kotlinPsiAnnotationNames(node) {
  const entries = node.annotationEntries ?? node.annotations ?? node.modifierList?.annotationEntries;
  if (!entries) return [];
  if (Array.isArray(entries)) {
    return uniqueStrings(entries.map((entry) => typeof entry === 'string' ? entry : kotlinPsiName(entry.shortName ?? entry.calleeExpression ?? entry.typeReference ?? entry.name ?? entry)).filter(Boolean));
  }
  return [];
}
