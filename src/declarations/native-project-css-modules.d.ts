import type { SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';

export interface NativeProjectSymbolGraphCssModuleImportBindingRecord {
  readonly id: string;
  readonly kind: 'css-module-import-binding';
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly importEdgeId?: string;
  readonly moduleSpecifier?: string;
  readonly resolvedModulePath?: string;
  readonly targetDocumentId?: string;
  readonly importKind?: 'default' | 'namespace' | 'named' | 'side-effect' | string;
  readonly importedName?: string;
  readonly localName?: string;
  readonly cssModuleSourcePath?: string;
  readonly cssModuleSourceHash?: string;
  readonly cssModuleHash?: string;
  readonly cssModuleEvidenceStatus?: 'supplied' | 'unproved' | string;
  readonly cssModuleEvidenceSource?: 'supplied' | 'inferred-source' | string;
  readonly cssModuleExportNames?: readonly string[];
  readonly cssModuleExportNamesHash?: string;
  readonly generatedClassNameMapHash?: string;
  readonly jsTsUseSiteGraphHash?: string;
  readonly cssModuleCompositionGraphHash?: string;
  readonly cssModuleCompositionGraphSource?: 'supplied' | 'source-local' | 'project-source' | string;
  readonly icssGraphHash?: string;
  readonly icssGraphSource?: 'supplied' | 'source-export-only' | 'project-source' | string;
  readonly bundlerTransformHash?: string;
  readonly sourceMapProofHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphCssModuleUseSiteRecord {
  readonly id: string;
  readonly kind: 'css-module-use-site';
  readonly cssModuleImportBindingId: string;
  readonly importEdgeId?: string;
  readonly cssModuleSourcePath?: string;
  readonly cssModuleHash?: string;
  readonly exportName?: string;
  readonly cssModuleExportHash?: string;
  readonly useSiteKind?: 'jsx-className' | 'jsx-className-helper' | 'scope-member-read' | 'destructured-binding' | 'named-import-reference' | string;
  readonly jsSourcePath?: string;
  readonly jsSourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly accessKind?: 'dot' | 'static-bracket' | 'static-template' | 'destructure' | 'named-import' | 'helper-argument' | string;
  readonly receiverLocalName?: string;
  readonly localReferenceName?: string;
  readonly expressionText?: string;
  readonly jsxPropRecordId?: string;
  readonly scopeReferenceRecordId?: string;
  readonly conditionalRuntimePresence?: boolean;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphCssModuleUseSiteBlockerRecord {
  readonly id: string;
  readonly kind: 'css-module-use-site-blocker';
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly moduleSpecifier?: string;
  readonly localName?: string;
  readonly cssModuleImportBindingId?: string;
  readonly cssModuleSourcePath?: string;
  readonly expressionText?: string;
  readonly reasonCode?: string;
  readonly writeOperation?: string;
  readonly jsxPropRecordId?: string;
  readonly failClosed: true;
  readonly semanticEquivalenceClaim: false;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphCssModuleUseSiteGraphRecord {
  readonly kind: 'frontier.lang.cssModuleUseSiteGraph';
  readonly version: 1;
  readonly cssModuleSourcePath?: string;
  readonly cssModuleHash?: string;
  readonly cssModuleSourceHash?: string;
  readonly importBindingIds: readonly string[];
  readonly useSiteIds: readonly string[];
  readonly blockerIds: readonly string[];
  readonly importBindingCount: number;
  readonly useSiteCount: number;
  readonly blockerCount: number;
  readonly generatedClassNameMapHash?: string;
  readonly cssModuleExportNamesHash?: string;
  readonly cssModuleCompositionGraphHash?: string;
  readonly cssModuleCompositionGraphSource?: 'supplied' | 'source-local' | 'project-source' | string;
  readonly icssGraphHash?: string;
  readonly icssGraphSource?: 'supplied' | 'source-export-only' | 'project-source' | string;
  readonly bundlerTransformHash?: string;
  readonly sourceMapProofHash?: string;
  readonly status: 'ready' | 'blocked' | string;
  readonly graphHash: string;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}
