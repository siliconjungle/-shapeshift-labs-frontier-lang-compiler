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
assert.equal(defaultSidecar.quality.expectedSatisfied, true);
assert.equal(defaultSidecar.admission.expected, false);
assert.equal(defaultSidecar.summary.semanticImportExpected, false);

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
assert.equal(expectedSidecar.quality.expectedSatisfied, false);
assert.equal(expectedSidecar.admission.expected, true);
assert.equal(expectedSidecar.admission.expectedSatisfied, false);
assert.equal(expectedSidecar.summary.semanticImportExpected, true);
assert.equal(expectedSidecar.summary.semanticImportExpectedSatisfied, false);
assert.equal(expectedSidecar.summary.semanticImportExpectedMissingReasonCodes.includes('expected-semantic-import-empty'), true);
