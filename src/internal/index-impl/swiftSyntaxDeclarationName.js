import{swiftSyntaxKind}from'./swiftSyntaxKind.js';import{swiftSyntaxName}from'./swiftSyntaxName.js';import{swiftSyntaxOperatorName}from'./swiftSyntaxOperatorName.js';import{swiftSyntaxPatternName}from'./swiftSyntaxPatternName.js';import{swiftSyntaxTypeName}from'./swiftSyntaxTypeName.js';
export function swiftSyntaxDeclarationName(node, kind = swiftSyntaxKind(node)) {
  if (!node || typeof node !== 'object') return undefined;
  if (kind === 'InitializerDecl') return 'init';
  if (kind === 'DeinitializerDecl') return 'deinit';
  if (kind === 'SubscriptDecl') return 'subscript';
  if (kind === 'ExtensionDecl') {
    const extended = swiftSyntaxTypeName(node.extendedType ?? node.type ?? node.name);
    return extended ? `extension ${extended}` : undefined;
  }
  if (kind === 'OperatorDecl') return swiftSyntaxOperatorName(node, kind);
  for (const key of ['identifier', 'name', 'simpleName', 'typeName', 'id']) {
    const name = swiftSyntaxName(node[key]);
    if (name) return name;
  }
  const patternName = swiftSyntaxPatternName(node.pattern);
  if (patternName) return patternName;
  return undefined;
}
