import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

export function projectionCoveredContainerOperationIds(operations, workerSourceText) {
  if (typeof workerSourceText !== 'string') return new Set();
  const result = new Set();
  for (const operation of operations ?? []) {
    if (!isProjectionCoverableContainer(operation)) continue;
    if (workerContainerCoveredByInsertedChildren(operation, operations, workerSourceText)) result.add(operation.id);
  }
  for (const operation of operations ?? []) {
    if (operationCoveredByBody(operation, operations, workerSourceText)) result.add(operation.id);
  }
  return result;
}

export function spanOffsets(sourceText, span) {
  if (typeof sourceText !== 'string' || !span) return undefined;
  if (typeof span.start === 'number' && typeof span.end === 'number' && span.end >= span.start) {
    return { start: span.start, end: span.end };
  }
  if (typeof span.startLine !== 'number') return undefined;
  const lineStarts = [0];
  for (let index = 0; index < sourceText.length; index += 1) if (sourceText[index] === '\n') lineStarts.push(index + 1);
  const startLine = Math.max(1, span.startLine);
  const endLine = Math.max(startLine, typeof span.endLine === 'number' ? span.endLine : startLine);
  const start = lineStarts[startLine - 1];
  const endLineStart = lineStarts[endLine - 1];
  if (start === undefined || endLineStart === undefined) return undefined;
  const startColumn = Math.max(1, span.startColumn ?? 1) - 1;
  const lineEnd = lineContentEndOffset(sourceText, lineStarts[endLine]);
  const endColumn = span.endColumn === undefined ? lineEnd - endLineStart : Math.max(1, span.endColumn) - 1;
  return { start: start + startColumn, end: endLineStart + endColumn };
}

export function scopedBodyReplacement(operation, headSourceText, workerSourceText, headOffsets, workerOffsets) {
  if (!isBodyReplacement(operation)) return undefined;
  const head = bodyContentRange(headSourceText, headOffsets);
  const worker = bodyContentRange(workerSourceText, workerOffsets);
  if (!head || !worker) return undefined;
  const headPrefix = headSourceText.slice(headOffsets.start, head.start);
  const workerPrefix = workerSourceText.slice(workerOffsets.start, worker.start);
  const headSuffix = headSourceText.slice(head.end, headOffsets.end);
  const workerSuffix = workerSourceText.slice(worker.end, workerOffsets.end);
  if (headPrefix !== workerPrefix || headSuffix !== workerSuffix) return undefined;
  return { sourceRangeKind: 'body-content', head, worker };
}

export function bodyContentRange(sourceText, range) {
  const pairs = bracePairs(sourceText, range);
  const close = trailingBodyCloseOffset(sourceText, range);
  const pair = close === undefined ? undefined : pairs.find((candidate) => candidate.close === close);
  return pair ? { start: pair.open + 1, end: pair.close } : undefined;
}

export function insertionOffset(sourceText, insertion, context = {}) {
  if (typeof sourceText !== 'string') return { ok: false, reasonCodes: ['missing-head-source-text'] };
  const mode = insertion?.mode;
  if (mode === 'file-start') return { ok: true, offset: 0 };
  if (mode === 'file-end') return { ok: true, offset: sourceText.length };
  const resolved = insertionAnchorResolution(sourceText, insertion, context);
  if (!resolved?.range) return { ok: false, reasonCodes: ['insertion-anchor-not-resolvable'] };
  if (resolved.mode === 'before') return { ok: true, offset: resolved.range.start };
  if (resolved.mode === 'after') return { ok: true, offset: afterLineOffset(sourceText, resolved.range.end) };
  return { ok: false, reasonCodes: ['insertion-mode-unsupported'] };
}

export function removalRange(sourceText, span) {
  const range = { ...span };
  const next = lineBreakEndOffset(sourceText, range.end);
  if (next !== range.end) range.end = next;
  else {
    const previous = previousLineBreakStartOffset(sourceText, range.start);
    if (previous !== range.start) range.start = previous;
  }
  return range;
}

export function insertionReplacement(text, sourceText, offset) {
  let replacement = String(text ?? '');
  const newline = sourceLineEnding(sourceText);
  if (offset > 0 && !isLineBreak(sourceText[offset - 1])) replacement = `${newline}${replacement}`;
  if (offset < sourceText.length && !endsWithLineBreak(replacement)) replacement += newline;
  if (offset === sourceText.length && sourceText && !endsWithLineBreak(sourceText)) replacement = `${newline}${replacement}`;
  if (offset === sourceText.length && !endsWithLineBreak(replacement)) replacement += newline;
  return replacement;
}

export function afterLineOffset(sourceText, offset) {
  return lineBreakEndOffset(sourceText, offset);
}

function isProjectionCoverableContainer(operation) {
  if (['portable', 'already-applied', 'covered'].includes(operation.status)) return false;
  if (operation.changeKind !== 'modified') return false;
  if (!operation.spans?.worker || !operation.hashes?.baseTextHash) return false;
  const kind = String(operation.anchor?.regionKind ?? operation.regionKind ?? '');
  return kind === 'type' || kind === 'config' || kind === 'content' || kind === 'route' || kind === 'property';
}

function workerContainerCoveredByInsertedChildren(container, operations, workerSourceText) {
  const containerWorker = spanOffsets(workerSourceText, container.spans?.worker);
  if (!containerWorker) return false;
  const childRanges = (operations ?? [])
    .filter((operation) => operation.id !== container.id)
    .filter((operation) => operation.changeKind === 'added' || String(operation.kind ?? '').startsWith('add'))
    .filter((operation) => ['portable', 'already-applied'].includes(operation.status))
    .map((operation) => spanOffsets(workerSourceText, operation.spans?.worker))
    .filter((range) => containedRange(range, containerWorker))
    .map((range) => insertionRemovalRange(workerSourceText, range, containerWorker));
  if (!childRanges.length) return false;
  const stripped = childRanges
    .sort((left, right) => right.start - left.start || right.end - left.end)
    .reduce((text, range) => text.slice(0, range.start - containerWorker.start) + text.slice(range.end - containerWorker.start), workerSourceText.slice(containerWorker.start, containerWorker.end));
  return hashSemanticValue(stripped) === container.hashes.baseTextHash;
}

function operationCoveredByBody(operation, operations, workerSourceText) {
  const kind = operation.anchor?.regionKind;
  if (kind !== 'export' && kind !== 'call') return false;
  if (!['added', 'modified'].includes(operation.changeKind)) return false;
  const range = spanOffsets(workerSourceText, operation.spans?.worker);
  if (!range) return false;
  return (operations ?? []).some((candidate) => (
    candidate.id !== operation.id
    && ['portable', 'already-applied'].includes(candidate.status)
    && candidate.anchor?.regionKind === 'body'
    && (kind === 'call' || candidate.anchor?.symbolName === operation.anchor?.symbolName)
    && sameOperationSourcePath(candidate, operation)
    && containedRange(range, spanOffsets(workerSourceText, candidate.spans?.worker))
  ));
}

function sameOperationSourcePath(left, right) {
  const leftPath = left.anchor?.sourcePath ?? left.insertion?.sourcePath;
  const rightPath = right.anchor?.sourcePath ?? right.insertion?.sourcePath;
  return !leftPath || !rightPath || leftPath === rightPath;
}

function containedRange(inner, outer) {
  return Boolean(inner && outer && outer.start <= inner.start && inner.end <= outer.end);
}

function insertionRemovalRange(sourceText, span, container) {
  const range = { ...span };
  const next = lineBreakEndOffset(sourceText, range.end);
  if (next !== range.end && next <= container.end) range.end = next;
  else {
    const previous = previousLineBreakStartOffset(sourceText, range.start);
    if (previous !== range.start && previous >= container.start) range.start = previous;
  }
  return range;
}

function lineContentEndOffset(sourceText, nextLineStart) {
  if (nextLineStart === undefined) return sourceText.length;
  const lineBreakStart = sourceText[nextLineStart - 2] === '\r' ? nextLineStart - 2 : nextLineStart - 1;
  return Math.max(0, lineBreakStart);
}

function lineBreakEndOffset(sourceText, offset) {
  if (sourceText[offset] === '\r' && sourceText[offset + 1] === '\n') return offset + 2;
  if (isLineBreak(sourceText[offset])) return offset + 1;
  return offset;
}

function previousLineBreakStartOffset(sourceText, offset) {
  if (sourceText[offset - 1] === '\n') return sourceText[offset - 2] === '\r' ? offset - 2 : offset - 1;
  if (sourceText[offset - 1] === '\r') return offset - 1;
  return offset;
}

function sourceLineEnding(sourceText) {
  if (sourceText.includes('\r\n')) return '\r\n';
  return sourceText.includes('\r') ? '\r' : '\n';
}

function endsWithLineBreak(value) {
  return isLineBreak(value[value.length - 1]);
}

function isLineBreak(char) {
  return char === '\n' || char === '\r';
}

function isBodyReplacement(operation) {
  return operation.changeKind === 'modified' && (operation.kind === 'replaceBody' || operation.anchor?.regionKind === 'body');
}

function insertionAnchorResolution(sourceText, insertion, context) {
  const candidates = insertionAnchorCandidates(insertion);
  for (const candidate of candidates) {
    const symbol = insertionAnchorSymbol(candidate, context.symbols);
    const range = spanOffsets(sourceText, symbol?.sourceSpan);
    if (range) return { mode: candidate.mode, range };
  }
  if (context.symbolIndexAvailable && candidates.some(hasSymbolAnchorIdentity)) return undefined;
  for (const candidate of candidates) {
    const range = spanOffsets(sourceText, candidate.headSpan);
    if (range) return { mode: candidate.mode, range };
  }
  return undefined;
}

function hasSymbolAnchorIdentity(candidate) {
  return Boolean(candidate.anchorKey || candidate.anchorSymbolId || candidate.anchorSymbolName);
}

function insertionAnchorCandidates(insertion) {
  const seen = new Set();
  const result = [];
  for (const candidate of [insertion, ...(Array.isArray(insertion?.anchorCandidates) ? insertion.anchorCandidates : [])]) {
    if (!candidate || (candidate.mode !== 'before' && candidate.mode !== 'after')) continue;
    const key = [candidate.mode, candidate.anchorKey, candidate.anchorSymbolId, candidate.anchorSymbolName, candidate.anchorSymbolKind].join('\0');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

function insertionAnchorSymbol(candidate, symbols) {
  const symbolList = Array.isArray(symbols)
    ? symbols
    : symbols?.values
      ? [...symbols.values()]
      : [];
  const keys = [candidate.anchorKey, candidate.anchorSymbolId].filter(Boolean);
  const exact = symbolList.find((symbol) => [symbol.ownershipKey, symbol.key, symbol.id].some((key) => key && keys.includes(key)));
  if (exact) return exact;
  return symbolList.find((symbol) => symbol.name === candidate.anchorSymbolName && (!candidate.anchorSymbolKind || symbol.kind === candidate.anchorSymbolKind));
}

function trailingBodyCloseOffset(sourceText, range) {
  if (typeof sourceText !== 'string' || !range) return undefined;
  let index = range.end - 1;
  index = previousCodeOffset(sourceText, index, range.start);
  if (sourceText[index] === ';' || sourceText[index] === ',') {
    index -= 1;
    index = previousCodeOffset(sourceText, index, range.start);
  }
  return sourceText[index] === '}' ? index : undefined;
}

function previousCodeOffset(sourceText, index, minIndex) {
  let cursor = index;
  while (cursor >= minIndex) {
    while (cursor >= minIndex && /\s/.test(sourceText[cursor])) cursor -= 1;
    const blockStart = sourceText.lastIndexOf('/*', cursor);
    if (sourceText[cursor] === '/' && sourceText[cursor - 1] === '*' && blockStart >= minIndex) {
      cursor = blockStart - 1;
      continue;
    }
    const lineStart = Math.max(minIndex, sourceText.lastIndexOf('\n', cursor) + 1);
    const lineComment = sourceText.lastIndexOf('//', cursor);
    if (lineComment >= lineStart) {
      cursor = lineComment - 1;
      continue;
    }
    return cursor;
  }
  return cursor;
}

function bracePairs(sourceText, range) {
  if (typeof sourceText !== 'string' || !range || range.end <= range.start) return [];
  const stack = [];
  const pairs = [];
  let quote;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = range.start; index < range.end; index += 1) {
    const char = sourceText[index];
    const next = sourceText[index + 1];
    if (lineComment) {
      if (char === '\n' || char === '\r') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') stack.push(index);
    else if (char === '}') {
      const open = stack.pop();
      if (open !== undefined) pairs.push({ open, close: index });
    }
  }
  return pairs;
}
