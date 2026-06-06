import { nativeLanguageCompileTarget, normalizeProjectionMatrixTargets } from './coverage-matrix-profiles.js';
import { createProjectionTargetLossMatrix } from './projection-target-loss-matrix.js';
import {
  maxProjectionReadinessStatus,
  maxSemanticMergeReadiness,
  normalizeProjectionReadinessFeatureCategories,
  normalizeProjectionReadinessFeatureCategory,
  projectionLanguageIds,
  projectionLossKindsForFeatureCategory,
  ProjectionReadinessStatuses,
  projectionReadinessFeatureNotes,
  projectionReadinessFeatureReasons,
  projectionReadinessLanguageSummary,
  projectionReadinessMatrixSummary,
  projectionReadinessSemanticReadiness,
  projectionReadinessStatusForFeature
} from './projection-readiness-helpers.js';

export { ProjectionReadinessStatuses };

export function createProjectionReadinessMatrix(input = {}, context = {}) {
  const featureCategories = normalizeProjectionReadinessFeatureCategories(input.featureCategories);
  const projectionTargets = input.projectionTargetMatrix?.kind === 'frontier.lang.projectionTargetLossMatrix'
    ? input.projectionTargetMatrix
    : createProjectionTargetLossMatrix(input, context);
  const languages = (projectionTargets.languages ?? []).map((language) => projectionReadinessLanguageRow(language, featureCategories));
  return {
    kind: 'frontier.lang.projectionReadinessMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? projectionTargets.generatedAt ?? Date.now(),
    languages,
    summary: projectionReadinessMatrixSummary(languages),
    matrices: { projectionTargets },
    metadata: {
      statuses: [...ProjectionReadinessStatuses],
      featureCategories,
      compileTargets: projectionTargets.metadata?.compileTargets ?? [],
      note: 'Projection readiness reports preserve/lower/shim/lossy/blocked status by source language, target language, and feature category. It is coordinator evidence, not a proof of semantic equivalence.'
    }
  };
}

export function queryProjectionReadinessMatrix(matrixOrInput = {}, query = {}, context = {}) {
  const matrix = matrixOrInput?.kind === 'frontier.lang.projectionReadinessMatrix'
    ? matrixOrInput
    : createProjectionReadinessMatrix(matrixOrInput, context);
  const sourceLanguage = projectionLanguageIds({ language: query.sourceLanguage ?? query.language })[0];
  const target = normalizeProjectionMatrixTargets(query.target)[0];
  const featureCategory = normalizeProjectionReadinessFeatureCategory(query.featureCategory ?? query.category);
  const language = (matrix.languages ?? []).find((entry) => !sourceLanguage || projectionLanguageIds(entry).includes(sourceLanguage));
  const cell = (language?.targets ?? []).find((entry) => !target || entry.target === target);
  const feature = featureCategory ? (cell?.features ?? []).find((entry) => entry.category === featureCategory) : undefined;
  const status = feature?.status ?? cell?.status ?? 'blocked';
  const readiness = feature?.readiness ?? cell?.readiness ?? 'blocked';
  return {
    kind: 'frontier.lang.projectionReadinessQuery',
    version: 1,
    found: Boolean(language && cell && (!featureCategory || feature)),
    sourceLanguage: language?.language ?? sourceLanguage,
    target: cell?.target ?? target,
    featureCategory: feature?.category ?? featureCategory,
    status,
    readiness,
    cell,
    feature,
    reasons: feature?.reasons ?? cell?.reasons ?? [`No projection readiness cell matched source=${query.sourceLanguage ?? query.language ?? '*'} target=${query.target ?? '*'}.`]
  };
}

function projectionReadinessLanguageRow(language, featureCategories) {
  const targets = (language.targets ?? []).map((target) => projectionReadinessTargetCell(language, target, featureCategories));
  return {
    language: language.language,
    aliases: language.aliases ?? [],
    extensions: language.extensions ?? [],
    targets,
    summary: projectionReadinessLanguageSummary(targets)
  };
}

function projectionReadinessTargetCell(language, target, featureCategories) {
  const features = featureCategories.map((category) => projectionReadinessFeatureCell(language, target, category));
  const status = features.reduce((current, feature) => maxProjectionReadinessStatus(current, feature.status), 'preserve');
  const readiness = features.reduce((current, feature) => maxSemanticMergeReadiness(current, feature.readiness), 'ready');
  return {
    sourceLanguage: language.language,
    target: target.target,
    status,
    readiness,
    lossClass: target.lossClass,
    supported: target.supported,
    adapter: target.adapter,
    adapterKind: target.adapterKind,
    features,
    byFeature: Object.fromEntries(features.map((feature) => [feature.category, feature.status])),
    blockingFeatures: features.filter((feature) => feature.status === 'blocked').map((feature) => feature.category),
    lossyFeatures: features.filter((feature) => feature.status === 'lossy').map((feature) => feature.category),
    shimFeatures: features.filter((feature) => feature.status === 'shim').map((feature) => feature.category),
    lowerFeatures: features.filter((feature) => feature.status === 'lower').map((feature) => feature.category),
    preserveFeatures: features.filter((feature) => feature.status === 'preserve').map((feature) => feature.category),
    lossKinds: target.lossKinds ?? [],
    categories: target.categories ?? [],
    reasons: [...new Set([target.reason, ...features.flatMap((feature) => feature.reasons)].filter(Boolean))],
    notes: target.notes ?? []
  };
}

function projectionReadinessFeatureCell(language, target, category) {
  const sourceTarget = nativeLanguageCompileTarget(language.language, language.aliases ?? []);
  const sameSourceTarget = Boolean(sourceTarget && target.target === sourceTarget);
  const lossKinds = projectionLossKindsForFeatureCategory(target.lossKinds ?? [], category);
  const status = projectionReadinessStatusForFeature({ category, lossKinds, sameSourceTarget, target });
  return {
    category,
    status,
    readiness: projectionReadinessSemanticReadiness(status, target.readiness),
    lossClass: target.lossClass,
    lossKinds,
    reasons: projectionReadinessFeatureReasons({ category, lossKinds, language, sameSourceTarget, status, target }),
    notes: projectionReadinessFeatureNotes(status, target)
  };
}
