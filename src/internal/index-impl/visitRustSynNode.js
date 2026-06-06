import{idFragment}from'../../native-import-utils.js';
import{isRustSynAstNode}from'./isRustSynAstNode.js';import{nativeNodeId}from'./nativeNodeId.js';import{primitiveRustSynFields}from'./primitiveRustSynFields.js';import{rustSynChildEntries}from'./rustSynChildEntries.js';import{rustSynDeclaration}from'./rustSynDeclaration.js';import{rustSynKind}from'./rustSynKind.js';import{rustSynMacroKind}from'./rustSynMacroKind.js';import{rustSynNodeValue}from'./rustSynNodeValue.js';import{rustSynPayload}from'./rustSynPayload.js';import{rustSynSpanKind}from'./rustSynSpanKind.js';import{spanFromRustSynNode}from'./spanFromRustSynNode.js';
export function visitRustSynNode(node, context, propertyPath) {
  if (!isRustSynAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = rustSynKind(node);
  const payload = rustSynPayload(node);
  const span = spanFromRustSynNode(payload, context.input);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of rustSynChildEntries(node)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitRustSynNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitRustSynNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declaration = rustSynDeclaration(payload, kind, id, context.input);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? rustSynNodeValue(payload),
    fields: primitiveRustSynFields(payload, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      spanKind: rustSynSpanKind(payload)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  if (rustSynMacroKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_rust_macro_expansion`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'macroExpansion',
      message: 'Rust macro syntax was parsed but macro expansion and generated items require host compiler evidence.',
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
