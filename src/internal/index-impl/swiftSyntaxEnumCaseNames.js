import{swiftSyntaxDeclarationName}from'./swiftSyntaxDeclarationName.js';
export function swiftSyntaxEnumCaseNames(node) {
  const elements = node.elements ?? node.caseElements ?? node.cases;
  if (Array.isArray(elements)) return elements.map((entry) => swiftSyntaxDeclarationName(entry, 'EnumCaseElement')).filter(Boolean);
  const name = swiftSyntaxDeclarationName(node);
  return name ? [name] : [];
}
