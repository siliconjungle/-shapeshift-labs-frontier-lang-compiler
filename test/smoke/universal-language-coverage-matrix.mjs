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
for (const id of ['javascript', 'typescript', 'html', 'css', 'jsx', 'tsx', 'svg', 'css-modules', 'package-json', 'canvas']) {
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
