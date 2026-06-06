import{idFragment}from'../../native-import-utils.js';
import{isKotlinPsiNode}from'./isKotlinPsiNode.js';import{kotlinCompilerPluginAnnotationNode}from'./kotlinCompilerPluginAnnotationNode.js';import{kotlinContractNode}from'./kotlinContractNode.js';import{kotlinCoroutineNode}from'./kotlinCoroutineNode.js';import{kotlinExpectActualNode}from'./kotlinExpectActualNode.js';import{kotlinGeneratedCodeLoss}from'./kotlinGeneratedCodeLoss.js';import{kotlinGeneratedCodeMarker}from'./kotlinGeneratedCodeMarker.js';import{kotlinPsiAnnotationNames}from'./kotlinPsiAnnotationNames.js';import{kotlinPsiChildEntries}from'./kotlinPsiChildEntries.js';import{kotlinPsiDeclarations}from'./kotlinPsiDeclarations.js';import{kotlinPsiKind}from'./kotlinPsiKind.js';import{kotlinPsiNodeValue}from'./kotlinPsiNodeValue.js';import{kotlinPsiPositionKind}from'./kotlinPsiPositionKind.js';import{kotlinPsiProblemNode}from'./kotlinPsiProblemNode.js';import{kotlinPsiRecoveredKind}from'./kotlinPsiRecoveredKind.js';import{kotlinUnsupportedSemanticLoss}from'./kotlinUnsupportedSemanticLoss.js';import{nativeNodeId}from'./nativeNodeId.js';import{primitiveKotlinPsiFields}from'./primitiveKotlinPsiFields.js';import{spanFromKotlinPsiNode}from'./spanFromKotlinPsiNode.js';
export function visitKotlinPsiNode(node, context, propertyPath) {
  if (!isKotlinPsiNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = kotlinPsiKind(node);
  const span = spanFromKotlinPsiNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of kotlinPsiChildEntries(node, kind)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitKotlinPsiNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitKotlinPsiNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = kotlinPsiDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? kotlinPsiNodeValue(node),
    fields: primitiveKotlinPsiFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      positionKind: kotlinPsiPositionKind(node),
      parser: context.options.parser
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (kotlinPsiRecoveredKind(kind) || kotlinPsiProblemNode(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_kotlin_psi_recovered_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Kotlin PSI reported an error or recovered syntax node; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (kotlinExpectActualNode(node, kind)) {
    context.losses.push(kotlinUnsupportedSemanticLoss(context.input, id, span, context.options, {
      nodeKind: kind,
      feature: 'expect-actual',
      message: 'Kotlin expect/actual syntax was imported; matching platform declarations requires multiplatform build evidence.'
    }));
  }
  if (kotlinCoroutineNode(node, kind)) {
    context.losses.push(kotlinUnsupportedSemanticLoss(context.input, id, span, context.options, {
      nodeKind: kind,
      feature: 'coroutine',
      message: 'Kotlin coroutine syntax was imported; suspend lowering, scheduling, and effect semantics require host compiler/runtime evidence.'
    }));
  }
  if (kotlinContractNode(kind)) {
    context.losses.push(kotlinUnsupportedSemanticLoss(context.input, id, span, context.options, {
      nodeKind: kind,
      feature: 'contract',
      message: 'Kotlin contract syntax was imported; data-flow effects require Analysis API or compiler evidence.'
    }));
  }
  if (kotlinCompilerPluginAnnotationNode(node, kind) && !context.options.compilerPluginEvidence) {
    context.losses.push({
      id: `loss_${idFragment(id)}_kotlin_compiler_plugin_semantics`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'metaprogramming',
      message: 'Kotlin compiler-plugin-style annotation was imported; generated declarations and transformed semantics require compiler plugin evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind,
        annotations: kotlinPsiAnnotationNames(node)
      }
    });
  }
  if (kotlinGeneratedCodeMarker(node, kind)) {
    context.losses.push(kotlinGeneratedCodeLoss(context.input, id, span, context.options, { nodeKind: kind }));
  }
  return id;
}
