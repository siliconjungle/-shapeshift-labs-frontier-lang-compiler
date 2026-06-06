import { maxSemanticMergeReadiness, normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';
import { NativeParserFeatureCategories } from './coverage-matrix-profiles.js';

export const ProjectionReadinessStatuses = Object.freeze(['preserve', 'lower', 'shim', 'lossy', 'blocked']);

const statusRank = Object.freeze({ preserve: 0, lower: 1, shim: 2, lossy: 3, blocked: 4 });
const statusReadiness = Object.freeze({
  preserve: 'ready',
  lower: 'ready',
  shim: 'needs-review',
  lossy: 'needs-review',
  blocked: 'blocked'
});
const lossKindFeatureCategories = Object.freeze({
  declarationOnlyCoverage: ['semantic', 'type', 'controlFlow'],
  opaqueNative: ['syntax', 'semantic', 'type', 'controlFlow'],
  sourceMapApproximation: ['sourcePreservation'],
  sourcePreservation: ['sourcePreservation'],
  targetProjectionLoss: ['semantic', 'type', 'controlFlow', 'sourcePreservation'],
  dynamicRuntime: ['semantic', 'type', 'controlFlow'],
  dynamicDispatch: ['semantic', 'controlFlow'],
  reflection: ['semantic', 'type'],
  macroExpansion: ['macroMetaprogramming'],
  macroHygiene: ['macroMetaprogramming'],
  preprocessor: ['macroMetaprogramming'],
  conditionalCompilation: ['macroMetaprogramming'],
  metaprogramming: ['macroMetaprogramming'],
  generatedCode: ['macroMetaprogramming', 'sourcePreservation'],
  overloadResolution: ['type'],
  typeInference: ['type'],
  unsupportedSyntax: ['syntax'],
  unsupportedSemantic: ['semantic']
});

export function projectionReadinessStatusForFeature(input) {
  const lossClass = input.target.lossClass;
  if (!input.target.supported || lossClass === 'missingAdapter' || input.target.readiness === 'blocked') return 'blocked';
  if (lossClass === 'exactSourceProjection') return 'preserve';
  if (lossClass === 'targetAdapterProjection') return input.lossKinds.length ? 'lossy' : input.target.readiness === 'ready' ? 'lower' : 'shim';
  if (lossClass === 'nativeSourceStubs') return input.category === 'sourcePreservation' ? 'lossy' : 'shim';
  if (lossClass === 'unsupportedTargetFeatures') {
    if (input.lossKinds.length) return 'lossy';
    return input.sameSourceTarget && input.category === 'sourcePreservation' ? 'preserve' : 'shim';
  }
  if (input.lossKinds.length) return 'lossy';
  return input.sameSourceTarget ? 'preserve' : 'shim';
}

export function projectionReadinessSemanticReadiness(status, targetReadiness) {
  if (status === 'blocked' || targetReadiness === 'blocked') return 'blocked';
  return statusReadiness[status] ?? 'needs-review';
}

export function projectionReadinessFeatureReasons(input) {
  if (input.status === 'blocked') {
    return [input.target.reason ?? `No projection support is available from ${input.language.language} to ${input.target.target}.`];
  }
  if (input.status === 'lossy') {
    return [`${input.language.language} -> ${input.target.target} has ${input.category} projection losses: ${input.lossKinds.join(', ')}.`];
  }
  if (input.status === 'preserve') {
    return [`${input.language.language} -> ${input.target.target} preserves ${input.category} by keeping exact native source for the source-language target.`];
  }
  if (input.status === 'lower') {
    return [`${input.language.language} -> ${input.target.target} lowers ${input.category} through ${input.target.adapter ?? 'declared target projection'} without disclosed category losses.`];
  }
  return [`${input.language.language} -> ${input.target.target} emits ${input.category} as a shim or declaration-level projection that requires review.`];
}

export function projectionReadinessFeatureNotes(status, target) {
  return uniqueStrings([
    ...(target.notes ?? []),
    ...(status === 'shim' ? ['Shimmed projection is useful for planning and API compatibility, but it is not exact semantic lowering.'] : []),
    ...(status === 'lossy' ? ['Lossy projection should stay review-required until host evidence handles the listed feature losses.'] : [])
  ]);
}

export function projectionReadinessLanguageSummary(targets) {
  const summary = { targetEntries: targets.length, featureCells: 0, byStatus: {}, byFeatureStatus: {} };
  for (const target of targets) {
    summary.byStatus[target.status] = (summary.byStatus[target.status] ?? 0) + 1;
    for (const feature of target.features ?? []) {
      summary.featureCells += 1;
      summary.byFeatureStatus[feature.category] ??= {};
      summary.byFeatureStatus[feature.category][feature.status] = (summary.byFeatureStatus[feature.category][feature.status] ?? 0) + 1;
    }
  }
  return addStatusCounts(summary);
}

export function projectionReadinessMatrixSummary(languages) {
  const summary = { languages: languages.length, targetEntries: 0, featureCells: 0, byStatus: {}, byFeatureStatus: {} };
  for (const language of languages) {
    summary.targetEntries += language.summary.targetEntries;
    summary.featureCells += language.summary.featureCells;
    for (const [status, count] of Object.entries(language.summary.byStatus)) {
      summary.byStatus[status] = (summary.byStatus[status] ?? 0) + count;
    }
    for (const [category, statuses] of Object.entries(language.summary.byFeatureStatus)) {
      summary.byFeatureStatus[category] ??= {};
      for (const [status, count] of Object.entries(statuses)) {
        summary.byFeatureStatus[category][status] = (summary.byFeatureStatus[category][status] ?? 0) + count;
      }
    }
  }
  return addStatusCounts(summary);
}

export function maxProjectionReadinessStatus(left, right) {
  const leftRank = statusRank[left] ?? statusRank.lossy;
  const rightRank = statusRank[right] ?? statusRank.lossy;
  return leftRank >= rightRank ? left : right;
}

export function projectionLossKindsForFeatureCategory(lossKinds, category) {
  return uniqueStrings((lossKinds ?? []).filter((lossKind) => (lossKindFeatureCategories[lossKind] ?? []).includes(category)));
}

export function normalizeProjectionReadinessFeatureCategories(value) {
  const requested = value === undefined || value === null ? NativeParserFeatureCategories : Array.isArray(value) ? value : [value];
  const normalized = uniqueStrings(requested.map(normalizeProjectionReadinessFeatureCategory).filter(Boolean));
  return normalized.length ? normalized : [...NativeParserFeatureCategories];
}

export function normalizeProjectionReadinessFeatureCategory(value) {
  if (!value) return undefined;
  const compact = String(value).trim().toLowerCase().replace(/[-_\s]+/g, '');
  const aliases = {
    ast: 'syntax',
    syntax: 'syntax',
    semantic: 'semantic',
    semantics: 'semantic',
    type: 'type',
    types: 'type',
    typechecking: 'type',
    controlflow: 'controlFlow',
    cfg: 'controlFlow',
    macro: 'macroMetaprogramming',
    macros: 'macroMetaprogramming',
    metaprogramming: 'macroMetaprogramming',
    macrometaprogramming: 'macroMetaprogramming',
    source: 'sourcePreservation',
    sourcepreservation: 'sourcePreservation',
    sourcemap: 'sourcePreservation',
    roundtrip: 'sourcePreservation'
  };
  const category = aliases[compact] ?? String(value).trim();
  return NativeParserFeatureCategories.includes(category) ? category : undefined;
}

export function projectionLanguageIds(entry) {
  return uniqueStrings([entry?.language, ...(entry?.aliases ?? [])].map(normalizeNativeLanguageId).filter(Boolean));
}

export { maxSemanticMergeReadiness };

function addStatusCounts(summary) {
  return {
    ...summary,
    preserveTargets: summary.byStatus.preserve ?? 0,
    lowerTargets: summary.byStatus.lower ?? 0,
    shimTargets: summary.byStatus.shim ?? 0,
    lossyTargets: summary.byStatus.lossy ?? 0,
    blockedTargets: summary.byStatus.blocked ?? 0
  };
}
