import{maxSemanticMergeReadiness,uniqueByEvidenceId,uniqueByLossId,uniqueStrings}from'../../native-import-utils.js';import{validateUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';
import{classifyNativeImportReadiness}from'./classifyNativeImportReadiness.js';import{nativeImportEntries}from'./nativeImportEntries.js';import{nativeImportHasExactAstCoverage}from'./nativeImportHasExactAstCoverage.js';import{nativeImportRoundtripParser}from'./nativeImportRoundtripParser.js';import{nativeImportRoundtripReasons}from'./nativeImportRoundtripReasons.js';import{projectNativeImportToSource}from'./projectNativeImportToSource.js';
export function classifyNativeImportRoundtripReadiness(importResult, options = {}) {
  if (!importResult || typeof importResult !== 'object') {
    throw new Error('classifyNativeImportRoundtripReadiness requires a native import result');
  }
  const imports = nativeImportEntries(importResult);
  const importLosses = uniqueByLossId([
    ...(importResult.losses ?? []),
    ...imports.flatMap((imported) => imported?.losses ?? [])
  ]);
  const importEvidence = uniqueByEvidenceId([
    ...(importResult.evidence ?? []),
    ...imports.flatMap((imported) => imported?.evidence ?? [])
  ]);
  const exactAst = imports.length > 0 && imports.every((imported) => nativeImportHasExactAstCoverage(imported));
  const importReadiness = classifyNativeImportReadiness(importLosses, {
    exactAst,
    evidence: importEvidence,
    parser: nativeImportRoundtripParser(importResult, imports),
    scanKind: importResult.metadata?.nativeImportLossSummary?.scanKind,
    semanticStatus: importResult.metadata?.semanticStatus ?? importResult.universalAst?.metadata?.semanticStatus
  });
  const projection = options.projection ?? projectNativeImportToSource(importResult, options);
  const projectionReadiness = projection.readiness ?? classifyNativeImportReadiness(projection.losses ?? [], {
    evidence: projection.evidence,
    parser: projection.metadata?.nativeImportLossSummary?.parser,
    scanKind: 'native-source-projection'
  });
  const universalAst = importResult.universalAst;
  const universalAstIssues = universalAst
    ? validateUniversalAstEnvelope(universalAst)
    : ['missing-universal-ast'];
  const universalAstNativeSources = universalAst?.nativeSources?.length ?? importResult.nativeSources?.length ?? (importResult.nativeSource ? 1 : 0);
  const semanticIndex = importResult.semanticIndex ?? universalAst?.semanticIndex;
  const semanticSymbols = semanticIndex?.symbols?.length ?? 0;
  const sourceMaps = importResult.sourceMaps ?? universalAst?.sourceMaps ?? [];
  const sourceMapMappings = sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap?.mappings?.length ?? 0), 0);
  const projectionMatchesSourceHash = Boolean(projection.sourceHash && projection.outputHash === projection.sourceHash);
  const preservedSource = projection.mode === 'preserved-source';
  const failedEvidenceIds = uniqueStrings([
    ...importEvidence.filter((record) => record?.status === 'failed').map((record) => record.id),
    ...(projection.evidence ?? []).filter((record) => record?.status === 'failed').map((record) => record.id)
  ]);
  const blockingReasons = [
    ...(importReadiness.readiness === 'blocked' ? importReadiness.reasons : []),
    ...(projectionReadiness.readiness === 'blocked' ? projectionReadiness.reasons : []),
    ...(failedEvidenceIds.length ? [`Failed evidence prevents native roundtrip readiness: ${failedEvidenceIds.join(', ')}`] : []),
    ...(universalAstIssues.length ? [`Universal AST validation failed: ${universalAstIssues.join('; ')}`] : [])
  ];
  const reviewReasons = [
    ...(semanticSymbols === 0 ? ['Universal AST semantic index has no symbols for source projection review.'] : []),
    ...(sourceMapMappings === 0 ? ['Universal AST has no native source-map mappings for roundtrip review.'] : []),
    ...(preservedSource && !projectionMatchesSourceHash ? ['Projected source was preserved without a verified import source hash match.'] : []),
    ...importReadiness.reasons.filter((reason) => importReadiness.readiness !== 'ready' || !exactAst),
    ...projectionReadiness.reasons.filter((reason) => projectionReadiness.readiness !== 'ready')
  ];
  let status;
  if (blockingReasons.length) {
    status = 'blocked';
  } else if (projection.mode === 'native-source-stubs') {
    status = 'stub-only';
  } else if (reviewReasons.some((reason) => reason.startsWith('Universal AST')) || (preservedSource && !projectionMatchesSourceHash)) {
    status = 'needs-review';
  } else if (exactAst && preservedSource && projectionMatchesSourceHash && projectionReadiness.readiness === 'ready') {
    status = 'exact';
  } else if (preservedSource && projectionMatchesSourceHash) {
    status = 'preserved-source';
  } else {
    status = 'needs-review';
  }
  const reasons = nativeImportRoundtripReasons(status, {
    blockingReasons,
    reviewReasons,
    projection,
    importReadiness,
    projectionReadiness
  });
  return {
    kind: 'frontier.lang.nativeImportRoundtripReadiness',
    version: 1,
    status,
    semanticMergeReadiness: maxSemanticMergeReadiness(importReadiness.readiness, projectionReadiness.readiness),
    reasons,
    importReadiness,
    projectionReadiness,
    projectionMode: projection.mode,
    checks: {
      nativeImport: {
        imports: imports.length,
        exactAst,
        losses: importReadiness.summary.total,
        readiness: importReadiness.readiness
      },
      universalAst: {
        present: Boolean(universalAst),
        valid: universalAstIssues.length === 0,
        issues: universalAstIssues,
        nativeSources: universalAstNativeSources,
        semanticSymbols,
        sourceMaps: sourceMaps.length,
        sourceMapMappings
      },
      projectedSource: {
        mode: projection.mode,
        outputHash: projection.outputHash,
        expectedSourceHash: projection.sourceHash,
        sourceHashVerified: projectionMatchesSourceHash,
        declarations: projection.declarations?.length ?? 0,
        losses: projection.lossSummary?.total ?? projection.losses?.length ?? 0,
        readiness: projectionReadiness.readiness
      }
    },
    evidence: {
      importEvidenceIds: importEvidence.map((record) => record.id).filter(Boolean),
      projectionEvidenceIds: (projection.evidence ?? []).map((record) => record.id).filter(Boolean),
      failedEvidenceIds
    },
    metadata: {
      nativeImportId: importResult.id,
      universalAstId: universalAst?.id,
      projectionId: projection.id,
      sourcePath: projection.sourcePath ?? importResult.sourcePath,
      language: projection.language ?? importResult.language,
      sourcePreservationId: projection.metadata?.sourcePreservationId,
      ...options.metadata
    }
  };
}
