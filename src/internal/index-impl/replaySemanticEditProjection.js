import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, normalizeNativeLanguageId, uniqueStrings } from '../../native-import-utils.js';
import { createSemanticImportSidecar } from './createSemanticImportSidecar.js';
import { mapDiffSymbols } from './mapDiffSymbols.js';
import { normalizeNativeDiffImport } from './normalizeNativeDiffImport.js';
import { replayDiagnostics, replayEditDiagnostics, replayEditsWithOverlapDiagnostics } from './semanticEditReplayDiagnostics.js';
import { afterLineOffset, bodyContentRange, spanOffsets } from './semanticEditSourceRanges.js';

export function replaySemanticEditProjection(input = {}) {
  const projection = input.projection ?? input.semanticEditProjection;
  if (!projection) throw new Error('replaySemanticEditProjection requires a projection');
  const currentSourceText = input.currentSourceText ?? input.headSourceText;
  const sourcePath = input.currentSourcePath ?? input.headSourcePath ?? projection.sourcePath;
  const language = normalizeNativeLanguageId(input.language ?? projection.language);
  const reasonCodes = baseReasonCodes(projection, currentSourceText);
  const currentHash = typeof currentSourceText === 'string' ? hashSemanticValue(currentSourceText) : undefined;
  if (input.currentSourceHash && currentHash !== input.currentSourceHash) reasonCodes.push('current-source-hash-mismatch');
  const currentSymbols = currentSourceText && isJavaScriptLike(language)
    ? currentSymbolIndex({ currentSourceText, sourcePath, language, parser: input.parser })
    : [];
  const replayedEdits = projection.status === 'projected' && typeof currentSourceText === 'string'
    ? (projection.edits ?? []).map((edit, index) => replayProjectionEdit(projectionEditWithOrder(edit, index), { currentSourceText, currentSymbols }))
    : [];
  const edits = replayEditsWithOverlapDiagnostics(replayedEdits);
  const status = replayStatus(reasonCodes, edits, projection);
  const outputSourceText = replayOutputSource(status, currentSourceText, edits);
  const diagnostics = replayDiagnostics({
    status,
    reasonCodes,
    edits,
    sourcePath,
    currentHash,
    expectedCurrentHash: input.currentSourceHash
  });
  const core = {
    kind: 'frontier.lang.semanticEditReplay',
    version: 1,
    schema: 'frontier.lang.semanticEditReplay.v1',
    id: input.id ?? `semantic_edit_replay_${idFragment(projection.id ?? sourcePath ?? language ?? 'projection')}`,
    projectionId: projection.id,
    scriptId: projection.scriptId,
    sourcePath,
    language,
    currentHash,
    projectedHash: projection.projectedHash,
    outputHash: outputSourceText === undefined ? undefined : hashSemanticValue(outputSourceText),
    status,
    edits,
    appliedOperations: edits.filter((edit) => edit.status === 'applied').map((edit) => edit.operationId).filter(Boolean),
    skippedOperations: edits.filter((edit) => edit.status !== 'applied').map((edit) => edit.operationId).filter(Boolean),
    diagnostics,
    admission: replayAdmission(status, reasonCodes, edits),
    outputSourceText,
    summary: replaySummary(edits, reasonCodes),
    metadata: compactRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      anchorMode: currentSymbols.length ? 'javascript-like-symbols' : 'offsets',
      ...input.metadata
    })
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function replayProjectionEdit(edit, context) {
  if (edit.status === 'already-applied') return replayEditRecord(edit, 'already-applied', undefined, ['projection-edit-already-applied'], context.currentSourceText);
  if (typeof edit.replacementText !== 'string') return replayEditRecord(edit, 'blocked', undefined, ['missing-replacement-text'], context.currentSourceText);
  if (edit.editKind === 'insert') return replayInsertionEdit(edit, context);
  const headRange = { start: edit.headStart, end: edit.headEnd };
  const offset = checkRange(edit, headRange, context.currentSourceText, 'head-offset');
  const symbol = findCurrentSymbol(edit, context.currentSymbols);
  const spanRange = currentSymbolEditRange(edit, spanOffsets(context.currentSourceText, symbol?.sourceSpan), context.currentSourceText);
  if (symbol && spanRange && !sameRange(headRange, spanRange)) {
    const moved = checkRange(edit, spanRange, context.currentSourceText, currentSymbolRangeLabel(edit));
    if (moved) return replayEditRecord(edit, moved.status, moved.range, [moved.reason, 'offset-reanchored-by-symbol'], context.currentSourceText);
    if (edit.editKind === 'delete' && offset && rangesOverlap(headRange, spanRange)) {
      return replayEditRecord(edit, offset.status, offset.range, [offset.reason], context.currentSourceText);
    }
    return replayEditRecord(edit, 'conflict', spanRange, [`${currentSymbolRangeLabel(edit)}-content-mismatch`], context.currentSourceText);
  }
  if (offset) return replayEditRecord(edit, offset.status, offset.range, [offset.reason], context.currentSourceText);
  const anchored = checkRange(edit, spanRange, context.currentSourceText, currentSymbolRangeLabel(edit));
  if (anchored) return replayEditRecord(edit, anchored.status, anchored.range, [anchored.reason, 'offset-reanchored-by-symbol'], context.currentSourceText);
  return replayEditRecord(edit, symbol ? 'conflict' : 'stale', spanRange, [
    symbol ? `${currentSymbolRangeLabel(edit)}-content-mismatch` : 'current-symbol-anchor-missing'
  ], context.currentSourceText);
}

function replayInsertionEdit(edit, context) {
  const inserted = findCurrentSymbol(edit, context.currentSymbols);
  const insertedRange = spanOffsets(context.currentSourceText, inserted?.sourceSpan);
  const already = checkRange(edit, insertedRange, context.currentSourceText, 'current-inserted-symbol');
  if (already?.status === 'already-applied') return replayEditRecord(edit, 'already-applied', already.range, [already.reason], context.currentSourceText);
  if (inserted && insertedRange) {
    return replayEditRecord(edit, 'conflict', insertedRange, ['current-inserted-symbol-content-mismatch'], context.currentSourceText);
  }
  const anchor = findInsertionAnchor(edit, context.currentSymbols);
  const range = insertionRange(edit, anchor?.candidate, anchor?.symbol, context.currentSourceText);
  if (range) return replayEditRecord(edit, 'applied', range, [anchor ? 'current-insertion-anchor' : `current-${edit.insertionMode}`], context.currentSourceText);
  return replayEditRecord(edit, anchor ? 'conflict' : 'stale', undefined, [
    anchor ? 'current-insertion-anchor-unusable' : 'current-insertion-anchor-missing'
  ], context.currentSourceText);
}

function checkRange(edit, range, sourceText, label) {
  if (!range || range.end < range.start) return undefined;
  const current = sourceText.slice(range.start, range.end);
  const currentHash = hashSemanticValue(current);
  if (edit.replacementSpanTextHash && currentHash === edit.replacementSpanTextHash) return { status: 'already-applied', range, reason: `${label}-matches-replacement-span` };
  if (edit.replacementTextHash && currentHash === edit.replacementTextHash) return { status: 'already-applied', range, reason: `${label}-matches-replacement` };
  if (current === edit.replacementText) return { status: 'already-applied', range, reason: `${label}-matches-replacement-text` };
  if (edit.deletedTextHash && currentHash === edit.deletedTextHash) return { status: 'applied', range, reason: `${label}-matches-deleted` };
  return undefined;
}

function replayEditRecord(edit, status, range, reasonCodes, sourceText) {
  const normalizedReasonCodes = reasonList(reasonCodes);
  return compactRecord({
    operationId: edit.operationId,
    semanticKey: edit.semanticKey,
    semanticIdentityHash: edit.semanticIdentityHash,
    sourceIdentityHash: edit.sourceIdentityHash,
    editContentHash: edit.editContentHash,
    editKind: edit.editKind,
    editOrder: edit.editOrder,
    sourceRangeKind: edit.sourceRangeKind,
    sourcePath: edit.targetSourcePath ?? edit.sourcePath,
    symbolName: edit.targetSymbolName ?? edit.symbolName,
    symbolKind: edit.targetSymbolKind ?? edit.symbolKind,
    status,
    start: range?.start,
    end: range?.end,
    replacementBytes: edit.replacementBytes,
    replacementText: edit.replacementText,
    reasonCodes: normalizedReasonCodes,
    diagnostics: replayEditDiagnostics(edit, status, range, normalizedReasonCodes, sourceText)
  });
}

function currentSymbolIndex(input) {
  const imported = normalizeNativeDiffImport({
    language: input.language,
    sourcePath: input.sourcePath,
    sourceText: input.currentSourceText,
    parser: input.parser
  }, input, 'current');
  return [...mapDiffSymbols(imported, createSemanticImportSidecar(imported)).values()];
}

function findCurrentSymbol(edit, symbols) {
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

function findInsertionAnchor(edit, symbols) {
  for (const candidate of insertionAnchorCandidates(edit)) {
    const symbol = findInsertionAnchorSymbol(candidate, symbols);
    if (symbol) return { candidate, symbol };
  }
  return undefined;
}

function findInsertionAnchorSymbol(candidate, symbols) {
  const keys = [candidate.anchorKey, candidate.anchorSymbolId].filter(Boolean);
  return symbols.find((symbol) => [symbol.ownershipKey, symbol.key, symbol.id].some((key) => key && keys.includes(key)))
    ?? symbols.find((symbol) => symbol.name === candidate.anchorSymbolName && (!candidate.anchorSymbolKind || symbol.kind === candidate.anchorSymbolKind));
}

function insertionAnchorCandidates(edit) {
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

function insertionRange(edit, candidate, anchor, sourceText) {
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

function currentSymbolEditRange(edit, symbolRange, sourceText) {
  if (!symbolRange) return undefined;
  if (edit.sourceRangeKind === 'body-content') return bodyContentRange(sourceText, symbolRange);
  return symbolRange;
}

function currentSymbolRangeLabel(edit) {
  return edit.sourceRangeKind === 'body-content' ? 'current-symbol-body' : 'current-symbol-anchor';
}

function replayStatus(reasonCodes, edits, projection) {
  if (reasonCodes.some((reason) => reason !== 'current-source-hash-mismatch')) return 'blocked';
  if (!edits.length && !(projection.edits ?? []).length) return 'evidence-only';
  if (edits.some((edit) => edit.status === 'blocked')) return 'blocked';
  if (edits.some((edit) => edit.status === 'conflict')) return 'conflict';
  if (edits.some((edit) => edit.status === 'stale')) return 'stale';
  if (edits.every((edit) => edit.status === 'already-applied')) return 'already-applied';
  return edits.every((edit) => edit.status === 'applied' || edit.status === 'already-applied') ? 'accepted-clean' : 'needs-port';
}

function replayAdmission(status, reasonCodes, edits) {
  const apply = status === 'accepted-clean';
  return {
    status,
    action: apply ? 'apply' : status === 'already-applied' ? 'skip' : status === 'stale' ? 'rerun-semantic-import' : status === 'blocked' ? 'block' : 'human-review',
    reviewRequired: !apply,
    autoApplyCandidate: apply,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: reasonList([...reasonCodes, ...edits.flatMap((edit) => edit.reasonCodes ?? [])])
  };
}

function replaySummary(edits, reasonCodes) {
  return {
    edits: edits.length,
    applied: edits.filter((edit) => edit.status === 'applied').length,
    alreadyApplied: edits.filter((edit) => edit.status === 'already-applied').length,
    conflicts: edits.filter((edit) => edit.status === 'conflict').length,
    stale: edits.filter((edit) => edit.status === 'stale').length,
    blocked: edits.filter((edit) => edit.status === 'blocked').length,
    reasonCodes: reasonList([...reasonCodes, ...edits.flatMap((edit) => edit.reasonCodes ?? [])])
  };
}

function replayOutputSource(status, sourceText, edits) {
  if (typeof sourceText !== 'string') return undefined;
  if (status === 'already-applied') return sourceText;
  if (status !== 'accepted-clean') return undefined;
  return edits.filter((edit) => edit.status === 'applied')
    .sort(replaySourceEditSort)
    .reduce((text, edit) => text.slice(0, edit.start) + editReplacement(edit, edits) + text.slice(edit.end), sourceText);
}

function replaySourceEditSort(left, right) {
  return right.start - left.start || right.end - left.end || (right.editOrder ?? 0) - (left.editOrder ?? 0);
}

function projectionEditWithOrder(edit, index) {
  return {
    ...edit,
    editOrder: typeof edit.editOrder === 'number'
      ? edit.editOrder
      : typeof edit.order === 'number'
        ? edit.order
        : index
  };
}

function editReplacement(edit, edits) {
  return edits.find((candidate) => candidate.operationId === edit.operationId)?.replacementText ?? '';
}

function baseReasonCodes(projection, currentSourceText) {
  return reasonList([
    projection.status !== 'projected' ? 'projection-not-projected' : undefined,
    projection.admission?.status !== 'auto-merge-candidate' ? 'projection-not-auto-merge-candidate' : undefined,
    typeof currentSourceText !== 'string' ? 'missing-current-source-text' : undefined
  ]);
}

function sameRange(left, right) {
  return left?.start === right?.start && left?.end === right?.end;
}

function rangesOverlap(left, right) {
  return Boolean(left && right && left.start < right.end && right.start < left.end);
}

function isJavaScriptLike(language) { return language === 'javascript' || language === 'typescript'; }
function reasonList(values) { return uniqueStrings((values ?? []).filter(Boolean)); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
