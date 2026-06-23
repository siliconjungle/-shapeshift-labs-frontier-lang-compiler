import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const importedBindings = await runTypeScriptAdapter('src/imports.ts', `
import defaultThing, { type Model, value as localValue } from './dep.js';
import * as allDep from './all.js';
import './side-effect.js';
`);
const importEdges = moduleEdges(importedBindings).filter((edge) => edge.role === 'import');
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'defaultThing', importedName: 'default', importKind: 'default' });
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'Model', importedName: 'Model', importKind: 'type-named', isTypeOnly: true });
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'localValue', importedName: 'value', importKind: 'named' });
assertEdge(importEdges, { moduleSpecifier: './all.js', localName: 'allDep', importedName: '*', importKind: 'namespace', namespace: 'allDep' });
assertEdge(importEdges, { moduleSpecifier: './side-effect.js', importKind: 'side-effect' });
assertUniqueGraphIds(importedBindings);

const exportedBindings = await runTypeScriptAdapter('src/exports.ts', `
export { value as publicValue, type Model as PublicModel } from './dep.js';
export * from './barrel.js';
export * as allExports from './all.js';
export type { LocalType as PublicLocal };
`);
const exportEdges = moduleEdges(exportedBindings).filter((edge) => edge.role === 'export');
assertEdge(exportEdges, { moduleSpecifier: './dep.js', exportedName: 'publicValue', importedName: 'value', exportKind: 'named', isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './dep.js', exportedName: 'PublicModel', importedName: 'Model', isTypeOnly: true, isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './barrel.js', exportKind: 'export-star', exportStar: true, isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './all.js', exportedName: 'allExports', importedName: '*', exportKind: 'namespace-reexport', namespace: 'allExports', isReExport: true });
assertEdge(exportEdges, { exportedName: 'PublicLocal', localName: 'LocalType', exportKind: 'type-named', isTypeOnly: true, publicContract: true });
assert.equal(exportedBindings.semanticIndex.facts.filter((fact) => fact.predicate === 'reExportIdentity').length >= 4, true);
assert.equal(exportedBindings.semanticIndex.facts.filter((fact) => fact.predicate === 'publicContractRegion').length >= 5, true);
assertUniqueGraphIds(exportedBindings);

const exportAssignment = await runTypeScriptAdapter('src/legacy.ts', `
const legacyRuntime = {};
export = legacyRuntime;
`);
assertEdge(moduleEdges(exportAssignment), { exportedName: 'module.exports', localName: 'legacyRuntime', exportKind: 'assignment', publicContract: true });
assertUniqueGraphIds(exportAssignment);

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
  }]
});
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './dep.js', importedName: 'default', resolvedTargetSymbolId: 'symbol:typescript:export:default' });
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './dep.js', importedName: 'Model', isTypeOnly: true, resolvedTargetSymbolId: 'symbol:typescript:export:model' });
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './dep.js', importedName: 'value', resolvedTargetSymbolId: 'symbol:typescript:export:value' });
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './barrel.js', exportStar: true, resolvedModulePath: 'src/barrel.ts' });
assertEdge(project.projectSymbolGraph.reExportIdentities, { exportedName: 'barrelValue', originSymbolId: 'symbol:typescript:export:barrelvalue', isExportStar: true });

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

function assertUniqueGraphIds(importResult) {
  assertUnique(importResult.semanticIndex.occurrences.map((entry) => entry.id), 'occurrence');
  assertUnique(importResult.semanticIndex.relations.map((entry) => entry.id), 'relation');
  assertUnique(importResult.semanticIndex.facts.map((entry) => entry.id), 'fact');
  assertUnique(importResult.sourceMaps.flatMap((sourceMap) => sourceMap.mappings.map((entry) => entry.id)), 'mapping');
}

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `duplicate ${label} ids`);
}
