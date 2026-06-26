export {};

declare module './native-project-compiler-scope.js' {
  interface NativeProjectSymbolGraphCompilerTypeEquivalenceProof {
    readonly sourcePath?: string;
    readonly sourceHash?: string;
  }
}
