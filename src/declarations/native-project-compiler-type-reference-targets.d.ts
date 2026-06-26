import type { SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';

export interface NativeProjectSymbolGraphCompilerTypeReferenceTargetRecord {
  readonly kind: 'type-reference-target' | string;
  readonly syntaxKind?: string;
  readonly nodeText?: string;
  readonly typeText?: string;
  readonly typeReferenceName?: string;
  readonly sourceSpan?: SourceSpan;
  readonly typeArgumentCount?: number;
  readonly targetStatus?: 'resolved' | 'unresolved' | string;
  readonly targetAliased?: boolean;
  readonly targetSymbolName?: string;
  readonly targetFullyQualifiedName?: string;
  readonly targetSymbolFlags?: number;
  readonly targetSymbolIdentityHash?: string;
  readonly targetDeclarationKind?: string;
  readonly targetDeclarationSourcePath?: string;
  readonly targetDeclarationSpan?: SourceSpan;
  readonly targetDeclarationTextHash?: string;
  readonly typeReferenceTargetProofHash?: string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly runtimeEquivalenceClaim: false;
}

declare module './native-project-compiler-scope.js' {
  interface NativeProjectSymbolGraphCompilerTypeEquivalenceProof {
    readonly typeReferenceTargetSetHash?: string;
    readonly typeReferenceTargetCount?: number;
  }

  interface NativeProjectSymbolGraphCompilerTypeRecord {
    readonly typeReferenceTargetCount?: number;
    readonly typeReferenceTargets?: readonly NativeProjectSymbolGraphCompilerTypeReferenceTargetRecord[];
    readonly typeEquivalenceTypeReferenceTargetSetHash?: string;
  }
}
