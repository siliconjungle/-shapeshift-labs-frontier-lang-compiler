export {};

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
  }
  interface NativeProjectSymbolGraphCompilerTypeRecord {
    readonly unionTypeCount?: number;
    readonly intersectionTypeCount?: number;
    readonly tupleTypeCount?: number;
    readonly typeEquivalenceUnionTypeSetHash?: string;
    readonly typeEquivalenceIntersectionTypeSetHash?: string;
    readonly typeEquivalenceTupleTypeSetHash?: string;
  }
}
