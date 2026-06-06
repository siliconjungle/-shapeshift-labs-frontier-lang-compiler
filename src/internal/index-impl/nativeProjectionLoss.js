export function nativeProjectionLoss(context, input) {
  const rootSpan = context.nativeAst?.nodes?.[context.nativeAst.rootId]?.span;
  return {
    id: input.id,
    severity: input.severity,
    phase: 'emit',
    sourceFormat: context.language,
    kind: input.kind,
    message: input.message,
    span: rootSpan ?? {
      sourceId: context.sourceHash,
      path: context.sourcePath,
      startLine: 1,
      startColumn: 1
    },
    metadata: {
      nativeSourceId: context.nativeSource?.id,
      nativeAstId: context.nativeAst?.id,
      parser: context.parser,
      ...input.metadata
    }
  };
}
