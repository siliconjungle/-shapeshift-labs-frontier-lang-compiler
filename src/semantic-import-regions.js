import { idFragment, uniqueStrings } from './native-import-utils.js';

const NativeImportRegionTaxonomyKinds = Object.freeze([
  'symbol',
  'declaration',
  'import',
  'body',
  'call',
  'type',
  'effect',
  'property',
  'config',
  'content',
  'route',
  'generatedOutput'
]);

function semanticOwnershipRegionForSymbol(imported, symbol, mapping, nativeNode, options = {}) {
  const sourcePath = mapping?.sourceSpan?.path ?? symbol.definitionSpan?.path ?? nativeNode?.span?.path ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? imported?.nativeAst?.sourcePath;
  const language = symbol.language ?? imported?.language ?? imported?.nativeAst?.language ?? imported?.nativeSource?.language;
  const sourceSpan = mapping?.sourceSpan ?? symbol.definitionSpan ?? nativeNode?.span;
  const regionKind = semanticRegionKindForSymbol(symbol, mapping, nativeNode);
  const key = [
    options.regionPrefix ?? 'source',
    sourcePath ?? `${language}:memory`,
    regionKind,
    symbol.name ?? symbol.id
  ].map((part) => String(part).replace(/\s+/g, ' ').trim()).join('#');
  return {
    id: `region_${idFragment(key)}`,
    key,
    regionKind,
    granularity: 'symbol',
    language,
    sourcePath,
    sourceHash: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash,
    symbolId: symbol.id,
    symbolName: symbol.name,
    symbolKind: symbol.kind,
    nativeAstNodeId: symbol.nativeAstNodeId ?? nativeNode?.id,
    sourceSpan,
    precision: mapping?.precision ?? (sourceSpan ? 'declaration' : 'unknown'),
    mergePolicy: semanticRegionMergePolicy(regionKind),
    metadata: {
      semanticRegionTaxonomy: true
    }
  };
}

function semanticOwnershipRegionForDeclaration(input, declaration, documentId) {
  const name = declaration.name ?? declaration.importPath ?? declaration.nodeId ?? declaration.nativeNode?.id;
  const kind = declaration.symbolKind ?? declaration.kind ?? declaration.nativeNode?.kind ?? 'symbol';
  const sourcePath = declaration.span?.path ?? declaration.nativeNode?.span?.path ?? input.sourcePath ?? `${input.language}:memory`;
  const regionKind = semanticRegionKindForDeclaration(declaration);
  const key = ['source', sourcePath, regionKind, name].map((part) => String(part).replace(/\s+/g, ' ').trim()).join('#');
  return {
    id: `region_${idFragment(key)}`,
    key,
    regionKind,
    granularity: 'symbol',
    language: input.language,
    documentId,
    sourcePath,
    sourceHash: input.sourceHash,
    symbolId: declaration.symbolId,
    symbolName: name,
    symbolKind: kind,
    nativeAstNodeId: declaration.nodeId ?? declaration.nativeNode?.id,
    sourceSpan: declaration.span ?? declaration.nativeNode?.span,
    precision: declaration.span || declaration.nativeNode?.span ? 'declaration' : 'unknown',
    mergePolicy: semanticRegionMergePolicy(regionKind),
    metadata: {
      semanticRegionTaxonomy: true
    }
  };
}

function semanticPatchHintForRegion(region, readiness, options = {}) {
  return {
    id: `hint_${idFragment(region.id)}`,
    kind: 'source-region-patch',
    ownershipRegionId: region.id,
    ownershipKey: region.key,
    sourcePath: region.sourcePath,
    sourceHash: region.sourceHash,
    sourceSpan: region.sourceSpan,
    readiness,
    precision: region.precision,
    supportedOperations: semanticRegionSupportedOperations(region),
    projection: {
      sourceLanguage: region.language,
      targetPath: options.targetPath ?? region.sourcePath,
      requiresSourceMap: true
    }
  };
}

function semanticRegionKindForDeclaration(declaration) {
  if (declaration.role === 'import' || declaration.importPath) return 'import';
  if (declaration.regionKind) return normalizeNativeImportRegionKind(declaration.regionKind);
  if (declaration.metadata?.ownershipRegionKind) return normalizeNativeImportRegionKind(declaration.metadata.ownershipRegionKind);
  const kind = declaration.symbolKind ?? declaration.kind ?? declaration.nativeNode?.kind;
  if (semanticKindIsType(kind)) return 'type';
  if (semanticKindCanOwnBody(kind, declaration.span ?? declaration.nativeNode?.span)) return 'body';
  return 'declaration';
}

function semanticRegionKindForSymbol(symbol, mapping, nativeNode) {
  if (mapping?.generatedSpan || mapping?.generatedName || mapping?.target?.emitPath) return 'generatedOutput';
  if (symbol?.metadata?.ownershipRegionKind) return normalizeNativeImportRegionKind(symbol.metadata.ownershipRegionKind);
  if (String(symbol?.id ?? '').includes(':import:') || symbol?.metadata?.role === 'import') return 'import';
  if (semanticKindIsType(symbol?.kind ?? nativeNode?.kind)) return 'type';
  if (semanticKindCanOwnBody(symbol?.kind ?? nativeNode?.kind, nativeNode?.span ?? symbol?.definitionSpan)) return 'body';
  return 'declaration';
}

function semanticKindIsType(kind) {
  return ['type', 'class', 'interface', 'trait', 'protocol', 'struct', 'enum', 'record'].includes(String(kind ?? '').toLowerCase());
}

function semanticKindCanOwnBody(kind, span) {
  const text = String(kind ?? '').toLowerCase();
  if (/function|method|class|implementation|module|namespace|package|action|effect|capability/.test(text)) return true;
  return typeof span?.startLine === 'number' && typeof span?.endLine === 'number' && span.endLine > span.startLine;
}

function semanticRegionMergePolicy(regionKind) {
  if (regionKind === 'import') return 'module-edge-review-required';
  if (regionKind === 'body') return 'implementation-single-writer-review-required';
  if (regionKind === 'call') return 'callsite-overlap-review-required';
  if (regionKind === 'type') return 'type-surface-review-required';
  if (regionKind === 'effect') return 'effect-boundary-review-required';
  if (regionKind === 'generatedOutput') return 'generated-output-source-map-review-required';
  return 'single-writer-review-required';
}

function semanticRegionSupportedOperations(region) {
  if (region.regionKind === 'import') return ['replace-import', 'insert-import-before', 'insert-import-after', 'replace-region'];
  if (region.regionKind === 'body') return ['replace-body', 'insert-before-body', 'insert-after-body'];
  if (region.regionKind === 'call') return ['replace-callsite', 'review-callsite'];
  if (region.regionKind === 'type') return ['replace-type-declaration', 'merge-type-members', 'replace-region'];
  if (region.regionKind === 'effect') return ['route-effect', 'replace-effect-boundary', 'review-effect-policy'];
  if (region.regionKind === 'generatedOutput') return ['replace-generated-output', 'attach-generated-source-map', 'review-generator-input'];
  return ['replace-region', 'insert-before-region', 'insert-after-region'];
}

function normalizeNativeImportRegionKind(value) {
  const text = String(value ?? 'symbol').trim();
  if (text === 'generated' || text === 'generated-output' || text === 'generated_output') return 'generatedOutput';
  if (NativeImportRegionTaxonomyKinds.includes(text)) return text;
  return text || 'symbol';
}

function summarizeSemanticImportRegionTaxonomy(regions) {
  const byKind = {};
  const keysByKind = {};
  const keys = [];
  for (const region of regions ?? []) {
    const kind = normalizeNativeImportRegionKind(region.regionKind ?? region.granularity);
    byKind[kind] = (byKind[kind] ?? 0) + 1;
    keysByKind[kind] = [...(keysByKind[kind] ?? []), region.key].filter(Boolean);
    if (region.key) keys.push(region.key);
  }
  return {
    kinds: [...NativeImportRegionTaxonomyKinds],
    presentKinds: uniqueStrings(Object.keys(byKind)),
    byKind,
    keys,
    keysByKind
  };
}

export {
  NativeImportRegionTaxonomyKinds,
  semanticOwnershipRegionForDeclaration,
  semanticOwnershipRegionForSymbol,
  semanticPatchHintForRegion,
  semanticRegionKindForSymbol,
  semanticRegionMergePolicy,
  summarizeSemanticImportRegionTaxonomy
};
