import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';
import { projectSourceSpanDeltaConflicts } from '../../src/js-ts-safe-project-merge-source-span-conflicts.js';

const exactGeneratedBoundaryProject = generatedBoundaryProject('exact-generated-boundary', 'exact',
  { startLine: 1, startColumn: 1, endLine: 1, endColumn: 40, sourceHash: 'source:exact-generated-boundary' },
  { startLine: 4, startColumn: 3, endLine: 4, endColumn: 42, targetHash: 'target:exact-generated-boundary' });
assert.equal(exactGeneratedBoundaryProject.status, 'merged');
const exactFileRecord = exactGeneratedBoundaryProject.outputProjectSymbolGraph.sourceFileRecords[0];
assert.equal(exactFileRecord.sourceMapGeneratedBoundaryStatus, 'ready');
assert.equal(exactFileRecord.sourceMapGeneratedBoundaryOwnershipStatus, 'deterministic-source-map-span');
assert.equal(exactFileRecord.sourceMapRecordCount, 1);
assert.equal(exactFileRecord.sourceMapMappingCount, 1);
assert.equal(exactFileRecord.sourceMapGeneratedBoundaryOwnershipRecords.length, 1);
assert.equal(exactFileRecord.sourceMapGeneratedBoundaryBlockReasonCodes.length, 0);
const exactSpanRecord = exactGeneratedBoundaryProject.outputProjectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'source-map-comment' && record.trivia);
assert.equal(exactSpanRecord.sourceMapGeneratedBoundaryStatus, 'ready');
assert.equal(exactSpanRecord.sourceMapGeneratedBoundaryOwnershipStatus, 'deterministic-source-map-span');
assert.equal(exactSpanRecord.sourceMapGeneratedBoundaryOwnershipKeys[0], exactFileRecord.sourceMapGeneratedBoundaryOwnershipKeys[0]);

const positionOnlyGeneratedBoundaryProject = generatedBoundaryProject('position-only-generated-boundary', 'line',
  { startLine: 1, startColumn: 1, sourceHash: 'source:position-only-generated-boundary' },
  { startLine: 8, startColumn: 1, targetHash: 'target:position-only-generated-boundary' });
assert.equal(positionOnlyGeneratedBoundaryProject.status, 'merged');
const positionOnlyFileRecord = positionOnlyGeneratedBoundaryProject.outputProjectSymbolGraph.sourceFileRecords[0];
assert.equal(positionOnlyFileRecord.sourceMapGeneratedBoundaryStatus, 'blocked');
assert.equal(positionOnlyFileRecord.sourceMapGeneratedBoundaryOwnershipStatus, 'blocked');
assert.equal(positionOnlyFileRecord.sourceMapGeneratedBoundaryBlockReasonCodes.includes('ecma-426:missing-exact-source-generated-boundary'), true);
const positionOnlySpanRecord = positionOnlyGeneratedBoundaryProject.outputProjectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'source-map-comment' && record.trivia);
assert.equal(positionOnlySpanRecord.sourceMapGeneratedBoundaryStatus, 'blocked');
assert.equal(positionOnlySpanRecord.sourceMapGeneratedBoundaryBlockReasonCodes.includes('ecma-426:missing-exact-source-generated-boundary'), true);

const generatedBoundaryBlockedConflicts = projectSourceSpanDeltaConflicts(sourceFileDelta({
  base: positionOnlyFileRecord,
  worker: sourceFile('worker'),
  head: sourceFile('head')
}));
const generatedBoundaryBlockedConflict = generatedBoundaryBlockedConflicts
  .find((conflict) => conflict.code === 'project-generated-source-boundary-ownership-blocked');
assert.equal(Boolean(generatedBoundaryBlockedConflict), true);
assert.equal(generatedBoundaryBlockedConflict.details.sourceMapGeneratedBoundaryOwnershipStatus, 'blocked');
assert.equal(generatedBoundaryBlockedConflict.details.sourceMapGeneratedBoundaryBlockReasonCodes.includes('ecma-426:missing-exact-source-generated-boundary'), true);

function generatedBoundaryProject(fileStem, precision, sourceSpan, generatedSpan) {
  const sourcePath = `src/${fileStem}.js`;
  const targetPath = `dist/${fileStem}.js`;
  const sourceText = `export const generatedBoundary = 1;\n//# sourceMappingURL=${fileStem}.js.map\n`;
  const imported = importNativeSource({
    id: `import_${fileStem}`,
    language: 'javascript',
    sourcePath,
    sourceText,
    targetPath,
    targetHash: `target:${fileStem}`,
    sourceMaps: [{
      id: `source_map_${fileStem}`,
      sourcePath,
      sourceHash: `source:${fileStem}`,
      targetPath,
      targetHash: `target:${fileStem}`,
      mappings: [{
        id: `map_${fileStem}`,
        precision,
        sourceSpan: { path: sourcePath, ...sourceSpan },
        generatedSpan: { targetPath, ...generatedSpan },
        metadata: { sourceMapOrigin: `fixture-project-${precision}-source-map` }
      }]
    }]
  });
  return safeMergeJsTsProject({
    id: `js_ts_project_${fileStem}_generated_boundary`,
    language: 'javascript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { [sourcePath]: sourceText },
    workerFiles: { [sourcePath]: sourceText },
    headFiles: { [sourcePath]: sourceText },
    outputProjectImports: [imported]
  });
}

function sourceFileDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { sourceFileRecords: record ? [record] : [], sourceSpanRecords: [] },
      summary: { sourceFileRecords: record ? 1 : 0, sourceSpanRecords: 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function sourceFile(stage, extra = {}) {
  return {
    id: `${stage}_file`,
    sourcePath: 'src/render.js',
    sourceHash: `${stage}_hash`,
    triviaOwnershipStatus: 'deterministic-lightweight',
    triviaOwnershipReasonCodes: [],
    triviaOwnershipBlockReasonCodes: [],
    parserEvidence: 'frontier-lightweight-js-ts-source-ledger',
    losslessCst: false,
    roundtripHash: `${stage}_hash`,
    ...extra
  };
}
