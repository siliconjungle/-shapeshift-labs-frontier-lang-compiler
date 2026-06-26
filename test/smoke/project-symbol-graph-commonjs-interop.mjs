import { assert } from './helpers.mjs';
import {
  createEstreeNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';

const commonJsDefaultInteropProject = await importNativeProject({
  id: 'project_symbol_graph_commonjs_default_interop',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.js',
    sourceText: "import legacy from './legacy.cjs';\nimport missing from './missing.cjs';\nconst defaultHelper = __importDefault(require('./legacy.cjs'));\nconst namespaceHelper = __importStar(require('./legacy.cjs'));\nconst tslibDefault = tslib_1.__importDefault(require('./legacy.cjs'));\nconst tslibNamespace = tslib_1.__importStar(require('./legacy.cjs'));\nconst target = './dynamic.cjs';\nconst dynamicHelper = __importDefault(require(target));\nconst tslibDynamic = tslib_1.__importDefault(require(target));\nexport const used = legacy;\nexport const blocked = missing;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/legacy.cjs',
    sourceText: 'const runtime = {};\nmodule.exports = runtime;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/missing.cjs',
    sourceText: 'const runtime = {};\n',
    metadata: { semanticImportExpected: true }
  }]
});
const interopEdge = commonJsDefaultInteropProject.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === './legacy.cjs' && edge.importedName === 'default');
assert.equal(interopEdge.resolvedModulePath, 'src/legacy.cjs');
assert.equal(interopEdge.resolutionKind, 'relative-source');
assert.equal(interopEdge.resolvedTargetSymbolId, 'symbol:javascript:export:module_exports');
assert.equal(JSON.parse(JSON.stringify(interopEdge)).resolvedTargetSymbolId, 'symbol:javascript:export:module_exports');
const defaultHelperEdge = commonJsDefaultInteropProject.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === './legacy.cjs' && edge.localName === 'defaultHelper');
assert.equal(defaultHelperEdge.importedName, 'default');
assert.equal(defaultHelperEdge.importKind, 'default');
assert.equal(defaultHelperEdge.commonJs, true);
assert.equal(defaultHelperEdge.interopHelper, '__importDefault');
assert.equal(defaultHelperEdge.resolvedTargetSymbolId, 'symbol:javascript:export:module_exports');
const namespaceHelperEdge = commonJsDefaultInteropProject.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === './legacy.cjs' && edge.localName === 'namespaceHelper');
assert.equal(namespaceHelperEdge.importedName, '*');
assert.equal(namespaceHelperEdge.importKind, 'namespace');
assert.equal(namespaceHelperEdge.namespace, 'namespaceHelper');
assert.equal(namespaceHelperEdge.commonJs, true);
assert.equal(namespaceHelperEdge.interopHelper, '__importStar');
const tslibDefaultEdge = commonJsDefaultInteropProject.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === './legacy.cjs' && edge.localName === 'tslibDefault');
assert.equal(tslibDefaultEdge.importedName, 'default');
assert.equal(tslibDefaultEdge.importKind, 'default');
assert.equal(tslibDefaultEdge.interopHelper, '__importDefault');
assert.equal(tslibDefaultEdge.resolvedTargetSymbolId, 'symbol:javascript:export:module_exports');
const tslibNamespaceEdge = commonJsDefaultInteropProject.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === './legacy.cjs' && edge.localName === 'tslibNamespace');
assert.equal(tslibNamespaceEdge.importedName, '*');
assert.equal(tslibNamespaceEdge.importKind, 'namespace');
assert.equal(tslibNamespaceEdge.namespace, 'tslibNamespace');
assert.equal(tslibNamespaceEdge.interopHelper, '__importStar');
assert.equal(commonJsDefaultInteropProject.projectSymbolGraph.importEdges.some((edge) => edge.moduleSpecifier === './dynamic.cjs'), false);
const missingEdge = commonJsDefaultInteropProject.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === './missing.cjs' && edge.importedName === 'default');
assert.equal(missingEdge.resolvedModulePath, 'src/missing.cjs');
assert.equal(missingEdge.resolutionKind, 'relative-source');
assert.equal(missingEdge.resolvedTargetSymbolId, undefined);

const adapterResult = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath: 'src/helpers.cjs',
  sourceText: "const defaultHelper = __importDefault(require('./legacy.cjs'));\nconst namespaceHelper = __importStar(require('./legacy.cjs'));\nconst tslibDefault = tslib_1.__importDefault(require('./legacy.cjs'));\nconst tslibNamespace = tslib_1.__importStar(require('./legacy.cjs'));\nconst dynamicHelper = __importDefault(require(target));\nconst tslibDynamic = tslib_1.__importDefault(require(target));\n",
  adapterOptions: {
    ast: program([
      varDecl([varDeclarator(id('defaultHelper'), call(id('__importDefault'), [call(id('require'), [lit('./legacy.cjs')])]))]),
      varDecl([varDeclarator(id('namespaceHelper'), call(id('__importStar'), [call(id('require'), [lit('./legacy.cjs')])]))]),
      varDecl([varDeclarator(id('tslibDefault'), call(member(id('tslib_1'), id('__importDefault')), [call(id('require'), [lit('./legacy.cjs')])]))]),
      varDecl([varDeclarator(id('tslibNamespace'), call(member(id('tslib_1'), id('__importStar')), [call(id('require'), [lit('./legacy.cjs')])]))]),
      varDecl([varDeclarator(id('dynamicHelper'), call(id('__importDefault'), [call(id('require'), [id('target')])]))]),
      varDecl([varDeclarator(id('tslibDynamic'), call(member(id('tslib_1'), id('__importDefault')), [call(id('require'), [id('target')])]))])
    ])
  }
});
const adapterEdges = moduleEdges(adapterResult).filter((edge) => edge.role === 'import');
assertEdge(adapterEdges, { moduleSpecifier: './legacy.cjs', localName: 'defaultHelper', importedName: 'default', importKind: 'default' });
assertEdge(adapterEdges, { moduleSpecifier: './legacy.cjs', localName: 'namespaceHelper', importedName: '*', importKind: 'namespace', namespace: 'namespaceHelper' });
assertEdge(adapterEdges, { moduleSpecifier: './legacy.cjs', localName: 'tslibDefault', importedName: 'default', importKind: 'default' });
assertEdge(adapterEdges, { moduleSpecifier: './legacy.cjs', localName: 'tslibNamespace', importedName: '*', importKind: 'namespace', namespace: 'tslibNamespace' });
assert.equal(adapterEdges.some((edge) => edge.moduleSpecifier === './dynamic.cjs'), false);

const baseFiles = {
  'src/consumer.js': 'export const stable = 1;\n',
  'src/legacy.cjs': 'const runtime = {};\n'
};
const workerFiles = {
  ...baseFiles,
  'src/consumer.js': "import legacy from './legacy.cjs';\nexport const stable = 1;\nexport const used = legacy;\n"
};
const headFiles = {
  ...baseFiles,
  'src/legacy.cjs': 'const runtime = {};\nmodule.exports = runtime;\n'
};
const stages = {
  base: await projectGraphStage('commonjs_default_interop_base', baseFiles),
  worker: await projectGraphStage('commonjs_default_interop_worker', workerFiles),
  head: await projectGraphStage('commonjs_default_interop_head', headFiles),
  output: await projectGraphStage('commonjs_default_interop_output', {
    ...headFiles,
    ...workerFiles,
    'src/legacy.cjs': headFiles['src/legacy.cjs']
  })
};
const conflicts = projectGraphDeltaConflicts({ stages });
const targetConflict = conflicts.find((conflict) => conflict.code === 'project-import-target-delta-conflict');
const aliasConflict = conflicts.find((conflict) => conflict.code === 'project-public-scope-use-def-ambiguous-evidence');
const aliasReferenceConflict = conflicts.find((conflict) => conflict.code === 'project-public-scope-reference-ambiguous-evidence');
const workerEdge = stages.worker.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === './legacy.cjs' && edge.importedName === 'default');
const outputEdge = stages.output.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === './legacy.cjs' && edge.importedName === 'default');
assert.equal(conflicts.length, 3);
assert.equal(aliasConflict.details.reasonCodes.includes('lexical-scope-import-alias-target-unresolved'), true);
assert.equal(aliasReferenceConflict.details.reasonCodes.includes('lexical-scope-import-alias-target-unresolved'), true);
assert.equal(workerEdge.resolvedTargetSymbolId, undefined);
assert.equal(outputEdge.resolvedTargetSymbolId, 'symbol:javascript:export:module_exports');
assert.equal(targetConflict.details.outputTargetSymbolId, 'symbol:javascript:export:module_exports');
assert.equal(targetConflict.details.workerTargetSymbolId, undefined);
assert.equal(targetConflict.details.routeId, 'prove-commonjs-runtime-interop-equivalence');
assert.equal(targetConflict.details.reasonCodes.includes('commonjs-runtime-interop-proof-missing'), true);

async function projectGraphStage(id, files) {
  const projectImport = await importNativeProject({
    id,
    projectRoot: 'src',
    sources: Object.entries(files).map(([sourcePath, sourceText]) => ({
      language: 'javascript',
      sourcePath,
      sourceText,
      metadata: { semanticImportExpected: true }
    }))
  });
  return { projectImport, projectSymbolGraph: projectImport.projectSymbolGraph };
}

function moduleEdges(importResult) {
  return importResult.semanticIndex.facts.filter((fact) => fact.predicate === 'moduleEdge').map((fact) => fact.value);
}

function assertEdge(edges, expected) {
  const edge = edges.find((candidate) => Object.entries(expected).every(([key, value]) => candidate[key] === value));
  assert.equal(Boolean(edge), true, `missing edge ${JSON.stringify(expected)}`);
}

function program(body) { return { type: 'Program', sourceType: 'script', body }; }
function varDecl(declarations) { return { type: 'VariableDeclaration', kind: 'const', declarations }; }
function varDeclarator(idNode, init) { return { type: 'VariableDeclarator', id: idNode, init }; }
function call(callee, args = []) { return { type: 'CallExpression', callee, arguments: args }; }
function member(object, property) { return { type: 'MemberExpression', object, property }; }
function id(name) { return { type: 'Identifier', name }; }
function lit(value) { return { type: 'Literal', value }; }
