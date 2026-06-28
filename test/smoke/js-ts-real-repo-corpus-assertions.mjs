import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RealRepoCorpusSurfaceAudit, measureRealRepoCorpus, readRealRepoCorpusFixture, realRepoSurfaceOracleRoute } from '../../bench/real-repo-corpus-suite.mjs';
import { assertOracleCase, assertRealRepoSource, matrixRowsForOracleSurface } from './js-ts-real-repo-corpus-assertion-helpers.mjs';
import {
  assertBroadSuiteGaps,
  assertLocalCheckoutProof,
  assertPackageManagerMatrix
} from './js-ts-real-repo-corpus-proof-helpers.mjs';
import { assertRealRepoCorpusMetrics } from './js-ts-real-repo-corpus-metrics-assertions.mjs';

function assertRealRepoCorpus(manifest, fixtureIds, assert, fixturesById) {
  assert.equal(manifest?.schema, 'frontier.lang.jsTsSemanticMergeRealRepoCorpus.v1', 'real-repo corpus schema');
  assert.equal(manifest.mode, 'manifest-only', 'real-repo corpus must not vendor external source');
  assert.equal(typeof manifest.fetchRoot, 'string', 'real-repo fetch root');
  assert.equal(manifest.localBehavior?.skipWhenMissing, true, 'real-repo corpus must skip absent checkouts');
  assert.equal(manifest.localBehavior?.missingCheckoutBehavior, 'skip-external-fetch', 'real-repo corpus missing-checkout behavior');
  assert.equal(manifest.localBehavior?.committedSourceBytes, 0, 'real-repo corpus must not commit third-party source bytes');
  assertLocalCheckoutProof(manifest, assert);
  assertPackageManagerMatrix(manifest, assert);
  assert.equal(Array.isArray(manifest.entries) && manifest.entries.length >= 4, true, 'real-repo corpus entries');
  assertBroadSuiteGaps(manifest, assert);

  const entryIds = new Set();
  const oracleIds = new Set();
  const oracleStatuses = new Set();
  const oracleSurfaces = new Set();
  const oracleLanguages = new Set();
  const oracleMatrixRows = new Set();
  const mergeSurfaceIds = new Set();
  const failClosedSurfaces = new Set();
  const realisticPatternFixtureIds = new Set(['react-tsx-child-additions-shell', 'vite-config-import-shape-addition']);
  const realisticPatternOracleFixtureIds = new Set();
  let oracleCaseCount = 0;
  let entriesWithOracleCases = 0;
  for (const entry of manifest.entries) {
    assert.match(entry.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${entry.id}: id`);
    assert.equal(entryIds.has(entry.id), false, `${entry.id}: duplicate real-repo entry id`);
    entryIds.add(entry.id);
    assertRealRepoSource(manifest, entry, assert);
    assert.equal(Array.isArray(entry.pathGlobs) && entry.pathGlobs.length > 0, true, `${entry.id}: path globs`);
    assert.equal(typeof entry.shape === 'string' && entry.shape.length > 0, true, `${entry.id}: shape`);
    assert.equal(Number.isInteger(entry.metrics?.sampleFiles) && entry.metrics.sampleFiles > 0, true, `${entry.id}: sample files`);
    assert.equal(Number.isInteger(entry.metrics?.maxBytesPerFile) && entry.metrics.maxBytesPerFile <= 500_000, true, `${entry.id}: source byte budget`);
    assert.equal(Array.isArray(entry.metrics?.mergeSurfaces) && entry.metrics.mergeSurfaces.length > 0, true, `${entry.id}: merge surfaces`);
    for (const surface of entry.metrics.mergeSurfaces) {
      const route = realRepoSurfaceOracleRoute(surface);
      mergeSurfaceIds.add(surface);
      assert.ok(route, `${entry.id}: merge surface route ${surface}`);
      assert.equal(route.matrixRows.length > 0 || route.failClosedRoutes.length > 0, true, `${entry.id}: merge surface matrix or fail-closed route ${surface}`);
      if (route.failClosedRoutes.length) failClosedSurfaces.add(surface);
    }
    assert.equal(Array.isArray(entry.fixtureIds) && entry.fixtureIds.length > 0, true, `${entry.id}: linked fixtures`);
    const entryFixtureIds = new Set();
    for (const fixtureId of entry.fixtureIds) {
      assert.equal(fixtureIds.has(fixtureId), true, `${entry.id}: unknown linked fixture ${fixtureId}`);
      assert.equal(entryFixtureIds.has(fixtureId), false, `${entry.id}: duplicate linked fixture ${fixtureId}`);
      entryFixtureIds.add(fixtureId);
    }
    if ((entry.oracleCases ?? []).length > 0) entriesWithOracleCases += 1;
    for (const oracleCase of entry.oracleCases ?? []) {
      oracleCaseCount += 1;
      const oracleId = `${entry.id}:${oracleCase.fixtureId}:${oracleCase.surface}`;
      assert.equal(oracleIds.has(oracleId), false, `${entry.id}: duplicate oracle case ${oracleId}`);
      oracleIds.add(oracleId);
      oracleStatuses.add(oracleCase.expectedAdmissionStatus);
      oracleSurfaces.add(oracleCase.surface);
      oracleLanguages.add(oracleCase.language);
      for (const row of matrixRowsForOracleSurface(oracleCase.surface)) oracleMatrixRows.add(row);
      if (realisticPatternFixtureIds.has(oracleCase.fixtureId)) realisticPatternOracleFixtureIds.add(oracleCase.fixtureId);
      assertOracleCase(entry, oracleCase, fixtureIds, assert, fixturesById);
    }
    for (const field of ['sourceLines', 'baseLines', 'workerLines', 'headLines', 'expectedLines']) {
      assert.equal(entry[field], undefined, `${entry.id}: real-repo manifest must not vendor ${field}`);
    }
  }
  assert.equal(entriesWithOracleCases, manifest.entries.length, 'each real-repo entry must link oracle cases');
  assert.equal(oracleCaseCount >= 6, true, 'real-repo corpus oracle cases');
  assert.equal(oracleSurfaces.size >= 5, true, 'real-repo corpus oracle surface coverage');
  assert.equal(oracleLanguages.size >= 3, true, 'real-repo corpus oracle language coverage');
  assert.deepEqual([...failClosedSurfaces].sort(), RealRepoCorpusSurfaceAudit.failClosedSurfaces, 'real-repo corpus fail-closed surfaces');
  assert.equal(mergeSurfaceIds.size >= RealRepoCorpusSurfaceAudit.matrixRows.length, true, 'real-repo corpus routed merge surfaces');
  assert.equal(entryIds.has('react-component-patterns'), true, 'real-repo corpus React manifest entry');
  for (const fixtureId of realisticPatternFixtureIds) {
    assert.equal(realisticPatternOracleFixtureIds.has(fixtureId), true, `real-repo corpus realistic-pattern oracle ${fixtureId}`);
  }
  for (const row of ['module-export-import', 'jsx-tsx-element-prop']) {
    assert.equal(oracleMatrixRows.has(row), true, `real-repo corpus matrix row ${row}`);
  }
  for (const status of ['auto-merge-candidate', 'blocked', 'conflict']) {
    assert.equal(oracleStatuses.has(status), true, `real-repo corpus oracle status ${status}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const corpus = readRealRepoCorpusFixture();
  const fixtureIds = new Set((corpus.fixtures ?? []).map((fixture) => fixture.id));
  const fixturesById = new Map((corpus.fixtures ?? []).map((fixture) => [fixture.id, fixture]));
  assertRealRepoCorpus(corpus.realRepoCorpus, fixtureIds, assert, fixturesById);
  const metrics = measureRealRepoCorpus();
  assertRealRepoCorpusMetrics(metrics, corpus.realRepoCorpus, assert);
  console.log(JSON.stringify({
    realRepoCorpusAssertions: 'passed',
    entries: metrics.realRepoCorpusEntries,
    checkoutEvidenceRows: metrics.realRepoCorpusCheckoutEvidenceRows.length,
    checkoutProofExecuted: metrics.realRepoCorpusCheckoutEvidenceExecuted,
    repositoryCommandsRun: metrics.realRepoCorpusRepositoryCommandsRun
  }));
}

export { assertRealRepoCorpus, assertRealRepoCorpusMetrics };
