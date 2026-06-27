import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { collectExternalCheckoutProofs } from './real-repo-corpus-checkout-proof.mjs';
import { collectRealRepoCommandExecution } from './real-repo-corpus-command-execution.mjs';
import { createCheckoutEvidenceRows } from './real-repo-corpus-evidence.mjs';

const realRepoCorpusFixtureCandidates = [
  {
    mode: 'workspace',
    url: new URL('../test/fixtures/js-ts-semantic-merge/corpus.json', import.meta.url)
  },
  {
    mode: 'split-parent-checkout',
    url: new URL('../../../../test/fixtures/js-ts-semantic-merge/corpus.json', import.meta.url)
  }
];

const RealRepoCorpusOracleCoverage = Object.freeze({
  oracleCases: 14,
  matrixRows: Object.freeze([
    'control-flow-effect',
    'jsx-tsx-element-prop',
    'module-export-import',
    'parser-source-span-trivia',
    'type-public-api'
  ]),
  unmappedSurfaces: Object.freeze(['order-sensitive-member-regions']),
  coverageRatioBasis: 'entriesWithOracleCases/entries'
});

function measureRealRepoCorpus(options = {}) {
  const start = performance.now();
  const fixture = loadRealRepoCorpusFixture();
  const corpus = fixture.corpus;
  const manifest = corpus.realRepoCorpus ?? {};
  const entries = manifest.entries ?? [];
  const fixturesById = new Map((corpus.fixtures ?? []).map((fixture) => [fixture.id, fixture]));
  const fixtureIds = new Set();
  const mergeSurfaces = new Set();
  const oracleFixtureIds = new Set();
  const oracleSurfaces = new Set();
  const oracleLanguages = new Set();
  const oracleMatrixRows = new Set();
  const oracleUnmappedSurfaces = new Set();
  const gapStatuses = new Set();
  const gapIds = new Set();
  const packageManagers = new Set((manifest.localBehavior?.packageManagerMatrix ?? []).map((row) => row.manager));
  const packageManagerCommands = (manifest.localBehavior?.packageManagerMatrix ?? [])
    .reduce((sum, row) => sum + (row.commands?.length ?? 0), 0);
  const realisticPatternFixtureIds = new Set(['react-tsx-child-additions-shell', 'vite-config-import-shape-addition']);
  const realisticPatternOracleFixtureIds = new Set();
  let sampleFiles = 0;
  let maxBytesPerFile = 0;
  let entriesWithOracleCases = 0;
  let oracleCases = 0;
  let oracleCaseFixturesPresent = 0;
  let oracleAdmissionMatches = 0;
  let oracleAutoMergeCandidates = 0;
  let oracleBlocked = 0;
  let oracleConflicts = 0;

  for (const gap of manifest.broadSuiteGaps ?? []) {
    gapIds.add(gap.id);
    gapStatuses.add(gap.status);
  }

  for (const entry of entries) {
    sampleFiles += entry.metrics?.sampleFiles ?? 0;
    maxBytesPerFile = Math.max(maxBytesPerFile, entry.metrics?.maxBytesPerFile ?? 0);
    for (const fixtureId of entry.fixtureIds ?? []) fixtureIds.add(fixtureId);
    for (const surface of entry.metrics?.mergeSurfaces ?? []) mergeSurfaces.add(surface);
    if ((entry.oracleCases ?? []).length > 0) entriesWithOracleCases += 1;
    for (const oracleCase of entry.oracleCases ?? []) {
      oracleCases += 1;
      oracleFixtureIds.add(oracleCase.fixtureId);
      oracleSurfaces.add(oracleCase.surface);
      oracleLanguages.add(oracleCase.language);
      const matrixRows = matrixRowsForOracleSurface(oracleCase.surface);
      if (matrixRows.length === 0) oracleUnmappedSurfaces.add(oracleCase.surface);
      for (const row of matrixRows) oracleMatrixRows.add(row);
      if (realisticPatternFixtureIds.has(oracleCase.fixtureId)) realisticPatternOracleFixtureIds.add(oracleCase.fixtureId);
      if (oracleCase.expectedAdmissionStatus === 'auto-merge-candidate') oracleAutoMergeCandidates += 1;
      if (oracleCase.expectedAdmissionStatus === 'blocked') oracleBlocked += 1;
      if (oracleCase.expectedAdmissionStatus === 'conflict') oracleConflicts += 1;
      const fixture = fixturesById.get(oracleCase.fixtureId);
      if (!fixture) continue;
      oracleCaseFixturesPresent += 1;
      if (fixtureExpectedAdmissionStatus(fixture) === oracleCase.expectedAdmissionStatus) oracleAdmissionMatches += 1;
    }
  }

  const checkoutProof = collectExternalCheckoutProofs(manifest, entries);
  const commandExecution = collectRealRepoCommandExecution(manifest, checkoutProof, options.realRepoCommandExecution ?? {});
  const checkoutEvidenceRows = createCheckoutEvidenceRows(manifest, checkoutProof, commandExecution);
  const metrics = {
    realRepoCorpusFixtureMode: fixture.mode,
    realRepoCorpusSchema: manifest.schema ?? null,
    realRepoCorpusMode: manifest.mode ?? null,
    realRepoCorpusEntries: entries.length,
    realRepoCorpusFetchCommands: entries.filter((entry) => typeof entry.fetchCommand === 'string').length,
    realRepoCorpusLinkedFixtures: fixtureIds.size,
    realRepoCorpusMergeSurfaces: mergeSurfaces.size,
    realRepoCorpusEntriesWithOracles: entriesWithOracleCases,
    realRepoCorpusOracleCases: oracleCases,
    realRepoCorpusOracleLinkedFixtures: oracleFixtureIds.size,
    realRepoCorpusOracleCaseFixturesPresent: oracleCaseFixturesPresent,
    realRepoCorpusOracleAdmissionMatches: oracleAdmissionMatches,
    realRepoCorpusOracleAutoMergeCandidates: oracleAutoMergeCandidates,
    realRepoCorpusOracleBlocked: oracleBlocked,
    realRepoCorpusOracleConflicts: oracleConflicts,
    realRepoCorpusOracleSurfaces: oracleSurfaces.size,
    realRepoCorpusOracleLanguages: oracleLanguages.size,
    realRepoCorpusOracleMatrixRows: oracleMatrixRows.size,
    realRepoCorpusOracleMatrixRowIds: [...oracleMatrixRows].sort(),
    realRepoCorpusOracleUnmappedSurfaces: oracleUnmappedSurfaces.size,
    realRepoCorpusOracleUnmappedSurfaceIds: [...oracleUnmappedSurfaces].sort(),
    realRepoCorpusRealisticPatternOracleFixtures: realisticPatternOracleFixtureIds.size,
    realRepoCorpusHasReactPatternEntry: entries.some((entry) => entry.id === 'react-component-patterns'),
    realRepoCorpusOracleCoverageRatio: entries.length > 0 ? Number((entriesWithOracleCases / entries.length).toFixed(2)) : 0,
    realRepoCorpusOracleCoverageRatioBasis: RealRepoCorpusOracleCoverage.coverageRatioBasis,
    realRepoCorpusBroadSuiteGaps: gapIds.size,
    realRepoCorpusBroadSuiteGapStatuses: gapStatuses.size,
    realRepoCorpusBroadSuiteMissingGaps: [...(manifest.broadSuiteGaps ?? [])].filter((gap) => gap.status === 'missing').length,
    realRepoCorpusBroadSuitePartialGaps: [...(manifest.broadSuiteGaps ?? [])].filter((gap) => gap.status === 'partial').length,
    realRepoCorpusBroadSuiteManualGaps: [...(manifest.broadSuiteGaps ?? [])].filter((gap) => gap.status === 'manual').length,
    realRepoCorpusPackageManagerMatrixEntries: packageManagers.size,
    realRepoCorpusPackageManagerMatrixCommands: packageManagerCommands,
    realRepoCorpusBudgetedSampleFiles: sampleFiles,
    realRepoCorpusMaxBytesPerFile: maxBytesPerFile,
    realRepoCorpusCommittedSourceBytes: manifest.localBehavior?.committedSourceBytes ?? null,
    realRepoCorpusExternalRootPresent: checkoutProof.rootPresent,
    realRepoCorpusLocalBehavior: checkoutProof.checkedOut > 0 ? 'external-checkout-present' : manifest.localBehavior?.missingCheckoutBehavior ?? 'unknown',
    realRepoCorpusCheckoutRootMode: checkoutProof.rootMode,
    realRepoCorpusCheckoutPresenceStatuses: new Set(checkoutEvidenceRows.map((row) => row.checkoutPresenceStatus)).size,
    realRepoCorpusCheckoutProofReasons: new Set(checkoutEvidenceRows.map((row) => row.checkoutProofReason)).size,
    realRepoCorpusCheckoutProofEntries: checkoutProof.rows.length,
    realRepoCorpusCheckoutProofRows: checkoutProof.rows,
    realRepoCorpusCheckoutEvidenceRows: checkoutEvidenceRows,
    realRepoCorpusCheckoutCheckedOut: checkoutProof.checkedOut,
    realRepoCorpusCheckoutSkipped: checkoutProof.skipped,
    realRepoCorpusCheckoutProofExecuted: checkoutProof.proofExecuted,
    realRepoCorpusCheckoutProofSkipped: checkoutProof.proofSkipped,
    realRepoCorpusCheckoutNoProofMatch: checkoutProof.noProofMatch,
    realRepoCorpusCheckoutEvidenceExecuted: checkoutEvidenceRows.filter((row) => row.checkoutProofExecution === 'executed').length,
    realRepoCorpusCheckoutEvidenceSkipped: checkoutEvidenceRows.filter((row) => row.checkoutProofExecution === 'skipped').length,
    realRepoCorpusCheckoutDirPresentRows: checkoutEvidenceRows.filter((row) => row.checkoutDirPresent === true).length,
    realRepoCorpusCheckoutRootMissingRows: checkoutEvidenceRows.filter((row) => row.checkoutPresenceStatus === 'checkout-root-missing').length,
    realRepoCorpusCheckoutRootUnconfiguredRows: checkoutEvidenceRows.filter((row) => row.checkoutPresenceStatus === 'checkout-root-unconfigured').length,
    realRepoCorpusCheckoutDirMissingRows: checkoutEvidenceRows.filter((row) => row.checkoutPresenceStatus === 'checkout-dir-missing').length,
    realRepoCorpusCheckoutDirNotDeclaredRows: checkoutEvidenceRows.filter((row) => row.checkoutPresenceStatus === 'checkout-dir-not-declared').length,
    realRepoCorpusRepositoryCommandsRun: checkoutEvidenceRows.filter((row) => row.repositoryCommandExecution === 'executed').length,
    realRepoCorpusDependencyInstallsRun: checkoutEvidenceRows.filter((row) => row.dependencyInstallExecution === 'executed').length,
    realRepoCorpusCheckoutLockfileMetadataRows: checkoutEvidenceRows.filter((row) => row.packageManagerLockFilesPresent > 0).length,
    realRepoCorpusCheckoutProofMatchedEntries: checkoutProof.proofMatchedEntries,
    realRepoCorpusCheckoutProofMatchedFiles: checkoutProof.matchedFiles,
    realRepoCorpusCheckoutProofMaxBytesPerFile: checkoutProof.maxBytesPerFile,
    realRepoCorpusCheckoutProofStatuses: checkoutProof.statuses.size,
    realRepoCorpusCheckoutIdentityExecuted: checkoutProof.identityExecuted,
    realRepoCorpusCheckoutIdentitySkipped: checkoutProof.identitySkipped,
    realRepoCorpusCheckoutIdentityMetadataPresent: checkoutProof.identityMetadataPresent,
    realRepoCorpusCheckoutIdentityMatched: checkoutProof.identityMatched,
    realRepoCorpusCheckoutIdentityRemoteMatched: checkoutProof.identityRemoteMatched,
    realRepoCorpusCheckoutIdentityRefMatched: checkoutProof.identityRefMatched,
    realRepoCorpusCheckoutGitDirectories: checkoutEvidenceRows.filter((row) => row.gitMetadataKind === 'git-directory').length,
    realRepoCorpusCheckoutGitDirPointers: checkoutEvidenceRows.filter((row) => row.gitDirPointerPresent === true).length,
    realRepoCorpusCheckoutGitConfigsPresent: checkoutEvidenceRows.filter((row) => row.gitConfigPresent === true).length,
    realRepoCorpusCheckoutGitOriginUrlsPresent: checkoutEvidenceRows.filter((row) => row.gitRemoteOriginUrlPresent === true).length,
    realRepoCorpusCommandReadinessRows: checkoutEvidenceRows.length,
    realRepoCorpusDependencyInstallDefaultOffRows: checkoutEvidenceRows.filter((row) => row.dependencyInstallExecution === 'not-run-default-network-free').length,
    realRepoCorpusRepositoryCommandDefaultOffRows: checkoutEvidenceRows.filter((row) => row.repositoryCommandExecution === 'not-run-default-network-free').length,
    realRepoCorpusPackageManagerCommandMatrixRows: checkoutEvidenceRows.filter((row) => row.packageManagerCommandMatrixStatus === 'metadata-only').length,
    realRepoCorpusCommandDryRunPhaseRows: checkoutEvidenceRows.reduce((sum, row) => sum + row.commandDryRunPhases.length, 0),
    realRepoCorpusCommandDryRunPhaseKinds: new Set(checkoutEvidenceRows.flatMap((row) => row.commandDryRunPhases.map((phase) => phase.phase))).size,
    realRepoCorpusCommandDryRunSkippedPhases: checkoutEvidenceRows.reduce((sum, row) => sum + row.commandDryRunSkippedPhases, 0),
    realRepoCorpusCommandDryRunReadyPhases: checkoutEvidenceRows.reduce((sum, row) => sum + row.commandDryRunReadyPhases, 0),
    realRepoCorpusCommandDryRunOptInRequiredPhases: checkoutEvidenceRows.reduce((sum, row) => sum + row.commandDryRunOptInRequiredPhases, 0),
    realRepoCorpusCommandDryRunExecutedPhases: checkoutEvidenceRows.reduce((sum, row) => sum + row.commandDryRunExecutedPhases, 0),
    realRepoCorpusCommandDryRunDefaultOffPhases: checkoutEvidenceRows.reduce((sum, row) => sum + row.commandDryRunDefaultOffPhases, 0),
    realRepoCorpusCommandRunRows: commandExecution.commandRunRows,
    realRepoCorpusCommandRunEnabledRows: commandExecution.commandRunEnabledRows,
    realRepoCorpusCommandRunDefaultOffRows: commandExecution.commandRunDefaultOffRows,
    realRepoCorpusCommandRunOptInRequiredRows: commandExecution.commandRunOptInRequiredRows,
    realRepoCorpusCommandRunSkippedRows: commandExecution.commandRunSkippedRows,
    realRepoCorpusCommandRunBlockedRows: commandExecution.commandRunBlockedRows,
    realRepoCorpusCommandRunExecutedPhases: commandExecution.commandRunExecutedPhases,
    realRepoCorpusCommandRunFailedPhases: commandExecution.commandRunFailedPhases,
    realRepoCorpusCommandRunTimedOutPhases: commandExecution.commandRunTimedOutPhases,
    realRepoCorpusCommandRunSkippedPhases: commandExecution.commandRunSkippedPhases,
    realRepoCorpusCommandRunDefaultOffPhases: commandExecution.commandRunDefaultOffPhases,
    realRepoCorpusCommandRunOutputTruncatedPhases: commandExecution.commandRunOutputTruncatedPhases,
    realRepoCorpusDurationMs: Number((performance.now() - start).toFixed(2))
  };
  assertRealRepoCorpusOracleCoverageMetrics(metrics);
  assert.equal(metrics.realRepoCorpusRealisticPatternOracleFixtures >= 2, true, 'realistic-pattern oracle fixture coverage');
  assert.equal(metrics.realRepoCorpusHasReactPatternEntry, true, 'React manifest-only pattern entry');
  assert.equal(metrics.realRepoCorpusPackageManagerMatrixEntries >= 3, true, 'package-manager matrix metadata');
  assert.equal(oracleMatrixRows.has('module-export-import'), true, 'module/export/import matrix row covered');
  assert.equal(oracleMatrixRows.has('parser-source-span-trivia'), true, 'parser/source-span/trivia matrix row covered');
  assert.equal(oracleMatrixRows.has('jsx-tsx-element-prop'), true, 'JSX/TSX matrix row covered');
  assert.equal(metrics.realRepoCorpusCheckoutProofEntries, entries.length, 'checkout proof row per real-repo entry');
  assert.equal(
    metrics.realRepoCorpusCheckoutSkipped + metrics.realRepoCorpusCheckoutCheckedOut,
    entries.length,
    'checkout proof rows distinguish skipped and checked-out entries'
  );
  assert.equal(
    metrics.realRepoCorpusCheckoutProofSkipped + metrics.realRepoCorpusCheckoutProofExecuted,
    entries.length,
    'checkout proof rows distinguish skipped and executed proof rows'
  );
  assert.equal(metrics.realRepoCorpusCheckoutEvidenceRows.length, entries.length, 'checkout evidence row per real-repo entry');
  assert.equal(
    metrics.realRepoCorpusCheckoutEvidenceSkipped + metrics.realRepoCorpusCheckoutEvidenceExecuted,
    entries.length,
    'checkout evidence rows distinguish skipped and executed proof rows'
  );
  assert.equal(metrics.realRepoCorpusCheckoutDirPresentRows, metrics.realRepoCorpusCheckoutProofExecuted, 'checkout dir presence rows match executed proof rows');
  assert.equal(
    metrics.realRepoCorpusCheckoutDirPresentRows +
      metrics.realRepoCorpusCheckoutRootMissingRows +
      metrics.realRepoCorpusCheckoutRootUnconfiguredRows +
      metrics.realRepoCorpusCheckoutDirMissingRows +
      metrics.realRepoCorpusCheckoutDirNotDeclaredRows,
    entries.length,
    'checkout presence rows explain every real-repo entry'
  );
  if (!commandExecution.enabled) {
    assert.equal(metrics.realRepoCorpusRepositoryCommandsRun, 0, 'default real-repo bench must not execute repository commands');
    assert.equal(metrics.realRepoCorpusDependencyInstallDefaultOffRows, entries.length, 'default real-repo bench must keep dependency installs default-off');
    assert.equal(metrics.realRepoCorpusRepositoryCommandDefaultOffRows, entries.length, 'default real-repo bench must keep repository commands default-off');
    assert.equal(metrics.realRepoCorpusCommandDryRunExecutedPhases, 0, 'default real-repo bench must not execute command dry-run phases');
    assert.equal(metrics.realRepoCorpusCommandRunExecutedPhases, 0, 'default real-repo bench must not execute command-run phases');
    assert.equal(metrics.realRepoCorpusCommandRunDefaultOffRows, entries.length, 'default real-repo bench must keep command-run rows default-off');
  }
  return metrics;
}

function loadRealRepoCorpusFixture() {
  for (const candidate of realRepoCorpusFixtureCandidates) {
    if (!existsSync(candidate.url)) continue;
    return {
      mode: candidate.mode,
      path: fileURLToPath(candidate.url),
      corpus: JSON.parse(readFileSync(candidate.url, 'utf8'))
    };
  }
  const searched = realRepoCorpusFixtureCandidates
    .map((candidate) => `${candidate.mode}:${fileURLToPath(candidate.url)}`)
    .join(', ');
  throw new Error(`Unable to find JS/TS semantic merge corpus fixture. Searched ${searched}`);
}

function readRealRepoCorpusFixture() {
  return loadRealRepoCorpusFixture().corpus;
}

function fixtureExpectedAdmissionStatus(fixture) {
  if (fixture.expected?.admissionStatus) return fixture.expected.admissionStatus;
  if (fixture.expected?.safeMergeStatus === 'merged') return 'auto-merge-candidate';
  if (fixture.expected?.safeMergeStatus === 'rejected') return 'blocked';
  return undefined;
}

function assertRealRepoCorpusOracleCoverageMetrics(metrics) {
  assert.equal(metrics.realRepoCorpusOracleCases, RealRepoCorpusOracleCoverage.oracleCases, 'real-repo README oracle case count');
  assert.deepEqual(metrics.realRepoCorpusOracleMatrixRowIds, RealRepoCorpusOracleCoverage.matrixRows, 'real-repo README matrix row ids');
  assert.deepEqual(metrics.realRepoCorpusOracleUnmappedSurfaceIds, RealRepoCorpusOracleCoverage.unmappedSurfaces, 'real-repo known non-matrix oracle surfaces');
  assert.equal(metrics.realRepoCorpusOracleCaseFixturesPresent, metrics.realRepoCorpusOracleCases, 'real-repo oracle fixtures present');
  assert.equal(metrics.realRepoCorpusOracleAdmissionMatches, metrics.realRepoCorpusOracleCases, 'real-repo oracle fixture admission matches');
  assert.equal(
    metrics.realRepoCorpusOracleCoverageRatio,
    metrics.realRepoCorpusEntries > 0 ? Number((metrics.realRepoCorpusEntriesWithOracles / metrics.realRepoCorpusEntries).toFixed(2)) : 0,
    'real-repo oracle coverage ratio basis'
  );
  assert.equal(metrics.realRepoCorpusOracleCoverageRatioBasis, RealRepoCorpusOracleCoverage.coverageRatioBasis, 'real-repo oracle coverage ratio basis label');
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

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(JSON.stringify(measureRealRepoCorpus()));
}

export { RealRepoCorpusOracleCoverage, assertRealRepoCorpusOracleCoverageMetrics, loadRealRepoCorpusFixture, measureRealRepoCorpus, readRealRepoCorpusFixture };
