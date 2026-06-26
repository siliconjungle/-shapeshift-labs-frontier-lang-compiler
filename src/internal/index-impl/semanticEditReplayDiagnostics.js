import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { uniqueStrings } from '../../native-import-utils.js';

export function replayEditDiagnostics(edit, status, range, reasonCodes, sourceText) {
  if (status === 'applied' || status === 'already-applied') return [];
  return reasonCodes.map((code) => replayDiagnostic(code, {
    scope: 'edit',
    status,
    operationId: edit.operationId,
    sourcePath: edit.targetSourcePath ?? edit.sourcePath,
    ...sourceIdentityDiagnosticContext(edit),
    symbolName: edit.targetSymbolName ?? edit.symbolName,
    symbolKind: edit.targetSymbolKind ?? edit.symbolKind,
    editKind: edit.editKind,
    start: range?.start,
    end: range?.end,
    expectedHash: replayDiagnosticExpectedHash(code, edit),
    actualHash: replayDiagnosticActualHash(range, sourceText),
    replacementHash: edit.replacementTextHash ?? edit.replacementSpanTextHash
  }));
}

export function replayEditsWithOverlapDiagnostics(edits) {
  const overlapDiagnostics = new Map();
  const ordered = edits
    .filter((edit) => replayOverlapParticipant(edit) && hasNumericReplayRange(edit))
    .sort((left, right) => left.start - right.start || left.end - right.end || (left.editOrder ?? 0) - (right.editOrder ?? 0));
  for (let leftIndex = 0; leftIndex < ordered.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < ordered.length; rightIndex += 1) {
      const left = ordered[leftIndex];
      const right = ordered[rightIndex];
      if (!rangesOverlap(left, right)) continue;
      if (left.status !== 'applied' && right.status !== 'applied') continue;
      const operationIds = [left.operationId, right.operationId].filter(Boolean);
      const fallbackId = `${left.editOrder ?? leftIndex}:${right.editOrder ?? rightIndex}`;
      const code = `replay-edit-overlap:${operationIds.join(':') || fallbackId}`;
      appendOverlapDiagnostic(overlapDiagnostics, left, code, operationIds);
      appendOverlapDiagnostic(overlapDiagnostics, right, code, operationIds);
    }
  }
  if (!overlapDiagnostics.size) return edits;
  return edits.map((edit) => {
    const diagnostics = overlapDiagnostics.get(edit);
    if (!diagnostics) return edit;
    return diagnostics.reduce((record, diagnostic) => appendReplayEditDiagnostic(record, diagnostic), edit);
  });
}

export function replayDiagnostics(input) {
  return uniqueDiagnostics([
    ...reasonList(input.reasonCodes).map((code) => replayDiagnostic(code, {
      scope: 'replay',
      status: input.status,
      sourcePath: input.sourcePath,
      expectedHash: code === 'current-source-hash-mismatch' ? input.expectedCurrentHash : undefined,
      actualHash: code === 'current-source-hash-mismatch' ? input.currentHash : undefined
    })),
    ...input.edits.flatMap((edit) => edit.diagnostics ?? [])
  ]);
}

function appendOverlapDiagnostic(overlapDiagnostics, edit, code, operationIds) {
  const diagnostics = overlapDiagnostics.get(edit) ?? [];
  diagnostics.push(replayDiagnostic(code, {
    scope: 'edit',
    status: 'conflict',
    operationId: edit.operationId,
    sourcePath: edit.sourcePath,
    ...sourceIdentityDiagnosticContext(edit),
    symbolName: edit.symbolName,
    symbolKind: edit.symbolKind,
    editKind: edit.editKind,
    start: edit.start,
    end: edit.end,
    overlapOperationIds: operationIds
  }));
  overlapDiagnostics.set(edit, diagnostics);
}

function appendReplayEditDiagnostic(edit, diagnostic) {
  return compactRecord({
    ...edit,
    status: replayOverlapParticipant(edit) ? 'conflict' : edit.status,
    reasonCodes: reasonList([...(edit.reasonCodes ?? []), diagnostic.code]),
    diagnostics: uniqueDiagnostics([...(edit.diagnostics ?? []), diagnostic])
  });
}

function replayDiagnostic(code, context) {
  const category = replayDiagnosticCategory(code, context.status);
  return compactRecord({
    code,
    category,
    severity: replayDiagnosticSeverity(code, category, context.status),
    scope: context.scope,
    status: context.status,
    operationId: context.operationId,
    sourcePath: context.sourcePath,
    originalSourcePath: context.originalSourcePath,
    targetSourcePath: context.targetSourcePath,
    anchorKey: context.anchorKey,
    targetAnchorKey: context.targetAnchorKey,
    sourceIdentityStatus: context.sourceIdentityStatus,
    sourceIdentityAnchorKey: context.sourceIdentityAnchorKey,
    targetIdentityAnchorKey: context.targetIdentityAnchorKey,
    sourceIdentitySourcePath: context.sourceIdentitySourcePath,
    targetIdentitySourcePath: context.targetIdentitySourcePath,
    semanticIdentityHash: context.semanticIdentityHash,
    sourceIdentityHash: context.sourceIdentityHash,
    editContentHash: context.editContentHash,
    symbolName: context.symbolName,
    symbolKind: context.symbolKind,
    editKind: context.editKind,
    start: context.start,
    end: context.end,
    expectedHash: context.expectedHash,
    actualHash: context.actualHash,
    replacementHash: context.replacementHash,
    overlapOperationIds: context.overlapOperationIds
  });
}

function sourceIdentityDiagnosticContext(edit) {
  const sourceIdentityAnchorKey = edit.sourceIdentityAnchorKey ?? edit.anchorKey;
  const targetIdentityAnchorKey = edit.targetIdentityAnchorKey ?? edit.targetAnchorKey ?? sourceIdentityAnchorKey;
  const sourceIdentitySourcePath = edit.sourceIdentitySourcePath ?? edit.originalSourcePath ?? edit.sourcePath;
  const targetIdentitySourcePath = edit.targetIdentitySourcePath ?? edit.targetSourcePath ?? edit.sourcePath;
  const moved = Boolean(
    (sourceIdentityAnchorKey && targetIdentityAnchorKey && sourceIdentityAnchorKey !== targetIdentityAnchorKey)
    || (sourceIdentitySourcePath && targetIdentitySourcePath && sourceIdentitySourcePath !== targetIdentitySourcePath)
  );
  return compactRecord({
    originalSourcePath: edit.originalSourcePath,
    targetSourcePath: edit.targetSourcePath,
    anchorKey: edit.anchorKey,
    targetAnchorKey: edit.targetAnchorKey,
    sourceIdentityStatus: edit.sourceIdentityStatus ?? (moved ? 'moved-source' : 'same-source'),
    sourceIdentityAnchorKey,
    targetIdentityAnchorKey,
    sourceIdentitySourcePath,
    targetIdentitySourcePath,
    semanticIdentityHash: edit.semanticIdentityHash,
    sourceIdentityHash: edit.sourceIdentityHash,
    editContentHash: edit.editContentHash
  });
}

function replayDiagnosticCategory(code, status) {
  if (code.includes('overlap')) return 'overlap';
  if (code.startsWith('missing-current-source') || code.startsWith('missing-head-source') || code.startsWith('missing-worker-source')) return 'missing-source';
  if (code === 'current-symbol-anchor-missing' || code.includes('anchor-missing') || code.includes('anchor-unusable')) return 'stale-anchor';
  if (code.includes('content-mismatch') || code.includes('hash-mismatch') || code.includes('span-not-resolvable') || code.startsWith('projection-not-') || code === 'missing-replacement-text') return 'projection-mismatch';
  if (code.includes('reanchored')) return 'reanchored';
  if (code.includes('matches-')) return 'matched-source';
  if (status === 'stale') return 'stale-anchor';
  if (status === 'conflict' || status === 'blocked') return 'projection-mismatch';
  return 'replay';
}

function replayDiagnosticSeverity(code, category, status) {
  if (code === 'current-source-hash-mismatch' && (status === 'accepted-clean' || status === 'already-applied')) return 'warning';
  if (category === 'matched-source' || category === 'reanchored' || status === 'applied' || status === 'already-applied') return 'info';
  if (category === 'overlap' || category === 'missing-source' || category === 'stale-anchor' || category === 'projection-mismatch') return 'error';
  return status === 'accepted-clean' ? 'info' : 'warning';
}

function replayDiagnosticExpectedHash(code, edit) {
  if (code.includes('matches-replacement')) return edit.replacementTextHash ?? edit.replacementSpanTextHash;
  if (code.includes('content-mismatch') || code.includes('matches-deleted')) return edit.deletedTextHash ?? edit.anchorDeletedTextHash;
  return undefined;
}

function replayDiagnosticActualHash(range, sourceText) {
  if (!range || typeof sourceText !== 'string') return undefined;
  return hashSemanticValue(sourceText.slice(range.start, range.end));
}

function uniqueDiagnostics(diagnostics) {
  const seen = new Set();
  const result = [];
  for (const diagnostic of diagnostics.filter(Boolean)) {
    const key = [
      diagnostic.scope,
      diagnostic.operationId,
      diagnostic.status,
      diagnostic.code,
      diagnostic.start,
      diagnostic.end,
      (diagnostic.overlapOperationIds ?? []).join('|')
    ].join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(diagnostic);
  }
  return result;
}

function rangesOverlap(left, right) {
  return Boolean(left && right && left.start < right.end && right.start < left.end);
}

function hasNumericReplayRange(edit) {
  return typeof edit.start === 'number' && typeof edit.end === 'number';
}

function replayOverlapParticipant(edit) {
  return edit.status === 'applied' || edit.status === 'already-applied';
}

function reasonList(values) { return uniqueStrings((values ?? []).filter(Boolean)); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
