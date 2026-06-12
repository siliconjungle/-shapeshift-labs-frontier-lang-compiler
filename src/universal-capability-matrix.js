import {
  maxSemanticMergeReadiness,
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';
import {
  NativeImportLanguageProfiles
} from './coverage-matrix-profiles.js';
import { createNativeImportCoverageMatrix } from './native-import-coverage-matrix.js';
import { createNativeParserAstFormatMatrix } from './native-parser-ast-format-matrix.js';
import { createNativeParserFeatureMatrix } from './native-parser-feature-matrix.js';
import { createProjectionReadinessMatrix } from './projection-readiness-matrix.js';
import { createProjectionTargetLossMatrix } from './projection-target-loss-matrix.js';
import { createUniversalRepresentationCoverage } from './universal-representation-coverage.js';

export function createUniversalCapabilityMatrix(input = {}, context = {}) {
  const generatedAt = input.generatedAt ?? Date.now();
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const targetAdapters = input.targetAdapters ?? [];
  const languages = input.languages ?? NativeImportLanguageProfiles;
  const targets = input.targets ?? context.compileTargets ?? [];
  const importCoverage = createNativeImportCoverageMatrix({ languages, imports, adapters, generatedAt }, context);
  const parserFormats = createNativeParserAstFormatMatrix({
    formats: input.formats,
    imports,
    adapters,
    generatedAt
  }, context);
  const parserFeatures = createNativeParserFeatureMatrix({
    languages,
    imports,
    adapters,
    requiredFeatures: input.requiredFeatures,
    minimumReadiness: input.minimumReadiness,
    includeEmptyParsers: input.includeEmptyParsers,
    generatedAt
  }, context);
  const projectionTargets = createProjectionTargetLossMatrix({
    languages,
    imports,
    adapters,
    targetAdapters,
    targets,
    generatedAt
  }, context);
  const projectionReadiness = createProjectionReadinessMatrix({
    projectionTargetMatrix: projectionTargets,
    featureCategories: input.projectionFeatureCategories ?? input.featureCategories,
    generatedAt
  }, context);
  const rows = importCoverage.languages.map((entry) => universalCapabilityLanguageRow(entry, {
    parserFeatures,
    projectionTargets
  }));
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt,
    languages: rows,
    summary: universalCapabilityMatrixSummary(rows),
    matrices: {
      importCoverage,
      parserFormats,
      parserFeatures,
      projectionTargets,
      projectionReadiness
    },
    metadata: {
      requiredFeatures: parserFeatures.metadata.requiredFeatures,
      minimumReadiness: parserFeatures.metadata.minimumReadiness,
      compileTargets: projectionTargets.metadata.compileTargets,
      note: 'Universal capability coverage composes import, parser, source-preservation, and projection evidence. It identifies gaps; it is not a proof that every language feature is losslessly portable.'
    }
  };
}

function universalCapabilityLanguageRow(importCoverage, context) {
  const languageIds = universalLanguageIds(importCoverage);
  const parserRows = (context.parserFeatures.parsers ?? []).filter((row) => universalLanguageIds(row).some((id) => languageIds.includes(id)));
  const parserLanguage = (context.parserFeatures.languages ?? []).find((row) => universalLanguageIds(row).some((id) => languageIds.includes(id)));
  const projection = (context.projectionTargets.languages ?? []).find((row) => universalLanguageIds(row).some((id) => languageIds.includes(id)));
  const parserReadiness = parserRows.length
    ? parserRows.reduce((current, row) => maxSemanticMergeReadiness(current, row.merge?.readiness ?? row.imports?.readiness ?? 'blocked'), 'ready')
    : 'blocked';
  const sourceProjectionReadiness = [projection?.sourceProjection?.exactSource, projection?.sourceProjection?.stubs]
    .filter(Boolean)
    .reduce((current, entry) => maxSemanticMergeReadiness(current, entry.readiness ?? 'blocked'), 'ready');
  const targetReadiness = (projection?.targets ?? []).length
    ? projection.targets.reduce((current, entry) => maxSemanticMergeReadiness(current, entry.readiness ?? 'blocked'), 'ready')
    : 'blocked';
  const projectionReadiness = maxSemanticMergeReadiness(sourceProjectionReadiness, targetReadiness);
  const readiness = maxSemanticMergeReadiness(importCoverage.imports.readiness, maxSemanticMergeReadiness(parserReadiness, projectionReadiness));
  const parserBlockingFeatures = uniqueStrings(parserRows.flatMap((row) => row.merge?.blockingFeatures ?? []));
  const parserReviewFeatures = uniqueStrings(parserRows.flatMap((row) => row.merge?.reviewFeatures ?? []));
  const missingTargets = (projection?.targets ?? []).filter((entry) => entry.lossClass === 'missingAdapter').map((entry) => entry.target);
  const unsupportedTargets = (projection?.targets ?? []).filter((entry) => entry.lossClass === 'unsupportedTargetFeatures').map((entry) => entry.target);
  const blockers = universalCapabilityBlockers({
    importCoverage,
    parserRows,
    parserReadiness,
    parserBlockingFeatures,
    projection,
    missingTargets,
    readiness
  });
  const review = universalCapabilityReviewReasons({
    importCoverage,
    parserRows,
    parserReviewFeatures,
    unsupportedTargets,
    readiness
  });
  const representation = createUniversalRepresentationCoverage({
    sourceLanguage: importCoverage.language,
    imports: importCoverage.imports,
    parser: {
      rows: parserRows.length,
      mergeReadyParsers: parserRows.filter((row) => row.merge?.mergeReady).map((row) => row.parser),
      reviewFeatures: parserReviewFeatures
    },
    projection: {
      sourceProjection: projection?.sourceProjection,
      targets: projection?.targets ?? [],
      missingTargets,
      unsupportedTargets
    }
  });
  return {
    language: importCoverage.language,
    aliases: importCoverage.aliases,
    extensions: importCoverage.extensions,
    readiness,
    imports: {
      total: importCoverage.imports.total,
      readiness: importCoverage.imports.readiness,
      symbols: importCoverage.imports.symbols,
      sourceMaps: importCoverage.imports.sourceMaps,
      sourceMapMappings: importCoverage.imports.sourceMapMappings,
      losses: importCoverage.imports.losses,
      lossKinds: importCoverage.imports.lossKinds,
      readinessReasons: importCoverage.imports.readinessReasons
    },
    parser: {
      readiness: parserReadiness,
      rows: parserRows.length,
      parsers: parserRows.map((row) => row.parser),
      mergeReadyParsers: parserRows.filter((row) => row.merge?.mergeReady).map((row) => row.parser),
      blockingFeatures: parserBlockingFeatures,
      reviewFeatures: parserReviewFeatures,
      languageSummary: parserLanguage
    },
    projection: {
      readiness: projectionReadiness,
      sourceProjection: projection?.sourceProjection,
      targets: projection?.targets ?? [],
      summary: projection?.summary ?? {
        imports: 0,
        parserAdapters: 0,
        targetEntries: 0,
        byLossClass: {},
        exactSourceImports: 0,
        stubDeclarationImports: 0
      },
      missingTargets,
      unsupportedTargets
    },
    evidence: {
      parserAdapters: importCoverage.parserAdapters.length,
      adapterCoverageSummaries: importCoverage.adapterCoverage.total,
      adapterCoverageGaps: importCoverage.adapterCoverage.gaps,
      knownLossKinds: importCoverage.knownLossKinds,
      sourceMapMappings: importCoverage.imports.sourceMapMappings
    },
    representation,
    blockers,
    review
  };
}

function universalCapabilityBlockers(input) {
  const blockers = [];
  if ((input.importCoverage.imports.total ?? 0) === 0) {
    blockers.push('No native import evidence observed for this language.');
  }
  if (!input.parserRows.length) {
    blockers.push('No parser feature row matched this language.');
  }
  if (input.parserReadiness === 'blocked') {
    blockers.push('Parser feature readiness is blocked.');
  }
  for (const feature of input.parserBlockingFeatures) {
    blockers.push(`Required parser feature is not merge-ready: ${feature}.`);
  }
  if (!input.projection) {
    blockers.push('No projection coverage row matched this language.');
  }
  for (const target of input.missingTargets) {
    blockers.push(`Missing native-to-target projection adapter for ${target}.`);
  }
  if (input.readiness === 'blocked' && blockers.length === 0) {
    blockers.push('Combined universal capability readiness is blocked.');
  }
  return uniqueStrings(blockers);
}

function universalCapabilityReviewReasons(input) {
  const review = [];
  if ((input.importCoverage.imports.losses ?? 0) > 0) {
    review.push(`Native import evidence carries ${input.importCoverage.imports.losses} loss record(s).`);
  }
  for (const reason of input.importCoverage.imports.readinessReasons ?? []) {
    review.push(reason);
  }
  for (const feature of input.parserReviewFeatures) {
    review.push(`Parser feature needs review: ${feature}.`);
  }
  for (const target of input.unsupportedTargets) {
    review.push(`Target projection has unsupported feature losses for ${target}.`);
  }
  if (input.readiness === 'needs-review') {
    review.push('Combined universal capability readiness requires review.');
  } else if (input.readiness === 'ready-with-losses') {
    review.push('Combined universal capability readiness is ready with disclosed losses.');
  }
  return uniqueStrings(review);
}

function universalCapabilityMatrixSummary(rows) {
  const byReadiness = {};
  const byImportReadiness = {};
  const byParserReadiness = {};
  const byProjectionReadiness = {};
  let imports = 0;
  let symbols = 0;
  let sourceMapMappings = 0;
  let losses = 0;
  let parserRows = 0;
  let parserMergeReady = 0;
  let targetEntries = 0;
  let missingAdapters = 0;
  let unsupportedTargetFeatures = 0;
  let exactSourceProjection = 0;
  let nativeSourceStubs = 0;
  let representationConstructs = 0;
  let representationMissing = 0;
  let blockers = 0;
  let reviewReasons = 0;
  for (const row of rows) {
    byReadiness[row.readiness] = (byReadiness[row.readiness] ?? 0) + 1;
    byImportReadiness[row.imports.readiness] = (byImportReadiness[row.imports.readiness] ?? 0) + 1;
    byParserReadiness[row.parser.readiness] = (byParserReadiness[row.parser.readiness] ?? 0) + 1;
    byProjectionReadiness[row.projection.readiness] = (byProjectionReadiness[row.projection.readiness] ?? 0) + 1;
    imports += row.imports.total;
    symbols += row.imports.symbols;
    sourceMapMappings += row.imports.sourceMapMappings;
    losses += row.imports.losses;
    parserRows += row.parser.rows;
    parserMergeReady += row.parser.mergeReadyParsers.length;
    targetEntries += row.projection.targets.length;
    missingAdapters += row.projection.missingTargets.length;
    unsupportedTargetFeatures += row.projection.unsupportedTargets.length;
    exactSourceProjection += row.projection.summary.byLossClass?.exactSourceProjection ?? 0;
    nativeSourceStubs += row.projection.summary.byLossClass?.nativeSourceStubs ?? 0;
    representationConstructs += row.representation?.summary?.representedConstructs ?? 0;
    representationMissing += row.representation?.summary?.missing ?? 0;
    blockers += row.blockers.length;
    reviewReasons += row.review.length;
  }
  return {
    languages: rows.length,
    imports,
    symbols,
    sourceMapMappings,
    losses,
    parserRows,
    parserMergeReady,
    targetEntries,
    missingAdapters,
    unsupportedTargetFeatures,
    exactSourceProjection,
    nativeSourceStubs,
    representationConstructs,
    representationMissing,
    blockers,
    reviewReasons,
    readyLanguages: rows.filter((row) => row.readiness === 'ready').length,
    readyWithLossesLanguages: rows.filter((row) => row.readiness === 'ready-with-losses').length,
    reviewLanguages: rows.filter((row) => row.readiness === 'needs-review').length,
    blockedLanguages: rows.filter((row) => row.readiness === 'blocked').length,
    byReadiness,
    byImportReadiness,
    byParserReadiness,
    byProjectionReadiness
  };
}

function universalLanguageIds(entry) {
  return uniqueStrings([
    entry?.language,
    ...(entry?.aliases ?? [])
  ].map(normalizeNativeLanguageId).filter(Boolean));
}
