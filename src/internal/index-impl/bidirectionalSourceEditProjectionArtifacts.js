import { idFragment } from '../../native-import-utils.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { projectSemanticEditScriptToSource } from './projectSemanticEditScriptToSource.js';
import { replaySemanticEditProjection } from './replaySemanticEditProjection.js';

export function createBidirectionalSourceEditProjectionArtifacts(context = {}, sourceEditScript) {
  if (!isExactBackprojectionScript(sourceEditScript)) return {};
  const sourceText = nativeImportSourceText(context.source);
  const workerSourceText = nativeImportSourceText(context.targetChangeSet?.after);
  if (typeof sourceText !== 'string' || typeof workerSourceText !== 'string') return {};
  const projection = projectSemanticEditScriptToSource({
    id: `semantic_edit_projection_${idFragment(context.id)}_source_backprojection`,
    script: sourceEditScript,
    workerSourceText,
    headSourceText: sourceText,
    metadata: {
      targetLanguage: context.targetChangeSet.language,
      targetPath: context.targetChangeSet.sourcePath,
      targetHash: context.targetChangeSet.afterHash,
      sourceMapIds: sourceEditScript.metadata?.sourceProjectionHint?.sourceMapIds,
      sourceMapLinkIds: sourceEditScript.metadata?.sourceProjectionHint?.sourceMapLinkIds,
      sourceMapMappingIds: sourceEditScript.metadata?.sourceProjectionHint?.sourceMapMappingIds
    }
  });
  const replay = projection.status === 'projected'
    ? replaySemanticEditProjection({
      id: `semantic_edit_replay_${idFragment(context.id)}_source_backprojection`,
      projection,
      currentSourceText: sourceText
    })
    : undefined;
  return {
    sourceEditProjection: projection,
    sourceEditReplay: replay,
    evidence: [backprojectionEvidence(context, sourceEditScript, projection, replay)]
  };
}

function backprojectionEvidence(context, script, projection, replay) {
  const replayReady = replay?.status === 'accepted-clean' || replay?.status === 'already-applied';
  const passed = projection?.status === 'projected' && replayReady;
  return {
    id: `evidence_${idFragment(context.id)}_source_backprojection_replay`,
    kind: 'verification',
    status: passed ? 'passed' : 'failed',
    path: script.sourcePath,
    summary: passed
      ? 'Verified exact source-map backprojection by projecting and replaying the source edit.'
      : 'Exact source-map backprojection did not project and replay cleanly.',
    metadata: {
      schema: 'frontier.lang.bidirectionalSourceBackprojectionEvidence.v1',
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

function isExactBackprojectionScript(script) {
  return script?.admission?.status === 'auto-merge-candidate'
    && ['same-language-exact-source-map', 'cross-language-explicit-source-replacement'].includes(script?.metadata?.sourceBackprojectionMode);
}
