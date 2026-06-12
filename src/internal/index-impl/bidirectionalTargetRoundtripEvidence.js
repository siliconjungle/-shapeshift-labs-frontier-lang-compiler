import { idFragment, uniqueRecordsById, uniqueStrings } from '../../native-import-utils.js';
import { sourceHash } from './bidirectionalTargetChangeRecordInternals.js';

export function summarizeSourceMapBackprojection(matches) {
  const links = matches.flatMap((match) => match.sourceMapLinks ?? []);
  return {
    sourceMapBackedMatches: matches.filter((match) => (match.sourceMapLinks ?? []).length > 0).length,
    sourceMapLinks: links.length,
    sourceMapIds: uniqueStrings(links.map((link) => link.sourceMapId)),
    sourceMapMappingIds: uniqueStrings(links.map((link) => link.sourceMapMappingId))
  };
}

export function createRoundtripEvidence(context) {
  const sourceMapLinks = uniqueRecordsById(context.sourceAnchorMatches.flatMap((match) => match.sourceMapLinks ?? []));
  const targetProjectionLinks = uniqueRecordsById((context.targetChangeSet.changedRegions ?? [])
    .flatMap((region) => array(region.metadata?.changedRegionProjection?.sourceMapLinks)));
  const sourceAnchors = uniqueRecordsByKey(context.sourceAnchorMatches.flatMap((match) => match.sourceAnchors ?? []));
  const lineageResolutions = uniqueRecordsById(context.sourceAnchorMatches.flatMap((match) => match.lineageResolutions ?? []));
  return {
    schema: 'frontier.lang.bidirectionalTargetChangeRoundtripEvidence.v1',
    version: 1,
    id: `roundtrip_evidence_${idFragment(context.id)}`,
    evidenceId: context.evidenceId,
    sourcePatchBundleId: context.sourcePatchBundleId,
    historyRecordId: context.historyRecordId,
    source: sourceIdentity(context.source),
    target: targetChangeIdentity(context.targetChangeSet),
    targetRegions: (context.targetChangeSet.changedRegions ?? []).map(targetRegionIdentity),
    sourceAnchorMatches: context.sourceAnchorMatches.map(matchIdentity),
    sourceAnchors,
    sourceMapEvidence: {
      ...context.sourceMapBackprojection,
      sourceMapLinkIds: uniqueStrings(sourceMapLinks.map((link) => link.id)),
      staleSourceMapLinkIds: uniqueStrings(context.targetPortability.staleSourceMapLinkIds),
      targetProjectionSourceMapLinks: targetProjectionLinks.length,
      targetProjectionSourceMapLinkIds: uniqueStrings(targetProjectionLinks.map((link) => link.id)),
      targetProjectionSourceMapIds: uniqueStrings(targetProjectionLinks.map((link) => link.sourceMapId)),
      targetProjectionSourceMapMappingIds: uniqueStrings(targetProjectionLinks.map((link) => link.sourceMapMappingId))
    },
    lineageEvidence: {
      lineageResolutionIds: uniqueStrings(lineageResolutions.map((resolution) => resolution.id)),
      lineageEventIds: uniqueStrings(lineageResolutions.flatMap((resolution) => resolution.traversedEventIds ?? [])),
      lineageEvidenceIds: uniqueStrings(lineageResolutions.flatMap((resolution) => resolution.evidenceIds ?? [])),
      lineageProofIds: uniqueStrings(lineageResolutions.flatMap((resolution) => resolution.proofIds ?? [])),
      lineageReasonCodes: uniqueStrings(lineageResolutions.flatMap((resolution) => resolution.reasonCodes ?? []))
    },
    targetPortability: {
      status: context.targetPortability.status,
      action: context.targetPortability.action,
      readiness: context.targetPortability.readiness,
      reasonCodes: context.targetPortability.reasonCodes,
      conflictKeys: context.targetPortability.conflictKeys
    },
    admission: admissionRecord(context),
    reviewRequired: !verifiedSourceBackprojection(context),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function admissionRecord(context) {
  const verified = verifiedSourceBackprojection(context);
  return {
    status: context.readiness === 'blocked' ? 'blocked' : verified ? 'ready' : 'needs-review',
    readiness: verified ? 'ready' : context.readiness,
    action: verified ? 'admit-source-backprojection' : context.targetPortability.action,
    reasonCodes: uniqueStrings([...array(context.reasons), verified ? 'verified-source-map-backprojection' : undefined]),
    conflictKeys: uniqueStrings([
      ...array(context.targetPortability.conflictKeys),
      ...context.sourceAnchorMatches.flatMap((match) => match.conflictKeys ?? [])
    ]),
    evidenceIds: uniqueStrings([context.evidenceId, ...array(context.sourceEditProjection?.evidence).map((record) => record.id)]),
    reviewRequired: !verified,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

export function createSemanticMergeAdmissionEvidence(context) {
  const verified = verifiedSourceBackprojection(context);
  return {
    schema: 'frontier.lang.bidirectionalTargetChangeSemanticMergeAdmission.v1',
    version: 1,
    id: `semantic_merge_admission_${idFragment(context.id)}_target_change`,
    evidenceIds: [context.evidenceId],
    sourcePatchBundleId: context.sourcePatchBundleId,
    historyRecordId: context.historyRecordId,
    targetChangeSetId: context.targetChangeSet.id,
    targetPatchId: context.targetChangeSet.patch?.id,
    targetMergeCandidateId: context.targetChangeSet.mergeCandidate?.id,
    readiness: verified ? 'ready' : context.readiness,
    status: context.readiness === 'blocked' ? 'blocked' : verified ? 'ready' : 'needs-review',
    action: verified ? 'admit-source-backprojection' : context.targetPortability.action,
    reasonCodes: uniqueStrings([...array(context.reasons), verified ? 'verified-source-map-backprojection' : undefined]),
    conflictKeys: context.roundtripEvidence.admission.conflictKeys,
    sourceAnchorMatchIds: uniqueStrings(context.sourceAnchorMatches.map((match) => match.id)),
    sourceAnchorKeys: uniqueStrings(context.roundtripEvidence.sourceAnchors.map((anchor) => anchor.key)),
    targetRegionKeys: uniqueStrings(context.roundtripEvidence.targetRegions.map((region) => region.key)),
    sourceMapLinkIds: context.roundtripEvidence.sourceMapEvidence.sourceMapLinkIds,
    sourceMapIds: context.roundtripEvidence.sourceMapEvidence.sourceMapIds,
    sourceMapMappingIds: context.roundtripEvidence.sourceMapEvidence.sourceMapMappingIds,
    staleSourceMapLinkIds: context.roundtripEvidence.sourceMapEvidence.staleSourceMapLinkIds,
    targetProjectionSourceMapLinkIds: context.roundtripEvidence.sourceMapEvidence.targetProjectionSourceMapLinkIds,
    targetProjectionSourceMapMappingIds: context.roundtripEvidence.sourceMapEvidence.targetProjectionSourceMapMappingIds,
    lineageResolutionIds: context.roundtripEvidence.lineageEvidence.lineageResolutionIds,
    sourceEditScriptId: context.sourceEditProjection?.sourceEditScript?.id,
    sourceEditProjectionId: context.sourceEditProjection?.sourceEditProjection?.id,
    sourceEditReplayId: context.sourceEditProjection?.sourceEditReplay?.id,
    sourceBackprojectionMode: context.sourceEditProjection?.sourceProjectionHint?.sourceBackprojectionMode,
    reviewRequired: !verified,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function verifiedSourceBackprojection(context) {
  return context.sourceEditProjection?.sourceProjectionHint?.sourceBackprojectionMode === 'same-language-exact-source-map'
    && context.sourceEditProjection?.sourceEditProjection?.status === 'projected'
    && context.sourceEditProjection?.sourceEditReplay?.status === 'accepted-clean';
}

function sourceIdentity(source) {
  return compactRecord({
    importId: source?.id,
    language: source?.language,
    sourcePath: source?.sourcePath,
    sourceHash: sourceHash(source),
    nativeSourceId: source?.nativeSource?.id,
    nativeAstId: source?.nativeAst?.id,
    semanticIndexId: source?.semanticIndex?.id,
    universalAstId: source?.universalAst?.id,
    sourceMapIds: uniqueStrings((source?.sourceMaps ?? []).map((sourceMap) => sourceMap?.id))
  });
}

function targetChangeIdentity(targetChangeSet) {
  return compactRecord({
    changeSetId: targetChangeSet.id,
    language: targetChangeSet.language,
    sourcePath: targetChangeSet.sourcePath,
    beforeHash: targetChangeSet.beforeHash,
    afterHash: targetChangeSet.afterHash,
    beforeImportId: targetChangeSet.before?.id,
    afterImportId: targetChangeSet.after?.id,
    beforeNativeSourceId: targetChangeSet.before?.nativeSource?.id,
    afterNativeSourceId: targetChangeSet.after?.nativeSource?.id,
    beforeNativeAstId: targetChangeSet.before?.nativeAst?.id,
    afterNativeAstId: targetChangeSet.after?.nativeAst?.id,
    beforeSemanticIndexId: targetChangeSet.before?.semanticIndex?.id,
    afterSemanticIndexId: targetChangeSet.after?.semanticIndex?.id,
    patchId: targetChangeSet.patch?.id,
    mergeCandidateId: targetChangeSet.mergeCandidate?.id,
    sourceMapIds: uniqueStrings((targetChangeSet.sourceMaps ?? []).map((sourceMap) => sourceMap?.id))
  });
}

function targetRegionIdentity(region) {
  const projection = region.metadata?.changedRegionProjection;
  return compactRecord({
    id: region.id,
    key: region.key,
    conflictKey: region.conflictKey,
    changeKind: region.changeKind,
    regionKind: region.regionKind,
    language: region.language,
    sourcePath: region.sourcePath,
    sourceHash: region.sourceHash,
    symbolId: region.symbolId,
    symbolName: region.symbolName ?? region.name,
    sourceSpan: region.sourceSpan,
    changedRegionProjectionId: projection?.id,
    beforeIdentity: projection?.before?.identity,
    afterIdentity: projection?.after?.identity,
    sourceMapLinkIds: uniqueStrings(array(projection?.sourceMapLinks).map((link) => link.id)),
    sourceMapIds: uniqueStrings(array(projection?.sourceMapLinks).map((link) => link.sourceMapId)),
    sourceMapMappingIds: uniqueStrings(array(projection?.sourceMapLinks).map((link) => link.sourceMapMappingId))
  });
}

function matchIdentity(match) {
  return compactRecord({
    id: match.id,
    status: match.status,
    targetRegionKey: match.targetRegion?.key,
    targetRegionConflictKey: match.targetRegion?.conflictKey,
    sourceAnchorKeys: uniqueStrings((match.sourceAnchors ?? []).map((anchor) => anchor.key)),
    sourceMapLinkIds: uniqueStrings((match.sourceMapLinks ?? []).map((link) => link.id)),
    sourceMapMappingIds: uniqueStrings((match.sourceMapLinks ?? []).map((link) => link.sourceMapMappingId)),
    lineageResolutionIds: uniqueStrings((match.lineageResolutions ?? []).map((resolution) => resolution.id)),
    portabilityStatus: match.portability?.status,
    portabilityAction: match.portability?.action,
    reasonCodes: match.reasonCodes,
    conflictKeys: match.conflictKeys
  });
}

function uniqueRecordsByKey(records) {
  const seen = new Set();
  const result = [];
  for (const record of records ?? []) {
    const key = record?.key ?? record?.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function array(value) {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
