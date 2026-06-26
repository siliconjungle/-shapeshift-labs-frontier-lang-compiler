export interface NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeProof {
  readonly id?: string;
  readonly evidenceId?: string;
  readonly schema?: 'frontier.lang.typescript.classPrivateAccessorRuntimeProof.v1' | string;
  readonly kind?: 'frontier.lang.typescript.classPrivateAccessorRuntimeProof' | string;
  readonly status?: 'passed' | 'verified' | 'failed' | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly privateClassMemberShapeHash?: string;
  readonly accessorFieldShapeHash?: string;
  readonly privateClassMemberCount?: number;
  readonly accessorFieldCount?: number;
  readonly requiredSignals?: readonly string[];
  readonly classPrivateAccessorRuntimeHash?: string;
  readonly classConstructionOrderTraceHash?: string;
  readonly privateMemberInitializationTraceHash?: string;
  readonly privateMemberAccessTraceHash?: string;
  readonly privateBrandCheckTraceHash?: string;
  readonly privateMethodCallTraceHash?: string;
  readonly privateAccessorGetSetTraceHash?: string;
  readonly staticPrivateMemberAccessTraceHash?: string;
  readonly subclassPrivateBrandBoundaryTraceHash?: string;
  readonly accessorInitializationTraceHash?: string;
  readonly accessorGetSetTraceHash?: string;
  readonly accessorDescriptorTraceHash?: string;
  readonly command?: string;
  readonly traceHash?: string;
  readonly evidenceHash?: string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
  readonly privateMemberRuntimeEquivalenceClaim: false;
  readonly accessorRuntimeEquivalenceClaim: false;
}

export interface NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeGap {
  readonly code?: string;
  readonly status?: string;
  readonly summary?: string;
  readonly routeId?: string;
  readonly routeLane?: string;
  readonly routeNext?: string;
  readonly failClosed?: boolean;
  readonly blocksSemanticEquivalence?: boolean;
  readonly classPrivateAccessorRuntimeHash?: string;
  readonly proofReasonCodes?: readonly string[];
  readonly proofEvidenceIds?: readonly string[];
}

export interface NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeRouting {
  readonly status?: 'proof-bound' | string;
  readonly conflictCode?: string;
  readonly reasonCode?: string;
  readonly branchDivergenceSignal?: string;
  readonly routeId?: string;
  readonly routeLane?: string;
  readonly routeNext?: string;
  readonly privateClassMemberShapeHash?: string;
  readonly accessorFieldShapeHash?: string;
  readonly classPrivateAccessorRuntimeHash?: string;
  readonly proofEvidenceIds?: readonly string[];
  readonly failClosed?: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
}

export interface NativeProjectSymbolGraphCompilerClassMemberShapeProof {
  readonly kind: string;
  readonly status: string;
  readonly proofScope?: 'static-private-accessor-shape-only' | 'static-private-accessor-shape-and-source-bound-runtime' | string;
  readonly proofLevel?: string;
  readonly checkerInvariant?: string;
  readonly requiredSignals?: readonly string[];
  readonly privateClassMemberCount?: number;
  readonly accessorFieldCount?: number;
  readonly privateClassMemberShapeHash?: string;
  readonly accessorFieldShapeHash?: string;
  readonly classPrivateAccessorRuntimeHash?: string;
  readonly classPrivateAccessorRuntimeProof?: NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeProof;
  readonly classPrivateAccessorRuntimeProofReasonCodes?: readonly string[];
  readonly runtimeEquivalenceGap?: NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeGap;
  readonly conflictRouting?: NativeProjectSymbolGraphCompilerClassPrivateAccessorRuntimeRouting;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
}
