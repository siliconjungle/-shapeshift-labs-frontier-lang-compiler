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
  return downgradeCoveredContainerSymbols(changed);
}

function downgradeCoveredContainerSymbols(symbols) {
  return symbols.filter((symbol) => !nativeDiffContainerCoveredByMorePreciseChange(symbol, symbols));
}

function nativeDiffContainerCoveredByMorePreciseChange(symbol, symbols) {
  if (symbol.changeKind !== 'modified') return false;
  if (!nativeDiffSymbolIsContainer(symbol)) return false;
  if (nativeDiffSymbolHasOwnChange(symbol)) return false;
  return symbols.some((candidate) => candidate !== symbol && nativeDiffSymbolIsMorePreciseNestedChange(candidate, symbol));
}

function nativeDiffSymbolHasOwnChange(symbol) {
  return ((symbol.beforeSignatureHash ?? '') !== (symbol.afterSignatureHash ?? ''))
    || ((symbol.beforeOwnershipKey ?? '') !== (symbol.afterOwnershipKey ?? ''))
    || ((symbol.beforeNativeAstNodeId ?? '') !== (symbol.afterNativeAstNodeId ?? ''));
}

function nativeDiffSymbolIsMorePreciseNestedChange(candidate, container) {
  if (candidate.changeKind === 'unchanged') return false;
  if (nativeDiffSymbolIsContainer(candidate) && !nativeDiffSymbolIsMember(candidate)) return false;
  if ((candidate.ownershipKey ?? '') === (container.ownershipKey ?? '')) return false;
  if (!nativeDiffAnySpanContains(container, candidate)) return false;
  return nativeDiffNestedSymbolName(candidate, container) || nativeDiffSymbolIsMember(candidate);
}

function nativeDiffSymbolIsContainer(symbol) {
  return nativeDiffContainerKinds.has(nativeDiffKind(symbol.ownershipRegionKind ?? symbol.kind));
}

function nativeDiffSymbolIsMember(symbol) {
  return nativeDiffMemberKinds.has(nativeDiffKind(symbol.ownershipRegionKind ?? symbol.kind));
}

function nativeDiffNestedSymbolName(candidate, container) {
  const candidateName = String(candidate.name ?? '');
  const containerName = String(container.name ?? '');
  return Boolean(containerName && candidateName && candidateName !== containerName && candidateName.startsWith(`${containerName}.`));
}

function nativeDiffAnySpanContains(container, candidate) {
  return nativeDiffSymbolSpans(container).some((containerSpan) => nativeDiffSymbolSpans(candidate).some((candidateSpan) => (
    nativeDiffSameSourcePath(candidateSpan, containerSpan) && nativeDiffSpanContains(containerSpan, candidateSpan)
  )));
}

function nativeDiffSymbolSpans(symbol) {
  return [symbol.sourceSpan, symbol.beforeSourceSpan, symbol.afterSourceSpan].filter(Boolean);
}

function nativeDiffSameSourcePath(left, right) {
  const leftPath = left?.path;
  const rightPath = right?.path;
  return !leftPath || !rightPath || leftPath === rightPath;
}

function nativeDiffSpanContains(containerSpan, candidateSpan) {
  const container = nativeDiffSpanRange(containerSpan);
  const candidate = nativeDiffSpanRange(candidateSpan);
  if (!container || !candidate) return false;
  return container.start <= candidate.start && candidate.end <= container.end && (container.start !== candidate.start || container.end !== candidate.end);
}

function nativeDiffSpanRange(span) {
  const startLine = Number(span?.startLine ?? span?.line ?? span?.start?.line);
  const endLine = Number(span?.endLine ?? span?.end?.line ?? startLine);
  if (!Number.isFinite(startLine) || !Number.isFinite(endLine)) return undefined;
  const startColumn = Number(span?.startColumn ?? span?.column ?? span?.start?.column ?? 0);
  const endColumn = Number(span?.endColumn ?? span?.end?.column ?? startColumn);
  return {
    start: startLine * 100000 + (Number.isFinite(startColumn) ? startColumn : 0),
    end: endLine * 100000 + Math.max(Number.isFinite(startColumn) ? startColumn : 0, Number.isFinite(endColumn) ? endColumn : 0)
  };
}

function nativeDiffKind(value) {
  return String(value ?? '').toLowerCase();
}

const nativeDiffContainerKinds = new Set(['type', 'class', 'interface', 'trait', 'protocol', 'struct', 'enum', 'record', 'body', 'function', 'method', 'export']);
const nativeDiffMemberKinds = new Set(['body', 'method', 'function', 'property', 'declaration', 'call', 'effect', 'controlflow', 'mutation']);
