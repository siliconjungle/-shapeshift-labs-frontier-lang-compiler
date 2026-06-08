import { assert } from './helpers.mjs';
import {
  createSemanticSlice,
  createSemanticSliceAdmissionRecord,
  importNativeSource,
  testSemanticSlice
} from './compiler-api.mjs';

const sourceText = `
export function parseExpression(input) {
  return parseTerm(input);
}

export function parseTerm(input) {
  return input;
}

export function unrelatedParser(input) {
  return String(input);
}
`;
const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/surgical-parser.ts',
  sourceText
});
const sourceHash = imported.nativeSource.sourceHash;
const slice = createSemanticSlice(imported, {
  entryRefs: ['symbol:parseExpression'],
  includeDependencies: true,
  expectedSymbols: ['parseExpression'],
  expectedSourceHashes: { 'src/surgical-parser.ts': sourceHash },
  focusedCommands: ['npm test -- surgical-parser'],
  fixtureHints: ['surgical parser fixture']
});
const selectedRegionRef = slice.ownershipRegions[0]?.key ?? slice.ownershipRegions[0]?.id;
assert.equal(slice.symbols.some((symbol) => symbol.name === 'parseExpression'), true);
assert.equal(slice.symbols.some((symbol) => symbol.name === 'parseTerm'), true);
assert.equal(slice.symbols.some((symbol) => symbol.name === 'unrelatedParser'), false);
assert.equal(typeof selectedRegionRef, 'string');
assert.equal(slice.verification.expectedAssertions.some((entry) => entry.id === 'expectedSymbol:parseExpression' && entry.category === 'symbol'), true);
assert.equal(slice.verification.expectedAssertions.some((entry) => entry.id === 'expectedSourceHash:src/surgical-parser.ts'), true);
const gate = testSemanticSlice(slice, {
  currentSources: { 'src/surgical-parser.ts': sourceText },
  expectedRegions: [selectedRegionRef]
});
assert.equal(gate.status, 'passed');
assert.equal(gate.summary.expectedAssertions >= 3, true);
assert.equal(gate.assertions.some((entry) => entry.id === 'expectedSymbol:parseExpression' && entry.status === 'passed'), true);
assert.equal(gate.assertions.some((entry) => entry.id === `expectedRegion:${selectedRegionRef}` && entry.status === 'passed'), true);
assert.equal(gate.assertions.some((entry) => entry.id === 'expectedSourceHash:src/surgical-parser.ts' && entry.status === 'passed'), true);
const failedGate = testSemanticSlice(slice, {
  expectedSymbols: ['missingParserSymbol'],
  expectedRegions: ['missing-parser-region'],
  expectedSourceHashes: { 'src/surgical-parser.ts': 'fnv1a32:wrong-hash' }
});
assert.equal(failedGate.status, 'failed');
assert.equal(failedGate.assertions.some((entry) => entry.id === 'expectedSymbol:missingParserSymbol' && entry.status === 'failed'), true);
assert.equal(failedGate.assertions.some((entry) => entry.id === 'expectedRegion:missing-parser-region' && entry.status === 'failed'), true);
assert.equal(failedGate.assertions.some((entry) => entry.id === 'expectedSourceHash:src/surgical-parser.ts' && entry.status === 'failed'), true);
const admission = createSemanticSliceAdmissionRecord(slice, { testResult: gate });
assert.equal(admission.selectedSurface.symbols.some((symbol) => symbol.name === 'parseExpression'), true);
assert.equal(admission.selectedSurface.symbols.some((symbol) => symbol.name === 'parseTerm'), true);
assert.equal(admission.selectedSurface.symbols.some((symbol) => symbol.name === 'unrelatedParser'), false);
assert.equal(admission.selectedSurface.sourceHashes.some((entry) => entry.path === 'src/surgical-parser.ts' && entry.sourceHash === sourceHash), true);
assert.equal(admission.selectedSurface.sourceFiles.some((file) => Object.prototype.hasOwnProperty.call(file, 'excerpts')), false);
const selectedSurfaceEvidence = admission.evidence.find((entry) => entry.kind === 'semantic-slice-selected-surface');
assert.equal(Boolean(selectedSurfaceEvidence), true);
assert.equal(selectedSurfaceEvidence.metadata.selectedSurface.symbols.length, admission.selectedSurface.symbols.length);
assert.equal(selectedSurfaceEvidence.metadata.selectedSurface.sourceFiles.some((file) => Object.prototype.hasOwnProperty.call(file, 'excerpts')), false);
