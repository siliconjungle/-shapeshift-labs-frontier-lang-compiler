import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { semanticEditIdentityFields } from './semanticEditIdentityRecords.js';

export function projectionEditRecord(edit) {
  const deletedTextHash = hashSemanticValue(edit.current);
  const replacementTextHash = hashSemanticValue(edit.replacement);
  const replacementSpanText = edit.replacementSpanText ?? edit.replacement;
  const identity = semanticEditIdentityFields(edit);
  const sourceIdentity = sourceIdentityAnchorFields(edit);
  return compactRecord({
    operationId: edit.operationId,
    status: edit.alreadyApplied ? 'already-applied' : 'applied',
    kind: edit.kind,
    editKind: edit.editKind,
    changeKind: edit.changeKind,
    anchorKey: edit.anchorKey,
    conflictKey: edit.conflictKey,
    regionId: edit.regionId,
    regionKind: edit.regionKind,
    sourcePath: edit.sourcePath,
    originalSourcePath: edit.originalSourcePath,
    targetAnchorKey: edit.targetAnchorKey,
    targetSourcePath: edit.targetSourcePath,
    targetSymbolName: edit.targetSymbolName,
    targetSymbolKind: edit.targetSymbolKind,
    symbolId: edit.symbolId,
    symbolName: edit.symbolName,
    symbolKind: edit.symbolKind,
    ...identity,
    ...sourceIdentity,
    operationContentHash: edit.operationContentHash,
    editContentHash: hashSemanticValue(compactRecord({
      semanticIdentityHash: identity.semanticIdentityHash,
      sourceIdentityHash: identity.sourceIdentityHash,
      sourceIdentityStatus: sourceIdentity.sourceIdentityStatus,
      sourceIdentityAnchorKey: sourceIdentity.sourceIdentityAnchorKey,
      targetIdentityAnchorKey: sourceIdentity.targetIdentityAnchorKey,
      sourceRangeKind: edit.sourceRangeKind,
      deletedTextHash,
      replacementTextHash,
      status: edit.alreadyApplied ? 'already-applied' : 'applied'
    })),
    sourceRangeKind: edit.sourceRangeKind,
    headStart: edit.start,
    headEnd: edit.end,
    workerStart: edit.workerStart,
    workerEnd: edit.workerEnd,
    editOrder: edit.order,
    headAnchorStart: edit.headAnchorStart,
    headAnchorEnd: edit.headAnchorEnd,
    workerAnchorStart: edit.workerAnchorStart,
    workerAnchorEnd: edit.workerAnchorEnd,
    deletedBytes: edit.current.length,
    replacementBytes: edit.replacement.length,
    deletedTextHash,
    replacementTextHash,
    deletedText: deletedTextForEdit(edit),
    deletedTextLineEndingStableHash: lineEndingStableTextHash(edit.current),
    replacementTextLineEndingStableHash: lineEndingStableTextHash(edit.replacement),
    anchorDeletedTextHash: edit.anchorDeletedTextHash,
    anchorReplacementTextHash: edit.anchorReplacementTextHash,
    replacementSpanTextHash: hashSemanticValue(replacementSpanText),
    replacementSpanTextLineEndingStableHash: lineEndingStableTextHash(replacementSpanText),
    insertionMode: edit.insertion?.mode,
    insertionAnchorKey: edit.insertion?.anchorKey,
    insertionAnchorSymbolName: edit.insertion?.anchorSymbolName,
    insertionAnchorSymbolKind: edit.insertion?.anchorSymbolKind,
    insertionAnchorCandidates: edit.insertion?.anchorCandidates,
    replacementText: edit.replacement
  });
}

function deletedTextForEdit(edit) {
  return edit.sourceRangeKind === 'cross-language-explicit-source-replacement' ? edit.current : undefined;
}

function sourceIdentityAnchorFields(edit) {
  const sourceIdentityAnchorKey = edit.sourceIdentityAnchorKey ?? edit.anchorKey;
  const targetIdentityAnchorKey = edit.targetIdentityAnchorKey ?? edit.targetAnchorKey ?? sourceIdentityAnchorKey;
  const sourceIdentitySourcePath = edit.sourceIdentitySourcePath ?? edit.originalSourcePath ?? edit.sourcePath;
  const targetIdentitySourcePath = edit.targetIdentitySourcePath ?? edit.targetSourcePath ?? edit.sourcePath;
  const moved = Boolean(
    (sourceIdentityAnchorKey && targetIdentityAnchorKey && sourceIdentityAnchorKey !== targetIdentityAnchorKey)
    || (sourceIdentitySourcePath && targetIdentitySourcePath && sourceIdentitySourcePath !== targetIdentitySourcePath)
  );
  return compactRecord({
    sourceIdentityStatus: edit.sourceIdentityStatus ?? (moved ? 'moved-source' : 'same-source'),
    sourceIdentityAnchorKey,
    targetIdentityAnchorKey,
    sourceIdentitySourcePath,
    targetIdentitySourcePath
  });
}

function lineEndingStableTextHash(value) {
  const normalized = lineEndingStableText(value);
  return normalized === undefined ? undefined : hashSemanticValue(normalized);
}

function lineEndingStableText(value) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.length > 1 && normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
