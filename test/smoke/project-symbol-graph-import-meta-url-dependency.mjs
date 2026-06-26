import { assert } from './helpers.mjs';
import {
  createEstreeNativeImporterAdapter,
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const project = await importNativeProject({
  id: 'project_symbol_graph_import_meta_url_dependency',
  projectRoot: 'src',
  adapters: [createTypeScriptCompilerNativeImporterAdapter({ typescript })],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "const name = 'worker';\nexport const workerUrl = new URL('./worker.ts', import.meta.url);\nconst templateWorkerUrl = new URL(`./template-worker.ts`, import.meta.url);\nconst dynamicWorkerUrl = new URL(`./${name}.ts`, import.meta.url);\nconst resolvedUrl = import.meta.resolve('./resolved.ts');\nconst requireUrl = require.resolve('./required.ts');\nnew Worker(new URL('./job.ts', import.meta.url), { type: 'module' });\nnew Worker('./direct-worker.ts', { type: 'module' });\nnew Worker(`./template-direct-worker.ts`, { type: 'module' });\nnew Worker(`./direct-${name}.ts`, { type: 'module' });\nnew SharedWorker('./shared-worker.ts');\nnavigator.serviceWorker.register('./sw.ts');\nCSS.paintWorklet.addModule('./paint.ts');\nimportScripts('./legacy.ts', './legacy-extra.ts', `./template-legacy.ts`, `./legacy-${name}.ts`);\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/worker.ts',
    sourceText: 'export const worker = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/template-worker.ts',
    sourceText: 'export const templateWorker = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/job.ts',
    sourceText: 'export const job = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/resolved.ts',
    sourceText: 'export const resolved = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/required.ts',
    sourceText: 'export const required = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/direct-worker.ts',
    sourceText: 'export const direct = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/template-direct-worker.ts',
    sourceText: 'export const templateDirect = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/shared-worker.ts',
    sourceText: 'export const shared = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/sw.ts',
    sourceText: 'export const serviceWorker = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/paint.ts',
    sourceText: 'export const paint = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/legacy.ts',
    sourceText: 'export const legacy = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/legacy-extra.ts',
    sourceText: 'export const legacyExtra = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/template-legacy.ts',
    sourceText: 'export const templateLegacy = true;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const workerEdge = hostEdge(project.projectSymbolGraph.importEdges, './worker.ts');
assert.equal(workerEdge.importKind, 'import-meta-url');
assert.equal(workerEdge.hostDependency, true);
assert.equal(workerEdge.hostDependencyKind, 'import-meta-url');
assert.equal(workerEdge.hostDependencyBase, 'import.meta.url');
assert.equal(workerEdge.hostDependencyStaticSpecifierEvidence, true);
assert.equal(workerEdge.hostDependencyRuntimeResolutionClaim, false);
assert.equal(workerEdge.resolvedModulePath, 'src/worker.ts');
assert.equal(workerEdge.resolutionKind, 'relative-source');
assert.equal(workerEdge.hostDependencyExpressionText.includes('import.meta.url'), true);
assert.equal(typeof workerEdge.hostDependencyExpressionHash, 'string');
assert.equal(JSON.parse(JSON.stringify(workerEdge)).hostDependencyExpressionHash, workerEdge.hostDependencyExpressionHash);
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './template-worker.ts').hostDependencyKind, 'import-meta-url');

const jobEdge = hostEdge(project.projectSymbolGraph.importEdges, './job.ts');
assert.equal(jobEdge.resolvedModulePath, 'src/job.ts');
assert.equal(jobEdge.hostDependencyRuntimeResolutionClaim, false);
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './resolved.ts').hostDependencyKind, 'import-meta-resolve');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './resolved.ts').hostDependencyBase, 'import.meta');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './resolved.ts').hostDependencyRuntimeResolutionClaim, false);
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './required.ts').hostDependencyKind, 'require-resolve');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './required.ts').hostDependencyBase, 'require');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './required.ts').hostDependencyRuntimeResolutionClaim, false);
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './direct-worker.ts').hostDependencyKind, 'worker-constructor');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './template-direct-worker.ts').hostDependencyKind, 'worker-constructor');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './shared-worker.ts').hostDependencyKind, 'shared-worker-constructor');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './sw.ts').hostDependencyKind, 'service-worker-register');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './paint.ts').hostDependencyKind, 'worklet-add-module');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './legacy.ts').hostDependencyKind, 'worker-import-scripts');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './legacy-extra.ts').hostDependencyKind, 'worker-import-scripts');
assert.equal(hostEdge(project.projectSymbolGraph.importEdges, './template-legacy.ts').hostDependencyKind, 'worker-import-scripts');
assert.equal(unresolvedHostEdges(project.projectSymbolGraph.importEdges).length, 3);
for (const edge of unresolvedHostEdges(project.projectSymbolGraph.importEdges)) {
  assert.equal(edge.moduleSpecifier, '<host-dependency>');
  assert.equal(edge.resolutionKind, 'host-dependency-non-literal-missing');
  assert.equal(edge.hostDependencyStaticSpecifierEvidence, false);
  assert.equal(edge.hostDependencyRuntimeResolutionClaim, false);
  assert.equal(edge.hostDependencyResolutionProofRequired, true);
  assert.equal(typeof edge.hostDependencyExpressionHash, 'string');
}

const syntaxImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath: 'src/syntax.js',
  sourceText: "const url = new URL('./asset.png', import.meta.url);\nconst templateUrl = new URL(`./template-asset.png`, import.meta.url);\nconst dynamicUrl = new URL(`./asset-${name}.png`, import.meta.url);\nimport.meta.resolve('./syntax-resolved.js');\nimport.meta.resolve(`./syntax-template-resolved.js`);\nrequire.resolve('./syntax-required.js');\nrequire.resolve(`./syntax-template-required.js`);\nnew Worker('./syntax-worker.js');\nnew Worker(`./syntax-template-worker.js`);\nnew Worker(`./syntax-${name}.js`);\nimportScripts('./syntax-legacy.js', `./syntax-template-legacy.js`, `./syntax-legacy-${name}.js`);\n",
  adapterOptions: { ast: program([
    { type: 'VariableDeclaration', declarations: [{ type: 'VariableDeclarator', id: id('url'), init: newUrl('./asset.png') }] },
    { type: 'VariableDeclaration', declarations: [{ type: 'VariableDeclarator', id: id('templateUrl'), init: newUrl(template('./template-asset.png')) }] },
    { type: 'VariableDeclaration', declarations: [{ type: 'VariableDeclarator', id: id('dynamicUrl'), init: newUrl(templateExpr('./asset-', id('name'), '.png')) }] },
    exprStmt(call(member(meta(), 'resolve'), [lit('./syntax-resolved.js')])),
    exprStmt(call(member(meta(), 'resolve'), [template('./syntax-template-resolved.js')])),
    exprStmt(call(member(id('require'), 'resolve'), [lit('./syntax-required.js')])),
    exprStmt(call(member(id('require'), 'resolve'), [template('./syntax-template-required.js')])),
    exprStmt(newHost('Worker', './syntax-worker.js')),
    exprStmt(newHost('Worker', template('./syntax-template-worker.js'))),
    exprStmt(newHost('Worker', templateExpr('./syntax-', id('name'), '.js'))),
    exprStmt(call(id('importScripts'), [lit('./syntax-legacy.js'), template('./syntax-template-legacy.js'), templateExpr('./syntax-legacy-', id('name'), '.js')]))
  ]) }
});
const syntaxModuleEdge = syntaxImport.semanticIndex.facts.find((fact) => fact.predicate === 'moduleEdge' && fact.value?.importKind === 'import-meta-url')?.value;
assert.equal(syntaxModuleEdge.moduleSpecifier, './asset.png');
assert.equal(syntaxModuleEdge.hostDependencyKind, 'import-meta-url');
assert.equal(syntaxModuleEdge.hostDependencyRuntimeResolutionClaim, false);
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './template-asset.png')?.value.hostDependencyKind, 'import-meta-url');
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './syntax-resolved.js')?.value.hostDependencyKind, 'import-meta-resolve');
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './syntax-template-resolved.js')?.value.hostDependencyKind, 'import-meta-resolve');
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './syntax-required.js')?.value.hostDependencyKind, 'require-resolve');
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './syntax-template-required.js')?.value.hostDependencyKind, 'require-resolve');
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './syntax-worker.js')?.value.hostDependencyKind, 'worker-constructor');
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './syntax-template-worker.js')?.value.hostDependencyKind, 'worker-constructor');
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './syntax-legacy.js')?.value.hostDependencyKind, 'worker-import-scripts');
assert.equal(syntaxImport.semanticIndex.facts.find((fact) => fact.value?.moduleSpecifier === './syntax-template-legacy.js')?.value.hostDependencyKind, 'worker-import-scripts');
const syntaxUnresolvedHostEdges = syntaxImport.semanticIndex.facts
  .filter((fact) => fact.value?.moduleSpecifier === '<host-dependency>')
  .map((fact) => fact.value);
assert.equal(syntaxUnresolvedHostEdges.length, 3);
assert.equal(syntaxUnresolvedHostEdges.every((edge) => edge.hostDependencyStaticSpecifierEvidence === false), true);
assert.equal(syntaxUnresolvedHostEdges.every((edge) => edge.hostDependencyResolutionProofRequired === true), true);
assert.equal(syntaxUnresolvedHostEdges.some((edge) => edge.hostDependencyExpressionText.includes('asset-${name}')), true);

function hostEdge(edges, moduleSpecifier) {
  const edge = edges.find((item) => item.hostDependency === true && item.moduleSpecifier === moduleSpecifier);
  assert.ok(edge);
  return edge;
}

function unresolvedHostEdges(edges) {
  return edges.filter((edge) => edge.hostDependency === true && edge.moduleSpecifier === '<host-dependency>');
}

function program(body) { return { type: 'Program', body }; }
function exprStmt(expression) { return { type: 'ExpressionStatement', expression }; }
function id(name) { return { type: 'Identifier', name }; }
function lit(value) { return { type: 'Literal', value }; }
function call(callee, args) { return { type: 'CallExpression', callee, arguments: args }; }
function meta() { return { type: 'MetaProperty', meta: id('import'), property: id('meta') }; }
function member(object, property) { return { type: 'MemberExpression', object, property: id(property), computed: false }; }
function importMetaUrl() { return { type: 'MemberExpression', object: meta(), property: id('url'), computed: false }; }
function newUrl(moduleSpecifier) { return { type: 'NewExpression', callee: id('URL'), arguments: [specifier(moduleSpecifier), importMetaUrl()] }; }
function newHost(name, moduleSpecifier) { return { type: 'NewExpression', callee: id(name), arguments: [specifier(moduleSpecifier)] }; }
function specifier(value) { return typeof value === 'string' ? lit(value) : value; }
function template(value) { return { type: 'TemplateLiteral', expressions: [], quasis: [{ type: 'TemplateElement', value: { cooked: value, raw: value } }] }; }
function templateExpr(prefix, expression, suffix) { return { type: 'TemplateLiteral', expressions: [expression], quasis: [{ type: 'TemplateElement', value: { cooked: prefix, raw: prefix } }, { type: 'TemplateElement', value: { cooked: suffix, raw: suffix } }] }; }
