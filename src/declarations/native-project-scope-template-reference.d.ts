declare module './native-project-compiler-scope.js' {
  interface NativeProjectSymbolGraphScopeReferenceRecord {
    readonly templateLiteralKind?: 'template-literal' | 'tagged-template' | string;
    readonly taggedTemplate?: boolean;
    readonly templateTagText?: string;
    readonly templateTagRoot?: string;
    readonly templateTagMemberName?: string;
    readonly templateTagStart?: number;
    readonly templateTagEnd?: number;
  }
}

export {};
