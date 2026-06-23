import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { createSemanticEditScript } from './internal/index-impl/semanticEditScripts.js';
import { projectSemanticEditScriptToSource } from './internal/index-impl/projectSemanticEditScriptToSource.js';
import { replaySemanticEditProjection } from './internal/index-impl/replaySemanticEditProjection.js';
import { JsTsSafeMergeConflictCodes, JsTsSafeMergeStatuses } from './js-ts-safe-merge-constants.js';
import { idFragment, uniqueStrings } from './native-import-utils.js';

function semanticEditFallbackResult(input, topLevelResult) {
  if (!shouldTrySemanticEditFallback(topLevelResult)) return topLevelResult;
  const artifacts = createSemanticEditFallbackArtifacts(input, topLevelResult);
  if (artifacts.status !== 'verified') return semanticEditFallbackBlockedResult(input, topLevelResult, artifacts);
  const mergedSourceText = artifacts.projection.sourceText;
  const gates = semanticEditGates(artifacts);
  return {
    ...topLevelResult,
    status: JsTsSafeMergeStatuses.merged,
    mergedSourceText,
    outputSourceText: mergedSourceText,
    conflicts: [],
    gates,
    admission: {
      status: 'auto-merge-candidate',
      action: 'apply',
      reviewRequired: false,
      autoApplyCandidate: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: []
    },
    summary: {
      ...topLevelResult.summary,
      conflicts: 0,
      gatesPassed: gates.filter((gate) => gate.status === 'passed').length,
      semanticEditOperations: artifacts.script.summary.operations,
      semanticEditAppliedOperations: artifacts.replay.summary.applied,
      semanticEditReplayStatus: artifacts.replay.status,
      composedPhases: 2
    },
    metadata: {
      ...topLevelResult.metadata,
      composed: {
        phase: 'semantic-edit-fallback',
        phases: ['top-level-ledger', 'semantic-edit'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? []
      }
    },
    semanticArtifacts: artifacts
  };
}

function shouldTrySemanticEditFallback(result) {
  const conflicts = result.conflicts ?? [];
  return conflicts.length > 0 && conflicts.every((conflict) => conflict.code === JsTsSafeMergeConflictCodes.changedExistingDeclaration);
}

function createSemanticEditFallbackArtifacts(input, topLevelResult) {
  try {
    const id = String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge');
    const language = input.language ?? topLevelResult.language ?? 'typescript';
    const sourcePath = input.sourcePath ?? topLevelResult.sourcePath ?? 'inline.ts';
    const script = createSemanticEditScript({
      ...input,
      id: `${id}_semantic_edit`,
      language,
      sourcePath
    });
    const projection = projectSemanticEditScriptToSource({
      id: `${id}_semantic_edit_projection`,
      script,
      workerSourceText: input.workerSourceText,
      headSourceText: input.headSourceText,
      headSourcePath: sourcePath,
      parser: input.parser
    });
    const replay = replaySemanticEditProjection({
      id: `${id}_semantic_edit_replay`,
      projection,
      currentSourceText: input.headSourceText,
      currentSourcePath: sourcePath,
      language,
      parser: input.parser
    });
    const alreadyAppliedReplay = replaySemanticEditProjection({
      id: `${id}_semantic_edit_already_applied`,
      projection,
      currentSourceText: projection.sourceText,
      currentSourcePath: sourcePath,
      currentSourceHash: projection.projectedHash,
      language,
      parser: input.parser
    });
    return semanticEditArtifacts({
      id,
      language,
      sourcePath,
      script,
      projection,
      replay,
      alreadyAppliedReplay,
      topLevelResult
    });
  } catch (error) {
    return blockedSemanticEditArtifacts(input, topLevelResult, ['semantic-edit-fallback-error'], error);
  }
}

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
      source: 'js-ts-semantic-edit-fallback',
      originalReasonCodes: input.topLevelResult.admission?.reasonCodes ?? []
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

function semanticEditFallbackBlockedResult(input, topLevelResult, artifacts) {
  const reasonCodes = artifacts.admission.reasonCodes.length
    ? artifacts.admission.reasonCodes
    : topLevelResult.admission?.reasonCodes ?? [];
  const gates = semanticEditGates(artifacts);
  const conflict = {
    code: JsTsSafeMergeConflictCodes.changedExistingDeclaration,
    gateId: 'semantic-edit-replay',
    message: 'JS/TS semantic edit fallback did not verify a clean replay.',
    side: 'worker',
    sourcePath: input.sourcePath ?? topLevelResult.sourcePath,
    details: { reasonCodes }
  };
  return {
    ...topLevelResult,
    conflicts: [conflict],
    gates,
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
      ...topLevelResult.summary,
      conflicts: 1,
      gatesPassed: gates.filter((gate) => gate.status === 'passed').length,
      semanticEditOperations: artifacts.summary.operations,
      semanticEditReplayStatus: artifacts.summary.replayStatus
    },
    semanticArtifacts: artifacts
  };
}

function semanticEditGates(artifacts) {
  return [
    gate('semantic-edit-script', artifacts.script?.admission?.status === 'auto-merge-candidate', artifacts.script?.admission?.reasonCodes),
    gate('semantic-edit-projection', artifacts.projection?.status === 'projected', artifacts.projection?.admission?.reasonCodes),
    gate('semantic-edit-replay', artifacts.replay?.status === 'accepted-clean', artifacts.replay?.admission?.reasonCodes),
    gate('semantic-edit-already-applied', artifacts.alreadyAppliedReplay?.status === 'already-applied', artifacts.alreadyAppliedReplay?.admission?.reasonCodes)
  ];
}

function gate(id, passed, reasonCodes = []) {
  return { id, status: passed ? 'passed' : 'blocked', reasonCodes: passed ? [] : uniqueStrings(reasonCodes) };
}

export {
  semanticEditFallbackResult
};
