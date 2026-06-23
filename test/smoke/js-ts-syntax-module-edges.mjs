import { assert } from './helpers.mjs';
import {
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

function assertUniqueGraphIds(importResult) {
  assertUnique(importResult.semanticIndex.occurrences.map((entry) => entry.id), 'occurrence');
  assertUnique(importResult.semanticIndex.relations.map((entry) => entry.id), 'relation');
  assertUnique(importResult.semanticIndex.facts.map((entry) => entry.id), 'fact');
}

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `duplicate ${label} ids`);
}
