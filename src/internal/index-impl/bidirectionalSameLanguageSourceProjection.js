import { idFragment, normalizeNativeLanguageId } from '../../native-import-utils.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { createSemanticEditScript } from './semanticEditScripts.js';
import { projectSemanticEditScriptToSource } from './projectSemanticEditScriptToSource.js';
import { replaySemanticEditProjection } from './replaySemanticEditProjection.js';

const backprojectionMode = 'same-language-target-source-edit';

export function createSameLanguageTargetSourceProjection(context = {}) {
  if (!sameLanguageSamePath(context.source, context.targetChangeSet)) return {};
  const sourceText = nativeImportSourceText(context.source);
  const workerSourceText = nativeImportSourceText(context.targetChangeSet?.after);
  if (typeof sourceText !== 'string' || typeof workerSourceText !== 'string') return {};
  const script = createSemanticEditScript({
    id: `semantic_edit_script_${idFragment(context.id)}_same_language_target`,
    language: context.source.language,
    sourcePath: context.source.sourcePath,
    base: context.targetChangeSet.before,
    worker: context.targetChangeSet.after,
    head: context.source,
    generatedAt: context.generatedAt,
    metadata: {
      sourceBackprojectionMode: backprojectionMode,
      bidirectionalTargetChangeId: context.id,
      targetChangeSetId: context.targetChangeSet.id
    }
  });
  const projection = projectSemanticEditScriptToSource({
    id: `semantic_edit_projection_${idFragment(context.id)}_same_language_target`,
    script,
    workerSourceText,
    headSourceText: sourceText,
    headSourcePath: context.source.sourcePath,
    metadata: { sourceBackprojectionMode: backprojectionMode }
  });
  const replay = projection.status === 'projected'
    ? replaySemanticEditProjection({
      id: `semantic_edit_replay_${idFragment(context.id)}_same_language_target`,
      projection,
      currentSourceText: sourceText,
      currentSourceHash: script.headHash,
      expectedOutputSourceText: projection.sourceText,
      expectedOutputHash: projection.projectedHash
    })
    : undefined;
  const sourceProjectionHint = projectionHint(context, script, projection, replay);
  return {
    sourceEditScript: script,
    sourceProjectionHint,
    sourceEditProjection: projection,
    sourceEditReplay: replay,
    evidence: [sameLanguageEvidence(context, script, projection, replay)]
  };
}

function projectionHint(context, script, projection, replay) {
  const replayReady = ['accepted-clean', 'already-applied'].includes(replay?.status);
  const ready = script.admission?.status === 'auto-merge-candidate' && projection?.status === 'projected' && replayReady;
  return {
    schema: 'frontier.lang.bidirectionalTargetChangeSourceEditProjectionHint.v1',
    version: 1,
    id: `source_projection_hint_${idFragment(context.id)}_same_language_target`,
    scriptId: script.id,
    status: ready ? 'auto-merge-candidate' : script.admission?.status ?? 'needs-port',
    action: ready ? sourceAction(replay) : 'reanchor-or-human-port',
    readiness: ready ? 'ready' : script.admission?.readiness ?? 'needs-review',
    sourcePath: context.source.sourcePath,
    sourceHash: script.headHash,
    targetPath: context.targetChangeSet.sourcePath,
    targetHash: context.targetChangeSet.afterHash,
    targetChangeSetId: context.targetChangeSet.id,
    targetPatchId: context.targetChangeSet.patch?.id,
    targetMergeCandidateId: context.targetChangeSet.mergeCandidate?.id,
    operationIds: (script.operations ?? []).map((operation) => operation.id),
    reviewRequired: !ready,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: ready ? ['same-language-target-source-edit-replayed'] : script.admission?.reasonCodes,
    sourceBackprojectionMode: backprojectionMode
  };
}

function sameLanguageEvidence(context, script, projection, replay) {
  const passed = projection?.status === 'projected' && ['accepted-clean', 'already-applied'].includes(replay?.status);
  return {
    id: `evidence_${idFragment(context.id)}_same_language_target_replay`,
    kind: 'verification',
    status: passed ? 'passed' : 'failed',
    path: script.sourcePath,
    summary: passed
      ? 'Verified same-language target change by projecting and replaying it onto the source file.'
      : 'Same-language target change did not project and replay cleanly onto the source file.',
    metadata: {
      schema: 'frontier.lang.bidirectionalSameLanguageTargetSourceEvidence.v1',
      bidirectionalTargetChangeId: context.id,
      sourceEditScriptId: script.id,
      sourceEditProjectionId: projection?.id,
      sourceEditReplayId: replay?.id,
      projectionStatus: projection?.status,
      replayStatus: replay?.status,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  };
}

function sameLanguageSamePath(source, targetChangeSet) {
  const sourceLanguage = normalizeNativeLanguageId(source?.language);
  const targetLanguage = normalizeNativeLanguageId(targetChangeSet?.language);
  return Boolean(sourceLanguage && sourceLanguage === targetLanguage && source?.sourcePath && source.sourcePath === targetChangeSet?.sourcePath);
}

function sourceAction(replay) {
  return replay?.status === 'already-applied' ? 'skip-source-backprojection' : 'admit-source-backprojection';
}
