import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const importedBindings = await runTypeScriptAdapter('src/imports.ts', `
import defaultThing, { type Model, value as localValue } from './dep.js' with { mode: 'worker' };
import * as allDep from './all.js';
import type * as typeBag from './types.js';
import legacy = require('./legacy.cjs');
import './side-effect.js';
`);
const importEdges = moduleEdges(importedBindings).filter((edge) => edge.role === 'import');
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'defaultThing', importedName: 'default', importKind: 'default' });
assertEdge(importEdges, { moduleSpecifier: './dep.js', importKind: 'module', hasImportAttributes: true, importAttributeCount: 1 });
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'Model', importedName: 'Model', importKind: 'type-named', isTypeOnly: true });
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'localValue', importedName: 'value', importKind: 'named' });
assertEdge(importEdges, { moduleSpecifier: './all.js', localName: 'allDep', importedName: '*', importKind: 'namespace', namespace: 'allDep' });
assertEdge(importEdges, { moduleSpecifier: './types.js', localName: 'typeBag', importedName: '*', importKind: 'namespace', namespace: 'typeBag', isTypeOnly: true });
assertEdge(importEdges, { moduleSpecifier: './legacy.cjs', localName: 'legacy', importedName: 'default', importKind: 'commonjs-require' });
assertEdge(importEdges, { moduleSpecifier: './side-effect.js', importKind: 'side-effect' });
assertUniqueGraphIds(importedBindings);

const dynamicImports = await runTypeScriptAdapter('src/dynamic.ts', `
const lazy = await import('./lazy.js');
import('./data.json', { with: { type: 'json' } });
const unknown = './unknown.js';
import(unknown);
`);
const dynamicImportEdges = moduleEdges(dynamicImports).filter((edge) => edge.role === 'import' && edge.importKind === 'dynamic-import');
assertEdge(dynamicImportEdges, { moduleSpecifier: './lazy.js', importKind: 'dynamic-import' });
assertEdge(dynamicImportEdges, { moduleSpecifier: './data.json', importKind: 'dynamic-import', hasImportAttributes: true, importAttributeCount: 1 });
assertEdge(dynamicImportEdges, { moduleSpecifier: '<dynamic-import>', importKind: 'dynamic-import' });
assert.equal(dynamicImportEdges.some((edge) => edge.moduleSpecifier === './unknown.js'), false);
assertUniqueGraphIds(dynamicImports);

const exportedBindings = await runTypeScriptAdapter('src/exports.ts', `
export { value as publicValue, type Model as PublicModel } from './dep.js';
export * from './barrel.js' with { type: 'json' };
export * as allExports from './all.js';
export type { LocalType as PublicLocal };
`);
const exportEdges = moduleEdges(exportedBindings).filter((edge) => edge.role === 'export');
assertEdge(exportEdges, { moduleSpecifier: './dep.js', exportedName: 'publicValue', importedName: 'value', exportKind: 'named', isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './dep.js', exportedName: 'PublicModel', importedName: 'Model', isTypeOnly: true, isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './barrel.js', exportKind: 'export-star', exportStar: true, isReExport: true, hasImportAttributes: true, importAttributeCount: 1 });
assertEdge(exportEdges, { moduleSpecifier: './all.js', exportedName: 'allExports', importedName: '*', exportKind: 'namespace-reexport', namespace: 'allExports', isReExport: true });
assertEdge(exportEdges, { exportedName: 'PublicLocal', localName: 'LocalType', exportKind: 'type-named', isTypeOnly: true, publicContract: true });
assert.equal(exportedBindings.semanticIndex.facts.filter((fact) => fact.predicate === 'reExportIdentity').length >= 4, true);
assert.equal(exportedBindings.semanticIndex.facts.filter((fact) => fact.predicate === 'publicContractRegion').length >= 5, true);
assertUniqueReExportIdentityIds(exportedBindings);
assertUniqueGraphIds(exportedBindings);

const declarationExports = await runTypeScriptAdapter('src/declaration-exports.ts', `
export default function () { return true; }
export const alpha = 1, beta = 2;
`);
const declarationExportEdges = moduleEdges(declarationExports).filter((edge) => edge.role === 'export');
assertEdge(declarationExportEdges, { exportedName: 'default', exportKind: 'default', publicContract: true });
assertEdge(declarationExportEdges, { exportedName: 'alpha', localName: 'alpha', exportKind: 'named', publicContract: true });
assertEdge(declarationExportEdges, { exportedName: 'beta', localName: 'beta', exportKind: 'named', publicContract: true });
assertUniqueGraphIds(declarationExports);

const exportAssignment = await runTypeScriptAdapter('src/legacy.ts', `
const legacyRuntime = {};
export = legacyRuntime;
`);
assertEdge(moduleEdges(exportAssignment), { exportedName: 'module.exports', localName: 'legacyRuntime', exportKind: 'assignment', publicContract: true });
assertUniqueGraphIds(exportAssignment);

const exportDefaultAssignment = await runTypeScriptAdapter('src/default-assignment.ts', `
const legacyRuntime = {};
export default legacyRuntime;
`);
assertEdge(moduleEdges(exportDefaultAssignment), { exportedName: 'default', localName: 'legacyRuntime', exportKind: 'default', publicContract: true });
assertUniqueGraphIds(exportDefaultAssignment);

const namespaceDeclarations = await runTypeScriptAdapter('src/namespaces.ts', `
export namespace Tools { export const value = 1; }
declare module './plugin' { export interface Plugin {} }
`);
assertSymbol(namespaceDeclarations.semanticIndex.symbols, { name: 'Tools', kind: 'module', ownershipRegionKind: 'body', namespace: 'Tools' });
assertSymbol(namespaceDeclarations.semanticIndex.symbols, { name: './plugin', kind: 'module', ownershipRegionKind: 'body', namespace: './plugin' });
assertEdge(moduleEdges(namespaceDeclarations).filter((edge) => edge.role === 'export'), { exportedName: 'Tools', localName: 'Tools', exportKind: 'named', publicContract: true });
assertUniqueGraphIds(namespaceDeclarations);

const projectAdapter = createTypeScriptCompilerNativeImporterAdapter({ typescript });
const project = await importNativeProject({
  id: 'typescript_compiler_project_module_edges',
  projectRoot: 'src',
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "import defaultThing, { type Model, value as localValue } from './dep.js';\nexport * from './barrel.js';\nexport const used = localValue;\n"
  }, {
    language: 'typescript',
    sourcePath: 'src/dep.ts',
    sourceText: 'export default function defaultThing() { return true; }\nexport interface Model { id: string; }\nexport const value = 1;\n'
  }, {
    language: 'typescript',
    sourcePath: 'src/barrel.ts',
    sourceText: 'export const barrelValue = 1;\n'
  }, {
    language: 'typescript',
    sourcePath: 'src/reexports.ts',
    sourceText: "export { value as renamedValue, type Model as RenamedModel } from './dep.js';\n"
  }]
});
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './dep.js', importedName: 'default', resolvedTargetSymbolId: 'symbol:typescript:export:default' });
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './dep.js', importedName: 'Model', isTypeOnly: true, resolvedTargetSymbolId: 'symbol:typescript:export:model' });
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './dep.js', importedName: 'value', resolvedTargetSymbolId: 'symbol:typescript:export:value' });
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './barrel.js', exportStar: true, resolvedModulePath: 'src/barrel.ts' });
assertEdge(project.projectSymbolGraph.exportEdges, { moduleSpecifier: './dep.js', exportedName: 'renamedValue', importedName: 'value', isReExport: true, resolvedTargetSymbolId: 'symbol:typescript:export:value' });
assertEdge(project.projectSymbolGraph.exportEdges, { moduleSpecifier: './dep.js', exportedName: 'RenamedModel', importedName: 'Model', isTypeOnly: true, isReExport: true, resolvedTargetSymbolId: 'symbol:typescript:export:model' });
assertEdge(project.projectSymbolGraph.reExportIdentities, { exportedName: 'barrelValue', originSymbolId: 'symbol:typescript:export:barrelvalue', isExportStar: true });
assertEdge(project.projectSymbolGraph.reExportIdentities, { moduleSpecifier: './dep.js', exportedName: 'renamedValue', importedName: 'value', originSymbolId: 'symbol:typescript:export:value' });
assertEdge(project.projectSymbolGraph.reExportIdentities, { moduleSpecifier: './dep.js', exportedName: 'RenamedModel', importedName: 'Model', originSymbolId: 'symbol:typescript:export:model', isTypeOnly: true });

const conditionalPackageResolution = {
  packages: {
    '@pkg/dual': {
      root: 'packages/dual',
      exports: {
        './feature': {
          import: './esm/feature.mjs',
          require: './cjs/feature.cjs',
          default: './esm/feature.mjs'
        }
      }
    }
  },
  packageExportConditions: ['import', 'require', 'default']
};

const conditionalCommonJsPackageProject = await importNativeProject({
  id: 'typescript_project_commonjs_conditional_package_exports',
  projectRoot: '.',
  moduleResolution: conditionalPackageResolution,
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/consumer.cts',
    sourceText: "import { dual } from '@pkg/dual/feature';\nexport const used = dual;\n"
  }, {
    language: 'typescript',
    sourcePath: 'packages/dual/cjs/feature.cts',
    sourceText: 'export const dual = 1;\n'
  }, {
    language: 'typescript',
    sourcePath: 'packages/dual/esm/feature.mts',
    sourceText: 'export const dual = 2;\n'
  }]
});
const conditionalCommonJsPackageEdge = conditionalCommonJsPackageProject.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === '@pkg/dual/feature' && edge.importedName === 'dual');
assert.equal(conditionalCommonJsPackageEdge.packageName, '@pkg/dual');
assert.equal(conditionalCommonJsPackageEdge.packageSubpath, './feature');
assert.equal(conditionalCommonJsPackageEdge.packageExportCondition, 'require');
assert.equal(conditionalCommonJsPackageEdge.resolvedModulePath, 'packages/dual/cjs/feature.cts');
assert.equal(conditionalCommonJsPackageEdge.resolutionKind, 'package-source');
assert.equal(conditionalCommonJsPackageEdge.resolutionPathVariant, 'extension-substitution');
assert.equal(conditionalCommonJsPackageEdge.resolvedTargetSymbolId, 'symbol:typescript:export:dual');

const packageSubpathFailClosedProject = await importNativeProject({
  id: 'typescript_project_package_subpath_fail_closed',
  projectRoot: '.',
  moduleResolution: {
    packages: { '@pkg/core': { root: 'packages/core', exports: { './public': './src/public.ts' } } },
    packageExportConditions: ['types', 'import', 'default']
  },
  adapters: [projectAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "import type { PrivateModel } from '@pkg/core/private';\nexport type Used = PrivateModel;\n"
  }, {
    language: 'typescript',
    sourcePath: 'packages/core/src/private.ts',
    sourceText: 'export interface PrivateModel { id: string; }\n'
  }]
});
const packageSubpathFailClosedEdge = packageSubpathFailClosedProject.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === '@pkg/core/private' && edge.importedName === 'PrivateModel');
assert.equal(packageSubpathFailClosedEdge.packageName, '@pkg/core');
assert.equal(packageSubpathFailClosedEdge.packageSubpath, './private');
assert.equal(packageSubpathFailClosedEdge.importKind, 'type-named');
assert.equal(packageSubpathFailClosedEdge.isTypeOnly, true);
assert.equal(packageSubpathFailClosedEdge.resolutionKind, 'package-subpath-not-exported-missing');
assert.equal(packageSubpathFailClosedEdge.resolvedModulePath, 'packages/core/private');
assert.equal(packageSubpathFailClosedEdge.targetDocumentId, undefined);
assert.equal(packageSubpathFailClosedEdge.resolvedTargetSymbolId, undefined);

const conditionalDeltaBaseFiles = {
  'src/consumer.cts': 'export const stable = 1;\n',
  'packages/dual/cjs/feature.cts': 'export const stableFeature = 1;\n',
  'packages/dual/esm/feature.mts': 'export const esmOnly = 1;\n'
};
const conditionalDeltaWorkerFiles = {
  ...conditionalDeltaBaseFiles,
  'src/consumer.cts': "import { headOnly } from '@pkg/dual/feature';\nexport const stable = 1;\nexport const workerUsesHead = headOnly;\n"
};
const conditionalDeltaHeadFiles = {
  ...conditionalDeltaBaseFiles,
  'packages/dual/cjs/feature.cts': 'export const stableFeature = 1;\nexport const headOnly = 2;\n'
};
const conditionalDeltaProject = safeMergeJsTsProject({
  id: 'typescript_project_commonjs_conditional_package_delta_graph',
  language: 'typescript',
  includeProjectGraphDelta: true,
  moduleResolution: conditionalPackageResolution,
  baseFiles: conditionalDeltaBaseFiles,
  workerFiles: conditionalDeltaWorkerFiles,
  headFiles: conditionalDeltaHeadFiles
});
const conditionalDeltaConflict = conditionalDeltaProject.conflicts.find((conflict) => conflict.code === 'project-import-target-delta-conflict');
const conditionalDeltaOutputEdge = conditionalDeltaProject.projectGraphDelta.stages.output.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === '@pkg/dual/feature' && edge.importedName === 'headOnly');
assert.equal(conditionalDeltaProject.status, 'blocked');
assert.equal(conditionalDeltaProject.admission.reasonCodes.includes('project-import-target-delta-conflict'), true);
assert.equal(conditionalDeltaProject.summary.projectGraphImportTargetConflicts, 1);
assert.equal(conditionalDeltaOutputEdge.packageExportCondition, 'require');
assert.equal(conditionalDeltaOutputEdge.resolvedModulePath, 'packages/dual/cjs/feature.cts');
assert.equal(conditionalDeltaOutputEdge.resolvedTargetSymbolId, 'symbol:typescript:export:headonly');
assert.equal(conditionalDeltaConflict.details.outputTargetSymbolId, 'symbol:typescript:export:headonly');
assert.equal(conditionalDeltaConflict.details.workerTargetSymbolId, undefined);

async function runTypeScriptAdapter(sourcePath, sourceText) {
  return runNativeImporterAdapter(createTypeScriptCompilerNativeImporterAdapter({ typescript }), {
    sourcePath,
    sourceText
  });
}

function moduleEdges(importResult) {
  return importResult.semanticIndex.facts
    .filter((fact) => fact.predicate === 'moduleEdge')
    .map((fact) => fact.value);
}

function assertEdge(edges, expected) {
  const edge = edges.find((candidate) => Object.entries(expected).every(([key, value]) => candidate[key] === value));
  assert.equal(Boolean(edge), true, `missing edge ${JSON.stringify(expected)}`);
}

function assertSymbol(symbols, expected) {
  const symbol = symbols.find((candidate) => Object.entries(expected).every(([key, value]) => (candidate[key] ?? candidate.metadata?.[key]) === value));
  assert.equal(Boolean(symbol), true, `missing symbol ${JSON.stringify(expected)}`);
}

function assertUniqueGraphIds(importResult) {
  assertUnique(importResult.semanticIndex.occurrences.map((entry) => entry.id), 'occurrence');
  assertUnique(importResult.semanticIndex.relations.map((entry) => entry.id), 'relation');
  assertUnique(importResult.semanticIndex.facts.map((entry) => entry.id), 'fact');
  assertUnique(importResult.sourceMaps.flatMap((sourceMap) => sourceMap.mappings.map((entry) => entry.id)), 'mapping');
}

function assertUniqueReExportIdentityIds(importResult) {
  assertUnique(
    importResult.semanticIndex.facts
      .filter((fact) => fact.predicate === 'reExportIdentity')
      .map((fact) => fact.value?.id)
      .filter(Boolean),
    're-export identity'
  );
}

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `duplicate ${label} ids`);
}
