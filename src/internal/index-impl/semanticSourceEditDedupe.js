import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { uniqueStrings } from '../../native-import-utils.js';

export function applySourceEdits(sourceText, edits) {
  return edits.filter((edit) => !edit.alreadyApplied)
    .sort(sourceEditSort)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), sourceText);
}

export function dedupeSourceEdits(edits) {
  const exact = dedupeExactInsertions(edits);
  const covered = removeCoveredContainerReplacements(exact.edits);
  return {
    edits: covered.edits,
    skippedOperationIds: [...exact.skippedOperationIds, ...covered.skippedOperationIds]
  };
}

export function validateSourceEdits(edits) {
  const reasons = [];
  const ordered = edits.filter((edit) => !edit.alreadyApplied).sort((left, right) => left.start - right.start || left.end - right.end);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (editsOverlap(previous, current)) reasons.push(`source-edit-overlap:${previous.operationId}:${current.operationId}`);
  }
  return uniqueStrings(reasons);
}

function dedupeExactInsertions(edits) {
  const seen = new Map();
  const result = [];
  const skippedOperationIds = [];
  for (const edit of edits) {
    const key = duplicateEditKey(edit);
    if (key && seen.has(key)) {
      skippedOperationIds.push(edit.operationId);
      continue;
    }
    if (key) seen.set(key, edit.operationId);
    result.push(edit);
  }
  return { edits: result, skippedOperationIds };
}

function removeCoveredContainerReplacements(edits) {
  const skippedOperationIds = [];
  const result = [];
  for (const edit of edits) {
    if (containerReplacementCoveredByInsertions(edit, edits)) {
      skippedOperationIds.push(edit.operationId);
      continue;
    }
    result.push(edit);
  }
  return { edits: result, skippedOperationIds };
}

function containerReplacementCoveredByInsertions(edit, edits) {
  if (edit.editKind !== 'replace' || edit.alreadyApplied) return false;
  const insertions = containedInsertions(edit, edits);
  if (!insertions.length) return false;
  const localEdits = insertions.map((insertion) => ({
    ...insertion,
    start: insertion.start - edit.start,
    end: insertion.end - edit.start
  }));
  return applySourceEdits(edit.current, localEdits) === edit.replacement;
}

function containedInsertions(container, edits) {
  return edits
    .filter((edit) => edit.editKind === 'insert' && !edit.alreadyApplied)
    .filter((edit) => edit.operationId !== container.operationId)
    .filter((edit) => container.start <= edit.start && edit.end <= container.end)
    .sort((left, right) => left.start - right.start || (left.order ?? 0) - (right.order ?? 0));
}

function duplicateEditKey(edit) {
  if (edit.editKind !== 'insert') return undefined;
  return [
    'insert',
    edit.start,
    edit.end,
    edit.insertion?.mode,
    edit.insertion?.anchorKey,
    hashSemanticValue(edit.replacementSpanText ?? edit.replacement)
  ].join(':');
}

function sourceEditSort(left, right) {
  return right.start - left.start || right.end - left.end || (right.order ?? 0) - (left.order ?? 0);
}

function editsOverlap(left, right) {
  if (left.start === left.end) return right.start < left.start && left.start < right.end;
  if (right.start === right.end) return left.start < right.start && right.start < left.end;
  return left.start < right.end && right.start < left.end;
}
