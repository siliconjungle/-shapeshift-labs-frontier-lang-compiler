import{isPythonAstNode}from'./isPythonAstNode.js';import{nativeNodeId}from'./nativeNodeId.js';import{numberOrUndefined}from'./numberOrUndefined.js';import{primitivePythonAstFields}from'./primitivePythonAstFields.js';import{pythonAstChildEntries}from'./pythonAstChildEntries.js';import{pythonAstDeclaration}from'./pythonAstDeclaration.js';import{pythonAstKind}from'./pythonAstKind.js';import{pythonAstNodeValue}from'./pythonAstNodeValue.js';import{spanFromPythonAstNode}from'./spanFromPythonAstNode.js';
export function visitPythonAstNode(node, context, propertyPath) {
  if (!isPythonAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = pythonAstKind(node);
  const span = spanFromPythonAstNode(node, context.input);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of pythonAstChildEntries(node)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitPythonAstNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitPythonAstNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declaration = pythonAstDeclaration(node, kind, id, context.input);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? pythonAstNodeValue(node),
    fields: primitivePythonAstFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      lineno: numberOrUndefined(node.lineno ?? node.line),
      colOffset: numberOrUndefined(node.col_offset ?? node.colOffset),
      endLineno: numberOrUndefined(node.end_lineno ?? node.endLine),
      endColOffset: numberOrUndefined(node.end_col_offset ?? node.endColOffset)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  return id;
}
