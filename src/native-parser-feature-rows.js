import {
  normalizeNativeLanguageId,
  normalizeSemanticMergeReadiness,
  uniqueStrings
} from './native-import-utils.js';
import {
  normalizeParserAstFormatId,
  parserAstFormatIdForParser
} from './coverage-matrix-profiles.js';
import {
  getNativeParserAstFormatProfile
} from './native-parser-ast-format-matrix.js';
import {
  nativeImportCoverageReasons,
  nativeImporterAdapterCoverageEntryFromImport,
  safeNativeImporterAdapterSummary,
  summarizeNativeImporterAdapterCoverageEntries
} from './native-import-coverage-matrix.js';
import {
  nativeParserControlFlowFeature,
  nativeParserMacroMetaprogrammingFeature,
  nativeParserSemanticFeature,
  nativeParserSourcePreservationFeature,
  nativeParserSyntaxFeature,
  nativeParserTypeFeature
} from './native-parser-feature-coverage.js';
import {
  nativeParserFeatureMergeAssessment
} from './native-parser-feature-assessment.js';

export function nativeParserFeatureRowsForProfiles(profiles, context, dependencies = {}) {
  const rows = [];
  for (const profile of profiles) {
    const matchingImports = nativeParserFeatureImportsForProfile(profile, context.imports);
    const matchingAdapters = nativeParserFeatureAdapterSummariesForProfile(profile, context.adapters, dependencies);
    for (const parser of nativeParserFeatureParserSlots(profile, matchingImports, matchingAdapters)) {
      const row = nativeParserFeatureRowForParser(profile, parser, {
        ...context,
        imports: matchingImports.filter((imported) => nativeParserFeatureParserMatches(nativeParserParserForImport(imported), parser)),
        adapters: matchingAdapters.filter((adapter) => nativeParserFeatureParserMatches(adapter.parser, parser))
      }, dependencies);
      if (context.includeEmptyParsers === false && row.imports.total === 0 && row.adapters.total === 0) continue;
      rows.push(row);
    }
  }
  return rows.sort((left, right) => {
    const languageOrder = left.language.localeCompare(right.language);
    return languageOrder || left.parser.localeCompare(right.parser);
  });
}

function nativeParserFeatureRowForParser(profile, parser, context, dependencies = {}) {
  const imports = context.imports ?? [];
  const adapters = context.adapters ?? [];
  const parserFormat = parserAstFormatIdForParser(parser);
  const parserProfile = getNativeParserAstFormatProfile(parserFormat);
  const adapterCoverage = summarizeNativeImporterAdapterCoverageEntries([
    ...imports.map((imported) => nativeImporterAdapterCoverageEntryFromImport(imported)).filter(Boolean),
    ...adapters.map((adapter) => ({
      adapterId: adapter.id,
      language: adapter.language,
      parser: adapter.parser,
      coverage: adapter.coverage
    }))
  ], dependencies);
  const losses = imports.flatMap((imported) => imported?.losses ?? imported?.nativeAst?.losses ?? []);
  const evidence = imports.flatMap((imported) => imported?.evidence ?? []);
  const lossSummary = dependencies.summarizeNativeImportLosses(losses, { evidence, parser });
  const semanticEvidence = nativeParserFeatureSemanticEvidence(imports, dependencies);
  const sourceMaps = imports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? []);
  const sourceMapMappings = sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap?.mappings?.length ?? 0), 0);
  const sourcePreservation = dependencies.summarizeImportSourcePreservation(undefined, imports);
  const nativeAstNodes = imports.reduce((sum, imported) => sum + Object.keys(imported?.nativeAst?.nodes ?? imported?.nativeSource?.ast?.nodes ?? {}).length, 0);
  const featureContext = {
    profile,
    parser,
    parserFormat,
    parserProfile,
    imports,
    adapters,
    adapterCoverage,
    losses,
    evidence,
    lossSummary,
    semanticEvidence,
    sourceMaps,
    sourceMapMappings,
    sourcePreservation,
    nativeAstNodes
  };
  const features = {
    syntax: nativeParserSyntaxFeature(featureContext),
    semantic: nativeParserSemanticFeature(featureContext),
    type: nativeParserTypeFeature(featureContext),
    controlFlow: nativeParserControlFlowFeature(featureContext),
    macroMetaprogramming: nativeParserMacroMetaprogrammingFeature(featureContext, dependencies),
    sourcePreservation: nativeParserSourcePreservationFeature(featureContext)
  };
  const importReadiness = imports.length
    ? lossSummary.semanticMergeReadiness
    : adapters.length ? 'needs-review' : normalizeSemanticMergeReadiness(profile.defaultReadiness) ?? 'needs-review';
  const row = {
    language: profile.language,
    aliases: profile.aliases,
    parser,
    parserFormat,
    parserAliases: uniqueStrings([...(parserProfile?.aliases ?? []), ...(parserProfile?.parserAdapters ?? [])]),
    parserAdapters: uniqueStrings([parser, ...(parserProfile?.parserAdapters ?? [])]),
    extensions: profile.extensions,
    supportsLightweightScan: profile.supportsLightweightScan,
    projectionTargets: profile.projectionTargets,
    knownLossKinds: uniqueStrings([...(profile.knownLossKinds ?? []), ...Object.keys(lossSummary.byKind)]),
    defaultReadiness: profile.defaultReadiness,
    notes: uniqueStrings([...(profile.notes ?? []), ...(parserProfile?.notes ?? [])]),
    adapters: {
      total: adapters.length,
      ids: adapters.map((adapter) => adapter.id),
      versions: uniqueStrings(adapters.map((adapter) => adapter.version).filter(Boolean)),
      exactness: uniqueStrings(adapters.map((adapter) => adapter.coverage?.exactness).filter(Boolean)),
      coverage: adapterCoverage
    },
    imports: {
      total: imports.length,
      sourcePaths: uniqueStrings(imports.map((imported) => imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? imported?.nativeAst?.sourcePath).filter(Boolean)),
      readiness: importReadiness,
      readinessReasons: imports.length ? lossSummary.readinessReasons : nativeImportCoverageReasons(profile),
      nativeAstNodes,
      symbols: semanticEvidence.symbols,
      references: semanticEvidence.references,
      types: semanticEvidence.types,
      controlFlow: semanticEvidence.controlFlow,
      sourceMaps: sourceMaps.length,
      sourceMapMappings,
      losses: lossSummary.total,
      lossKinds: lossSummary.byKind,
      lossCategories: lossSummary.categories,
      sourcePreservation
    },
    features
  };
  return {
    ...row,
    merge: nativeParserFeatureMergeAssessment(row, {
      requiredFeatures: context.requiredFeatures,
      minimumReadiness: context.minimumReadiness
    })
  };
}

function nativeParserFeatureParserSlots(profile, imports, adapters) {
  const slots = [
    ...(profile.parserAdapters ?? []),
    ...adapters.map((adapter) => adapter.parser),
    ...imports.map(nativeParserParserForImport)
  ].filter(Boolean);
  if (!slots.length && profile.supportsLightweightScan) slots.push(`${profile.language}.lightweight-declaration-scan`);
  const seen = new Set();
  const result = [];
  for (const slot of slots) {
    const key = `${normalizeParserAstFormatId(slot)}#${parserAstFormatIdForParser(slot)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(String(slot));
  }
  return result;
}

function nativeParserFeatureImportsForProfile(profile, imports = []) {
  const languages = nativeParserFeatureLanguageSet(profile);
  return imports.filter((imported) => languages.has(normalizeNativeLanguageId(imported?.language ?? imported?.nativeAst?.language ?? imported?.nativeSource?.language)));
}

function nativeParserFeatureAdapterSummariesForProfile(profile, adapters = [], dependencies = {}) {
  const languages = nativeParserFeatureLanguageSet(profile);
  return adapters
    .map((adapter) => safeNativeImporterAdapterSummary(adapter, dependencies))
    .filter(Boolean)
    .filter((adapter) => languages.has(normalizeNativeLanguageId(adapter.language)));
}

function nativeParserFeatureLanguageSet(profile) {
  return new Set([profile.language, ...(profile.aliases ?? [])].map(normalizeNativeLanguageId).filter(Boolean));
}

function nativeParserParserForImport(imported) {
  return imported?.adapter?.parser
    ?? imported?.metadata?.adapterCoverage?.parser
    ?? imported?.nativeAst?.parser
    ?? imported?.nativeSource?.parser
    ?? imported?.parser
    ?? imported?.metadata?.parser;
}

function nativeParserFeatureParserMatches(candidateParser, rowParser) {
  if (!candidateParser || !rowParser) return false;
  const candidate = normalizeParserAstFormatId(candidateParser);
  const row = normalizeParserAstFormatId(rowParser);
  return candidate === row || parserAstFormatIdForParser(candidateParser) === parserAstFormatIdForParser(rowParser);
}

function nativeParserFeatureSemanticEvidence(imports, dependencies = {}) {
  const totals = {
    declarations: 0,
    symbols: 0,
    references: 0,
    types: 0,
    controlFlow: 0
  };
  for (const imported of imports) {
    const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
    const evidence = dependencies.observeNativeImporterSemanticEvidence(semanticIndex);
    totals.declarations += evidence.declarations;
    totals.symbols += semanticIndex?.symbols?.length ?? 0;
    totals.references += evidence.references;
    totals.types += evidence.types;
    totals.controlFlow += evidence.controlFlow;
  }
  return totals;
}
