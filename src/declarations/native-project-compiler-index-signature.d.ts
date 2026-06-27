export interface NativeProjectSymbolGraphCompilerIndexSignatureRecord {
  readonly ordinal?: number;
  readonly keyTypeText?: string;
  readonly valueTypeText?: string;
  readonly readonly?: boolean;
  readonly declarationText?: string;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectSymbolGraphCompilerTypeEquivalenceProof {
    readonly indexSignatureSetHash?: string;
    readonly indexSignatureCount?: number;
    readonly indexSignatureReadonlyCount?: number;
  }

  interface NativeProjectSymbolGraphCompilerTypeRecord {
    readonly indexSignatureReadonlyCount?: number;
  }
}
