export function sourcePreservationFromProjectionContext(context) {
  return context.sourcePreservation
    ?? context.metadata?.sourcePreservation
    ?? context.importResult?.metadata?.sourcePreservation
    ?? context.importResult?.nativeSource?.metadata?.sourcePreservation
    ?? context.importResult?.nativeAst?.metadata?.sourcePreservation
    ?? context.nativeSource?.metadata?.sourcePreservation
    ?? context.nativeAst?.metadata?.sourcePreservation
    ?? context.nativeSource?.ast?.metadata?.sourcePreservation
    ?? context.universalAst?.metadata?.sourcePreservation
    ?? context.importResult?.universalAst?.metadata?.sourcePreservation;
}
