export interface NativeProjectRuntimeOrderPromiseCombinatorRecord {
  readonly kind?: 'promise-combinator' | string;
  readonly methodName?: 'all' | 'allSettled' | 'race' | 'any' | string;
  readonly concurrencySemantics?: string;
  readonly settlementPolicy?: string;
  readonly callText?: string;
  readonly argumentOrdinal?: number;
  readonly argumentText?: string;
  readonly directArrayArgument?: boolean;
  readonly arrayElementOrdinal?: number;
  readonly arrayElementCount?: number;
  readonly arrayElementText?: string;
  readonly regionWithinCombinator?: boolean;
  readonly runtimeEquivalenceClaim?: false;
  readonly semanticEquivalenceClaim?: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectRuntimeOrderEvidence {
    readonly sameLinePromiseCombinator?: readonly NativeProjectRuntimeOrderPromiseCombinatorRecord[];
  }
}
