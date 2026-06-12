import { uniqueStrings } from '../../native-import-utils.js';

export function semanticEditRecordIndex(scripts, projections, replays, source = {}) {
  const operations = scripts.flatMap((script) => array(script.operations));
  const edits = projections.flatMap((projection) => array(projection.edits));
  const replayEdits = replays.flatMap((replay) => array(replay.edits));
  const index = source.index ?? {};
  const summary = source.metadata?.semanticEditSummary ?? {};
  return {
    semanticEditScriptIds: uniqueStrings([...strings(source.semanticEditScriptIds), ...strings(source.semanticEditScriptId), ...strings(index.semanticEditScriptIds), ...strings(summary.scriptIds), ...scripts.map((script) => script.id), ...replays.map((replay) => replay.scriptId)]),
    semanticEditProjectionIds: uniqueStrings([...strings(source.semanticEditProjectionIds), ...strings(source.semanticEditProjectionId), ...strings(index.semanticEditProjectionIds), ...strings(summary.projectionIds), ...projections.map((projection) => projection.id), ...replays.map((replay) => replay.projectionId)]),
    semanticEditReplayIds: uniqueStrings([...strings(source.semanticEditReplayIds), ...strings(source.semanticEditReplayId), ...strings(index.semanticEditReplayIds), ...strings(summary.replayIds), ...replays.map((replay) => replay.id)]),
    semanticEditOperationIds: uniqueStrings([...strings(source.semanticOperationIds), ...strings(index.semanticOperationIds), ...operations.map((operation) => operation.id), ...replayOperationIds(replays)]),
    semanticEditProjectionEditCount: edits.length,
    semanticEditReplayEditCount: replayEdits.length,
    semanticEditReplayStatuses: uniqueStrings([...strings(source.semanticEditReplayStatuses), ...strings(index.semanticEditReplayStatuses), ...strings(summary.replayStatuses), ...replays.map((replay) => replay.status)]),
    semanticEditReplayActions: uniqueStrings([...strings(source.semanticEditReplayActions), ...strings(index.semanticEditReplayActions), ...strings(summary.replayActions), ...replays.map((replay) => replay.admission?.action)]),
    semanticEditReplayReasonCodes: uniqueStrings([...strings(source.semanticEditReplayReasonCodes), ...strings(index.semanticEditReplayReasonCodes), ...strings(summary.replayReasonCodes), ...replays.flatMap(replayReasonCodes)]),
    semanticEditReplayCurrentHashes: uniqueStrings([...strings(source.semanticEditReplayCurrentHashes), ...strings(index.semanticEditReplayCurrentHashes), ...strings(summary.replayCurrentHashes), ...strings(summary.semanticEditReplayCurrentHashes), ...replays.map((replay) => replay.currentHash)]),
    semanticEditReplayOutputHashes: uniqueStrings([...strings(source.semanticEditReplayOutputHashes), ...strings(index.semanticEditReplayOutputHashes), ...strings(summary.replayOutputHashes), ...strings(summary.semanticEditReplayOutputHashes), ...replays.map((replay) => replay.outputHash)]),
    sourceBackprojectionModes: uniqueStrings([...strings(source.sourceBackprojectionModes), ...strings(index.sourceBackprojectionModes), ...strings(summary.sourceBackprojectionModes), ...scripts.flatMap(scriptBackprojectionModes), ...projections.map((projection) => projection.metadata?.sourceBackprojectionMode), ...replays.map((replay) => replay.metadata?.sourceBackprojectionMode)]),
    semanticEditKeys: uniqueStrings([...strings(source.semanticEditKeys), ...strings(index.semanticEditKeys), ...strings(summary.semanticEditKeys), ...operations.map((operation) => operation.semanticKey), ...edits.map((edit) => edit.semanticKey), ...replayEdits.map((edit) => edit.semanticKey)]),
    semanticIdentityHashes: uniqueStrings([...strings(source.semanticIdentityHashes), ...strings(index.semanticIdentityHashes), ...strings(summary.semanticIdentityHashes), ...operations.map((operation) => operation.semanticIdentityHash), ...edits.map((edit) => edit.semanticIdentityHash), ...replayEdits.map((edit) => edit.semanticIdentityHash)]),
    sourceIdentityHashes: uniqueStrings([...strings(source.sourceIdentityHashes), ...strings(index.sourceIdentityHashes), ...strings(summary.sourceIdentityHashes), ...operations.map((operation) => operation.sourceIdentityHash), ...edits.map((edit) => edit.sourceIdentityHash), ...replayEdits.map((edit) => edit.sourceIdentityHash)]),
    operationContentHashes: uniqueStrings([...strings(source.operationContentHashes), ...strings(index.operationContentHashes), ...strings(summary.operationContentHashes), ...operations.map((operation) => operation.operationContentHash), ...edits.map((edit) => edit.operationContentHash), ...replayEdits.map((edit) => edit.operationContentHash)]),
    editContentHashes: uniqueStrings([...strings(source.editContentHashes), ...strings(index.editContentHashes), ...strings(summary.editContentHashes), ...edits.map((edit) => edit.editContentHash), ...replayEdits.map((edit) => edit.editContentHash)]),
    anchorKeys: uniqueStrings([...strings(source.anchorKeys), ...strings(index.anchorKeys), ...strings(summary.anchorKeys), ...operations.map((operation) => operation.anchor?.key), ...edits.map((edit) => edit.anchorKey), ...replayEdits.map((edit) => edit.anchorKey)]),
    conflictKeys: uniqueStrings([...strings(source.conflictKeys), ...strings(index.conflictKeys), ...strings(summary.conflictKeys), ...operations.map((operation) => operation.anchor?.conflictKey), ...edits.map((edit) => edit.conflictKey), ...replayEdits.map((edit) => edit.conflictKey)]),
    projectedSourcePaths: uniqueStrings([...strings(source.projectedSourcePaths), ...strings(index.projectedSourcePaths), ...strings(summary.projectedSourcePaths), ...projections.map((projection) => projection.sourcePath), ...edits.flatMap((edit) => [edit.sourcePath, edit.targetSourcePath]), ...replays.map((replay) => replay.sourcePath), ...replayEdits.map((edit) => edit.sourcePath)])
  };
}

export function semanticEditSummary(index) {
  if (!index.semanticEditScriptIds.length && !index.semanticEditProjectionIds.length && !index.semanticEditReplayIds.length) return undefined;
  return compactRecord({
    scriptIds: index.semanticEditScriptIds,
    projectionIds: index.semanticEditProjectionIds,
    replayIds: index.semanticEditReplayIds,
    replayStatuses: index.semanticEditReplayStatuses,
    replayActions: index.semanticEditReplayActions,
    replayReasonCodes: index.semanticEditReplayReasonCodes,
    replayCurrentHashes: index.semanticEditReplayCurrentHashes,
    replayOutputHashes: index.semanticEditReplayOutputHashes,
    sourceBackprojectionModes: index.sourceBackprojectionModes,
    semanticEditKeys: index.semanticEditKeys,
    semanticIdentityHashes: index.semanticIdentityHashes,
    sourceIdentityHashes: index.sourceIdentityHashes,
    operationContentHashes: index.operationContentHashes,
    editContentHashes: index.editContentHashes,
    anchorKeys: index.anchorKeys,
    conflictKeys: index.conflictKeys,
    projectedSourcePaths: index.projectedSourcePaths,
    replayEditCount: index.semanticEditReplayEditCount
  });
}

function replayOperationIds(replays) {
  return replays.flatMap((replay) => [
    ...array(replay.appliedOperations),
    ...array(replay.skippedOperations),
    ...array(replay.edits).map((edit) => edit.operationId)
  ]);
}
function replayReasonCodes(replay) {
  return [
    ...array(replay.admission?.reasonCodes),
    ...array(replay.summary?.reasonCodes),
    ...array(replay.diagnostics).flatMap((diagnostic) => array(diagnostic.reasonCodes)),
    ...array(replay.edits).flatMap((edit) => array(edit.reasonCodes))
  ];
}
function scriptBackprojectionModes(script) {
  return [
    script.metadata?.sourceBackprojectionMode,
    script.metadata?.sourceProjectionHint?.sourceBackprojectionMode,
    ...array(script.operations).map((operation) => operation.metadata?.sourceBackprojection?.mode)
  ];
}
function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
