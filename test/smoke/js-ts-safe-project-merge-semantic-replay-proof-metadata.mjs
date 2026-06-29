import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import {
  createSemanticEditBundleAdmission,
  createSemanticEditScript,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from '../../src/index.js';
import { semanticEditReplayCleanEvidence } from '../../src/js-ts-safe-project-merge-semantic-replay-proof.js';

const cleanReplayBase = 'export const value = 1;\n';
const cleanReplayHead = 'export const value = 1;\nexport const headOnly = true;\n';
const cleanReplayOutput = 'export const value = 2;\nexport const headOnly = true;\n';
const missingProofMetadata = semanticEditReplayCleanEvidence('project_missing_replay_proof_metadata', [
  replayProofFile({
    sourcePath: 'src/missing-metadata.ts',
    fixtureId: 'missing_replay_proof_metadata',
    baseSourceText: cleanReplayBase,
    headSourceText: cleanReplayHead,
    outputSourceText: cleanReplayOutput,
    includeAppliedOperations: false
  })
], 'semantic-edit-replay-clean');

assert.equal(missingProofMetadata.status, 'skipped');
assert.equal(missingProofMetadata.autoMergeClaim, false);
assert.equal(missingProofMetadata.semanticEquivalenceClaim, false);
assert.equal(missingProofMetadata.metadata?.missingSignal, 'semantic-edit-replay-proof-not-produced');
assert.equal(missingProofMetadata.metadata?.missingReplayFiles, 1);
assert.equal(missingProofMetadata.metadata?.currentHeadCommutationProofs, 0);
assert.equal(missingProofMetadata.metadata?.boundedAdmissionRoute, undefined);
assert.equal(missingProofMetadata.metadata?.reasonCodes.includes('semantic-edit-replay-current-head-proof-missing'), true);
assert.equal(missingProofMetadata.metadata?.nextMissingEvidence.action, 'review');
assert.equal(missingProofMetadata.metadata?.nextMissingEvidence.routeId, 'produce-semantic-edit-replay-proof');

const renameBase = 'export function step() {\n  return 1;\n}\nexport const keep = 0;\n';
const renameWorker = renameBase.replace('function step', 'function nextStep');
const renameHead = renameBase.replace('keep = 0', 'keep = 1');
const renameExpected = 'export function nextStep() {\n  return 1;\n}\nexport const keep = 1;\n';
const renameScript = createSemanticEditScript({
  id: 'semantic_replay_metadata_bound_script',
  language: 'typescript',
  sourcePath: 'src/replay-output.ts',
  baseSourceText: renameBase,
  workerSourceText: renameWorker,
  headSourceText: renameHead
});
const renameProjection = projectSemanticEditScriptToSource({
  script: renameScript,
  workerSourceText: renameWorker,
  headSourceText: renameHead
});
const identifiedBoundedReplay = replaySemanticEditProjection({
  id: 'semantic_replay_metadata_bound_replay',
  projection: renameProjection,
  currentSourceText: renameHead,
  currentSourceHash: hashSemanticValue(renameHead),
  expectedOutputSourceText: renameExpected,
  expectedOutputHash: hashSemanticValue(renameExpected)
});
assert.equal(identifiedBoundedReplay.status, 'accepted-clean');
assert.equal(identifiedBoundedReplay.admission.proofRoute.replayId, identifiedBoundedReplay.id);
assert.equal(identifiedBoundedReplay.admission.proofRoute.sourcePath, identifiedBoundedReplay.sourcePath);
assert.deepEqual(identifiedBoundedReplay.admission.proofRoute.appliedOperations, identifiedBoundedReplay.appliedOperations);

const replayMetadataGate = { id: 'evidence_semantic_replay_metadata_gate', kind: 'test', status: 'passed', scope: 'semantic-edit:auto-merge' };
const identifiedBoundedAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [renameScript],
  semanticEditProjections: [renameProjection],
  semanticEditReplays: [identifiedBoundedReplay],
  evidence: [replayMetadataGate]
});
assert.equal(identifiedBoundedAdmission.status, 'ready');
assert.equal(identifiedBoundedAdmission.autoApplyCandidate, true);
assert.equal(identifiedBoundedAdmission.summary.boundedCurrentHeadReplays, 1);

const hashOnlyProofRoute = {
  routeId: 'admit-independent-semantic-edit-current-head-commutation',
  routeLane: 'source-files',
  routeNext: 'apply-source-bound-semantic-edit-replay',
  action: 'apply',
  proofKind: 'bounded-current-head-commutation',
  status: 'passed',
  reasonCodes: ['semantic-edit-current-head-commutation-bound'],
  expectedCurrentHash: identifiedBoundedReplay.admission.proofRoute.expectedCurrentHash,
  replayCurrentHash: identifiedBoundedReplay.admission.proofRoute.replayCurrentHash,
  expectedOutputHash: identifiedBoundedReplay.admission.proofRoute.expectedOutputHash,
  replayOutputHash: identifiedBoundedReplay.admission.proofRoute.replayOutputHash,
  outputBindingStatus: 'bound',
  autoMergeClaim: false,
  semanticEquivalenceClaim: false
};
const hashOnlyRouteAdmission = createSemanticEditBundleAdmission({
  semanticEditScripts: [renameScript],
  semanticEditProjections: [renameProjection],
  semanticEditReplays: [{
    ...identifiedBoundedReplay,
    admission: { ...identifiedBoundedReplay.admission, proofRoute: hashOnlyProofRoute },
    metadata: { ...identifiedBoundedReplay.metadata, proofRoute: hashOnlyProofRoute }
  }],
  evidence: [replayMetadataGate]
});
assert.deepEqual([
  hashOnlyRouteAdmission.status,
  hashOnlyRouteAdmission.action,
  hashOnlyRouteAdmission.autoApplyCandidate,
  hashOnlyRouteAdmission.summary.acceptedClean,
  hashOnlyRouteAdmission.summary.boundedCurrentHeadReplays,
  hashOnlyRouteAdmission.summary.incompleteCurrentHeadProofReplays
], ['needs-review', 'review', false, 1, 0, 1]);
assert.equal(hashOnlyRouteAdmission.reasonCodes.includes('semantic-edit-replay-current-head-proof-missing'), true);
assert.equal(hashOnlyRouteAdmission.reasonCodes.includes('semantic-edit-replay-current-head-proof-metadata-missing'), true);
assert.equal(hashOnlyRouteAdmission.reasonCodes.includes('semantic-edit-positive-auto-merge-proof'), false);

const proofRouteOutputMismatchReplay = {
  ...identifiedBoundedReplay,
  admission: {
    ...identifiedBoundedReplay.admission,
    proofRoute: {
      ...identifiedBoundedReplay.admission.proofRoute,
      expectedOutputHash: hashSemanticValue(renameExpected.replace('keep = 1', 'keep = 9'))
    }
  }
};
const proofRouteOutputMismatchEvidence = semanticEditReplayCleanEvidence('project_output_mismatched_replay_proof_route', [{
  sourcePath: 'src/replay-output.ts',
  status: 'merged',
  baseHash: hashSemanticValue(renameBase),
  headSourceText: renameHead,
  headHash: hashSemanticValue(renameHead),
  outputSourceText: renameExpected,
  outputHash: hashSemanticValue(renameExpected),
  semanticArtifacts: {
    status: 'verified',
    projection: {
      id: renameProjection.id,
      sourcePath: 'src/replay-output.ts',
      sourceText: renameExpected,
      projectedHash: hashSemanticValue(renameExpected)
    },
    replay: proofRouteOutputMismatchReplay,
    alreadyAppliedReplay: { id: 'replay_output_mismatch_already_applied', status: 'already-applied' },
    admission: replayProofAdmission()
  }
}], 'semantic-edit-replay-clean');
assert.equal(proofRouteOutputMismatchEvidence.status, 'skipped');
assert.equal(proofRouteOutputMismatchEvidence.autoMergeClaim, false);
assert.equal(proofRouteOutputMismatchEvidence.semanticEquivalenceClaim, false);
assert.equal(proofRouteOutputMismatchEvidence.metadata?.missingSignal, 'semantic-edit-replay-proof-not-produced');
assert.equal(proofRouteOutputMismatchEvidence.metadata?.currentHeadCommutationProofs, 0);
assert.equal(proofRouteOutputMismatchEvidence.metadata?.boundedAdmissionRoute, undefined);
assert.equal(proofRouteOutputMismatchEvidence.metadata?.reasonCodes.includes('semantic-edit-replay-current-head-proof-output-hash-mismatch'), true);
assert.equal(proofRouteOutputMismatchEvidence.metadata?.reasonCodes.includes('semantic-edit-replay-current-head-proof-missing'), true);

function replayProofFile(input) {
  const outputSourceText = input.outputSourceText;
  return compactRecord({
    sourcePath: input.sourcePath,
    status: 'merged',
    baseHash: hashSemanticValue(input.baseSourceText),
    headSourceText: input.headSourceText,
    headHash: hashSemanticValue(input.headSourceText),
    outputSourceText,
    outputHash: hashSemanticValue(outputSourceText),
    semanticArtifacts: {
      status: 'verified',
      projection: {
        id: `projection_${input.fixtureId}`,
        sourcePath: input.sourcePath,
        sourceText: outputSourceText,
        projectedHash: hashSemanticValue(outputSourceText)
      },
      replay: compactRecord({
        id: `replay_${input.fixtureId}`,
        sourcePath: input.sourcePath,
        status: 'accepted-clean',
        currentHash: hashSemanticValue(input.headSourceText),
        appliedOperations: input.includeAppliedOperations === false ? undefined : [`operation_${input.fixtureId}`],
        outputSourceText,
        outputHash: hashSemanticValue(outputSourceText),
        admission: replayProofAdmission(),
        summary: { reasonCodes: [] },
        diagnostics: []
      }),
      alreadyAppliedReplay: { id: `replay_${input.fixtureId}_already_applied`, status: 'already-applied' },
      admission: replayProofAdmission()
    }
  });
}

function replayProofAdmission() {
  return { reasonCodes: [], autoMergeClaim: false, semanticEquivalenceClaim: false };
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
