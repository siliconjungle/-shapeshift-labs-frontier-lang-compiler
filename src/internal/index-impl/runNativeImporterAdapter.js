import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{adapterDiagnosticsEvidence}from'./adapterDiagnosticsEvidence.js';import{adapterDiagnosticToLoss}from'./adapterDiagnosticToLoss.js';import{importNativeSource}from'./importNativeSource.js';import{mergeNativeLosses}from'./mergeNativeLosses.js';import{normalizeAdapterDiagnostics}from'./normalizeAdapterDiagnostics.js';import{normalizeNativeImporterAdapter}from'./normalizeNativeImporterAdapter.js';import{observeNativeImporterAdapterCoverage}from'./observeNativeImporterAdapterCoverage.js';import{serializableDiagnostic}from'./serializableDiagnostic.js';
export async function runNativeImporterAdapter(adapter, input = {}) {
  const summary = normalizeNativeImporterAdapter(adapter);
  const language = input.language ?? summary.language;
  const parser = input.parser ?? summary.parser;
  const parserVersion = input.parserVersion ?? summary.version;
  const sourceText = input.sourceText ?? '';
  const sourceHash = input.sourceHash ?? hashSemanticValue(sourceText);
  const parseInput = {
    sourceText,
    sourcePath: input.sourcePath,
    sourceHash,
    language,
    parser,
    parserVersion,
    adapterId: summary.id,
    adapterVersion: summary.version,
    options: input.adapterOptions ?? {},
    metadata: input.adapterMetadata ?? {}
  };
  let parsed;
  let thrownDiagnostic;
  try {
    parsed = await adapter.parse(parseInput);
  } catch (error) {
    thrownDiagnostic = {
      severity: 'error',
      code: 'adapter.parse.threw',
      phase: 'parse',
      kind: 'unsupportedSyntax',
      message: error instanceof Error ? error.message : String(error),
      metadata: {
        errorName: error instanceof Error ? error.name : undefined
      }
    };
    parsed = {
      rootId: 'adapter_error_root',
      nodes: {
        adapter_error_root: {
          id: 'adapter_error_root',
          kind: 'AdapterParseError',
          languageKind: `${language}.adapterParseError`,
          value: thrownDiagnostic.message,
          metadata: { adapterId: summary.id, parser }
        }
      }
    };
  }
  const parseResult = parsed ?? {};
  const diagnostics = [
    ...normalizeAdapterDiagnostics(summary.diagnostics, summary, parseInput, 'adapter'),
    ...(thrownDiagnostic ? normalizeAdapterDiagnostics([thrownDiagnostic], summary, parseInput, 'throw') : []),
    ...normalizeAdapterDiagnostics(parseResult.diagnostics, summary, parseInput, 'parse')
  ];
  const losses = mergeNativeLosses(
    parseResult.losses,
    diagnostics.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, summary, parseInput))
  );
  const adapterSummary = {
    ...summary,
    coverage: observeNativeImporterAdapterCoverage(summary.coverage, parseResult, {
      diagnostics,
      losses
    })
  };
  const sourceEvidence = adapterDiagnosticsEvidence(adapterSummary, diagnostics, {
    language,
    parser,
    parserVersion,
    sourcePath: parseResult.sourcePath ?? input.sourcePath,
    sourceHash: parseResult.sourceHash ?? sourceHash
  });
  const evidence = [...(input.evidence ?? []), ...(parseResult.evidence ?? []), sourceEvidence];
  const importInput = {
    ...input,
    ...parseResult,
    language,
    parser,
    parserVersion,
    sourceText,
    sourcePath: parseResult.sourcePath ?? input.sourcePath,
    sourceHash: parseResult.sourceHash ?? sourceHash,
    losses,
    evidence,
    metadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      adapterCapabilities: adapterSummary.capabilities,
      adapterCoverage: adapterSummary.coverage,
      supportedExtensions: adapterSummary.supportedExtensions,
      diagnostics: diagnostics.map(serializableDiagnostic),
      ...input.metadata,
      ...parseResult.metadata
    },
    nativeAstMetadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      parser,
      adapterCoverage: adapterSummary.coverage,
      ...input.nativeAstMetadata,
      ...parseResult.nativeAstMetadata
    },
    nativeSourceMetadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      parser,
      adapterCoverage: adapterSummary.coverage,
      ...input.nativeSourceMetadata,
      ...parseResult.nativeSourceMetadata
    },
    documentMetadata: {
      nativeImporterAdapterId: summary.id,
      nativeImporterAdapterVersion: summary.version,
      ...input.documentMetadata,
      ...parseResult.documentMetadata
    },
    universalAstMetadata: {
      nativeImporterAdapterId: summary.id,
      nativeImporterAdapterVersion: summary.version,
      ...input.universalAstMetadata,
      ...parseResult.universalAstMetadata
    }
  };
  return {
    ...importNativeSource(importInput),
    adapter: adapterSummary,
    diagnostics
  };
}
