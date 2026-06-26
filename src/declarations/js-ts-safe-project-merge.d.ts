import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { JsTsSafeMergeAdmission, JsTsSafeMergeConflict, JsTsSafeMergeResult, JsTsSafeMergeSemanticArtifacts, JsTsSafeMergeSummary } from './js-ts-safe-merge.js';
import type { JsTsSafeMemberMergePolicy, JsTsSafeMemberMergePolicyRegion } from './js-ts-safe-member-merge.js';
import type { NativeSourceImportResult } from './import-adapter-core.js';
import type { NativeProjectImportResult, NativeProjectSymbolGraphSummary } from './native-project.js';
import type { NativeProjectModuleResolutionOptions } from './native-project-module-resolution.js';
import type { JsTsProjectMergeDeclarationEmitParityProof as DeclEmitParityProof } from './js-ts-project-merge-declaration-emit-parity.js';
import type { JsTsProjectMergeDeclarationFiles as DeclFiles, JsTsProjectMergeDeclarationGate as DeclGate } from './js-ts-project-merge-declarations.js';
import type { JsTsProjectMergeDiagnostic as Diag, JsTsProjectMergeDiagnosticsGate } from './js-ts-project-merge-diagnostics.js';
import type { JsTsProjectCompilerOptionMetadata, JsTsProjectCompilerOptionSourceMetadata, JsTsProjectReferenceMetadata, JsTsProjectReferencesInput, JsTsProjectTsconfigInput } from './js-ts-project-merge-tsconfig.js';
import type { JsTsProjectMergeQualityGate as QualityGate, JsTsProjectMergeQualityGateInput as QualityGateInput } from './js-ts-project-merge-quality-gates.js';
import type { JsTsProjectMergeProofEvidence, JsTsProjectMergeProofEvidenceStatus, JsTsProjectMergeProofLevel } from './js-ts-project-merge-proof-levels.js';
import type { JsTsProjectSafeMergeAdmissionRoute, JsTsProjectSafeMergeAdmissionRouteSummary } from './js-ts-project-merge-admission-routes.js';
import type { JsTsProjectSafeMergeConfidenceSummary, JsTsProjectSafeMergeMissingEvidenceTelemetry } from './js-ts-project-merge-confidence.js';
import type { JsTsProjectCommonJsRuntimeInteropProof } from './js-ts-project-merge-commonjs-interop.js';
import type { JsTsProjectGlobalAugmentationCompatibilityProof } from './js-ts-project-merge-global-augmentation.js'; import type { JsTsProjectJsxRenderReturnBranchProof } from './js-ts-project-merge-jsx-render-branch.js'; import type { JsTsProjectSemanticEquivalenceProof } from './js-ts-project-merge-semantic-equivalence-proof.js';
import type { ParserTriviaEvidenceInput } from './source-preservation.js';

export type { JsTsProjectMergeQualityGate, JsTsProjectMergeQualityGateDecision, JsTsProjectMergeQualityGateEvidence, JsTsProjectMergeQualityGateInput, JsTsProjectMergeQualityGateMissingEvidence, JsTsProjectMergeQualityGateRecord } from './js-ts-project-merge-quality-gates.js';
export type { JsTsProjectMergeProofEvidence, JsTsProjectMergeProofEvidenceRecord, JsTsProjectMergeProofEvidenceRecordStatus, JsTsProjectMergeProofEvidenceStatus, JsTsProjectMergeProofEvidenceSummary, JsTsProjectMergeProofLevel, JsTsProjectMergeProofMissingEvidence } from './js-ts-project-merge-proof-levels.js';
export type { JsTsProjectSafeMergeAdmissionRoute, JsTsProjectSafeMergeAdmissionRouteSummary } from './js-ts-project-merge-admission-routes.js';
export type { JsTsProjectSafeMergeConfidenceSummary, JsTsProjectSafeMergeMissingEvidence, JsTsProjectSafeMergeMissingEvidenceRoute, JsTsProjectSafeMergeMissingEvidenceTelemetry, JsTsProjectSafeMergeRecommendedAction } from './js-ts-project-merge-confidence.js';
export type { JsTsProjectCommonJsRuntimeInteropProof } from './js-ts-project-merge-commonjs-interop.js';
export type { JsTsProjectGlobalAugmentationCompatibilityProof } from './js-ts-project-merge-global-augmentation.js'; export type { JsTsProjectJsxRenderReturnBranchArmOrigin, JsTsProjectJsxRenderReturnBranchControlKind, JsTsProjectJsxRenderReturnBranchProof } from './js-ts-project-merge-jsx-render-branch.js';

export type JsTsProjectSafeMergeStatus = 'merged' | 'blocked';
export type JsTsProjectSafeMergeFileStatus = 'merged' | 'blocked';
export type JsTsProjectSafeMergeFileOperation = 'merged-source' | 'merged-source-and-members' | 'worker-added' | 'head-only' | 'both-added-identical' | 'worker-deleted' | 'head-deleted-worker-unchanged' | 'blocked-merge' | 'blocked-file-presence' | string;

export interface JsTsProjectSafeMergeEvidenceRecord { readonly id: string; readonly kind: string; readonly status: 'passed' | 'failed' | 'skipped' | 'unknown' | string; readonly level?: string; readonly scope?: string; readonly summary?: string; readonly metadata?: Record<string, unknown>; }

export interface JsTsProjectSafeMergeFileInput {
  readonly sourcePath?: string;
  readonly path?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly baseSourceText?: string;
  readonly baseText?: string;
  readonly workerSourceText?: string;
  readonly workerText?: string;
  readonly headSourceText?: string;
  readonly headText?: string;
  readonly workerDeleted?: boolean;
  readonly headDeleted?: boolean;
  readonly policy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly mergePolicy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly parserTriviaEvidence?: ParserTriviaEvidenceInput;
  readonly baseParserTriviaEvidence?: ParserTriviaEvidenceInput;
  readonly workerParserTriviaEvidence?: ParserTriviaEvidenceInput;
  readonly headParserTriviaEvidence?: ParserTriviaEvidenceInput;
  readonly outputParserTriviaEvidence?: ParserTriviaEvidenceInput;
}

export type JsTsProjectSafeMergeFileMap =
  | Readonly<Record<string,string | { readonly sourceText?: string; readonly text?: string; readonly parserTriviaEvidence?: ParserTriviaEvidenceInput }>>
  | ReadonlyMap<string, string | { readonly sourceText?: string; readonly text?: string; readonly parserTriviaEvidence?: ParserTriviaEvidenceInput }>
  | readonly { readonly sourcePath?: string; readonly path?: string; readonly sourceText?: string; readonly text?: string; readonly parserTriviaEvidence?: ParserTriviaEvidenceInput }[];

export type JsTsProjectSafeMergeOutputProjectImports =
  | readonly NativeSourceImportResult[]
  | ReadonlyMap<string, NativeSourceImportResult>
  | Readonly<Record<string,NativeSourceImportResult>>;

export type JsTsProjectGraphStageName = 'base' | 'worker' | 'head' | 'output' | string;

export type JsTsProjectGraphLimitKind = 'source-files' | 'source-bytes' | 'source-spans' | 'import-edges' | 'export-edges' | 'scope-bindings' | 'scope-references' | 'jsx-elements' | 'jsx-props' | 'serialized-bytes' | string;

export interface JsTsProjectGraphLimits {
  readonly maxFiles?: number;
  readonly maxSourceBytes?: number;
  readonly maxSourceSpans?: number;
  readonly maxImportEdges?: number; readonly maxExportEdges?: number;
  readonly maxScopeBindings?: number; readonly maxScopeReferences?: number;
  readonly maxJsxElements?: number; readonly maxJsxProps?: number;
  readonly maxSerializedBytes?: number;
}

export type JsTsProjectSafeMergeProjectGraphImportsByStage = Readonly<{
  base?: JsTsProjectSafeMergeOutputProjectImports;
  worker?: JsTsProjectSafeMergeOutputProjectImports;
  head?: JsTsProjectSafeMergeOutputProjectImports;
  output?: JsTsProjectSafeMergeOutputProjectImports;
} & Record<string, JsTsProjectSafeMergeOutputProjectImports | undefined>>;

export interface JsTsProjectSafeMergeInput {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly projectRoot?: string;
  readonly files?: readonly JsTsProjectSafeMergeFileInput[];
  readonly baseFiles?: JsTsProjectSafeMergeFileMap;
  readonly workerFiles?: JsTsProjectSafeMergeFileMap;
  readonly headFiles?: JsTsProjectSafeMergeFileMap;
  readonly allowFileAdditions?: boolean;
  readonly allowFileDeletes?: boolean;
  readonly includeOutputProjectSymbolGraph?: boolean;
  readonly includeProjectGraphDelta?: boolean;
  readonly allowProjectSymbolRenames?: boolean; readonly allowCrossFileSymbolRenames?: boolean; readonly allowProjectSymbolMoves?: boolean; readonly allowSymbolMoves?: boolean; readonly allowProjectSplitMerges?: boolean; readonly allowSplitMerges?: boolean; readonly allowProjectModuleSplits?: boolean; readonly allowModuleSplits?: boolean; readonly allowProjectModuleMerges?: boolean; readonly allowModuleMerges?: boolean; readonly allowProjectClassSplits?: boolean; readonly allowClassSplits?: boolean; readonly allowProjectClassMerges?: boolean; readonly allowClassMerges?: boolean;
  readonly requireTypeScriptRefactorEvidence?: boolean; readonly requireTypeScriptLanguageServiceRefactorEvidence?: boolean; readonly requireCompilerRefactorEvidence?: boolean;
  readonly projectGraphLimits?: JsTsProjectGraphLimits;
  readonly outputProjectImports?: JsTsProjectSafeMergeOutputProjectImports;
  readonly baseProjectImports?: JsTsProjectSafeMergeOutputProjectImports;
  readonly workerProjectImports?: JsTsProjectSafeMergeOutputProjectImports;
  readonly headProjectImports?: JsTsProjectSafeMergeOutputProjectImports;
  readonly projectGraphImports?: JsTsProjectSafeMergeProjectGraphImportsByStage;
  readonly commonJsRuntimeInteropProof?: JsTsProjectCommonJsRuntimeInteropProof;
  readonly commonJsRuntimeInteropProofs?: readonly JsTsProjectCommonJsRuntimeInteropProof[];
  readonly globalAugmentationCompatibilityProof?: JsTsProjectGlobalAugmentationCompatibilityProof;
  readonly globalAugmentationCompatibilityProofs?: readonly JsTsProjectGlobalAugmentationCompatibilityProof[]; readonly jsxRenderReturnBranchProof?: JsTsProjectJsxRenderReturnBranchProof; readonly jsxRenderReturnBranchProofs?: readonly JsTsProjectJsxRenderReturnBranchProof[]; readonly externalSemanticEquivalenceProof?: JsTsProjectSemanticEquivalenceProof; readonly semanticEquivalenceProof?: JsTsProjectSemanticEquivalenceProof;
  readonly moduleResolution?: NativeProjectModuleResolutionOptions;
  readonly tsconfig?: JsTsProjectTsconfigInput | NativeProjectModuleResolutionOptions;
  readonly projectReferences?: JsTsProjectReferencesInput;
  readonly typescriptProjectReferences?: JsTsProjectReferencesInput;
  readonly tsconfigProjectReferences?: JsTsProjectReferencesInput;
  readonly requireOutputDiagnostics?: boolean;
  readonly outputDiagnostics?: readonly Diag[] | Diag;
  readonly includeDeclarationOutput?: boolean;
  readonly requireDeclarationOutput?: boolean;
  readonly requirePublicApiDeclarationEmitParity?: boolean;
  readonly outputDeclarations?: DeclFiles;
  readonly outputDeclarationFiles?: DeclFiles;
  readonly declarationEmitParityProof?: DeclEmitParityProof;
  readonly outputDeclarationEmitParityProof?: DeclEmitParityProof;
  readonly declarationOutDir?: string;
  readonly declarationCompilerOptions?: Record<string, unknown>;
  readonly typescriptDeclarationCompilerOptions?: Record<string, unknown>;
  readonly typescript?: unknown;
  readonly ts?: unknown;
  readonly typescriptModule?: unknown;
  readonly compilerOptions?: Record<string, unknown>;
  readonly typescriptCompilerOptions?: Record<string, unknown>;
  readonly diagnosticOptions?: { readonly options?: boolean; readonly syntactic?: boolean; readonly semantic?: boolean; };
  readonly typescriptDiagnosticOptions?: { readonly options?: boolean; readonly syntactic?: boolean; readonly semantic?: boolean; };
  readonly workerChangeSetId?: string;
  readonly headChangeSetId?: string;
  readonly policy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly mergePolicy?: JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[];
  readonly policyByPath?: Readonly<Record<string,JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[]>>;
  readonly mergePolicyByPath?: Readonly<Record<string,JsTsSafeMemberMergePolicy | readonly JsTsSafeMemberMergePolicyRegion[]>>;
  readonly requireSourceLedgerSpans?: boolean;
  readonly sourceLedgers?: Record<string, unknown>;
  readonly sourceLedgersByPath?: Record<string, Record<string, unknown>>;
  readonly requireOutputSyntaxDiagnostics?: boolean;
  readonly requireOutputSyntaxGate?: boolean;
  readonly requireMergedOutputSyntaxDiagnostics?: boolean;
  readonly requireSyntaxGate?: boolean;
  readonly outputSyntaxDiagnostics?: readonly Diag[] | Diag;
  readonly mergedOutputSyntaxDiagnostics?: readonly Diag[] | Diag;
  readonly syntaxDiagnostics?: { readonly output?: readonly Diag[] | Diag; readonly merged?: readonly Diag[] | Diag; };
  readonly qualityGates?: readonly QualityGateInput[] | QualityGateInput; readonly lintGates?: readonly QualityGateInput[] | QualityGateInput; readonly formatGates?: readonly QualityGateInput[] | QualityGateInput; readonly testGates?: readonly QualityGateInput[] | QualityGateInput; readonly buildGates?: readonly QualityGateInput[] | QualityGateInput;
}

export interface JsTsProjectSafeMergeOutputFile {
  readonly sourcePath: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourceText: string;
  readonly sourceHash?: string;
  readonly parserTriviaEvidence?: ParserTriviaEvidenceInput;
  readonly operation: JsTsProjectSafeMergeFileOperation;
}

export interface JsTsProjectSafeMergeFileResult {
  readonly kind: 'frontier.lang.jsTsProjectSafeMergeFile';
  readonly version: 1;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly status: JsTsProjectSafeMergeFileStatus;
  readonly operation: JsTsProjectSafeMergeFileOperation;
  readonly outputSourceText?: string;
  readonly outputHash?: string;
  readonly baseHash?: string;
  readonly workerHash?: string;
  readonly headHash?: string;
  readonly result?: JsTsSafeMergeResult;
  readonly semanticArtifacts?: JsTsSafeMergeSemanticArtifacts;
  readonly conflicts: readonly JsTsSafeMergeConflict[];
  readonly admission: JsTsSafeMergeAdmission;
  readonly summary?: JsTsSafeMergeSummary | Record<string, unknown>;
  readonly conflictKeys: readonly string[];
}

export interface JsTsProjectSafeMergeAdmission {
  readonly status: 'auto-merge-candidate' | 'blocked' | string;
  readonly action: 'apply-project' | 'human-review' | string;
  readonly reviewRequired: boolean;
  readonly autoApplyCandidate: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: boolean; readonly semanticEquivalenceLevel: 'semantic-equivalence-unknown' | string;
  readonly proofEvidenceStatus: JsTsProjectMergeProofEvidenceStatus; readonly proofEvidenceLevels: readonly JsTsProjectMergeProofLevel[]; readonly proofEvidenceIds: readonly string[];
  readonly routes?: readonly JsTsProjectSafeMergeAdmissionRoute[]; readonly routeSummary?: JsTsProjectSafeMergeAdmissionRouteSummary;
  readonly reasonCodes: readonly string[];
  readonly conflictKeys: readonly string[];
}

export interface JsTsProjectGraphDeltaStageSummary {
  readonly stage: JsTsProjectGraphStageName;
  readonly sourceFiles: number;
  readonly sourceFileRecords: number; readonly sourceSpanRecords: number;
  readonly sourceBytes: number;
  readonly documents: number;
  readonly symbols: number;
  readonly fileHashes: number;
  readonly importEdges: number;
  readonly exportEdges: number;
  readonly publicContractRegions: number;
  readonly compilerSymbolRecords: number; readonly compilerTypeRecords: number; readonly runtimeRegionRecords: number; readonly scopeBindingRecords: number; readonly scopeReferenceRecords: number; readonly jsxElementRecords: number; readonly jsxPropRecords: number;
  readonly reExportIdentities: number; readonly moduleDeclarationRecords: number; readonly exportAssignmentRecords: number;
  readonly unresolvedImportEdges: number;
  readonly suppliedImports: number;
  readonly matchedSuppliedImports: number;
  readonly scannerFallbackImports: number;
  readonly serializedBytes?: number;
  readonly limitConflicts: number;
}

export interface JsTsProjectGraphDeltaStage {
  readonly kind: 'frontier.lang.jsTsProjectGraphStage';
  readonly version: 1;
  readonly stage: JsTsProjectGraphStageName;
  readonly projectImport?: NativeProjectImportResult;
  readonly projectSymbolGraph?: NativeProjectSymbolGraphSummary;
  readonly summary: JsTsProjectGraphDeltaStageSummary;
  readonly limitConflicts?: readonly JsTsSafeMergeConflict[];
}

export interface JsTsProjectGraphDeltaSummary {
  readonly stages: number;
  readonly sourceFiles: number;
  readonly sourceFileRecords: number; readonly sourceSpanRecords: number;
  readonly publicContractRegions: number;
  readonly compilerSymbolRecords: number; readonly compilerTypeRecords: number; readonly runtimeRegionRecords: number; readonly scopeBindingRecords: number; readonly scopeReferenceRecords: number; readonly jsxElementRecords: number; readonly jsxPropRecords: number;
  readonly reExportIdentities: number; readonly moduleDeclarationRecords: number; readonly exportAssignmentRecords: number;
  readonly importEdges: number;
  readonly exportEdges: number;
  readonly unresolvedImportEdges: number;
  readonly suppliedImports: number;
  readonly matchedSuppliedImports: number;
  readonly scannerFallbackImports: number;
  readonly sourceBytes: number;
  readonly serializedBytes: number;
  readonly limitConflicts: number;
  readonly conflicts: number;
  readonly publicContractConflicts: number;
  readonly sourceSpanConflicts: number;
  readonly compilerTypeConflicts: number; readonly runtimeRegionConflicts: number; readonly scopeUseDefConflicts: number; readonly jsxPropConflicts: number; readonly jsxRenderRiskConflicts: number;
  readonly reExportIdentityConflicts: number; readonly moduleDeclarationShapeConflicts: number; readonly exportAssignmentShapeConflicts: number;
  readonly importAttributeConflicts: number;
  readonly importTargetConflicts: number;
  readonly stageSummaries: Readonly<Record<string,JsTsProjectGraphDeltaStageSummary>>;
}

export interface JsTsProjectGraphDelta {
  readonly kind: 'frontier.lang.jsTsProjectGraphDelta';
  readonly version: 1;
  readonly stages: Readonly<Record<string,JsTsProjectGraphDeltaStage>>;
  readonly summary: JsTsProjectGraphDeltaSummary;
}

export interface JsTsProjectSafeMergeResult {
  readonly kind: 'frontier.lang.jsTsProjectSafeMerge';
  readonly version: 1;
  readonly schema: 'frontier.lang.jsTsProjectSafeMerge.v1';
  readonly id: string;
  readonly hash: string;
  readonly status: JsTsProjectSafeMergeStatus;
  readonly files: readonly JsTsProjectSafeMergeFileResult[];
  readonly outputFiles: readonly JsTsProjectSafeMergeOutputFile[];
  readonly outputProjectImport?: NativeProjectImportResult;
  readonly outputProjectSymbolGraph?: NativeProjectSymbolGraphSummary;
  readonly projectGraphDelta?: JsTsProjectGraphDelta;
  readonly outputDiagnosticsGate?: JsTsProjectMergeDiagnosticsGate;
  readonly outputDeclarationGate?: DeclGate;
  readonly declarationEmitParityProof?: DeclEmitParityProof;
  readonly outputQualityGate?: QualityGate;
  readonly conflicts: readonly JsTsSafeMergeConflict[];
  readonly admission: JsTsProjectSafeMergeAdmission; readonly proofEvidence: JsTsProjectMergeProofEvidence; readonly confidence: JsTsProjectSafeMergeConfidenceSummary; readonly evidence: readonly JsTsProjectSafeMergeEvidenceRecord[];
  readonly summary: {
    readonly files: number;
    readonly mergedFiles: number;
    readonly blockedFiles: number;
    readonly outputFiles: number;
    readonly projectGraphConflicts: number;
    readonly projectGraphDeltaEvidenceIncluded: number;
    outputProjectGraphConflicts:number; projectGraphCssModuleUseSiteConflicts:number;
    readonly projectGraphDeltaConflicts: number;
    readonly projectGraphLimitConflicts: number;
    readonly projectGraphPublicContractConflicts: number;
    readonly projectGraphSourceSpanConflicts: number;
    readonly projectGraphCompilerTypeConflicts: number; readonly projectGraphRuntimeRegionConflicts: number; readonly projectGraphScopeUseDefConflicts: number; readonly projectGraphJsxPropConflicts: number; readonly projectGraphJsxRenderRiskConflicts: number;
    readonly projectGraphReExportIdentityConflicts: number; readonly projectGraphModuleDeclarationShapeConflicts: number; readonly projectGraphExportAssignmentShapeConflicts: number;
    readonly projectGraphImportAttributeConflicts: number;
    readonly projectGraphImportTargetConflicts: number;
    readonly outputDiagnostics: number;
    readonly outputDiagnosticConflicts: number;
    readonly outputDiagnosticErrors: number;
    readonly outputDiagnosticWarnings: number;
    readonly outputDeclarations: number;
    readonly outputDeclarationBytes: number;
    readonly outputDeclarationConflicts: number;
    readonly outputDeclarationDiagnosticErrors: number;
    readonly outputQualityGates: number; readonly outputQualityGateConflicts: number;
    readonly proofEvidenceRecords: number; readonly proofEvidencePassed: number; readonly proofEvidenceFailed: number; readonly proofEvidenceSkipped: number; readonly proofEvidenceUnknown: number; readonly proofEvidenceMissing: number; readonly proofEvidenceMissingLevels: readonly JsTsProjectMergeProofLevel[]; readonly semanticEquivalenceLevel: 'semantic-equivalence-unknown' | string; readonly evidenceRecords: number; readonly passedEvidenceRecords: number; readonly failedEvidenceRecords: number; readonly unknownEvidenceRecords: number; readonly confidenceScore: number; readonly confidenceLevel: string; readonly confidenceDimensions: Readonly<Record<string,string>>; readonly missingEvidenceMatrix: JsTsProjectSafeMergeMissingEvidenceTelemetry; readonly missingSignals: number; readonly nextMissingEvidenceCode?: string; readonly nextMissingEvidenceKind?: string; readonly nextMissingEvidenceScope?: string; readonly nextMissingProofLevel?: string; readonly nextMissingEvidenceAction?: string; readonly nextMissingEvidenceRouteId?: string; readonly nextMissingEvidenceRouteLane?: string; readonly nextMissingEvidenceRouteNext?: string;
    readonly projectMoveRenameClassifications: number; readonly projectFileMoveRenameClassifications: number; readonly projectSymbolMoveClassifications: number; readonly projectExportedSymbolMoveClassifications: number; readonly projectImportedSymbolMoveClassifications: number; readonly projectSymbolMoveAdmissions: number; readonly projectExportedSymbolMoveAdmissions: number; readonly projectImportedSymbolMoveAdmissions: number; readonly projectCrossFileSymbolRenameClassifications: number; readonly projectCrossFileSymbolRenameAdmissions: number;
    readonly projectSplitMergeClassifications: number; readonly projectModuleSplitClassifications: number; readonly projectModuleMergeClassifications: number; readonly projectClassSplitClassifications: number; readonly projectClassMergeClassifications: number; readonly projectSplitMergeAdmissions: number; readonly projectModuleSplitAdmissions: number; readonly projectModuleMergeAdmissions: number; readonly projectClassSplitAdmissions: number; readonly projectClassMergeAdmissions: number;
    readonly semanticArtifactFiles: number;
    readonly operations: Readonly<Record<string,number>>;
  };
  readonly metadata?: Record<string, unknown> & {
    readonly projectMoveRenameClassifications?: {
      readonly classifications: number;
      readonly fileMoveRenames: number;
      readonly reasonCodes: readonly string[];
    };
    readonly outputDiagnosticSource?: string;
    readonly outputCompilerOptions?: JsTsProjectCompilerOptionMetadata;
    readonly outputCompilerOptionSources?: readonly JsTsProjectCompilerOptionSourceMetadata[];
    readonly outputProjectReferences?: readonly JsTsProjectReferenceMetadata[];
    readonly outputProjectReferenceCount?: number; readonly proofEvidence?: JsTsProjectMergeProofEvidence['summary']; readonly semanticEquivalenceLevel?: 'semantic-equivalence-unknown' | string; readonly confidenceScore?: number; readonly confidenceLevel?: string; readonly evidenceRecords?: number; readonly failedEvidenceRecords?: number; readonly projectSymbolRenameClassifications?: Record<string, unknown>; readonly projectSplitMergeClassifications?: Record<string, unknown>;
  };
}

export declare function safeMergeJsTsProject(input?: JsTsProjectSafeMergeInput): JsTsProjectSafeMergeResult;
