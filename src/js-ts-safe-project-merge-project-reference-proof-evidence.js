import { compactRecord } from './js-ts-safe-merge-context.js';

function projectReferenceCompositeEvidence(id, proof, level) {
  if (!proof) return undefined;
  const status = proof.status === 'passed' ? 'passed' : 'failed';
  return {
    id: `${id}_proof_project_reference_composite`,
    kind: 'js-ts-project-merge-proof-evidence',
    level,
    status,
    scope: 'typescript-project-references',
    claimKind: 'evidence',
    evidenceOnly: true,
    proofClaim: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    summary: status === 'passed'
      ? `Project-reference composite proof passed for ${proof.projectReferences?.length ?? 0} referenced project(s).`
      : `Project-reference composite proof failed: ${(proof.reasonCodes ?? []).join(', ') || 'unknown'}.`,
    metadata: compactRecord({
      proofId: proof.id,
      proofHash: proof.hash,
      projectReferences: proof.projectReferences?.length,
      sourceFileCount: proof.sourceFileCount,
      declarationFileCount: proof.declarationFileCount,
      missingSignal: status === 'failed' ? (proof.reasonCodes?.[0] ?? 'typescript-project-reference-composite-proof-failed') : undefined,
      reasonCodes: proof.reasonCodes,
      buildModeEquivalenceClaim: false,
      proofClaim: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
}

export { projectReferenceCompositeEvidence };
