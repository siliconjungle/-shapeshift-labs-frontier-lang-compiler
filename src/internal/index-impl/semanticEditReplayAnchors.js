import { afterLineOffset, spanOffsets } from './semanticEditSourceRanges.js';

export function findCurrentSymbol(edit, symbols) {
  const exact = symbols.find((symbol) => [symbol.ownershipKey, symbol.key, symbol.id].some((key) => key && [
    edit.anchorKey,
    edit.targetAnchorKey,
    edit.symbolId
  ].includes(key)));
  if (exact) return exact;
  const name = edit.targetSymbolName ?? edit.symbolName;
  const kind = edit.targetSymbolKind ?? edit.symbolKind;
  return symbols.find((symbol) => symbol.name === name && (!kind || symbol.kind === kind));
}

export function findInsertionAnchor(edit, symbols) {
  for (const candidate of insertionAnchorCandidates(edit)) {
    const symbol = findInsertionAnchorSymbol(candidate, symbols);
    if (symbol) return { candidate, symbol };
  }
  return undefined;
}

export function insertionAnchorCandidates(edit) {
  const primary = {
    mode: edit.insertionMode,
    anchorKey: edit.insertionAnchorKey,
    anchorSymbolName: edit.insertionAnchorSymbolName,
    anchorSymbolKind: edit.insertionAnchorSymbolKind
  };
  const seen = new Set();
  const result = [];
  for (const candidate of [primary, ...(Array.isArray(edit.insertionAnchorCandidates) ? edit.insertionAnchorCandidates : [])]) {
    if (!candidate || (candidate.mode !== 'before' && candidate.mode !== 'after')) continue;
    const key = [candidate.mode, candidate.anchorKey, candidate.anchorSymbolId, candidate.anchorSymbolName, candidate.anchorSymbolKind].join('\0');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

export function hasSymbolAnchorIdentity(candidate) {
  return Boolean(candidate.anchorKey || candidate.anchorSymbolId || candidate.anchorSymbolName);
}

export function insertionRange(edit, candidate, anchor, sourceText) {
  if (edit.insertionMode === 'file-start') return { start: 0, end: 0 };
  if (edit.insertionMode === 'file-end') return { start: sourceText.length, end: sourceText.length };
  const mode = candidate?.mode ?? edit.insertionMode;
  const anchorRange = spanOffsets(sourceText, anchor?.sourceSpan);
  if (!anchorRange) return undefined;
  if (mode === 'before') return { start: anchorRange.start, end: anchorRange.start };
  if (mode === 'after') {
    return { start: afterLineOffset(sourceText, anchorRange.end), end: afterLineOffset(sourceText, anchorRange.end) };
  }
  return undefined;
}

function findInsertionAnchorSymbol(candidate, symbols) {
  const keys = [candidate.anchorKey, candidate.anchorSymbolId].filter(Boolean);
  return symbols.find((symbol) => [symbol.ownershipKey, symbol.key, symbol.id].some((key) => key && keys.includes(key)))
    ?? symbols.find((symbol) => symbol.name === candidate.anchorSymbolName && (!candidate.anchorSymbolKind || symbol.kind === candidate.anchorSymbolKind));
}
