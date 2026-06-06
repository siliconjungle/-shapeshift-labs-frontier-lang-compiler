import{maxSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{nativeDiffSymbolChanged}from'./nativeDiffSymbolChanged.js';
export function diffNativeSymbols(beforeSymbols, afterSymbols) {
  const keys = uniqueStrings([...beforeSymbols.keys(), ...afterSymbols.keys()]).sort();
  const changed = [];
  for (const key of keys) {
    const before = beforeSymbols.get(key);
    const after = afterSymbols.get(key);
    const changeKind = !before ? 'added' : !after ? 'removed' : nativeDiffSymbolChanged(before, after) ? 'modified' : 'unchanged';
    if (changeKind === 'unchanged') continue;
    const current = after ?? before;
    changed.push({
      changeKind,
      key,
      id: current.id,
      name: current.name,
      kind: current.kind,
      language: current.language,
      nativeAstNodeId: current.nativeAstNodeId,
      semanticOccurrenceId: current.semanticOccurrenceId,
      sourceMapMappingId: current.sourceMapMappingId,
      sourceSpan: current.sourceSpan,
      beforeSignatureHash: before?.signatureHash,
      afterSignatureHash: after?.signatureHash,
      beforeSpanHash: before?.spanHash,
      afterSpanHash: after?.spanHash,
      beforeNativeAstNodeId: before?.nativeAstNodeId,
      afterNativeAstNodeId: after?.nativeAstNodeId,
      beforeSourceSpan: before?.sourceSpan,
      afterSourceSpan: after?.sourceSpan,
      beforeOwnershipKey: before?.ownershipKey,
      afterOwnershipKey: after?.ownershipKey,
      ownershipRegionId: current.ownershipRegionId,
      ownershipKey: current.ownershipKey,
      ownershipRegionKind: current.ownershipRegionKind,
      conflictKey: current.ownershipKey ? `region:${current.ownershipKey}` : `symbol:${current.id ?? key}`,
      readiness: maxSemanticMergeReadiness(before?.readiness ?? 'ready', after?.readiness ?? 'ready')
    });
  }
  return changed;
}
