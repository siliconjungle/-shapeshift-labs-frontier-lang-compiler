import{idFragment}from'../../native-import-utils.js';
import{isJavaAstNode}from'./isJavaAstNode.js';import{javaAstChildEntries}from'./javaAstChildEntries.js';import{javaAstDeclarations}from'./javaAstDeclarations.js';import{javaAstKind}from'./javaAstKind.js';import{javaAstNodeValue}from'./javaAstNodeValue.js';import{javaAstPositionKind}from'./javaAstPositionKind.js';import{javaGeneratedCodeLoss}from'./javaGeneratedCodeLoss.js';import{javaGeneratedCodeMarker}from'./javaGeneratedCodeMarker.js';import{javaLombokAnnotationMarker}from'./javaLombokAnnotationMarker.js';import{javaProblemNode}from'./javaProblemNode.js';import{javaRecoveredAstKind}from'./javaRecoveredAstKind.js';import{nativeNodeId}from'./nativeNodeId.js';import{primitiveJavaAstFields}from'./primitiveJavaAstFields.js';import{spanFromJavaAstNode}from'./spanFromJavaAstNode.js';
export function visitJavaAstNode(node, context, propertyPath) {
  if (!isJavaAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = javaAstKind(node);
  const span = spanFromJavaAstNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of javaAstChildEntries(node, kind)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitJavaAstNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitJavaAstNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = javaAstDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? javaAstNodeValue(node),
    fields: primitiveJavaAstFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      positionKind: javaAstPositionKind(node),
      parser: context.options.parser
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (javaRecoveredAstKind(kind) || javaProblemNode(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_java_recovered_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Java parser reported a recovered, erroneous, malformed, or problem node; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (javaGeneratedCodeMarker(node, kind) || javaLombokAnnotationMarker(node, kind)) {
    context.losses.push(javaGeneratedCodeLoss(context.input, id, span, context.options, {
      nodeKind: kind,
      generatedMarker: javaGeneratedCodeMarker(node, kind),
      lombokMarker: javaLombokAnnotationMarker(node, kind)
    }));
  }
  return id;
}
