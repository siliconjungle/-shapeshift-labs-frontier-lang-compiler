import {
  maxSemanticMergeReadiness,
  normalizeSemanticMergeReadiness,
  normalizeStringList,
  uniqueStrings
} from './native-import-utils.js';
import {
  NativeParserFeatureCategories
} from './coverage-matrix-profiles.js';
import {
  nativeParserFeatureStatusMergeReady
} from './native-parser-feature-coverage.js';

const semanticMergeReadinessRank = Object.freeze({
  ready: 0,
  'ready-with-losses': 1,
  'needs-review': 2,
  blocked: 3
});

export function nativeParserFeatureMergeAssessment(row, input = {}) {
  const requiredFeatures = normalizeNativeParserRequiredFeatures(input.requiredFeatures);
  const minimumReadiness = normalizeSemanticMergeReadiness(input.minimumReadiness ?? 'ready') ?? 'ready';
  const featureReadiness = requiredFeatures.reduce(
    (current, category) => maxSemanticMergeReadiness(current, row.features?.[category]?.readiness ?? 'blocked'),
    'ready'
  );
  const readiness = maxSemanticMergeReadiness(row.imports?.readiness ?? 'needs-review', featureReadiness);
  const blockingFeatures = requiredFeatures.filter((category) => !nativeParserFeatureStatusMergeReady(row.features?.[category]?.status));
  const reviewFeatures = requiredFeatures.filter((category) => {
    const featureReadiness = row.features?.[category]?.readiness ?? 'blocked';
    return semanticMergeReadinessRank[featureReadiness] > semanticMergeReadinessRank.ready
      && semanticMergeReadinessRank[featureReadiness] <= semanticMergeReadinessRank['needs-review'];
  });
  const reasons = [];
  if ((row.imports?.total ?? 0) === 0) reasons.push('No native import evidence matched this language/parser row.');
  for (const category of blockingFeatures) {
    const feature = row.features?.[category];
    reasons.push(`${category} coverage is ${feature?.status ?? 'missing'}: ${(feature?.reasons ?? []).join(' ')}`);
  }
  if (semanticMergeReadinessRank[readiness] > semanticMergeReadinessRank[minimumReadiness]) {
    reasons.push(`Readiness ${readiness} is weaker than required threshold ${minimumReadiness}.`);
  }
  const mergeReady = (row.imports?.total ?? 0) > 0
    && blockingFeatures.length === 0
    && semanticMergeReadinessRank[readiness] <= semanticMergeReadinessRank[minimumReadiness];
  if (mergeReady) reasons.push(`Native import is merge-ready for required features: ${requiredFeatures.join(', ')}.`);
  return Object.freeze({
    mergeReady,
    readiness,
    requiredFeatures,
    minimumReadiness,
    blockingFeatures,
    reviewFeatures,
    reasons: uniqueStrings(reasons)
  });
}

export function normalizeNativeParserRequiredFeatures(value) {
  const requested = normalizeStringList(value);
  const features = requested.length ? requested : ['syntax', 'semantic', 'sourcePreservation'];
  return uniqueStrings(features.map(normalizeNativeParserFeatureCategory).filter((feature) => NativeParserFeatureCategories.includes(feature)));
}

function normalizeNativeParserFeatureCategory(value) {
  const normalized = String(value ?? '').trim().replace(/[-_\s]+([a-zA-Z])/g, (_, letter) => letter.toUpperCase());
  if (normalized.toLowerCase() === 'macrometaprogramming' || normalized.toLowerCase() === 'macro') return 'macroMetaprogramming';
  if (normalized.toLowerCase() === 'controlflow' || normalized.toLowerCase() === 'cfg') return 'controlFlow';
  if (normalized.toLowerCase() === 'sourcepreservation' || normalized.toLowerCase() === 'source') return 'sourcePreservation';
  if (normalized.toLowerCase() === 'types') return 'type';
  return normalized;
}

export function nativeParserFeatureMatrixSummary(rows) {
  const summary = {
    languages: new Set(),
    parsers: rows.length,
    imports: 0,
    adapters: 0,
    mergeReady: 0,
    byReadiness: {},
    byFeatureStatus: {},
    byFeatureReadiness: {}
  };
  for (const row of rows) {
    summary.languages.add(row.language);
    summary.imports += row.imports.total;
    summary.adapters += row.adapters.total;
    if (row.merge.mergeReady) summary.mergeReady += 1;
    summary.byReadiness[row.merge.readiness] = (summary.byReadiness[row.merge.readiness] ?? 0) + 1;
    for (const [category, feature] of Object.entries(row.features)) {
      summary.byFeatureStatus[category] ??= {};
      summary.byFeatureReadiness[category] ??= {};
      summary.byFeatureStatus[category][feature.status] = (summary.byFeatureStatus[category][feature.status] ?? 0) + 1;
      summary.byFeatureReadiness[category][feature.readiness] = (summary.byFeatureReadiness[category][feature.readiness] ?? 0) + 1;
    }
  }
  return {
    ...summary,
    languages: summary.languages.size
  };
}

export function summarizeNativeParserFeatureLanguages(profiles, rows) {
  return profiles.map((profile) => {
    const languageRows = rows.filter((row) => row.language === profile.language);
    return {
      language: profile.language,
      aliases: profile.aliases,
      parserRows: languageRows.length,
      parsers: languageRows.map((row) => row.parser),
      imports: languageRows.reduce((sum, row) => sum + row.imports.total, 0),
      adapters: languageRows.reduce((sum, row) => sum + row.adapters.total, 0),
      mergeReadyParsers: languageRows.filter((row) => row.merge.mergeReady).map((row) => row.parser),
      readiness: languageRows.reduce((current, row) => maxSemanticMergeReadiness(current, row.merge.readiness), 'ready')
    };
  });
}
