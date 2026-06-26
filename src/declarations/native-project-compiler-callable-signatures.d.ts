export interface NativeProjectSymbolGraphCompilerCallableSignatureEquivalenceProof {
  readonly kind?: 'typescript-checker-public-api-call-signature-shape-equivalence' | 'typescript-checker-public-api-construct-signature-shape-equivalence' | 'typescript-checker-public-api-callable-and-construct-signature-shape-equivalence' | string;
  readonly status?: 'passed' | 'failed' | string;
  readonly proofLevel?: string;
  readonly checkerInvariant?: string;
  readonly requiredSignals?: readonly string[];
  readonly missingSignals?: readonly string[];
  readonly reasonCodes?: readonly string[];
  readonly callSignatureSetHash?: string;
  readonly constructSignatureSetHash?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceBoundPublicApi?: boolean;
  readonly callSignatureCount?: number;
  readonly constructSignatureCount?: number;
  readonly evidenceIds?: readonly string[];
  readonly autoMergeClaim?: false;
  readonly semanticEquivalenceClaim?: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectSymbolGraphCompilerTypeEquivalenceProof {
    readonly callSignatureSetHash?: string;
    readonly constructSignatureSetHash?: string;
  }
  interface NativeProjectSymbolGraphCompilerTypeRecord {
    readonly typeEquivalenceCallSignatureSetHash?: string;
    readonly typeEquivalenceConstructSignatureSetHash?: string;
    readonly callableSignatureEquivalenceProof?: NativeProjectSymbolGraphCompilerCallableSignatureEquivalenceProof;
  }
}
