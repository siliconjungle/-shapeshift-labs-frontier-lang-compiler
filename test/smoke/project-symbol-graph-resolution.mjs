import { assert } from './helpers.mjs';
import { importNativeProject } from './compiler-api.mjs';

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
assert.equal(graph.remainingFields.includes('moduleEdges[].resolutionKind'), false);
assert.equal(graph.remainingFields.includes('moduleEdges[].resolvedTargetSymbolId'), false);
assert.equal(project.semanticIndex.metadata.projectSymbolGraph, graph);

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
          './utils': { types: './src/utils.d.ts', import: './src/utils.ts', default: './dist/utils.js' }
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
assert.equal(packageEdge.resolutionKind, 'package-source');
assert.equal(packageEdge.resolvedTargetSymbolId, 'symbol:typescript:export:util');
const externalEdge = packageGraph.importEdges.find((edge) => edge.moduleSpecifier === 'react/jsx-runtime' && edge.importedName === 'jsx');
assert.equal(externalEdge.packageName, 'react');
assert.equal(externalEdge.packageSubpath, './jsx-runtime');
assert.equal(externalEdge.resolutionKind, 'package-external');
assert.equal(externalEdge.resolvedModulePath, undefined);
assert.equal(packageGraph.remainingFields.includes('moduleEdges[].packageName'), false);
assert.equal(packageGraph.remainingFields.includes('moduleEdges[].packageExportCondition'), false);

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
