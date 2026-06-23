import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import {
  independentTopLevelDeletionOperation,
  independentTopLevelDeletionProjection,
  independentTopLevelDeletionReplay,
  independentTopLevelDeletionScript
} from './js-ts-safe-merge-independent-deletion-records.js';
import { idFragment, uniqueStrings } from './native-import-utils.js';

function createIndependentTopLevelDeletionArtifacts(input, topLevelResult, deletionPlan) {
  const id = String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge');
  const language = input.language ?? topLevelResult.language ?? 'typescript';
  const sourcePath = input.sourcePath ?? topLevelResult.sourcePath ?? 'inline.ts';
  const operationId = `js_ts_independent_top_level_delete_${idFragment([id, deletionPlan.deletedEntry.key].join(':'))}`;
  const operation = independentTopLevelDeletionOperation({ id, operationId, language, sourcePath, deletionPlan, input });
  const script = independentTopLevelDeletionScript({ id, language, sourcePath, operation, input });
  const projection = independentTopLevelDeletionProjection({ id, language, sourcePath, operation, script, deletionPlan, input });
  const replay = independentTopLevelDeletionReplay({
    id: `${id}_semantic_edit_replay`,
    language,
    sourcePath,
    operation,
    projection,
    deletionPlan,
    currentSourceText: input.headSourceText,
    status: 'accepted-clean',
    editStatus: 'applied',
    reasonCodes: ['head-anchor-matches-base', 'independent-top-level-deletion'],
    outputSourceText: deletionPlan.mergedSourceText
  });
  const alreadyAppliedReplay = independentTopLevelDeletionReplay({
    id: `${id}_semantic_edit_already_applied`,
    language,
    sourcePath,
    operation,
    projection,
    deletionPlan,
    currentSourceText: deletionPlan.mergedSourceText,
    status: 'already-applied',
    editStatus: 'already-applied',
    reasonCodes: ['independent-top-level-deletion-already-applied'],
    outputSourceText: deletionPlan.mergedSourceText
  });
  const status = projection.status === 'projected'
    && replay.status === 'accepted-clean'
    && replay.outputSourceText === deletionPlan.mergedSourceText
    && alreadyAppliedReplay.status === 'already-applied'
    ? 'verified'
    : 'blocked';
  const reasonCodes = status === 'verified'
    ? []
    : uniqueStrings([
      ...(projection.admission?.reasonCodes ?? []),
      ...(replay.admission?.reasonCodes ?? []),
      ...(alreadyAppliedReplay.admission?.reasonCodes ?? [])
    ]);
  const core = {
    kind: 'frontier.lang.jsTsSafeMergeSemanticArtifacts',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMergeSemanticArtifacts.v1',
    id: `js_ts_safe_merge_semantic_edit_artifacts_${idFragment(id)}`,
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
      reasonCodes
    },
    summary: {
      operations: script.summary.operations,
      edits: projection.edits.length,
      replayStatus: replay.status,
      alreadyAppliedReplayStatus: alreadyAppliedReplay.status,
      projectedSourceMatchesMerged: projection.sourceText === deletionPlan.mergedSourceText,
      replayOutputMatchesMerged: replay.outputSourceText === deletionPlan.mergedSourceText
    },
    evidence: [{
      id: `evidence_${idFragment(id)}_independent_top_level_deletion`,
      kind: 'js-ts-independent-top-level-deletion-replay',
      status: status === 'verified' ? 'passed' : 'needs-review',
      path: sourcePath,
      summary: status === 'verified'
        ? 'JS/TS independent top-level deletion replay verified 1 operation.'
        : `JS/TS independent top-level deletion requires review: ${reasonCodes.join(', ')}.`,
      metadata: {
        autoMergeClaim: false,
        semanticEquivalenceClaim: false,
        deletedKey: deletionPlan.deletedEntry.key,
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? []
      }
    }],
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: 'independent-top-level-deletion-fallback',
      originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
      deletion: deletionPlan.summary
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

export { createIndependentTopLevelDeletionArtifacts };
