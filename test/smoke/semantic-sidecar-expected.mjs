import { assert, assertSemanticImportFixture } from './helpers.mjs';
import { createSemanticImportSidecar } from './compiler-api.mjs';

const emptySemanticImport = {
  id: 'empty_expected_import',
  language: 'javascript',
  sourcePath: 'src/empty-expected.js',
  semanticIndex: { id: 'empty_expected_index', symbols: [] },
  evidence: []
};

const defaultSidecar = createSemanticImportSidecar(emptySemanticImport, { generatedAt: 129 });
assert.equal(defaultSidecar.quality.expected, false);
assert.equal(defaultSidecar.quality.expectedEmpty, false);
assert.equal(defaultSidecar.quality.expectedSatisfied, true);
assert.equal(defaultSidecar.quality.record.classification, 'unexpectedly-empty');
assert.equal(defaultSidecar.admission.record.reasonCode, 'empty-semantic-index');
assert.equal(defaultSidecar.admission.expected, false);
assert.equal(defaultSidecar.summary.semanticImportExpected, false);
assert.equal(defaultSidecar.summary.semanticImportRecordClassification, 'unexpectedly-empty');

const expectedSidecar = createSemanticImportSidecar(emptySemanticImport, { generatedAt: 130, expected: true });
assertSemanticImportFixture(emptySemanticImport, {
  sidecar: expectedSidecar,
  minSymbols: 0,
  minOwnershipRegions: 0,
  minSourceMapMappings: 0,
  minPatchHints: 0,
  expectEligible: false,
  expectedWarningCodes: [
    'empty-evidence',
    'empty-semantic-index',
    'expected-semantic-import-empty',
    'missing-ownership-regions',
    'missing-patch-hints'
  ]
});
assert.equal(expectedSidecar.quality.expected, true);
assert.equal(expectedSidecar.quality.expectedEmpty, false);
assert.equal(expectedSidecar.quality.record.classification, 'unexpectedly-empty');
assert.equal(expectedSidecar.quality.expectedSatisfied, false);
assert.equal(expectedSidecar.admission.expected, true);
assert.equal(expectedSidecar.admission.expectedSatisfied, false);
assert.equal(expectedSidecar.summary.semanticImportExpected, true);
assert.equal(expectedSidecar.summary.semanticImportExpectedEmpty, false);
assert.equal(expectedSidecar.summary.semanticImportExpectedSatisfied, false);
assert.equal(expectedSidecar.summary.semanticImportExpectedMissingReasonCodes.includes('expected-semantic-import-empty'), true);
assert.equal(expectedSidecar.summary.semanticImportRecordReasonCode, 'expected-semantic-import-empty');

const expectedEmptySidecar = createSemanticImportSidecar(emptySemanticImport, { generatedAt: 131, expectedEmpty: true });
assert.equal(expectedEmptySidecar.quality.expected, false);
assert.equal(expectedEmptySidecar.quality.expectedEmpty, true);
assert.equal(expectedEmptySidecar.quality.expectedSatisfied, true);
assert.equal(expectedEmptySidecar.quality.record.classification, 'expected-empty');
assert.equal(expectedEmptySidecar.quality.emptyEvidenceWarnings.length, 0);
assert.equal(expectedEmptySidecar.quality.eligible, false);
assert.equal(expectedEmptySidecar.admission.action, 'skip-expected-empty');
assert.equal(expectedEmptySidecar.admission.record.action, 'skip-expected-empty');
assert.equal(expectedEmptySidecar.summary.semanticImportExpectedEmpty, true);
assert.equal(expectedEmptySidecar.summary.semanticImportExpectedSatisfied, true);
assert.equal(expectedEmptySidecar.summary.semanticImportExpectedMissingReasonCodes.length, 0);
assert.equal(expectedEmptySidecar.summary.semanticImportRecordClassification, 'expected-empty');
