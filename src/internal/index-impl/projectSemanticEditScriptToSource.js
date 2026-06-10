import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';

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
  for (const operation of script.operations ?? []) {
    const edit = sourceEditForOperation(operation, workerSourceText, headSourceText);
    if (edit.ok) edits.push(edit.value);
    else reasonCodes.push(...edit.reasonCodes);
  }
  const blocked = reasonCodes.length > 0;
  const sourceText = blocked ? undefined : applySourceEdits(headSourceText, edits);
  const core = {
    kind: 'frontier.lang.semanticEditProjection',
    version: 1,
    id: input.id ?? `semantic_edit_projection_${idFragment(script.id ?? script.hash ?? 'script')}`,
    scriptId: script.id,
    status: blocked ? 'blocked' : 'projected',
    sourcePath: script.sourcePath,
    language: script.language,
    baseHash: script.baseHash,
    workerHash: script.workerHash,
    headHash: script.headHash,
    projectedHash: sourceText === undefined ? undefined : hashSemanticValue(sourceText),
    appliedOperations: blocked ? [] : edits.map((edit) => edit.operationId),
    skippedOperations: blocked ? (script.operations ?? []).map((operation) => operation.id) : [],
    edits: blocked ? [] : edits.map(projectionEditRecord),
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
      appliedEditCount: edits.filter((edit) => !edit.alreadyApplied).length,
      alreadyAppliedEditCount: edits.filter((edit) => edit.alreadyApplied).length,
      ...input.metadata
    })
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function sourceEditForOperation(operation, workerSourceText, headSourceText) {
  if (operation.status === 'already-applied') {
    return { ok: true, value: { operationId: operation.id, start: 0, end: 0, replacement: '', current: '', alreadyApplied: true } };
  }
  if (operation.status !== 'portable') return { ok: false, reasonCodes: [`operation-not-portable:${operation.id}`] };
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
      start: headOffsets.start,
      end: headOffsets.end,
      workerStart: workerOffsets.start,
      workerEnd: workerOffsets.end,
      replacement,
      current
    }
  };
}

function projectionEditRecord(edit) {
  return compactRecord({
    operationId: edit.operationId,
    status: edit.alreadyApplied ? 'already-applied' : 'applied',
    headStart: edit.start,
    headEnd: edit.end,
    workerStart: edit.workerStart,
    workerEnd: edit.workerEnd,
    deletedBytes: edit.current.length,
    replacementBytes: edit.replacement.length,
    deletedTextHash: hashSemanticValue(edit.current),
    replacementTextHash: hashSemanticValue(edit.replacement),
    replacementText: edit.replacement
  });
}

function applySourceEdits(sourceText, edits) {
  return edits.filter((edit) => !edit.alreadyApplied)
    .sort((left, right) => right.start - left.start)
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

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
