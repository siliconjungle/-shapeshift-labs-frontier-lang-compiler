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
    semanticEditReplayCurrentHashes: uniqueStrings([...strings(source.semanticEditReplayCurrentHashes), ...strings(index.semanticEditReplayCurrentHashes), ...replays.map((replay) => replay.currentHash)]),
    semanticEditReplayOutputHashes: uniqueStrings([...strings(source.semanticEditReplayOutputHashes), ...strings(index.semanticEditReplayOutputHashes), ...replays.map((replay) => replay.outputHash)]),
    semanticEditKeys: uniqueStrings([...strings(source.semanticEditKeys), ...strings(index.semanticEditKeys), ...operations.map((operation) => operation.semanticKey), ...edits.map((edit) => edit.semanticKey), ...replayEdits.map((edit) => edit.semanticKey)]),
    semanticIdentityHashes: uniqueStrings([...strings(source.semanticIdentityHashes), ...strings(index.semanticIdentityHashes), ...operations.map((operation) => operation.semanticIdentityHash), ...edits.map((edit) => edit.semanticIdentityHash), ...replayEdits.map((edit) => edit.semanticIdentityHash)]),
    sourceIdentityHashes: uniqueStrings([...strings(source.sourceIdentityHashes), ...strings(index.sourceIdentityHashes), ...operations.map((operation) => operation.sourceIdentityHash), ...edits.map((edit) => edit.sourceIdentityHash), ...replayEdits.map((edit) => edit.sourceIdentityHash)]),
    operationContentHashes: uniqueStrings([...strings(source.operationContentHashes), ...strings(index.operationContentHashes), ...operations.map((operation) => operation.operationContentHash), ...edits.map((edit) => edit.operationContentHash)]),
    editContentHashes: uniqueStrings([...strings(source.editContentHashes), ...strings(index.editContentHashes), ...edits.map((edit) => edit.editContentHash), ...replayEdits.map((edit) => edit.editContentHash)]),
    anchorKeys: uniqueStrings([...operations.map((operation) => operation.anchor?.key), ...edits.map((edit) => edit.anchorKey)]),
    conflictKeys: uniqueStrings([...operations.map((operation) => operation.anchor?.conflictKey), ...edits.map((edit) => edit.conflictKey)]),
    projectedSourcePaths: uniqueStrings([...projections.map((projection) => projection.sourcePath), ...edits.flatMap((edit) => [edit.sourcePath, edit.targetSourcePath]), ...replays.map((replay) => replay.sourcePath), ...replayEdits.map((edit) => edit.sourcePath)])
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
    semanticEditKeys: index.semanticEditKeys,
    operationContentHashes: index.operationContentHashes,
    editContentHashes: index.editContentHashes,
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
function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
