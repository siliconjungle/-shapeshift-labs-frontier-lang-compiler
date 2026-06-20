import { uniqueStrings } from './native-import-utils.js';
import { array, compactRecord, firstString, keysForAffected, keysForChange, normalizeChangeKind, numberOrUndefined, numberValue, strings } from './js-ts-semantic-conflict-sidecar-utils.js';

export function normalizedChanges(input, context) {
  return [
    ...array(input.changes),
    ...array(input.operations),
    ...array(input.edits),
    ...array(input.left?.changes).map((change) => ({ ...change, side: change.side ?? 'left' })),
    ...array(input.left?.operations).map((change) => ({ ...change, side: change.side ?? 'left' })),
    ...array(input.right?.changes).map((change) => ({ ...change, side: change.side ?? 'right' })),
    ...array(input.right?.operations).map((change) => ({ ...change, side: change.side ?? 'right' }))
  ].map((change, index) => normalizeChange(change, context, `change_${index + 1}`));
}

export function normalizeChange(change, context, fallbackId) {
  const anchor = change.anchor ?? {};
  const insertion = change.insertion ?? {};
  const spans = change.spans ?? {};
  const sourcePath = firstString(
    change.sourcePath,
    change.originalSourcePath,
    change.targetSourcePath,
    anchor.sourcePath,
    insertion.sourcePath,
    insertion.insertedSourcePath,
    context.sourcePath
  );
  const span = normalizeSpan(
    change.sourceSpan
      ?? change.span
      ?? change.range
      ?? spans.head
      ?? spans.worker
      ?? spans.base
      ?? anchor.sourceSpan
      ?? insertion.insertedSourceSpan
      ?? insertion.baseSpan
      ?? insertion.headSpan,
    sourcePath
  );
  const key = firstString(
    change.conflictKey,
    change.regionKey,
    change.key,
    change.semanticKey,
    change.anchorKey,
    anchor.conflictKey,
    anchor.key,
    anchor.regionId,
    insertion.anchorKey
  );
  const listKey = firstString(change.listKey, change.orderedListKey, change.containerKey, change.parentKey, change.orderingKey);
  return {
    raw: change,
    id: firstString(change.id, change.operationId, fallbackId),
    side: firstString(change.side, change.author, change.branch, change.source, fallbackId),
    changeKind: normalizeChangeKind(change.changeKind ?? change.kind ?? change.editKind ?? change.op),
    sourcePath,
    span,
    key,
    regionKey: firstString(change.regionKey, anchor.regionId, key),
    conflictKey: firstString(change.conflictKey, anchor.conflictKey, key),
    symbolId: firstString(change.symbolId, anchor.symbolId, insertion.insertedSymbolId),
    symbolName: firstString(change.symbolName, anchor.symbolName, insertion.insertedSymbolName),
    symbolKind: firstString(change.symbolKind, anchor.symbolKind, insertion.insertedSymbolKind),
    memberName: firstString(change.memberName, change.name, change.symbolName, insertion.insertedSymbolName),
    exportName: firstString(change.exportName, change.exportedName),
    containerKey: firstString(change.containerKey, change.parentKey, anchor.regionId),
    listKey,
    orderedListKey: firstString(change.orderedListKey, listKey),
    index: firstString(change.index, change.position, change.orderIndex),
    position: firstString(change.position, change.index),
    orderKey: firstString(change.orderKey, change.order, change.sortKey),
    beforeKey: firstString(change.beforeKey, change.before, change.previousKey),
    afterKey: firstString(change.afterKey, change.after, change.nextKey),
    anchorKey: firstString(change.anchorKey, insertion.anchorKey, anchor.key),
    sourceHash: firstString(change.sourceHash, change.currentSourceHash, change.targetHash),
    reasonCodes: uniqueStrings([...strings(change.reasonCode), ...strings(change.reasonCodes)])
  };
}

export function normalizeDeclaration(entry, index, context) {
  const change = normalizeChange(entry, context, `declaration_${index + 1}`);
  const name = firstString(entry.name, entry.memberName, entry.exportName, entry.symbolName, change.memberName, change.exportName, change.symbolName);
  const exported = entry.exported === true || entry.isExport === true || Boolean(entry.exportName) || /export/i.test(String(entry.kind ?? entry.symbolKind ?? ''));
  const member = entry.member === true || entry.isMember === true || Boolean(entry.memberName || entry.containerKey || entry.parentKey) || /member|method|field|property/i.test(String(entry.kind ?? entry.symbolKind ?? ''));
  return {
    ...change,
    name,
    exported,
    member,
    containerKey: firstString(entry.containerKey, entry.parentKey, entry.classKey, entry.ownerKey, change.containerKey),
    key: firstString(entry.key, entry.semanticKey, change.key, name)
  };
}

export function sameChangeRegion(left, right) {
  if (left.id === right.id) return false;
  if (left.side && right.side && left.side === right.side) return false;
  const leftKeys = keysForChange(left);
  const rightKeys = keysForChange(right);
  if (leftKeys.some((key) => rightKeys.includes(key))) return true;
  return spansOverlap(left.span, right.span);
}

export function spansOverlap(left, right) {
  if (!left || !right) return false;
  if (left.sourcePath && right.sourcePath && left.sourcePath !== right.sourcePath) return false;
  const leftStart = numberValue(left.startOffset, left.start);
  const leftEnd = numberValue(left.endOffset, left.end);
  const rightStart = numberValue(right.startOffset, right.start);
  const rightEnd = numberValue(right.endOffset, right.end);
  if (Number.isFinite(leftStart) && Number.isFinite(leftEnd) && Number.isFinite(rightStart) && Number.isFinite(rightEnd)) {
    return leftStart < rightEnd && rightStart < leftEnd;
  }
  const leftStartLine = numberValue(left.startLine, left.line);
  const leftEndLine = numberValue(left.endLine, leftStartLine);
  const rightStartLine = numberValue(right.startLine, right.line);
  const rightEndLine = numberValue(right.endLine, rightStartLine);
  if (Number.isFinite(leftStartLine) && Number.isFinite(leftEndLine) && Number.isFinite(rightStartLine) && Number.isFinite(rightEndLine)) {
    return leftStartLine <= rightEndLine && rightStartLine <= leftEndLine;
  }
  return false;
}

export function affectedFromEntries(entries, context) {
  return normalizeAffected({
    sourcePath: uniqueStrings(entries.map((entry) => entry.sourcePath)),
    sourceSpan: entries.map((entry) => entry.span ?? entry.sourceSpan).filter(Boolean),
    key: entries.flatMap((entry) => keysForAffected(entry)),
    symbolId: entries.map((entry) => entry.symbolId),
    symbolName: entries.map((entry) => entry.symbolName ?? entry.name),
    memberKey: entries.map((entry) => entry.memberName ? `${entry.containerKey ?? entry.sourcePath ?? context.sourcePath ?? 'member'}#${entry.memberName}` : undefined),
    exportName: entries.map((entry) => entry.exportName ?? (entry.exported ? entry.name : undefined)),
    orderedListKey: entries.map((entry) => entry.listKey ?? entry.orderedListKey),
    sourceHash: entries.map((entry) => entry.sourceHash)
  }, context);
}

export function normalizeAffected(value, context) {
  const sourcePaths = uniqueStrings([
    context.sourcePath,
    ...strings(value.sourcePath),
    ...strings(value.sourcePaths),
    ...array(value.spans).map((span) => span?.sourcePath),
    ...array(value.sourceSpan).map((span) => span?.sourcePath)
  ]);
  const spans = uniqueSpans([
    ...array(value.sourceSpan),
    ...array(value.span),
    ...array(value.spans)
  ].map((span) => normalizeSpan(span, sourcePaths[0])).filter(Boolean));
  const keys = uniqueStrings([
    ...strings(value.key),
    ...strings(value.keys),
    ...strings(value.conflictKey),
    ...strings(value.conflictKeys),
    ...strings(value.regionKey),
    ...strings(value.regionKeys),
    ...strings(value.semanticKey),
    ...strings(value.anchorKey)
  ]);
  return {
    sourcePaths,
    spans,
    keys,
    regionKeys: uniqueStrings([...strings(value.regionKey), ...strings(value.regionKeys)]),
    symbolIds: uniqueStrings([...strings(value.symbolId), ...strings(value.symbolIds)]),
    symbolNames: uniqueStrings([...strings(value.symbolName), ...strings(value.symbolNames)]),
    memberKeys: uniqueStrings([...strings(value.memberKey), ...strings(value.memberKeys)]),
    exportNames: uniqueStrings([...strings(value.exportName), ...strings(value.exportNames)]),
    orderedListKeys: uniqueStrings([...strings(value.orderedListKey), ...strings(value.orderedListKeys), ...strings(value.listKey)]),
    sourceHashes: uniqueStrings([...strings(value.sourceHash), ...strings(value.sourceHashes)])
  };
}

export function normalizeSpan(span, sourcePath) {
  if (!span || typeof span !== 'object') return undefined;
  return compactRecord({
    sourcePath: span.sourcePath ?? span.path ?? sourcePath,
    start: numberOrUndefined(span.start),
    end: numberOrUndefined(span.end),
    startOffset: numberOrUndefined(span.startOffset ?? span.offset),
    endOffset: numberOrUndefined(span.endOffset),
    startLine: numberOrUndefined(span.startLine ?? span.line),
    startColumn: numberOrUndefined(span.startColumn ?? span.column),
    endLine: numberOrUndefined(span.endLine ?? span.line),
    endColumn: numberOrUndefined(span.endColumn)
  });
}

export function uniqueSpans(spans) {
  const seen = new Set();
  const result = [];
  for (const span of spans) {
    const key = JSON.stringify(span);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(span);
  }
  return result;
}
