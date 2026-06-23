import { assert } from './helpers.mjs';
import { importNativeProject } from './compiler-api.mjs';
import { createProjectDocumentExportSymbolResolver } from '../../src/internal/index-impl/projectSymbolGraphModuleResolution.js';

const project = await importNativeProject({
  id: 'project_symbol_graph_named_import_resolution',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.js',
    sourceText: "import { thing as localThing } from './thing.js';\nexport const used = localThing;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/thing.js',
    sourceText: 'export const thing = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const graph = project.projectSymbolGraph;
const namedImportEdge = graph.importEdges.find((edge) => edge.importedName === 'thing');
assert.equal(namedImportEdge.moduleSpecifier, './thing.js');
assert.equal(namedImportEdge.resolvedModulePath, 'src/thing.js');
assert.equal(namedImportEdge.targetDocumentId, 'doc_src_thing_js');
assert.equal(namedImportEdge.resolvedTargetSymbolId, 'symbol:javascript:export:thing');
assert.equal(namedImportEdge.resolutionPathVariant, 'exact');
assert.equal(graph.remainingFields.includes('moduleEdges[].resolutionKind'), false);
assert.equal(graph.remainingFields.includes('moduleEdges[].resolvedTargetSymbolId'), false);
assert.equal(project.semanticIndex.metadata.projectSymbolGraph, graph);

const fallbackExportResolver = createProjectDocumentExportSymbolResolver([{
  id: 'symbol:javascript:export:fallback',
  kind: 'export',
  name: 'fallback',
  definitionSpan: { path: 'src/fallback.js' },
  metadata: {}
}], [{ id: 'doc_src_fallback_js', path: 'src/fallback.js' }]);
assert.equal(fallbackExportResolver('doc_src_fallback_js', 'fallback'), 'symbol:javascript:export:fallback');

const nodeNextProject = await importNativeProject({
  id: 'project_symbol_graph_nodenext_extension_resolution',
  projectRoot: 'src',
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "import { runtime } from './runtime.js';\nexport const used = runtime;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/runtime.ts',
    sourceText: 'export const runtime = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const nodeNextEdge = nodeNextProject.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './runtime.js' && edge.importedName === 'runtime');
assert.equal(nodeNextEdge.resolvedModulePath, 'src/runtime.ts');
assert.equal(nodeNextEdge.targetDocumentId, 'doc_src_runtime_ts');
assert.equal(nodeNextEdge.resolutionKind, 'relative-source');
assert.equal(nodeNextEdge.resolutionPathVariant, 'extension-substitution');
assert.equal(nodeNextEdge.resolvedTargetSymbolId, 'symbol:typescript:export:runtime');

const aliasProject = await importNativeProject({
  id: 'project_symbol_graph_path_alias_resolution',
  projectRoot: 'src',
  moduleResolution: { baseUrl: '.', paths: { '@app/*': ['src/*'] } },
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "import { thing } from '@app/thing';\nexport const used = thing;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/thing.ts',
    sourceText: 'export const thing = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const aliasGraph = aliasProject.projectSymbolGraph;
const aliasEdge = aliasGraph.importEdges.find((edge) => edge.moduleSpecifier === '@app/thing' && edge.importedName === 'thing');
assert.equal(aliasEdge.resolvedModulePath, 'src/thing.ts');
assert.equal(aliasEdge.targetDocumentId, 'doc_src_thing_ts');
assert.equal(aliasEdge.resolutionKind, 'path-alias-source');
assert.equal(aliasEdge.packageName, undefined);
assert.equal(aliasEdge.resolvedTargetSymbolId, 'symbol:typescript:export:thing');

const packageProject = await importNativeProject({
  id: 'project_symbol_graph_package_resolution',
  projectRoot: '.',
  moduleResolution: {
    packages: {
      '@pkg/core': {
        root: 'packages/core',
        exports: {
          './utils': { types: './src/utils.d.ts', import: './src/utils.js', default: './dist/utils.js' }
        }
      }
    },
    packageExportConditions: ['types', 'import', 'default']
  },
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "import { util } from '@pkg/core/utils';\nimport { jsx } from 'react/jsx-runtime';\nexport const used = util;\nexport const view = jsx;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'packages/core/src/utils.ts',
    sourceText: 'export const util = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const packageGraph = packageProject.projectSymbolGraph;
const packageEdge = packageGraph.importEdges.find((edge) => edge.moduleSpecifier === '@pkg/core/utils' && edge.importedName === 'util');
assert.equal(packageEdge.packageName, '@pkg/core');
assert.equal(packageEdge.packageSubpath, './utils');
assert.equal(packageEdge.packageExportCondition, 'import');
assert.equal(packageEdge.resolvedModulePath, 'packages/core/src/utils.ts');
assert.equal(packageEdge.resolutionPathVariant, 'extension-substitution');
assert.equal(packageEdge.resolutionKind, 'package-source');
assert.equal(packageEdge.resolvedTargetSymbolId, 'symbol:typescript:export:util');
const externalEdge = packageGraph.importEdges.find((edge) => edge.moduleSpecifier === 'react/jsx-runtime' && edge.importedName === 'jsx');
assert.equal(externalEdge.packageName, 'react');
assert.equal(externalEdge.packageSubpath, './jsx-runtime');
assert.equal(externalEdge.resolutionKind, 'package-external');
assert.equal(externalEdge.resolvedModulePath, undefined);
assert.equal(packageGraph.remainingFields.includes('moduleEdges[].packageName'), false);
assert.equal(packageGraph.remainingFields.includes('moduleEdges[].packageExportCondition'), false);

const packageImportsProject = await importNativeProject({
  id: 'project_symbol_graph_package_imports_resolution',
  projectRoot: '.',
  moduleResolution: {
    imports: {
      '#internal/*': { types: './src/internal/*.d.ts', import: './src/internal/*.ts', default: './src/internal/*.js' },
      '#external': { default: 'react/jsx-runtime' }
    },
    packageExportConditions: ['types', 'import', 'default']
  },
  sources: [{
    language: 'typescript',
    sourcePath: 'src/index.ts',
    sourceText: "import { internal } from '#internal/thing';\nimport { jsx } from '#external';\nexport const used = internal;\nexport const view = jsx;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'src/internal/thing.ts',
    sourceText: 'export const internal = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const packageImportsGraph = packageImportsProject.projectSymbolGraph;
const packageImportEdge = packageImportsGraph.importEdges.find((edge) => edge.moduleSpecifier === '#internal/thing' && edge.importedName === 'internal');
assert.equal(packageImportEdge.resolvedModulePath, 'src/internal/thing.ts');
assert.equal(packageImportEdge.targetDocumentId, 'doc_src_internal_thing_ts');
assert.equal(packageImportEdge.resolutionKind, 'package-import-source');
assert.equal(packageImportEdge.packageImportKey, '#internal/*');
assert.equal(packageImportEdge.packageImportCondition, 'import');
assert.equal(packageImportEdge.packageImportTarget, './src/internal/thing.ts');
assert.equal(packageImportEdge.resolutionPathVariant, 'exact');
assert.equal(packageImportEdge.resolvedTargetSymbolId, 'symbol:typescript:export:internal');
const externalPackageImportEdge = packageImportsGraph.importEdges.find((edge) => edge.moduleSpecifier === '#external' && edge.importedName === 'jsx');
assert.equal(externalPackageImportEdge.resolutionKind, 'package-import-external');
assert.equal(externalPackageImportEdge.packageImportKey, '#external');
assert.equal(externalPackageImportEdge.packageImportCondition, 'default');
assert.equal(externalPackageImportEdge.packageImportTarget, 'react/jsx-runtime');

const reExportProject = await importNativeProject({
  id: 'project_symbol_graph_reexport_identity_resolution',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.js',
    sourceText: "export { thing as renamedThing } from './thing.js';\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/thing.js',
    sourceText: 'export const thing = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const reExportIdentity = reExportProject.projectSymbolGraph.reExportIdentities[0];
assert.equal(reExportIdentity.moduleSpecifier, './thing.js');
assert.equal(reExportIdentity.importedName, 'thing');
assert.equal(reExportIdentity.exportedName, 'renamedThing');
assert.equal(reExportIdentity.originSymbolId, 'symbol:javascript:export:thing');
assert.equal(reExportIdentity.exportedSymbolId, 'symbol:javascript:export:renamedthing');
assert.equal(reExportIdentity.localSymbolId, 'symbol:javascript:import:thing_js_renamedthing');
assert.deepEqual(reExportProject.projectSymbolGraph.remainingFields, []);

const exportStarProject = await importNativeProject({
  id: 'project_symbol_graph_export_star_fanout',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.js',
    sourceText: "export * from './thing.js';\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'javascript',
    sourcePath: 'src/thing.js',
    sourceText: 'export const thing = 1;\nexport default function run() { return thing; }\nexport const other = 2;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const exportStarGraph = exportStarProject.projectSymbolGraph;
const exportStarNames = exportStarGraph.reExportIdentities.map((identity) => identity.exportedName).sort();
assert.deepEqual(exportStarNames, ['other', 'thing']);
assert.equal(exportStarGraph.importEdges.find((edge) => edge.moduleSpecifier === './thing.js').exportStar, true);
assert.equal(exportStarGraph.reExportIdentities.every((identity) => identity.isExportStar === true), true);
assert.deepEqual(exportStarGraph.reExportIdentities.map((identity) => identity.originSymbolId).sort(), ['symbol:javascript:export:other', 'symbol:javascript:export:thing']);
