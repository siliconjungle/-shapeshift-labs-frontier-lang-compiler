import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { compareSemanticPatchBundleRecords } from './semanticPatchBundleOverlaps.js';
import { replaySemanticEditProjection } from './replaySemanticEditProjection.js';

function composeSemanticPatchBundleProjections(input = {}) {
  const id = String(input.id ?? 'semantic_patch_bundle_composition');
  const currentSourceText = input.currentSourceText ?? input.headSourceText;
  const projections = array(input.projections ?? input.semanticEditProjections);
  const bundles = array(input.bundles ?? input.semanticPatchBundles);
  const sourcePath = input.sourcePath ?? projections.find((projection) => projection?.sourcePath)?.sourcePath;
  const language = input.language ?? projections.find((projection) => projection?.language)?.language;
  const currentHash = typeof currentSourceText === 'string' ? hashSemanticValue(currentSourceText) : undefined;
  const projectionBindings = projections.map((projection, index) => projectionReplayBinding(projection, bundles[index], input));
  const reasonCodes = baseReasonCodes({ currentSourceText, projections, bundles, projectionBindings });
  const overlapRecords = bundleOverlapRecords(bundles, input.overlapOptions);
  reasonCodes.push(...overlapRecords.flatMap((record) => record.admission.status === 'independent'
    ? []
    : [`bundle-overlap:${record.admission.status}`]));
  const replays = reasonCodes.length ? [] : projections.map((projection, index) => replaySemanticEditProjection({
    id: `${id}_replay_${index + 1}`,
    projection,
    currentSourceText,
    currentSourceHash: projectionBindings[index]?.currentSourceHash,
    expectedOutputSourceText: projection.sourceText,
    expectedOutputHash: projection.projectedHash,
    currentSourcePath: sourcePath ?? projection.sourcePath,
    language: language ?? projection.language,
    parser: input.parser
  }));
  reasonCodes.push(...replayReasonCodes(replays));
  const edits = reasonCodes.length ? [] : appliedReplayEdits(replays);
  reasonCodes.push(...sourceEditOverlapReasons(edits));
  const outputSourceText = reasonCodes.length ? undefined : applyReplayEdits(currentSourceText, edits);
  const outputHash = outputSourceText === undefined ? undefined : hashSemanticValue(outputSourceText);
  const verificationReplays = outputSourceText === undefined ? [] : projections.map((projection, index) => replaySemanticEditProjection({
    id: `${id}_already_applied_${index + 1}`,
    projection,
    currentSourceText: outputSourceText,
    currentSourceHash: outputHash,
    expectedOutputSourceText: outputSourceText,
    expectedOutputHash: outputHash,
    currentSourcePath: sourcePath ?? projection.sourcePath,
    language: language ?? projection.language,
    parser: input.parser
  }));
  reasonCodes.push(...verificationReasonCodes(verificationReplays));
  const status = reasonCodes.length ? 'blocked' : 'verified';
  const core = {
    kind: 'frontier.lang.semanticPatchBundleComposition',
    version: 1,
    schema: 'frontier.lang.semanticPatchBundleComposition.v1',
    id,
    status,
    sourcePath,
    language,
    bundleIds: bundles.map((bundle) => bundle?.id).filter(Boolean),
    projectionIds: projections.map((projection) => projection?.id).filter(Boolean),
    currentHash,
    outputHash,
    outputSourceText,
    replays,
    verificationReplays,
    overlapRecords,
    admission: {
      status: status === 'verified' ? 'auto-merge-candidate' : 'blocked',
      action: status === 'verified' ? 'apply' : 'human-review',
      reviewRequired: status !== 'verified',
      autoApplyCandidate: status === 'verified',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(reasonCodes)
    },
    summary: {
      bundles: bundles.length,
      projections: projections.length,
      replays: replays.length,
      verificationReplays: verificationReplays.length,
      appliedEdits: edits.length,
      overlapRecords: overlapRecords.length,
      blockedOverlaps: overlapRecords.filter((record) => record.admission.status !== 'independent').length,
      boundedCurrentHeadReplays: replays.filter(hasBoundedCurrentHeadReplayProof).length,
      sourceBoundVerificationReplays: verificationReplays.filter(hasBoundOutputReplay).length
    },
    evidence: [{
      id: `evidence_${idFragment(id)}_semantic_patch_bundle_composition`,
      kind: 'semantic-patch-bundle-composition',
      status: status === 'verified' ? 'passed' : 'needs-review',
      path: sourcePath,
      summary: status === 'verified'
        ? `Composed ${edits.length} replayed semantic edit(s) from ${projections.length} projection(s).`
        : `Semantic patch bundle composition blocked: ${uniqueStrings(reasonCodes).join(', ')}.`,
      metadata: {
        bundleIds: bundles.map((bundle) => bundle?.id).filter(Boolean),
        projectionIds: projections.map((projection) => projection?.id).filter(Boolean),
        replayProofRouteIds: uniqueStrings(replays.map((replay) => replay.admission?.proofRoute?.routeId)),
        currentHash,
        outputHash,
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      }
    }]
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function baseReasonCodes(input) {
  return uniqueStrings([
    typeof input.currentSourceText === 'string' ? undefined : 'missing-current-source-text',
    input.projections.length ? undefined : 'missing-semantic-edit-projections',
    input.bundles.length && input.bundles.length !== input.projections.length ? 'bundle-projection-count-mismatch' : undefined,
    ...input.projections.map((projection, index) => projection?.status === 'projected' ? undefined : `projection-not-projected:${index + 1}`),
    ...input.projectionBindings.flatMap((binding, index) => [
      binding?.currentSourceHash ? undefined : `projection-current-source-hash-missing:${index + 1}`,
      binding?.projectedHash ? undefined : `projection-output-hash-missing:${index + 1}`
    ])
  ].filter(Boolean));
}

function projectionReplayBinding(projection, bundle, input) {
  const currentSourceHash = firstString(
    input.currentSourceHash,
    input.headHash,
    projection?.headHash,
    projection?.metadata?.headHash,
    bundle?.baseHash
  );
  return {
    currentSourceHash,
    projectedHash: firstString(projection?.projectedHash, projection?.outputHash)
  };
}

function bundleOverlapRecords(bundles, options = {}) {
  const records = [];
  for (let left = 0; left < bundles.length; left += 1) {
    for (let right = left + 1; right < bundles.length; right += 1) {
      records.push(compareSemanticPatchBundleRecords(bundles[left], bundles[right], options));
    }
  }
  return records;
}

function replayReasonCodes(replays) {
  return uniqueStrings(replays.flatMap((replay, index) => {
    if (replay.status === 'accepted-clean' || replay.status === 'already-applied') return [];
    return [`replay-not-clean:${index + 1}:${replay.status}`, ...(replay.admission?.reasonCodes ?? replay.summary?.reasonCodes ?? [])];
  }));
}

function appliedReplayEdits(replays) {
  return replays.flatMap((replay, replayIndex) => (replay.edits ?? [])
    .filter((edit) => edit.status === 'applied')
    .map((edit, editIndex) => ({
      replayIndex,
      editIndex,
      operationId: edit.operationId,
      start: edit.start,
      end: edit.end,
      replacementText: edit.replacementText
    })));
}

function sourceEditOverlapReasons(edits) {
  const reasons = [];
  const ordered = edits.slice().sort((left, right) => left.start - right.start || left.end - right.end);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (sourceEditsOverlap(previous, current)) reasons.push(`composed-source-edit-overlap:${previous.operationId}:${current.operationId}`);
  }
  return uniqueStrings(reasons);
}

function applyReplayEdits(sourceText, edits) {
  return edits.slice().sort((left, right) => right.start - left.start || right.end - left.end)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacementText + text.slice(edit.end), sourceText);
}

function verificationReasonCodes(replays) {
  return uniqueStrings(replays.flatMap((replay, index) => {
    if (replay.status === 'already-applied') return [];
    return [`verification-replay-not-already-applied:${index + 1}:${replay.status}`, ...(replay.admission?.reasonCodes ?? [])];
  }));
}

function hasBoundedCurrentHeadReplayProof(replay) {
  const route = replay?.admission?.proofRoute ?? replay?.metadata?.proofRoute;
  return replay?.status === 'accepted-clean'
    && route?.routeId === 'admit-independent-semantic-edit-current-head-commutation'
    && route?.proofKind === 'bounded-current-head-commutation'
    && route?.status === 'passed'
    && route?.action === 'apply'
    && route?.expectedCurrentHash === replay.currentHash
    && route?.replayCurrentHash === replay.currentHash
    && route?.expectedOutputHash === replay.outputHash
    && route?.projectionOutputHash === replay.outputHash
    && route?.replayOutputHash === replay.outputHash
    && replay?.metadata?.currentSourceBindingStatus === 'bound'
    && replay?.metadata?.outputBindingStatus === 'bound';
}

function hasBoundOutputReplay(replay) {
  return replay?.status === 'already-applied'
    && replay?.metadata?.currentSourceBindingStatus === 'bound'
    && replay?.metadata?.outputBindingStatus === 'bound'
    && replay?.metadata?.expectedOutputHash === replay.currentHash
    && replay?.metadata?.replayedOutputHash === replay.currentHash;
}

function sourceEditsOverlap(left, right) {
  if (left.start === left.end) return right.start < left.start && left.start < right.end;
  if (right.start === right.end) return left.start < right.start && right.start < left.end;
  return left.start < right.end && right.start < left.end;
}

function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }

export { composeSemanticPatchBundleProjections };
