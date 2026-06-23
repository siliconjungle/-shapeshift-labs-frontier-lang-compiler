import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from './native-import-utils.js';
import { replaySemanticEditProjection } from './internal/index-impl/replaySemanticEditProjection.js';
import { projectionEditRecord } from './internal/index-impl/semanticEditProjectionRecord.js';
import { applySourceEdits, dedupeSourceEdits, validateSourceEdits } from './internal/index-impl/semanticSourceEditDedupe.js';
import { createMergeContext } from './js-ts-safe-merge-context.js';
import { scanJsTsTopLevelLedger } from './js-ts-safe-merge-ledger.js';
import { createOperationsFromLedgers, sourceEditForOperation } from './js-ts-safe-merge-semantic-artifact-ledger.js';

function createJsTsSafeMergeSemanticArtifacts(input = {}, merge = {}) {
  const headSourceText = input.headSourceText;
  const mergedSourceText = merge.mergedSourceText ?? merge.outputSourceText;
  const language = input.language ?? merge.language ?? 'typescript';
  const sourcePath = input.sourcePath ?? merge.sourcePath ?? 'inline.js';
  const id = String(input.id ?? merge.id ?? 'js_ts_safe_merge');
  const baseReasonCodes = [];
  if (typeof headSourceText !== 'string') baseReasonCodes.push('missing-head-source-text');
  if (typeof mergedSourceText !== 'string') baseReasonCodes.push('missing-merged-source-text');
  if (baseReasonCodes.length) return blockedArtifacts({ id, language, sourcePath, reasonCodes: baseReasonCodes, merge });

  const ledgerContext = createMergeContext({ ...input, id: `${id}_semantic_artifacts`, language, sourcePath });
  const head = scanJsTsTopLevelLedger(headSourceText, 'head', ledgerContext);
  const merged = scanJsTsTopLevelLedger(mergedSourceText, 'merged', ledgerContext);
  if (ledgerContext.conflicts.length) {
    return blockedArtifacts({
      id,
      language,
      sourcePath,
      reasonCodes: uniqueStrings(ledgerContext.conflicts.map((conflict) => conflict.code)),
      merge,
      ledgers: { head, merged }
    });
  }

  const operations = createOperationsFromLedgers({ id, language, sourcePath, head, merged, input, merge });
  const rawEdits = operations.map((operation, order) => sourceEditForOperation(operation, order, headSourceText, mergedSourceText));
  const deduped = dedupeSourceEdits(rawEdits);
  const reasonCodes = uniqueStrings([
    ...validateSourceEdits(deduped.edits),
    ...deduped.skippedOperationIds.map((operationId) => `source-edit-deduped:${operationId}`)
  ]);
  const sourceText = reasonCodes.length ? undefined : applySourceEdits(headSourceText, deduped.edits);
  if (sourceText !== mergedSourceText) reasonCodes.push('projected-source-mismatch');
  const blocked = reasonCodes.length > 0;
  const script = createScript({ id, language, sourcePath, input, merge, operations, blocked, reasonCodes });
  const projection = createProjection({
    id,
    language,
    sourcePath,
    input,
    merge,
    script,
    edits: blocked ? [] : deduped.edits,
    skippedOperationIds: deduped.skippedOperationIds,
    sourceText: blocked ? undefined : sourceText,
    reasonCodes
  });
  const replay = replaySemanticEditProjection({
    id: `js_ts_safe_merge_replay_${idFragment(id)}`,
    projection,
    currentSourceText: headSourceText,
    currentSourceHash: headReplaySourceHash(input),
    currentSourcePath: sourcePath,
    language
  });
  const alreadyAppliedReplay = replaySemanticEditProjection({
    id: `js_ts_safe_merge_replay_already_applied_${idFragment(id)}`,
    projection,
    currentSourceText: mergedSourceText,
    currentSourceHash: projection.projectedHash,
    currentSourcePath: sourcePath,
    language
  });
  const replayReady = replay.status === 'accepted-clean' && replay.outputSourceText === mergedSourceText;
  const alreadyAppliedReady = alreadyAppliedReplay.status === 'already-applied';
  const status = !blocked && replayReady && alreadyAppliedReady ? 'verified' : 'blocked';
  const finalReasonCodes = uniqueStrings([
    ...reasonCodes,
    ...(replayReady ? [] : replay.admission?.reasonCodes ?? replay.summary?.reasonCodes ?? []),
    ...(alreadyAppliedReady ? [] : alreadyAppliedReplay.admission?.reasonCodes ?? alreadyAppliedReplay.summary?.reasonCodes ?? []),
    replayReady ? undefined : `semantic-replay-${replay.status}`,
    alreadyAppliedReady ? undefined : `semantic-replay-already-applied-${alreadyAppliedReplay.status}`
  ]);
  const core = {
    kind: 'frontier.lang.jsTsSafeMergeSemanticArtifacts',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMergeSemanticArtifacts.v1',
    id: `js_ts_safe_merge_semantic_artifacts_${idFragment(id)}`,
    sourcePath,
    language,
    status,
    script,
    projection,
    replay,
    alreadyAppliedReplay,
    admission: {
      status: status === 'verified' ? 'auto-merge-candidate' : 'blocked',
      action: status === 'verified' ? 'apply' : 'human-review',
      reviewRequired: status !== 'verified',
      autoApplyCandidate: status === 'verified',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: finalReasonCodes
    },
    summary: {
      operations: operations.length,
      edits: projection.edits.length,
      replayStatus: replay.status,
      alreadyAppliedReplayStatus: alreadyAppliedReplay.status,
      projectedSourceMatchesMerged: projection.sourceText === mergedSourceText,
      replayOutputMatchesMerged: replay.outputSourceText === mergedSourceText
    },
    evidence: [{
      id: `evidence_${idFragment(id)}_js_ts_safe_merge_semantic_replay`,
      kind: 'js-ts-safe-merge-semantic-replay',
      status: status === 'verified' ? 'passed' : 'needs-review',
      path: sourcePath,
      summary: status === 'verified'
        ? `JS/TS safe merge replay verified ${operations.length} semantic source edit(s).`
        : `JS/TS safe merge semantic replay requires review: ${finalReasonCodes.join(', ')}.`,
      metadata: {
        scriptId: script.id,
        projectionId: projection.id,
        replayId: replay.id,
        alreadyAppliedReplayId: alreadyAppliedReplay.id,
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      }
    }],
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'js-ts-safe-merge-ledger',
      mergeGateIds: (merge.gates ?? []).map((gate) => gate.id)
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function createScript(input) {
  const statuses = countBy(input.operations, (operation) => operation.status);
  const kinds = countBy(input.operations, (operation) => operation.kind);
  const reasonCodes = uniqueStrings(input.reasonCodes);
  const core = {
    kind: 'frontier.lang.semanticEditScript',
    version: 1,
    schema: 'frontier.lang.semanticEditScript.v1',
    id: `js_ts_safe_merge_script_${idFragment(input.id)}`,
    stableId: `js_ts_safe_merge_script_${idFragment([input.id, input.merge.mergedSourceText].join(':'))}`,
    language: input.language,
    sourcePath: input.sourcePath,
    baseHash: input.input.baseHash,
    workerHash: input.input.workerHash,
    headHash: input.input.headHash,
    workerChangeSetId: input.input.workerChangeSetId,
    headChangeSetId: input.input.headChangeSetId,
    operations: input.operations,
    summary: {
      operations: input.operations.length,
      byStatus: statuses,
      byKind: kinds,
      portable: statuses.portable ?? 0,
      alreadyApplied: 0,
      needsPort: 0,
      conflicts: 0,
      stale: 0,
      blocked: input.blocked ? input.operations.length : 0,
      candidates: 0,
      autoMergeCandidates: input.blocked ? 0 : input.operations.length,
      operationContentHashes: input.operations.map((operation) => operation.operationContentHash)
    },
    admission: {
      status: input.blocked ? 'blocked' : 'auto-merge-candidate',
      action: input.blocked ? 'block' : 'run-gates-and-apply',
      reviewRequired: input.blocked,
      autoApplyCandidate: !input.blocked,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes,
      conflictKeys: input.operations.map((operation) => operation.anchor.conflictKey),
      evidenceIds: input.operations.flatMap((operation) => operation.evidenceIds ?? [])
    },
    evidence: [],
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'js-ts-safe-merge-ledger'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function createProjection(input) {
  const blocked = input.reasonCodes.length > 0;
  const edits = blocked ? [] : input.edits.map(projectionEditRecord);
  const core = {
    kind: 'frontier.lang.semanticEditProjection',
    version: 1,
    id: `js_ts_safe_merge_projection_${idFragment(input.id)}`,
    scriptId: input.script.id,
    status: blocked ? 'blocked' : 'projected',
    sourcePath: input.sourcePath,
    language: input.language,
    baseHash: input.input.baseHash,
    workerHash: input.input.workerHash,
    headHash: input.input.headHash,
    projectedHash: input.sourceText === undefined ? undefined : hashSemanticValue(input.sourceText),
    appliedOperations: edits.map((edit) => edit.operationId).filter(Boolean),
    skippedOperations: blocked ? input.script.operations.map((operation) => operation.id) : input.skippedOperationIds,
    edits,
    sourceText: input.sourceText,
    admission: {
      status: blocked ? 'blocked' : 'auto-merge-candidate',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(input.reasonCodes)
    },
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'js-ts-safe-merge-ledger'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function blockedArtifacts(input) {
  const core = {
    kind: 'frontier.lang.jsTsSafeMergeSemanticArtifacts',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMergeSemanticArtifacts.v1',
    id: `js_ts_safe_merge_semantic_artifacts_${idFragment(input.id)}`,
    sourcePath: input.sourcePath,
    language: input.language,
    status: 'blocked',
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(input.reasonCodes)
    },
    summary: {
      operations: 0,
      edits: 0,
      projectedSourceMatchesMerged: false,
      replayOutputMatchesMerged: false
    },
    evidence: [],
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'js-ts-safe-merge-ledger'
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function countBy(values, keyFor) {
  const result = {};
  for (const value of values) {
    const key = keyFor(value);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

function headReplaySourceHash(input) {
  return nativeSemanticHash(input.currentSourceHash) ?? nativeSemanticHash(input.headHash);
}

function nativeSemanticHash(value) {
  return typeof value === 'string' && /^fnv1a32:[0-9a-f]+$/i.test(value) ? value : undefined;
}

export { createJsTsSafeMergeSemanticArtifacts };
