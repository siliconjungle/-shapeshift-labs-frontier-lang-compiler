import{idFragment}from'../../native-import-utils.js';
import{clangAstChildEntries}from'./clangAstChildEntries.js';import{clangAstDeclaration}from'./clangAstDeclaration.js';import{clangAstKind}from'./clangAstKind.js';import{clangAstNodeValue}from'./clangAstNodeValue.js';import{clangLocationKind}from'./clangLocationKind.js';import{clangPreprocessorKind}from'./clangPreprocessorKind.js';import{isClangAstNode}from'./isClangAstNode.js';import{nativeNodeId}from'./nativeNodeId.js';import{primitiveClangAstFields}from'./primitiveClangAstFields.js';import{spanFromClangAstNode}from'./spanFromClangAstNode.js';
export function visitClangAstNode(node, context, propertyPath) {
  if (!isClangAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = clangAstKind(node);
  const span = spanFromClangAstNode(node, context.input);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of clangAstChildEntries(node)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitClangAstNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitClangAstNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declaration = clangAstDeclaration(node, kind, id, context.input);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? clangAstNodeValue(node),
    fields: primitiveClangAstFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      clangId: typeof node.id === 'string' || typeof node.id === 'number' ? String(node.id) : undefined,
      locationKind: clangLocationKind(node)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  if (clangPreprocessorKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_clang_preprocessor`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'preprocessor',
      message: 'Clang AST preprocessor records were imported, but macro expansion, inactive branches, and compile-command provenance require host evidence.',
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
