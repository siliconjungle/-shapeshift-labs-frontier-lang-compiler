export type JsTsProjectSemanticEquivalenceProofClaimBoundary = 'exact-js-ts-project-source-output-and-gates';
export type JsTsProjectSemanticEquivalenceProofLevel = 'semantic-equivalence-external';

export interface JsTsProjectSemanticEquivalenceProofFileBinding {
  readonly sourcePath: string;
  readonly operation?: string;
  readonly baseHash?: string;
  readonly workerHash?: string;
  readonly headHash?: string;
  readonly outputHash?: string;
  readonly deletedOutput?: boolean;
}

export interface JsTsProjectSemanticEquivalenceProofGateBinding {
  readonly id: string;
  readonly status: 'passed' | string;
  readonly hash: string;
  readonly gateIds?: readonly string[];
}

export interface JsTsProjectSemanticEquivalenceProof {
  readonly id?: string;
  readonly kind?: 'frontier.lang.jsTsProjectSemanticEquivalenceProof' | string;
  readonly schema?: 'frontier.lang.jsTsProjectSemanticEquivalenceProof.v1' | string;
  readonly status: 'passed' | 'verified' | 'failed' | string;
  readonly evidenceId?: string;
  readonly verifier?: { readonly name?: string; readonly version?: string; readonly [key: string]: unknown };
  readonly command?: string;
  readonly artifactHash?: string;
  readonly projectId: string;
  readonly language?: string;
  readonly sourceFileBindings: readonly JsTsProjectSemanticEquivalenceProofFileBinding[];
  readonly sourceSetHash: string;
  readonly outputSetHash: string;
  readonly gates: {
    readonly diagnostics: JsTsProjectSemanticEquivalenceProofGateBinding;
    readonly declarations: JsTsProjectSemanticEquivalenceProofGateBinding;
    readonly quality: JsTsProjectSemanticEquivalenceProofGateBinding;
  };
  readonly proofHash: string;
  readonly claimKind: 'external-semantic-equivalence';
  readonly claimBoundary: JsTsProjectSemanticEquivalenceProofClaimBoundary;
  readonly semanticEquivalenceClaim: true;
  readonly autoMergeClaim: false;
}
