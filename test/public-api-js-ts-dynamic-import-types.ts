import * as compilerApi from '../src/index.js';

const typedDynamicImportEdge: compilerApi.NativeProjectSymbolGraphModuleEdgeRecord = {
  id: 'edge_dynamic_import',
  sourceDocumentId: 'doc_src_index_ts',
  targetSymbolId: 'symbol_typescript_module_dynamic_import',
  predicate: 'imports',
  importKind: 'dynamic-import',
  dynamicImport: true,
  dynamicImportSpecifierKind: 'identifier',
  dynamicImportExpressionText: 'target',
  dynamicImportExpressionHash: 'sha256:dynamic-import',
  dynamicImportStaticSpecifierEvidence: false,
  dynamicImportRuntimeResolutionClaim: false,
  dynamicImportResolutionProofRequired: true
};

typedDynamicImportEdge.dynamicImport satisfies boolean | undefined;
typedDynamicImportEdge.dynamicImportSpecifierKind satisfies string | undefined;
typedDynamicImportEdge.dynamicImportExpressionText satisfies string | undefined;
typedDynamicImportEdge.dynamicImportExpressionHash satisfies string | undefined;
typedDynamicImportEdge.dynamicImportStaticSpecifierEvidence satisfies boolean | undefined;
typedDynamicImportEdge.dynamicImportRuntimeResolutionClaim satisfies false | undefined;
typedDynamicImportEdge.dynamicImportResolutionProofRequired satisfies boolean | undefined;

const typedHostDependencyEdge: compilerApi.NativeProjectSymbolGraphModuleEdgeRecord = {
  id: 'edge_import_meta_url',
  sourceDocumentId: 'doc_src_worker_ts',
  targetSymbolId: 'symbol_typescript_module_worker',
  predicate: 'imports',
  importKind: 'import-meta-url',
  moduleSpecifier: './worker.ts',
  hostDependency: true,
  hostDependencyKind: 'import-meta-url',
  hostDependencyBase: 'import.meta.url',
  hostDependencyExpressionText: "new URL('./worker.ts', import.meta.url)",
  hostDependencyExpressionHash: 'sha256:host-url',
  hostDependencyStaticSpecifierEvidence: true,
  hostDependencyRuntimeResolutionClaim: false
};

typedHostDependencyEdge.hostDependency satisfies boolean | undefined;
typedHostDependencyEdge.hostDependencyKind satisfies string | undefined;
typedHostDependencyEdge.hostDependencyBase satisfies string | undefined;
typedHostDependencyEdge.hostDependencyExpressionText satisfies string | undefined;
typedHostDependencyEdge.hostDependencyExpressionHash satisfies string | undefined;
typedHostDependencyEdge.hostDependencyStaticSpecifierEvidence satisfies boolean | undefined;
typedHostDependencyEdge.hostDependencyRuntimeResolutionClaim satisfies false | undefined;
