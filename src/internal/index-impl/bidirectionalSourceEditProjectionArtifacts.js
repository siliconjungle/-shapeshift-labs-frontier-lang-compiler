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
    headSourceText: sourceText
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
      ? 'Verified exact same-language source-map backprojection by projecting and replaying the source edit.'
      : 'Exact same-language source-map backprojection did not project and replay cleanly.',
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
    && script?.metadata?.sourceBackprojectionMode === 'same-language-exact-source-map';
}
