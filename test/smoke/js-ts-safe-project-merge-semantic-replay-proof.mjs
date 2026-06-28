import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { createSemanticEditBundleAdmission, createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection, safeMergeJsTsProject } from '../../src/index.js';
import { semanticEditReplayCleanEvidence } from '../../src/js-ts-safe-project-merge-semantic-replay-proof.js';

const sameLineReplayConflict = safeMergeJsTsProject({
  id: 'project_semantic_replay_conflict_proof',
  language: 'typescript',
  baseFiles: {
    'src/update.ts': 'export function update(state) { if (!state.ready) state.ready = true; return state.ready; }\n'
  },
  workerFiles: {
    'src/update.ts': 'export function update(state) { if (!state.ready) state.ready = false; return state.ready; }\n'
  },
  headFiles: {
    'src/update.ts': 'export function update(state) { if (state.pending && !state.ready) state.ready = true; return state.ready; }\n'
  }
});

assert.equal(sameLineReplayConflict.status, 'blocked');
assert.equal(sameLineReplayConflict.admission.semanticEquivalenceClaim, false);
assert.equal(sameLineReplayConflict.summary.semanticArtifactFiles, 1);
assert.equal(sameLineReplayConflict.summary.proofSemanticEditReplayCleanStatus, 'failed');
assert.equal(sameLineReplayConflict.confidence.recommendedAction, 'block');
assert.equal(sameLineReplayConflict.confidence.missingSignals.includes('semantic-edit-replay-proof-not-produced'), true);

const replayProof = sameLineReplayConflict.proofEvidence.records.find((record) => record.level === 'semantic-edit-replay-clean');
assert.ok(replayProof, 'missing semantic-edit-replay-clean proof');
assert.equal(replayProof.status, 'failed');
assert.equal(replayProof.autoMergeClaim, false);
assert.equal(replayProof.semanticEquivalenceClaim, false);
assert.equal(replayProof.metadata?.failedReplayFiles, 1);
assert.equal(replayProof.metadata?.sourcePaths.includes('src/update.ts'), true);
assert.equal(replayProof.metadata?.replayStatuses.includes('blocked'), true);
assert.equal(replayProof.metadata?.reasonCodes.includes('semantic-edit-replay-blocked'), true);
assert.equal(replayProof.metadata?.nextMissingEvidence.routeId, 'produce-semantic-edit-replay-proof');
assert.equal(replayProof.metadata?.nextMissingEvidence.routeNext, 'run-semantic-edit-replay-diagnostics');

assert.equal(sameLineReplayConflict.proofEvidence.summary.failedLevels.includes('semantic-edit-replay-clean'), true);
assert.equal(sameLineReplayConflict.proofEvidence.summary.missingSignals.includes('semantic-edit-replay-proof-not-produced'), true);

const replaySurface = sameLineReplayConflict.confidence.admissionMatrixAudit.surfaces.find((surface) => surface.surface === 'generic-semantic-edit-admission');
assert.ok(replaySurface, 'missing generic semantic edit admission matrix surface');
assert.equal(replaySurface.proofStatuses['semantic-edit-replay-clean'], 'failed');
assert.equal(replaySurface.missingRouteIds.includes('produce-semantic-edit-replay-proof'), true);
assert.equal(replaySurface.nextMissingRouteId, 'produce-semantic-edit-replay-proof');
assert.equal(replaySurface.routeIds.includes('reject-semantic-edit-replay-output-mismatch'), true);
assert.equal(replaySurface.semanticEquivalenceClaim, false);

const cleanReplayBase = 'export const value = 1;\n';
const cleanReplayHead = 'export const value = 1;\nexport const headOnly = true;\n';
const cleanReplayOutput = 'export const value = 2;\nexport const headOnly = true;\n';
const cleanReplayProof = semanticEditReplayCleanEvidence('project_clean_replay_output_artifact', [
  replayProofFile({
    sourcePath: 'src/clean.ts',
    fixtureId: 'clean_replay_output_artifact',
    baseSourceText: cleanReplayBase,
    headSourceText: cleanReplayHead,
    outputSourceText: cleanReplayOutput
  })
], 'semantic-edit-replay-clean');

assert.equal(cleanReplayProof.status, 'passed');
assert.equal(cleanReplayProof.autoMergeClaim, false);
assert.equal(cleanReplayProof.semanticEquivalenceClaim, false);
assert.equal(cleanReplayProof.metadata?.missingSignal, undefined);
assert.equal(cleanReplayProof.metadata?.nextMissingEvidence, undefined);
assert.equal(cleanReplayProof.metadata?.acceptedCleanReplays, 1);
assert.equal(cleanReplayProof.metadata?.alreadyAppliedChecks, 1);
assert.equal(cleanReplayProof.metadata?.currentHeadCommutationProofs, 1);
assert.equal(cleanReplayProof.metadata?.boundedAdmissionRouteIds.includes('admit-independent-semantic-edit-current-head-commutation'), true);
assert.equal(cleanReplayProof.metadata?.boundedAdmissionRoute.routeNext, 'apply-source-bound-semantic-edit-replay');
assert.equal(cleanReplayProof.metadata?.boundedAdmissionRoute.autoMergeClaim, false);
assert.equal(cleanReplayProof.metadata?.boundedAdmissionRoute.semanticEquivalenceClaim, false);

const missingReplayProof = semanticEditReplayCleanEvidence('project_missing_replay_output_artifact', [
  replayProofFile({
    sourcePath: 'src/missing.ts',
    fixtureId: 'missing_replay_output_artifact',
    baseSourceText: cleanReplayBase,
    headSourceText: cleanReplayHead,
    outputSourceText: cleanReplayOutput,
    includeReplay: false,
    includeAlreadyAppliedReplay: false
  })
], 'semantic-edit-replay-clean');

assert.equal(missingReplayProof.status, 'skipped');
assert.equal(missingReplayProof.autoMergeClaim, false);
assert.equal(missingReplayProof.semanticEquivalenceClaim, false);
assert.equal(missingReplayProof.metadata?.missingSignal, 'semantic-edit-replay-proof-not-produced');
assert.equal(missingReplayProof.metadata?.missingReplayFiles, 1);
assert.equal(missingReplayProof.metadata?.currentHeadCommutationProofs, 0);
assert.equal(missingReplayProof.metadata?.boundedAdmissionRoute, undefined);
assert.equal(missingReplayProof.metadata?.nextMissingEvidence.action, 'review');
assert.equal(missingReplayProof.metadata?.nextMissingEvidence.routeId, 'produce-semantic-edit-replay-proof');
assert.equal(missingReplayProof.metadata?.nextMissingEvidence.routeNext, 'run-semantic-edit-replay-diagnostics');

const spoofedExpectedOutput = 'export const value = 2;\n';
const spoofedReplayOutput = 'export const value = 3;\n';
const spoofedReplayProof = semanticEditReplayCleanEvidence('project_spoofed_replay_output', [
  replayProofFile({
    sourcePath: 'src/spoofed.ts',
    fixtureId: 'spoofed_replay_output',
    baseSourceText: 'export const value = 1;\n',
    outputSourceText: spoofedExpectedOutput,
    projectionSourceText: spoofedReplayOutput,
    replayOutputSourceText: spoofedReplayOutput,
    includeCurrentBinding: false,
    includeProjectionSourcePath: false,
    includeReplaySourcePath: false
  })
], 'semantic-edit-replay-clean');

assert.equal(spoofedReplayProof.status, 'failed');
assert.equal(spoofedReplayProof.autoMergeClaim, false);
assert.equal(spoofedReplayProof.semanticEquivalenceClaim, false);
assert.equal(spoofedReplayProof.metadata?.outputBindingFailures, 1);
assert.equal(spoofedReplayProof.metadata?.outputBindingStatuses.includes('failed'), true);
assert.equal(spoofedReplayProof.metadata?.missingSignal, 'semantic-edit-replay-proof-output-mismatch');
assert.equal(spoofedReplayProof.metadata?.reasonCodes.includes('semantic-edit-replay-output-source-mismatch'), true);
assert.equal(spoofedReplayProof.metadata?.reasonCodes.includes('semantic-edit-replay-output-hash-mismatch'), true);
assert.equal(spoofedReplayProof.metadata?.reasonCodes.includes('semantic-edit-projection-output-hash-mismatch'), true);
assert.equal(spoofedReplayProof.metadata?.nextMissingEvidence.action, 'reject-proof');
assert.equal(spoofedReplayProof.metadata?.nextMissingEvidence.routeId, 'reject-semantic-edit-replay-output-mismatch');
assert.equal(spoofedReplayProof.metadata?.nextMissingEvidence.routeNext, 'inspect-semantic-edit-replay-output-binding');
assert.equal(spoofedReplayProof.metadata?.nextMissingEvidence.reasonCodes.includes('semantic-edit-replay-output-hash-mismatch'), true);
assert.equal(spoofedReplayProof.metadata?.nextMissingEvidence.autoMergeClaim, false);
assert.equal(spoofedReplayProof.metadata?.nextMissingEvidence.semanticEquivalenceClaim, false);
assert.equal(spoofedReplayProof.metadata?.currentHeadCommutationProofs, 0);
assert.equal(spoofedReplayProof.metadata?.boundedAdmissionRoute, undefined);

const staleReplayBase = 'export const value = 1;\n';
const staleReplayOldHead = 'export const value = 1;\nexport const headOnly = 1;\n';
const staleReplayCurrentHead = 'export const value = 1;\nexport const headOnly = 2;\n';
const staleReplayOutput = 'export const value = 2;\nexport const headOnly = 1;\n';
const staleReplayProof = semanticEditReplayCleanEvidence('project_stale_replay_output_artifact', [
  replayProofFile({
    sourcePath: 'src/stale.ts',
    fixtureId: 'stale_replay_output_artifact',
    baseSourceText: staleReplayBase,
    headSourceText: staleReplayCurrentHead,
    outputSourceText: staleReplayOutput,
    replayCurrentSourceText: staleReplayOldHead
  })
], 'semantic-edit-replay-clean');

assert.equal(staleReplayProof.status, 'failed');
assert.equal(staleReplayProof.autoMergeClaim, false);
assert.equal(staleReplayProof.semanticEquivalenceClaim, false);
assert.equal(staleReplayProof.metadata?.missingSignal, 'semantic-edit-replay-proof-stale-current-source');
assert.equal(staleReplayProof.metadata?.sourceBindingStatuses.includes('stale'), true);
assert.equal(staleReplayProof.metadata?.staleReplayFiles, 1);
assert.equal(staleReplayProof.metadata?.outputBindingFailures, 0);
assert.equal(staleReplayProof.metadata?.reasonCodes.includes('semantic-edit-replay-current-source-hash-mismatch'), true);
assert.equal(staleReplayProof.metadata?.rerunRouteIds.includes('rerun-semantic-edit-replay-current-head'), true);
assert.equal(staleReplayProof.metadata?.nextMissingEvidence.action, 'rerun');
assert.equal(staleReplayProof.metadata?.nextMissingEvidence.routeId, 'rerun-semantic-edit-replay-current-head');
assert.equal(staleReplayProof.metadata?.nextMissingEvidence.routeNext, 'rerun-semantic-edit-replay-on-current-head');
assert.equal(staleReplayProof.metadata?.nextMissingEvidence.semanticEquivalenceClaim, false);
assert.equal(staleReplayProof.metadata?.currentHeadCommutationProofs, 0);
assert.equal(staleReplayProof.metadata?.boundedAdmissionRoute, undefined);

const renameBase = 'export function step() {\n  return 1;\n}\nexport const keep = 0;\n';
const renameWorker = renameBase.replace('function step', 'function nextStep');
const renameHead = renameBase.replace('keep = 0', 'keep = 1');
const renameExpected = 'export function nextStep() {\n  return 1;\n}\nexport const keep = 1;\n';
const renameScript = createSemanticEditScript({ id: 'semantic_replay_output_binding_spoof', language: 'typescript', sourcePath: 'src/replay-output.ts', baseSourceText: renameBase, workerSourceText: renameWorker, headSourceText: renameHead });
const renameProjection = projectSemanticEditScriptToSource({ script: renameScript, workerSourceText: renameWorker, headSourceText: renameHead });

const unboundReplay = replaySemanticEditProjection({
  projection: renameProjection, currentSourceText: renameHead,
  expectedOutputSourceText: renameExpected, expectedOutputHash: hashSemanticValue(renameExpected)
});
assert.equal(unboundReplay.status, 'accepted-clean');
assert.equal(unboundReplay.admission.proofRoute, undefined);
assert.equal(unboundReplay.admission.autoMergeClaim, false);
assert.equal(unboundReplay.admission.semanticEquivalenceClaim, false);

const boundedReplay = replaySemanticEditProjection({
  projection: renameProjection, currentSourceText: renameHead, currentSourceHash: hashSemanticValue(renameHead),
  expectedOutputSourceText: renameExpected, expectedOutputHash: hashSemanticValue(renameExpected)
});
assert.equal(boundedReplay.status, 'accepted-clean');
assert.equal(boundedReplay.metadata.currentSourceBindingStatus, 'bound');
assert.equal(boundedReplay.metadata.outputBindingStatus, 'bound');
assert.deepEqual([boundedReplay.admission.proofRoute.routeId, boundedReplay.admission.proofRoute.routeNext, boundedReplay.admission.proofRoute.proofKind], ['admit-independent-semantic-edit-current-head-commutation', 'apply-source-bound-semantic-edit-replay', 'bounded-current-head-commutation']);
assert.equal(boundedReplay.admission.proofRoute.autoMergeClaim, false);
assert.equal(boundedReplay.admission.proofRoute.semanticEquivalenceClaim, false);
assert.equal(boundedReplay.admission.autoMergeClaim, false);
assert.equal(boundedReplay.admission.semanticEquivalenceClaim, false);
assert.equal(boundedReplay.admission.proofRoute.replayId, boundedReplay.id);
assert.equal(boundedReplay.admission.proofRoute.sourcePath, boundedReplay.sourcePath);
assert.deepEqual(boundedReplay.admission.proofRoute.appliedOperations, boundedReplay.appliedOperations);

const mismatchedProjectionHash = hashSemanticValue(renameExpected.replace('keep = 1', 'keep = 8'));
const projectionHashMismatchedReplay = replaySemanticEditProjection({
  projection: { ...renameProjection, projectedHash: mismatchedProjectionHash },
  currentSourceText: renameHead, currentSourceHash: hashSemanticValue(renameHead),
  expectedOutputSourceText: renameExpected, expectedOutputHash: hashSemanticValue(renameExpected)
});
assert.equal(projectionHashMismatchedReplay.status, 'accepted-clean');
assert.equal(projectionHashMismatchedReplay.outputHash, hashSemanticValue(renameExpected));
assert.deepEqual([projectionHashMismatchedReplay.admission.proofRoute.routeId, projectionHashMismatchedReplay.admission.proofRoute.routeNext], ['reject-semantic-edit-replay-output-mismatch', 'inspect-semantic-edit-replay-output-binding']);
for (const code of ['semantic-edit-projection-output-hash-mismatch', 'semantic-edit-replay-projection-output-hash-mismatch']) {
  assert.equal(projectionHashMismatchedReplay.admission.proofRoute.reasonCodes.includes(code), true);
}
assert.equal(projectionHashMismatchedReplay.admission.proofRoute.semanticEquivalenceClaim, false);
assert.equal(projectionHashMismatchedReplay.admission.proofRoute.autoMergeClaim, false);

const projectionHashMismatchedBundleAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [renameScript], semanticEditProjections: [{ ...renameProjection, projectedHash: mismatchedProjectionHash }], semanticEditReplays: [projectionHashMismatchedReplay],
  evidence: [{ id: 'evidence_projection_hash_mismatch_replay_tests', kind: 'test', status: 'passed', scope: 'semantic-edit:auto-merge' }]
});
assert.deepEqual([
  projectionHashMismatchedBundleAdmission.status,
  projectionHashMismatchedBundleAdmission.action,
  projectionHashMismatchedBundleAdmission.autoApplyCandidate,
  projectionHashMismatchedBundleAdmission.summary.acceptedClean,
  projectionHashMismatchedBundleAdmission.summary.boundedCurrentHeadReplays
], ['needs-review', 'review', false, 1, 0]);
assert.equal(projectionHashMismatchedBundleAdmission.reasonCodes.includes('semantic-edit-replay-current-head-proof-missing'), true);

const spoofedReplay = replaySemanticEditProjection({
  projection: renameProjection,
  currentSourceText: renameHead,
  currentSourceHash: hashSemanticValue(renameHead),
  expectedOutputSourceText: renameExpected.replace('keep = 1', 'keep = 9'),
  expectedOutputHash: hashSemanticValue(renameExpected.replace('keep = 1', 'keep = 9'))
});
assert.equal(spoofedReplay.status, 'blocked');
assert.equal(spoofedReplay.outputSourceText, undefined);
assert.equal(spoofedReplay.admission.autoApplyCandidate, false);
assert.equal(spoofedReplay.admission.autoMergeClaim, false);
assert.equal(spoofedReplay.admission.semanticEquivalenceClaim, false);
assert.equal(spoofedReplay.admission.proofRoute.routeId, 'reject-semantic-edit-replay-output-mismatch');
assert.equal(spoofedReplay.admission.proofRoute.routeNext, 'inspect-semantic-edit-replay-output-binding');
assert.equal(spoofedReplay.admission.proofRoute.semanticEquivalenceClaim, false);
assert.equal(spoofedReplay.admission.proofRoute.routeId === boundedReplay.admission.proofRoute.routeId, false);
assert.equal(spoofedReplay.admission.reasonCodes.includes('semantic-edit-replay-output-source-mismatch'), true);
assert.equal(spoofedReplay.admission.reasonCodes.includes('semantic-edit-replay-output-hash-mismatch'), true);
assert.equal(spoofedReplay.diagnostics.some((diagnostic) => diagnostic.code === 'semantic-edit-replay-output-hash-mismatch'), true);

const rebasedReplay = replaySemanticEditProjection({
  projection: renameProjection,
  currentSourceText: renameHead,
  currentSourceHash: hashSemanticValue(renameBase),
  expectedOutputSourceText: renameExpected,
  expectedOutputHash: hashSemanticValue(renameExpected)
});
assert.equal(rebasedReplay.status, 'stale');
assert.equal(rebasedReplay.outputSourceText, undefined);
assert.equal(rebasedReplay.admission.action, 'rerun-semantic-import');
assert.equal(rebasedReplay.admission.autoApplyCandidate, false);
assert.equal(rebasedReplay.admission.autoMergeClaim, false);
assert.equal(rebasedReplay.admission.semanticEquivalenceClaim, false);
assert.equal(rebasedReplay.admission.reasonCodes.includes('current-source-hash-mismatch'), true);
assert.equal(rebasedReplay.admission.rerunRoute.routeId, 'rerun-semantic-edit-replay-current-head');
assert.equal(rebasedReplay.admission.rerunRoute.routeNext, 'rerun-semantic-edit-replay-on-current-head');
assert.equal(rebasedReplay.admission.proofRoute.routeId, 'rerun-semantic-edit-replay-current-head');
assert.equal(rebasedReplay.admission.proofRoute.routeId === boundedReplay.admission.proofRoute.routeId, false);
assert.equal(rebasedReplay.metadata.currentSourceBindingStatus, 'stale');
assert.equal(rebasedReplay.metadata.outputBindingStatus, 'skipped');

function replayProofFile(input) {
  const projectionSourceText = input.projectionSourceText ?? input.outputSourceText;
  const replayOutputSourceText = input.replayOutputSourceText ?? input.outputSourceText;
  return compactRecord({
    sourcePath: input.sourcePath,
    status: 'merged',
    baseHash: hashSemanticValue(input.baseSourceText),
    headSourceText: input.includeCurrentBinding === false ? undefined : input.headSourceText,
    headHash: input.includeCurrentBinding === false ? undefined : hashSemanticValue(input.headSourceText),
    outputSourceText: input.outputSourceText,
    outputHash: hashSemanticValue(input.outputSourceText),
    semanticArtifacts: {
      status: 'verified',
      projection: compactRecord({
        id: `projection_${input.fixtureId}`,
        sourcePath: input.includeProjectionSourcePath === false ? undefined : input.sourcePath,
        sourceText: projectionSourceText,
        projectedHash: hashSemanticValue(projectionSourceText)
      }),
      ...(input.includeReplay === false ? {} : { replay: replayProofReplay(input, replayOutputSourceText) }),
      ...(input.includeAlreadyAppliedReplay === false
        ? {}
        : { alreadyAppliedReplay: { id: `replay_${input.fixtureId}_already_applied`, status: 'already-applied' } }),
      admission: replayProofAdmission()
    }
  });
}

function replayProofReplay(input, outputSourceText) {
  return compactRecord({
    id: `replay_${input.fixtureId}`,
    sourcePath: input.includeReplaySourcePath === false ? undefined : input.sourcePath,
    status: 'accepted-clean',
    currentHash: input.includeCurrentBinding === false
      ? undefined
      : hashSemanticValue(input.replayCurrentSourceText ?? input.headSourceText),
    appliedOperations: input.includeAppliedOperations === false ? undefined : [`operation_${input.fixtureId}`],
    outputSourceText,
    outputHash: hashSemanticValue(outputSourceText),
    admission: replayProofAdmission(),
    summary: { reasonCodes: [] },
    diagnostics: []
  });
}

function replayProofAdmission() {
  return {
    reasonCodes: [],
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
