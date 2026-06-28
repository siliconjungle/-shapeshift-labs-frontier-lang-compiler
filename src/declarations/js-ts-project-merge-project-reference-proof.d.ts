import type { JsTsProjectMergeDiagnostic } from './js-ts-project-merge-diagnostics.js';
import type { JsTsProjectReferencesInput } from './js-ts-project-merge-tsconfig.js';

export type JsTsProjectReferenceCompositeProofStatus = 'passed' | 'failed' | string;
export type JsTsProjectReferenceCompositeProofLevel = 'typescript-project-reference-composite-source-declaration-boundary' | string;

export interface JsTsProjectReferenceBoundaryFileInput {
  readonly sourcePath?: string;
  readonly path?: string;
  readonly sourceText?: string;
  readonly text?: string;
  readonly sourceHash?: string;
  readonly hash?: string;
  readonly bytes?: number;
}

export type JsTsProjectReferenceBoundaryFilesInput =
  | readonly JsTsProjectReferenceBoundaryFileInput[]
  | Readonly<Record<string, string | JsTsProjectReferenceBoundaryFileInput>>
  | ReadonlyMap<string, string | JsTsProjectReferenceBoundaryFileInput>;

export interface JsTsProjectReferencedProjectInput {
  readonly path: string;
  readonly originalPath?: string;
  readonly tsconfigPath?: string;
  readonly composite?: boolean;
  readonly declaration?: boolean;
  readonly compilerOptions?: Record<string, unknown>;
  readonly tsconfig?: { readonly compilerOptions?: Record<string, unknown> };
  readonly sourceFiles?: JsTsProjectReferenceBoundaryFilesInput;
  readonly files?: JsTsProjectReferenceBoundaryFilesInput;
  readonly projectFiles?: JsTsProjectReferenceBoundaryFilesInput;
  readonly declarationFiles?: JsTsProjectReferenceBoundaryFilesInput;
  readonly declarations?: JsTsProjectReferenceBoundaryFilesInput;
  readonly outputDeclarations?: JsTsProjectReferenceBoundaryFilesInput;
  readonly diagnostics?: readonly JsTsProjectMergeDiagnostic[] | JsTsProjectMergeDiagnostic;
}

export interface JsTsProjectReferenceBoundaryFile {
  readonly sourcePath: string;
  readonly sourceHash: string;
  readonly suppliedSourceHash?: string;
  readonly hashMismatch?: boolean;
  readonly source?: string;
  readonly bytes?: number;
}

export interface JsTsProjectReferenceCompositeProject {
  readonly path: string;
  readonly originalPath?: string;
  readonly tsconfigPath?: string;
  readonly composite?: boolean;
  readonly declaration?: boolean;
  readonly compilerOptions?: Record<string, unknown>;
  readonly compilerOptionsHash?: string;
  readonly sourceFiles: readonly JsTsProjectReferenceBoundaryFile[];
  readonly declarationFiles: readonly JsTsProjectReferenceBoundaryFile[];
  readonly sourceBoundaryHash?: string;
  readonly declarationBoundaryHash?: string;
  readonly diagnostics?: readonly JsTsProjectMergeDiagnostic[];
}

export interface JsTsProjectReferenceCompositeProof {
  readonly kind: 'typescript-project-reference-composite-proof';
  readonly version: 1;
  readonly schema: 'frontier.lang.typescriptProjectReferenceCompositeProof.v1';
  readonly id: string;
  readonly hash: string;
  readonly status: JsTsProjectReferenceCompositeProofStatus;
  readonly proofLevel: JsTsProjectReferenceCompositeProofLevel;
  readonly projectReferences: JsTsProjectReferencesInput;
  readonly projectReferenceHash: string;
  readonly referencedProjects: readonly JsTsProjectReferenceCompositeProject[];
  readonly referencedProjectBoundaryHash: string;
  readonly sourceFileCount: number;
  readonly declarationFileCount: number;
  readonly diagnostics?: readonly JsTsProjectMergeDiagnostic[];
  readonly suppressedDiagnosticCodes: readonly string[];
  readonly missingSignals: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly buildModeEquivalenceClaim: false;
}

export interface JsTsProjectReferenceCompositeProofInput {
  readonly id?: string;
  readonly projectReferences?: JsTsProjectReferencesInput;
  readonly typescriptProjectReferences?: JsTsProjectReferencesInput;
  readonly tsconfigProjectReferences?: JsTsProjectReferencesInput;
  readonly tsconfig?: { readonly references?: JsTsProjectReferencesInput };
  readonly referencedProjects?: readonly JsTsProjectReferencedProjectInput[] | Readonly<Record<string, JsTsProjectReferencedProjectInput>>;
  readonly typescriptReferencedProjects?: readonly JsTsProjectReferencedProjectInput[] | Readonly<Record<string, JsTsProjectReferencedProjectInput>>;
  readonly projectReferenceProjects?: readonly JsTsProjectReferencedProjectInput[] | Readonly<Record<string, JsTsProjectReferencedProjectInput>>;
  readonly projectReferenceCompositeProjects?: readonly JsTsProjectReferencedProjectInput[] | Readonly<Record<string, JsTsProjectReferencedProjectInput>>;
  readonly projectReferenceCompositeProof?: JsTsProjectReferenceCompositeProof;
  readonly typescriptProjectReferenceCompositeProof?: JsTsProjectReferenceCompositeProof;
  readonly projectReferenceProof?: JsTsProjectReferenceCompositeProof;
  readonly typescriptProjectReferenceProof?: JsTsProjectReferenceCompositeProof;
  readonly includeProjectReferenceCompositeProof?: boolean;
  readonly requireProjectReferenceCompositeProof?: boolean;
}

export declare function createJsTsProjectReferenceCompositeProof(
  input?: JsTsProjectReferenceCompositeProofInput,
  outputFiles?: readonly unknown[],
  id?: string
): JsTsProjectReferenceCompositeProof | undefined;
