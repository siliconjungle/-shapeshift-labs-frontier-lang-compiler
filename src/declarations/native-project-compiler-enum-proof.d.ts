export interface NativeProjectSymbolGraphCompilerEnumMemberRecord {
  readonly name?: string;
  readonly ordinal?: number;
  readonly declarationOrdinal?: number;
  readonly initializerText?: string;
  readonly valueText?: string;
  readonly valueKind?: 'number' | 'string' | string;
  readonly runtimeValueText?: string;
  readonly runtimeValueKind?: 'number' | 'string' | string;
  readonly auto?: boolean;
  readonly computed?: boolean;
  readonly memberText?: string;
  readonly memberTypeText?: string;
}

export interface NativeProjectSymbolGraphCompilerEnumRuntimeShapeProof {
  readonly kind: 'typescript-checker-public-api-enum-runtime-shape-evidence' | string;
  readonly status: 'passed' | 'failed' | string;
  readonly proofLevel?: string;
  readonly checkerInvariant?: string;
  readonly requiredSignals?: readonly string[];
  readonly enumRuntimeShapeHash?: string;
  readonly enumEmittedRuntimeShapeHash?: string;
  readonly computedEnumRuntimeValueHash?: string;
  readonly computedEnumRuntimeValueProof?: NativeProjectSymbolGraphCompilerComputedEnumRuntimeValueProof;
  readonly enumMemberCount?: number;
  readonly enumNumericMemberCount?: number;
  readonly enumStringMemberCount?: number;
  readonly enumAutoMemberCount?: number;
  readonly enumComputedMemberCount?: number;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
}

export interface NativeProjectSymbolGraphCompilerComputedEnumRuntimeValueProof {
  readonly id?: string;
  readonly evidenceId?: string;
  readonly evidenceIds?: readonly string[];
  readonly schema?: 'frontier.lang.typescript.computedEnumRuntimeValueProof.v1' | string;
  readonly kind?: 'frontier.lang.typescript.computedEnumRuntimeValueProof' | string;
  readonly status: 'passed' | 'verified' | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly enumName?: string;
  readonly enumRuntimeShapeHash?: string;
  readonly enumEmittedRuntimeShapeHash?: string;
  readonly enumComputedMemberCount?: number;
  readonly computedMembers?: readonly NativeProjectSymbolGraphCompilerEnumMemberRecord[];
  readonly computedEnumRuntimeValueHash?: string;
  readonly command?: string;
  readonly traceHash?: string;
  readonly evidenceHash?: string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
  readonly computedEnumRuntimeEvaluationEquivalenceClaim: false;
}
