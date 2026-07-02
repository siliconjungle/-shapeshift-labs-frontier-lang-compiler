import { assert } from './helpers.mjs';
import {
  createUniversalLanguageCoverageMatrix,
  queryUniversalLanguageCoverageMatrix,
  UniversalLanguageCoverageReadinessStatuses,
  UniversalLanguageCoverageStatuses,
  UniversalLanguageCoverageSurfaceIds
} from './compiler-api.mjs';

assert.equal(UniversalLanguageCoverageSurfaceIds.includes('parserSourceSpanTrivia'), true);
assert.equal(UniversalLanguageCoverageSurfaceIds.includes('runtimeProof'), true);
assert.equal(UniversalLanguageCoverageStatuses.includes('bounded-evidence'), true);
assert.equal(UniversalLanguageCoverageReadinessStatuses.includes('partial'), true);

const matrix = createUniversalLanguageCoverageMatrix({ generatedAt: 42 });
assert.equal(matrix.kind, 'frontier.lang.universalLanguageCoverageMatrix');
assert.equal(matrix.generatedAt, 42);
assert.equal(matrix.surfaces.length, UniversalLanguageCoverageSurfaceIds.length);
assert.equal(matrix.languages.length >= 30, true);
assert.equal(matrix.summary.rows, matrix.languages.length);
assert.equal(matrix.summary.missingSurfaceCells > 0, true);
assert.equal(matrix.summary.remainingWorkItems > 0, true);

const ids = new Set(matrix.languages.map((row) => row.id));
for (const id of [
  'javascript',
  'typescript',
  'html',
  'css',
  'jsx',
  'tsx',
  'svg',
  'css-modules',
  'package-json',
  'canvas',
  'unison',
  'graphql',
  'cypher',
  'sparql',
  'datalog',
  'jsonpath',
  'xpath',
  'promql',
  'dhall',
  'cue',
  'nix',
  'nickel',
  'roc',
  'koka',
  'elm',
  'purescript',
  'gleam',
  'fsharp',
  'lean',
  'coq',
  'agda',
  'idris',
  'prolog',
  'mercury',
  'smalltalk',
  'forth',
  'factor',
  'apl',
  'j',
  'q',
  'pony',
  'make',
  'starlark',
  'hcl',
  'rego',
  'cel',
  'solidity',
  'wasm',
  'assembly',
  'x86',
  'x86-64',
  'arm64',
  'riscv',
  'llvm-ir',
  'ebpf',
  'asm-6502',
  'asm-65816',
  'snes-asm',
  'z80',
  'sm83',
  'm68k',
  'verilog',
  'vhdl'
]) {
  assert.equal(ids.has(id), true, `expected coverage row for ${id}`);
}

const typescript = queryUniversalLanguageCoverageMatrix(matrix, { id: 'typescript' });
assert.equal(typescript.found, true);
assert.equal(typescript.bestRow.id, 'typescript');
assert.equal(typescript.bestRow.readiness, 'high');
assert.equal(typescript.bestRow.completionEstimate >= 0.8, true);
assert.equal(
  typescript.bestRow.surfaces.some((surface) =>
    surface.surface === 'typePublicApiGraph' && surface.status === 'high'
  ),
  true
);

const htmlRuntime = queryUniversalLanguageCoverageMatrix(matrix, {
  id: 'html',
  surface: 'runtimeProof',
  surfaceStatus: 'bounded-evidence'
});
assert.equal(htmlRuntime.found, true);
assert.equal(htmlRuntime.rows[0].package.status, 'dependency-only');

const canvas = queryUniversalLanguageCoverageMatrix(matrix, { id: 'canvas' });
assert.equal(canvas.found, true);
assert.equal(canvas.rows[0].rowKind, 'runtime-surface');
assert.equal(canvas.rows[0].readiness, 'blocked');
assert.equal(
  canvas.rows[0].surfaces.some((surface) =>
    surface.surface === 'crossLanguageConversion' && surface.status === 'blocked'
  ),
  true
);

const planned = queryUniversalLanguageCoverageMatrix(matrix, { packageStatus: 'planned-platform' });
assert.equal(planned.found, true);
assert.equal(planned.summary.plannedRows > 0, true);
for (const id of [
  'unison',
  'graphql',
  'cypher',
  'sparql',
  'datalog',
  'jsonpath',
  'xpath',
  'promql',
  'dhall',
  'cue',
  'nix',
  'nickel',
  'roc',
  'koka',
  'lean',
  'prolog',
  'smalltalk',
  'forth',
  'apl',
  'make',
  'hcl',
  'solidity',
  'wasm',
  'verilog'
]) {
  const row = queryUniversalLanguageCoverageMatrix(matrix, { id }).bestRow;
  assert.equal(row.readiness, 'planned', `${id} starts as planned coverage`);
  assert.equal(row.package.status, 'planned-platform', `${id} is represented by a planned package contract`);
}

for (const id of ['assembly', 'x86-64', 'asm-6502', 'snes-asm', 'm68k']) {
  const row = queryUniversalLanguageCoverageMatrix(matrix, { id }).bestRow;
  assert.equal(row.readiness, 'partial', `${id} has published low-level coverage with required host evidence`);
  assert.equal(row.package.status, 'platform-importer', `${id} is represented by the published assembly package`);
  assert.equal(row.package.packageNames.includes('@shapeshift-labs/frontier-lang-assembly'), true);
  assert.equal(row.package.requiredEvidenceKeys.includes('assemblyscan'), true);
  assert.equal(row.package.requiredEvidenceKeys.includes('traceevidence'), true);
}

const strictDenominator = createUniversalLanguageCoverageMatrix({
  generatedAt: 100,
  languageDenominator: ['ts', 'jsx', 'css-modules']
});
assert.deepEqual(strictDenominator.languages.map((row) => row.id), ['typescript', 'jsx', 'css-modules']);

const overridden = createUniversalLanguageCoverageMatrix({
  languageDenominator: ['typescript'],
  surfaceOverrides: {
    typescript: {
      runtimeProof: {
        status: 'blocked',
        blockers: ['runtime probe fixture intentionally missing']
      }
    }
  }
});
assert.equal(overridden.languages[0].readiness, 'blocked');
assert.equal(
  queryUniversalLanguageCoverageMatrix(overridden, { blockedSurface: 'runtimeProof' }).found,
  true
);
