import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, normalizeNativeLanguageId, uniqueStrings } from '../../native-import-utils.js';
import { createSemanticImportSidecar } from './createSemanticImportSidecar.js';
import { mapDiffSymbols } from './mapDiffSymbols.js';
import { normalizeNativeDiffImport } from './normalizeNativeDiffImport.js';

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
  const edits = projection.status === 'projected' && typeof currentSourceText === 'string'
    ? (projection.edits ?? []).map((edit) => replayProjectionEdit(edit, { currentSourceText, currentSymbols }))
    : [];
  const status = replayStatus(reasonCodes, edits, projection);
  const outputSourceText = replayOutputSource(status, currentSourceText, edits);
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
  if (edit.status === 'already-applied') return replayEditRecord(edit, 'already-applied', undefined, ['projection-edit-already-applied']);
  if (typeof edit.replacementText !== 'string') return replayEditRecord(edit, 'blocked', undefined, ['missing-replacement-text']);
  const offset = checkRange(edit, { start: edit.headStart, end: edit.headEnd }, context.currentSourceText, 'head-offset');
  if (offset) return replayEditRecord(edit, offset.status, offset.range, [offset.reason]);
  const symbol = findCurrentSymbol(edit, context.currentSymbols);
  const spanRange = spanOffsets(context.currentSourceText, symbol?.sourceSpan);
  const anchored = checkRange(edit, spanRange, context.currentSourceText, 'current-symbol-anchor');
  if (anchored) return replayEditRecord(edit, anchored.status, anchored.range, [anchored.reason, 'offset-reanchored-by-symbol']);
  return replayEditRecord(edit, symbol ? 'conflict' : 'stale', spanRange, [
    symbol ? 'current-symbol-anchor-content-mismatch' : 'current-symbol-anchor-missing'
  ]);
}

function checkRange(edit, range, sourceText, label) {
  if (!range || range.end < range.start) return undefined;
  const current = sourceText.slice(range.start, range.end);
  const currentHash = hashSemanticValue(current);
  if (edit.deletedTextHash && currentHash === edit.deletedTextHash) return { status: 'applied', range, reason: `${label}-matches-deleted` };
  if (edit.replacementTextHash && currentHash === edit.replacementTextHash) return { status: 'already-applied', range, reason: `${label}-matches-replacement` };
  if (current === edit.replacementText) return { status: 'already-applied', range, reason: `${label}-matches-replacement-text` };
  return undefined;
}

function replayEditRecord(edit, status, range, reasonCodes) {
  return compactRecord({
    operationId: edit.operationId,
    semanticKey: edit.semanticKey,
    semanticIdentityHash: edit.semanticIdentityHash,
    sourceIdentityHash: edit.sourceIdentityHash,
    editContentHash: edit.editContentHash,
    sourcePath: edit.targetSourcePath ?? edit.sourcePath,
    symbolName: edit.targetSymbolName ?? edit.symbolName,
    symbolKind: edit.targetSymbolKind ?? edit.symbolKind,
    status,
    start: range?.start,
    end: range?.end,
    replacementBytes: edit.replacementBytes,
    replacementText: edit.replacementText,
    reasonCodes: reasonList(reasonCodes)
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
    .sort((left, right) => right.start - left.start)
    .reduce((text, edit) => text.slice(0, edit.start) + editReplacement(edit, edits) + text.slice(edit.end), sourceText);
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

function spanOffsets(sourceText, span) {
  if (typeof sourceText !== 'string' || !span) return undefined;
  if (typeof span.start === 'number' && typeof span.end === 'number' && span.end >= span.start) return { start: span.start, end: span.end };
  if (typeof span.startLine !== 'number') return undefined;
  const starts = [0];
  for (let index = 0; index < sourceText.length; index += 1) if (sourceText[index] === '\n') starts.push(index + 1);
  const startLine = Math.max(1, span.startLine);
  const endLine = Math.max(startLine, typeof span.endLine === 'number' ? span.endLine : startLine);
  const lineStart = starts[startLine - 1];
  const endLineStart = starts[endLine - 1];
  if (lineStart === undefined || endLineStart === undefined) return undefined;
  const lineEnd = starts[endLine] === undefined ? sourceText.length : starts[endLine] - 1;
  return { start: lineStart + Math.max(0, (span.startColumn ?? 1) - 1), end: endLineStart + (span.endColumn === undefined ? lineEnd - endLineStart : Math.max(0, span.endColumn - 1)) };
}

function isJavaScriptLike(language) { return language === 'javascript' || language === 'typescript'; }
function reasonList(values) { return uniqueStrings((values ?? []).filter(Boolean)); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
