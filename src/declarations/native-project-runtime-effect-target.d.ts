export interface NativeProjectRuntimeOrderEffectTargetRecord {
  readonly kind?: 'effect-target' | string;
  readonly effectKind?: 'network' | 'scheduler' | 'storage' | 'host' | 'browser' | 'host-context' | string;
  readonly line?: number;
  readonly text?: string;
  readonly targetText?: string;
  readonly targetRoot?: string;
  readonly receiverText?: string;
  readonly taggedTemplate?: boolean;
  readonly calleeName?: string;
  readonly constructorCall?: boolean;
  readonly optionalCall?: boolean;
  readonly computedProperty?: boolean;
  readonly computedPropertyKeys?: readonly string[];
  readonly computedPropertyStatic?: boolean;
  readonly computedPropertyDynamic?: boolean;
  readonly computedPropertyCount?: number;
  readonly computedPropertyStaticCount?: number;
  readonly computedPropertyRuntimeEquivalenceClaim?: false;
  readonly staticEffectTargetEvidence?: true;
  readonly runtimeEquivalenceClaim?: false;
  readonly semanticEquivalenceClaim?: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectRuntimeOrderEvidence {
    readonly effectTargetOrder?: readonly NativeProjectRuntimeOrderEffectTargetRecord[];
  }
}
