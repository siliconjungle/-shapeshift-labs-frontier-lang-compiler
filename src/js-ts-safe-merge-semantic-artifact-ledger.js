import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from './native-import-utils.js';
import { detectLineEnding, normalizeLineEndings } from './js-ts-safe-merge-context.js';

function createOperationsFromLedgers(context) {
  const headByKey = new Map(context.head.entries.map((entry) => [entry.key, entry]));
  return context.merged.entries.flatMap((entry, index) => {
    const headEntry = headByKey.get(entry.key);
    if (headEntry) {
      if (sameEntryText(headEntry.text, entry.text)) return [];
      return [operationRecord({
        ...context,
        index,
        kind: entry.kind === 'import' ? 'jsTsReplaceImport' : 'jsTsReplaceDeclaration',
        changeKind: 'modified',
        entry,
        headEntry,
        insertion: undefined,
        currentText: headEntry.text,
        replacementText: entry.text
      })];
    }
    return [operationRecord({
      ...context,
      index,
      kind: entry.kind === 'import' ? 'jsTsInsertImport' : 'jsTsInsertDeclaration',
      changeKind: 'added',
      entry,
      headEntry: undefined,
      insertion: insertionAnchorForMergedEntry(entry, index, context),
      currentText: '',
      replacementText: insertionText(entry.text, context.head.sourceText)
    })];
  });
}

function operationRecord(input) {
  const anchor = entryAnchor(input.entry, input.sourcePath, input.language);
  const operation = {
    id: `js_ts_safe_merge_op_${idFragment([input.id, input.index, input.entry.key].join(':'))}`,
    kind: input.kind,
    changeKind: input.changeKind,
    anchor,
    insertion: input.insertion,
    spans: {
      head: input.headEntry ? spanForEntry(input.headEntry) : undefined,
      worker: spanForEntry(input.entry)
    },
    hashes: {
      baseSourceHash: input.input.baseHash,
      workerSourceHash: input.input.workerHash,
      headSourceHash: input.input.headHash,
      headTextHash: hashSemanticValue(input.currentText),
      workerTextHash: hashSemanticValue(input.replacementText)
    },
    status: 'portable',
    readiness: 'ready',
    confidence: 1,
    reasonCodes: ['js-ts-safe-merge-gates-passed', 'js-ts-ledger-source-edit'],
    evidenceIds: [`evidence_${idFragment(input.id)}_js_ts_safe_merge_semantic_replay`],
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      ledgerKey: input.entry.key
    }
  };
  return { ...operation, operationContentHash: hashSemanticValue(operation) };
}

function sourceEditForOperation(operation, order, headSourceText, mergedSourceText) {
  const headStart = operation.spans.head?.start ?? insertionOffsetFromAnchor(operation.insertion, headSourceText);
  const headEnd = operation.spans.head?.end ?? headStart;
  const workerStart = operation.spans.worker?.start ?? 0;
  const workerEnd = operation.spans.worker?.end ?? workerStart;
  const current = headSourceText.slice(headStart, headEnd);
  const replacementSpanText = mergedSourceText.slice(workerStart, workerEnd);
  const replacement = operation.changeKind === 'added'
    ? insertionText(replacementSpanText, headSourceText)
    : replacementSpanText;
  return {
    operationId: operation.id,
    order,
    kind: operation.kind,
    editKind: operation.changeKind === 'added' ? 'insert' : 'replace',
    changeKind: operation.changeKind,
    anchorKey: operation.anchor.key,
    conflictKey: operation.anchor.conflictKey,
    regionId: operation.anchor.regionId,
    regionKind: operation.anchor.regionKind,
    sourcePath: operation.anchor.sourcePath,
    symbolId: operation.anchor.symbolId,
    symbolName: operation.anchor.symbolName,
    symbolKind: operation.anchor.symbolKind,
    operationContentHash: operation.operationContentHash,
    insertion: operation.insertion,
    start: headStart,
    end: headEnd,
    workerStart,
    workerEnd,
    current,
    replacement,
    replacementSpanText
  };
}

function insertionAnchorForMergedEntry(entry, index, context) {
  const previous = nearestHeadEntry(context.merged.entries, context.head.entries, index, -1);
  if (previous) return {
    mode: 'after',
    anchorKey: previous.key,
    anchorSymbolName: entryName(previous),
    anchorSymbolKind: entrySymbolKind(previous),
    headSpan: spanForEntry(previous),
    sourcePath: context.sourcePath
  };
  const next = nearestHeadEntry(context.merged.entries, context.head.entries, index, 1);
  if (next) return {
    mode: 'before',
    anchorKey: next.key,
    anchorSymbolName: entryName(next),
    anchorSymbolKind: entrySymbolKind(next),
    headSpan: spanForEntry(next),
    sourcePath: context.sourcePath
  };
  return { mode: 'file-end', sourcePath: context.sourcePath };
}

function nearestHeadEntry(mergedEntries, headEntries, startIndex, step) {
  const headByKey = new Map(headEntries.map((entry) => [entry.key, entry]));
  for (let index = startIndex + step; index >= 0 && index < mergedEntries.length; index += step) {
    const headEntry = headByKey.get(mergedEntries[index].key);
    if (headEntry) return headEntry;
  }
  return undefined;
}

function insertionOffsetFromAnchor(insertion, sourceText) {
  if (insertion?.mode === 'file-start') return 0;
  if (insertion?.mode === 'file-end') return sourceText.length;
  const span = insertion?.headSpan;
  if (!span) return sourceText.length;
  if (insertion.mode === 'before') return lineStartOffset(sourceText, span.start);
  return lineEndOffset(sourceText, span.end);
}

function entryAnchor(entry, sourcePath, language) {
  const name = entryName(entry);
  const key = `source#${sourcePath ?? 'unknown'}#${entry.kind}#${name ?? entry.key}`;
  return {
    key,
    conflictKey: key,
    regionId: key,
    regionKind: entry.kind === 'import' ? 'import' : 'declaration',
    granularity: 'js-ts-ledger-entry',
    language,
    sourcePath,
    symbolId: key,
    symbolName: name,
    symbolKind: entrySymbolKind(entry),
    sourceSpan: spanForEntry(entry)
  };
}

function entryName(entry) {
  if (entry.kind === 'import') return entry.importInfo?.moduleSpecifier;
  return entry.names?.join('|') ?? entry.key;
}

function entrySymbolKind(entry) {
  if (entry.kind === 'import') return 'import';
  return entry.declarationInfo?.declarationKind ?? entry.kind;
}

function spanForEntry(entry) {
  return { start: entry.start, end: entry.end };
}

function insertionText(text, sourceText) {
  const lineEnding = detectLineEnding(sourceText);
  const normalized = normalizeLineEndings(String(text ?? '').trimEnd(), lineEnding);
  return normalized.endsWith(lineEnding) ? normalized : `${normalized}${lineEnding}`;
}

function sameEntryText(left, right) {
  return normalizeLineEndings(String(left ?? '').trim(), '\n') === normalizeLineEndings(String(right ?? '').trim(), '\n');
}

function lineStartOffset(sourceText, offset) {
  return sourceText.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
}

function lineEndOffset(sourceText, offset) {
  const lineEnd = sourceText.indexOf('\n', offset);
  return lineEnd === -1 ? sourceText.length : lineEnd + 1;
}

export { createOperationsFromLedgers, sourceEditForOperation };
