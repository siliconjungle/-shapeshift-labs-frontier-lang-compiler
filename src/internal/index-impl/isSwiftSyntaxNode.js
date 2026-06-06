import{swiftSyntaxKind}from'./swiftSyntaxKind.js';
export function isSwiftSyntaxNode(value) {
  return Boolean(value && typeof value === 'object' && typeof swiftSyntaxKind(value) === 'string');
}
