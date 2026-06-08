import{idFragment,uniqueByEvidenceId}from'../../native-import-utils.js';import{createDocument,createSemanticIndexRecord,createSourceMapRecord,createUniversalAstEnvelope,hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{attachNativeImportLossSummary}from'./attachNativeImportLossSummary.js';import{classifyNativeImportReadiness}from'./classifyNativeImportReadiness.js';import{externalSemanticSourceMapMappings}from'./externalSemanticSourceMapMappings.js';import{inferExternalSemanticIndexFormat}from'./inferExternalSemanticIndexFormat.js';import{normalizeExternalSemanticIndexFormat}from'./normalizeExternalSemanticIndexFormat.js';import{normalizeExternalSemanticIndexPayload}from'./normalizeExternalSemanticIndexPayload.js';import{normalizeExternalSemanticLanguage}from'./normalizeExternalSemanticLanguage.js';import{normalizeNativeLossRecords}from'./normalizeNativeLossRecords.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function importExternalSemanticIndex(input) {
  const payload = input?.payload ?? input?.semanticIndex ?? input;
  if (!payload || typeof payload !== 'object') {
    throw new Error('importExternalSemanticIndex requires a payload object');
  }
  const format = normalizeExternalSemanticIndexFormat(input?.format ?? inferExternalSemanticIndexFormat(payload));
  const idPart = idFragment(input?.id ?? input?.sourcePath ?? input?.projectRoot ?? format);
  const context = {
    format,
    idPart,
    language: normalizeExternalSemanticLanguage(input?.language ?? payload.language ?? payload.languageId),
    sourcePath: input?.sourcePath ?? payload.sourcePath ?? payload.uri ?? payload.path,
    sourceHash: input?.sourceHash ?? payload.sourceHash ?? payload.md5,
    projectRoot: input?.projectRoot ?? payload.projectRoot ?? payload.project_root ?? payload.metadata?.projectRoot ?? payload.metadata?.project_root,
    parser: input?.parser ?? `${format}.external-semantic-index`,
    metadata: input?.metadata ?? {}
  };
  const normalized = normalizeExternalSemanticIndexPayload(payload, context);
  const ownershipRegions = normalized.ownershipRegions ?? [];
  const evidence = attachNativeImportLossSummary(
    uniqueByEvidenceId([...(normalized.evidence ?? []), ...(input?.evidence ?? [])]),
    summarizeNativeImportLosses(normalized.losses ?? [], {
      evidence: [...(normalized.evidence ?? []), ...(input?.evidence ?? [])],
      parser: context.parser,
      scanKind: 'external-semantic-index',
      semanticStatus: normalized.semanticStatus
    })
  );
  const losses = normalizeNativeLossRecords(normalized.losses ?? []);
  const semanticIndex = createSemanticIndexRecord({
    id: input?.semanticIndexId ?? normalized.semanticIndexId ?? `index_${idPart}_${idFragment(format)}`,
    repository: normalized.repository,
    documents: normalized.documents,
    symbols: normalized.symbols,
    occurrences: normalized.occurrences,
    relations: normalized.relations,
    facts: normalized.facts,
    evidence,
    metadata: {
      format,
      parser: context.parser,
      source: 'external-semantic-index',
      projectRoot: context.projectRoot,
      semanticStatus: normalized.semanticStatus,
      ...normalized.metadata,
      ...context.metadata
    }
  });
  const sourceMapMappings = externalSemanticSourceMapMappings(semanticIndex, {
    evidence,
    losses,
    sourcePath: context.sourcePath,
    sourceHash: context.sourceHash
  });
  const sourceMaps = sourceMapMappings.length
    ? [createSourceMapRecord({
      id: input?.sourceMapId ?? `source_map_${idPart}_${idFragment(format)}`,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      semanticIndexId: semanticIndex.id,
      mappings: sourceMapMappings,
      evidence,
      metadata: {
        format,
        source: 'external-semantic-index',
        projectRoot: context.projectRoot
      }
    })]
    : [];
  const document = createDocument({
    id: input?.documentId ?? `document_${idPart}_${idFragment(format)}`,
    name: input?.documentName ?? context.sourcePath ?? `${format} semantic index`,
    nodes: [],
    rootIds: [],
    metadata: {
      sourceLanguage: context.language,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      semanticStatus: normalized.semanticStatus,
      externalSemanticIndexFormat: format
    }
  });
  const universalAst = createUniversalAstEnvelope({
    id: input?.universalAstId ?? `universal_ast_${idPart}_${idFragment(format)}`,
    document,
    nativeSources: [],
    semanticIndex,
    sourceMaps,
    losses,
    evidence,
    metadata: {
      sourceLanguage: context.language,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      projectRoot: context.projectRoot,
      externalSemanticIndexFormat: format,
      semanticStatus: normalized.semanticStatus,
      ...input?.universalAstMetadata
    }
  });
  const readiness = classifyNativeImportReadiness(losses, {
    evidence,
    parser: context.parser,
    scanKind: 'external-semantic-index',
    semanticStatus: normalized.semanticStatus
  });
  return {
    kind: 'frontier.lang.externalSemanticIndexImport',
    version: 1,
    id: input?.id ?? `external_semantic_index_${idPart}_${idFragment(format)}`,
    format,
    language: context.language,
    sourcePath: context.sourcePath,
    projectRoot: context.projectRoot,
    semanticIndex,
    universalAst,
    sourceMaps,
    ownershipRegions,
    losses,
    evidence,
    readiness,
    summary: {
      documents: semanticIndex.documents.length,
      symbols: semanticIndex.symbols.length,
      occurrences: semanticIndex.occurrences.length,
      relations: semanticIndex.relations.length,
      facts: semanticIndex.facts.length,
      ownershipRegions: ownershipRegions.length,
      ownershipRegionKinds: [...new Set(ownershipRegions.map((region) => region.regionKind).filter(Boolean))],
      sourceMapMappings: sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap.mappings?.length ?? 0), 0),
      losses: losses.length,
      readiness: readiness.readiness
    },
    metadata: {
      format,
      parser: context.parser,
      semanticStatus: normalized.semanticStatus,
      payloadHash: hashSemanticValue(payload),
      ...normalized.metadata,
      ...context.metadata
    }
  };
}
