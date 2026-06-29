import assert from 'node:assert/strict';
import { RealRepoCorpusSurfaceAudit } from './real-repo-corpus-surface-routes.mjs';

const RealRepoCorpusOracleCoverage = Object.freeze({
  oracleCases: 16,
  matrixRows: Object.freeze([
    'control-flow-effect',
    'jsx-tsx-element-prop',
    'module-export-import',
    'parser-source-span-trivia',
    'type-public-api'
  ]),
  productionMatrixRows: Object.freeze([
    'control-flow-effect-graph',
    'jsx-tsx-element-prop-graph',
    'module-export-import-graph',
    'parser-source-span-trivia',
    'type-public-api-graph'
  ]),
  unmappedSurfaces: Object.freeze(['order-sensitive-member-regions']),
  coverageRatioBasis: 'entriesWithOracleCases/entries'
});

function assertRealRepoCorpusOracleCoverageMetrics(metrics) {
  assert.equal(metrics.realRepoCorpusOracleCases, RealRepoCorpusOracleCoverage.oracleCases, 'real-repo README oracle case count');
  assert.deepEqual(metrics.realRepoCorpusOracleMatrixRowIds, RealRepoCorpusOracleCoverage.matrixRows, 'real-repo README matrix row ids');
  assert.deepEqual(metrics.realRepoCorpusOracleProductionMatrixRowIds, RealRepoCorpusOracleCoverage.productionMatrixRows, 'real-repo production matrix row ids');
  assert.deepEqual(metrics.realRepoCorpusOracleUnmappedSurfaceIds, RealRepoCorpusOracleCoverage.unmappedSurfaces, 'real-repo known non-matrix oracle surfaces');
  assert.deepEqual(metrics.realRepoCorpusMergeSurfaceMatrixRowIds, RealRepoCorpusSurfaceAudit.matrixRows, 'real-repo merge surface matrix rows');
  assert.deepEqual(metrics.realRepoCorpusMergeSurfaceProductionMatrixRowIds, RealRepoCorpusSurfaceAudit.productionMatrixRows, 'real-repo merge surface production matrix rows');
  assert.deepEqual(metrics.realRepoCorpusMergeSurfaceFailClosedSurfaceIds, RealRepoCorpusSurfaceAudit.failClosedSurfaces, 'real-repo merge surface fail-closed surfaces');
  assert.deepEqual(metrics.realRepoCorpusMergeSurfaceFailClosedRouteIds, RealRepoCorpusSurfaceAudit.failClosedRouteIds, 'real-repo merge surface fail-closed routes');
  assert.equal(metrics.realRepoCorpusMergeSurfaceUnroutedSurfaces, 0, 'real-repo merge surfaces must all map or fail closed');
  for (const row of metrics.realRepoCorpusMergeSurfaceAuditRows ?? []) assertRealRepoSurfaceAuditRow(row);
  assert.equal(metrics.realRepoCorpusOracleCaseFixturesPresent, metrics.realRepoCorpusOracleCases, 'real-repo oracle fixtures present');
  assert.equal(metrics.realRepoCorpusOracleAdmissionMatches, metrics.realRepoCorpusOracleCases, 'real-repo oracle fixture admission matches');
  assert.equal(
    metrics.realRepoCorpusOracleCoverageRatio,
    metrics.realRepoCorpusEntries > 0 ? Number((metrics.realRepoCorpusEntriesWithOracles / metrics.realRepoCorpusEntries).toFixed(2)) : 0,
    'real-repo oracle coverage ratio basis'
  );
  assert.equal(metrics.realRepoCorpusOracleCoverageRatioBasis, RealRepoCorpusOracleCoverage.coverageRatioBasis, 'real-repo oracle coverage ratio basis label');
}

function assertRealRepoSurfaceAuditRow(row) {
  assert.equal(['matrix-row-mapped', 'fail-closed-routed'].includes(row.evidenceStatus), true, `${row.surface}: real-repo surface audit status`);
  assert.equal(row.matrixRows.length > 0 || row.failClosedRoutes.length > 0, true, `${row.surface}: real-repo surface audit route`);
  for (const route of row.failClosedRoutes) {
    assert.equal(typeof route.routeId === 'string' && route.routeId.length > 0, true, `${row.surface}: fail-closed route id`);
    assert.equal(typeof route.routeLane === 'string' && route.routeLane.length > 0, true, `${row.surface}: fail-closed route lane`);
    assert.equal(typeof route.reasonCode === 'string' && route.reasonCode.length > 0, true, `${row.surface}: fail-closed reason code`);
    assert.equal(route.expectedAdmissionStatus, 'blocked', `${row.surface}: fail-closed expected admission`);
  }
}

export { RealRepoCorpusOracleCoverage, assertRealRepoCorpusOracleCoverageMetrics };
