export {};

export interface NativeProjectSymbolGraphCompilerAdvancedTypeProofRequirement {
  readonly kind: 'typescript-checker-public-api-advanced-type-shape-equivalence' | string;
  readonly requiredEvidence?: 'typescript-checker-public-api-type-equivalence' | string;
  readonly status?: 'requires-type-equivalence-proof' | 'missing-compiler-evidence' | 'requires-review' | string;
  readonly requiredSignals?: readonly string[];
  readonly missingSignals?: readonly string[];
  readonly unsupportedSignals?: readonly string[];
  readonly advancedTypeShapeCount?: number;
  readonly advancedTypeShapeKinds?: readonly string[];
  readonly conditionalTypeCount?: number;
  readonly mappedTypeCount?: number;
  readonly indexedAccessTypeCount?: number;
  readonly keyofTypeOperatorCount?: number;
  readonly templateLiteralTypeCount?: number;
  readonly inferTypeCount?: number;
  readonly unionTypeCount?: number;
  readonly intersectionTypeCount?: number;
  readonly tupleTypeCount?: number;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceBound?: boolean;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface NativeProjectSymbolGraphCompilerAdvancedTypeMissingProof {
  readonly kind: 'typescript-checker-public-api-advanced-type-shape-equivalence' | string;
  readonly requiredEvidence?: 'typescript-checker-public-api-type-equivalence' | string;
  readonly status?: 'missing-compiler-evidence' | 'requires-review' | string;
  readonly reasonCode?: 'typescript-public-api-advanced-type-shape-proof-missing' | 'typescript-public-api-advanced-type-shape-proof-requires-review' | string;
  readonly missingSignals?: readonly string[];
  readonly unsupportedSignals?: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectSymbolGraphCompilerAdvancedTypeShapeRecord {
    readonly memberTypeTexts?: readonly string[];
    readonly memberNodeTexts?: readonly string[];
    readonly tupleElementTexts?: readonly string[];
    readonly tupleElementTypeTexts?: readonly string[];
  }
  interface NativeProjectSymbolGraphCompilerTypeEquivalenceProof {
    readonly unionTypeSetHash?: string;
    readonly intersectionTypeSetHash?: string;
    readonly tupleTypeSetHash?: string;
    readonly unionTypeCount?: number;
    readonly intersectionTypeCount?: number;
    readonly tupleTypeCount?: number;
  }
  interface NativeProjectSymbolGraphCompilerTypeRecord {
    readonly advancedTypeProofRequirement?: NativeProjectSymbolGraphCompilerAdvancedTypeProofRequirement;
    readonly advancedTypeMissingProof?: NativeProjectSymbolGraphCompilerAdvancedTypeMissingProof;
    readonly unionTypeCount?: number;
    readonly intersectionTypeCount?: number;
    readonly tupleTypeCount?: number;
    readonly typeEquivalenceUnionTypeSetHash?: string;
    readonly typeEquivalenceIntersectionTypeSetHash?: string;
    readonly typeEquivalenceTupleTypeSetHash?: string;
  }
}
