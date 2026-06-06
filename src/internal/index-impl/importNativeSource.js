import{commonGeneratedTargetPath,idFragment}from'../../native-import-utils.js';import{inferSourceMapMappings,normalizeSourceMapMappings,normalizeSourceMaps}from'../../native-source-maps.js';import{createKernelSourcePreservationRecords,summarizeKernelSourcePreservationRecords}from'../../semantic-import-source-preservation.js';import{createDocument,createImportResult,createNativeAstRecord,createPatch,createSourceMapRecord,createUniversalAstEnvelope,hashSemanticValue,nativeSourceNode}from'@shapeshift-labs/frontier-lang-kernel';
import{attachInputUniversalDialectRegistry}from'../../universal-dialect-registry.js';
import{attachNativeImportLossSummary}from'./attachNativeImportLossSummary.js';import{createLightweightNativeImport}from'./createLightweightNativeImport.js';import{createNativeSourcePreservation}from'./createNativeSourcePreservation.js';import{hasNativeExactAstEvidence}from'./hasNativeExactAstEvidence.js';import{normalizeNativeLossRecords}from'./normalizeNativeLossRecords.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';import{unverifiedNativeAstLosses}from'./unverifiedNativeAstLosses.js';import{withNativeImportReadiness}from'./withNativeImportReadiness.js';
export function importNativeSource(input) {
  const language = input.language ?? input.nativeAst?.language;
  if (!language) throw new Error('importNativeSource requires a language or nativeAst.language');
  const sourcePath = input.sourcePath ?? input.nativeAst?.sourcePath;
  const declaredSourceHash = input.sourceHash ?? input.nativeAst?.sourceHash;
  const sourceHash = typeof input.sourceText === 'string'
    ? hashSemanticValue(input.sourceText)
    : declaredSourceHash ?? hashSemanticValue(input.nativeAst?.nodes ?? input.nativeAst ?? {});
  const targetPath = input.targetPath ?? input.target?.emitPath;
  const targetHash = input.targetHash;
  const importIdPart = idFragment(input.id ?? input.nativeSourceId ?? sourcePath ?? language);
  const sourcePreservation = input.sourcePreservation ?? (typeof input.sourceText === 'string'
    ? createNativeSourcePreservation({
      language,
      sourcePath,
      sourceHash: declaredSourceHash,
      sourceText: input.sourceText,
      metadata: { importIdPart }
    })
    : undefined);
  const lightweight = !input.nativeAst && !input.nodes && input.sourceText
    ? createLightweightNativeImport({
      language,
      sourceText: input.sourceText,
      sourcePath,
      sourceHash,
      parser: input.parser,
      sourcePreservation
    })
    : undefined;
  const nativeAst = input.nativeAst ?? createNativeAstRecord({
    id: input.nativeAstId ?? `native_ast_${importIdPart}`,
    language,
    parser: input.parser ?? lightweight?.parser,
    parserVersion: input.parserVersion,
    sourcePath,
    sourceHash,
    rootId: input.rootId ?? lightweight?.rootId ?? 'native_root',
    nodes: input.nodes ?? lightweight?.nodes ?? {
      native_root: {
        id: 'native_root',
        kind: 'Unknown',
        languageKind: `${language}.unknown`,
        value: null,
        metadata: { reason: 'no-native-ast-nodes-provided' }
      }
    },
    losses: input.losses ?? lightweight?.losses,
    metadata: {
      ...(input.sourceText ? { sourceBytes: input.sourceText.length } : {}),
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary,
        sourcePreservation
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      ...lightweight?.metadata,
      ...input.nativeAstMetadata
    }
  });
  const frontierNodeIds = input.frontierNodeIds ?? input.semanticNodes?.map((node) => node.id) ?? [];
  const semanticNodes = input.semanticNodes ?? [];
  const semanticStatus = input.semanticStatus ?? (semanticNodes.length ? 'mapped' : 'native-only');
  const nativeAstExact = hasNativeExactAstEvidence(input, nativeAst, lightweight);
  const baseLosses = normalizeNativeLossRecords(input.losses ?? nativeAst.losses ?? lightweight?.losses ?? []);
  const losses = normalizeNativeLossRecords([
    ...baseLosses,
    ...unverifiedNativeAstLosses(input, nativeAst, {
      importIdPart,
      exactAst: nativeAstExact,
      hasLosses: baseLosses.length > 0,
      lightweight
    })
  ]);
  const nativeSource = nativeSourceNode({
    id: input.nativeSourceId ?? `native_source_${importIdPart}`,
    name: input.name ?? sourcePath?.split(/[\\/]/).filter(Boolean).at(-1) ?? `${language}NativeSource`,
    language,
    parser: input.parser ?? nativeAst.parser,
    parserVersion: input.parserVersion ?? nativeAst.parserVersion,
    sourcePath,
    sourceHash,
    symbol: input.symbol,
    ast: nativeAst,
    frontierNodeIds,
    losses,
    target: input.target,
    metadata: {
      semanticStatus,
      mappings: input.mappings ?? [],
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservation
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      ...input.nativeSourceMetadata
    }
  });
  const document = createDocument({
    id: input.documentId ?? `document_${importIdPart}`,
    name: input.documentName ?? nativeSource.name,
    nodes: [...semanticNodes, nativeSource],
    rootIds: input.rootIds,
    metadata: {
      sourceLanguage: language,
      semanticStatus,
      ...input.documentMetadata
    }
  });
  const baseEvidence = input.evidence ?? [{
    id: input.evidenceId ?? `evidence_${importIdPart}_import`,
    kind: 'import',
    status: losses.some((loss) => loss.severity === 'error') ? 'failed' : 'passed',
    path: sourcePath,
    summary: `Imported ${language} native source with ${Object.keys(nativeAst.nodes).length} native AST node(s), ${semanticNodes.length} semantic node(s), and ${losses.length} loss record(s).`,
    metadata: {
      parser: nativeAst.parser,
      sourcePath,
      semanticStatus,
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {})
    }
  }];
  const lossSummary = summarizeNativeImportLosses(losses, {
    exactAst: nativeAstExact,
    evidence: baseEvidence,
    parser: nativeAst.parser,
    scanKind: lightweight?.metadata?.scanKind,
    semanticStatus
  });
  const evidence = attachNativeImportLossSummary(baseEvidence, lossSummary);
  const semanticIndex = input.semanticIndex ?? lightweight?.semanticIndex;
  const sourceMapMappings = normalizeSourceMapMappings(
    input.mappings ?? lightweight?.mappings ?? inferSourceMapMappings({
      semanticIndex,
      nativeAst,
      nativeSource,
      evidence
    }),
    {
      semanticIndex,
      nativeAst,
      nativeSource,
      evidence,
      losses,
      sourcePreservation,
      target: input.target,
      targetPath,
      targetHash
    }
  );
  const inferredTargetPath = targetPath ?? commonGeneratedTargetPath(sourceMapMappings);
  const inferredSourceMaps = sourceMapMappings.length
    ? [createSourceMapRecord({
      id: input.sourceMapId ?? `source_map_${importIdPart}`,
      sourcePath,
      sourceHash,
      target: input.target,
      targetPath: inferredTargetPath,
      targetHash,
      semanticIndexId: semanticIndex?.id,
      nativeAstId: nativeAst.id,
      nativeSourceId: nativeSource.id,
      mappings: sourceMapMappings,
      evidence,
      metadata: {
        sourceLanguage: language,
        parser: nativeAst.parser,
        semanticStatus
      }
    })]
    : [];
  const sourceMaps = normalizeSourceMaps(input.sourceMaps ?? inferredSourceMaps, {
    document,
    nativeSources: [nativeSource],
    nativeAst,
    nativeSource,
    semanticIndex,
    evidence,
    losses,
    sourcePreservation,
    target: input.target,
    targetPath: inferredTargetPath,
    targetHash,
    sourcePath,
    sourceHash,
    defaultSourceMapId: `source_map_${importIdPart}`
  });
  const sourcePreservationRecords = createKernelSourcePreservationRecords({
    idPart: importIdPart,
    language,
    sourcePath,
    sourceHash,
    sourcePreservation,
    sourceMaps,
    losses,
    evidence,
    nativeSource,
    nativeAst,
    semanticIndex
  });
  const kernelSourcePreservationSummary = summarizeKernelSourcePreservationRecords(sourcePreservationRecords);
  const resultSourceMapMappings = sourceMaps.flatMap((sourceMap) => sourceMap.mappings ?? []);
  let universalAst = createUniversalAstEnvelope({
    id: input.universalAstId ?? `universal_ast_${importIdPart}`,
    document,
    nativeSources: [nativeSource],
    semanticIndex,
    sourceMaps,
    losses,
    evidence,
    metadata: {
      sourceLanguage: language,
      sourcePath,
      semanticStatus,
      nativeImportLossSummary: lossSummary,
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservation
      } : {}),
      ...(sourcePreservationRecords.length ? {
        sourcePreservationRecords,
        kernelSourcePreservationRecords: sourcePreservationRecords,
        kernelSourcePreservationSummary
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      ...input.universalAstMetadata
    }
  });
  universalAst = attachInputUniversalDialectRegistry(universalAst, input, { language, sourcePath });
  const patch = input.patch ?? createPatch({
    id: input.patchId ?? `patch_${importIdPart}_import`,
    author: input.author ?? '@shapeshift-labs/frontier-lang-compiler/importNativeSource',
    risk: losses.some((loss) => loss.severity === 'error') ? 'high' : losses.length ? 'medium' : 'low',
    operations: [...semanticNodes, nativeSource].map((node) => ({
      op: 'upsertNode',
      node,
      touches: [{ id: node.id, access: node.kind === 'nativeSource' ? 'evidence' : 'schema' }]
    })),
    evidence,
    metadata: {
      sourceLanguage: language,
      sourcePath,
      semanticIndexId: semanticIndex?.id,
      universalAstId: universalAst.id,
      sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id),
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary
      } : {}),
      ...(sourcePreservationRecords.length ? {
        kernelSourcePreservationRecordIds: sourcePreservationRecords.map((record) => record.id),
        kernelSourcePreservationSummary
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      nativeImportLossSummary: lossSummary
    }
  });
  const importResult = createImportResult({
    id: input.id ?? `import_${importIdPart}`,
    language,
    sourcePath,
    document,
    patch,
    nativeAst,
    semanticIndex,
    universalAst,
    sourceMaps,
    losses,
    evidence,
    metadata: {
      nativeSourceId: nativeSource.id,
      semanticIndexId: semanticIndex?.id,
      universalAstId: universalAst.id,
      sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id),
      semanticStatus,
      mappings: resultSourceMapMappings,
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservation
      } : {}),
      ...(sourcePreservationRecords.length ? {
        sourcePreservationRecords,
        kernelSourcePreservationRecords: sourcePreservationRecords,
        kernelSourcePreservationSummary
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      nativeImportLossSummary: lossSummary,
      ...input.metadata
    }
  });
  return { ...withNativeImportReadiness(importResult, lossSummary), nativeSource };
}
