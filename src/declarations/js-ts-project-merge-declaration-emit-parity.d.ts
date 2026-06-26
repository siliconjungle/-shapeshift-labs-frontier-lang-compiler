export type JsTsProjectMergeDeclarationEmitParityProofStatus = 'passed' | 'failed' | string;
export type JsTsProjectMergeDeclarationEmitParityProofLevel = 'typescript-checker-public-api-declaration-output-boundary' | string;

export interface JsTsProjectMergeDeclarationBoundaryFile {
  readonly sourcePath: string;
  readonly sourceHash: string;
  readonly bytes?: number;
  readonly source?: string;
}

export interface JsTsProjectMergeDeclarationEmitParityProof {
  readonly kind: 'typescript-checker-public-api-declaration-emit-parity';
  readonly version: 1;
  readonly schema: 'frontier.lang.typescriptDeclarationEmitParityProof.v1';
  readonly id: string;
  readonly hash: string;
  readonly status: JsTsProjectMergeDeclarationEmitParityProofStatus;
  readonly proofLevel: JsTsProjectMergeDeclarationEmitParityProofLevel;
  readonly workerDeclarationBoundaryHash?: string;
  readonly headDeclarationBoundaryHash?: string;
  readonly outputDeclarationBoundaryHash?: string;
  readonly declarationFileCount: number;
  readonly declarationFiles: readonly JsTsProjectMergeDeclarationBoundaryFile[];
  readonly compilerOptionsHash?: string;
  readonly diagnosticsHash?: string;
  readonly missingSignals: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export declare function createJsTsProjectMergeDeclarationEmitParityProof(
  input?: Record<string, unknown>,
  files?: readonly { readonly sourcePath?: string; readonly language?: string; readonly baseSourceText?: string; readonly workerSourceText?: string; readonly headSourceText?: string; readonly workerDeleted?: boolean; readonly headDeleted?: boolean }[],
  outputFiles?: readonly { readonly sourcePath?: string; readonly language?: string; readonly sourceText?: string; readonly sourceHash?: string }[],
  id?: string
): JsTsProjectMergeDeclarationEmitParityProof | undefined;
