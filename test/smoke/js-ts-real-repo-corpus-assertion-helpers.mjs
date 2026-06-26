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

  const fixture = fixturesById?.get(oracleCase.fixtureId);
  if (!fixture) return;
  assert.equal(fixture.language, oracleCase.language, `${entry.id}: oracle fixture language`);
  assert.equal(fixture.coverage.includes(oracleCase.surface), true, `${entry.id}: oracle fixture surface`);
  assert.equal(fixtureExpectedAdmissionStatus(fixture), oracleCase.expectedAdmissionStatus, `${entry.id}: oracle fixture admission status`);
}

function fixtureExpectedAdmissionStatus(fixture) {
  if (fixture.expected?.admissionStatus) return fixture.expected.admissionStatus;
  if (fixture.expected?.safeMergeStatus === 'merged') return 'auto-merge-candidate';
  if (fixture.expected?.safeMergeStatus === 'rejected') return 'blocked';
  return undefined;
}

function matrixRowsForOracleSurface(surface) {
  if ([
    'imports',
    'type-only-imports',
    'value-import-dependencies',
    'import-specifier-order',
    'import-shape-additions',
    'new-import-declarations',
    'exports'
  ].includes(surface)) return ['module-export-import'];
  if ([
    'type-aliases',
    'type-interface-members',
    'overloads',
    'exported-types',
    'dependency-sensitive-edits'
  ].includes(surface)) return ['type-public-api'];
  if (surface.startsWith('tsx-jsx-') || surface === 'jsx-component-prop-contracts') return ['jsx-tsx-element-prop'];
  if (surface === 'control-flow' || surface === 'async-components' || surface === 'import-meta-host-context') return ['control-flow-effect'];
  if (surface === 'comments-trivia' || surface === 'generated-source-map-boundary') return ['parser-source-span-trivia'];
  return [];
}

export { assertOracleCase, assertRealRepoSource, matrixRowsForOracleSurface };
