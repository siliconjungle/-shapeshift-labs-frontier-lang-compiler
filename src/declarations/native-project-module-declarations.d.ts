import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';

export interface NativeProjectSymbolGraphShapeProof {
  readonly kind: string;
  readonly version: 1;
  readonly status: 'static-shape-evidence' | string;
  readonly proofLevel: string;
  readonly shapeHash: string;
  readonly requiredSignals?: readonly string[];
  readonly providedSignals?: readonly string[];
  readonly unsupportedSignals?: readonly string[];
  readonly runtimeEquivalenceClaim?: false;
  readonly runtimeInteropEquivalenceClaim?: false;
  readonly semanticEquivalenceClaim: false;
}

export interface NativeProjectSymbolGraphModuleDeclarationRecord {
  readonly kind: 'frontier.lang.projectModuleDeclarationShape';
  readonly version: 1;
  readonly id: string;
  readonly symbolId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly moduleName?: string;
  readonly namespace?: string;
  readonly surfaceKind?: 'namespace-declaration' | 'ambient-module-declaration' | 'global-augmentation' | string;
  readonly declarationOnly?: boolean;
  readonly runtimeNamespace?: boolean;
  readonly ambient?: boolean;
  readonly nativeAstNodeId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly signatureHash?: string;
  readonly shapeHash: string;
  readonly shapeProof?: NativeProjectSymbolGraphShapeProof;
}

export interface NativeProjectSymbolGraphExportAssignmentRecord {
  readonly kind: 'frontier.lang.projectExportAssignmentShape';
  readonly version: 1;
  readonly id: string;
  readonly edgeId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly exportedName?: string;
  readonly localName?: string;
  readonly exportKind?: string;
  readonly publicContract?: boolean;
  readonly commonJsShape?: boolean;
  readonly shapeHash: string;
  readonly shapeProof?: NativeProjectSymbolGraphShapeProof;
}
