import { performance } from 'node:perf_hooks';
import {
  compileNativeSource,
  compileFrontierSource,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createProjectionTargetLossMatrix,
  createNativeSourcePreservation,
  createSemanticImportSidecar,
  importNativeSource,
  projectNativeImportToSource,
  runNativeImporterAdapter
} from '../dist/index.js';

const source = `
module Bench @id("mod_bench")
type TodoInput @id("type_input") {
  title: Text
}
entity Todo @id("ent_todo") {
  title @id("field_title"): Text
}
action addTodo @id("action_add") {
  input TodoInput
  writes field_title
  returns Patch
}
`;

const targets = ['typescript', 'javascript', 'rust', 'python', 'c'];
const start = performance.now();
let bytes = 0;
for (let index = 0; index < 250; index += 1) {
  bytes += compileFrontierSource(source, { target: targets[index % targets.length] }).output.length;
}
const compileDurationMs = performance.now() - start;

const importStart = performance.now();
const estreeAdapter = createEstreeNativeImporterAdapter();
let nativeSymbols = 0;
const nativeImportResults = [];
for (let index = 0; index < 150; index += 1) {
  const imported = index % 2 === 0
    ? importNativeSource({
      language: 'javascript',
      sourcePath: `src/bench-${index}.js`,
      sourceText: `export function bench${index}() { return ${index}; }\n`
    })
    : await runNativeImporterAdapter(estreeAdapter, {
      sourcePath: `src/bench-${index}.js`,
      sourceText: `export function bench${index}() { return ${index}; }\n`,
      adapterOptions: {
        ast: {
          type: 'Program',
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 42 } },
          body: [{
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: `bench${index}` },
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 42 } }
          }]
        }
      }
    });
  nativeSymbols += imported.semanticIndex?.symbols?.length ?? 0;
  nativeImportResults.push(imported);
}
const importDurationMs = performance.now() - importStart;

const matrixStart = performance.now();
const coverageMatrix = createNativeImportCoverageMatrix({ imports: nativeImportResults });
const matrixDurationMs = performance.now() - matrixStart;

const projectionMatrixStart = performance.now();
const projectionLossMatrix = createProjectionTargetLossMatrix({ imports: nativeImportResults });
const projectionMatrixDurationMs = performance.now() - projectionMatrixStart;

const preservationStart = performance.now();
const preservationRecords = nativeImportResults.map((imported) => imported.metadata.sourcePreservation ?? createNativeSourcePreservation({
  language: imported.language,
  sourcePath: imported.sourcePath,
  sourceText: imported.metadata.sourcePreservation?.sourceText ?? ''
}));
const preservationDurationMs = performance.now() - preservationStart;
const preservationTokens = preservationRecords.reduce((sum, record) => sum + record.tokens.length + record.trivia.length, 0);

const sidecarStart = performance.now();
const semanticSidecars = nativeImportResults.map((imported) => createSemanticImportSidecar(imported));
const sidecarDurationMs = performance.now() - sidecarStart;
const sidecarOwnershipRegions = semanticSidecars.reduce((sum, sidecar) => sum + sidecar.ownershipRegions.length, 0);

const projectionStart = performance.now();
const nativeProjections = nativeImportResults.map((imported) => projectNativeImportToSource(imported));
const projectionDurationMs = performance.now() - projectionStart;
const projectionBytes = nativeProjections.reduce((sum, projection) => sum + projection.sourceText.length, 0);

const nativeCompileStart = performance.now();
const nativeCompiles = nativeImportResults.map((imported, index) => compileNativeSource(imported, {
  target: index % 2 === 0 ? 'javascript' : 'rust',
  emitOnBlocked: true
}));
const nativeCompileDurationMs = performance.now() - nativeCompileStart;
const nativeCompileBytes = nativeCompiles.reduce((sum, result) => sum + result.output.length, 0);
const nativeCompileBlocked = nativeCompiles.filter((result) => result.readiness.readiness === 'blocked').length;

console.log(JSON.stringify({
  compiles: 250,
  bytes,
  compileDurationMs: Number(compileDurationMs.toFixed(2)),
  nativeImports: 150,
  nativeSymbols,
  nativeImportDurationMs: Number(importDurationMs.toFixed(2)),
  coverageMatrixLanguages: coverageMatrix.summary.languages,
  coverageMatrixImports: coverageMatrix.summary.imports,
  adapterCoverageSummaries: coverageMatrix.summary.adapterCoverage.total,
  adapterCoverageSourceRanges: coverageMatrix.summary.adapterCoverage.effective.sourceRanges ?? 0,
  adapterCoverageTokenGaps: coverageMatrix.summary.adapterCoverage.gaps.tokens ?? 0,
  adapterCoverageReferenceGaps: coverageMatrix.summary.adapterCoverage.gaps.references ?? 0,
  coverageMatrixDurationMs: Number(matrixDurationMs.toFixed(2)),
  projectionMatrixLanguages: projectionLossMatrix.summary.languages,
  projectionMatrixMissingAdapters: projectionLossMatrix.summary.missingAdapters,
  projectionMatrixUnsupportedTargetFeatures: projectionLossMatrix.summary.unsupportedTargetFeatures,
  projectionMatrixDurationMs: Number(projectionMatrixDurationMs.toFixed(2)),
  sourcePreservationRecords: preservationRecords.length,
  sourcePreservationTokens: preservationTokens,
  sourcePreservationDurationMs: Number(preservationDurationMs.toFixed(2)),
  semanticSidecars: semanticSidecars.length,
  sidecarOwnershipRegions,
  sidecarDurationMs: Number(sidecarDurationMs.toFixed(2)),
  nativeProjections: nativeProjections.length,
  projectionBytes,
  projectionDurationMs: Number(projectionDurationMs.toFixed(2)),
  nativeCompiles: nativeCompiles.length,
  nativeCompileBytes,
  nativeCompileBlocked,
  nativeCompileDurationMs: Number(nativeCompileDurationMs.toFixed(2))
}));
