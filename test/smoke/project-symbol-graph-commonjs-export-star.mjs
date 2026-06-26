import { assert } from './helpers.mjs';
import {
  createEstreeNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const lightweightProject = await importNativeProject({
  id: 'project_symbol_graph_commonjs_export_star',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.cjs',
    sourceText: [
      '"use strict";',
      'const target = "./dynamic.cjs";',
      'const depAlias = require("./named.cjs");',
      '__exportStar(require("./dep.cjs"), exports);',
      'tslib_1.__exportStar(require("./dep2.cjs"), exports);',
      '__createBinding(exports, require("./named.cjs"), "original", "renamedOriginal");',
      '__createBinding(module.exports, require("./named.cjs"), "hidden");',
      'tslib_1.__createBinding(exports, require("./named.cjs"), "hidden", "renamedHidden");',
      'Object.defineProperty(exports, "viaGetter", { enumerable: true, get: function () { return depAlias.hidden; } });',
      'Object.defineProperty(exports, "viaNamedFunctionGetter", { enumerable: true, get: function getViaNamed() { return depAlias.original; } });',
      'Object.defineProperty(exports, "viaShorthandGetter", { enumerable: true, get() { return depAlias.original; } });',
      'Object.defineProperty(exports, "viaArrowBlockGetter", { enumerable: true, get: () => { return depAlias.hidden; } });',
      '__exportStar(require(target), exports);',
      '__createBinding(exports, require(target), "dynamic");',
      'tslib_1.__createBinding(exports, require(target), "dynamic");',
      ''
    ].join('\n'),
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/dep2.cjs',
    sourceText: [
      'const extra = 1;',
      'exports.extra = extra;',
      ''
    ].join('\n'),
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/dep.cjs',
    sourceText: [
      'const thing = 1;',
      'const other = 2;',
      'const defaultThing = 3;',
      'exports.thing = thing;',
      'exports.other = other;',
      'exports.default = defaultThing;',
      ''
    ].join('\n'),
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/named.cjs',
    sourceText: [
      'const original = 1;',
      'const hidden = 2;',
      'exports.original = original;',
      'exports.hidden = hidden;',
      ''
    ].join('\n'),
    metadata: { semanticImportExpected: true }
  }]
});

const lightweightGraph = lightweightProject.projectSymbolGraph;
assertEdge(lightweightGraph.importEdges, {
  sourcePath: 'src/index.cjs',
  moduleSpecifier: './dep.cjs',
  importKind: 'reexport',
  exportStar: true,
  resolvedModulePath: 'src/dep.cjs'
});
assertEdge(lightweightGraph.exportEdges, {
  sourcePath: 'src/index.cjs',
  moduleSpecifier: './dep.cjs',
  exportKind: 'export-star',
  exportStar: true,
  isReExport: true
});
assertEdge(lightweightGraph.exportEdges, {
  sourcePath: 'src/index.cjs',
  moduleSpecifier: './dep2.cjs',
  exportKind: 'export-star',
  exportStar: true,
  isReExport: true
});
assertEdge(lightweightGraph.importEdges, {
  sourcePath: 'src/index.cjs',
  moduleSpecifier: './named.cjs',
  importedName: 'original',
  exportedName: 'renamedOriginal',
  resolvedTargetSymbolId: 'symbol:javascript:export:original'
});
assertEdge(lightweightGraph.exportEdges, {
  sourcePath: 'src/index.cjs',
  moduleSpecifier: './named.cjs',
  exportedName: 'renamedOriginal',
  importedName: 'original',
  exportKind: 'named',
  isReExport: true
});
assertEdge(lightweightGraph.reExportIdentities, {
  importedName: 'original',
  exportedName: 'renamedOriginal',
  originSymbolId: 'symbol:javascript:export:original'
});
assertEdge(lightweightGraph.reExportIdentities, {
  importedName: 'hidden',
  exportedName: 'hidden',
  originSymbolId: 'symbol:javascript:export:hidden'
});
assertEdge(lightweightGraph.reExportIdentities, {
  importedName: 'hidden',
  exportedName: 'renamedHidden',
  originSymbolId: 'symbol:javascript:export:hidden'
});
assertEdge(lightweightGraph.reExportIdentities, {
  importedName: 'hidden',
  exportedName: 'viaGetter',
  moduleSpecifier: './named.cjs',
  originSymbolId: 'symbol:javascript:export:hidden'
});
assertEdge(lightweightGraph.reExportIdentities, {
  importedName: 'original',
  exportedName: 'viaNamedFunctionGetter',
  moduleSpecifier: './named.cjs',
  originSymbolId: 'symbol:javascript:export:original'
});
assertEdge(lightweightGraph.reExportIdentities, {
  importedName: 'original',
  exportedName: 'viaShorthandGetter',
  moduleSpecifier: './named.cjs',
  originSymbolId: 'symbol:javascript:export:original'
});
assertEdge(lightweightGraph.reExportIdentities, {
  importedName: 'hidden',
  exportedName: 'viaArrowBlockGetter',
  moduleSpecifier: './named.cjs',
  originSymbolId: 'symbol:javascript:export:hidden'
});
assert.deepEqual(lightweightGraph.reExportIdentities.map((identity) => identity.exportedName).sort(), ['extra', 'hidden', 'other', 'renamedHidden', 'renamedOriginal', 'thing', 'viaArrowBlockGetter', 'viaGetter', 'viaNamedFunctionGetter', 'viaShorthandGetter']);
assert.equal(lightweightGraph.importEdges.some((edge) => edge.moduleSpecifier === './dynamic.cjs'), false);

const adapterResult = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath: 'src/index.cjs',
  sourceText: '__exportStar(require("./dep.cjs"), exports);\ntslib_1.__exportStar(require("./dep2.cjs"), exports);\n__exportStar(require(`./template.cjs`), exports);\n__createBinding(exports, require("./named.cjs"), "original", "renamedOriginal");\n__createBinding(module.exports, require("./named.cjs"), "hidden");\ntslib_1.__createBinding(exports, require("./named.cjs"), "hidden", "renamedHidden");\n__createBinding(exports, require(`./named.cjs`), "original", "templateRenamedOriginal");\n__exportStar(require(target), exports);\n__createBinding(exports, require(target), "dynamic");\ntslib_1.__createBinding(exports, require(target), "dynamic");\n',
  adapterOptions: {
    ast: program([
      exprStmt(call(id('__exportStar'), [call(id('require'), [lit('./dep.cjs')]), id('exports')])),
      exprStmt(call(member(id('tslib_1'), id('__exportStar')), [call(id('require'), [lit('./dep2.cjs')]), id('exports')])),
      exprStmt(call(id('__exportStar'), [call(id('require'), [template('./template.cjs')]), id('exports')])),
      exprStmt(call(id('__createBinding'), [id('exports'), call(id('require'), [lit('./named.cjs')]), lit('original'), lit('renamedOriginal')])),
      exprStmt(call(id('__createBinding'), [member(id('module'), id('exports')), call(id('require'), [lit('./named.cjs')]), lit('hidden')])),
      exprStmt(call(member(id('tslib_1'), id('__createBinding')), [id('exports'), call(id('require'), [lit('./named.cjs')]), lit('hidden'), lit('renamedHidden')])),
      exprStmt(call(id('__createBinding'), [id('exports'), call(id('require'), [template('./named.cjs')]), lit('original'), lit('templateRenamedOriginal')])),
      exprStmt(call(id('__exportStar'), [call(id('require'), [id('target')]), id('exports')])),
      exprStmt(call(id('__createBinding'), [id('exports'), call(id('require'), [id('target')]), lit('dynamic')])),
      exprStmt(call(member(id('tslib_1'), id('__createBinding')), [id('exports'), call(id('require'), [id('target')]), lit('dynamic')]))
    ])
  }
});

const adapterEdges = moduleEdges(adapterResult);
const adapterImportEdges = adapterEdges.filter((edge) => edge.role === 'import');
const adapterExportEdges = adapterEdges.filter((edge) => edge.role === 'export');
for (const expected of [
  { moduleSpecifier: './dep.cjs', importKind: 'reexport', exportStar: true },
  { moduleSpecifier: './template.cjs', importKind: 'reexport', exportStar: true },
  { moduleSpecifier: './named.cjs', importedName: 'original', exportedName: 'renamedOriginal', importKind: 'reexport' }
]) assertEdge(adapterImportEdges, expected);
for (const expected of [
  { moduleSpecifier: './dep.cjs', exportKind: 'export-star', exportStar: true, isReExport: true },
  { moduleSpecifier: './dep2.cjs', exportKind: 'export-star', exportStar: true, isReExport: true },
  { moduleSpecifier: './template.cjs', exportKind: 'export-star', exportStar: true, isReExport: true },
  { moduleSpecifier: './named.cjs', importedName: 'original', exportedName: 'renamedOriginal', exportKind: 'named', isReExport: true },
  { moduleSpecifier: './named.cjs', importedName: 'hidden', exportedName: 'hidden', exportKind: 'named', isReExport: true },
  { moduleSpecifier: './named.cjs', importedName: 'hidden', exportedName: 'renamedHidden', exportKind: 'named', isReExport: true },
  { moduleSpecifier: './named.cjs', importedName: 'original', exportedName: 'templateRenamedOriginal', exportKind: 'named', isReExport: true }
]) assertEdge(adapterExportEdges, expected);
assert.equal(adapterEdges.some((edge) => edge.moduleSpecifier === './dynamic.cjs'), false);

const astBackedProject = await importNativeProject({
  id: 'project_symbol_graph_commonjs_getter_reexport_ast',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.cjs',
    sourceText: 'const depAlias = require("./named.cjs");\nObject.defineProperty(exports, "viaGetter", { enumerable: true, get: function () { return depAlias.hidden; } });\nObject.defineProperty(exports, "viaAstNamedFunction", { enumerable: true, get: function getViaAstNamed() { return depAlias.original; } });\nObject.defineProperty(exports, "viaAstShorthand", { enumerable: true, get() { return depAlias.original; } });\nObject.defineProperty(exports, "viaAstArrowBlock", { enumerable: true, get: () => { return depAlias.hidden; } });\n',
    adapter: createEstreeNativeImporterAdapter(),
    adapterOptions: {
      ast: program([
        varDecl([varDeclarator(id('depAlias'), call(id('require'), [lit('./named.cjs')]))]),
        exprStmt(call(member(id('Object'), id('defineProperty')), [
          id('exports'),
          lit('viaGetter'),
          obj([
            prop(id('enumerable'), lit(true)),
            prop(id('get'), fnReturn(member(id('depAlias'), id('hidden'))))
          ])
        ])),
        exprStmt(call(member(id('Object'), id('defineProperty')), [
          id('exports'),
          lit('viaAstNamedFunction'),
          obj([
            prop(id('enumerable'), lit(true)),
            prop(id('get'), namedFnReturn('getViaAstNamed', member(id('depAlias'), id('original'))))
          ])
        ])),
        exprStmt(call(member(id('Object'), id('defineProperty')), [
          id('exports'),
          lit('viaAstShorthand'),
          obj([
            prop(id('enumerable'), lit(true)),
            getterProp(id('get'), fnReturn(member(id('depAlias'), id('original'))))
          ])
        ])),
        exprStmt(call(member(id('Object'), id('defineProperty')), [
          id('exports'),
          lit('viaAstArrowBlock'),
          obj([
            prop(id('enumerable'), lit(true)),
            prop(id('get'), arrowBlockReturn(member(id('depAlias'), id('hidden'))))
          ])
        ]))
      ])
    },
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/named.cjs',
    sourceText: [
      'const original = 1;',
      'const hidden = 2;',
      'exports.original = original;',
      'exports.hidden = hidden;',
      ''
    ].join('\n'),
    metadata: { semanticImportExpected: true }
  }]
});
assertEdge(astBackedProject.projectSymbolGraph.reExportIdentities, {
  importedName: 'hidden',
  exportedName: 'viaGetter',
  moduleSpecifier: './named.cjs',
  originSymbolId: 'symbol:javascript:export:hidden'
});
assertEdge(astBackedProject.projectSymbolGraph.reExportIdentities, {
  importedName: 'original',
  exportedName: 'viaAstNamedFunction',
  moduleSpecifier: './named.cjs',
  originSymbolId: 'symbol:javascript:export:original'
});
assertEdge(astBackedProject.projectSymbolGraph.reExportIdentities, {
  importedName: 'original',
  exportedName: 'viaAstShorthand',
  moduleSpecifier: './named.cjs',
  originSymbolId: 'symbol:javascript:export:original'
});
assertEdge(astBackedProject.projectSymbolGraph.reExportIdentities, {
  importedName: 'hidden',
  exportedName: 'viaAstArrowBlock',
  moduleSpecifier: './named.cjs',
  originSymbolId: 'symbol:javascript:export:hidden'
});

function moduleEdges(importResult) {
  return importResult.semanticIndex.facts.filter((fact) => fact.predicate === 'moduleEdge').map((fact) => fact.value);
}

function assertEdge(edges, expected) {
  const edge = edges.find((candidate) => Object.entries(expected).every(([key, value]) => candidate[key] === value));
  assert.equal(Boolean(edge), true, `missing edge ${JSON.stringify(expected)}`);
}

function program(body) { return { type: 'Program', sourceType: 'script', body }; }
function exprStmt(expression) { return { type: 'ExpressionStatement', expression }; }
function varDecl(declarations) { return { type: 'VariableDeclaration', kind: 'const', declarations }; }
function varDeclarator(idNode, init) { return { type: 'VariableDeclarator', id: idNode, init }; }
function call(callee, args = []) { return { type: 'CallExpression', callee, arguments: args }; }
function member(object, property) { return { type: 'MemberExpression', object, property }; }
function obj(properties) { return { type: 'ObjectExpression', properties }; }
function prop(key, value) { return { type: 'Property', key, value, computed: false, shorthand: false, kind: 'init' }; }
function getterProp(key, value) { return { type: 'Property', key, value, computed: false, shorthand: false, kind: 'get' }; }
function fnReturn(argument) { return { type: 'FunctionExpression', params: [], body: { type: 'BlockStatement', body: [{ type: 'ReturnStatement', argument }] } }; }
function namedFnReturn(name, argument) { return { type: 'FunctionExpression', id: id(name), params: [], body: { type: 'BlockStatement', body: [{ type: 'ReturnStatement', argument }] } }; }
function arrowBlockReturn(argument) { return { type: 'ArrowFunctionExpression', params: [], body: { type: 'BlockStatement', body: [{ type: 'ReturnStatement', argument }] } }; }
function id(name) { return { type: 'Identifier', name }; }
function lit(value) { return { type: 'Literal', value }; }
function template(value) { return { type: 'TemplateLiteral', expressions: [], quasis: [{ type: 'TemplateElement', value: { cooked: value, raw: value } }] }; }
