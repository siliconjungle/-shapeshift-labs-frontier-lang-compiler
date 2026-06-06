import{idFragment}from'../../native-import-utils.js';
import{goAstChildEntries}from'./goAstChildEntries.js';import{goAstDeclarations}from'./goAstDeclarations.js';import{goAstKind}from'./goAstKind.js';import{goAstNodeValue}from'./goAstNodeValue.js';import{goAstPositionKind}from'./goAstPositionKind.js';import{goBadAstKind}from'./goBadAstKind.js';import{goGeneratedCodeMarker}from'./goGeneratedCodeMarker.js';import{goReceiverFieldCount}from'./goReceiverFieldCount.js';import{isGoAstNode}from'./isGoAstNode.js';import{nativeNodeId}from'./nativeNodeId.js';import{primitiveGoAstFields}from'./primitiveGoAstFields.js';import{spanFromGoAstNode}from'./spanFromGoAstNode.js';
export function visitGoAstNode(node, context, propertyPath) {
  if (!isGoAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = goAstKind(node);
  const span = spanFromGoAstNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of goAstChildEntries(node)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitGoAstNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitGoAstNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = goAstDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? goAstNodeValue(node),
    fields: primitiveGoAstFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      positionKind: goAstPositionKind(node),
      packageName: context.options.packageName
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (goBadAstKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_go_bad_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Go parser recovered a BadDecl/BadExpr/BadStmt node; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (kind === 'FuncDecl' && goReceiverFieldCount(node) > 1) {
    context.losses.push({
      id: `loss_${idFragment(id)}_go_multiple_receivers`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Go parser accepted multiple receiver fields; valid method ownership requires a single receiver.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        receiverFieldCount: goReceiverFieldCount(node)
      }
    });
  }
  if (goGeneratedCodeMarker(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_go_generated_code`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'generatedCode',
      message: 'Go generated-code marker was imported; regeneration provenance and source ownership require host evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat
      }
    });
  }
  return id;
}
