export interface NativeProjectRuntimeOrderReachabilityRecord {
  readonly kind?: 'same-block-unreachable-after-completion' | string;
  readonly status?: 'unreachable' | string;
  readonly proofLevel?: 'lexical-same-block-completion' | string;
  readonly targetLine?: number;
  readonly completionKind?: 'return' | 'throw' | 'break' | 'continue' | string;
  readonly completionLine?: number;
  readonly completionText?: string;
  readonly completionLabel?: string;
  readonly completionProofLevel?: string;
  readonly blockLine?: number;
  readonly ifLine?: number;
  readonly elseLine?: number;
  readonly elseIfLines?: readonly number[];
  readonly branchLineNumbers?: readonly number[];
  readonly branchCompletionKinds?: readonly string[];
  readonly branchCompletionTexts?: readonly string[];
  readonly branchCompletionProofLevels?: readonly string[];
  readonly boundedNestedPathEvidence?: true;
  readonly staticReachabilityEvidence?: true;
  readonly fullPathReachabilityClaim?: false;
  readonly runtimeEquivalenceClaim?: false;
  readonly semanticEquivalenceClaim?: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectRuntimeOrderEvidence {
    readonly reachabilityOrder?: readonly NativeProjectRuntimeOrderReachabilityRecord[];
  }
}
