export function nativeImportSourcePreservationRecord(imported) {
  return imported?.metadata?.sourcePreservation
    ?? imported?.nativeSource?.metadata?.sourcePreservation
    ?? imported?.nativeAst?.metadata?.sourcePreservation
    ?? imported?.universalAst?.metadata?.sourcePreservation;
}
