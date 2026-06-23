import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { semanticFallbackPhase } from './js-ts-safe-merge-semantic-edit-fallback-utils.js';
import { idFragment, uniqueStrings } from './native-import-utils.js';

function semanticEditArtifacts(input) {
  const reasonCodes = semanticEditArtifactReasonCodes(input);
  const status = reasonCodes.length ? 'blocked' : 'verified';
  const core = {
    kind: 'frontier.lang.jsTsSafeMergeSemanticArtifacts',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMergeSemanticArtifacts.v1',
    id: `js_ts_safe_merge_semantic_edit_artifacts_${idFragment(input.id)}`,
    sourcePath: input.sourcePath,
    language: input.language,
    status,
    script: input.script,
    projection: input.projection,
    replay: input.replay,
    alreadyAppliedReplay: input.alreadyAppliedReplay,
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
      operations: input.script.summary.operations,
      edits: input.projection.edits.length,
      replayStatus: input.replay.status,
      alreadyAppliedReplayStatus: input.alreadyAppliedReplay.status,
      projectedSourceMatchesMerged: input.projection.sourceText === input.replay.outputSourceText,
      replayOutputMatchesMerged: input.replay.outputSourceText === input.projection.sourceText
    },
    evidence: [{
      id: `evidence_${idFragment(input.id)}_js_ts_semantic_edit_replay`,
      kind: 'js-ts-semantic-edit-replay',
      status: status === 'verified' ? 'passed' : 'needs-review',
      path: input.sourcePath,
      summary: status === 'verified'
        ? `JS/TS semantic edit replay verified ${input.script.summary.operations} operation(s).`
        : `JS/TS semantic edit replay requires review: ${reasonCodes.join(', ')}.`
    }],
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      source: input.stagedFallback ? semanticFallbackPhase(input.stagedFallback) : 'js-ts-semantic-edit-fallback',
      originalReasonCodes: input.topLevelResult.admission?.reasonCodes ?? [],
      stagedTopLevelSummary: input.stagedFallback?.stagedTopLevelResult?.summary,
      neutralization: input.stagedFallback?.neutralization?.summary
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function blockedSemanticEditArtifacts(input, topLevelResult, reasonCodes, error) {
  const id = String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge');
  const core = {
    kind: 'frontier.lang.jsTsSafeMergeSemanticArtifacts',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMergeSemanticArtifacts.v1',
    id: `js_ts_safe_merge_semantic_edit_artifacts_${idFragment(id)}`,
    sourcePath: input.sourcePath ?? topLevelResult.sourcePath,
    language: input.language ?? topLevelResult.language ?? 'typescript',
    status: 'blocked',
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    summary: {
      operations: 0,
      edits: 0,
      replayStatus: 'blocked',
      alreadyAppliedReplayStatus: 'blocked',
      projectedSourceMatchesMerged: false,
      replayOutputMatchesMerged: false
    },
    metadata: {
      source: 'js-ts-semantic-edit-fallback',
      error: error?.message
    }
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function semanticEditArtifactReasonCodes(input) {
  const scriptReady = input.script.admission.status === 'auto-merge-candidate';
  const projectionReady = input.projection.status === 'projected';
  const replayReady = input.replay.status === 'accepted-clean';
  const alreadyAppliedReady = input.alreadyAppliedReplay.status === 'already-applied';
  return uniqueStrings([
    scriptReady ? undefined : `semantic-edit-script-${input.script.admission.status}`,
    projectionReady ? undefined : `semantic-edit-projection-${input.projection.status}`,
    replayReady ? undefined : `semantic-edit-replay-${input.replay.status}`,
    input.replay.outputSourceText !== input.projection.sourceText ? 'semantic-edit-replay-output-mismatch' : undefined,
    alreadyAppliedReady ? undefined : `semantic-edit-already-applied-${input.alreadyAppliedReplay.status}`,
    ...(scriptReady ? [] : input.script.admission.reasonCodes),
    ...(projectionReady ? [] : input.projection.admission.reasonCodes),
    ...(replayReady ? [] : input.replay.admission.reasonCodes),
    ...(alreadyAppliedReady ? [] : input.alreadyAppliedReplay.admission.reasonCodes)
  ]);
}

export { blockedSemanticEditArtifacts, semanticEditArtifacts };
