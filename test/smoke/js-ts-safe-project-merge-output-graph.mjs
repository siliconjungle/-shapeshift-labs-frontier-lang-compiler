import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const crossBranchDependencyProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_cross_branch_dependency_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: {
    'src/consumer.ts': "import { stable } from './provider.js';\nexport const used = stable;\n",
    'src/provider.ts': 'export const stable = 1;\n'
  },
  workerFiles: {
    'src/consumer.ts': "import { stable, headValue } from './provider.js';\nexport const used = stable;\nexport const workerUsesHeadValue = headValue;\n",
    'src/provider.ts': 'export const stable = 1;\n'
  },
  headFiles: {
    'src/consumer.ts': "import { stable } from './provider.js';\nexport const used = stable;\n",
    'src/provider.ts': 'export const stable = 1;\nexport const headValue = 2;\n'
  }
});
const crossBranchOutputByPath = new Map(crossBranchDependencyProject.outputFiles.map((file) => [file.sourcePath, file]));
const crossBranchImportEdge = crossBranchDependencyProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './provider.js' && edge.importedName === 'headValue');
assert.equal(crossBranchDependencyProject.status, 'merged');
assert.equal(crossBranchDependencyProject.summary.semanticArtifactFiles, 2);
assert.equal(crossBranchOutputByPath.get('src/consumer.ts').sourceText, "import { stable, headValue } from './provider.js';\nexport const used = stable;\nexport const workerUsesHeadValue = headValue;\n");
assert.equal(crossBranchOutputByPath.get('src/provider.ts').sourceText, 'export const stable = 1;\nexport const headValue = 2;\n');
assert.equal(Boolean(crossBranchImportEdge), true);
assert.equal(crossBranchImportEdge.resolvedTargetSymbolId, 'symbol:typescript:export:headvalue');
assert.equal(crossBranchDependencyProject.outputProjectSymbolGraph.remainingFields.includes('moduleEdges[].resolvedTargetSymbolId'), false);

const parserBackedOutputSources = [{
  language: 'typescript',
  sourcePath: 'src/index.ts',
  sourceText: "import defaultThing, { type Model, value as localValue } from './dep.js';\nexport const used = localValue;\nexport type UsedModel = Model;\n"
}, {
  language: 'typescript',
  sourcePath: 'src/dep.ts',
  sourceText: 'export default function defaultThing() { return true; }\nexport interface Model { id: string; }\nexport const value = 1;\n'
}];
const parserBackedOutputAdapter = createTypeScriptCompilerNativeImporterAdapter({ typescript });
const parserBackedOutputImports = await Promise.all(parserBackedOutputSources.map((source) => runNativeImporterAdapter(parserBackedOutputAdapter, source)));
const parserBackedGraphProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_parser_backed_output_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: parserBackedOutputImports,
  files: parserBackedOutputSources.map((source) => ({ sourcePath: source.sourcePath, language: source.language, baseSourceText: source.sourceText, workerSourceText: source.sourceText, headSourceText: source.sourceText }))
});
const parserBackedImport = parserBackedGraphProject.outputProjectImport.imports.find((importResult) => importResult.sourcePath === 'src/index.ts');
const parserBackedValueEdge = parserBackedGraphProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './dep.js' && edge.localName === 'localValue');
const parserBackedTypeEdge = parserBackedGraphProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './dep.js' && edge.localName === 'Model');
assert.equal(parserBackedGraphProject.status, 'merged');
assert.equal(parserBackedImport.adapter.parser, 'typescript-compiler-api');
assert.equal(parserBackedGraphProject.outputProjectImport.metadata.outputProjectImportSource.matchedSuppliedImports, 2);
assert.equal(parserBackedGraphProject.outputProjectImport.metadata.outputProjectImportSource.scannerFallbackImports, 0);
assert.equal(parserBackedValueEdge.resolvedTargetSymbolId, 'symbol:typescript:export:value');
assert.equal(parserBackedTypeEdge.importKind, 'type-named');
assert.equal(parserBackedTypeEdge.isTypeOnly, true);

const missingOutputImportProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_missing_output_import',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/index.ts': "import { existing } from './missing.js';\nexport const stable = existing;\n" },
  workerFiles: { 'src/index.ts': "import { existing, missing } from './missing.js';\nexport const stable = existing;\nexport const workerOnly = missing;\n" },
  headFiles: { 'src/index.ts': "import { existing } from './missing.js';\nexport const stable = existing;\n" }
});
const missingOutputImportEdge = missingOutputImportProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './missing.js');
assert.equal(missingOutputImportProject.status, 'blocked');
assert.equal(missingOutputImportProject.admission.reasonCodes.includes('project-output-module-unresolved'), true);
assert.equal(missingOutputImportProject.summary.projectGraphConflicts, 1);
assert.equal(missingOutputImportProject.conflicts[0].code, 'project-output-module-unresolved');
assert.equal(missingOutputImportEdge.resolutionKind, 'relative-missing');
assert.equal(missingOutputImportEdge.resolvedModulePath, 'src/missing.js');
