import{idFragment}from'../../native-import-utils.js';
import{csharpGeneratedCodeLoss}from'./csharpGeneratedCodeLoss.js';import{csharpGeneratedCodeMarker}from'./csharpGeneratedCodeMarker.js';import{csharpRoslynChildEntries}from'./csharpRoslynChildEntries.js';import{csharpRoslynDeclarations}from'./csharpRoslynDeclarations.js';import{csharpRoslynDirectiveKind}from'./csharpRoslynDirectiveKind.js';import{csharpRoslynKind}from'./csharpRoslynKind.js';import{csharpRoslynNodeValue}from'./csharpRoslynNodeValue.js';import{csharpRoslynPositionKind}from'./csharpRoslynPositionKind.js';import{csharpRoslynProblemNode}from'./csharpRoslynProblemNode.js';import{csharpRoslynRecoveredKind}from'./csharpRoslynRecoveredKind.js';import{isCSharpRoslynNode}from'./isCSharpRoslynNode.js';import{nativeNodeId}from'./nativeNodeId.js';import{numberOrUndefined}from'./numberOrUndefined.js';import{primitiveCSharpRoslynFields}from'./primitiveCSharpRoslynFields.js';import{spanFromCSharpRoslynNode}from'./spanFromCSharpRoslynNode.js';
export function visitCSharpRoslynNode(node, context, propertyPath) {
  if (!isCSharpRoslynNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = csharpRoslynKind(node);
  const span = spanFromCSharpRoslynNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of csharpRoslynChildEntries(node, kind)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitCSharpRoslynNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitCSharpRoslynNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = csharpRoslynDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? csharpRoslynNodeValue(node),
    fields: primitiveCSharpRoslynFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      rawKind: numberOrUndefined(node.rawKind ?? node.RawKind),
      positionKind: csharpRoslynPositionKind(node),
      parser: context.options.parser
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (csharpRoslynRecoveredKind(kind) || csharpRoslynProblemNode(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_csharp_roslyn_recovered_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Roslyn reported skipped text, missing syntax, or syntax diagnostics; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (csharpRoslynDirectiveKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_csharp_preprocessor`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'preprocessor',
      message: 'C# preprocessor directive was imported as syntax; conditional compilation state and inactive branches require host evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (csharpGeneratedCodeMarker(node, kind)) {
    context.losses.push(csharpGeneratedCodeLoss(context.input, id, span, context.options, { nodeKind: kind }));
  }
  return id;
}
