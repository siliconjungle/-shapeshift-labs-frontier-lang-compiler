export interface NativeProjectRuntimeOrderMutationTargetRecord {
  readonly kind?: 'mutation-target' | string;
  readonly mutationKind?: 'assignment' | 'update' | 'delete' | 'mutating-call' | string;
  readonly line?: number;
  readonly text?: string;
  readonly targetText?: string;
  readonly targetRoot?: string;
  readonly operator?: string;
  readonly methodName?: string;
  readonly optionalCall?: boolean;
  readonly methodComputed?: boolean;
  readonly computedMethodName?: string;
  readonly computedMethodStatic?: boolean;
  readonly computedMethodDynamic?: boolean;
  readonly computedMethodRuntimeEquivalenceClaim?: false;
  readonly computedProperty?: boolean;
  readonly computedPropertyKeys?: readonly string[];
  readonly computedPropertyStatic?: boolean;
  readonly computedPropertyDynamic?: boolean;
  readonly computedPropertyCount?: number;
  readonly computedPropertyStaticCount?: number;
  readonly computedPropertyRuntimeEquivalenceClaim?: false;
  readonly updatePosition?: 'prefix' | 'postfix' | string;
  readonly staticMutationTargetEvidence?: true;
  readonly runtimeEquivalenceClaim?: false;
  readonly semanticEquivalenceClaim?: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectRuntimeOrderEvidence {
    readonly mutationTargetOrder?: readonly NativeProjectRuntimeOrderMutationTargetRecord[];
  }
}
