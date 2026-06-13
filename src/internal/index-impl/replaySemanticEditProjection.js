import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, normalizeNativeLanguageId, uniqueStrings } from '../../native-import-utils.js';
import { createSemanticImportSidecar } from './createSemanticImportSidecar.js';
import { mapDiffSymbols } from './mapDiffSymbols.js';
import { normalizeNativeDiffImport } from './normalizeNativeDiffImport.js';
import { replayReplacementText } from './replaySemanticEditLineEndings.js';
import { replayDiagnostics, replayEditDiagnostics, replayEditsWithOverlapDiagnostics } from './semanticEditReplayDiagnostics.js';
import { explicitSourceReplacementReplayRange } from './semanticEditReplaySourceReplacement.js';
import {
  findCurrentSymbol,
  findInsertionAnchor,
  hasSymbolAnchorIdentity,
  insertionAnchorCandidates,
  insertionRange
} from './semanticEditReplayAnchors.js';
import { bodyContentRange, removalRange, spanOffsets } from './semanticEditSourceRanges.js';

export function replaySemanticEditProjection(input = {}) {
  const projection = input.projection ?? input.semanticEditProjection;
  if (!projection) throw new Error('replaySemanticEditProjection requires a projection');
  const currentSourceText = input.currentSourceText ?? input.headSourceText;
  const sourcePath = input.currentSourcePath ?? input.headSourcePath ?? projection.sourcePath;
  const language = normalizeNativeLanguageId(input.language ?? projection.language);
  const reasonCodes = baseReasonCodes(projection, currentSourceText);
  const currentHash = typeof currentSourceText === 'string' ? hashSemanticValue(currentSourceText) : undefined;
  if (input.currentSourceHash && currentHash !== input.currentSourceHash) reasonCodes.push('current-source-hash-mismatch');
  const currentSymbols = currentSourceText && language
    ? currentSymbolIndex({ currentSourceText, sourcePath, language, parser: input.parser })
    : [];
  const replayedEdits = projection.status === 'projected' && typeof currentSourceText === 'string'
    ? (projection.edits ?? []).map((edit, index) => replayProjectionEdit(projectionEditWithOrder(edit, index), {
      currentSourceText,
      currentSymbols,
      symbolIndexAvailable: currentSymbols.length > 0
    }))
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
  const symbolRange = spanOffsets(context.currentSourceText, symbol?.sourceSpan);
  const explicitRange = explicitSourceReplacementReplayRange(edit, symbolRange, context.currentSourceText);
  const spanRange = explicitRange?.range ?? currentSymbolEditRange(edit, symbolRange, context.currentSourceText);
  const reanchorReason = explicitRange?.reasonCode ?? 'offset-reanchored-by-symbol';
  const explicitConflictReasons = explicitRange?.conflictReasonCodes ?? [];
  if (symbol && spanRange && !sameRange(headRange, spanRange)) {
    const moved = checkRange(edit, spanRange, context.currentSourceText, currentSymbolRangeLabel(edit));
    if (moved) return replayEditRecord(edit, moved.status, replayAppliedRange(edit, moved.range, context.currentSourceText), [moved.reason, reanchorReason], context.currentSourceText);
    if (offset && containedRange(headRange, spanRange)) {
      return replayEditRecord(edit, offset.status, offset.range, [offset.reason, 'offset-contained-in-current-symbol'], context.currentSourceText);
    }
    if (edit.editKind === 'delete' && offset && rangesOverlap(headRange, spanRange)) {
      return replayEditRecord(edit, offset.status, offset.range, [offset.reason], context.currentSourceText);
    }
    return replayEditRecord(edit, 'conflict', spanRange, [`${currentSymbolRangeLabel(edit)}-content-mismatch`, ...explicitConflictReasons], context.currentSourceText);
  }
  if (offset) return replayEditRecord(edit, offset.status, offset.range, [offset.reason], context.currentSourceText);
  const anchored = checkRange(edit, spanRange, context.currentSourceText, currentSymbolRangeLabel(edit));
  if (anchored) return replayEditRecord(edit, anchored.status, replayAppliedRange(edit, anchored.range, context.currentSourceText), [anchored.reason, reanchorReason], context.currentSourceText);
  return replayEditRecord(edit, symbol ? 'conflict' : 'stale', spanRange, [
    symbol ? `${currentSymbolRangeLabel(edit)}-content-mismatch` : 'current-symbol-anchor-missing',
    ...explicitConflictReasons
  ], context.currentSourceText);
}

function replayAppliedRange(edit, range, sourceText) {
  if (edit.editKind !== 'delete' || !range || typeof sourceText !== 'string') return range;
  return removalRange(sourceText, range);
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
  const missingStableAnchor = context.symbolIndexAvailable && insertionAnchorCandidates(edit).some(hasSymbolAnchorIdentity);
  return replayEditRecord(edit, anchor || missingStableAnchor ? 'conflict' : 'stale', undefined, [
    anchor ? 'current-insertion-anchor-unusable' : 'current-insertion-anchor-missing'
  ], context.currentSourceText);
}

function checkRange(edit, range, sourceText, label) {
  if (!range || range.end < range.start) return undefined;
  const current = sourceText.slice(range.start, range.end);
  const currentHash = hashSemanticValue(current);
  const currentLineEndingStableText = lineEndingStableText(current);
  const currentLineEndingStableHash = currentLineEndingStableText === undefined
    ? undefined
    : hashSemanticValue(currentLineEndingStableText);
  if (edit.replacementSpanTextHash && currentHash === edit.replacementSpanTextHash) return { status: 'already-applied', range, reason: `${label}-matches-replacement-span` };
  if (edit.replacementTextHash && currentHash === edit.replacementTextHash) return { status: 'already-applied', range, reason: `${label}-matches-replacement` };
  if (current === edit.replacementText) return { status: 'already-applied', range, reason: `${label}-matches-replacement-text` };
  if (edit.replacementSpanTextLineEndingStableHash && currentLineEndingStableHash === edit.replacementSpanTextLineEndingStableHash) {
    return { status: 'already-applied', range, reason: `${label}-matches-replacement-span-line-ending-stable` };
  }
  if (edit.replacementTextLineEndingStableHash && currentLineEndingStableHash === edit.replacementTextLineEndingStableHash) {
    return { status: 'already-applied', range, reason: `${label}-matches-replacement-line-ending-stable` };
  }
  if (typeof edit.replacementText === 'string' && currentLineEndingStableText === lineEndingStableText(edit.replacementText)) {
    return { status: 'already-applied', range, reason: `${label}-matches-replacement-text-line-ending-stable` };
  }
  if (edit.deletedTextHash && currentHash === edit.deletedTextHash) return { status: 'applied', range, reason: `${label}-matches-deleted` };
  if (edit.deletedTextLineEndingStableHash && currentLineEndingStableHash === edit.deletedTextLineEndingStableHash) {
    return { status: 'applied', range, reason: `${label}-matches-deleted-line-ending-stable` };
  }
  return undefined;
}

function replayEditRecord(edit, status, range, reasonCodes, sourceText) {
  const normalizedReasonCodes = reasonList(reasonCodes);
  const replacementText = replayReplacementText(edit, status, range, sourceText);
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
    replacementBytes: typeof replacementText === 'string' ? replacementText.length : edit.replacementBytes,
    replacementText,
    reasonCodes: normalizedReasonCodes,
    diagnostics: replayEditDiagnostics(edit, status, range, normalizedReasonCodes, sourceText)
  });
}

function currentSymbolIndex(input) {
  try {
    const imported = normalizeNativeDiffImport({
      language: input.language,
      sourcePath: input.sourcePath,
      sourceText: input.currentSourceText,
      parser: input.parser
    }, input, 'current');
    return [...mapDiffSymbols(imported, createSemanticImportSidecar(imported)).values()];
  } catch {
    return [];
  }
}

function currentSymbolEditRange(edit, symbolRange, sourceText) {
  if (!symbolRange) return undefined;
  if (edit.sourceRangeKind === 'body-content') return bodyContentRange(sourceText, symbolRange);
  return symbolRange;
}

function currentSymbolRangeLabel(edit) {
  if (edit.sourceRangeKind === 'cross-language-explicit-source-replacement') return 'current-symbol-explicit-source-replacement';
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
  const skip = status === 'already-applied';
  return {
    status,
    action: apply ? 'apply' : skip ? 'skip' : status === 'stale' ? 'rerun-semantic-import' : status === 'blocked' ? 'block' : 'human-review',
    reviewRequired: !(apply || skip),
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

function containedRange(inner, outer) {
  return Boolean(inner && outer && outer.start <= inner.start && inner.end <= outer.end);
}

function reasonList(values) { return uniqueStrings((values ?? []).filter(Boolean)); }
function lineEndingStableText(value) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.length > 1 && normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;
}
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
