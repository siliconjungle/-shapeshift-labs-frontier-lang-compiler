import type { EvidenceRecord } from '@shapeshift-labs/frontier-lang-kernel';
import type { JsTsSafeMergeConflict } from './js-ts-safe-merge.js';
import type { JsTsProjectMergeDiagnostic } from './js-ts-project-merge-diagnostics.js';

export type JsTsProjectMergeDeclarationGateStatus = 'passed' | 'blocked' | 'skipped' | string;

export interface JsTsProjectMergeDeclarationFile {
  readonly sourcePath: string;
  readonly sourceText: string;
  readonly sourceHash: string;
  readonly source?: string;
  readonly bytes?: number;
}

export type JsTsProjectMergeDeclarationFiles =
  | Readonly<Record<string, string>>
  | ReadonlyMap<string, string>
  | readonly { readonly sourcePath?: string; readonly path?: string; readonly sourceText?: string; readonly text?: string; readonly source?: string }[];

export interface JsTsProjectMergeDeclarationGateInput {
  readonly includeDeclarationOutput?: boolean;
  readonly requireDeclarationOutput?: boolean;
  readonly outputDeclarations?: JsTsProjectMergeDeclarationFiles;
  readonly outputDeclarationFiles?: JsTsProjectMergeDeclarationFiles;
  readonly declarationOutDir?: string;
  readonly declarationCompilerOptions?: Record<string, unknown>;
  readonly typescriptDeclarationCompilerOptions?: Record<string, unknown>;
}

export interface JsTsProjectMergeDeclarationGate {
  readonly kind: 'frontier.lang.jsTsProjectMergeDeclarationGate';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsProjectMergeDeclarationGate.v1';
  readonly id: string;
  readonly hash: string;
  readonly status: JsTsProjectMergeDeclarationGateStatus;
  readonly sourcePaths: readonly string[];
  readonly declarationFiles: readonly JsTsProjectMergeDeclarationFile[];
  readonly diagnostics: readonly JsTsProjectMergeDiagnostic[];
  readonly conflicts: readonly JsTsSafeMergeConflict[];
  readonly admission: {
    readonly status: 'auto-merge-candidate' | 'blocked' | 'skipped' | string;
    readonly action: 'accept-declarations' | 'human-review' | 'skip-declarations' | string;
    readonly reviewRequired: boolean;
    readonly autoApplyCandidate: boolean;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reasonCodes: readonly string[];
  };
  readonly summary: {
    readonly declarationFiles: number;
    readonly declarationBytes: number;
    readonly diagnostics: number;
    readonly conflicts: number;
    readonly errors: number;
    readonly warnings: number;
  };
  readonly evidence: readonly EvidenceRecord[];
}

export declare function createJsTsProjectMergeDeclarationGate(
  input?: JsTsProjectMergeDeclarationGateInput & Record<string, unknown>,
  outputFiles?: readonly { readonly sourcePath?: string; readonly sourceText?: string; readonly sourceHash?: string }[],
  id?: string
): JsTsProjectMergeDeclarationGate | undefined;
