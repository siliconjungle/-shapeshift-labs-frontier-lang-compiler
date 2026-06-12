import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { spanOffsets } from './semanticEditSourceRanges.js';

export function alreadyAppliedImportEditForOperation(operation, identity, spanText, headSourceText, workerOffsets, order, context) {
  if (!isAddImportOperation(operation) || typeof headSourceText !== 'string') return undefined;
  const match = findHeadImportSymbol(operation, context.headSymbols);
  const range = spanOffsets(headSourceText, match?.symbol?.sourceSpan);
  if (!range) return undefined;
  const current = headSourceText.slice(range.start, range.end);
  if (!headImportMatchesOperation(operation, spanText, current, match.symbol)) return undefined;
  return {
    operationId: operation.id,
    order,
    ...identity,
    start: range.start,
    end: range.end,
    workerStart: workerOffsets.start,
    workerEnd: workerOffsets.end,
    replacement: current,
    replacementSpanText: spanText,
    current,
    alreadyApplied: true
  };
}

function findHeadImportSymbol(operation, symbols) {
  const symbolList = Array.isArray(symbols) ? symbols : [];
  const exactKeys = [
    operation.anchor?.key,
    operation.anchor?.symbolId,
    operation.insertion?.insertedSymbolId
  ].filter(Boolean);
  const exact = symbolList.find((symbol) => [symbol.ownershipKey, symbol.key, symbol.id].some((key) => key && exactKeys.includes(key)));
  if (exact) return { symbol: exact, exact: true };
  const name = operation.insertion?.insertedSymbolName ?? operation.anchor?.symbolName;
  const kind = operation.insertion?.insertedSymbolKind ?? operation.anchor?.symbolKind;
  const semantic = symbolList.find((symbol) => symbol.name === name && (!kind || symbol.kind === kind));
  return semantic ? { symbol: semantic, exact: false } : undefined;
}

function headImportMatchesOperation(operation, spanText, current, symbol) {
  const workerTextHash = operation.hashes?.workerTextHash ?? hashSemanticValue(spanText);
  const workerSpanHash = operation.hashes?.workerSpanHash ?? workerTextHash;
  const currentHash = hashSemanticValue(current);
  if ([workerTextHash, workerSpanHash].includes(currentHash)) return true;
  if ([workerTextHash, workerSpanHash].includes(symbol?.spanHash)) return true;
  const signatureHash = operation.hashes?.afterSignatureHash;
  return Boolean(signatureHash && symbol?.signatureHash === signatureHash);
}

function isAddImportOperation(operation) {
  return operation?.kind === 'addImport' || (operation?.changeKind === 'added' && operation?.anchor?.regionKind === 'import');
}
