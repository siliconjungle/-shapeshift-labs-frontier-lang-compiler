import{normalizeSwiftSyntaxKind}from'./normalizeSwiftSyntaxKind.js';
export function swiftSyntaxKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node.syntaxKind ?? node.SyntaxKind ?? node._syntaxKind ?? node._type ?? node.type ?? node.nodeType;
  if (typeof declared === 'string') return normalizeSwiftSyntaxKind(declared);
  if (Array.isArray(node.statements) || Array.isArray(node.members) || Array.isArray(node.declarations)) return 'SourceFile';
  if (node.identifier && (node.memberBlock || node.members || node.genericParameterClause || node.inheritanceClause)) return 'ClassDecl';
  if (node.signature && node.body) return 'FunctionDecl';
  if (node.importPath || node.path) return 'ImportDecl';
  return undefined;
}
