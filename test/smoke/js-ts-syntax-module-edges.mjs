import { assert } from './helpers.mjs';
import {
  createBabelNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const adapter = createEstreeNativeImporterAdapter();
const imported = await runNativeImporterAdapter(adapter, {
  sourcePath: 'src/index.js',
  sourceText: "import defaultThing, { type Model, value as localValue } from './dep.js';\nimport * as allDep from './all.js';\nimport './side-effect.js';\n",
  adapterOptions: { ast: program([
    importDecl('./dep.js', [
      { type: 'ImportDefaultSpecifier', local: id('defaultThing') },
      { type: 'ImportSpecifier', imported: id('Model'), local: id('Model'), importKind: 'type' },
      { type: 'ImportSpecifier', imported: id('value'), local: id('localValue') }
    ]),
    importDecl('./all.js', [{ type: 'ImportNamespaceSpecifier', local: id('allDep') }]),
    importDecl('./side-effect.js', [])
  ]) }
});
const importEdges = moduleEdges(imported).filter((edge) => edge.role === 'import');
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'defaultThing', importedName: 'default', importKind: 'default' });
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'Model', importedName: 'Model', importKind: 'type-named', isTypeOnly: true });
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'localValue', importedName: 'value', importKind: 'named' });
assertEdge(importEdges, { moduleSpecifier: './all.js', localName: 'allDep', importedName: '*', importKind: 'namespace', namespace: 'allDep' });
assertEdge(importEdges, { moduleSpecifier: './side-effect.js', importKind: 'side-effect' });
assertUniqueGraphIds(imported);

const exported = await runNativeImporterAdapter(adapter, {
  sourcePath: 'src/exports.js',
  sourceText: "export { value as publicValue, type Model as PublicModel } from './dep.js';\nexport * from './barrel.js';\nexport * as allExports from './all.js';\nexport { LocalType as PublicLocal };\nexport default defaultThing;\n",
  adapterOptions: { ast: program([
    exportNamed('./dep.js', [
      { type: 'ExportSpecifier', local: id('value'), exported: id('publicValue') },
      { type: 'ExportSpecifier', local: id('Model'), exported: id('PublicModel'), exportKind: 'type' }
    ]),
    exportAll('./barrel.js'),
    exportAll('./all.js', id('allExports')),
    exportNamed(undefined, [{ type: 'ExportSpecifier', local: id('LocalType'), exported: id('PublicLocal') }]),
    { type: 'ExportDefaultDeclaration', declaration: id('defaultThing') }
  ]) }
});
const exportEdges = moduleEdges(exported).filter((edge) => edge.role === 'export');
assertEdge(exportEdges, { moduleSpecifier: './dep.js', exportedName: 'publicValue', importedName: 'value', exportKind: 'named', isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './dep.js', exportedName: 'PublicModel', importedName: 'Model', isTypeOnly: true, isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './barrel.js', exportKind: 'export-star', exportStar: true, isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './all.js', exportedName: 'allExports', importedName: '*', exportKind: 'namespace-reexport', namespace: 'allExports', isReExport: true });
assertEdge(exportEdges, { exportedName: 'PublicLocal', localName: 'LocalType', exportKind: 'named', publicContract: true });
assertEdge(exportEdges, { exportedName: 'default', localName: 'defaultThing', exportKind: 'default', publicContract: true });
assertUniqueGraphIds(exported);

const babelAdapter = createBabelNativeImporterAdapter();
const babelTyped = await runNativeImporterAdapter(babelAdapter, {
  sourcePath: 'src/babel-types.ts',
  sourceText: "import type { Model } from './types.js';\nimport type * as TypeNS from './types.js';\nexport type { Model as PublicModel } from './types.js';\nexport type * as TypeExports from './types.js';\nexport interface LocalModel {}\n",
  adapterOptions: { ast: babelFile([
    { type: 'ImportDeclaration', importKind: 'type', source: lit('./types.js'), specifiers: [{ type: 'ImportSpecifier', imported: id('Model'), local: id('Model') }] },
    { type: 'ImportDeclaration', importKind: 'type', source: lit('./types.js'), specifiers: [{ type: 'ImportNamespaceSpecifier', local: id('TypeNS') }] },
    { type: 'ExportNamedDeclaration', exportKind: 'type', declaration: null, source: lit('./types.js'), specifiers: [{ type: 'ExportSpecifier', local: id('Model'), exported: id('PublicModel') }] },
    { type: 'ExportAllDeclaration', exportKind: 'type', source: lit('./types.js'), exported: id('TypeExports') },
    { type: 'ExportNamedDeclaration', declaration: { type: 'TSInterfaceDeclaration', id: id('LocalModel') }, specifiers: [], source: null }
  ]) }
});
const babelEdges = moduleEdges(babelTyped);
assertEdge(babelEdges.filter((edge) => edge.role === 'import'), { moduleSpecifier: './types.js', localName: 'Model', importedName: 'Model', importKind: 'type-named', isTypeOnly: true });
assertEdge(babelEdges.filter((edge) => edge.role === 'import'), { moduleSpecifier: './types.js', localName: 'TypeNS', importedName: '*', importKind: 'namespace', namespace: 'TypeNS', isTypeOnly: true });
assertEdge(babelEdges.filter((edge) => edge.role === 'export'), { moduleSpecifier: './types.js', exportedName: 'PublicModel', importedName: 'Model', exportKind: 'type-named', isTypeOnly: true, isReExport: true });
assertEdge(babelEdges.filter((edge) => edge.role === 'export'), { moduleSpecifier: './types.js', exportedName: 'TypeExports', importedName: '*', exportKind: 'namespace-reexport', namespace: 'TypeExports', isTypeOnly: true, isReExport: true });
assertEdge(babelEdges.filter((edge) => edge.role === 'export'), { exportedName: 'LocalModel', localName: 'LocalModel', exportKind: 'type-named', isTypeOnly: true, publicContract: true });
assertUniqueGraphIds(babelTyped);

const babelNamespaces = await runNativeImporterAdapter(babelAdapter, {
  sourcePath: 'src/babel-namespaces.ts',
  sourceText: "export namespace Tools { export const value = 1; }\ndeclare module './plugin' { export interface Plugin {} }\n",
  adapterOptions: { ast: babelFile([
    { type: 'ExportNamedDeclaration', declaration: tsModuleDeclaration(id('Tools')), specifiers: [], source: null },
    tsModuleDeclaration(lit('./plugin'), { declare: true })
  ]) }
});
assertSymbol(babelNamespaces.semanticIndex.symbols, { name: 'Tools', kind: 'module', ownershipRegionKind: 'body', namespace: 'Tools' });
assertSymbol(babelNamespaces.semanticIndex.symbols, { name: './plugin', kind: 'module', ownershipRegionKind: 'body', namespace: './plugin' });
assertEdge(moduleEdges(babelNamespaces).filter((edge) => edge.role === 'export'), { exportedName: 'Tools', localName: 'Tools', exportKind: 'named', publicContract: true });
assertUniqueGraphIds(babelNamespaces);

const project = await importNativeProject({
  id: 'syntax_project_module_edges',
  projectRoot: 'src',
  adapters: [adapter],
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.js',
    sourceText: "import defaultThing, { value as localValue } from './dep.js';\nexport * from './barrel.js';\n",
    adapterOptions: { ast: program([importDecl('./dep.js', [
      { type: 'ImportDefaultSpecifier', local: id('defaultThing') },
      { type: 'ImportSpecifier', imported: id('value'), local: id('localValue') }
    ]), exportAll('./barrel.js')]) }
  }, {
    language: 'javascript',
    sourcePath: 'src/dep.js',
    sourceText: 'export default function defaultThing() {}\nexport const value = 1;\n',
    adapterOptions: { ast: program([
      { type: 'ExportDefaultDeclaration', declaration: { type: 'FunctionDeclaration', id: id('defaultThing') } },
      { type: 'ExportNamedDeclaration', declaration: variableDeclaration('value'), specifiers: [], source: null }
    ]) }
  }, {
    language: 'javascript',
    sourcePath: 'src/barrel.js',
    sourceText: 'export const barrelValue = 1;\n',
    adapterOptions: { ast: program([{ type: 'ExportNamedDeclaration', declaration: variableDeclaration('barrelValue'), specifiers: [], source: null }]) }
  }]
});
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './dep.js', importedName: 'default', resolvedTargetSymbolId: 'symbol:javascript:export:default' });
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './dep.js', importedName: 'value', resolvedTargetSymbolId: 'symbol:javascript:export:value' });
assertEdge(project.projectSymbolGraph.importEdges, { moduleSpecifier: './barrel.js', exportStar: true, resolvedModulePath: 'src/barrel.js' });
assertEdge(project.projectSymbolGraph.reExportIdentities, { exportedName: 'barrelValue', originSymbolId: 'symbol:javascript:export:barrelvalue', isExportStar: true });

function program(body) {
  return { type: 'Program', sourceType: 'module', body };
}

function babelFile(body) {
  return { type: 'File', program: program(body), errors: [] };
}

function importDecl(source, specifiers) {
  return { type: 'ImportDeclaration', source: lit(source), specifiers };
}

function exportNamed(source, specifiers) {
  return { type: 'ExportNamedDeclaration', declaration: null, source: source ? lit(source) : null, specifiers };
}

function exportAll(source, exported) {
  return { type: 'ExportAllDeclaration', source: lit(source), exported };
}

function variableDeclaration(name) {
  return { type: 'VariableDeclaration', declarations: [{ type: 'VariableDeclarator', id: id(name) }] };
}

function tsModuleDeclaration(moduleId, options = {}) {
  return { type: 'TSModuleDeclaration', id: moduleId, body: { type: 'TSModuleBlock', body: [] }, ...options };
}

function id(name) {
  return { type: 'Identifier', name };
}

function lit(value) {
  return { type: 'Literal', value };
}

function moduleEdges(importResult) {
  return importResult.semanticIndex.facts.filter((fact) => fact.predicate === 'moduleEdge').map((fact) => fact.value);
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
}

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `duplicate ${label} ids`);
}
