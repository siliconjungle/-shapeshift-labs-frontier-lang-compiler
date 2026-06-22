import{nativeNodeId}from'./nativeNodeId.js';import{numberOrUndefined}from'./numberOrUndefined.js';import{primitiveTypeScriptFields}from'./primitiveTypeScriptFields.js';import{spanFromTypeScriptNode}from'./spanFromTypeScriptNode.js';import{typeScriptDeclaration}from'./typeScriptDeclaration.js';import{typeScriptKindName}from'./typeScriptKindName.js';import{typeScriptNodeValue}from'./typeScriptNodeValue.js';
export function visitTypeScriptAstNode(node, sourceFile, context, propertyPath, ts) {
  if (!node || typeof node !== 'object' || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = typeScriptKindName(node, ts);
  const span = spanFromTypeScriptNode(node, sourceFile);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  const visitChild = (child) => {
    const childId = visitTypeScriptAstNode(child, sourceFile, context, `${propertyPath}.${children.length}`, ts);
    if (childId) children.push(childId);
  };
  if (ts && typeof ts.forEachChild === 'function') {
    ts.forEachChild(node, visitChild);
  } else if (typeof node.forEachChild === 'function') {
    node.forEachChild(visitChild);
  } else if (Array.isArray(node.children)) {
    node.children.forEach(visitChild);
  }
  const declaration = typeScriptDeclaration(node, kind, id, context.input, context.options);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? typeScriptNodeValue(node),
    fields: primitiveTypeScriptFields(node, kind),
    children,
    metadata: {
      ...declaration?.metadata,
      astFormat: context.options.astFormat,
      propertyPath,
      pos: numberOrUndefined(node.pos),
      end: numberOrUndefined(node.end)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  return id;
}
