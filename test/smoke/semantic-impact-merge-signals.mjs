import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { createSemanticImportSidecar } from './compiler-api.mjs';

const sidecar = createSemanticImportSidecar(scannedJsImport, {
  generatedAt: 123,
  targetPath: 'dist/scanned.js'
});
const signals = sidecar.semanticImpact.records.map((record) => record.mergeSignal);
const countedSignals = Object.values(sidecar.semanticImpact.summary.byMergeSignal).reduce((sum, value) => sum + value, 0);

assert.equal(signals.length, sidecar.semanticImpact.records.length);
assert.equal(countedSignals, signals.length);
assert.equal(signals.every((signal) => ['strong', 'partial', 'weak', 'blocked'].includes(signal.status)), true);
assert.equal(signals.every((signal) => Number.isInteger(signal.score) && signal.score >= 0 && signal.score <= 100), true);
assert.equal(sidecar.semanticImpact.summary.reviewRequiredMergeSignals, signals.filter((signal) => signal.reviewRequired).length);
assert.equal(sidecar.semanticImpact.summary.weakMergeSignals, signals.filter((signal) => signal.status === 'weak' || signal.status === 'blocked').length);
assert.equal(sidecar.semanticImpact.summary.mergeSignalQueryKeys.includes('review-required'), true);
assert.equal(sidecar.semanticImpact.summary.mergeSignalQueryKeys.some((key) => key === 'source:src/scanned.js'), true);
assert.equal(signals.some((signal) => signal.queryKeys.some((key) => key.startsWith('predicate:'))), true);
assert.equal(signals.some((signal) => signal.missing.includes('proof-obligations')), true);
