import { uniqueRecordsById, uniqueStrings } from '../../native-import-utils.js';
import { semanticOwnershipRegionsFromSemanticIndex } from '../../semantic-import-regions.js';

export function summarizeSemanticAdmissionWarnings(imported, context = {}) {
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  const symbols = semanticSymbolsForImport(imported, semanticIndex);
  const ownershipRegions = semanticOwnershipRegionsForImport(imported, semanticIndex);
  const patchHints = semanticPatchHintsForImport(imported, semanticIndex);
  const sourcePath = firstString(context.sourcePath, context.source?.sourcePath, imported?.sourcePath, imported?.nativeSource?.sourcePath, imported?.nativeAst?.sourcePath, semanticIndex?.documents?.[0]?.path);
  const semanticImportExpected = isSemanticImportExpected(imported, context);
  const semanticImportExpectedEmpty = isSemanticImportExpectedEmpty(imported, context);
  const changedSource = isChangedSemanticAdmissionSource(imported, { ...context, sourcePath });
  const warnings = [];
  if (semanticImportExpected && !semanticImportExpectedEmpty && changedSource && symbols.length > 0 && ownershipRegions.length === 0) {
    warnings.push(semanticAdmissionWarning({
      code: 'missing-ownership-regions',
      message: 'Semantic import was expected for a changed source and produced symbols, but no ownership regions were available.',
      action: 'rerun-sidecar-generation-with-ownership-regions',
      sourcePath,
      symbols,
      ownershipRegions,
      patchHints,
      semanticImportExpected,
      changedSource
    }));
  }
  if (semanticImportExpected && !semanticImportExpectedEmpty && changedSource && symbols.length > 0 && patchHints.length === 0) {
    warnings.push(semanticAdmissionWarning({
      code: 'missing-patch-hints',
      message: 'Semantic import was expected for a changed source and produced symbols, but no patch hints were available.',
      action: 'generate-semantic-patch-hints',
      sourcePath,
      symbols,
      ownershipRegions,
      patchHints,
      semanticImportExpected,
      changedSource
    }));
  }
  return {
    semanticImportExpected,
    semanticImportExpectedEmpty,
    changedSource,
    symbolCount: symbols.length,
    ownershipRegionCount: ownershipRegions.length,
    patchHintCount: patchHints.length,
    warningCount: warnings.length,
    reasonCodes: uniqueStrings(warnings.map((warning) => warning.reasonCode)),
    warnings
  };
}

function semanticAdmissionWarning(input) {
  return {
    code: input.code,
    reasonCode: input.code,
    severity: 'warning',
    message: input.message,
    action: input.action,
    ...(input.sourcePath ? { sourcePath: input.sourcePath } : {}),
    sourcePaths: uniqueStrings([input.sourcePath].filter(Boolean)),
    semanticSymbols: input.symbols.length,
    ownershipRegions: input.ownershipRegions.length,
    patchHints: input.patchHints.length,
    semanticImportExpected: input.semanticImportExpected,
    changedSource: input.changedSource
  };
}

function semanticSymbolsForImport(imported, semanticIndex) {
  if (Array.isArray(semanticIndex?.symbols)) return semanticIndex.symbols;
  for (const symbols of [
    imported?.semanticSymbols,
    imported?.symbols,
    imported?.metadata?.semanticSymbols,
    imported?.metadata?.symbols
  ]) {
    if (Array.isArray(symbols)) return symbols;
  }
  return [];
}

function semanticOwnershipRegionsForImport(imported, semanticIndex) {
  return uniqueRecordsById([
    ...(Array.isArray(imported?.ownershipRegions) ? imported.ownershipRegions : []),
    ...(Array.isArray(imported?.semanticOwnershipRegions) ? imported.semanticOwnershipRegions : []),
    ...semanticOwnershipRegionsFromSemanticIndex(semanticIndex),
    ...(Array.isArray(imported?.universalAst?.ownershipRegions) ? imported.universalAst.ownershipRegions : []),
    ...(Array.isArray(imported?.metadata?.ownershipRegions) ? imported.metadata.ownershipRegions : [])
  ]);
}

function semanticPatchHintsForImport(imported, semanticIndex) {
  return uniqueRecordsById([
    ...(Array.isArray(imported?.patchHints) ? imported.patchHints : []),
    ...(Array.isArray(imported?.semanticPatchHints) ? imported.semanticPatchHints : []),
    ...(Array.isArray(semanticIndex?.patchHints) ? semanticIndex.patchHints : []),
    ...(Array.isArray(imported?.universalAst?.patchHints) ? imported.universalAst.patchHints : []),
    ...(Array.isArray(imported?.metadata?.patchHints) ? imported.metadata.patchHints : [])
  ]);
}

function isSemanticImportExpected(imported, context) {
  return semanticExpectationRecords(imported, context).some((entry) =>
    entry.semanticImportExpected === true
    || entry.expectedSemanticImport === true
    || entry.semanticSidecarExpected === true
    || entry.expected === true && looksLikeSemanticSidecarQuality(entry)
  );
}

function isSemanticImportExpectedEmpty(imported, context) {
  return semanticExpectationRecords(imported, context).some((entry) =>
    entry.semanticImportExpectedEmpty === true
    || entry.expectedSemanticImportEmpty === true
    || entry.semanticSidecarExpectedEmpty === true
    || entry.expectedEmpty === true && looksLikeSemanticSidecarQuality(entry)
  );
}

function isChangedSemanticAdmissionSource(imported, context) {
  const sourcePath = context.sourcePath;
  const changedSourcePaths = uniqueStrings([
    ...(context.projectResult?.changedSourcePaths ?? []),
    ...(context.projectResult?.metadata?.changedSourcePaths ?? []),
    ...(context.projectResult?.metadata?.semanticChangedSourcePaths ?? []),
    ...(context.projectResult?.metadata?.semanticImportChangedSourcePaths ?? [])
  ]);
  return Boolean(
    (context.candidates?.length ?? 0) > 0
    || (sourcePath && changedSourcePaths.includes(sourcePath))
    || semanticExpectationRecords(imported, context).some((entry) =>
      entry.changedSource === true
      || entry.sourceChanged === true
      || entry.semanticSourceChanged === true
      || entry.semanticImportChangedSource === true
    )
  );
}

function semanticExpectationRecords(imported, context) {
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  return [
    context.projectResult?.metadata,
    context.source?.metadata,
    imported?.metadata,
    imported?.nativeSource?.metadata,
    nativeAst?.metadata,
    imported?.universalAst?.metadata,
    imported?.patch?.metadata,
    semanticIndex?.metadata,
    imported?.semanticSidecarQuality,
    imported?.sidecarQuality,
    imported?.semanticSidecar?.quality,
    imported?.sidecar?.quality,
    imported?.metadata?.semanticSidecarQuality,
    imported?.metadata?.sidecarQuality,
    imported?.patch?.metadata?.semanticSidecarQuality
  ].filter((entry) => entry && typeof entry === 'object');
}

function looksLikeSemanticSidecarQuality(value) {
  return value && typeof value === 'object' && (
    value.schema === 'frontier.lang.semanticSidecarQuality.v1'
    || value.imported !== undefined
    || value.expectedSatisfied !== undefined
    || value.warningCount !== undefined
    || value.proofSummary !== undefined
  );
}

function firstString(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value)) return String(value);
  }
  return undefined;
}
