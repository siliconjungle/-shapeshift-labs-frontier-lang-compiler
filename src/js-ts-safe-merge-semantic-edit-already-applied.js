import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { uniqueStrings } from './native-import-utils.js';

function normalizeAlreadyAppliedDeleteReplay(input) {
  if (!isProjectedDeleteAlreadyAppliedReplay(input)) return input.alreadyAppliedReplay;
  const { hash: _hash, ...alreadyAppliedReplay } = input.alreadyAppliedReplay;
  const normalizedEdits = input.alreadyAppliedReplay.edits.map((edit) => alreadyAppliedDeleteEdit(edit));
  const reasonCodes = uniqueStrings(normalizedEdits.flatMap((edit) => edit.reasonCodes ?? []));
  const core = {
    ...alreadyAppliedReplay,
    currentHash: input.projection.projectedHash,
    outputHash: input.projection.projectedHash,
    status: 'already-applied',
    edits: normalizedEdits,
    appliedOperations: [],
    skippedOperations: normalizedEdits.map((edit) => edit.operationId).filter(Boolean),
    diagnostics: [],
    admission: {
      status: 'already-applied',
      action: 'skip',
      reviewRequired: false,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    outputSourceText: input.projection.sourceText,
    summary: {
      edits: normalizedEdits.length,
      applied: 0,
      alreadyApplied: normalizedEdits.length,
      conflicts: 0,
      stale: 0,
      blocked: 0,
      reasonCodes
    },
    metadata: {
      ...input.alreadyAppliedReplay.metadata,
      normalizedAlreadyAppliedReplay: 'projected-delete-anchor-absent'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function isProjectedDeleteAlreadyAppliedReplay(input) {
  if (input.projection?.status !== 'projected') return false;
  if (input.replay?.status !== 'accepted-clean') return false;
  if (input.replay.outputSourceText !== input.projection.sourceText) return false;
  const replay = input.alreadyAppliedReplay;
  if (replay?.status !== 'stale') return false;
  if (replay.currentHash !== input.projection.projectedHash) return false;
  const edits = replay.edits ?? [];
  if (!edits.length) return false;
  const appliedDeleteIds = new Set((input.replay.edits ?? [])
    .filter((edit) => edit.status === 'applied' && edit.editKind === 'delete')
    .map((edit) => edit.operationId));
  const projectionDeleteIds = new Set((input.projection.edits ?? [])
    .filter((edit) => edit.editKind === 'delete')
    .map((edit) => edit.operationId));
  const staleDeletes = edits.filter(isProjectedDeleteMissingAnchor);
  return staleDeletes.length > 0
    && edits.every((edit) => edit.status === 'already-applied' || isProjectedDeleteMissingAnchor(edit))
    && staleDeletes.every((edit) => appliedDeleteIds.has(edit.operationId) && projectionDeleteIds.has(edit.operationId));
}

function isProjectedDeleteMissingAnchor(edit) {
  return edit.editKind === 'delete'
    && edit.status === 'stale'
    && (edit.reasonCodes ?? []).includes('current-symbol-anchor-missing');
}

function alreadyAppliedDeleteEdit(edit) {
  if (!isProjectedDeleteMissingAnchor(edit)) return edit;
  return {
    ...edit,
    status: 'already-applied',
    reasonCodes: ['projected-delete-anchor-absent'],
    diagnostics: []
  };
}

export { normalizeAlreadyAppliedDeleteReplay };
