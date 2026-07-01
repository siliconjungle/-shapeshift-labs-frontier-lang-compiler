import { maxSemanticMergeReadiness, normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';
import { normalizeProjectionMatrixTargets } from './coverage-matrix-profiles.js';
import { createUniversalDialectRegistry } from './universal-dialect-registry.js';

export function conversionDialectRegistries(input = {}) {
  const registries = [];
  addRegistry(registries, input.universalDialectRegistry);
  if ((input.dialects ?? []).length || (input.externs ?? []).length) addRegistry(registries, input);
  for (const imported of input.imports ?? []) addRegistry(registries, imported?.universalAst?.metadata?.dialects);
  return uniqueRegistries(registries);
}

export function conversionDialectCoverage(registries = [], language = {}, target) {
  const records = registries.flatMap((registry) => dialectRecordsForRoute(registry, language, target));
  const readiness = records.reduce((value, entry) => maxSemanticMergeReadiness(value, entry.readiness), 'ready');
  const blocked = records.filter((entry) => entry.readiness === 'blocked');
  const review = records.filter((entry) => entry.readiness === 'needs-review' || entry.readiness === 'ready-with-losses');
  const missingProof = records.filter((entry) => entry.readiness !== 'ready' && entry.evidenceIds.length === 0);
  return {
    registryIds: uniqueStrings(records.map((entry) => entry.registryId)),
    recordIds: uniqueStrings(records.map((entry) => entry.id)),
    constructKinds: uniqueStrings(records.map((entry) => entry.constructKind).filter(Boolean)),
    externKinds: uniqueStrings(records.map((entry) => entry.externKind).filter(Boolean)),
    projectionDispositions: uniqueStrings(records.map((entry) => entry.disposition).filter(Boolean)),
    evidenceIds: uniqueStrings(records.flatMap((entry) => entry.evidenceIds)),
    lossIds: uniqueStrings(records.flatMap((entry) => entry.lossIds)),
    readiness,
    records: records.map((entry) => ({ ...entry })),
    blockers: blocked.map((entry) => `Dialect projection is blocked for ${entry.label}.`),
    review: review.map((entry) => `Dialect projection needs review for ${entry.label}.`),
    missingEvidence: missingProof.length ? ['dialect-projection-evidence'] : [],
    tasks: records.length ? [`review dialect projection evidence for ${language.language} to ${target}`] : []
  };
}

export function conversionRouteMatchesDialectQuery(route, query = {}) {
  if (!match(query.dialectReadiness, [route.dialect?.readiness])) return false;
  if (!match(query.dialectRegistryId, route.dialect?.registryIds ?? [])) return false;
  if (!match(query.dialectRecordId, route.dialect?.recordIds ?? [])) return false;
  if (!match(query.dialectConstructKind, route.dialect?.constructKinds ?? [])) return false;
  if (!match(query.dialectExternKind, route.dialect?.externKinds ?? [])) return false;
  if (!match(query.dialectDisposition, route.dialect?.projectionDispositions ?? [])) return false;
  if (!match(query.dialectEvidenceId, route.dialect?.evidenceIds ?? [])) return false;
  if (!match(query.dialectLossId, route.dialect?.lossIds ?? [])) return false;
  return true;
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}

function addRegistry(registries, value) {
  if (!value) return;
  if (value.kind === 'frontier.lang.universalDialectRegistry' || (value.dialects ?? value.records ?? value.externs)) registries.push(createUniversalDialectRegistry(value));
}

function dialectRecordsForRoute(registry, language, target) {
  const languageIds = new Set(uniqueStrings([language.language, ...(language.aliases ?? [])].map(normalizeNativeLanguageId)));
  const normalizedTarget = normalizeProjectionMatrixTargets([target])[0] ?? String(target ?? '');
  return [...(registry.dialects ?? []), ...(registry.externs ?? [])]
    .filter((record) => dialectRecordMatches(record, languageIds, normalizedTarget))
    .map((record) => dialectRouteRecord(registry, record));
}

function dialectRecordMatches(record, languageIds, target) {
  const language = normalizeNativeLanguageId(record.language);
  if (language && language !== 'mixed' && !languageIds.has(language)) return false;
  const targets = normalizeProjectionMatrixTargets(record.projection?.targets ?? []);
  return !targets.length || targets.includes(target);
}

function dialectRouteRecord(registry, record) {
  const disposition = record.projection?.disposition;
  return {
    registryId: registry.id,
    id: record.id,
    kind: record.kind,
    language: record.language,
    dialect: record.dialect,
    constructKind: record.constructKind,
    externKind: record.externKind,
    name: record.name,
    label: `${record.dialect}:${record.name ?? record.constructKind ?? record.externKind ?? record.id}`,
    disposition,
    readiness: record.projection?.readiness ?? 'needs-review',
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...(record.projection?.evidenceIds ?? [])]),
    lossIds: uniqueStrings([...(record.lossIds ?? []), ...(record.projection?.lossIds ?? [])])
  };
}

function uniqueRegistries(registries) {
  const seen = new Set();
  return registries.filter((registry) => {
    if (!registry?.id || seen.has(registry.id)) return false;
    seen.add(registry.id);
    return true;
  });
}
