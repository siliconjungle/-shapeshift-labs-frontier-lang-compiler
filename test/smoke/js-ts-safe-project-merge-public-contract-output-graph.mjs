import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;
const parserBackedOutputAdapter = createTypeScriptCompilerNativeImporterAdapter({ typescript });

const publicContractSurfaceGraphFiles = {
  'src/provider.ts': 'export const newName = 1;\n',
  'src/barrel.ts': "export { newName as publicName } from './provider.js';\n",
  'src/namespace.ts': 'export namespace RuntimeTools { export const value = 1; }\n',
  'src/legacy.ts': 'const runtime = {};\nexport = runtime;\n',
  'src/consumer.ts': [
    "import { publicName } from './barrel.js';",
    "import { RuntimeTools } from './namespace.js';",
    "import legacy = require('./legacy.js');",
    'export const used = [publicName, RuntimeTools.value, legacy].length;',
    ''
  ].join('\n')
};
const publicContractSurfaceGraphProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_contract_rename_reexport_namespace_module_consumer_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: await parserBackedImportsForFiles(publicContractSurfaceGraphFiles),
  baseFiles: {},
  workerFiles: {},
  headFiles: publicContractSurfaceGraphFiles
});
const publicContractSurfaceGraph = publicContractSurfaceGraphProject.outputProjectSymbolGraph;
const publicContractSurfaceImportSource = publicContractSurfaceGraphProject.outputProjectImport.metadata.outputProjectImportSource;
assert.equal(publicContractSurfaceGraphProject.status, 'merged');
assert.equal(publicContractSurfaceImportSource.matchedSuppliedImports, Object.keys(publicContractSurfaceGraphFiles).length);
assert.equal(publicContractSurfaceImportSource.scannerFallbackImports, 0);
assertGraphRecord(publicContractSurfaceGraph.importEdges, {
  sourcePath: 'src/consumer.ts',
  moduleSpecifier: './barrel.js',
  importKind: 'named',
  importedName: 'publicName',
  resolvedTargetSymbolId: 'symbol:typescript:export:provider_js_publicname_newname'
});
assertGraphRecord(publicContractSurfaceGraph.importEdges, {
  sourcePath: 'src/consumer.ts',
  moduleSpecifier: './namespace.js',
  importKind: 'named',
  importedName: 'RuntimeTools',
  resolvedTargetSymbolId: 'symbol:typescript:export:runtimetools'
});
assertGraphRecord(publicContractSurfaceGraph.importEdges, {
  sourcePath: 'src/consumer.ts',
  moduleSpecifier: './legacy.js',
  importKind: 'commonjs-require',
  importedName: 'default',
  localName: 'legacy',
  resolutionKind: 'relative-source'
});
assertGraphRecord(publicContractSurfaceGraph.exportEdges, {
  sourcePath: 'src/legacy.ts',
  exportKind: 'assignment',
  exportedName: 'module.exports',
  publicContract: true
});
assertGraphRecord(publicContractSurfaceGraph.reExportIdentities, {
  sourcePath: 'src/barrel.ts',
  moduleSpecifier: './provider.js',
  exportedName: 'publicName',
  importedName: 'newName',
  originSymbolId: 'symbol:typescript:export:newname'
});
const publicNameContract = assertGraphRecord(publicContractSurfaceGraph.publicContractRegions, {
  sourcePath: 'src/barrel.ts',
  exportedName: 'publicName',
  apiSurfaceKind: 'module-re-export',
  edgeKind: 're-export'
});
const namespaceContract = assertGraphRecord(publicContractSurfaceGraph.publicContractRegions, {
  sourcePath: 'src/namespace.ts',
  exportedName: 'RuntimeTools',
  apiSurfaceKind: 'module-export',
  edgeKind: 'export'
});
const moduleExportsContract = assertGraphRecord(publicContractSurfaceGraph.publicContractRegions, {
  sourcePath: 'src/legacy.ts',
  exportedName: 'module.exports',
  apiSurfaceKind: 'module-export',
  edgeKind: 'export'
});
assert.equal(Boolean(publicNameContract.signatureHash && publicNameContract.contractHash), true);
assert.equal(Boolean(namespaceContract.signatureHash && namespaceContract.contractHash), true);
assert.equal(Boolean(moduleExportsContract.signatureHash && moduleExportsContract.contractHash), true);

function parserBackedImportsForFiles(files) {
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(parserBackedOutputAdapter, {
    language: 'typescript',
    sourcePath,
    sourceText
  })));
}

function assertGraphRecord(records, expected) {
  const record = records.find((candidate) => Object.entries(expected).every(([key, value]) => candidate[key] === value));
  assert.equal(Boolean(record), true, `missing graph record ${JSON.stringify(expected)}`);
  return record;
}
