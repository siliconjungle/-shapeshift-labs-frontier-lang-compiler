export type JsTsProjectJsxHookDependencySourceStage = 'base' | 'worker' | 'head' | 'output' | string;

export interface JsTsProjectJsxHookDependencySourceProof {
  readonly id?: string;
  readonly kind?: 'frontier.lang.jsxHookDependencySourceProof' | string;
  readonly schema?: 'frontier.lang.jsxHookDependencySourceProof.v1' | string;
  readonly version?: 1;
  readonly status: 'passed' | 'verified' | 'failed' | 'missing' | 'stale' | string;
  readonly evidenceId?: string;
  readonly evidenceIds?: readonly string[];
  readonly sourcePath: string;
  readonly identityKey?: string;
  readonly baseSourceHash: string;
  readonly workerSourceHash: string;
  readonly headSourceHash: string;
  readonly outputSourceHash: string;
  readonly publicOwnerName?: string;
  readonly tagName?: string;
  readonly tagKey?: string;
  readonly hookName?: string;
  readonly hookOrdinal?: number;
  readonly baseDependencyArrayHash?: string;
  readonly workerDependencyArrayHash?: string;
  readonly headDependencyArrayHash?: string;
  readonly outputDependencyArrayHash?: string;
  readonly outputDependencySignatureHash?: string;
  readonly outputDependencyTexts?: readonly string[];
  readonly workerAddedDependencyTexts?: readonly string[];
  readonly headAddedDependencyTexts?: readonly string[];
  readonly hookDependencySourcePreservationHash: string;
  readonly proofHash?: string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
  readonly renderEquivalenceClaim: false;
  readonly hookDependencySourcePreservationClaim: true;
  readonly claimScope: 'static-hook-dependency-array-source-preservation-only';
}
