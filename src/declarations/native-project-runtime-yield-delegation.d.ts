export interface NativeProjectRuntimeOrderYieldDelegationRecord {
  readonly delegationKind?: 'iterator-delegation' | string;
  readonly delegatedIterableText?: string;
  readonly iteratorProtocolEquivalenceClaim?: false;
  readonly delegatedCompletionPropagationClaim?: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectRuntimeOrderExitRecord extends NativeProjectRuntimeOrderYieldDelegationRecord {}
}
