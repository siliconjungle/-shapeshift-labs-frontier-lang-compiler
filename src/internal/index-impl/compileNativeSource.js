import{nativeLanguageCompileTarget}from'../../coverage-matrix-profiles.js';import{idFragment,uniqueByEvidenceId,uniqueByLossId}from'../../native-import-utils.js';
import{classifyNativeImportReadiness}from'./classifyNativeImportReadiness.js';import{createNativeRoundtripEvidence}from'./createNativeRoundtripEvidence.js';import{createProjectionTargetLossMatrix}from'./createProjectionTargetLossMatrix.js';import{importNativeSource}from'./importNativeSource.js';import{isNativeSourceImportResult}from'./isNativeSourceImportResult.js';import{nativeCompileSourceLanguage}from'./nativeCompileSourceLanguage.js';import{nativeCompileTarget}from'./nativeCompileTarget.js';import{nativeProjectionReview}from'./nativeProjectionReview.js';import{nativeSourceCompileEvidence}from'./nativeSourceCompileEvidence.js';import{nativeSourceCompileSourceMaps}from'./nativeSourceCompileSourceMaps.js';import{nativeSourceCompileTargetCoverage}from'./nativeSourceCompileTargetCoverage.js';import{nativeSourceCompileTargetLosses}from'./nativeSourceCompileTargetLosses.js';import{projectNativeImportToSource}from'./projectNativeImportToSource.js';import{resolveNativeTargetProjectionAdapter}from'./resolveNativeTargetProjectionAdapter.js';import{runNativeTargetProjectionAdapter}from'./runNativeTargetProjectionAdapter.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function compileNativeSource(input, options = {}) {
  const importResult = isNativeSourceImportResult(input) ? input : importNativeSource(input);
  const sourceLanguage = nativeCompileSourceLanguage(importResult, input);
  const target = nativeCompileTarget(input, importResult, options);
  const sourceTarget = nativeLanguageCompileTarget(sourceLanguage);
  const sameSourceTarget = sourceTarget === target;
  const idPart = idFragment(options.id ?? importResult.id ?? importResult.sourcePath ?? sourceLanguage ?? target);
  const id = options.id ?? `native_source_compile_${idPart}_${idFragment(target)}`;
  const projection = projectNativeImportToSource(importResult, {
    ...options,
    id: options.projectionId ?? `${id}_projection`,
    language: sameSourceTarget ? sourceLanguage : target,
    preferPreservedSource: sameSourceTarget ? options.preferPreservedSource : false,
    evidenceId: options.projectionEvidenceId ?? options.evidenceId,
    metadata: {
      sourceLanguage,
      target,
      nativeCompileResultId: id,
      ...options.metadata
    }
  });
  const projectionMatrix = createProjectionTargetLossMatrix({
    imports: [importResult],
    adapters: options.adapters,
    targetAdapters: options.targetAdapters,
    languages: options.languages,
    targets: [target],
    generatedAt: options.generatedAt
  });
  const targetCoverage = nativeSourceCompileTargetCoverage(projectionMatrix, sourceLanguage, target);
  const targetAdapter = resolveNativeTargetProjectionAdapter({
    importResult,
    sourceProjection: projection,
    sourceLanguage,
    target,
    sourcePath: importResult.sourcePath ?? importResult.nativeSource?.sourcePath,
    parser: importResult.nativeAst?.parser ?? importResult.nativeSource?.parser ?? options.parser
  }, options);
  const targetProjection = targetAdapter
    ? runNativeTargetProjectionAdapter(targetAdapter, {
      importResult,
      sourceProjection: projection,
      sourceLanguage,
      target,
      targetPath: options.targetPath,
      targetCoverage,
      options: options.targetAdapterOptions ?? {},
      metadata: {
        nativeCompileResultId: id,
        sourceLanguage,
        target,
        projectionId: projection.id,
        ...options.targetAdapterMetadata
      }
    })
    : undefined;
  const targetLosses = nativeSourceCompileTargetLosses({
    importResult,
    projection,
    targetCoverage,
    sourceLanguage,
    target,
    idPart
  });
  const output = targetProjection?.output ?? projection.sourceText;
  const outputHash = targetProjection?.outputHash ?? projection.outputHash;
  const outputMode = targetProjection ? targetProjection.outputMode : sameSourceTarget ? projection.mode : 'target-stubs';
  const compileEvidence = nativeSourceCompileEvidence({
    id: options.compileEvidenceId ?? `evidence_${idPart}_${idFragment(target)}_native_source_compile`,
    importResult,
    projection,
    targetProjection,
    targetCoverage,
    targetLosses,
    sourceLanguage,
    target,
    outputHash,
    outputMode
  });
  const evidence = uniqueByEvidenceId([
    ...(importResult.evidence ?? []),
    ...(projection.evidence ?? []),
    ...(targetProjection?.evidence ?? []),
    compileEvidence,
    ...(options.evidence ?? [])
  ]);
  const losses = uniqueByLossId([
    ...(importResult.losses ?? []),
    ...(projection.losses ?? []),
    ...(targetProjection?.losses ?? []),
    ...targetLosses,
    ...(options.losses ?? [])
  ]);
  const lossSummary = summarizeNativeImportLosses(losses, {
    evidence,
    parser: importResult.nativeAst?.parser ?? importResult.nativeSource?.parser ?? options.parser,
    scanKind: 'native-source-compile',
    semanticStatus: importResult.metadata?.semanticStatus ?? options.semanticStatus
  });
  const readiness = classifyNativeImportReadiness(losses, {
    evidence,
    parser: importResult.nativeAst?.parser ?? importResult.nativeSource?.parser ?? options.parser,
    scanKind: 'native-source-compile',
    semanticStatus: importResult.metadata?.semanticStatus ?? options.semanticStatus
  });
  const sourceMaps = options.emitSourceMap === false
    ? []
    : nativeSourceCompileSourceMaps({
      id: options.sourceMapId ?? `source_map_${idFragment(id)}_${idFragment(target)}`,
      importResult,
      projection,
      targetProjection,
      sourceLanguage,
      target,
      targetPath: options.targetPath ?? targetProjection?.targetPath,
      targetHash: options.targetHash ?? outputHash,
      output,
      outputHash,
      outputMode,
      evidence,
      losses,
      compileResultId: id
    });
  const sourceMap = sourceMaps[0];
  const projectionReview = nativeProjectionReview({
    mode: projection.mode, outputMode, language: projection.language, sourceLanguage, target,
    sourcePath: importResult.sourcePath ?? importResult.nativeSource?.sourcePath,
    exactSourceAvailable: projection.metadata?.exactSourceAvailable === true,
    sourceTextAvailable: projection.metadata?.sourceTextAvailable === true,
    sourceHashVerified: projection.metadata?.sourceHashVerified === true,
    declarationCount: projection.declarations.length, sourceMapCount: sourceMaps.length,
    losses, targetLosses, readiness: readiness.readiness, targetCoverage, targetProjection
  });
  compileEvidence.metadata.projectionReview = projectionReview;
  for (const record of sourceMaps) record.metadata = { ...(record.metadata ?? {}), projectionReview };
  const roundtripEvidence = createNativeRoundtripEvidence(importResult, {
    id: `evidence_${idPart}_${idFragment(target)}_native_roundtrip`,
    projection,
    targetProjection,
    targetCoverage,
    sourceMaps,
    losses,
    readiness,
    target,
    outputMode
  });
  const resultEvidence = uniqueByEvidenceId([...evidence, roundtripEvidence]);
  return {
    kind: 'frontier.lang.nativeSourceCompileResult',
    version: 1,
    id,
    ok: readiness.readiness !== 'blocked' || options.emitOnBlocked === true,
    target,
    language: sourceLanguage,
    sourcePath: importResult.sourcePath ?? importResult.nativeSource?.sourcePath,
    output,
    outputHash,
    outputMode,
    sourceMap,
    sourceMaps,
    importResult,
    projection,
    targetProjection,
    targetCoverage,
    projectionMatrix,
    losses,
    lossSummary,
    readiness,
    evidence: resultEvidence,
    metadata: {
      nativeImportId: importResult.id,
      nativeSourceId: importResult.nativeSource?.id,
      nativeAstId: importResult.nativeAst?.id ?? importResult.nativeSource?.ast?.id,
      semanticIndexId: importResult.semanticIndex?.id ?? importResult.universalAst?.semanticIndex?.id,
      universalAstId: importResult.universalAst?.id,
      projectionId: projection.id,
      targetProjectionId: targetProjection?.id,
      targetProjectionAdapterId: targetProjection?.adapter?.id,
      sourceMapId: sourceMap?.id,
      sourceMapIds: sourceMaps.map((record) => record.id).filter(Boolean),
      sourceMapMappings: sourceMaps.reduce((sum, record) => sum + (record.mappings?.length ?? 0), 0),
      projectionMode: projection.mode,
      outputMode,
      targetPath: sourceMap?.targetPath ?? options.targetPath ?? targetProjection?.targetPath,
      targetHash: sourceMap?.targetHash ?? options.targetHash ?? outputHash,
      sourceTarget,
      sameSourceTarget,
      targetLossClass: targetCoverage.lossClass,
      targetReadiness: targetCoverage.readiness,
      targetSupported: targetCoverage.supported,
      projectionReview,
      ...options.metadata,
      roundtripEvidence: roundtripEvidence.metadata.roundtripEvidence
    }
  };
}
