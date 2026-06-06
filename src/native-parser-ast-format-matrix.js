import {
  maxSemanticMergeReadiness,
  uniqueStrings
} from './native-import-utils.js';
import {
  NativeParserAstFormatProfiles,
  nativeParserAstFormatProfile,
  normalizeParserAstFormatId,
  parserAstFormatIdForImport,
  parserAstFormatIdForParser
} from './coverage-matrix-profiles.js';
import {
  nativeImportReadiness,
  safeNativeImporterAdapterSummary
} from './native-import-coverage-matrix.js';

export function getNativeParserAstFormatProfile(format) {
  const normalized = normalizeParserAstFormatId(format);
  return NativeParserAstFormatProfiles.find((profile) => profile.id === normalized || profile.aliases.includes(normalized));
}

export function createNativeParserAstFormatMatrix(input = {}, context = {}) {
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const profiles = mergeNativeParserAstFormatProfiles(input.formats ?? NativeParserAstFormatProfiles, imports, adapters, context);
  const formats = profiles.map((profile) => nativeParserAstFormatCoverageForProfile(profile, imports, adapters, context));
  const summary = formats.reduce((totals, entry) => {
    totals.formats += 1;
    totals.adapterSlots += entry.parserAdapters.length;
    totals.adapters += entry.adapters.total;
    totals.imports += entry.imports.total;
    totals.nativeAstNodes += entry.imports.nativeAstNodes;
    totals.symbols += entry.imports.symbols;
    totals.sourceMapMappings += entry.imports.sourceMapMappings;
    totals.losses += entry.imports.losses;
    totals.byKind[entry.kind] = (totals.byKind[entry.kind] ?? 0) + 1;
    totals.byReadiness[entry.imports.readiness] = (totals.byReadiness[entry.imports.readiness] ?? 0) + 1;
    for (const [capability, count] of Object.entries(entry.adapters.effectiveCapabilities)) {
      totals.effectiveCapabilities[capability] = (totals.effectiveCapabilities[capability] ?? 0) + count;
    }
    return totals;
  }, {
    formats: 0,
    adapterSlots: 0,
    adapters: 0,
    imports: 0,
    nativeAstNodes: 0,
    symbols: 0,
    sourceMapMappings: 0,
    losses: 0,
    byKind: {},
    byReadiness: {},
    effectiveCapabilities: {}
  });
  return {
    kind: 'frontier.lang.nativeParserAstFormatMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    formats,
    summary,
    metadata: {
      note: 'Parser AST format coverage describes normalization evidence and host-parser obligations; it is not a lossless portability claim.',
      profileIds: profiles.map((profile) => profile.id)
    }
  };
}

export function mergeNativeParserAstFormatProfiles(profiles, imports, adapters, context = {}) {
  const byId = new Map((profiles ?? []).map((profile) => [normalizeParserAstFormatId(profile.id ?? profile), nativeParserAstFormatProfile(normalizeParserAstFormatId(profile.id ?? profile), profile)]));
  for (const adapter of adapters ?? []) {
    const summary = safeNativeImporterAdapterSummary(adapter, context);
    if (!summary) continue;
    const formatId = parserAstFormatIdForParser(summary.parser);
    if (!byId.has(formatId)) {
      byId.set(formatId, nativeParserAstFormatProfile(formatId, {
        languages: [summary.language],
        parserAdapters: [summary.parser],
        exactness: summary.coverage.exactness,
        sourceRangeModel: summary.coverage.sourceRanges ? 'adapter-reported' : 'unknown'
      }));
    }
  }
  for (const imported of imports ?? []) {
    const formatId = parserAstFormatIdForImport(imported);
    if (formatId && !byId.has(formatId)) {
      byId.set(formatId, nativeParserAstFormatProfile(formatId, {
        languages: [imported.language].filter(Boolean),
        parserAdapters: [imported.parser ?? imported.nativeAst?.parser ?? formatId],
        exactness: 'unknown',
        sourceRangeModel: (imported.sourceMaps ?? []).some((sourceMap) => sourceMap.mappings?.some((mapping) => mapping.sourceSpan)) ? 'adapter-reported' : 'unknown'
      }));
    }
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function nativeParserAstFormatCoverageForProfile(profile, imports, adapters, context = {}) {
  const formatIds = new Set([profile.id, ...profile.aliases].map(normalizeParserAstFormatId));
  const adapterParsers = new Set(profile.parserAdapters.map(parserAstFormatIdForParser));
  const matchingAdapters = (adapters ?? [])
    .map((adapter) => safeNativeImporterAdapterSummary(adapter, context))
    .filter(Boolean)
    .filter((adapter) => formatIds.has(parserAstFormatIdForParser(adapter.parser)) || adapterParsers.has(parserAstFormatIdForParser(adapter.parser)));
  const matchingImports = (imports ?? [])
    .filter((imported) => {
      const formatId = parserAstFormatIdForImport(imported);
      return formatId && (formatIds.has(formatId) || adapterParsers.has(formatId));
    });
  const effectiveCapabilities = {};
  for (const adapter of matchingAdapters) {
    for (const row of adapter.coverage.capabilityEvidence?.capabilities ?? []) {
      if (row.effective) effectiveCapabilities[row.capability] = (effectiveCapabilities[row.capability] ?? 0) + 1;
    }
  }
  const readiness = matchingImports.reduce(
    (current, imported) => maxSemanticMergeReadiness(current, nativeImportReadiness(imported)),
    matchingImports.length ? 'ready' : 'needs-review'
  );
  return {
    id: profile.id,
    kind: profile.kind,
    languages: profile.languages,
    parserAdapters: profile.parserAdapters,
    exactness: profile.exactness,
    sourceRangeModel: profile.sourceRangeModel,
    preservesTokens: profile.preservesTokens,
    preservesTrivia: profile.preservesTrivia,
    supportsIncremental: profile.supportsIncremental,
    supportsErrorRecovery: profile.supportsErrorRecovery,
    notes: profile.notes,
    adapters: {
      total: matchingAdapters.length,
      ids: matchingAdapters.map((adapter) => adapter.id),
      parsers: uniqueStrings(matchingAdapters.map((adapter) => adapter.parser)),
      effectiveCapabilities
    },
    imports: {
      total: matchingImports.length,
      sourcePaths: matchingImports.map((imported) => imported.sourcePath).filter(Boolean),
      readiness,
      nativeAstNodes: matchingImports.reduce((sum, imported) => sum + Object.keys(imported.nativeAst?.nodes ?? {}).length, 0),
      symbols: matchingImports.reduce((sum, imported) => sum + (imported.semanticIndex?.symbols?.length ?? 0), 0),
      sourceMapMappings: matchingImports.reduce((sum, imported) => sum + (imported.sourceMaps ?? []).reduce((mapSum, sourceMap) => mapSum + (sourceMap.mappings?.length ?? 0), 0), 0),
      losses: matchingImports.reduce((sum, imported) => sum + (imported.losses?.length ?? 0), 0)
    }
  };
}
