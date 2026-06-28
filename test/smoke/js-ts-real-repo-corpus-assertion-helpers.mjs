import { matrixRowsForOracleSurface, realRepoSurfaceOracleRoute } from '../../bench/real-repo-corpus-suite.mjs';

function assertRealRepoSource(manifest, entry, assert) {
  assert.equal(entry.source?.type, 'git', `${entry.id}: source type`);
  assert.match(entry.source.url, /^https:\/\/github\.com\//, `${entry.id}: source url`);
  assert.equal(typeof entry.source.ref, 'string', `${entry.id}: source ref`);
  assert.match(entry.checkoutDir, /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, `${entry.id}: checkout dir`);
  assert.match(entry.licenseExpectation, /verify LICENSE/, `${entry.id}: license expectation`);
  assert.match(entry.fetchCommand, /^git clone /, `${entry.id}: fetch command`);
  assert.match(entry.fetchCommand, /--filter=blob:none/, `${entry.id}: fetch should avoid eager blob download`);
  assert.match(entry.fetchCommand, /--depth=1/, `${entry.id}: fetch should be shallow`);
  const escapedUrl = entry.source.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(entry.fetchCommand, new RegExp(escapedUrl), `${entry.id}: fetch source url`);
  const target = `${manifest.fetchRoot}/${entry.checkoutDir}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(entry.fetchCommand, new RegExp(`${target}$`), `${entry.id}: fetch target checkout dir`);
}

function assertOracleCase(entry, oracleCase, fixtureIds, assert, fixturesById) {
  assert.equal(typeof oracleCase.fixtureId, 'string', `${entry.id}: oracle fixture id`);
  assert.equal(fixtureIds.has(oracleCase.fixtureId), true, `${entry.id}: unknown oracle fixture ${oracleCase.fixtureId}`);
  assert.equal(entry.fixtureIds.includes(oracleCase.fixtureId), true, `${entry.id}: oracle fixture must be linked`);
  assert.equal(['javascript', 'typescript', 'tsx'].includes(oracleCase.language), true, `${entry.id}: oracle language`);
  assert.equal(
    typeof oracleCase.surface === 'string' && entry.metrics.mergeSurfaces.includes(oracleCase.surface),
    true,
    `${entry.id}: oracle surface`
  );
  assert.equal(
    ['auto-merge-candidate', 'blocked', 'conflict'].includes(oracleCase.expectedAdmissionStatus),
    true,
    `${entry.id}: oracle expected admission status`
  );
  const route = realRepoSurfaceOracleRoute(oracleCase.surface);
  assert.ok(route, `${entry.id}: oracle surface route`);
  assert.equal(route.matrixRows.length > 0 || route.failClosedRoutes.length > 0, true, `${entry.id}: oracle matrix or fail-closed route`);

  const fixture = fixturesById?.get(oracleCase.fixtureId);
  if (!fixture) return;
  assert.equal(fixture.language, oracleCase.language, `${entry.id}: oracle fixture language`);
  assert.equal(fixture.coverage.includes(oracleCase.surface), true, `${entry.id}: oracle fixture surface`);
  assert.equal(fixtureExpectedAdmissionStatus(fixture), oracleCase.expectedAdmissionStatus, `${entry.id}: oracle fixture admission status`);
  for (const failClosedRoute of route.failClosedRoutes) {
    assert.equal(oracleCase.expectedAdmissionStatus, failClosedRoute.expectedAdmissionStatus, `${entry.id}: fail-closed oracle status`);
    assert.equal(fixture.id, failClosedRoute.fixtureId, `${entry.id}: fail-closed fixture id`);
    assert.equal(
      (fixture.expected?.reasonCodes ?? []).includes(failClosedRoute.fixtureReason),
      true,
      `${entry.id}: fail-closed fixture reason ${failClosedRoute.fixtureReason}`
    );
  }
}

function fixtureExpectedAdmissionStatus(fixture) {
  if (fixture.expected?.admissionStatus) return fixture.expected.admissionStatus;
  if (fixture.expected?.safeMergeStatus === 'merged') return 'auto-merge-candidate';
  if (fixture.expected?.safeMergeStatus === 'rejected') return 'blocked';
  return undefined;
}

export { assertOracleCase, assertRealRepoSource, matrixRowsForOracleSurface };
