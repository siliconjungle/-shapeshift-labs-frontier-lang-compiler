import assert from 'node:assert/strict';
import { assertDefaultRealRepoLiveProjectProofMetrics } from './real-repo-corpus-live-project-proof.mjs';
import { assertRealRepoCorpusOracleCoverageMetrics } from './real-repo-corpus-oracle-coverage.mjs';

function assertRealRepoCorpusSuiteMetrics(metrics, context) {
  const { entries, oracleMatrixRows, commandExecution, liveProjectProof } = context;
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
  assertDefaultOffCommandProofMetrics(metrics, entries, commandExecution);
  if (!liveProjectProof.enabled) assertDefaultRealRepoLiveProjectProofMetrics(metrics, entries, assert);
}

function assertDefaultOffCommandProofMetrics(metrics, entries, commandExecution) {
  if (commandExecution.enabled) return;
  assert.equal(metrics.realRepoCorpusRepositoryCommandsRun, 0, 'default real-repo bench must not execute repository commands');
  assert.equal(metrics.realRepoCorpusDependencyInstallDefaultOffRows, entries.length, 'default real-repo bench must keep dependency installs default-off');
  assert.equal(metrics.realRepoCorpusRepositoryCommandDefaultOffRows, entries.length, 'default real-repo bench must keep repository commands default-off');
  assert.equal(metrics.realRepoCorpusCommandDryRunExecutedPhases, 0, 'default real-repo bench must not execute command dry-run phases');
  assert.equal(metrics.realRepoCorpusCommandRunExecutedPhases, 0, 'default real-repo bench must not execute command-run phases');
  assert.equal(metrics.realRepoCorpusCommandRunDefaultOffRows, entries.length, 'default real-repo bench must keep command-run rows default-off');
}

export { assertRealRepoCorpusSuiteMetrics };
