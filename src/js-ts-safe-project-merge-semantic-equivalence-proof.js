import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const ExternalSemanticEquivalenceLevel = 'semantic-equivalence-external';
const ExternalSemanticEquivalenceSchema = 'frontier.lang.jsTsProjectSemanticEquivalenceProof.v1';
const ExternalSemanticEquivalenceKind = 'frontier.lang.jsTsProjectSemanticEquivalenceProof';
const ExternalSemanticEquivalenceClaimBoundary = 'exact-js-ts-project-source-output-and-gates';

function semanticEquivalenceExternalEvidence(id, input = {}) {
  const proof = input.externalSemanticEquivalenceProof ?? input.semanticEquivalenceProof;
  if (proof === undefined) return undefined;
  const expected = jsTsProjectSemanticEquivalenceExpectedBinding(id, input);
  const reasonCodes = semanticEquivalenceProofReasonCodes(proof, expected);
  const status = reasonCodes.length === 0 ? 'passed' : 'failed';
  return {
    id: `${id}_proof_semantic_equivalence_external`,
    kind: 'js-ts-project-merge-proof-evidence',
    level: ExternalSemanticEquivalenceLevel,
    status,
    scope: 'project',
    claimKind: 'external-semantic-equivalence',
    evidenceOnly: false,
    proofClaim: status === 'passed',
    autoMergeClaim: false,
    semanticEquivalenceClaim: status === 'passed',
    summary: status === 'passed'
      ? 'External semantic equivalence proof is source/output/gate-bound and passed.'
      : 'External semantic equivalence proof was supplied but did not validate against the project binding.',
    metadata: compactRecord({
      proofId: proof?.id,
      evidenceId: proof?.evidenceId,
      verifier: proof?.verifier,
      command: proof?.command,
      artifactHash: proof?.artifactHash,
      expected,
      reasonCodes,
      proofHash: proof?.proofHash,
      expectedProofHash: proof && typeof proof === 'object' ? jsTsProjectSemanticEquivalenceProofHash(proof) : undefined,
      proofClaim: status === 'passed',
      autoMergeClaim: false,
      semanticEquivalenceClaim: status === 'passed'
    })
  };
}

function jsTsProjectSemanticEquivalenceExpectedBinding(id, input = {}) {
  const sourceFileBindings = normalizeSourceFileBindings(input.fileResults ?? []);
  const sourceSetHash = hashSemanticValue({ kind: 'frontier.lang.jsTsProjectSemanticEquivalenceSourceSet.v1', sourceFileBindings: sourceFileBindings.map(sourceBinding) });
  const outputSetHash = hashSemanticValue({ kind: 'frontier.lang.jsTsProjectSemanticEquivalenceOutputSet.v1', sourceFileBindings: sourceFileBindings.map(outputBinding) });
  return compactRecord({
    schema: 'frontier.lang.jsTsProjectSemanticEquivalenceExpectedBinding.v1',
    projectId: String(id),
    language: firstLanguage(input),
    sourceFileBindings,
    sourceSetHash,
    outputSetHash,
    gates: {
      diagnostics: gateBinding(input.outputDiagnosticsGate, 'diagnostics'),
      declarations: gateBinding(input.outputDeclarationGate, 'declarations'),
      quality: gateBinding(input.outputQualityGate, 'quality')
    }
  });
}

function semanticEquivalenceProofReasonCodes(proof, expected) {
  if (!proof || typeof proof !== 'object' || Array.isArray(proof)) return ['semantic-equivalence-proof-structured-record-required'];
  const reasons = [];
  if (proof.schema !== ExternalSemanticEquivalenceSchema) reasons.push('semantic-equivalence-proof-schema-missing');
  if (proof.kind !== ExternalSemanticEquivalenceKind) reasons.push('semantic-equivalence-proof-kind-missing');
  if (!['passed', 'verified'].includes(proof.status)) reasons.push('semantic-equivalence-proof-status-not-passed');
  if (proof.projectId !== expected.projectId) reasons.push('semantic-equivalence-proof-project-id-mismatch');
  if (proof.language !== undefined && expected.language !== undefined && proof.language !== expected.language) reasons.push('semantic-equivalence-proof-language-mismatch');
  reasons.push(...sourceBindingReasonCodes(proof.sourceFileBindings, expected.sourceFileBindings));
  if (proof.sourceSetHash !== expected.sourceSetHash) reasons.push('semantic-equivalence-proof-source-set-hash-mismatch');
  if (proof.outputSetHash !== expected.outputSetHash) reasons.push('semantic-equivalence-proof-output-set-hash-mismatch');
  reasons.push(...gateReasonCodes('diagnostics', proof.gates?.diagnostics, expected.gates.diagnostics));
  reasons.push(...gateReasonCodes('declaration', proof.gates?.declarations, expected.gates.declarations));
  reasons.push(...gateReasonCodes('quality', proof.gates?.quality, expected.gates.quality));
  if (!proof.proofHash) reasons.push('semantic-equivalence-proof-proof-hash-missing');
  else if (proof.proofHash !== jsTsProjectSemanticEquivalenceProofHash(proof)) reasons.push('semantic-equivalence-proof-proof-hash-mismatch');
  if (proof.claimKind !== 'external-semantic-equivalence' || proof.claimBoundary !== ExternalSemanticEquivalenceClaimBoundary || proof.semanticEquivalenceClaim !== true) reasons.push('semantic-equivalence-proof-claim-boundary-mismatch');
  if (proof.autoMergeClaim !== false) reasons.push('semantic-equivalence-proof-auto-merge-claim-not-false');
  return uniqueStrings(reasons);
}

function sourceBindingReasonCodes(proofBindings, expectedBindings) {
  if (!Array.isArray(proofBindings) || proofBindings.length !== expectedBindings.length) return ['semantic-equivalence-proof-source-file-set-mismatch'];
  const expectedByPath = new Map(expectedBindings.map((binding) => [binding.sourcePath, binding]));
  const reasons = [];
  for (const binding of normalizeSourceFileBindings(proofBindings)) {
    const expected = expectedByPath.get(binding.sourcePath);
    if (!expected) reasons.push('semantic-equivalence-proof-source-path-mismatch');
    else for (const field of ['operation', 'baseHash', 'workerHash', 'headHash', 'outputHash', 'deletedOutput']) {
      if (binding[field] !== expected[field]) reasons.push(`semantic-equivalence-proof-${field.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}-mismatch`);
    }
  }
  return reasons;
}

function gateReasonCodes(label, proofGate, expectedGate) {
  if (!proofGate || !expectedGate) return [`semantic-equivalence-proof-${label}-gate-missing`];
  const reasons = [];
  if (proofGate.status !== 'passed' || expectedGate.status !== 'passed') reasons.push(`semantic-equivalence-proof-${label}-gate-status-not-passed`);
  if (proofGate.id !== expectedGate.id || proofGate.hash !== expectedGate.hash) reasons.push(`semantic-equivalence-proof-${label}-gate-hash-mismatch`);
  return reasons;
}

function jsTsProjectSemanticEquivalenceProofHash(proof = {}) {
  return hashSemanticValue({
    kind: 'frontier.lang.jsTsProjectSemanticEquivalenceProofHash.v1',
    schema: proof.schema,
    kindName: proof.kind,
    status: proof.status,
    verifier: proof.verifier,
    command: proof.command,
    artifactHash: proof.artifactHash,
    projectId: proof.projectId,
    language: proof.language,
    sourceFileBindings: normalizeSourceFileBindings(proof.sourceFileBindings ?? []),
    sourceSetHash: proof.sourceSetHash,
    outputSetHash: proof.outputSetHash,
    gates: normalizeProofGates(proof.gates),
    claimKind: proof.claimKind,
    claimBoundary: proof.claimBoundary,
    semanticEquivalenceClaim: proof.semanticEquivalenceClaim,
    autoMergeClaim: proof.autoMergeClaim
  });
}

function normalizeSourceFileBindings(bindings = []) {
  return bindings.map((file) => compactRecord({
    sourcePath: file.sourcePath,
    operation: file.operation,
    baseHash: file.baseHash,
    workerHash: file.workerHash,
    headHash: file.headHash,
    outputHash: file.outputHash,
    deletedOutput: file.deletedOutput === true || (file.outputHash === undefined && file.status === 'merged') || undefined
  })).sort((a, b) => String(a.sourcePath).localeCompare(String(b.sourcePath)));
}

function gateBinding(gate, kind) {
  if (!gate) return undefined;
  return compactRecord({
    id: gate.id,
    status: gate.status,
    hash: gate.hash ?? hashSemanticValue({ kind: `frontier.lang.jsTsProjectSemanticEquivalenceGateHash.${kind}.v1`, id: gate.id, status: gate.status, summary: gate.summary, gates: gate.gates }),
    gateIds: Array.isArray(gate.gates) ? gate.gates.map((entry) => entry.id).filter(Boolean) : undefined
  });
}

function normalizeProofGates(gates = {}) {
  return compactRecord({
    diagnostics: compactGate(gates.diagnostics),
    declarations: compactGate(gates.declarations),
    quality: compactGate(gates.quality)
  });
}

function compactGate(gate) { return gate ? compactRecord({ id: gate.id, status: gate.status, hash: gate.hash, gateIds: gate.gateIds }) : undefined; }
function sourceBinding(binding) { return compactRecord({ sourcePath: binding.sourcePath, operation: binding.operation, baseHash: binding.baseHash, workerHash: binding.workerHash, headHash: binding.headHash }); }
function outputBinding(binding) { return compactRecord({ sourcePath: binding.sourcePath, operation: binding.operation, outputHash: binding.outputHash, deletedOutput: binding.deletedOutput }); }
function firstLanguage(input) { return input.language ?? (input.fileResults ?? []).find((file) => file.language)?.language ?? (input.files ?? []).find((file) => file.language)?.language; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  ExternalSemanticEquivalenceClaimBoundary,
  ExternalSemanticEquivalenceKind,
  ExternalSemanticEquivalenceLevel,
  ExternalSemanticEquivalenceSchema,
  jsTsProjectSemanticEquivalenceExpectedBinding,
  jsTsProjectSemanticEquivalenceProofHash,
  semanticEquivalenceExternalEvidence,
  semanticEquivalenceProofReasonCodes
};
