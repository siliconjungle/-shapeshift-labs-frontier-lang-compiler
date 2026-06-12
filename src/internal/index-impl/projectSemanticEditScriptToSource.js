import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, normalizeNativeLanguageId, uniqueStrings } from '../../native-import-utils.js';
import { createSemanticImportSidecar } from './createSemanticImportSidecar.js';
import { mapDiffSymbols } from './mapDiffSymbols.js';
import { normalizeNativeDiffImport } from './normalizeNativeDiffImport.js';
import { semanticEditIdentityFields } from './semanticEditIdentityRecords.js';
import {
  insertionOffset,
  insertionReplacement,
  projectionCoveredContainerOperationIds,
  removalRange,
  scopedBodyReplacement,
  spanOffsets
} from './semanticEditSourceRanges.js';
import { applySourceEdits, dedupeSourceEdits, validateSourceEdits } from './semanticSourceEditDedupe.js';
export function projectSemanticEditScriptToSource(input = {}) {
  const script = input.script;
  const workerSourceText = input.workerSourceText;
  const headSourceText = input.headSourceText;
  const reasonCodes = [];
  if (!script) throw new Error('projectSemanticEditScriptToSource requires a script');
  if (typeof workerSourceText !== 'string') reasonCodes.push('missing-worker-source-text');
  if (typeof headSourceText !== 'string') reasonCodes.push('missing-head-source-text');
  const language = normalizeNativeLanguageId(script.language);
  const headSymbols = typeof headSourceText === 'string' && isJavaScriptLike(language)
    ? sourceSymbolIndex({
      sourceText: headSourceText,
      sourcePath: input.headSourcePath ?? script.sourcePath,
      language,
      parser: input.parser
    })
    : [];
  const edits = [];
  const coveredOperationIds = [];
  const projectionCoveredOperationIds = projectionCoveredContainerOperationIds(script.operations ?? [], workerSourceText);
  for (const [index, operation] of (script.operations ?? []).entries()) {
    if (operation.status === 'covered' || projectionCoveredOperationIds.has(operation.id)) {
      coveredOperationIds.push(operation.id);
      continue;
    }
    const edit = sourceEditForOperation(operation, workerSourceText, headSourceText, index, {
      headSourcePath: input.headSourcePath,
      headSymbols
    });
    if (edit.ok) edits.push(edit.value);
    else reasonCodes.push(...edit.reasonCodes);
  }
  const deduped = dedupeSourceEdits(edits);
  reasonCodes.push(...validateSourceEdits(deduped.edits));
  if (script.admission?.status !== 'auto-merge-candidate' && (reasonCodes.length > 0 || (!edits.length && !coveredOperationIds.length))) {
    reasonCodes.push('script-not-auto-merge-candidate');
  }
  const blocked = reasonCodes.length > 0;
  const sourceText = blocked ? undefined : applySourceEdits(headSourceText, deduped.edits);
  const core = {
    kind: 'frontier.lang.semanticEditProjection',
    version: 1,
    id: input.id ?? `semantic_edit_projection_${idFragment(script.id ?? script.hash ?? 'script')}`,
    scriptId: script.id,
    status: blocked ? 'blocked' : 'projected',
    sourcePath: input.headSourcePath ?? projectedSourcePath(script, edits),
    language: script.language,
    baseHash: script.baseHash,
    workerHash: script.workerHash,
    headHash: script.headHash,
    projectedHash: sourceText === undefined ? undefined : hashSemanticValue(sourceText),
    appliedOperations: blocked ? [] : deduped.edits.map((edit) => edit.operationId),
    skippedOperations: blocked ? (script.operations ?? []).map((operation) => operation.id) : uniqueStrings([...coveredOperationIds, ...deduped.skippedOperationIds]),
    edits: blocked ? [] : deduped.edits.map(projectionEditRecord),
    sourceText,
    admission: {
      status: blocked ? 'blocked' : 'auto-merge-candidate',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(reasonCodes)
    },
    metadata: compactRecord({
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      editCount: edits.length,
      appliedEditCount: deduped.edits.filter((edit) => !edit.alreadyApplied).length,
      alreadyAppliedEditCount: deduped.edits.filter((edit) => edit.alreadyApplied).length,
      dedupedEditCount: deduped.skippedOperationIds.length,
      anchorMode: headSymbols.length ? 'javascript-like-symbols' : 'offsets',
      ...input.metadata
    })
  };
  return { ...core, hash: hashSemanticValue(core) };
}
function sourceEditForOperation(operation, workerSourceText, headSourceText, order, context) {
  const identity = projectionIdentity(operation, context.headSourcePath);
  if (operation.status === 'already-applied') {
    return { ok: true, value: { ...identity, operationId: operation.id, order, start: 0, end: 0, replacement: '', current: '', alreadyApplied: true } };
  }
  if (operation.status !== 'portable') return { ok: false, reasonCodes: [`operation-not-portable:${operation.id}`] };
  if (operation.changeKind === 'added' || String(operation.kind ?? '').startsWith('add')) {
    return insertionEditForOperation(operation, identity, workerSourceText, headSourceText, order, context);
  }
  if (operation.changeKind === 'removed' || String(operation.kind ?? '').startsWith('remove')) {
    return removalEditForOperation(operation, identity, headSourceText, order);
  }
  const workerOffsets = spanOffsets(workerSourceText, operation.spans?.worker);
  const headOffsets = spanOffsets(headSourceText, operation.spans?.head ?? operation.spans?.base ?? operation.anchor?.sourceSpan);
  const reasons = [];
  if (!workerOffsets) reasons.push(`worker-span-not-resolvable:${operation.id}`);
  if (!headOffsets) reasons.push(`head-span-not-resolvable:${operation.id}`);
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  const anchorReplacement = workerSourceText.slice(workerOffsets.start, workerOffsets.end);
  const anchorCurrent = headSourceText.slice(headOffsets.start, headOffsets.end);
  if (operation.hashes?.workerTextHash && hashSemanticValue(anchorReplacement) !== operation.hashes.workerTextHash) {
    reasons.push(`worker-span-hash-mismatch:${operation.id}`);
  }
  const expectedHeadHash = operation.hashes?.headTextHash ?? operation.hashes?.baseTextHash;
  if (expectedHeadHash && hashSemanticValue(anchorCurrent) !== expectedHeadHash) {
    reasons.push(`head-span-hash-mismatch:${operation.id}`);
  }
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  const scoped = scopedBodyReplacement(operation, headSourceText, workerSourceText, headOffsets, workerOffsets);
  const replacement = scoped
    ? workerSourceText.slice(scoped.worker.start, scoped.worker.end)
    : anchorReplacement;
  const current = scoped
    ? headSourceText.slice(scoped.head.start, scoped.head.end)
    : anchorCurrent;
  return {
    ok: true,
    value: {
      operationId: operation.id,
      order,
      ...identity,
      editKind: 'replace',
      sourceRangeKind: scoped?.sourceRangeKind,
      start: scoped?.head.start ?? headOffsets.start,
      end: scoped?.head.end ?? headOffsets.end,
      workerStart: scoped?.worker.start ?? workerOffsets.start,
      workerEnd: scoped?.worker.end ?? workerOffsets.end,
      headAnchorStart: scoped ? headOffsets.start : undefined,
      headAnchorEnd: scoped ? headOffsets.end : undefined,
      workerAnchorStart: scoped ? workerOffsets.start : undefined,
      workerAnchorEnd: scoped ? workerOffsets.end : undefined,
      anchorDeletedTextHash: scoped ? hashSemanticValue(anchorCurrent) : undefined,
      anchorReplacementTextHash: scoped ? hashSemanticValue(anchorReplacement) : undefined,
      replacement,
      current
    }
  };
}
function removalEditForOperation(operation, identity, headSourceText, order) {
  const headOffsets = spanOffsets(headSourceText, operation.spans?.head ?? operation.spans?.base ?? operation.anchor?.sourceSpan);
  const reasons = [];
  if (!headOffsets) reasons.push(`head-span-not-resolvable:${operation.id}`);
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  const rawCurrent = headSourceText.slice(headOffsets.start, headOffsets.end);
  const expectedHeadHash = operation.hashes?.headTextHash ?? operation.hashes?.baseTextHash;
  if (expectedHeadHash && hashSemanticValue(rawCurrent) !== expectedHeadHash) {
    reasons.push(`head-span-hash-mismatch:${operation.id}`);
  }
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  const range = removalRange(headSourceText, headOffsets);
  return {
    ok: true,
    value: {
      operationId: operation.id,
      order,
      ...identity,
      editKind: 'delete',
      start: range.start,
      end: range.end,
      current: headSourceText.slice(range.start, range.end),
      replacement: ''
    }
  };
}
function insertionEditForOperation(operation, identity, workerSourceText, headSourceText, order, context) {
  const workerOffsets = spanOffsets(workerSourceText, operation.spans?.worker);
  const reasons = [];
  if (!workerOffsets) reasons.push(`worker-span-not-resolvable:${operation.id}`);
  const insertion = insertionOffset(headSourceText, operation.insertion, { symbols: context.headSymbols });
  if (!insertion.ok) reasons.push(...insertion.reasonCodes.map((reason) => `${reason}:${operation.id}`));
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  const spanText = workerSourceText.slice(workerOffsets.start, workerOffsets.end);
  if (operation.hashes?.workerTextHash && hashSemanticValue(spanText) !== operation.hashes.workerTextHash) {
    reasons.push(`worker-span-hash-mismatch:${operation.id}`);
  }
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  return {
    ok: true,
    value: {
      operationId: operation.id,
      order,
      ...identity,
      editKind: 'insert',
      insertion: operation.insertion,
      start: insertion.offset,
      end: insertion.offset,
      workerStart: workerOffsets.start,
      workerEnd: workerOffsets.end,
      replacement: insertionReplacement(spanText, headSourceText, insertion.offset),
      replacementSpanText: spanText,
      current: ''
    }
  };
}
function projectionIdentity(operation, headSourcePath) {
  const identity = semanticEditIdentity(operation);
  const sourcePath = operation.reanchor?.toSourcePath ?? headSourcePath ?? operation.insertion?.sourcePath ?? identity.sourcePath;
  const originalSourcePath = sourcePath && identity.sourcePath && sourcePath !== identity.sourcePath
    ? identity.sourcePath
    : identity.originalSourcePath;
  const targetSourcePath = sourcePath && sourcePath !== identity.sourcePath
    ? sourcePath
    : identity.targetSourcePath;
  return { ...identity, sourcePath, originalSourcePath, targetSourcePath };
}
function projectionEditRecord(edit) {
  const deletedTextHash = hashSemanticValue(edit.current);
  const replacementTextHash = hashSemanticValue(edit.replacement);
  const identity = semanticEditIdentityFields(edit);
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
    operationContentHash: edit.operationContentHash,
    editContentHash: hashSemanticValue(compactRecord({
      semanticIdentityHash: identity.semanticIdentityHash,
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
    anchorDeletedTextHash: edit.anchorDeletedTextHash,
    anchorReplacementTextHash: edit.anchorReplacementTextHash,
    replacementSpanTextHash: hashSemanticValue(edit.replacementSpanText ?? edit.replacement),
    insertionMode: edit.insertion?.mode,
    insertionAnchorKey: edit.insertion?.anchorKey,
    insertionAnchorSymbolName: edit.insertion?.anchorSymbolName,
    insertionAnchorSymbolKind: edit.insertion?.anchorSymbolKind,
    insertionAnchorCandidates: edit.insertion?.anchorCandidates,
    replacementText: edit.replacement
  });
}

function sourceSymbolIndex(input) {
  try {
    const imported = normalizeNativeDiffImport({
      language: input.language,
      sourcePath: input.sourcePath,
      sourceText: input.sourceText,
      parser: input.parser
    }, input, 'head');
    return [...mapDiffSymbols(imported, createSemanticImportSidecar(imported)).values()];
  } catch {
    return [];
  }
}

function semanticEditIdentity(operation) {
  const anchor = operation.anchor ?? {};
  return compactRecord({
    kind: operation.kind,
    changeKind: operation.changeKind,
    anchorKey: anchor.key,
    conflictKey: anchor.conflictKey,
    regionId: anchor.regionId,
    regionKind: anchor.regionKind,
    sourcePath: anchor.sourcePath,
    originalSourcePath: operation.reanchor?.toSourcePath ? anchor.sourcePath : undefined,
    targetAnchorKey: operation.reanchor?.toAnchorKey,
    targetSourcePath: operation.reanchor?.toSourcePath,
    targetSymbolName: operation.reanchor?.toSymbolName,
    targetSymbolKind: operation.reanchor?.toSymbolKind,
    symbolId: anchor.symbolId,
    symbolName: anchor.symbolName,
    symbolKind: anchor.symbolKind,
    semanticKey: operation.semanticKey,
    semanticIdentityHash: operation.semanticIdentityHash,
    sourceIdentityHash: operation.sourceIdentityHash,
    operationContentHash: operation.operationContentHash
  });
}

function projectedSourcePath(script, edits) {
  return edits.map((edit) => edit.sourcePath).find(Boolean) ?? script.sourcePath;
}

function isJavaScriptLike(language) { return language === 'javascript' || language === 'typescript'; }
function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
