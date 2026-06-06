import{idFragment}from'../../native-import-utils.js';
import{isSwiftSyntaxNode}from'./isSwiftSyntaxNode.js';import{nativeNodeId}from'./nativeNodeId.js';import{primitiveSwiftSyntaxFields}from'./primitiveSwiftSyntaxFields.js';import{spanFromSwiftSyntaxNode}from'./spanFromSwiftSyntaxNode.js';import{swiftGeneratedCodeLoss}from'./swiftGeneratedCodeLoss.js';import{swiftGeneratedCodeMarker}from'./swiftGeneratedCodeMarker.js';import{swiftSyntaxChildEntries}from'./swiftSyntaxChildEntries.js';import{swiftSyntaxConditionalCompilationKind}from'./swiftSyntaxConditionalCompilationKind.js';import{swiftSyntaxDeclarations}from'./swiftSyntaxDeclarations.js';import{swiftSyntaxKind}from'./swiftSyntaxKind.js';import{swiftSyntaxMacroKind}from'./swiftSyntaxMacroKind.js';import{swiftSyntaxNodeValue}from'./swiftSyntaxNodeValue.js';import{swiftSyntaxPositionKind}from'./swiftSyntaxPositionKind.js';import{swiftSyntaxProblemNode}from'./swiftSyntaxProblemNode.js';import{swiftSyntaxRecoveredKind}from'./swiftSyntaxRecoveredKind.js';
export function visitSwiftSyntaxNode(node, context, propertyPath) {
  if (!isSwiftSyntaxNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = swiftSyntaxKind(node);
  const span = spanFromSwiftSyntaxNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of swiftSyntaxChildEntries(node, kind)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitSwiftSyntaxNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitSwiftSyntaxNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = swiftSyntaxDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? swiftSyntaxNodeValue(node),
    fields: primitiveSwiftSyntaxFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      positionKind: swiftSyntaxPositionKind(node),
      parser: context.options.parser
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (swiftSyntaxRecoveredKind(kind) || swiftSyntaxProblemNode(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_swift_syntax_recovered_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'SwiftSyntax reported missing, unexpected, skipped, or error syntax; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (swiftSyntaxConditionalCompilationKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_swift_conditional_compilation`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'conditionalCompilation',
      message: 'Swift conditional compilation syntax was imported; active branch selection and inactive branch source ownership require host build-setting evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (swiftSyntaxMacroKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_swift_macro_expansion`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'macroExpansion',
      message: 'Swift macro syntax was imported, but expansion, generated declarations, and binding effects require host macro-expansion evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (swiftGeneratedCodeMarker(node, kind)) {
    context.losses.push(swiftGeneratedCodeLoss(context.input, id, span, context.options, { nodeKind: kind }));
  }
  return id;
}
