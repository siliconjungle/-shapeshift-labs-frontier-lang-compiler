import { assert } from './helpers.mjs';
import {
  createEstreeNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const lightweightProject = await importNativeProject({
  id: 'project_symbol_graph_commonjs_computed_literal_exports',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/consumer.js',
    sourceText: "import runtime, { objectName, shorthand, other, assignedName, assignedLiteral, definedValue, definedGetter, definedManyValue, definedManyGetter } from './legacy.cjs';\nexport const used = runtime || objectName || shorthand || other || assignedName || assignedLiteral || definedValue || definedGetter || definedManyValue || definedManyGetter;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/legacy.cjs',
    sourceText: [
      'const runtime = {};',
      'const named = 1;',
      'const pick = "dynamic";',
      'exports["default"] = runtime;',
      "module.exports['named-value'] = named;",
      'module.exports = { objectName: named, shorthand: other, other, "literal-key": runtime, "__esModule": true, [pick]: named };',
      'Object.assign(exports, { assignedName: named, assignedLiteral: runtime, "__esModule": true, [pick]: named });',
      'Object.defineProperty(exports, "definedValue", { enumerable: true, value: named });',
      'Object.defineProperty(module.exports, "definedGetter", { enumerable: true, get: () => runtime });',
      'Object.defineProperties(exports, { definedManyValue: { enumerable: true, value: named }, definedManyGetter: { enumerable: true, get: () => runtime }, "__esModule": { value: true }, [pick]: { value: named } });',
      'Object.defineProperty(exports, "__esModule", { value: true });',
      'exports["__esModule"] = true;',
      'exports[pick] = named;',
      ''
    ].join('\n'),
    metadata: { semanticImportExpected: true }
  }]
});
const lightweightGraph = lightweightProject.projectSymbolGraph;
const lightweightExportEdges = lightweightGraph.exportEdges.filter((edge) => edge.sourcePath === 'src/legacy.cjs');
assertEdge(lightweightExportEdges, { exportedName: 'default', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'named-value', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'objectName', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'shorthand', localName: 'other', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'other', localName: 'other', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'literal-key', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'assignedName', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'assignedLiteral', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'definedValue', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'definedGetter', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'definedManyValue', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(lightweightExportEdges, { exportedName: 'definedManyGetter', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assert.equal(lightweightExportEdges.some((edge) => edge.exportedName === '__esModule'), false);
assert.equal(lightweightExportEdges.some((edge) => edge.exportedName === 'pick'), false);
const defaultImportEdge = lightweightGraph.importEdges
  .find((edge) => edge.sourcePath === 'src/consumer.js' && edge.moduleSpecifier === './legacy.cjs' && edge.importedName === 'default');
assert.equal(defaultImportEdge.resolvedTargetSymbolId, 'symbol:javascript:export:default');
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'objectName', resolvedTargetSymbolId: 'symbol:javascript:export:objectname' });
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'shorthand', resolvedTargetSymbolId: 'symbol:javascript:export:shorthand' });
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'other', resolvedTargetSymbolId: 'symbol:javascript:export:other' });
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'assignedName', resolvedTargetSymbolId: 'symbol:javascript:export:assignedname' });
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'assignedLiteral', resolvedTargetSymbolId: 'symbol:javascript:export:assignedliteral' });
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'definedValue', resolvedTargetSymbolId: 'symbol:javascript:export:definedvalue' });
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'definedGetter', resolvedTargetSymbolId: 'symbol:javascript:export:definedgetter' });
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'definedManyValue', resolvedTargetSymbolId: 'symbol:javascript:export:definedmanyvalue' });
assertEdge(lightweightGraph.importEdges, { sourcePath: 'src/consumer.js', importedName: 'definedManyGetter', resolvedTargetSymbolId: 'symbol:javascript:export:definedmanygetter' });

const adapterResult = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath: 'src/adapter-legacy.cjs',
  sourceText: 'const runtime = {}; const named = 1; const other = 2; const dep = require(`./template.cjs`); exports["default"] = runtime; module.exports["named-value"] = named; exports[`template-name`] = named; exports[`dynamic-${name}`] = named; module.exports = { objectName: named, shorthand: other, other, "literal-key": runtime, "__esModule": true, [pick]: named }; Object.assign(module.exports, { assignedName: named, assignedLiteral: runtime, "__esModule": true, [pick]: named }); Object.defineProperty(exports, "definedValue", { enumerable: true, value: named }); Object.defineProperty(exports, `templateDefined`, { enumerable: true, value: named }); Object.defineProperty(module.exports, "definedGetter", { enumerable: true, get: () => runtime }); Object.defineProperties(exports, { definedManyValue: { enumerable: true, value: named }, definedManyGetter: { enumerable: true, get: () => runtime }, [`templateMany`]: { value: named }, "__esModule": { value: true }, [pick]: { value: named } }); exports[pick] = named;\n',
  adapterOptions: {
    ast: program([
      varDecl([varDeclarator(id('runtime'), objectExpr()), varDeclarator(id('named'), lit(1)), varDeclarator(id('dep'), call(id('require'), [template('./template.cjs')]))]),
      exprStmt(assign(member(id('exports'), lit('default'), { computed: true }), id('runtime'))),
      exprStmt(assign(member(member(id('module'), id('exports')), lit('named-value'), { computed: true }), id('named'))),
      exprStmt(assign(member(id('exports'), template('template-name'), { computed: true }), id('named'))),
      exprStmt(assign(member(id('exports'), templateExpr('dynamic-', id('name')), { computed: true }), id('named'))),
      exprStmt(assign(member(id('module'), id('exports')), objectExpr([
        prop(id('objectName'), id('named')),
        prop(id('shorthand'), id('other')),
        prop(id('other'), id('other'), { shorthand: true }),
        prop(lit('literal-key'), id('runtime')),
        prop(lit('__esModule'), lit(true)),
        prop(id('pick'), id('named'), { computed: true })
      ]))),
      exprStmt(call(member(id('Object'), id('assign')), [member(id('module'), id('exports')), objectExpr([
        prop(id('assignedName'), id('named')),
        prop(id('assignedLiteral'), id('runtime')),
        prop(lit('__esModule'), lit(true)),
        prop(id('pick'), id('named'), { computed: true })
      ])])),
      exprStmt(call(member(id('Object'), id('defineProperty')), [id('exports'), lit('definedValue'), objectExpr([
        prop(id('enumerable'), lit(true)),
        prop(id('value'), id('named'))
      ])])),
      exprStmt(call(member(id('Object'), id('defineProperty')), [id('exports'), template('templateDefined'), objectExpr([
        prop(id('enumerable'), lit(true)),
        prop(id('value'), id('named'))
      ])])),
      exprStmt(call(member(id('Object'), id('defineProperty')), [member(id('module'), id('exports')), lit('definedGetter'), objectExpr([
        prop(id('enumerable'), lit(true)),
        prop(id('get'), arrow(id('runtime')))
      ])])),
      exprStmt(call(member(id('Object'), id('defineProperties')), [id('exports'), objectExpr([
        prop(id('definedManyValue'), objectExpr([
          prop(id('enumerable'), lit(true)),
          prop(id('value'), id('named'))
        ])),
        prop(id('definedManyGetter'), objectExpr([
          prop(id('enumerable'), lit(true)),
          prop(id('get'), arrow(id('runtime')))
        ])),
        prop(template('templateMany'), objectExpr([prop(id('value'), id('named'))]), { computed: true }),
        prop(lit('__esModule'), objectExpr([prop(id('value'), lit(true))])),
        prop(id('pick'), objectExpr([prop(id('value'), id('named'))]), { computed: true })
      ])])),
      exprStmt(assign(member(id('exports'), id('pick'), { computed: true }), id('named')))
    ])
  }
});
const adapterImportEdges = moduleEdges(adapterResult).filter((edge) => edge.role === 'import');
const adapterExportEdges = moduleEdges(adapterResult).filter((edge) => edge.role === 'export');
assertEdge(adapterImportEdges, { moduleSpecifier: './template.cjs', localName: 'dep', importedName: 'default', importKind: 'commonjs-require' });
assertEdge(adapterExportEdges, { exportedName: 'default', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'named-value', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'template-name', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'objectName', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'shorthand', localName: 'other', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'other', localName: 'other', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'literal-key', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'assignedName', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'assignedLiteral', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'definedValue', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'templateDefined', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'definedGetter', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'definedManyValue', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'definedManyGetter', localName: 'runtime', exportKind: 'commonjs-named', publicContract: true });
assertEdge(adapterExportEdges, { exportedName: 'templateMany', localName: 'named', exportKind: 'commonjs-named', publicContract: true });
assert.equal(adapterExportEdges.some((edge) => String(edge.exportedName).startsWith('dynamic-')), false);
assert.equal(adapterExportEdges.some((edge) => edge.exportedName === 'pick'), false);

function moduleEdges(importResult) {
  return importResult.semanticIndex.facts.filter((fact) => fact.predicate === 'moduleEdge').map((fact) => fact.value);
}

function assertEdge(edges, expected) {
  const edge = edges.find((candidate) => Object.entries(expected).every(([key, value]) => candidate[key] === value));
  assert.equal(Boolean(edge), true, `missing edge ${JSON.stringify(expected)}`);
}

function program(body) { return { type: 'Program', sourceType: 'script', body }; }
function varDecl(declarations) { return { type: 'VariableDeclaration', declarations }; }
function varDeclarator(idNode, init) { return { type: 'VariableDeclarator', id: idNode, init }; }
function exprStmt(expression) { return { type: 'ExpressionStatement', expression }; }
function assign(left, right) { return { type: 'AssignmentExpression', operator: '=', left, right }; }
function call(callee, args = []) { return { type: 'CallExpression', callee, arguments: args }; }
function arrow(body) { return { type: 'ArrowFunctionExpression', body }; }
function member(object, property, options = {}) { return { type: 'MemberExpression', object, property, computed: Boolean(options.computed) }; }
function objectExpr(properties = []) { return { type: 'ObjectExpression', properties }; }
function prop(key, value, options = {}) { return { type: 'Property', key, value, computed: Boolean(options.computed), shorthand: Boolean(options.shorthand) }; }
function id(name) { return { type: 'Identifier', name }; }
function lit(value) { return { type: 'Literal', value }; }
function template(value) { return { type: 'TemplateLiteral', expressions: [], quasis: [{ type: 'TemplateElement', value: { cooked: value, raw: value } }] }; }
function templateExpr(prefix, expression) { return { type: 'TemplateLiteral', expressions: [expression], quasis: [{ type: 'TemplateElement', value: { cooked: prefix, raw: prefix } }, { type: 'TemplateElement', value: { cooked: '', raw: '' } }] }; }
