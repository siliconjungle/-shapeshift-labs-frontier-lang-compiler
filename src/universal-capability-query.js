import { normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';
import { createUniversalCapabilityMatrix } from './universal-capability-matrix.js';

export function queryUniversalCapabilityMatrix(matrixOrInput = {}, query = {}, context = {}) {
  const matrix = matrixOrInput?.kind === 'frontier.lang.universalCapabilityMatrix'
    ? matrixOrInput
    : createUniversalCapabilityMatrix(matrixOrInput, context);
  const rows = (matrix.languages ?? []).filter((row) => universalCapabilityRowMatches(row, query));
  return {
    kind: 'frontier.lang.universalCapabilityQuery',
    version: 1,
    found: rows.length > 0,
    rows,
    bestRow: rows.slice().sort(compareUniversalCapabilityRows)[0],
    summary: universalCapabilityQuerySummary(rows),
    reasons: rows.length ? [] : [`No universal capability row matched language=${query.language ?? '*'} target=${query.target ?? '*'}.`]
  };
}

function universalCapabilityRowMatches(row, query) {
  return matchLanguage(query.language, row)
    && match(query.readiness, [row.readiness])
    && match(query.importReadiness, [row.imports.readiness])
    && match(query.parserReadiness, [row.parser.readiness])
    && match(query.projectionReadiness, [row.projection.readiness])
    && match(query.parser, row.parser.parsers)
    && match(query.target, row.projection.targets.map((entry) => entry.target))
    && match(query.targetLossClass, row.projection.targets.map((entry) => entry.lossClass))
    && match(query.targetAdapterId, row.projection.targets.map((entry) => entry.adapter))
    && match(query.missingTarget, row.projection.missingTargets)
    && match(query.unsupportedTarget, row.projection.unsupportedTargets)
    && match(query.packageReadiness, [row.packageContract.readiness])
    && match(query.packageName, row.packageContract.packageNames)
    && match(query.packageClass, row.packageContract.packageClasses)
    && match(query.packageReleaseStatus, Object.keys(row.packageContract.byReleaseReadiness ?? {}))
    && matchBoolean(query.packageReleaseReady, row.packageContract.releaseReady)
    && matchBoolean(query.packagePlannedOnly, row.packageContract.plannedOnly)
    && matchBoolean(query.packageMissingContract, row.packageContract.missingContract)
    && matchBoolean(query.packageSourceImporterOnly, row.packageContract.sourceImporterOnly)
    && matchBoolean(query.packageHostEvidenceRequired, row.packageContract.hostEvidenceRequired)
    && matchBoolean(query.packageTargetProjectionSupported, row.packageContract.targetProjection.supported)
    && matchBoolean(query.packageTargetProjectionMissing, row.packageContract.targetProjection.missing)
    && match(query.packageTargetProjectionTarget, row.packageContract.targetProjection.targets)
    && match(query.requiredEvidenceKey, row.packageContract.requiredEvidenceKeys)
    && match(query.blocker, row.blockers)
    && match(query.reviewReason, row.review);
}

function universalCapabilityQuerySummary(rows) {
  return {
    rows: rows.length,
    languages: uniqueStrings(rows.map((row) => row.language)),
    ready: rows.filter((row) => row.readiness === 'ready').length,
    readyWithLosses: rows.filter((row) => row.readiness === 'ready-with-losses').length,
    needsReview: rows.filter((row) => row.readiness === 'needs-review').length,
    blocked: rows.filter((row) => row.readiness === 'blocked').length,
    packageReleaseReady: rows.filter((row) => row.packageContract.releaseReady).length,
    packagePlannedOnly: rows.filter((row) => row.packageContract.plannedOnly).length,
    packageSourceImporterOnly: rows.filter((row) => row.packageContract.sourceImporterOnly).length,
    packageMissingContracts: rows.filter((row) => row.packageContract.missingContract).length,
    packageTargetProjectionSupported: rows.filter((row) => row.packageContract.targetProjection.supported).length,
    packageTargetProjectionMissing: rows.filter((row) => row.packageContract.targetProjection.missing).length,
    packageNames: uniqueStrings(rows.flatMap((row) => row.packageContract.packageNames)),
    packageClasses: uniqueStrings(rows.flatMap((row) => row.packageContract.packageClasses)),
    packageTargetProjectionTargets: uniqueStrings(rows.flatMap((row) => row.packageContract.targetProjection.targets)),
    requiredEvidenceKeys: uniqueStrings(rows.flatMap((row) => row.packageContract.requiredEvidenceKeys))
  };
}

function compareUniversalCapabilityRows(left, right) {
  return universalCapabilityRowSortKey(right) - universalCapabilityRowSortKey(left);
}

function universalCapabilityRowSortKey(row) {
  const readinessScore = { ready: 4, 'ready-with-losses': 3, 'needs-review': 2, blocked: 1 };
  return (readinessScore[row.readiness] ?? 0) * 100
    + (row.packageContract.releaseReady ? 20 : 0)
    + (row.packageContract.targetProjection.supported ? 10 : 0)
    + Math.min(row.imports.total ?? 0, 9);
}

function matchLanguage(filter, row) {
  const filters = asFilterList(filter).map(normalizeNativeLanguageId).filter(Boolean);
  if (!filters.length) return true;
  const ids = [row.language, ...(row.aliases ?? [])].map(normalizeNativeLanguageId);
  return filters.some((entry) => ids.includes(entry));
}

function match(filter, values) {
  const filters = asFilterList(filter).filter((value) => value !== undefined && value !== null).map(String);
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter((value) => value !== undefined && value !== null).map(String));
  return filters.some((item) => valueSet.has(item));
}

function matchBoolean(filter, value) {
  if (filter === undefined) return true;
  return asFilterList(filter).some((item) => Boolean(item) === Boolean(value));
}

function asFilterList(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}
