import { uniqueStrings } from '../../native-import-utils.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';

export function markCoveredSemanticEditOperations(operations, context) {
  const sourceText = {
    base: nativeImportSourceText(context.base),
    worker: nativeImportSourceText(context.worker)
  };
  return (operations ?? []).map((operation) => {
    const coveredBy = coveredByChildOperations(operation, operations, sourceText);
    if (!coveredBy.length) return operation;
    return {
      ...operation,
      status: 'covered',
      readiness: 'ready',
      confidence: Math.max(operation.confidence ?? 0, 0.82),
      reasonCodes: uniqueStrings([...(operation.reasonCodes ?? []), 'container-covered-by-child-edits']),
      evidenceIds: uniqueStrings(operation.evidenceIds ?? []),
      metadata: {
        ...(operation.metadata ?? {}),
        coveredByOperationIds: coveredBy.map((child) => child.id)
      }
    };
  });
}

function coveredByChildOperations(container, operations, sourceText) {
  if (!isCoverableContainer(container)) return [];
  const containerBase = spanOffsets(sourceText.base, container.spans?.base);
  const containerWorker = spanOffsets(sourceText.worker, container.spans?.worker);
  if (!containerBase || !containerWorker) return [];
  const childEdits = (operations ?? [])
    .filter((operation) => operation.id !== container.id)
    .map((operation) => childEdit(operation, sourceText, containerBase))
    .filter(Boolean);
  if (!childEdits.length) return [];
  const baseText = sourceText.base.slice(containerBase.start, containerBase.end);
  const workerText = sourceText.worker.slice(containerWorker.start, containerWorker.end);
  return applyLocalEdits(baseText, childEdits) === workerText ? childEdits.map((edit) => edit.operation) : [];
}

function isCoverableContainer(operation) {
  if (operation.changeKind !== 'modified') return false;
  if (!operation.spans?.base || !operation.spans?.worker) return false;
  const kind = String(operation.anchor?.regionKind ?? operation.regionKind ?? '');
  return kind === 'type' || kind === 'config' || kind === 'content' || kind === 'route' || kind === 'property';
}

function childEdit(operation, sourceText, containerBase) {
  if (!['portable', 'already-applied'].includes(operation.status)) return undefined;
  if (operation.changeKind === 'modified') return replacementChildEdit(operation, sourceText, containerBase);
  if (operation.changeKind === 'added') return insertionChildEdit(operation, sourceText, containerBase);
  if (operation.changeKind === 'removed') return removalChildEdit(operation, sourceText, containerBase);
  return undefined;
}

function replacementChildEdit(operation, sourceText, containerBase) {
  const base = spanOffsets(sourceText.base, operation.spans?.base);
  const worker = spanOffsets(sourceText.worker, operation.spans?.worker);
  if (!contained(base, containerBase) || !worker) return undefined;
  return {
    operation,
    start: base.start - containerBase.start,
    end: base.end - containerBase.start,
    replacement: sourceText.worker.slice(worker.start, worker.end)
  };
}

function insertionChildEdit(operation, sourceText, containerBase) {
  const worker = spanOffsets(sourceText.worker, operation.spans?.worker);
  const offset = insertionOffset(sourceText.base, operation.insertion, containerBase);
  if (!worker || offset === undefined) return undefined;
  const baseText = sourceText.base.slice(containerBase.start, containerBase.end);
  const replacement = insertionReplacement(sourceText.worker.slice(worker.start, worker.end), baseText, offset);
  return { operation, start: offset, end: offset, replacement };
}

function removalChildEdit(operation, sourceText, containerBase) {
  const base = spanOffsets(sourceText.base, operation.spans?.base);
  if (!contained(base, containerBase)) return undefined;
  const range = removalRange(sourceText.base, base, containerBase);
  return { operation, start: range.start - containerBase.start, end: range.end - containerBase.start, replacement: '' };
}

function insertionOffset(sourceText, insertion, containerBase) {
  const mode = insertion?.mode;
  if (mode === 'file-start') return 0;
  if (mode === 'file-end') return containerBase.end - containerBase.start;
  const span = spanOffsets(sourceText, insertion?.baseSpan ?? insertion?.headSpan);
  if (!contained(span, containerBase)) return undefined;
  if (mode === 'before') return span.start - containerBase.start;
  if (mode === 'after') return afterLineOffset(sourceText, span.end) - containerBase.start;
  return undefined;
}

function applyLocalEdits(sourceText, edits) {
  return edits
    .sort((left, right) => right.start - left.start || right.end - left.end)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), sourceText);
}

function spanOffsets(sourceText, span) {
  if (typeof sourceText !== 'string' || !span) return undefined;
  if (typeof span.start === 'number' && typeof span.end === 'number' && span.end >= span.start) return { start: span.start, end: span.end };
  if (typeof span.startLine !== 'number') return undefined;
  const lineStarts = [0];
  for (let index = 0; index < sourceText.length; index += 1) if (sourceText[index] === '\n') lineStarts.push(index + 1);
  const startLine = Math.max(1, span.startLine);
  const endLine = Math.max(startLine, typeof span.endLine === 'number' ? span.endLine : startLine);
  const start = lineStarts[startLine - 1];
  const endLineStart = lineStarts[endLine - 1];
  if (start === undefined || endLineStart === undefined) return undefined;
  const startColumn = Math.max(1, span.startColumn ?? 1) - 1;
  const lineEnd = lineStarts[endLine] === undefined ? sourceText.length : lineStarts[endLine] - 1;
  const endColumn = span.endColumn === undefined ? lineEnd - endLineStart : Math.max(1, span.endColumn) - 1;
  return { start: start + startColumn, end: endLineStart + endColumn };
}

function contained(inner, outer) {
  return Boolean(inner && outer && outer.start <= inner.start && inner.end <= outer.end);
}

function insertionReplacement(text, sourceText, offset) {
  let replacement = String(text ?? '');
  if (offset > 0 && sourceText[offset - 1] !== '\n') replacement = `\n${replacement}`;
  if (offset < sourceText.length && !replacement.endsWith('\n')) replacement += '\n';
  if (offset === sourceText.length && sourceText && !sourceText.endsWith('\n')) replacement = `\n${replacement}`;
  if (offset === sourceText.length && !replacement.endsWith('\n')) replacement += '\n';
  return replacement;
}

function removalRange(sourceText, span, container) {
  const range = { ...span };
  if (range.end < container.end && sourceText[range.end] === '\n') range.end += 1;
  else if (range.start > container.start && sourceText[range.start - 1] === '\n') range.start -= 1;
  return range;
}

function afterLineOffset(sourceText, offset) {
  return sourceText[offset] === '\n' ? offset + 1 : offset;
}
