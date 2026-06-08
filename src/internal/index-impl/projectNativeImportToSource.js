import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{classifyNativeImportReadiness}from'./classifyNativeImportReadiness.js';import{createNativeRoundtripEvidence}from'./createNativeRoundtripEvidence.js';import{nativeImportProjectionContext}from'./nativeImportProjectionContext.js';import{nativeProjectionDeclarations}from'./nativeProjectionDeclarations.js';import{nativeProjectionReview}from'./nativeProjectionReview.js';import{nativeProjectionSourceCandidate}from'./nativeProjectionSourceCandidate.js';import{nativeProjectionStubLosses}from'./nativeProjectionStubLosses.js';import{renderNativeProjectionStubs}from'./renderNativeProjectionStubs.js';import{summarizeNativeImportLosses}from'./summarizeNativeImportLosses.js';
export function projectNativeImportToSource(importResult, options = {}) {
  if (!importResult || typeof importResult !== 'object') {
    throw new Error('projectNativeImportToSource requires a native import result');
  }
  const context = nativeImportProjectionContext(importResult, options);
  const candidateSource = nativeProjectionSourceCandidate(context, options);
  const declarations = nativeProjectionDeclarations(importResult, context);
  const preserveSource = options.preferPreservedSource !== false && candidateSource?.exact === true;
  const mode = preserveSource ? 'preserved-source' : 'native-source-stubs';
  const sourceText = preserveSource
    ? candidateSource.sourceText
    : renderNativeProjectionStubs(context, declarations, options);
  const losses = preserveSource ? [] : nativeProjectionStubLosses(context, candidateSource, declarations, options);
  const evidence = [{
    id: options.evidenceId ?? `evidence_${context.idPart}_native_source_projection`,
    kind: 'projection',
    status: losses.some((loss) => loss.severity === 'error') ? 'failed' : 'passed',
    path: context.sourcePath,
    summary: preserveSource
      ? `Preserved exact ${context.language} source for native projection.`
      : `Projected ${context.language} native import to ${declarations.length} declaration stub(s).`,
    metadata: {
      mode,
      language: context.language,
      sourcePath: context.sourcePath,
      expectedSourceHash: context.sourceHash,
      providedSourceHash: candidateSource?.sourceHash,
      sourcePreservationId: candidateSource?.sourcePreservationId,
      sourceHashVerified: candidateSource?.hashVerified ?? false,
      declarationCount: declarations.length
    }
  }];
  const lossSummary = summarizeNativeImportLosses(losses, {
    evidence,
    parser: context.parser,
    scanKind: 'native-source-projection',
    semanticStatus: context.semanticStatus
  });
  const readiness = classifyNativeImportReadiness(losses, {
    evidence,
    parser: context.parser,
    scanKind: 'native-source-projection',
    semanticStatus: context.semanticStatus
  });
  const nativeImportLossSummary = importResult.metadata?.nativeImportLossSummary ?? summarizeNativeImportLosses(importResult.losses ?? context.nativeAst?.losses ?? [], {
    evidence: importResult.evidence,
    parser: context.parser,
    semanticStatus: context.semanticStatus
  });
  const projectionReview = nativeProjectionReview({
    mode, language: context.language, sourcePath: context.sourcePath,
    exactSourceAvailable: candidateSource?.exact === true,
    sourceTextAvailable: typeof candidateSource?.sourceText === 'string',
    sourceHashVerified: candidateSource?.hashVerified ?? false,
    declarationCount: declarations.length, losses, readiness: readiness.readiness
  });
  evidence[0].metadata.projectionReview = projectionReview;
  const result = {
    kind: 'frontier.lang.nativeSourceProjection',
    version: 1,
    id: options.id ?? `native_source_projection_${context.idPart}`,
    language: context.language,
    sourcePath: context.sourcePath,
    sourceHash: context.sourceHash,
    mode,
    sourceText,
    outputHash: hashSemanticValue(sourceText),
    declarations,
    losses,
    lossSummary,
    readiness,
    evidence,
    metadata: {
      nativeImportId: importResult.id,
      nativeSourceId: context.nativeSource?.id,
      nativeAstId: context.nativeAst?.id,
      semanticIndexId: context.semanticIndex?.id,
      universalAstId: importResult.universalAst?.id,
      exactSourceAvailable: candidateSource?.exact === true,
      sourceTextAvailable: typeof candidateSource?.sourceText === 'string',
      sourcePreservationId: candidateSource?.sourcePreservationId,
      sourceHashVerified: candidateSource?.hashVerified ?? false,
      nativeImportLossSummary,
      projectionReview,
      ...options.metadata
    }
  };
  const roundtripEvidence = createNativeRoundtripEvidence(importResult, { projection: result });
  return {
    ...result,
    evidence: [...evidence, roundtripEvidence],
    metadata: {
      ...result.metadata,
      roundtripEvidence: roundtripEvidence.metadata.roundtripEvidence
    }
  };
}
