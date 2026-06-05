import { performance } from 'node:perf_hooks';
import {
  compileNativeSource,
  compileFrontierSource,
  createClangAstNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createNativeParserAstFormatMatrix,
  createProjectionTargetLossMatrix,
  createNativeSourcePreservation,
  createPythonAstNativeImporterAdapter,
  createRustSynNativeImporterAdapter,
  createSemanticImportSidecar,
  diffNativeSources,
  importExternalSemanticIndex,
  importNativeSource,
  projectNativeImportToSource,
  runNativeImporterAdapter,
  summarizeNativeImportFeatureEvidence
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

const parserFormatMatrixStart = performance.now();
const parserFormatMatrix = createNativeParserAstFormatMatrix({
  imports: nativeImportResults,
  adapters: [estreeAdapter, createPythonAstNativeImporterAdapter(), createRustSynNativeImporterAdapter(), createClangAstNativeImporterAdapter()]
});
const parserFormatMatrixDurationMs = performance.now() - parserFormatMatrixStart;

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

const featureEvidenceStart = performance.now();
const featureEvidenceSummaries = nativeImportResults.map((imported) => summarizeNativeImportFeatureEvidence(imported.losses, {
  evidence: imported.evidence
}));
const featureEvidenceDurationMs = performance.now() - featureEvidenceStart;
const featureEvidencePolicyMatches = featureEvidenceSummaries.reduce((sum, summary) => sum + summary.total, 0);

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
const nativeCompileSourceMaps = nativeCompiles.reduce((sum, result) => sum + result.sourceMaps.length, 0);
const nativeCompileSourceMapMappings = nativeCompiles.reduce((sum, result) => sum + result.sourceMaps.reduce((mapSum, sourceMap) => mapSum + sourceMap.mappings.length, 0), 0);
const nativeCompileBlocked = nativeCompiles.filter((result) => result.readiness.readiness === 'blocked').length;
const nativeTargetAdapterStart = performance.now();
const nativeTargetAdapterCompiles = nativeImportResults.slice(0, 25).map((imported, index) => {
  const target = index % 2 === 0 ? 'rust' : 'python';
  return compileNativeSource(imported, {
    target,
    targetAdapters: [{
      id: `bench-target-adapter-${index}`,
      sourceLanguage: imported.language,
      target,
      coverage: {
        readiness: 'needs-review',
        handledLossKinds: ['dynamicRuntime', 'dynamicDispatch', 'typeInference', 'overloadResolution']
      },
      project() {
        return { output: `// bench target adapter ${index}\n`, readiness: 'needs-review' };
      }
    }]
  });
});
const nativeTargetAdapterDurationMs = performance.now() - nativeTargetAdapterStart;
const nativeTargetAdapterBytes = nativeTargetAdapterCompiles.reduce((sum, result) => sum + result.output.length, 0);
const nativeTargetAdapterSourceMaps = nativeTargetAdapterCompiles.reduce((sum, result) => sum + result.sourceMaps.length, 0);

const regionScanStart = performance.now();
const regionScanImports = [];
for (let index = 0; index < 100; index += 1) {
  const imported = importNativeSource({
    language: 'typescript',
    sourcePath: `src/regions-${index}.ts`,
    sourceText: `
      export const appRoutes${index} = [
        { path: "/${index}", component: Screen${index} },
        { path: "/${index}/settings", component: Settings${index} }
      ];
      export const contentBlocks${index} = {
        docs: { title: "Docs ${index}" },
        legal: { title: "Legal ${index}" }
      };
      export const runtimeConfig${index} = {
        limits: { count: ${index} },
        resolve(id) { return id; }
      };
      export const helpers${index} = {
        plain: ${index}
      };
    `
  });
  regionScanImports.push({ imported, sidecar: createSemanticImportSidecar(imported) });
}
const regionScanDurationMs = performance.now() - regionScanStart;
const regionScanSymbols = regionScanImports.reduce((sum, entry) => sum + entry.imported.semanticIndex.symbols.length, 0);
const regionScanOwnershipRegions = regionScanImports.reduce((sum, entry) => sum + entry.sidecar.ownershipRegions.length, 0);

const changeProjectionStart = performance.now();
const changeProjectionSets = [];
for (let index = 0; index < 80; index += 1) {
  changeProjectionSets.push(diffNativeSources({
    language: 'javascript',
    sourcePath: `src/change-projection-${index}.js`,
    beforeSourceText: `export function changeProjection${index}() { return ${index}; }\n`,
    afterSourceText: `export function changeProjection${index}() { return ${index + 1}; }\nexport const changeProjectionFlag${index} = true;\n`
  }));
}
const changeProjectionDurationMs = performance.now() - changeProjectionStart;
const changedRegionProjections = changeProjectionSets.reduce((sum, changeSet) => sum + changeSet.metadata.changedRegionProjectionSummary.withProjection, 0);
const changedRegionProjectionSourceMapLinks = changeProjectionSets.reduce((sum, changeSet) => sum + changeSet.metadata.changedRegionProjectionSummary.sourceMapLinks, 0);

const externalSemanticStart = performance.now();
const externalSemanticImports = [];
for (let index = 0; index < 100; index += 1) {
  externalSemanticImports.push(importExternalSemanticIndex({
    format: index % 2 === 0 ? 'scip' : 'lsp',
    language: index % 2 === 0 ? 'typescript' : 'python',
    payload: index % 2 === 0
      ? {
        metadata: { project_root: '/bench' },
        documents: [{
          relative_path: `src/external-${index}.ts`,
          language: 'typescript',
          occurrences: [{
            symbol: `scip-typescript npm bench 1.0.0 src/external-${index}.ts/ external${index}().`,
            range: [0, 16, 24],
            symbol_roles: 1
          }]
        }]
      }
      : {
        uri: `file:///bench/src/external-${index}.py`,
        languageId: 'python',
        documentSymbols: [{
          name: `external_${index}`,
          kind: 12,
          range: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } }
        }]
      }
  }));
}
const externalSemanticDurationMs = performance.now() - externalSemanticStart;
const externalSemanticSymbols = externalSemanticImports.reduce((sum, imported) => sum + imported.semanticIndex.symbols.length, 0);
const externalSemanticMappings = externalSemanticImports.reduce((sum, imported) => sum + imported.summary.sourceMapMappings, 0);

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
  parserFormatMatrixFormats: parserFormatMatrix.summary.formats,
  parserFormatMatrixImports: parserFormatMatrix.summary.imports,
  parserFormatMatrixNativeAstNodes: parserFormatMatrix.summary.nativeAstNodes,
  parserFormatMatrixDurationMs: Number(parserFormatMatrixDurationMs.toFixed(2)),
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
  featureEvidencePolicyMatches,
  featureEvidenceDurationMs: Number(featureEvidenceDurationMs.toFixed(2)),
  nativeProjections: nativeProjections.length,
  projectionBytes,
  projectionDurationMs: Number(projectionDurationMs.toFixed(2)),
  nativeCompiles: nativeCompiles.length,
  nativeCompileBytes,
  nativeCompileSourceMaps,
  nativeCompileSourceMapMappings,
  nativeCompileBlocked,
  nativeCompileDurationMs: Number(nativeCompileDurationMs.toFixed(2)),
  nativeTargetAdapterCompiles: nativeTargetAdapterCompiles.length,
  nativeTargetAdapterBytes,
  nativeTargetAdapterSourceMaps,
  nativeTargetAdapterDurationMs: Number(nativeTargetAdapterDurationMs.toFixed(2)),
  regionScanImports: regionScanImports.length,
  regionScanSymbols,
  regionScanOwnershipRegions,
  regionScanDurationMs: Number(regionScanDurationMs.toFixed(2)),
  changeProjectionSets: changeProjectionSets.length,
  changedRegionProjections,
  changedRegionProjectionSourceMapLinks,
  changeProjectionDurationMs: Number(changeProjectionDurationMs.toFixed(2)),
  externalSemanticImports: externalSemanticImports.length,
  externalSemanticSymbols,
  externalSemanticMappings,
  externalSemanticDurationMs: Number(externalSemanticDurationMs.toFixed(2))
}));
