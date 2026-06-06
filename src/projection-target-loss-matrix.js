import {
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';
import {
  NativeImportLanguageProfiles,
  ProjectionTargetLossClasses,
  mergeNativeImportProfiles,
  nativeLanguageCompileTarget,
  normalizeProjectionMatrixTargets
} from './coverage-matrix-profiles.js';

export function createProjectionTargetLossMatrix(input = {}, context = {}) {
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const targetAdapters = input.targetAdapters ?? [];
  const profiles = mergeNativeImportProfiles(input.languages ?? NativeImportLanguageProfiles, imports, adapters, targetAdapters, context);
  const targets = normalizeProjectionMatrixTargets(input.targets ?? context.compileTargets ?? []);
  const languages = profiles.map((profile) => projectionTargetCoverageForProfile(profile, {
    imports,
    adapters,
    targetAdapters,
    targets
  }, context));
  const summary = projectionTargetLossMatrixSummary(languages);
  return {
    kind: 'frontier.lang.projectionTargetLossMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    languages,
    summary,
    metadata: {
      compileTargets: targets,
      lossClasses: [...ProjectionTargetLossClasses],
      note: 'Projection target coverage separates exact source preservation, declaration stubs, host-owned target adapters, known unsupported target features, and missing native-to-target adapters.'
    }
  };
}

function projectionTargetCoverageForProfile(profile, input, context = {}) {
  const aliases = new Set([profile.language, ...(profile.aliases ?? [])].map(normalizeNativeLanguageId).filter(Boolean));
  const matchingImports = (input.imports ?? []).filter((imported) => aliases.has(normalizeNativeLanguageId(imported?.language ?? imported?.nativeAst?.language)));
  const matchingAdapters = (input.adapters ?? []).filter((adapter) => aliases.has(normalizeNativeLanguageId(adapter?.language)));
  const matchingTargetAdapters = (input.targetAdapters ?? []).filter((adapter) => aliases.has(normalizeNativeLanguageId(adapter?.sourceLanguage ?? adapter?.language)));
  const importedLossKinds = uniqueStrings(matchingImports.flatMap((imported) => (imported?.losses ?? []).map((loss) => loss.kind).filter(Boolean)));
  const knownLossKinds = uniqueStrings([...(profile.knownLossKinds ?? []), ...importedLossKinds]);
  const parserAdapters = uniqueStrings([
    ...(profile.parserAdapters ?? []),
    ...matchingAdapters.map((adapter) => adapter.parser ?? adapter.id).filter(Boolean)
  ]);
  const sourceProjection = sourceProjectionCoverageForProfile(profile, matchingImports, knownLossKinds);
  const targets = (input.targets ?? context.compileTargets ?? []).map((target) => projectionTargetCoverageEntry(profile, target, {
    matchingImports,
    matchingAdapters,
    matchingTargetAdapters,
    knownLossKinds
  }, context));
  return {
    language: profile.language,
    aliases: profile.aliases,
    extensions: profile.extensions,
    supportsLightweightScan: profile.supportsLightweightScan,
    parserAdapters,
    projectionTargets: profile.projectionTargets,
    knownLossKinds,
    defaultReadiness: profile.defaultReadiness,
    notes: profile.notes,
    sourceProjection,
    targets,
    summary: {
      imports: matchingImports.length,
      parserAdapters: parserAdapters.length,
      targetEntries: targets.length,
      byLossClass: countProjectionLossClasses(targets),
      exactSourceImports: sourceProjection.exactSource.evidence.importsWithExactSource,
      stubDeclarationImports: sourceProjection.stubs.evidence.importsWithDeclarations
    }
  };
}

function sourceProjectionCoverageForProfile(profile, imports, knownLossKinds) {
  const exactSourceImports = imports.filter(hasExactSourceProjectionEvidence).length;
  const declarationImports = imports.filter(hasNativeProjectionDeclarations).length;
  return {
    exactSource: {
      lossClass: 'exactSourceProjection',
      mode: 'preserved-source',
      supported: true,
      readiness: 'ready',
      lossKinds: [],
      categories: [],
      reason: exactSourceImports
        ? 'At least one import carries matching source-preservation evidence, so projectNativeImportToSource can emit the original source exactly.'
        : 'Exact source projection is available when the import carries sourceText or source-preservation evidence whose hash matches the native source hash.',
      evidence: {
        imports: imports.length,
        importsWithExactSource: exactSourceImports
      },
      notes: ['Preserved source is the only currently lossless native-source projection mode in this facade.']
    },
    stubs: {
      lossClass: 'nativeSourceStubs',
      mode: 'native-source-stubs',
      supported: profile.supportsLightweightScan || declarationImports > 0,
      readiness: 'needs-review',
      lossKinds: uniqueStrings([
        'targetProjectionLoss',
        ...(declarationImports || profile.supportsLightweightScan ? [] : ['declarationOnlyCoverage'])
      ]),
      categories: uniqueStrings([
        'targetProjectionLoss',
        ...(declarationImports || profile.supportsLightweightScan ? [] : ['declarationsOnly'])
      ]),
      reason: 'Declaration stubs are emitted when exact source is unavailable or disabled; executable bodies and full type semantics remain unavailable.',
      evidence: {
        imports: imports.length,
        importsWithDeclarations: declarationImports
      },
      notes: uniqueStrings([
        'Stub projection is review-required and should not be treated as a round-trip proof.',
        ...(projectionUnsupportedFeatureLossKinds(knownLossKinds).length
          ? ['Known source-language feature losses may still be present behind preserved source or stubs.']
          : [])
      ])
    }
  };
}

function projectionTargetCoverageEntry(profile, target, input, context = {}) {
  const normalizedTarget = normalizeProjectionMatrixTargets([target])[0] ?? String(target);
  const declaredTargets = new Set(normalizeProjectionMatrixTargets(profile.projectionTargets ?? []));
  const adapterTargets = new Set((input.matchingAdapters ?? []).flatMap(adapterProjectionTargets));
  const targetAdapter = context.matchingNativeTargetProjectionAdapter({
    sourceLanguage: profile.language,
    target: normalizedTarget,
    sourcePath: input.matchingImports?.[0]?.sourcePath ?? input.matchingImports?.[0]?.nativeSource?.sourcePath
  }, input.matchingTargetAdapters ?? []);
  const targetAdapterSummary = targetAdapter ? context.normalizeNativeTargetProjectionAdapter(targetAdapter) : undefined;
  const sameSourceTarget = nativeLanguageCompileTarget(profile.language, profile.aliases) === normalizedTarget;
  const hasProjectionAdapter = Boolean(targetAdapterSummary) || declaredTargets.has(normalizedTarget) || adapterTargets.has(normalizedTarget);
  if (!hasProjectionAdapter) {
    return {
      target: normalizedTarget,
      lossClass: 'missingAdapter',
      supported: false,
      readiness: 'blocked',
      lossKinds: ['targetProjectionLoss'],
      categories: ['targetProjectionLoss'],
      reason: `No native-to-${normalizedTarget} projection adapter is declared for ${profile.language}.`,
      adapter: undefined,
      notes: ['The source can still be preserved or stubbed in its original language when import evidence supports that mode.']
    };
  }

  const featureLossKinds = projectionUnsupportedFeatureLossKinds(input.knownLossKinds);
  if (targetAdapterSummary) {
    const handledLossKinds = new Set(targetAdapterSummary.coverage.handledLossKinds ?? []);
    const unhandledFeatureLossKinds = featureLossKinds.filter((kind) => !handledLossKinds.has(kind));
    if (unhandledFeatureLossKinds.length) {
      return {
        target: normalizedTarget,
        lossClass: 'unsupportedTargetFeatures',
        supported: true,
        readiness: 'needs-review',
        lossKinds: unhandledFeatureLossKinds,
        categories: uniqueStrings(unhandledFeatureLossKinds.map(context.nativeImportCategoryForLossKind)),
        reason: `${profile.language} has target adapter ${targetAdapterSummary.id}, but source feature losses remain unhandled for ${normalizedTarget}: ${unhandledFeatureLossKinds.join(', ')}.`,
        adapter: targetAdapterSummary.id,
        adapterKind: 'targetProjection',
        adapterVersion: targetAdapterSummary.version,
        adapterCoverage: targetAdapterSummary.coverage,
        notes: uniqueStrings([
          ...(targetAdapterSummary.coverage.notes ?? []),
          'Adapter output is available, but merge readiness still requires review for unhandled source-language feature losses.'
        ])
      };
    }
    const adapterLossKinds = uniqueStrings(targetAdapterSummary.coverage.lossKinds ?? []);
    return {
      target: normalizedTarget,
      lossClass: 'targetAdapterProjection',
      supported: true,
      readiness: targetAdapterSummary.coverage.readiness ?? 'needs-review',
      lossKinds: adapterLossKinds,
      categories: uniqueStrings(adapterLossKinds.map(context.nativeImportCategoryForLossKind)),
      reason: `${profile.language} can project to ${normalizedTarget} through host target adapter ${targetAdapterSummary.id}.`,
      adapter: targetAdapterSummary.id,
      adapterKind: 'targetProjection',
      adapterVersion: targetAdapterSummary.version,
      adapterCoverage: targetAdapterSummary.coverage,
      notes: uniqueStrings([
        ...(targetAdapterSummary.coverage.notes ?? []),
        'The host adapter owns native-to-target translation semantics and must provide evidence for merge admission.'
      ])
    };
  }

  if (featureLossKinds.length) {
    return {
      target: normalizedTarget,
      lossClass: 'unsupportedTargetFeatures',
      supported: true,
      readiness: 'needs-review',
      lossKinds: featureLossKinds,
      categories: uniqueStrings(featureLossKinds.map(context.nativeImportCategoryForLossKind)),
      reason: `${profile.language} coverage declares source features that this facade cannot prove lossless for ${normalizedTarget}: ${featureLossKinds.join(', ')}.`,
      adapter: projectionTargetAdapterName(profile, normalizedTarget, input.matchingAdapters),
      notes: ['Use exact parser or semantic adapter evidence before treating this target projection as merge-ready.']
    };
  }

  if (sameSourceTarget) {
    return {
      target: normalizedTarget,
      lossClass: 'exactSourceProjection',
      supported: true,
      readiness: 'ready',
      lossKinds: [],
      categories: [],
      reason: `${profile.language} can project to its source language exactly when source preservation evidence is available.`,
      adapter: projectionTargetAdapterName(profile, normalizedTarget, input.matchingAdapters),
      notes: ['Without exact source text, the source projection falls back to declaration stubs.']
    };
  }

  return {
    target: normalizedTarget,
    lossClass: 'nativeSourceStubs',
    supported: true,
    readiness: 'needs-review',
    lossKinds: ['targetProjectionLoss'],
    categories: ['targetProjectionLoss'],
    reason: `${profile.language} declares a ${normalizedTarget} target slot, but this facade only exposes declaration-level native import projection evidence.`,
    adapter: projectionTargetAdapterName(profile, normalizedTarget, input.matchingAdapters),
    notes: ['Host-owned semantic adapters can upgrade this cell with stronger evidence.']
  };
}

function projectionTargetLossMatrixSummary(languages) {
  const byLossClass = {};
  const sourceProjectionByLossClass = {};
  let targetEntries = 0;
  for (const language of languages) {
    for (const projection of [language.sourceProjection?.exactSource, language.sourceProjection?.stubs].filter(Boolean)) {
      sourceProjectionByLossClass[projection.lossClass] = (sourceProjectionByLossClass[projection.lossClass] ?? 0) + 1;
    }
    for (const target of language.targets ?? []) {
      targetEntries += 1;
      byLossClass[target.lossClass] = (byLossClass[target.lossClass] ?? 0) + 1;
    }
  }
  return {
    languages: languages.length,
    targetEntries,
    byLossClass,
    sourceProjectionByLossClass,
    exactSourceProjection: (sourceProjectionByLossClass.exactSourceProjection ?? 0) + (byLossClass.exactSourceProjection ?? 0),
    nativeSourceStubs: (sourceProjectionByLossClass.nativeSourceStubs ?? 0) + (byLossClass.nativeSourceStubs ?? 0),
    targetAdapterProjection: byLossClass.targetAdapterProjection ?? 0,
    unsupportedTargetFeatures: byLossClass.unsupportedTargetFeatures ?? 0,
    missingAdapters: byLossClass.missingAdapter ?? 0
  };
}

function countProjectionLossClasses(entries) {
  const counts = {};
  for (const entry of entries ?? []) {
    counts[entry.lossClass] = (counts[entry.lossClass] ?? 0) + 1;
  }
  return counts;
}

function hasExactSourceProjectionEvidence(imported) {
  const preservation = imported?.metadata?.sourcePreservation
    ?? imported?.nativeSource?.metadata?.sourcePreservation
    ?? imported?.nativeAst?.metadata?.sourcePreservation;
  const expectedHash = imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? imported?.sourceHash;
  return Boolean(preservation?.summary?.exactSourceAvailable && (!expectedHash || preservation.sourceHash === expectedHash));
}

function hasNativeProjectionDeclarations(imported) {
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  return (semanticIndex?.symbols?.length ?? 0) > 0;
}

function projectionUnsupportedFeatureLossKinds(lossKinds) {
  const unsupported = new Set([
    'macroExpansion',
    'macroHygiene',
    'preprocessor',
    'conditionalCompilation',
    'metaprogramming',
    'reflection',
    'dynamicRuntime',
    'dynamicDispatch',
    'generatedCode',
    'overloadResolution',
    'typeInference',
    'unsupportedSyntax',
    'unsupportedSemantic'
  ]);
  return uniqueStrings((lossKinds ?? []).filter((kind) => unsupported.has(kind)));
}

function adapterProjectionTargets(adapter) {
  return normalizeProjectionMatrixTargets(
    adapter?.projectionTargets
      ?? adapter?.coverage?.projectionTargets
      ?? adapter?.metadata?.projectionTargets
      ?? []
  );
}

function projectionTargetAdapterName(profile, target, adapters = []) {
  const adapter = adapters.find((candidate) => adapterProjectionTargets(candidate).includes(target));
  if (adapter) return adapter.id ?? adapter.parser;
  return profile.projectionTargets?.includes(target) ? `frontier-native-source-${target}` : undefined;
}
