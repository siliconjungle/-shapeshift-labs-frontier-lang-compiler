import type { EvidenceRecord, FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { JsTsSafeMergeConflict } from './js-ts-safe-merge.js';
import type { JsTsProjectReferenceCompositeProof } from './js-ts-project-merge-project-reference-proof.js';
import type { JsTsProjectCompilerMetadata } from './js-ts-project-merge-tsconfig.js';

export type JsTsProjectMergeDiagnosticsGateStatus = 'passed' | 'blocked' | string;
export type JsTsProjectMergeDiagnosticSeverity = 'error' | 'warning' | 'suggestion' | 'message' | string;
export type JsTsProjectMergeDiagnosticPhase = 'syntax' | 'semantic' | string;

export interface JsTsProjectMergeDiagnostic {
  readonly id?: string;
  readonly source?: string;
  readonly code: string;
  readonly severity: JsTsProjectMergeDiagnosticSeverity;
  readonly message: string;
  readonly sourcePath?: string;
  readonly phase?: JsTsProjectMergeDiagnosticPhase;
  readonly syntax?: boolean;
  readonly start?: number;
  readonly end?: number;
  readonly line?: number;
  readonly column?: number;
}

export interface JsTsProjectMergeOutputFileForDiagnostics {
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourceText?: string;
  readonly sourceHash?: string;
  readonly operation?: string;
}

export interface JsTsProjectMergeDiagnosticsGateInput {
  readonly id?: string;
  readonly projectRoot?: string;
  readonly typescript?: unknown;
  readonly ts?: unknown;
  readonly typescriptModule?: unknown;
  readonly compilerOptions?: Record<string, unknown>;
  readonly typescriptCompilerOptions?: Record<string, unknown>;
  readonly diagnosticOptions?: {
    readonly syntactic?: boolean;
    readonly semantic?: boolean;
  };
  readonly typescriptDiagnosticOptions?: {
    readonly syntactic?: boolean;
    readonly semantic?: boolean;
  };
  readonly requireOutputDiagnostics?: boolean;
  readonly requireOutputSyntaxDiagnostics?: boolean;
  readonly requireOutputSyntaxGate?: boolean;
  readonly requireMergedOutputSyntaxDiagnostics?: boolean;
  readonly requireSyntaxGate?: boolean;
  readonly outputDiagnostics?: readonly JsTsProjectMergeDiagnostic[] | JsTsProjectMergeDiagnostic;
  readonly projectReferenceCompositeProof?: JsTsProjectReferenceCompositeProof;
  readonly typescriptProjectReferenceCompositeProof?: JsTsProjectReferenceCompositeProof;
  readonly projectReferenceProof?: JsTsProjectReferenceCompositeProof;
  readonly typescriptProjectReferenceProof?: JsTsProjectReferenceCompositeProof;
  readonly outputSyntaxDiagnostics?: readonly JsTsProjectMergeDiagnostic[] | JsTsProjectMergeDiagnostic;
  readonly mergedOutputSyntaxDiagnostics?: readonly JsTsProjectMergeDiagnostic[] | JsTsProjectMergeDiagnostic;
  readonly syntaxDiagnostics?: {
    readonly output?: readonly JsTsProjectMergeDiagnostic[] | JsTsProjectMergeDiagnostic;
    readonly merged?: readonly JsTsProjectMergeDiagnostic[] | JsTsProjectMergeDiagnostic;
  };
}

export interface JsTsProjectMergeDiagnosticsGate {
  readonly kind: 'frontier.lang.jsTsProjectMergeDiagnosticsGate';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsProjectMergeDiagnosticsGate.v1';
  readonly id: string;
  readonly hash: string;
  readonly status: JsTsProjectMergeDiagnosticsGateStatus;
  readonly sourcePaths: readonly string[];
  readonly diagnostics: readonly JsTsProjectMergeDiagnostic[];
  readonly conflicts: readonly JsTsSafeMergeConflict[];
  readonly admission: {
    readonly status: 'auto-merge-candidate' | 'blocked' | string;
    readonly action: 'accept-diagnostics' | 'human-review' | string;
    readonly reviewRequired: boolean;
    readonly autoApplyCandidate: boolean;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reasonCodes: readonly string[];
  };
  readonly summary: {
    readonly diagnostics: number;
    readonly conflicts: number;
    readonly errors: number;
    readonly warnings: number;
    readonly syntaxErrors: number;
    readonly bySeverity: Readonly<Record<string, number>>;
    readonly bySource: Readonly<Record<string, number>>;
    readonly byPhase: Readonly<Record<string, number>>;
  };
  readonly metadata?: JsTsProjectCompilerMetadata & {
    readonly projectReferenceCompositeProof?: Record<string, unknown>;
  };
  readonly evidence: readonly EvidenceRecord[];
}

export declare function createJsTsProjectMergeDiagnosticsGate(
  input?: JsTsProjectMergeDiagnosticsGateInput,
  outputFiles?: readonly JsTsProjectMergeOutputFileForDiagnostics[],
  id?: string
): JsTsProjectMergeDiagnosticsGate | undefined;
