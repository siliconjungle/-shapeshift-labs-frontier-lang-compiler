export interface NativeProjectRuntimeOrderPromiseChainRecord {
  readonly kind?: 'promise-chain' | string;
  readonly regionRole?: 'source-promise' | 'chain-expression' | 'chain-handler' | string;
  readonly handlerMethodName?: 'then' | 'catch' | 'finally' | string;
  readonly handlerStepOrdinal?: number;
  readonly chainMethods?: readonly string[];
  readonly stepCount?: number;
  readonly hasThen?: boolean;
  readonly hasCatch?: boolean;
  readonly hasFinally?: boolean;
  readonly chainText?: string;
  readonly steps?: readonly NativeProjectRuntimeOrderPromiseChainStepRecord[];
  readonly regionWithinPromiseChain?: boolean;
  readonly handlerExecutionEquivalenceClaim?: false;
  readonly runtimeEquivalenceClaim?: false;
  readonly semanticEquivalenceClaim?: false;
}

export interface NativeProjectRuntimeOrderPromiseChainStepRecord {
  readonly ordinal?: number;
  readonly methodName?: 'then' | 'catch' | 'finally' | string;
  readonly handlerText?: string;
  readonly handlerOrdinal?: number;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectRuntimeOrderEvidence {
    readonly sameLinePromiseChain?: readonly NativeProjectRuntimeOrderPromiseChainRecord[];
  }
}
