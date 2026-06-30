import { assert } from './helpers.mjs';
import { createUniversalCapabilityMatrix } from './compiler-api.mjs';

const languageDenominator = ['rust', 'python', 'c', 'swift', 'kotlin', 'java', 'go', 'csharp', 'scala', 'ruby', 'dart'];
const matrix = createUniversalCapabilityMatrix({
  generatedAt: 930,
  languages: languageDenominator,
  languageDenominator,
  targets: ['rust', 'python', 'c'],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
});

assert.equal(matrix.kind, 'frontier.lang.universalCapabilityMatrix');
assert.deepEqual(matrix.metadata.languageDenominator, [...languageDenominator].sort());
assert.equal(matrix.languages.length, languageDenominator.length);
assert.equal(matrix.summary.packageMissingContracts, 0);
assert.equal(matrix.summary.packageContractRows, languageDenominator.length);
assert.equal(matrix.summary.packageTargetProjectionSupported, 3);
assert.equal(matrix.summary.packageSourceImporterOnly, 8);
assert.equal(matrix.summary.byPackageClass['target-projection'], 3);
assert.equal(matrix.summary.byPackageClass['platform-importer'], 9);
assert.equal(matrix.matrices.packageContracts.kind, 'frontier.lang.universalCapabilityPackageContractMatrix');
assert.equal(matrix.matrices.packageContracts.languages.includes('scala'), true);
assert.equal(matrix.matrices.packageContracts.languages.includes('ruby'), true);
assert.equal(matrix.matrices.packageContracts.languages.includes('dart'), true);

for (const language of languageDenominator) {
  const row = rowFor(language);
  assert.equal(row.packageContract.total > 0, true, `${language} has a package contract row`);
  assert.equal(row.packageContract.missingContract, false, `${language} package contract is not missing`);
  assert.equal(row.packageContract.packageNames.every((name) => name.startsWith('@shapeshift-labs/frontier-lang-')), true, `${language} package names are Frontier language packages`);
  assert.equal(row.packageContract.requiredEvidenceKeys.length > 0, true, `${language} exposes required package evidence keys`);
}

for (const language of ['rust', 'python', 'c']) {
  const row = rowFor(language);
  assert.equal(row.packageContract.releaseReady, true, `${language} package contract is release ready`);
  assert.equal(row.packageContract.targetProjection.supported, true, `${language} has package-owned target projection`);
  assert.equal(row.packageContract.sourceImporterOnly, false, `${language} is not source-importer-only`);
}

for (const language of ['swift', 'kotlin', 'java', 'go', 'csharp']) {
  const row = rowFor(language);
  assert.equal(row.packageContract.releaseReady, true, `${language} source importer package contract is release ready`);
  assert.equal(row.packageContract.targetProjection.supported, false, `${language} has no package-owned target projection`);
  assert.equal(row.packageContract.sourceImporterOnly, true, `${language} is source-importer-only`);
  assert.equal(row.review.includes('Language package contract is source-importer-only; package-owned target projection is missing.'), true, `${language} exposes source-importer-only review reason`);
}

for (const language of ['scala', 'ruby', 'dart']) {
  const row = rowFor(language);
  assert.equal(row.packageContract.releaseReady, false, `${language} package contract is not release ready`);
  assert.equal(row.packageContract.plannedOnly, true, `${language} package contract is planned-only`);
  assert.equal(row.packageContract.targetProjection.supported, false, `${language} has no package-owned target projection`);
  assert.equal(row.review.includes('Language package contract is planned-only and not release-ready.'), true, `${language} exposes planned-only review reason`);
}

function rowFor(language) {
  const row = matrix.languages.find((entry) => entry.language === language);
  assert.equal(Boolean(row), true, `${language} row exists`);
  return row;
}
