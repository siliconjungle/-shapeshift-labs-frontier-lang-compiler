export interface NativeProjectRuntimeOrderResourceManagementRecord {
  readonly kind?: 'resource-management' | string;
  readonly name?: string;
  readonly declarationKind?: 'using' | 'await-using' | string;
  readonly awaitUsing?: boolean;
  readonly line?: number;
  readonly column?: number;
  readonly acquisitionOrderIndex?: number;
  readonly disposalOrderIndex?: number;
  readonly disposalOrder?: 'reverse-lexical-scope' | string;
  readonly scopeStartLine?: number;
  readonly scopeExitLine?: number;
  readonly declarationText?: string;
  readonly initializerText?: string;
  readonly focusedDeclaration?: boolean;
  readonly disposalMethodPolicy?: 'Symbol.dispose' | 'Symbol.asyncDispose-or-Symbol.dispose' | string;
  readonly staticResourceManagementEvidence?: boolean;
  readonly runtimeEquivalenceClaim?: false;
  readonly disposalEffectEquivalenceClaim?: false;
  readonly semanticEquivalenceClaim?: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectRuntimeOrderEvidence {
    readonly resourceManagementOrder?: readonly NativeProjectRuntimeOrderResourceManagementRecord[];
  }
}
