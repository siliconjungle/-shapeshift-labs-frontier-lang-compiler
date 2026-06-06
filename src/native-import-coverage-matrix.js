import {
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';
import {
  NativeImportLanguageProfiles,
  ProjectionTargetLossClasses,
  mergeNativeImportProfiles
} from './coverage-matrix-profiles.js';

export function createNativeImportCoverageMatrix(input = {}, context = {}) {
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const profiles = mergeNativeImportProfiles(input.languages ?? NativeImportLanguageProfiles, imports, adapters, [], context);
  const languages = profiles.map((profile) => nativeImportCoverageForProfile(profile, imports, adapters, context));
  const summary = languages.reduce((totals, entry) => {
    totals.languages += 1;
    if (entry.supportsLightweightScan) totals.lightweightScanners += 1;
    if (entry.parserAdapters.length) totals.parserAdapterSlots += entry.parserAdapters.length;
    totals.imports += entry.imports.total;
    totals.symbols += entry.imports.symbols;
    totals.sourceMaps += entry.imports.sourceMaps;
    totals.sourceMapMappings += entry.imports.sourceMapMappings;
    totals.losses += entry.imports.losses;
    totals.byReadiness[entry.imports.readiness] = (totals.byReadiness[entry.imports.readiness] ?? 0) + 1;
    for (const [kind, count] of Object.entries(entry.imports.lossKinds)) {
      totals.lossKinds[kind] = (totals.lossKinds[kind] ?? 0) + count;
    }
    totals.adapterCoverage = mergeNativeImporterAdapterCoverageAggregates(totals.adapterCoverage, entry.adapterCoverage);
    return totals;
  }, {
    languages: 0,
    lightweightScanners: 0,
    parserAdapterSlots: 0,
    imports: 0,
    symbols: 0,
    sourceMaps: 0,
    sourceMapMappings: 0,
    losses: 0,
    byReadiness: {},
    lossKinds: {},
    adapterCoverage: emptyNativeImporterAdapterCoverageAggregate()
  });
  return {
    kind: 'frontier.lang.nativeImportCoverageMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    languages,
    summary,
    metadata: {
      compileTargets: [...(context.compileTargets ?? [])],
      projectionTargetLossClasses: [...ProjectionTargetLossClasses],
      note: 'Coverage is evidence and capability metadata, not a claim that every language feature is losslessly portable.'
    }
  };
}

export function nativeImportReadiness(imported) {
  return imported?.metadata?.semanticMergeReadiness
    ?? imported?.metadata?.nativeImportLossSummary?.semanticMergeReadiness
    ?? imported?.mergeCandidates?.[0]?.readiness
    ?? 'ready';
}

function nativeImportCoverageForProfile(profile, imports, adapters, context = {}) {
  const aliases = new Set([profile.language, ...(profile.aliases ?? [])].map(normalizeNativeLanguageId).filter(Boolean));
  const matchingImports = imports.filter((imported) => aliases.has(normalizeNativeLanguageId(imported?.language ?? imported?.nativeAst?.language)));
  const matchingAdapters = adapters.filter((adapter) => aliases.has(normalizeNativeLanguageId(adapter?.language)));
  const lossSummary = context.summarizeNativeImportLosses(matchingImports.flatMap((imported) => imported?.losses ?? []), {
    evidence: matchingImports.flatMap((imported) => imported?.evidence ?? [])
  });
  const readiness = matchingImports.length
    ? lossSummary.semanticMergeReadiness
    : profile.supportsLightweightScan ? profile.defaultReadiness : 'blocked';
  const importedParsers = uniqueStrings(matchingImports.map((imported) => imported?.nativeAst?.parser ?? imported?.parser ?? imported?.metadata?.parser).filter(Boolean));
  const sourceMaps = matchingImports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? []);
  const adapterCoverage = summarizeNativeImporterAdapterCoverageEntries([
    ...matchingImports.map((imported) => nativeImporterAdapterCoverageEntryFromImport(imported)).filter(Boolean),
    ...matchingAdapters.map((adapter) => nativeImporterAdapterCoverageEntryFromAdapter(adapter, context)).filter(Boolean)
  ], context);
  return {
    language: profile.language,
    aliases: profile.aliases,
    extensions: profile.extensions,
    supportsLightweightScan: profile.supportsLightweightScan,
    parserAdapters: uniqueStrings([...(profile.parserAdapters ?? []), ...matchingAdapters.map((adapter) => adapter.parser ?? adapter.id).filter(Boolean)]),
    projectionTargets: profile.projectionTargets,
    knownLossKinds: uniqueStrings([...(profile.knownLossKinds ?? []), ...Object.keys(lossSummary.byKind)]),
    defaultReadiness: profile.defaultReadiness,
    notes: profile.notes,
    adapterCoverage,
    imports: {
      total: matchingImports.length,
      parsers: importedParsers,
      readiness,
      readinessReasons: matchingImports.length ? lossSummary.readinessReasons : nativeImportCoverageReasons(profile),
      symbols: matchingImports.reduce((sum, imported) => sum + (imported?.semanticIndex?.symbols?.length ?? imported?.universalAst?.semanticIndex?.symbols?.length ?? 0), 0),
      sourceMaps: sourceMaps.length,
      sourceMapMappings: sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap?.mappings?.length ?? 0), 0),
      losses: lossSummary.total,
      lossKinds: lossSummary.byKind,
      lossCategories: lossSummary.categories
    }
  };
}

export function nativeImporterAdapterCoverageEntryFromImport(imported) {
  const coverage = imported?.adapter?.coverage
    ?? imported?.metadata?.adapterCoverage
    ?? imported?.nativeAst?.metadata?.adapterCoverage
    ?? imported?.nativeSource?.metadata?.adapterCoverage;
  if (!coverage) return undefined;
  return {
    adapterId: imported?.adapter?.id ?? imported?.metadata?.adapterId ?? imported?.nativeAst?.metadata?.adapterId,
    language: imported?.adapter?.language ?? imported?.language ?? imported?.nativeAst?.language,
    parser: imported?.adapter?.parser ?? imported?.nativeAst?.parser ?? imported?.nativeSource?.parser,
    coverage
  };
}

function nativeImporterAdapterCoverageEntryFromAdapter(adapter, context = {}) {
  if (!adapter) return undefined;
  const summary = context.normalizeNativeImporterAdapter(adapter);
  return {
    adapterId: summary.id,
    language: summary.language,
    parser: summary.parser,
    coverage: summary.coverage
  };
}

export function safeNativeImporterAdapterSummary(adapter, context = {}) {
  try {
    return context.normalizeNativeImporterAdapter(adapter);
  } catch {
    return undefined;
  }
}

export function summarizeNativeImporterAdapterCoverageEntries(entries = [], context = {}) {
  const aggregate = emptyNativeImporterAdapterCoverageAggregate();
  for (const entry of entries) {
    const coverage = normalizeNativeImporterAdapterCoverageForEvidence(entry.coverage, context);
    const capabilityEvidence = coverage.capabilityEvidence;
    const summary = {
      adapterId: entry.adapterId,
      language: entry.language,
      parser: entry.parser,
      exactness: coverage.exactness,
      declared: capabilityNamesByBoolean(capabilityEvidence.capabilities, 'declared'),
      observed: capabilityNamesByBoolean(capabilityEvidence.capabilities, 'observed'),
      effective: capabilityNamesByBoolean(capabilityEvidence.capabilities, 'effective'),
      gaps: capabilityEvidence.gaps,
      declaredOnly: capabilityEvidence.declaredOnly,
      observedOnly: capabilityEvidence.observedOnly
    };
    aggregate.total += 1;
    aggregate.summaries.push(summary);
    incrementCoverageCapabilityCounts(aggregate.declared, summary.declared);
    incrementCoverageCapabilityCounts(aggregate.observed, summary.observed);
    incrementCoverageCapabilityCounts(aggregate.effective, summary.effective);
    incrementCoverageCapabilityCounts(aggregate.gaps, summary.gaps);
    incrementCoverageCapabilityCounts(aggregate.declaredOnly, summary.declaredOnly);
    incrementCoverageCapabilityCounts(aggregate.observedOnly, summary.observedOnly);
  }
  return {
    ...aggregate,
    summaries: Object.freeze(aggregate.summaries)
  };
}

function normalizeNativeImporterAdapterCoverageForEvidence(coverage = {}, context = {}) {
  if (coverage.capabilityEvidence) return coverage;
  const declared = coverage.declared ?? context.adapterCoverageSnapshotFromSummary(coverage);
  const observed = context.normalizeNativeImporterAdapterObservedCoverage(coverage.observed, declared);
  const effective = context.effectiveNativeImporterAdapterCoverage(declared, observed);
  return {
    ...coverage,
    ...effective,
    declared,
    observed,
    capabilityEvidence: context.nativeImporterAdapterCapabilityEvidence(declared, observed, effective)
  };
}

export function emptyNativeImporterAdapterCoverageAggregate() {
  return {
    total: 0,
    declared: {},
    observed: {},
    effective: {},
    gaps: {},
    declaredOnly: {},
    observedOnly: {},
    summaries: []
  };
}

function mergeNativeImporterAdapterCoverageAggregates(left, right) {
  const merged = emptyNativeImporterAdapterCoverageAggregate();
  for (const aggregate of [left, right]) {
    if (!aggregate) continue;
    merged.total += aggregate.total ?? 0;
    incrementCoverageCapabilityCounts(merged.declared, aggregate.declared ?? {});
    incrementCoverageCapabilityCounts(merged.observed, aggregate.observed ?? {});
    incrementCoverageCapabilityCounts(merged.effective, aggregate.effective ?? {});
    incrementCoverageCapabilityCounts(merged.gaps, aggregate.gaps ?? {});
    incrementCoverageCapabilityCounts(merged.declaredOnly, aggregate.declaredOnly ?? {});
    incrementCoverageCapabilityCounts(merged.observedOnly, aggregate.observedOnly ?? {});
    merged.summaries.push(...(aggregate.summaries ?? []));
  }
  return {
    ...merged,
    summaries: Object.freeze(merged.summaries)
  };
}

function capabilityNamesByBoolean(rows, property) {
  return rows.filter((row) => row[property]).map((row) => row.capability);
}

function incrementCoverageCapabilityCounts(target, capabilities) {
  if (Array.isArray(capabilities)) {
    for (const capability of capabilities) {
      target[capability] = (target[capability] ?? 0) + 1;
    }
    return;
  }
  for (const [capability, count] of Object.entries(capabilities ?? {})) {
    target[capability] = (target[capability] ?? 0) + count;
  }
}

export function nativeImportCoverageReasons(profile) {
  if (!profile.supportsLightweightScan) return ['No built-in scanner coverage profile; host must provide an exact adapter or mark unsupported.'];
  return ['Built-in coverage is declaration-level only; use injected parser adapters for exact AST/CST, tokens, trivia, type resolution, and round-trip evidence.'];
}
