import { performance } from 'node:perf_hooks';
import {
  createBidirectionalTargetChangeRecord,
  createSemanticImportSidecar,
  createSemanticLineageEvent,
  diffNativeSources,
  inferSemanticLineageEvents,
  importExternalSemanticIndex,
  importNativeSource
} from '../dist/index.js';

export function measureSourceChangeSuites() {
  return {
    ...measureRegionScan(),
    ...measureChangeProjection(),
    ...measureSemanticLineageInference(),
    ...measureBidirectionalTargetChanges(),
    ...measureExternalSemanticImports()
  };
}

function measureRegionScan() {
  const regionScanStart = performance.now();
  const regionScanImports = [];
  for (let index = 0; index < 100; index += 1) {
    const imported = importNativeSource({
      language: 'typescript',
      sourcePath: `src/regions-${index}.ts`,
      sourceText: `
      export function normalizeCount${index}(value) { return value; }
      export const appRoutes${index} = [
        { path: "/${index}", component: Screen${index} },
        { path: "/${index}/settings", component: Settings${index} }
      ];
      export const contentBlocks${index} = {
        docs: { title: "Docs ${index}" },
        legal: { title: "Legal ${index}" }
      };
      export const runtimeConfig${index} = {
        limits: { count: normalizeCount${index}(${index}) },
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
  return {
    regionScanImports: regionScanImports.length,
    regionScanSymbols: regionScanImports.reduce((sum, entry) => sum + entry.imported.semanticIndex.symbols.length, 0),
    regionScanDependencyRelations: regionScanImports.reduce((sum, entry) => sum + entry.sidecar.dependencies.total, 0),
    regionScanOwnershipRegions: regionScanImports.reduce((sum, entry) => sum + entry.sidecar.ownershipRegions.length, 0),
    regionScanDurationMs
  };
}

function measureChangeProjection() {
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
  return {
    changeProjectionSets: changeProjectionSets.length,
    changedRegionProjections: changeProjectionSets.reduce((sum, changeSet) => sum + changeSet.metadata.changedRegionProjectionSummary.withProjection, 0),
    changedRegionProjectionSourceMapLinks: changeProjectionSets.reduce((sum, changeSet) => sum + changeSet.metadata.changedRegionProjectionSummary.sourceMapLinks, 0),
    changeProjectionDurationMs
  };
}

function measureSemanticLineageInference() {
  const start = performance.now();
  const inferences = [];
  for (let index = 0; index < 80; index += 1) {
    inferences.push(inferSemanticLineageEvents({
      id: `bench_semantic_lineage_inference_${index}`,
      before: {
        language: 'typescript',
        sourcePath: `src/lineage-before-${index}.ts`,
        sourceText: `export function lineageBench${index}(value) { return value + ${index}; }\n`
      },
      after: {
        language: 'typescript',
        sourcePath: index % 5 === 0 ? `src/lineage-before-${index}.ts` : `src/lineage-after-${index}.ts`,
        sourceText: index % 6 === 0
          ? `export const lineageBenchDeleted${index} = true;\n`
          : `export function lineageBench${index}(value) { return value + ${index}; }\n`
      }
    }));
  }
  return {
    semanticLineageInferences: inferences.length,
    semanticLineageEvents: inferences.reduce((sum, inference) => sum + inference.events.length, 0),
    semanticLineageDeleted: inferences.reduce((sum, inference) => sum + inference.summary.deleted, 0),
    semanticLineageInferenceDurationMs: performance.now() - start
  };
}

function measureBidirectionalTargetChanges() {
  const start = performance.now();
  const source = importNativeSource({
    language: 'typescript',
    sourcePath: 'src/bidirectional-source.ts',
    sourceText: 'export function advance(frame: number): number { return frame + 1; }\n'
  });
  const lineage = [createSemanticLineageEvent({
    eventKind: 'moved',
    from: { key: 'source#src/bidirectional-source.ts#body#advance', symbolName: 'advance' },
    to: { key: 'source#src/runtime-core.ts#body#advanceFrame', symbolName: 'advanceFrame' }
  })];
  const records = [];
  for (let index = 0; index < 60; index += 1) {
    records.push(createBidirectionalTargetChangeRecord({
      id: `bench_bidirectional_target_change_${index}`,
      source,
      targetLanguage: 'rust',
      targetPath: `src/bidirectional-${index}.rs`,
      baseTarget: {
        language: 'rust',
        sourcePath: `src/bidirectional-${index}.rs`,
        sourceText: `pub fn advance(frame: i32) -> i32 { frame + ${index} }\n`
      },
      editedTarget: {
        language: 'rust',
        sourcePath: `src/bidirectional-${index}.rs`,
        sourceText: `pub fn advance(frame: i32, delta: i32) -> i32 { frame + delta + ${index} }\n`
      },
      sourceAnchorMappings: [{ targetSymbolName: 'advance', sourceSymbolName: 'advance' }],
      lineage: index % 4 === 0 ? lineage : []
    }));
  }
  return {
    bidirectionalTargetChanges: records.length,
    bidirectionalTargetChangeMatches: records.reduce((sum, record) => sum + record.summary.sourceAnchorMatches, 0),
    bidirectionalTargetChangeBlocked: records.filter((record) => record.readiness === 'blocked').length,
    bidirectionalTargetChangeDurationMs: performance.now() - start
  };
}

function measureExternalSemanticImports() {
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
  return {
    externalSemanticImports: externalSemanticImports.length,
    externalSemanticSymbols: externalSemanticImports.reduce((sum, imported) => sum + imported.semanticIndex.symbols.length, 0),
    externalSemanticMappings: externalSemanticImports.reduce((sum, imported) => sum + imported.summary.sourceMapMappings, 0),
    externalSemanticDurationMs
  };
}
