import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import {
  ExternalSemanticEquivalenceClaimBoundary,
  ExternalSemanticEquivalenceKind,
  ExternalSemanticEquivalenceSchema,
  jsTsProjectSemanticEquivalenceExpectedBinding,
  jsTsProjectSemanticEquivalenceProofHash
} from '../../src/js-ts-safe-project-merge-semantic-equivalence-proof.js';

const projectInput = {
  id: 'js_ts_project_safe_merge_external_semantic_equivalence',
  language: 'typescript',
  includeDeclarationOutput: true,
  outputDeclarations: { 'src/view.d.ts': 'export declare const value = 2;\n' },
  outputDiagnostics: [],
  testGates: [{ id: 'focused-equivalence', status: 'passed', command: 'node test/smoke/focused-equivalence.mjs' }],
  baseFiles: { 'src/view.ts': 'export const value = 2;\n' },
  workerFiles: { 'src/view.ts': 'export const value = 2;\n' },
  headFiles: { 'src/view.ts': 'export const value = 2;\n' }
};

const baseline = safeMergeJsTsProject(projectInput);
assert.equal(baseline.status, 'merged');
assert.equal(baseline.proofEvidence.summary.semanticEquivalenceLevel, 'semantic-equivalence-unknown');
assert.equal(baseline.admission.semanticEquivalenceClaim, false);
assert.equal(baseline.confidence.missingSignals.includes('semantic-equivalence-proof-not-available'), true);
assert.equal(semanticProofSurface(baseline).missingRouteIds.includes('external-semantic-equivalence-proof'), true);

const proof = externalProofFor(projectInput, baseline);
const admitted = safeMergeJsTsProject({ ...projectInput, externalSemanticEquivalenceProof: proof });
assert.equal(admitted.status, 'merged');
assert.equal(admitted.proofEvidence.summary.semanticEquivalenceLevel, 'semantic-equivalence-external');
assert.equal(admitted.proofEvidence.summary.semanticEquivalenceClaim, true);
assert.equal(admitted.admission.semanticEquivalenceClaim, true);
assert.equal(admitted.admission.autoMergeClaim, false);
assert.equal(admitted.confidence.semanticEquivalenceClaim, true);
assert.equal(admitted.confidence.missingSignals.includes('semantic-equivalence-proof-not-available'), false);
assert.equal(semanticProofSurface(admitted).proofStatuses['semantic-equivalence-external'], 'passed');
assert.equal(semanticProofSurface(admitted).missingRouteIds?.includes('external-semantic-equivalence-proof'), false);
assert.equal(admitted.proofEvidence.records.some((record) => record.level === 'semantic-equivalence-unknown'), false);

const staleProof = { ...proof, outputSetHash: 'stale-output-set' };
staleProof.proofHash = jsTsProjectSemanticEquivalenceProofHash(staleProof);
const stale = safeMergeJsTsProject({ ...projectInput, semanticEquivalenceProof: staleProof });
assert.equal(stale.proofEvidence.summary.semanticEquivalenceLevel, 'semantic-equivalence-unknown');
assert.equal(stale.admission.semanticEquivalenceClaim, false);
const failedProof = stale.proofEvidence.records.find((record) => record.level === 'semantic-equivalence-external');
assert.equal(failedProof.status, 'failed');
assert.equal(failedProof.metadata.reasonCodes.includes('semantic-equivalence-proof-output-set-hash-mismatch'), true);
assert.equal(stale.confidence.missingSignals.includes('semantic-equivalence-proof-not-available'), true);

const overclaimProof = { ...proof, autoMergeClaim: true };
overclaimProof.proofHash = jsTsProjectSemanticEquivalenceProofHash(overclaimProof);
const overclaim = safeMergeJsTsProject({ ...projectInput, externalSemanticEquivalenceProof: overclaimProof });
assert.equal(overclaim.admission.semanticEquivalenceClaim, false);
assert.equal(overclaim.proofEvidence.records.find((record) => record.level === 'semantic-equivalence-external').metadata.reasonCodes.includes('semantic-equivalence-proof-auto-merge-claim-not-false'), true);

const missingSchemaProof = { ...proof };
delete missingSchemaProof.schema;
missingSchemaProof.proofHash = jsTsProjectSemanticEquivalenceProofHash(missingSchemaProof);
assert.equal(externalReasonCodes(safeMergeJsTsProject({ ...projectInput, externalSemanticEquivalenceProof: missingSchemaProof })).includes('semantic-equivalence-proof-schema-missing'), true);

const missingKindProof = { ...proof };
delete missingKindProof.kind;
missingKindProof.proofHash = jsTsProjectSemanticEquivalenceProofHash(missingKindProof);
assert.equal(externalReasonCodes(safeMergeJsTsProject({ ...projectInput, externalSemanticEquivalenceProof: missingKindProof })).includes('semantic-equivalence-proof-kind-missing'), true);

function externalProofFor(input, result) {
  const expected = jsTsProjectSemanticEquivalenceExpectedBinding(input.id, {
    ...input,
    fileResults: result.files,
    outputDiagnosticsGate: result.outputDiagnosticsGate,
    outputDeclarationGate: result.outputDeclarationGate,
    outputQualityGate: result.outputQualityGate
  });
  const proof = {
    schema: ExternalSemanticEquivalenceSchema,
    kind: ExternalSemanticEquivalenceKind,
    status: 'passed',
    evidenceId: 'external-equivalence-evidence',
    verifier: { name: 'fixture-verifier', version: '1' },
    command: 'node verify-equivalence.mjs',
    artifactHash: 'artifact-hash',
    projectId: expected.projectId,
    language: expected.language,
    sourceFileBindings: expected.sourceFileBindings,
    sourceSetHash: expected.sourceSetHash,
    outputSetHash: expected.outputSetHash,
    gates: expected.gates,
    claimKind: 'external-semantic-equivalence',
    claimBoundary: ExternalSemanticEquivalenceClaimBoundary,
    semanticEquivalenceClaim: true,
    autoMergeClaim: false
  };
  return { ...proof, proofHash: jsTsProjectSemanticEquivalenceProofHash(proof) };
}

function semanticProofSurface(result) {
  return result.confidence.admissionMatrixAudit.surfaces.find((surface) => surface.surface === 'semantic-equivalence-proof');
}

function externalReasonCodes(result) {
  return result.proofEvidence.records.find((record) => record.level === 'semantic-equivalence-external').metadata.reasonCodes;
}
