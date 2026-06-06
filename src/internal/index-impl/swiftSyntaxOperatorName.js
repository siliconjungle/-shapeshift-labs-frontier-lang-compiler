import{swiftSyntaxDeclarationName}from'./swiftSyntaxDeclarationName.js';import{swiftSyntaxName}from'./swiftSyntaxName.js';
export function swiftSyntaxOperatorName(node, kind) {
  if (kind === 'PrecedenceGroupDecl') return swiftSyntaxDeclarationName(node) ?? 'precedencegroup';
  const operatorToken = swiftSyntaxName(node.operatorIdentifier ?? node.operatorToken ?? node.name);
  return operatorToken ? `operator ${operatorToken}` : undefined;
}
