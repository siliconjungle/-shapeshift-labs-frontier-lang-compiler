import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject
} from './compiler-api.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-conflicts.js';
import { sourceSpanHash } from '../../src/js-ts-safe-project-merge-global-augmentation-compatibility.js';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;
const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript });

const sourceText = [
  'export namespace Tools { export const value = 1; }',
  'declare module "./plugin" { export interface Plugin { id: string; } }',
  'declare global { interface Window { appVersion: string; } }',
  'const legacyRuntime = {};',
  'export = legacyRuntime;',
  ''
].join('\n');

const project = await importNativeProject({
  id: 'namespace_ambient_export_assignment_shape_records',
  projectRoot: 'src',
  adapters: [adapter],
  sources: [{ language: 'typescript', sourcePath: 'src/contracts.ts', sourceText }]
});

const graph = project.projectSymbolGraph;
const namespaceRecord = findModuleRecord(graph, 'Tools');
const ambientRecord = findModuleRecord(graph, './plugin');
const globalRecord = findModuleRecord(graph, 'global');
const exportAssignmentRecord = graph.exportAssignmentRecords.find((record) => record.exportedName === 'module.exports');

assert.equal(namespaceRecord.surfaceKind, 'namespace-declaration');
assert.equal(namespaceRecord.runtimeNamespace, true);
assert.equal(namespaceRecord.shapeProof.runtimeEquivalenceClaim, false);
assert.equal(namespaceRecord.shapeProof.unsupportedSignals.includes('namespace-runtime-evaluation-order-unproven'), true);
assert.equal(typeof namespaceRecord.shapeHash, 'string');
assert.equal(ambientRecord.surfaceKind, 'ambient-module-declaration');
assert.equal(ambientRecord.declarationOnly, true);
assert.equal(ambientRecord.ambient, true);
assert.equal(ambientRecord.shapeProof.unsupportedSignals.includes('ambient-module-consumer-compatibility-unproven'), true);
assert.equal(globalRecord.surfaceKind, 'global-augmentation');
assert.equal(globalRecord.shapeProof.unsupportedSignals.includes('global-augmentation-compatibility-unproven'), true);
assert.equal(exportAssignmentRecord.localName, 'legacyRuntime');
assert.equal(exportAssignmentRecord.commonJsShape, true);
assert.equal(exportAssignmentRecord.shapeProof.runtimeInteropEquivalenceClaim, false);
assert.equal(exportAssignmentRecord.shapeProof.semanticEquivalenceClaim, false);

const namespaceDelta = await projectDelta({
  base: 'namespace StoreNamespace { export const mode = 1; }\n',
  worker: 'namespace StoreNamespace { export const mode = 2; }\n',
  head: 'namespace StoreNamespace { export const mode = 1; export const extra = 3; }\n',
  output: 'namespace StoreNamespace { export const mode = 2; export const extra = 3; }\n'
});
const namespaceConflict = projectGraphDeltaConflicts(namespaceDelta)
  .find((conflict) => conflict.code === 'project-module-declaration-shape-delta-conflict');
assert.equal(Boolean(namespaceConflict), true);
assert.equal(namespaceConflict.details.base.surfaceKind, 'namespace-declaration');
assert.equal(namespaceConflict.details.worker.shapeHash !== namespaceConflict.details.head.shapeHash, true);
assert.equal(namespaceConflict.details.semanticEquivalenceClaim, false);

const exportAssignmentDelta = await projectDelta({
  base: 'const legacyRuntime = {};\nexport = legacyRuntime;\n',
  worker: 'const workerRuntime = {};\nexport = workerRuntime;\n',
  head: 'const headRuntime = {};\nexport = headRuntime;\n',
  output: 'const outputRuntime = {};\nexport = outputRuntime;\n'
});
const exportAssignmentConflict = projectGraphDeltaConflicts(exportAssignmentDelta)
  .find((conflict) => conflict.code === 'project-export-assignment-shape-delta-conflict');
assert.equal(Boolean(exportAssignmentConflict), true);
assert.equal(exportAssignmentConflict.details.base.exportedName, 'module.exports');
assert.equal(exportAssignmentConflict.details.worker.localName, 'workerRuntime');
assert.equal(exportAssignmentConflict.details.head.localName, 'headRuntime');
assert.equal(exportAssignmentConflict.details.requiredProof, 'static-shape-evidence');

const globalAugmentationDelta = await projectDelta({
  base: 'declare global { interface Window { appVersion: string; } }\nexport {};\n',
  worker: 'declare global { interface Window { appVersion: string | undefined; } }\nexport {};\n',
  head: 'declare global { interface Window { appVersion: string; buildId: number; } }\nexport {};\n',
  output: 'declare global { interface Window { appVersion: string | undefined; buildId: number; } }\nexport {};\n'
});
const globalAugmentationConflict = projectGraphDeltaConflicts(globalAugmentationDelta)
  .find((conflict) => conflict.code === 'project-module-declaration-shape-delta-conflict');
assert.equal(Boolean(globalAugmentationConflict), true);
assert.equal(globalAugmentationConflict.details.output.surfaceKind, 'global-augmentation');
assert.equal(globalAugmentationConflict.details.routeId, 'prove-global-augmentation-compatibility');
assert.equal(globalAugmentationConflict.details.reasonCodes.includes('global-augmentation-compatibility-proof-missing'), true);
assert.equal(globalAugmentationConflict.details.globalAugmentationCompatibilityProof.expected.moduleDeclarationShapeHash, globalAugmentationConflict.details.output.shapeHash);

const globalProofConflicts = projectGraphDeltaConflicts(globalAugmentationDelta, {
  globalAugmentationCompatibilityProof: globalProofFromRecord(globalAugmentationDelta.stages.output.projectSymbolGraph.moduleDeclarationRecords.find((record) => record.moduleName === 'global'))
});
assert.equal(globalProofConflicts.some((conflict) => conflict.code === 'project-module-declaration-shape-delta-conflict'), false);

function findModuleRecord(graph, moduleName) {
  const record = graph.moduleDeclarationRecords.find((candidate) => candidate.moduleName === moduleName);
  assert.ok(record, `missing module declaration record ${moduleName}`);
  return record;
}

async function projectDelta(sources) {
  const stages = {};
  for (const [stageName, sourceText] of Object.entries(sources)) {
    stages[stageName] = await projectStage(`namespace_ambient_shape_${stageName}`, sourceText);
  }
  return { stages };
}

async function projectStage(id, sourceText) {
  const projectImport = await importNativeProject({
    id,
    projectRoot: 'src',
    adapters: [adapter],
    sources: [{ language: 'typescript', sourcePath: 'src/contracts.ts', sourceText }]
  });
  return { projectImport, projectSymbolGraph: projectImport.projectSymbolGraph };
}

function globalProofFromRecord(record, overrides = {}) {
  return {
    schema: 'frontier.lang.globalAugmentationCompatibilityProof.v1',
    version: 1,
    status: 'passed',
    surfaceKind: 'global-augmentation',
    sourcePath: record.sourcePath,
    sourceHash: record.sourceHash,
    moduleName: 'global',
    moduleDeclarationRecordId: record.id,
    moduleDeclarationShapeHash: record.shapeHash,
    moduleDeclarationSignatureHash: record.signatureHash,
    sourceSpanHash: sourceSpanHash(record.sourceSpan),
    declarationOutputGateId: 'declaration-output',
    declarationOutputHash: 'declaration-boundary-hash',
    consumerDiagnosticsGateId: 'consumer-diagnostics',
    consumerDiagnosticsHash: 'consumer-diagnostics-hash',
    consumerEntrypoints: ['src/index.ts'],
    consumerDiagnosticsPassed: true,
    globalCompatibilityClaim: 'declaration-boundary-consumer-diagnostics-only',
    hostRuntimeInteractionClaim: false,
    autoMergeClaim: false,
    runtimeEquivalenceClaim: false,
    semanticEquivalenceClaim: false,
    ...overrides
  };
}
