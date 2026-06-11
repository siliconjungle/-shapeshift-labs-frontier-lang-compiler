import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { semanticEditIdentityFields } from './semanticEditIdentityRecords.js';
import { applySourceEdits, dedupeSourceEdits, validateSourceEdits } from './semanticSourceEditDedupe.js';

export function projectSemanticEditScriptToSource(input = {}) {
  const script = input.script;
  const workerSourceText = input.workerSourceText;
  const headSourceText = input.headSourceText;
  const reasonCodes = [];
  if (!script) throw new Error('projectSemanticEditScriptToSource requires a script');
  if (script.admission?.status !== 'auto-merge-candidate') reasonCodes.push('script-not-auto-merge-candidate');
  if (typeof workerSourceText !== 'string') reasonCodes.push('missing-worker-source-text');
  if (typeof headSourceText !== 'string') reasonCodes.push('missing-head-source-text');
  const edits = [];
  const coveredOperationIds = [];
  for (const [index, operation] of (script.operations ?? []).entries()) {
    if (operation.status === 'covered') {
      coveredOperationIds.push(operation.id);
      continue;
    }
    const edit = sourceEditForOperation(operation, workerSourceText, headSourceText, index);
    if (edit.ok) edits.push(edit.value);
    else reasonCodes.push(...edit.reasonCodes);
  }
  const deduped = dedupeSourceEdits(edits);
  reasonCodes.push(...validateSourceEdits(deduped.edits));
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
      ...input.metadata
    })
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function sourceEditForOperation(operation, workerSourceText, headSourceText, order) {
  const identity = projectionIdentity(operation);
  if (operation.status === 'already-applied') {
    return { ok: true, value: { ...identity, operationId: operation.id, order, start: 0, end: 0, replacement: '', current: '', alreadyApplied: true } };
  }
  if (operation.status !== 'portable') return { ok: false, reasonCodes: [`operation-not-portable:${operation.id}`] };
  if (operation.changeKind === 'added' || String(operation.kind ?? '').startsWith('add')) {
    return insertionEditForOperation(operation, identity, workerSourceText, headSourceText, order);
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
  const replacement = workerSourceText.slice(workerOffsets.start, workerOffsets.end);
  const current = headSourceText.slice(headOffsets.start, headOffsets.end);
  if (operation.hashes?.workerTextHash && hashSemanticValue(replacement) !== operation.hashes.workerTextHash) {
    reasons.push(`worker-span-hash-mismatch:${operation.id}`);
  }
  const expectedHeadHash = operation.hashes?.headTextHash ?? operation.hashes?.baseTextHash;
  if (expectedHeadHash && hashSemanticValue(current) !== expectedHeadHash) {
    reasons.push(`head-span-hash-mismatch:${operation.id}`);
  }
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  return {
    ok: true,
    value: {
      operationId: operation.id,
      order,
      ...identity,
      editKind: 'replace',
      start: headOffsets.start,
      end: headOffsets.end,
      workerStart: workerOffsets.start,
      workerEnd: workerOffsets.end,
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

function insertionEditForOperation(operation, identity, workerSourceText, headSourceText, order) {
  const workerOffsets = spanOffsets(workerSourceText, operation.spans?.worker);
  const reasons = [];
  if (!workerOffsets) reasons.push(`worker-span-not-resolvable:${operation.id}`);
  const insertion = insertionOffset(headSourceText, operation.insertion);
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

function projectionIdentity(operation) {
  const identity = semanticEditIdentity(operation);
  return { ...identity, sourcePath: operation.reanchor?.toSourcePath ?? identity.sourcePath };
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
      deletedTextHash,
      replacementTextHash,
      status: edit.alreadyApplied ? 'already-applied' : 'applied'
    })),
    headStart: edit.start,
    headEnd: edit.end,
    workerStart: edit.workerStart,
    workerEnd: edit.workerEnd,
    deletedBytes: edit.current.length,
    replacementBytes: edit.replacement.length,
    deletedTextHash,
    replacementTextHash,
    replacementSpanTextHash: hashSemanticValue(edit.replacementSpanText ?? edit.replacement),
    insertionMode: edit.insertion?.mode,
    insertionAnchorKey: edit.insertion?.anchorKey,
    insertionAnchorSymbolName: edit.insertion?.anchorSymbolName,
    insertionAnchorSymbolKind: edit.insertion?.anchorSymbolKind,
    replacementText: edit.replacement
  });
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

function insertionOffset(sourceText, insertion) {
  if (typeof sourceText !== 'string') return { ok: false, reasonCodes: ['missing-head-source-text'] };
  const mode = insertion?.mode;
  if (mode === 'file-start') return { ok: true, offset: 0 };
  if (mode === 'file-end') return { ok: true, offset: sourceText.length };
  const range = spanOffsets(sourceText, insertion?.headSpan);
  if (!range) return { ok: false, reasonCodes: ['insertion-anchor-not-resolvable'] };
  if (mode === 'before') return { ok: true, offset: range.start };
  if (mode === 'after') return { ok: true, offset: afterLineOffset(sourceText, range.end) };
  return { ok: false, reasonCodes: ['insertion-mode-unsupported'] };
}

function removalRange(sourceText, span) {
  const range = { ...span };
  if (range.end < sourceText.length && sourceText[range.end] === '\n') range.end += 1;
  else if (range.start > 0 && sourceText[range.start - 1] === '\n') range.start -= 1;
  return range;
}

function insertionReplacement(text, sourceText, offset) {
  let replacement = String(text ?? '');
  if (offset > 0 && sourceText[offset - 1] !== '\n') replacement = `\n${replacement}`;
  if (offset < sourceText.length && !replacement.endsWith('\n')) replacement += '\n';
  if (offset === sourceText.length && sourceText && !sourceText.endsWith('\n')) replacement = `\n${replacement}`;
  if (offset === sourceText.length && !replacement.endsWith('\n')) replacement += '\n';
  return replacement;
}

function afterLineOffset(sourceText, offset) {
  return sourceText[offset] === '\n' ? offset + 1 : offset;
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
