export function sourcePreservationFromProjectionContext(context) {
  return context.nativeSource?.metadata?.sourcePreservation
    ?? context.nativeAst?.metadata?.sourcePreservation
    ?? context.nativeSource?.ast?.metadata?.sourcePreservation;
}
