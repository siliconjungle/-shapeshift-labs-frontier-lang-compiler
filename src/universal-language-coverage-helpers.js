import { nativeLanguageCompileTarget } from './coverage-matrix-profiles.js';
import { normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';
import { CoverageBaselines, KnownSemanticSurfacePackages, UniversalLanguageCoverageStatuses, UniversalLanguageCoverageSurfaceIds, UniversalLanguageCoverageStatusScores, UniversalLanguageCoverageSurfaceWeights, normalizeCoverageId, rowSurfaces } from './universal-language-coverage-defaults.js';

export function createCoverageRow(entry, context) {
  const id = normalizeCoverageId(entry.id ?? entry.language);
  const language = normalizeNativeLanguageId(entry.language ?? id) || id;
  const packageEvidence = packageCoverageForEntry(entry, context.packageContracts);
  const baseline = surfaceBaselineForEntry(id, entry, packageEvidence);
  const surfaces = UniversalLanguageCoverageSurfaceIds.map((surface) => {
    const override = context.surfaceOverrides?.[id]?.[surface] ?? context.surfaceOverrides?.[language]?.[surface];
    return createSurfaceCoverage(surface, override ?? baseline[surface], { id, packageEvidence });
  });
  const completionEstimate = capCompletionEstimate(weightedCompletion(surfaces), packageEvidence, id);
  const override = context.rowOverrides?.[id] ?? context.rowOverrides?.[language] ?? {};
  const productionEvidence = context.productionEvidence?.[id] ?? context.productionEvidence?.[language];
  return {
    kind: 'frontier.lang.universalLanguageCoverageRow',
    version: 1,
    id,
    language,
    rowKind: entry.rowKind ?? (id === language ? 'language' : 'dialect'),
    aliases: uniqueStrings([...(entry.aliases ?? []), id === language ? undefined : id]),
    extensions: uniqueStrings(entry.extensions ?? []),
    readiness: override.readiness ?? readinessForRow(completionEstimate, surfaces, packageEvidence),
    completionEstimate: roundEstimate(override.completionEstimate ?? completionEstimate),
    surfaces,
    surfaceStatusCounts: countBy(surfaces.map((surface) => surface.status)),
    package: packageEvidence,
    target: {
      compileTarget: nativeLanguageCompileTarget(language, entry.aliases),
      lowerable: packageEvidence.targetProjectionSupported || baseline.targetLowering !== 'missing',
      targetProjectionSupported: packageEvidence.targetProjectionSupported
    },
    evidence: {
      parserAdapters: uniqueStrings(entry.parserAdapters ?? []),
      knownLossKinds: uniqueStrings(entry.knownLossKinds ?? []),
      production: productionEvidence,
      profileDefaultReadiness: entry.defaultReadiness,
      source: packageEvidence.packageNames.length ? 'package-catalog' : 'profile-catalog'
    },
    remainingWork: remainingWorkForRow(surfaces, packageEvidence),
    notes: uniqueStrings([...(entry.notes ?? []), ...(override.notes ?? [])])
  };
}

export function summarizeLanguageCoverageRows(rows) {
  const completions = rows.map((row) => row.completionEstimate ?? 0);
  const allSurfaces = rows.flatMap((row) => row.surfaces ?? []);
  return {
    rows: rows.length,
    languages: uniqueStrings(rows.map((row) => row.language)),
    rowKinds: countBy(rows.map((row) => row.rowKind)),
    byReadiness: countBy(rows.map((row) => row.readiness)),
    byPackageStatus: countBy(rows.map((row) => row.package.status)),
    bySurfaceStatus: countBy(allSurfaces.map((surface) => surface.status)),
    averageCompletionEstimate: roundEstimate(average(completions)),
    highRows: rows.filter((row) => row.readiness === 'high').length,
    boundedEvidenceRows: rows.filter((row) => row.readiness === 'bounded-evidence').length,
    partialRows: rows.filter((row) => row.readiness === 'partial').length,
    plannedRows: rows.filter((row) => row.readiness === 'planned').length,
    blockedRows: rows.filter((row) => row.readiness === 'blocked').length,
    missingSurfaceCells: allSurfaces.filter((surface) => surface.status === 'missing').length,
    blockedSurfaceCells: allSurfaces.filter((surface) => surface.status === 'blocked').length,
    packages: uniqueStrings(rows.flatMap((row) => row.package.packageNames)),
    targetProjectionRows: rows.filter((row) => row.package.targetProjectionSupported).length,
    remainingWorkItems: rows.reduce((total, row) => total + row.remainingWork.length, 0)
  };
}

export function languageCoverageRowMatches(row, query) {
  return match(query.id, [row.id])
    && matchLanguage(query.language, row)
    && match(query.rowKind, [row.rowKind])
    && match(query.readiness, [row.readiness])
    && match(query.packageStatus, [row.package.status])
    && match(query.packageName, row.package.packageNames)
    && match(query.surface, row.surfaces.map((surface) => surface.surface))
    && matchSurfaceStatus(row, query.surface, query.surfaceStatus)
    && match(query.missingSurface, row.surfaces.filter((surface) => surface.status === 'missing').map((surface) => surface.surface))
    && match(query.blockedSurface, row.surfaces.filter((surface) => surface.status === 'blocked').map((surface) => surface.surface))
    && (query.minCompletionEstimate === undefined || row.completionEstimate >= Number(query.minCompletionEstimate))
    && (query.maxCompletionEstimate === undefined || row.completionEstimate <= Number(query.maxCompletionEstimate));
}

export function compareCoverageRows(left, right) {
  return (right.completionEstimate ?? 0) - (left.completionEstimate ?? 0);
}

export function normalizeDenominatorList(value) {
  return uniqueStrings(asList(value).map((entry) => normalizeCoverageId(entry?.id ?? entry?.language ?? entry)));
}

export function coverageIdsForProfile(profile) {
  return uniqueStrings([
    profile?.id,
    profile?.language,
    ...(profile?.aliases ?? [])
  ].map(normalizeCoverageId).filter(Boolean));
}

export function contractCoverageIds(contract) {
  return uniqueStrings([
    contract?.sourceParser?.language,
    ...(contract?.sourceParser?.supportedLanguages ?? [])
  ].map(normalizeCoverageId).filter(Boolean));
}

function createSurfaceCoverage(surface, value, context) {
  const input = typeof value === 'object' ? value : { status: value };
  const status = normalizeCoverageStatus(input.status ?? 'missing');
  const estimate = input.estimate ?? UniversalLanguageCoverageStatusScores[status] ?? undefined;
  return {
    surface,
    status,
    estimate: estimate === undefined ? undefined : roundEstimate(estimate),
    evidence: uniqueStrings(input.evidence ?? evidenceForSurface(surface, status, context)),
    blockers: uniqueStrings(input.blockers ?? blockersForSurface(surface, status, context)),
    notes: uniqueStrings(input.notes ?? [])
  };
}

function surfaceBaselineForEntry(id, entry, packageEvidence) {
  if (entry.surfaces) return { ...entry.surfaces };
  if (CoverageBaselines[id]) return { ...CoverageBaselines[id] };
  if (packageEvidence.status === 'planned-platform') return plannedSurfaces();
  if (packageEvidence.status === 'platform-importer') return platformImporterSurfaces();
  if (packageEvidence.status === 'missing-package') return profileOnlySurfaces(entry);
  return platformImporterSurfaces();
}

function packageCoverageForEntry(entry, packageContracts) {
  const ids = packageMatchIdsForEntry(entry);
  const contracts = (packageContracts ?? []).filter((contract) =>
    contractCoverageIds(contract).some((id) => ids.includes(id))
  );
  const knownPackage = KnownSemanticSurfacePackages[entry.id];
  const ready = contracts.filter((contract) => contract.releaseReadiness?.releaseReady);
  const targetProjection = contracts.filter((contract) => contract.targetProjection?.supported);
  const status = packageStatus(contracts, ready, targetProjection, knownPackage);
  return {
    status,
    packageNames: uniqueStrings([...contracts.map((contract) => contract.packageName), knownPackage?.packageName]),
    packageVersions: uniqueStrings([...contracts.map((contract) => contract.packageVersion), knownPackage?.packageVersion]),
    packageClasses: uniqueStrings(contracts.map((contract) => contract.package?.packageClass)),
    releaseReady: ready.length > 0,
    releaseReadyCount: ready.length,
    plannedOnly: Boolean(contracts.length && !ready.length),
    hostEvidenceRequired: contracts.some((contract) =>
      contract.semanticIndex?.hostEvidenceRequired || contract.proofEvidence?.hostEvidenceRequired
    ),
    targetProjectionSupported: targetProjection.length > 0 || knownPackage?.targetProjectionSupported === true,
    targetProjectionTargets: uniqueStrings(targetProjection.flatMap((contract) => contract.targetProjection?.targets ?? [])),
    requiredEvidenceKeys: uniqueStrings(contracts.flatMap((contract) => contract.proofEvidence?.requiredEvidenceKeys ?? [])),
    notes: packageNotes(status, knownPackage, contracts)
  };
}

function packageMatchIdsForEntry(entry) {
  if (!entry.rowKind || entry.rowKind === 'language') return coverageIdsForProfile(entry);
  return uniqueStrings([entry.id, ...(entry.aliases ?? [])].map(normalizeCoverageId).filter(Boolean));
}

function packageStatus(contracts, ready, targetProjection, knownPackage) {
  if (targetProjection.length) return 'target-projection';
  if (ready.length) return 'platform-importer';
  if (contracts.length) return 'planned-platform';
  if (knownPackage) return knownPackage.status;
  return 'missing-package';
}

function plannedSurfaces() {
  return rowSurfaces('planned', {
    runtimeProof: 'partial',
    targetLowering: 'missing',
    roundtripProjection: 'missing',
    crossLanguageConversion: 'missing'
  });
}

function platformImporterSurfaces() {
  return rowSurfaces('partial', {
    parserSourceSpanTrivia: 'adapter-only',
    targetLowering: 'missing',
    roundtripProjection: 'adapter-only',
    runtimeProof: 'partial',
    crossLanguageConversion: 'adapter-only'
  });
}

function profileOnlySurfaces(entry) {
  const hasParser = (entry.parserAdapters ?? []).length > 0;
  return rowSurfaces(hasParser ? 'partial' : 'missing', {
    parserSourceSpanTrivia: hasParser ? 'adapter-only' : 'missing',
    targetLowering: 'missing',
    roundtripProjection: 'missing',
    runtimeProof: 'partial',
    packageBuildGraph: 'missing',
    crossLanguageConversion: 'missing'
  });
}

function weightedCompletion(surfaces) {
  let total = 0;
  let weight = 0;
  for (const surface of surfaces) {
    if (surface.estimate === undefined) continue;
    const surfaceWeight = UniversalLanguageCoverageSurfaceWeights[surface.surface] ?? 1;
    total += surface.estimate * surfaceWeight;
    weight += surfaceWeight;
  }
  return weight ? total / weight : 0;
}

function capCompletionEstimate(value, packageEvidence, id) {
  const cap = {
    'target-projection': 1,
    'dependency-only': 0.86,
    'platform-importer': 0.52,
    'planned-platform': 0.26,
    'missing-package': 0.42
  }[packageEvidence.status] ?? 0.5;
  return Math.min(value, id === 'canvas' ? Math.min(cap, 0.64) : cap);
}

function readinessForRow(completionEstimate, surfaces, packageEvidence) {
  if (surfaces.some((surface) => surface.status === 'blocked')) return 'blocked';
  if (packageEvidence.status === 'planned-platform') return 'planned';
  if (completionEstimate >= 0.82) return 'high';
  if (completionEstimate >= 0.64) return 'bounded-evidence';
  if (completionEstimate >= 0.28) return 'partial';
  if (completionEstimate > 0) return 'planned';
  return 'blocked';
}

function remainingWorkForRow(surfaces, packageEvidence) {
  const work = surfaces
    .filter((surface) => !['high', 'bounded-evidence', 'not-applicable'].includes(surface.status))
    .map((surface) => `${surface.surface}: ${surface.status}`);
  if (packageEvidence.status === 'missing-package') work.push('package: no release/package contract evidence');
  if (packageEvidence.status === 'planned-platform') work.push('package: planned adapter is not release-ready');
  return uniqueStrings(work);
}

function matchSurfaceStatus(row, surfaceFilter, statusFilter) {
  const statuses = asList(statusFilter);
  if (!statuses.length) return true;
  const surfaces = asList(surfaceFilter);
  return row.surfaces.some((surface) =>
    (!surfaces.length || surfaces.includes(surface.surface)) && statuses.includes(surface.status)
  );
}

function evidenceForSurface(surface, status, context) {
  if (['missing', 'blocked', 'planned'].includes(status)) return [];
  const evidence = ['coverage-matrix'];
  if (context.packageEvidence.packageNames.length) evidence.push('package-catalog');
  if (surface === 'runtimeProof') evidence.push('runtime-proof-contract');
  return evidence;
}

function blockersForSurface(surface, status, context) {
  if (status === 'missing') return [`${surface} has no declared coverage for ${context.id}.`];
  if (status === 'blocked') return [`${surface} requires evidence before ${context.id} can auto-admit merges.`];
  if (status === 'planned') return [`${surface} is planned but not implemented for ${context.id}.`];
  return [];
}

function packageNotes(status, knownPackage, contracts) {
  if (knownPackage) return ['Compiler facade depends on a surface package; package contract is not a universal target adapter row.'];
  if (!contracts.length) return ['No package contract matched this matrix row.'];
  if (status === 'platform-importer') return ['Published platform importer requires host parser/build evidence.'];
  if (status === 'planned-platform') return ['Adapter package is a planned contract placeholder.'];
  return ['Target projection package contract is release-ready with explicit loss boundaries.'];
}

function normalizeCoverageStatus(value) {
  const status = String(value ?? '').toLowerCase();
  return UniversalLanguageCoverageStatuses.includes(status) ? status : 'missing';
}

function matchLanguage(filter, row) {
  const filters = asList(filter).map(normalizeCoverageId).filter(Boolean);
  if (!filters.length) return true;
  const rowIds = [row.id, row.language, ...(row.aliases ?? [])].map(normalizeCoverageId);
  return filters.some((item) => rowIds.includes(item));
}

function match(filter, values) {
  const filters = asList(filter).map(String).filter(Boolean);
  if (!filters.length) return true;
  const set = new Set((values ?? []).map(String));
  return filters.some((item) => set.has(item));
}

function asList(value) {
  return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
}

function countBy(values) {
  const counts = {};
  for (const value of values ?? []) {
    const key = String(value ?? 'unknown');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function average(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function roundEstimate(value) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}
