import {
  idFragment,
  uniqueRecordsById,
  uniqueStrings
} from '../../native-import-utils.js';
import { createSemanticImportSidecar } from './createSemanticImportSidecar.js';
import { createSemanticPatchBundleRecord } from './semanticPatchBundleRecords.js';
import { createSemanticHistoryRecord } from './semanticHistoryRecords.js';
import { diffNativeSourceImports } from './diffNativeSourceImports.js';
import { normalizeNativeDiffImport } from './normalizeNativeDiffImport.js';
import { attachBidirectionalMatchPortability, classifyBidirectionalTargetPortability } from './bidirectionalTargetPortability.js';
import { createRoundtripEvidence, createSemanticMergeAdmissionEvidence, summarizeSourceMapBackprojection } from './bidirectionalTargetRoundtripEvidence.js';
import { createBidirectionalSourceEditProjection } from './bidirectionalSourceEditProjection.js';
import {
  anchorsFromSourceSidecar,
  classifyBidirectionalReadiness,
  createBidirectionalEvidence,
  matchTargetRegion,
  sourceHash,
  sourceRegionsForMatch
} from './bidirectionalTargetChangeRecordInternals.js';

export function createBidirectionalTargetChangeRecord(input = {}, options = {}) {
  const source = normalizeNativeDiffImport(
    input.source ?? input.sourceImport ?? input.baseSource,
    { language: input.sourceLanguage, sourcePath: input.sourcePath, parser: input.sourceParser },
    'source'
  );
  const targetChangeSet = input.targetChangeSet ?? diffNativeSourceImports({
    id: input.targetChangeSetId ?? input.id,
    language: input.targetLanguage ?? input.language,
    sourcePath: input.targetPath ?? input.sourcePath,
    before: input.baseTarget ?? input.beforeTarget ?? input.before,
    after: input.editedTarget ?? input.afterTarget ?? input.after,
    evidenceId: input.targetEvidenceId,
    patchId: input.targetPatchId,
    mergeCandidateId: input.targetMergeCandidateId,
    metadata: { direction: 'target-to-source', ...(input.targetMetadata ?? {}) }
  });
  const id = input.id ?? `bidirectional_target_change_${idFragment([
    source?.sourcePath,
    targetChangeSet.sourcePath,
    targetChangeSet.id
  ].filter(Boolean).join('_'))}`;
  const sourceSidecar = source ? createSemanticImportSidecar(source, {
    id: `sidecar_source_${idFragment(id)}`,
    generatedAt: input.generatedAt,
    regionPrefix: input.sourceRegionPrefix
  }) : undefined;
  const sourceAnchors = sourceSidecar ? anchorsFromSourceSidecar(sourceSidecar, source) : [];
  const mappings = array(input.sourceAnchorMappings ?? input.anchorMappings);
  const sourceMaps = uniqueRecordsById([
    ...array(input.sourceMaps),
    ...array(input.projectionSourceMaps),
    ...array(input.targetSourceMaps),
    ...array(input.targetProjectionSourceMaps),
    ...array(input.targetCompileResult?.sourceMaps),
    input.targetCompileResult?.sourceMap
  ]);
  const lineage = input.lineage ?? input.lineageEvents ?? input.lineageMap ?? [];
  const sourceAnchorMatches = targetChangeSet.changedRegions.map((region, index) => matchTargetRegion({
    id,
    region,
    index,
    source,
    sourceAnchors,
    mappings,
    sourceMaps,
    lineage
  })).map((match) => attachBidirectionalMatchPortability(match, {
    currentSourceHash: sourceHash(source),
    targetChangeSet
  }));
  const targetPortability = classifyBidirectionalTargetPortability({
    id,
    source,
    currentSourceHash: sourceHash(source),
    targetChangeSet,
    sourceAnchorMatches
  });
  const readiness = classifyBidirectionalReadiness(targetChangeSet, source, sourceAnchorMatches);
  const reasons = uniqueStrings([
    'source-port-review-required',
    'target-change-is-merge-evidence-not-proof',
    `target-portability:${targetPortability.status}`,
    ...array(targetChangeSet.reasons),
    ...array(targetPortability.reasonCodes),
    ...sourceAnchorMatches.flatMap((match) => match.reasonCodes)
  ]);
  const sourceEditProjection = createBidirectionalSourceEditProjection({
    id,
    source,
    targetChangeSet,
    sourceAnchorMatches,
    targetPortability,
    reasons
  });
  const evidenceId = input.evidenceId ?? `evidence_${idFragment(id)}_bidirectional_target_change`;
  const sourcePatchBundleId = input.sourcePatchBundleId ?? `semantic_patch_bundle_${idFragment(id)}_source_port`;
  const historyRecordId = input.historyRecordId ?? `semantic_history_${idFragment(id)}_target_change`;
  const sourceMapBackprojection = summarizeSourceMapBackprojection(sourceAnchorMatches);
  const roundtripEvidence = createRoundtripEvidence({
    id,
    evidenceId,
    sourcePatchBundleId,
    historyRecordId,
    source,
    targetChangeSet,
    sourceAnchorMatches,
    targetPortability,
    readiness,
    reasons,
    sourceMapBackprojection,
    sourceEditProjection
  });
  const semanticMergeAdmission = createSemanticMergeAdmissionEvidence({
    id,
    evidenceId,
    sourcePatchBundleId,
    historyRecordId,
    targetChangeSet,
    sourceAnchorMatches,
    targetPortability,
    readiness,
    reasons,
    roundtripEvidence,
    sourceEditProjection
  });
  const bidirectionalEvidence = createBidirectionalEvidence({
    id,
    input: { ...input, evidenceId },
    source,
    targetChangeSet,
    sourceAnchorMatches,
    targetPortability,
    readiness,
    reasons
  });
  const evidence = [{
    ...bidirectionalEvidence,
    metadata: {
      ...bidirectionalEvidence.metadata,
      roundtripEvidenceId: roundtripEvidence.id,
      roundtripEvidence,
      semanticMergeAdmission,
      sourceEditProjectionId: sourceEditProjection.sourceEditProjection?.id,
      sourceEditReplayId: sourceEditProjection.sourceEditReplay?.id,
      sourceEditScriptId: sourceEditProjection.sourceEditScript?.id,
      sourceProjectionHintId: sourceEditProjection.sourceProjectionHint?.id,
      sourceProjectionHint: sourceEditProjection.sourceProjectionHint
    }
  }, ...(sourceEditProjection.evidence ?? [])];
  const sourceReplayStatus = sourceEditProjection.sourceEditReplay?.status;
  const sourcePatchAdmission = sourceReplayStatus === 'accepted-clean'
    ? { readiness: 'ready', reasonCodes: ['bidirectional-source-edit-replay-accepted-clean'] }
    : sourceReplayStatus === 'already-applied'
      ? { status: 'admitted', readiness: 'ready', reasonCodes: ['bidirectional-source-edit-replay-already-applied'] }
      : { status: readiness === 'blocked' ? 'blocked' : 'needs-review', readiness };
  const sourceChangedRegions = sourceAnchorMatches.flatMap((match) => sourceRegionsForMatch(match, readiness));
  const sourcePatchBundle = createSemanticPatchBundleRecord({
    id: `${id}_source_port_projection`,
    language: source?.language,
    sourcePath: source?.sourcePath,
    baseHash: sourceHash(source),
    changedRegions: sourceChangedRegions,
    evidence,
    readiness,
    reasons,
    conflictKeys: uniqueStrings(sourceAnchorMatches.flatMap((match) => match.conflictKeys)),
    metadata: {
      projectionOnly: true,
      targetChangeSetId: targetChangeSet.id,
      targetPatchId: targetChangeSet.patch?.id,
      targetMergeCandidateId: targetChangeSet.mergeCandidate?.id,
      targetPortability,
      sourceMapBackprojection,
      roundtripEvidenceId: roundtripEvidence.id,
      semanticMergeAdmission
    }
  }, {
    id: sourcePatchBundleId,
    patchId: targetChangeSet.patch?.id,
    mergeCandidateId: targetChangeSet.mergeCandidate?.id,
    semanticEditScripts: [sourceEditProjection.sourceEditScript].filter(Boolean),
    semanticEditProjections: [sourceEditProjection.sourceEditProjection].filter(Boolean),
    semanticEditReplays: [sourceEditProjection.sourceEditReplay].filter(Boolean),
    admission: sourcePatchAdmission,
    metadata: {
      source: 'createBidirectionalTargetChangeRecord',
      targetChangeSetId: targetChangeSet.id,
      targetPatchId: targetChangeSet.patch?.id,
      targetMergeCandidateId: targetChangeSet.mergeCandidate?.id,
      targetPortability,
      sourceMapBackprojection,
      roundtripEvidenceId: roundtripEvidence.id,
      semanticMergeAdmission,
      sourceEditScriptId: sourceEditProjection.sourceEditScript?.id,
      sourceEditProjectionId: sourceEditProjection.sourceEditProjection?.id,
      sourceEditReplayId: sourceEditProjection.sourceEditReplay?.id,
      sourceProjectionHintId: sourceEditProjection.sourceProjectionHint?.id,
      sourceProjectionHint: sourceEditProjection.sourceProjectionHint,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  });
  const historyRecord = createSemanticHistoryRecord({
    id: historyRecordId,
    importResult: source,
    language: source?.language,
    sourcePath: source?.sourcePath,
    baseHash: sourceHash(source),
    targetHash: sourceHash(source),
    ownershipRegions: sourceChangedRegions,
    semanticCandidates: [targetChangeSet.mergeCandidate].filter(Boolean),
    evidence,
    evidenceIds: evidence.map((record) => record.id),
    patchAncestry: targetChangeSet.patch ? [{
      patchId: targetChangeSet.patch.id,
      baseHash: targetChangeSet.beforeHash,
      targetHash: targetChangeSet.afterHash,
      conflictKeys: targetChangeSet.mergeCandidate?.conflictKeys,
      metadata: { direction: 'target-to-source' }
    }] : [],
    admission: { status: semanticMergeAdmission.status, readiness: semanticMergeAdmission.readiness, reasonCodes: semanticMergeAdmission.reasonCodes },
    replayLinks: targetChangeSet.patch ? [{
      id: `replay_${idFragment(targetChangeSet.patch.id)}`,
      kind: 'patch',
      path: targetChangeSet.patch.id
    }] : [],
    metadata: {
      bidirectionalTargetChangeId: id,
      sourcePatchBundleId: sourcePatchBundle.id,
      targetChangeSetId: targetChangeSet.id,
      targetPortability,
      sourceMapBackprojection,
      roundtripEvidenceId: roundtripEvidence.id,
      semanticMergeAdmission,
      sourceEditProjectionId: sourceEditProjection.sourceEditProjection?.id,
      sourceEditReplayId: sourceEditProjection.sourceEditReplay?.id,
      sourceEditScriptId: sourceEditProjection.sourceEditScript?.id,
      sourceProjectionHintId: sourceEditProjection.sourceProjectionHint?.id,
      sourceProjectionHint: sourceEditProjection.sourceProjectionHint,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  }, options);
  return {
    kind: 'frontier.lang.bidirectionalTargetChangeRecord',
    version: 1,
    id,
    sourceLanguage: source?.language,
    targetLanguage: targetChangeSet.language,
    sourcePath: source?.sourcePath,
    targetPath: targetChangeSet.sourcePath,
    sourceImport: source,
    targetChangeSet,
    sourceAnchorMatches,
    targetPortability,
    roundtripEvidence,
    sourceEditScript: sourceEditProjection.sourceEditScript,
    sourceEditProjection: sourceEditProjection.sourceEditProjection,
    sourceEditReplay: sourceEditProjection.sourceEditReplay,
    sourceProjectionHint: sourceEditProjection.sourceProjectionHint,
    sourcePatchBundle,
    historyRecord,
    evidence,
    readiness,
    reasons,
    summary: {
      targetChangedRegions: targetChangeSet.changedRegions.length,
      sourceAnchorMatches: sourceAnchorMatches.filter((match) => match.status === 'matched').length,
      ambiguousMatches: sourceAnchorMatches.filter((match) => match.status === 'ambiguous').length,
      unmatchedTargetRegions: sourceAnchorMatches.filter((match) => match.status === 'unmatched').length,
      deletedSourceAnchors: sourceAnchorMatches.filter((match) => match.status === 'deleted').length,
      sourceChangedRegions: sourceChangedRegions.length,
      sourceMapBackedMatches: sourceAnchorMatches.filter((match) => match.sourceMapLinks.length > 0).length,
      sourceMapLinks: sourceMapBackprojection.sourceMapLinks,
      sourceMapMappingIds: sourceMapBackprojection.sourceMapMappingIds.length,
      sourceEditScripts: sourceEditProjection.sourceEditScript ? 1 : 0,
      sourceProjectionHints: sourceEditProjection.sourceProjectionHint ? 1 : 0,
      lineageResolutions: roundtripEvidence.lineageEvidence.lineageResolutionIds.length,
      targetPortabilityStatus: targetPortability.status,
      portableTargetRegions: targetPortability.status === 'portable' ? targetPortability.targetChangedRegions : 0,
      staleTargetRegions: targetPortability.status === 'stale' ? targetPortability.targetChangedRegions : 0,
      conflictingTargetRegions: targetPortability.status === 'conflict' ? targetPortability.ambiguousTargetRegions : 0
    },
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reviewRequired: sourcePatchBundle.admission.reviewRequired,
      targetPortability,
      roundtripEvidenceId: roundtripEvidence.id,
      semanticMergeAdmission,
      sourceEditScriptId: sourceEditProjection.sourceEditScript?.id,
      sourceEditProjectionId: sourceEditProjection.sourceEditProjection?.id,
      sourceEditReplayId: sourceEditProjection.sourceEditReplay?.id,
      sourceProjectionHintId: sourceEditProjection.sourceProjectionHint?.id,
      sourceProjectionHint: sourceEditProjection.sourceProjectionHint,
      ...input.metadata
    }
  };
}

function array(value) {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
}
