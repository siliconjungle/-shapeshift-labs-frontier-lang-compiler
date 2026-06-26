import { assert } from './helpers.mjs';
import {
  createEstreeNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const markerProject = await importNativeProject({
  id: 'project_symbol_graph_commonjs_esmodule_marker_not_export',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/legacy.cjs',
    sourceText: 'const named = 1;\nexports.__esModule = true;\nexports.named = named;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const markerGraph = markerProject.projectSymbolGraph;
assert.equal(hasExport(markerProject.semanticIndex.symbols, '__esModule'), false);
assert.equal(markerGraph.exportEdges.some((edge) => edge.exportedName === '__esModule'), false);
assert.equal(hasExport(markerProject.semanticIndex.symbols, 'named'), true);
assert.equal(exportSymbol(markerProject.semanticIndex.symbols, 'named')?.metadata.commonJs, true);

const adapter = createEstreeNativeImporterAdapter();
const adapterResult = await runNativeImporterAdapter(adapter, {
  sourcePath: 'src/adapter-legacy.cjs',
  sourceText: 'const named = 1;\nexports.__esModule = true;\nexports.named = named;\n',
  adapterOptions: {
    ast: program([
      varDecl([varDeclarator(id('named'), lit(1))]),
      exprStmt(assign(member(id('exports'), id('__esModule')), lit(true))),
      exprStmt(assign(member(id('exports'), id('named')), id('named')))
    ])
  }
});
const exportEdges = moduleEdges(adapterResult).filter((edge) => edge.role === 'export');
assert.equal(exportEdges.some((edge) => edge.exportedName === '__esModule'), false);
assert.equal(exportEdges.some((edge) => edge.exportedName === 'named'), true);

function hasExport(symbols, name) {
  return Boolean(exportSymbol(symbols, name));
}

function exportSymbol(symbols, name) {
  return symbols.find((symbol) => symbol.kind === 'export' && symbol.name === name);
}

function moduleEdges(importResult) {
  return importResult.semanticIndex.facts.filter((fact) => fact.predicate === 'moduleEdge').map((fact) => fact.value);
}

function program(body) { return { type: 'Program', sourceType: 'script', body }; }
function varDecl(declarations) { return { type: 'VariableDeclaration', declarations }; }
function varDeclarator(idNode, init) { return { type: 'VariableDeclarator', id: idNode, init }; }
function exprStmt(expression) { return { type: 'ExpressionStatement', expression }; }
function member(object, property) { return { type: 'MemberExpression', object, property, computed: false }; }
function assign(left, right) { return { type: 'AssignmentExpression', operator: '=', left, right }; }
function id(name) { return { type: 'Identifier', name }; }
function lit(value) { return { type: 'Literal', value }; }
