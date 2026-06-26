import type { SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';

export interface NativeProjectSymbolGraphCompilerDecoratorMetadataRecord {
  readonly kind: 'class-decorator' | 'member-decorator' | 'parameter-decorator' | string;
  readonly targetKind?: 'class' | 'field' | 'accessor-field' | 'method' | 'get-accessor' | 'set-accessor' | 'constructor' | string;
  readonly className?: string;
  readonly memberKind?: string;
  readonly memberName?: string;
  readonly parameterName?: string;
  readonly declarationOrdinal?: number;
  readonly memberOrdinal?: number;
  readonly parameterOrdinal?: number;
  readonly decoratorOrdinal?: number;
  readonly targetStatic?: boolean;
  readonly targetAccessibility?: 'public' | 'private' | 'protected' | string;
  readonly parameterProperty?: boolean;
  readonly syntaxKind?: string;
  readonly expressionKind?: string;
  readonly decoratorText?: string;
  readonly expressionText?: string;
  readonly expressionHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly staticDecoratorMetadataEvidence: true;
  readonly decoratorExecutionEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface NativeProjectSymbolGraphCompilerDecoratorRuntimeExecutionProof {
  readonly id?: string;
  readonly evidenceId?: string;
  readonly schema?: 'frontier.lang.typescript.decoratorRuntimeExecutionProof.v1' | string;
  readonly kind?: 'frontier.lang.typescript.decoratorRuntimeExecutionProof' | string;
  readonly status: 'passed' | 'verified' | 'failed' | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly decoratorMetadataHash?: string;
  readonly decoratorMetadataCount?: number;
  readonly decoratorRuntimeExecutionHash?: string;
  readonly decoratorFactoryCallOrderHash?: string;
  readonly decoratorInvocationOrderHash?: string;
  readonly decoratorSideEffectTraceHash?: string;
  readonly decoratorResultApplicationHash?: string;
  readonly decoratorEmitRuntimeEquivalenceHash?: string;
  readonly command?: string;
  readonly traceHash?: string;
  readonly evidenceHash?: string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
  readonly decoratorExecutionEquivalenceClaim: false;
  readonly decoratorEmitRuntimeEquivalenceClaim: false;
}

export interface NativeProjectSymbolGraphCompilerDecoratorRuntimeExecutionGap {
  readonly kind: 'typescript-checker-decorator-runtime-execution-equivalence-gap' | string;
  readonly status: 'blocked' | string;
  readonly proofLevel?: string;
  readonly reasonCode?: string;
  readonly missingSignals?: readonly string[];
  readonly routeId?: string;
  readonly routeLane?: string;
  readonly routeNext?: string;
  readonly failClosed?: true;
  readonly blocksSemanticEquivalence?: true;
  readonly decoratorRuntimeExecutionHash?: string;
  readonly proofReasonCodes?: readonly string[];
  readonly proofEvidenceIds?: readonly string[];
}

export interface NativeProjectSymbolGraphCompilerDecoratorConflictRouting {
  readonly status: 'fail-closed' | 'proof-bound' | string;
  readonly conflictCode?: string;
  readonly reasonCode?: string;
  readonly branchDivergenceSignal?: string;
  readonly routeId?: string;
  readonly routeLane?: string;
  readonly routeNext?: string;
  readonly decoratorMetadataHash?: string;
  readonly decoratorRuntimeExecutionHash?: string;
  readonly proofEvidenceIds?: readonly string[];
  readonly failClosed?: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
  readonly decoratorExecutionEquivalenceClaim: false;
}

export interface NativeProjectSymbolGraphCompilerDecoratorMetadataProof {
  readonly kind: 'typescript-checker-decorator-static-metadata-evidence' | string;
  readonly status: 'passed' | 'failed' | string;
  readonly proofLevel?: string;
  readonly proofScope?: string;
  readonly checkerInvariant?: string;
  readonly requiredSignals?: readonly string[];
  readonly decoratorMetadataHash?: string;
  readonly decoratorMetadataCount?: number;
  readonly classDecoratorCount?: number;
  readonly memberDecoratorCount?: number;
  readonly parameterDecoratorCount?: number;
  readonly runtimeExecutionEquivalenceGap?: NativeProjectSymbolGraphCompilerDecoratorRuntimeExecutionGap;
  readonly conflictRouting?: NativeProjectSymbolGraphCompilerDecoratorConflictRouting;
  readonly decoratorRuntimeExecutionHash?: string;
  readonly decoratorRuntimeExecutionProof?: NativeProjectSymbolGraphCompilerDecoratorRuntimeExecutionProof;
  readonly decoratorRuntimeExecutionProofReasonCodes?: readonly string[];
  readonly staticDecoratorMetadataEvidence: true;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
  readonly decoratorExecutionEquivalenceClaim: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectSymbolGraphCompilerTypeRecord {
    readonly decoratorMetadataCount?: number;
    readonly classDecoratorCount?: number;
    readonly memberDecoratorCount?: number;
    readonly parameterDecoratorCount?: number;
    readonly decoratorMetadataHash?: string;
    readonly decoratorRuntimeExecutionHash?: string;
    readonly decoratorRuntimeExecutionProof?: NativeProjectSymbolGraphCompilerDecoratorRuntimeExecutionProof;
    readonly decoratorRuntimeExecutionProofReasonCodes?: readonly string[];
    readonly decoratorMetadata?: readonly NativeProjectSymbolGraphCompilerDecoratorMetadataRecord[];
    readonly decoratorMetadataProof?: NativeProjectSymbolGraphCompilerDecoratorMetadataProof;
  }
}
