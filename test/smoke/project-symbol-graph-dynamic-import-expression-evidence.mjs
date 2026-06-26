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
  id: 'project_symbol_graph_dynamic_import_expression_evidence',
  projectRoot: 'src',
  adapters: [createTypeScriptCompilerNativeImporterAdapter({ typescript })],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "const locale = 'en';\nawait import(`./locales/${locale}.json`, { with: { type: 'json' } });\nconst target = resolveTarget(locale);\nawait import(target);\nawait import('./literal.js');\nawait import(`./template-static.js`);\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/literal.ts',
    sourceText: 'export const literal = true;\n',
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/template-static.ts',
    sourceText: 'export const templateStatic = true;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const templateEdge = project.projectSymbolGraph.importEdges.find((edge) => edge.importKind === 'dynamic-import' && edge.dynamicImportSpecifierKind === 'template');
assert.equal(templateEdge.moduleSpecifier, '<dynamic-import>');
assert.equal(templateEdge.resolutionKind, 'dynamic-import-non-literal-missing');
assert.equal(templateEdge.dynamicImport, true);
assert.equal(templateEdge.dynamicImportStaticSpecifierEvidence, false);
assert.equal(templateEdge.dynamicImportRuntimeResolutionClaim, false);
assert.equal(templateEdge.dynamicImportResolutionProofRequired, true);
assert.equal(templateEdge.hasImportAttributes, true);
assert.equal(templateEdge.importAttributeCount, 1);
assert.equal(templateEdge.dynamicImportExpressionText.includes('locale'), true);
assert.equal(typeof templateEdge.dynamicImportExpressionHash, 'string');
assert.equal(JSON.parse(JSON.stringify(templateEdge)).dynamicImportExpressionHash, templateEdge.dynamicImportExpressionHash);

const identifierEdge = project.projectSymbolGraph.importEdges.find((edge) => edge.importKind === 'dynamic-import' && edge.dynamicImportSpecifierKind === 'identifier');
assert.equal(identifierEdge.moduleSpecifier, '<dynamic-import>');
assert.equal(identifierEdge.dynamicImportExpressionText, 'target');
assert.equal(identifierEdge.dynamicImportResolutionProofRequired, true);

const literalEdge = project.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './literal.js' && edge.importKind === 'dynamic-import');
assert.equal(literalEdge.dynamicImportSpecifierKind, 'literal');
assert.equal(literalEdge.dynamicImportStaticSpecifierEvidence, true);
assert.equal(literalEdge.dynamicImportRuntimeResolutionClaim, false);
assert.equal(literalEdge.dynamicImportResolutionProofRequired, false);
assert.equal(literalEdge.resolvedModulePath, 'src/literal.ts');

const staticTemplateEdge = project.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './template-static.js' && edge.importKind === 'dynamic-import');
assert.equal(staticTemplateEdge.dynamicImportSpecifierKind, 'literal');
assert.equal(staticTemplateEdge.dynamicImportStaticSpecifierEvidence, true);
assert.equal(staticTemplateEdge.dynamicImportRuntimeResolutionClaim, false);
assert.equal(staticTemplateEdge.dynamicImportResolutionProofRequired, false);
assert.equal(staticTemplateEdge.resolvedModulePath, 'src/template-static.ts');
assert.equal(staticTemplateEdge.dynamicImportExpressionText.startsWith('`'), true);

const syntaxImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath: 'src/syntax.js',
  sourceText: "const target = './runtime.js';\nimport(target);\nimport(`./syntax-static.js`);\nimport(`./syntax-${target}.js`);\n",
  adapterOptions: { ast: program([
    { type: 'VariableDeclaration', declarations: [{ type: 'VariableDeclarator', id: id('target'), init: lit('./runtime.js') }] },
    exprStmt({ type: 'ImportExpression', source: id('target') }),
    exprStmt({ type: 'ImportExpression', source: template('./syntax-static.js') }),
    exprStmt({ type: 'ImportExpression', source: templateExpr('./syntax-', id('target'), '.js') })
  ]) }
});
const syntaxModuleEdges = syntaxImport.semanticIndex.facts
  .filter((fact) => fact.predicate === 'moduleEdge' && fact.value?.importKind === 'dynamic-import')
  .map((fact) => fact.value);
const syntaxModuleEdge = syntaxModuleEdges.find((edge) => edge.moduleSpecifier === '<dynamic-import>' && edge.dynamicImportSpecifierKind === 'identifier');
assert.equal(syntaxModuleEdge.moduleSpecifier, '<dynamic-import>');
assert.equal(syntaxModuleEdge.dynamicImportSpecifierKind, 'identifier');
assert.equal(syntaxModuleEdge.dynamicImportExpressionText, 'target');
assert.equal(syntaxModuleEdge.dynamicImportStaticSpecifierEvidence, false);
assert.equal(syntaxModuleEdge.dynamicImportRuntimeResolutionClaim, false);
assert.equal(syntaxModuleEdge.dynamicImportResolutionProofRequired, true);
const syntaxStaticTemplateEdge = syntaxModuleEdges.find((edge) => edge.moduleSpecifier === './syntax-static.js');
assert.equal(syntaxStaticTemplateEdge.dynamicImportSpecifierKind, 'literal');
assert.equal(syntaxStaticTemplateEdge.dynamicImportExpressionText, '`./syntax-static.js`');
assert.equal(syntaxStaticTemplateEdge.dynamicImportStaticSpecifierEvidence, true);
assert.equal(syntaxStaticTemplateEdge.dynamicImportRuntimeResolutionClaim, false);
assert.equal(syntaxStaticTemplateEdge.dynamicImportResolutionProofRequired, false);
const syntaxDynamicTemplateEdge = syntaxModuleEdges.find((edge) => edge.dynamicImportSpecifierKind === 'template');
assert.equal(syntaxDynamicTemplateEdge.moduleSpecifier, '<dynamic-import>');
assert.equal(syntaxDynamicTemplateEdge.dynamicImportStaticSpecifierEvidence, false);
assert.equal(syntaxDynamicTemplateEdge.dynamicImportRuntimeResolutionClaim, false);
assert.equal(syntaxDynamicTemplateEdge.dynamicImportResolutionProofRequired, true);

function program(body) { return { type: 'Program', body }; }
function exprStmt(expression) { return { type: 'ExpressionStatement', expression }; }
function id(name) { return { type: 'Identifier', name }; }
function lit(value) { return { type: 'Literal', value }; }
function template(value) { return { type: 'TemplateLiteral', expressions: [], quasis: [{ type: 'TemplateElement', value: { cooked: value, raw: value } }] }; }
function templateExpr(prefix, expression, suffix) { return { type: 'TemplateLiteral', expressions: [expression], quasis: [{ type: 'TemplateElement', value: { cooked: prefix, raw: prefix } }, { type: 'TemplateElement', value: { cooked: suffix, raw: suffix } }] }; }
