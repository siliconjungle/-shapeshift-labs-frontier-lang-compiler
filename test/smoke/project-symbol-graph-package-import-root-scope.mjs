import { assert } from './helpers.mjs';
import { importNativeProject } from './compiler-api.mjs';

const packageImportScopeProject = await importNativeProject({
  id: 'project_symbol_graph_package_import_scope_missing',
  projectRoot: '.',
  moduleResolution: {
    packageRoot: 'packages/app',
    imports: {
      '#internal/*': { import: './src/internal/*.ts', default: './src/internal/*.js' }
    },
    packageExportConditions: ['import', 'default']
  },
  sources: [{
    language: 'typescript',
    sourcePath: 'packages/other/src/index.ts',
    sourceText: "import { internal } from '#internal/thing';\nexport const used = internal;\n",
    metadata: { semanticImportExpected: true }
  }, {
    language: 'typescript',
    sourcePath: 'packages/app/src/internal/thing.ts',
    sourceText: 'export const internal = 1;\n',
    metadata: { semanticImportExpected: true }
  }]
});

const packageImportScopeEdge = packageImportScopeProject.projectSymbolGraph.importEdges
  .find((edge) => edge.moduleSpecifier === '#internal/thing' && edge.importedName === 'internal');
assert.equal(packageImportScopeEdge.resolutionKind, 'package-import-scope-missing');
assert.equal(packageImportScopeEdge.packageImportKey, '#internal/thing');
assert.equal(packageImportScopeEdge.resolvedModulePath, undefined);
assert.equal(packageImportScopeEdge.targetDocumentId, undefined);
