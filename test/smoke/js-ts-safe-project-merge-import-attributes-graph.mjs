import { assert } from './helpers.mjs';
import {
  createEstreeNativeImporterAdapter,
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;
const tsAdapter = createTypeScriptCompilerNativeImporterAdapter({ typescript });
const jsonImportAttributes = [{ key: 'type', value: 'json' }];

const attributedProject = await importNativeProject({
  id: 'project_symbol_graph_import_attribute_edges',
  projectRoot: 'src',
  adapters: [tsAdapter],
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "import { value } from './dep.js' with { type: 'json' };\nexport { value as reexported } from './dep.js' with { type: 'json' };\nexport const used = value;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/dep.ts',
    sourceText: 'export const value = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const attributedImportEdge = attributedProject.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './dep.js' && edge.importedName === 'value');
const attributedExportEdge = attributedProject.projectSymbolGraph.exportEdges.find((edge) => edge.moduleSpecifier === './dep.js' && edge.exportedName === 'reexported');
const attributedReExport = attributedProject.projectSymbolGraph.reExportIdentities.find((identity) => identity.exportedName === 'reexported');
assert.equal(attributedImportEdge.hasImportAttributes, true);
assert.equal(attributedImportEdge.importAttributeCount, 1);
assert.deepEqual(attributedImportEdge.importAttributeKeys, ['type']);
assert.deepEqual(attributedImportEdge.importAttributes, jsonImportAttributes);
assert.equal(typeof attributedImportEdge.importAttributeHash, 'string');
assert.equal(attributedExportEdge.importAttributeHash, attributedImportEdge.importAttributeHash);
assert.deepEqual(attributedExportEdge.importAttributes, jsonImportAttributes);
assert.equal(attributedReExport.hasImportAttributes, true);
assert.deepEqual(attributedReExport.importAttributeKeys, ['type']);
assert.deepEqual(attributedReExport.importAttributes, jsonImportAttributes);
assert.equal(attributedReExport.importAttributeHash, attributedImportEdge.importAttributeHash);

const estreeAdapter = createEstreeNativeImporterAdapter();
const syntaxAttributedProject = await importNativeProject({
  id: 'project_symbol_graph_syntax_import_attribute_reexport_identity',
  projectRoot: 'src',
  adapters: [estreeAdapter],
  adapterResolver(source) {
    return source.sourcePath === 'src/syntax-index.js' ? estreeAdapter : undefined;
  },
  sources: [{
    language: 'javascript',
    sourcePath: 'src/syntax-index.js',
    sourceText: "export { value as reexported } from './dep.js' with { type: 'json' };\n",
    adapterOptions: {
      ast: program([exportNamed('./dep.js', [
        { type: 'ExportSpecifier', local: id('value'), exported: id('reexported') }
      ], [importAttr('type', 'json')])])
    },
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/dep.js',
    sourceText: 'export const value = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});
const syntaxAttributedReExport = syntaxAttributedProject.projectSymbolGraph.reExportIdentities.find((identity) => identity.exportedName === 'reexported');
assert.equal(syntaxAttributedReExport.hasImportAttributes, true);
assert.deepEqual(syntaxAttributedReExport.importAttributeKeys, ['type']);
assert.deepEqual(syntaxAttributedReExport.importAttributes, jsonImportAttributes);
assert.equal(typeof syntaxAttributedReExport.importAttributeHash, 'string');

const dynamicAttributeProject = await importNativeProject({
  id: 'project_symbol_graph_dynamic_import_attribute_presence',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.js',
    sourceText: "import './dep.js' with { type: 'json' };\nimport('./dep.js', { with: { type: 'json' } });\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/dep.js',
    sourceText: 'export const value = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});
const staticJsAttributeEdge = dynamicAttributeProject.projectSymbolGraph.importEdges.find((edge) => edge.importKind === 'side-effect');
const dynamicAttributeEdge = dynamicAttributeProject.projectSymbolGraph.importEdges.find((edge) => edge.importKind === 'dynamic-import');
assert.equal(staticJsAttributeEdge.hasImportAttributes, true);
assert.equal(staticJsAttributeEdge.importAttributeCount, 1);
assert.deepEqual(staticJsAttributeEdge.importAttributeKeys, ['type']);
assert.deepEqual(staticJsAttributeEdge.importAttributes, jsonImportAttributes);
assert.equal(typeof staticJsAttributeEdge.importAttributeHash, 'string');
assert.equal(dynamicAttributeEdge.hasImportAttributes, true);
assert.equal(dynamicAttributeEdge.importAttributeCount, 1);
assert.deepEqual(dynamicAttributeEdge.importAttributeKeys, ['type']);
assert.deepEqual(dynamicAttributeEdge.importAttributes, jsonImportAttributes);
assert.equal(dynamicAttributeEdge.importAttributeHash, staticJsAttributeEdge.importAttributeHash);

const deltaFiles = {
  'src/index.ts': "import { value } from './dep.js';\nexport const used = value;\n",
  'src/dep.ts': 'export const value = 1;\n'
};
const baseImports = await parserBackedImportsForFiles(deltaFiles);
const workerImportAttributes = [{ key: 'type', value: 'worker-json' }];
const headImportAttributes = [{ key: 'type', value: 'head-json' }];
const deltaProject = safeMergeJsTsProject({
  id: 'js_ts_project_import_attribute_delta_conflict',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: deltaFiles,
  workerFiles: deltaFiles,
  headFiles: deltaFiles,
  baseProjectImports: rewriteImportAttributeHash(baseImports, 'attr:base'),
  workerProjectImports: rewriteImportAttributeHash(baseImports, 'attr:worker', workerImportAttributes),
  headProjectImports: rewriteImportAttributeHash(baseImports, 'attr:head', headImportAttributes),
  outputProjectImports: rewriteImportAttributeHash(baseImports, 'attr:worker')
});
const attributeDeltaConflict = deltaProject.conflicts.find((conflict) => conflict.code === 'project-import-attribute-delta-conflict');
assert.equal(deltaProject.status, 'blocked');
assert.equal(deltaProject.admission.reasonCodes.includes('project-import-attribute-delta-conflict'), true);
assert.equal(deltaProject.summary.projectGraphImportAttributeConflicts, 1);
assert.equal(deltaProject.projectGraphDelta.summary.importAttributeConflicts, 1);
assert.equal(attributeDeltaConflict.details.identityKey, 'import-attribute#imports#import#src/index.ts#./dep.js#false');
assert.equal(attributeDeltaConflict.details.worker.importAttributeHash, 'attr:worker');
assert.equal(attributeDeltaConflict.details.head.importAttributeHash, 'attr:head');
assert.deepEqual(attributeDeltaConflict.details.worker.importAttributes, workerImportAttributes);
assert.deepEqual(attributeDeltaConflict.details.head.importAttributes, headImportAttributes);

async function parserBackedImportsForFiles(files) {
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(tsAdapter, {
    language: 'typescript',
    sourcePath,
    sourceText,
    metadata: { semanticImportExpected: true }
  })));
}

function rewriteImportAttributeHash(imports, hash, importAttributes = jsonImportAttributes) {
  return imports.map((record) => rewriteSemanticIndex(record, hash, importAttributes));
}

function rewriteSemanticIndex(importResult, hash, importAttributes) {
  const clone = JSON.parse(JSON.stringify(importResult));
  const rewrite = (edge) => edge?.moduleSpecifier === './dep.js'
    ? { ...edge, hasImportAttributes: true, importAttributeCount: 1, importAttributeKeys: ['type'], importAttributeHash: hash, importAttributes }
    : edge;
  clone.semanticIndex.facts = clone.semanticIndex.facts.map((fact) => fact.predicate === 'moduleEdge' ? { ...fact, value: rewrite(fact.value) } : fact);
  clone.semanticIndex.relations = clone.semanticIndex.relations.map((relation) => relation.metadata?.moduleEdge ? { ...relation, metadata: { ...relation.metadata, moduleEdge: rewrite(relation.metadata.moduleEdge) } } : relation);
  clone.semanticIndex.symbols = clone.semanticIndex.symbols.map((symbol) => symbol.metadata?.moduleEdge ? { ...symbol, metadata: { ...symbol.metadata, moduleEdge: rewrite(symbol.metadata.moduleEdge) } } : symbol);
  return clone;
}

function program(body) { return { type: 'Program', sourceType: 'module', body }; }
function exportNamed(source, specifiers, attributes = []) { return { type: 'ExportNamedDeclaration', source: lit(source), specifiers, attributes }; }
function importAttr(key, value) { return { type: 'ImportAttribute', key: id(key), value: lit(value) }; }
function id(name) { return { type: 'Identifier', name }; }
function lit(value) { return { type: 'Literal', value }; }
