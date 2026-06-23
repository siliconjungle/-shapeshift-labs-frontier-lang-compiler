import{ignoredSyntaxField}from'./ignoredSyntaxField.js';import{isSyntaxAstNode}from'./isSyntaxAstNode.js';import{literalSyntaxValue}from'./literalSyntaxValue.js';import{nativeNodeId}from'./nativeNodeId.js';import{numberOrUndefined}from'./numberOrUndefined.js';import{primitiveSyntaxFields}from'./primitiveSyntaxFields.js';import{spanFromLoc}from'./spanFromLoc.js';import{syntaxDeclaration}from'./syntaxDeclaration.js';
export function visitSyntaxAstNode(node, context, propertyPath) {
  if (!isSyntaxAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const id = nativeNodeId(context, node.type ?? node.kind ?? 'Node', node.loc, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  const fields = primitiveSyntaxFields(node);
  for (const [key, value] of Object.entries(node)) {
    if (ignoredSyntaxField(key)) continue;
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitSyntaxAstNode(entry, context, `${propertyPath}.${key}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitSyntaxAstNode(value, context, `${propertyPath}.${key}`);
      if (childId) children.push(childId);
    }
  }
  const declarationResult = syntaxDeclaration(node, id, context.input, context.options);
  const declarations = Array.isArray(declarationResult) ? declarationResult.filter(Boolean) : declarationResult ? [declarationResult] : [];
  const primaryDeclaration = declarations[0];
  const nativeNode = {
    id,
    kind: String(node.type ?? node.kind ?? 'Node'),
    languageKind: `${context.input.language}.${node.type ?? node.kind ?? 'Node'}`,
    span: spanFromLoc(node.loc, context.input),
    value: primaryDeclaration?.name ?? literalSyntaxValue(node),
    fields,
    children,
    metadata: {
      ...primaryDeclaration?.metadata,
      ...(declarations.length > 1 ? { declarationCount: declarations.length } : {}),
      astFormat: context.options.astFormat,
      propertyPath,
      start: numberOrUndefined(node.start),
      end: numberOrUndefined(node.end),
      range: Array.isArray(node.range) ? node.range.slice(0, 2) : undefined
    }
  };
  context.nodes[id] = nativeNode;
  for (const declaration of declarations) context.declarations.push({ ...declaration, nativeNode });
  return id;
}
