import{isSwiftSyntaxNode}from'./isSwiftSyntaxNode.js';
export function swiftSyntaxRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isSwiftSyntaxNode(value)) return value;
  if (isSwiftSyntaxNode(value.ast)) return value.ast;
  if (isSwiftSyntaxNode(value.root)) return value.root;
  if (isSwiftSyntaxNode(value.rootNode)) return value.rootNode;
  if (isSwiftSyntaxNode(value.sourceFile)) return value.sourceFile;
  if (isSwiftSyntaxNode(value.sourceFileSyntax)) return value.sourceFileSyntax;
  if (isSwiftSyntaxNode(value.tree)) return swiftSyntaxRoot(value.tree);
  if (Array.isArray(value.statements) || Array.isArray(value.members) || Array.isArray(value.declarations)) {
    return { kind: 'SourceFile', ...value };
  }
  return undefined;
}
