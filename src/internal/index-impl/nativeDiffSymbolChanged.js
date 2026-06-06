export function nativeDiffSymbolChanged(before, after) {
  if ((before.signatureHash ?? '') !== (after.signatureHash ?? '')) return true;
  if ((before.spanHash ?? '') !== (after.spanHash ?? '')) return true;
  if ((before.ownershipKey ?? '') !== (after.ownershipKey ?? '')) return true;
  if ((before.nativeAstNodeId ?? '') !== (after.nativeAstNodeId ?? '')) return true;
  return false;
}
