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
  sourceText: "import defaultThing, { type Model, value as localValue } from './dep.js' with { mode: 'worker' };\nimport * as allDep from './all.js';\nimport './side-effect.js';\n",
  adapterOptions: { ast: program([
    importDecl('./dep.js', [
      { type: 'ImportDefaultSpecifier', local: id('defaultThing') },
      { type: 'ImportSpecifier', imported: id('Model'), local: id('Model'), importKind: 'type' },
      { type: 'ImportSpecifier', imported: id('value'), local: id('localValue') }
    ], [importAttr('mode', 'worker')]),
    importDecl('./all.js', [{ type: 'ImportNamespaceSpecifier', local: id('allDep') }]),
    importDecl('./side-effect.js', [])
  ]) }
});
const importEdges = moduleEdges(imported).filter((edge) => edge.role === 'import');
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'defaultThing', importedName: 'default', importKind: 'default' });
assertEdge(importEdges, { moduleSpecifier: './dep.js', importKind: 'module', hasImportAttributes: true, importAttributeCount: 1 });
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'Model', importedName: 'Model', importKind: 'type-named', isTypeOnly: true });
assertEdge(importEdges, { moduleSpecifier: './dep.js', localName: 'localValue', importedName: 'value', importKind: 'named' });
assertEdge(importEdges, { moduleSpecifier: './all.js', localName: 'allDep', importedName: '*', importKind: 'namespace', namespace: 'allDep' });
assertEdge(importEdges, { moduleSpecifier: './side-effect.js', importKind: 'side-effect' });
assertUniqueGraphIds(imported);

const dynamicImported = await runNativeImporterAdapter(adapter, {
  sourcePath: 'src/dynamic.js',
  sourceText: "import('./lazy.js');\nimport('./data.json', { with: { type: 'json' } });\nconst target = './runtime.js';\nimport(target);\n",
  adapterOptions: { ast: program([
    exprStmt({ type: 'ImportExpression', source: lit('./lazy.js') }),
    exprStmt({ type: 'CallExpression', callee: { type: 'Import' }, arguments: [lit('./data.json'), importOptions()] }),
    varDecl([varDeclarator(id('target'), lit('./runtime.js'))]),
    exprStmt({ type: 'ImportExpression', source: id('target') })
  ]) }
});
const dynamicImportEdges = moduleEdges(dynamicImported).filter((edge) => edge.role === 'import' && edge.importKind === 'dynamic-import');
assertEdge(dynamicImportEdges, { moduleSpecifier: './lazy.js', importKind: 'dynamic-import' });
assertEdge(dynamicImportEdges, { moduleSpecifier: './data.json', importKind: 'dynamic-import', hasImportAttributes: true, importAttributeCount: 1 });
assertEdge(dynamicImportEdges, { moduleSpecifier: '<dynamic-import>', importKind: 'dynamic-import' });
assertUniqueGraphIds(dynamicImported);

const commonJs = await runNativeImporterAdapter(adapter, {
  sourcePath: 'src/commonjs.cjs',
  sourceText: "const legacy = require('./legacy.cjs');\nconst { named, renamed: localRenamed } = require('./named.cjs');\nrequire('./setup.cjs');\nconst dynamicName = './dynamic.cjs';\nconst blocked = require(dynamicName);\nmodule.exports = legacy;\nexports.named = named;\nmodule.exports.renamed = localRenamed;\nexports[pick] = named;\n",
  adapterOptions: { ast: program([
    varDecl([varDeclarator(id('legacy'), call(id('require'), [lit('./legacy.cjs')]))]),
    varDecl([varDeclarator(objectPattern([
      objectProperty(id('named'), id('named')),
      objectProperty(id('renamed'), id('localRenamed'))
    ]), call(id('require'), [lit('./named.cjs')]))]),
    exprStmt(call(id('require'), [lit('./setup.cjs')])),
    varDecl([varDeclarator(id('dynamicName'), lit('./dynamic.cjs'))]),
    varDecl([varDeclarator(id('blocked'), call(id('require'), [id('dynamicName')]))]),
    exprStmt(assign(member(id('module'), id('exports')), id('legacy'))),
    exprStmt(assign(member(id('exports'), id('named')), id('named'))),
    exprStmt(assign(member(member(id('module'), id('exports')), id('renamed')), id('localRenamed'))),
    exprStmt(assign(member(id('exports'), id('pick'), { computed: true }), id('named')))
  ]) }
});
const commonJsImportEdges = moduleEdges(commonJs).filter((edge) => edge.role === 'import');
assertEdge(commonJsImportEdges, { moduleSpecifier: './legacy.cjs', localName: 'legacy', importedName: 'default', importKind: 'commonjs-require' });
assertEdge(commonJsImportEdges, { moduleSpecifier: './named.cjs', localName: 'named', importedName: 'named', importKind: 'commonjs-require' });
assertEdge(commonJsImportEdges, { moduleSpecifier: './named.cjs', localName: 'localRenamed', importedName: 'renamed', importKind: 'commonjs-require' });
assertEdge(commonJsImportEdges, { moduleSpecifier: './setup.cjs', importKind: 'commonjs-require' });
assert.equal(commonJsImportEdges.some((edge) => edge.moduleSpecifier === './dynamic.cjs'), false);
const commonJsExportEdges = moduleEdges(commonJs).filter((edge) => edge.role === 'export');
assertEdge(commonJsExportEdges, { exportedName: 'module.exports', localName: 'legacy', exportKind: 'assignment', publicContract: true });
assertEdge(commonJsExportEdges, { exportedName: 'named', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(commonJsExportEdges, { exportedName: 'renamed', localName: 'localRenamed', exportKind: 'commonjs-named', publicContract: true });
assert.equal(commonJsExportEdges.some((edge) => edge.exportedName === 'pick'), false);
assertUniqueGraphIds(commonJs);

const exported = await runNativeImporterAdapter(adapter, {
  sourcePath: 'src/exports.js',
  sourceText: "export { value as publicValue, type Model as PublicModel } from './dep.js';\nexport * from './barrel.js' with { type: 'json' };\nexport * as allExports from './all.js';\nexport { LocalType as PublicLocal };\nexport default defaultThing;\n",
  adapterOptions: { ast: program([
    exportNamed('./dep.js', [
      { type: 'ExportSpecifier', local: id('value'), exported: id('publicValue') },
      { type: 'ExportSpecifier', local: id('Model'), exported: id('PublicModel'), exportKind: 'type' }
    ]),
    exportAll('./barrel.js', undefined, [importAttr('type', 'json')]),
    exportAll('./all.js', id('allExports')),
    exportNamed(undefined, [{ type: 'ExportSpecifier', local: id('LocalType'), exported: id('PublicLocal') }]),
    { type: 'ExportDefaultDeclaration', declaration: id('defaultThing') }
  ]) }
});
const exportEdges = moduleEdges(exported).filter((edge) => edge.role === 'export');
assertEdge(exportEdges, { moduleSpecifier: './dep.js', exportedName: 'publicValue', importedName: 'value', exportKind: 'named', isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './dep.js', exportedName: 'PublicModel', importedName: 'Model', isTypeOnly: true, isReExport: true });
assertEdge(exportEdges, { moduleSpecifier: './barrel.js', exportKind: 'export-star', exportStar: true, isReExport: true, hasImportAttributes: true, importAttributeCount: 1 });
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

const conditionalCommonJsPackageProject = await importNativeProject({
  id: 'syntax_project_commonjs_conditional_package_exports',
  projectRoot: '.',
  moduleResolution: {
    packages: {
      '@pkg/dual': {
        root: 'packages/dual',
        exports: {
          './feature': {
            import: './esm/feature.js',
            require: './cjs/feature.cjs',
            default: './esm/feature.js'
          }
        }
      }
    },
    packageExportConditions: ['import', 'require', 'default']
  },
  adapters: [adapter],
  sources: [{
    language: 'javascript',
    sourcePath: 'src/consumer.cjs',
    sourceText: "const { dual } = require('@pkg/dual/feature');\n",
    adapterOptions: { ast: program([
      varDecl([varDeclarator(objectPattern([objectProperty(id('dual'), id('dual'))]), call(id('require'), [lit('@pkg/dual/feature')]))])
    ]) }
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/cjs/feature.cjs',
    sourceText: 'const dual = 1;\nexports.dual = dual;\n',
    adapterOptions: { ast: program([
      varDecl([varDeclarator(id('dual'), lit(1))]),
      exprStmt(assign(member(id('exports'), id('dual')), id('dual')))
    ]) }
  }, {
    language: 'javascript',
    sourcePath: 'packages/dual/esm/feature.js',
    sourceText: 'export const dual = 2;\n',
    adapterOptions: { ast: program([
      { type: 'ExportNamedDeclaration', declaration: variableDeclaration('dual'), specifiers: [], source: null }
    ]) }
  }]
});
const conditionalCommonJsPackageEdge = conditionalCommonJsPackageProject.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === '@pkg/dual/feature' && edge.importedName === 'dual');
assert.equal(conditionalCommonJsPackageEdge.packageName, '@pkg/dual');
assert.equal(conditionalCommonJsPackageEdge.packageSubpath, './feature');
assert.equal(conditionalCommonJsPackageEdge.packageExportCondition, 'require');
assert.equal(conditionalCommonJsPackageEdge.resolvedModulePath, 'packages/dual/cjs/feature.cjs');
assert.equal(conditionalCommonJsPackageEdge.resolutionKind, 'package-source');
assert.equal(conditionalCommonJsPackageEdge.resolvedTargetSymbolId, 'symbol:javascript:export:dual');

function program(body) {
  return { type: 'Program', sourceType: 'module', body };
}

function babelFile(body) {
  return { type: 'File', program: program(body), errors: [] };
}

function importDecl(source, specifiers, attributes) {
  return { type: 'ImportDeclaration', source: lit(source), specifiers, attributes };
}

function exportNamed(source, specifiers) {
  return { type: 'ExportNamedDeclaration', declaration: null, source: source ? lit(source) : null, specifiers };
}

function exportAll(source, exported, attributes) {
  return { type: 'ExportAllDeclaration', source: lit(source), exported, attributes };
}

function varDecl(declarations) {
  return { type: 'VariableDeclaration', declarations };
}

function varDeclarator(idNode, init) {
  return { type: 'VariableDeclarator', id: idNode, init };
}

function exprStmt(expression) {
  return { type: 'ExpressionStatement', expression };
}

function call(callee, args) {
  return { type: 'CallExpression', callee, arguments: args };
}

function objectPattern(properties) {
  return { type: 'ObjectPattern', properties };
}

function objectProperty(key, value) {
  return { type: 'Property', key, value };
}

function member(object, property, options = {}) {
  return { type: 'MemberExpression', object, property, computed: Boolean(options.computed) };
}

function assign(left, right) {
  return { type: 'AssignmentExpression', operator: '=', left, right };
}

function objectExpr(properties = []) {
  return { type: 'ObjectExpression', properties };
}

function importOptions() { return objectExpr([objectProperty(id('with'), objectExpr([objectProperty(id('type'), lit('json'))]))]); }

function importAttr(key, value) { return { key: id(key), value: lit(value) }; }

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
