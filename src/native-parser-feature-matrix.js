import {
  normalizeNativeLanguageId,
  normalizeSemanticMergeReadiness
} from './native-import-utils.js';
import {
  NativeImportLanguageProfiles,
  NativeParserFeatureCategories,
  NativeParserFeatureCoverageStatuses,
  mergeNativeImportProfiles,
  parserAstFormatIdForParser
} from './coverage-matrix-profiles.js';
import {
  nativeParserFeatureRowsForProfiles
} from './native-parser-feature-rows.js';
import {
  nativeParserFeatureMatrixSummary,
  nativeParserFeatureMergeAssessment,
  normalizeNativeParserRequiredFeatures,
  summarizeNativeParserFeatureLanguages
} from './native-parser-feature-assessment.js';

export function createNativeParserFeatureMatrix(input = {}, context = {}) {
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const profiles = mergeNativeImportProfiles(input.languages ?? NativeImportLanguageProfiles, imports, adapters, [], context);
  const parsers = nativeParserFeatureRowsForProfiles(profiles, {
    imports,
    adapters,
    requiredFeatures: input.requiredFeatures,
    minimumReadiness: input.minimumReadiness,
    includeEmptyParsers: input.includeEmptyParsers
  }, context);
  const summary = nativeParserFeatureMatrixSummary(parsers);
  return {
    kind: 'frontier.lang.nativeParserFeatureMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    parsers,
    languages: summarizeNativeParserFeatureLanguages(profiles, parsers),
    summary,
    metadata: {
      categories: [...NativeParserFeatureCategories],
      statuses: [...NativeParserFeatureCoverageStatuses],
      requiredFeatures: normalizeNativeParserRequiredFeatures(input.requiredFeatures),
      minimumReadiness: normalizeSemanticMergeReadiness(input.minimumReadiness ?? 'ready'),
      note: 'Native parser feature coverage is admission evidence per language/parser. It does not promote lightweight scans or host adapters beyond their declared and observed capabilities.'
    }
  };
}

export function queryNativeParserFeatureMatrix(matrixOrInput = {}, query = {}, context = {}) {
  const matrix = matrixOrInput?.kind === 'frontier.lang.nativeParserFeatureMatrix'
    ? matrixOrInput
    : createNativeParserFeatureMatrix(matrixOrInput, context);
  const language = normalizeNativeLanguageId(query.language);
  const parser = query.parser === undefined ? undefined : parserAstFormatIdForParser(query.parser);
  const requiredFeatures = normalizeNativeParserRequiredFeatures(query.requiredFeatures ?? matrix.metadata?.requiredFeatures);
  const minimumReadiness = normalizeSemanticMergeReadiness(query.minimumReadiness ?? matrix.metadata?.minimumReadiness ?? 'ready');
  const row = matrix.parsers.find((entry) => {
    if (language && normalizeNativeLanguageId(entry.language) !== language && !(entry.aliases ?? []).map(normalizeNativeLanguageId).includes(language)) {
      return false;
    }
    if (!parser) return true;
    const parserIds = [
      entry.parser,
      entry.parserFormat,
      ...(entry.parserAliases ?? []),
      ...(entry.parserAdapters ?? [])
    ].map(parserAstFormatIdForParser);
    return parserIds.includes(parser);
  });
  const merge = row
    ? nativeParserFeatureMergeAssessment(row, { requiredFeatures, minimumReadiness })
    : {
      mergeReady: false,
      readiness: 'blocked',
      requiredFeatures,
      minimumReadiness,
      blockingFeatures: requiredFeatures,
      reviewFeatures: [],
      reasons: [`No native parser feature coverage row matched language=${query.language ?? '*'} parser=${query.parser ?? '*'}.`]
    };
  return {
    kind: 'frontier.lang.nativeParserFeatureQuery',
    version: 1,
    found: Boolean(row),
    language: row?.language ?? language,
    parser: row?.parser ?? parser,
    row,
    merge
  };
}
