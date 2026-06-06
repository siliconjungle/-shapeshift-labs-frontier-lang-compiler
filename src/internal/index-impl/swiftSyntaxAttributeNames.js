import{uniqueStrings}from'../../native-import-utils.js';
import{swiftSyntaxName}from'./swiftSyntaxName.js';
export function swiftSyntaxAttributeNames(node) {
  const attributes = node.attributes ?? node.attributeList;
  if (!attributes) return [];
  if (Array.isArray(attributes)) {
    return uniqueStrings(attributes.map((entry) => typeof entry === 'string' ? entry : swiftSyntaxName(entry.attributeName ?? entry.name ?? entry)).filter(Boolean));
  }
  return [];
}
