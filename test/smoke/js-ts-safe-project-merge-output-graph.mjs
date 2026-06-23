import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const crossBranchBaseFiles = {
  'src/consumer.ts': "import { stable } from './provider.js';\nexport const used = stable;\n",
  'src/provider.ts': 'export const stable = 1;\n'
};
const crossBranchWorkerFiles = {
  'src/consumer.ts': "import { stable, headValue } from './provider.js';\nexport const used = stable;\nexport const workerUsesHeadValue = headValue;\n",
  'src/provider.ts': 'export const stable = 1;\n'
};
const crossBranchHeadFiles = {
  'src/consumer.ts': "import { stable } from './provider.js';\nexport const used = stable;\n",
  'src/provider.ts': 'export const stable = 1;\nexport const headValue = 2;\n'
};
const crossBranchDependencyProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_cross_branch_dependency_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: crossBranchBaseFiles,
  workerFiles: crossBranchWorkerFiles,
  headFiles: crossBranchHeadFiles
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

const crossBranchDependencyDeltaProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_cross_branch_dependency_delta_graph',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: crossBranchBaseFiles,
  workerFiles: crossBranchWorkerFiles,
  headFiles: crossBranchHeadFiles
});
const crossBranchDeltaConflict = crossBranchDependencyDeltaProject.conflicts.find((conflict) => conflict.code === 'project-import-target-delta-conflict');
assert.equal(crossBranchDependencyDeltaProject.status, 'blocked');
assert.equal(crossBranchDependencyDeltaProject.admission.reasonCodes.includes('project-import-target-delta-conflict'), true);
assert.equal(crossBranchDependencyDeltaProject.summary.projectGraphDeltaConflicts, 1);
assert.equal(crossBranchDependencyDeltaProject.summary.projectGraphImportTargetConflicts, 1);
assert.equal(crossBranchDependencyDeltaProject.projectGraphDelta.summary.importTargetConflicts, 1);
assert.equal(crossBranchDeltaConflict.details.outputTargetSymbolId, 'symbol:typescript:export:headvalue');
assert.equal(crossBranchDeltaConflict.details.workerTargetSymbolId, undefined);

const reExportHeadOnlyBaseFiles = {
  'src/provider.ts': 'export const stable = 1;\n'
};
const reExportHeadOnlyWorkerFiles = {
  'src/barrel.ts': "export { headValue } from './provider.js';\n",
  'src/provider.ts': 'export const stable = 1;\n'
};
const reExportHeadOnlyHeadFiles = {
  'src/provider.ts': 'export const stable = 1;\nexport const headValue = 2;\n'
};
const reExportHeadOnlyDeltaProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_worker_re_export_head_only_provider_delta_graph',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: reExportHeadOnlyBaseFiles,
  workerFiles: reExportHeadOnlyWorkerFiles,
  headFiles: reExportHeadOnlyHeadFiles
});
const reExportHeadOnlyDeltaConflict = reExportHeadOnlyDeltaProject.conflicts.find((conflict) => conflict.code === 'project-import-target-delta-conflict');
assert.equal(reExportHeadOnlyDeltaProject.status, 'blocked');
assert.equal(reExportHeadOnlyDeltaProject.admission.reasonCodes.includes('project-import-target-delta-conflict'), true);
assert.equal(reExportHeadOnlyDeltaProject.summary.projectGraphImportTargetConflicts, 1);
assert.equal(reExportHeadOnlyDeltaConflict.details.identityKey, 'import-target#src/barrel.ts#./provider.js#headValue#reexport#');
assert.equal(reExportHeadOnlyDeltaConflict.details.workerTargetSymbolId, undefined);
assert.equal(reExportHeadOnlyDeltaConflict.details.outputTargetSymbolId, 'symbol:typescript:export:headvalue');

const reExportIdentityBaseFiles = {
  'src/barrel.ts': 'export const stable = 1;\n'
};
const reExportIdentityWorkerFiles = {
  'src/barrel.ts': "export const stable = 1;\nexport { value as shared } from './worker.js';\n",
  'src/worker.ts': 'export const value = 1;\n'
};
const reExportIdentityHeadFiles = {
  'src/barrel.ts': "export const stable = 1;\nexport { value as shared } from './head.js';\n",
  'src/head.ts': 'export const value = 2;\n'
};
const reExportIdentityDeltaProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_re_export_identity_delta_conflict',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: reExportIdentityBaseFiles,
  workerFiles: reExportIdentityWorkerFiles,
  headFiles: reExportIdentityHeadFiles
});
const reExportIdentityDeltaConflict = reExportIdentityDeltaProject.conflicts.find((conflict) => conflict.code === 'project-re-export-identity-delta-conflict');
const reExportIdentityOutputByPath = new Map(reExportIdentityDeltaProject.outputFiles.map((file) => [file.sourcePath, file.sourceText]));
assert.equal(reExportIdentityDeltaProject.status, 'blocked');
assert.equal(reExportIdentityDeltaProject.admission.reasonCodes.includes('project-re-export-identity-delta-conflict'), true);
assert.equal(reExportIdentityDeltaProject.summary.projectGraphDeltaConflicts, 1);
assert.equal(reExportIdentityDeltaProject.summary.projectGraphReExportIdentityConflicts, 1);
assert.equal(reExportIdentityDeltaProject.projectGraphDelta.summary.reExportIdentityConflicts, 1);
assert.equal(reExportIdentityDeltaConflict.details.identityKey, 're-export-identity#src/barrel.ts#shared');
assert.equal(reExportIdentityDeltaConflict.details.worker.moduleSpecifier, './worker.js');
assert.equal(reExportIdentityDeltaConflict.details.head.moduleSpecifier, './head.js');
assert.equal(reExportIdentityOutputByPath.get('src/barrel.ts'), "export const stable = 1;\nexport { value as shared } from './head.js';\nexport { value as shared } from './worker.js';\n");

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

const staleHashlessGraphProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_hashless_output_import_fallback',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: parserBackedOutputImports.map(stripSourceHashesFromImport),
  files: parserBackedOutputSources.map((source) => ({ sourcePath: source.sourcePath, language: source.language, baseSourceText: source.sourceText, workerSourceText: source.sourceText, headSourceText: source.sourceText }))
});
assert.equal(staleHashlessGraphProject.status, 'merged');
assert.equal(staleHashlessGraphProject.outputProjectImport.metadata.outputProjectImportSource.matchedSuppliedImports, 0);
assert.equal(staleHashlessGraphProject.outputProjectImport.metadata.outputProjectImportSource.scannerFallbackImports, 2);

const exportedRenameBlockedBase = 'export function oldName() { return 1; }\n';
const exportedRenameBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_exported_rename_blocked_oracle',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: { 'src/rename.ts': exportedRenameBlockedBase },
  workerFiles: { 'src/rename.ts': 'export function newName() { return 1; }\n' },
  headFiles: { 'src/rename.ts': exportedRenameBlockedBase }
});
assert.equal(exportedRenameBlockedProject.status, 'blocked');
assert.equal(exportedRenameBlockedProject.projectGraphDelta, undefined);
assert.equal(exportedRenameBlockedProject.summary.blockedFiles, 1);
assert.equal(exportedRenameBlockedProject.admission.reasonCodes.includes('top-level-order-changed'), true);
assert.equal(exportedRenameBlockedProject.conflicts.some((conflict) => conflict.code === 'top-level-order-changed' && conflict.details?.expected?.includes('declaration:oldName')), true);

const graphDeltaBaseFiles = {
  'src/options.ts': [
    'export interface Options {',
    '  enabled: boolean;',
    '}',
    ''
  ].join('\n')
};
const graphDeltaWorkerFiles = {
  'src/options.ts': [
    'export interface Options {',
    '  enabled: boolean;',
    '  label?: string;',
    '}',
    ''
  ].join('\n')
};
const graphDeltaHeadFiles = {
  'src/options.ts': [
    'export interface Options {',
    '  enabled: boolean;',
    '  retries: number;',
    '}',
    ''
  ].join('\n')
};
const graphDeltaOutputFiles = {
  'src/options.ts': [
    'export interface Options {',
    '  enabled: boolean;',
    '  retries: number;',
    '  label?: string;',
    '}',
    ''
  ].join('\n')
};
const graphDeltaPublicContractProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_contract_delta_conflict',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: graphDeltaBaseFiles,
  workerFiles: graphDeltaWorkerFiles,
  headFiles: graphDeltaHeadFiles,
  baseProjectImports: await parserBackedImportsForFiles(graphDeltaBaseFiles),
  workerProjectImports: await parserBackedImportsForFiles(graphDeltaWorkerFiles),
  headProjectImports: await parserBackedImportsForFiles(graphDeltaHeadFiles),
  outputProjectImports: await parserBackedImportsForFiles(graphDeltaOutputFiles),
  policyByPath: {
    'src/options.ts': { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
  }
});
const graphDeltaPublicContractConflict = graphDeltaPublicContractProject.conflicts.find((conflict) => conflict.code === 'project-public-contract-delta-conflict');
assert.equal(graphDeltaPublicContractProject.status, 'blocked');
assert.equal(graphDeltaPublicContractProject.outputProjectSymbolGraph.kind, 'frontier.lang.projectSymbolGraph');
assert.equal(graphDeltaPublicContractProject.projectGraphDelta.kind, 'frontier.lang.jsTsProjectGraphDelta');
assert.equal(graphDeltaPublicContractProject.projectGraphDelta.summary.conflicts, 1);
assert.equal(graphDeltaPublicContractProject.projectGraphDelta.summary.publicContractConflicts, 1);
assert.equal(graphDeltaPublicContractProject.projectGraphDelta.stages.base.summary.publicContractRegions, 1);
assert.equal(graphDeltaPublicContractProject.projectGraphDelta.stages.worker.summary.publicContractRegions, 1);
assert.equal(graphDeltaPublicContractProject.projectGraphDelta.stages.head.summary.publicContractRegions, 1);
assert.equal(graphDeltaPublicContractProject.projectGraphDelta.stages.output.summary.publicContractRegions, 1);
assert.equal(graphDeltaPublicContractProject.summary.projectGraphDeltaConflicts, 1);
assert.equal(graphDeltaPublicContractProject.summary.projectGraphPublicContractConflicts, 1);
assert.equal(graphDeltaPublicContractProject.admission.reasonCodes.includes('project-public-contract-delta-conflict'), true);
assert.equal(graphDeltaPublicContractConflict.details.identityKey, 'source#src/options.ts#export#Options');
assert.equal(graphDeltaPublicContractConflict.details.worker.contractHash === graphDeltaPublicContractConflict.details.head.contractHash, false);
assert.equal(graphDeltaPublicContractProject.metadata.projectGraphDeltaConflicts, 1);

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

const missingOutputSymbolProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_missing_output_symbol',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: {
    'src/index.ts': "import { existing } from './provider.js';\nexport const stable = existing;\n",
    'src/provider.ts': 'export const existing = 1;\n'
  },
  workerFiles: {
    'src/index.ts': "import { existing, missing } from './provider.js';\nexport const stable = existing;\nexport const workerOnly = missing;\n",
    'src/provider.ts': 'export const existing = 1;\n'
  },
  headFiles: {
    'src/index.ts': "import { existing } from './provider.js';\nexport const stable = existing;\n",
    'src/provider.ts': 'export const existing = 1;\n'
  }
});
const missingOutputSymbolEdge = missingOutputSymbolProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './provider.js' && edge.importedName === 'missing');
assert.equal(missingOutputSymbolProject.status, 'blocked');
assert.equal(missingOutputSymbolProject.admission.reasonCodes.includes('project-output-symbol-unresolved'), true);
assert.equal(missingOutputSymbolProject.summary.projectGraphConflicts, 1);
assert.equal(missingOutputSymbolProject.conflicts[0].code, 'project-output-symbol-unresolved');
assert.equal(missingOutputSymbolEdge.resolutionKind, 'relative-source');
assert.equal(missingOutputSymbolEdge.resolvedModulePath, 'src/provider.ts');
assert.equal(missingOutputSymbolEdge.resolvedTargetSymbolId, undefined);

function parserBackedImportsForFiles(files) {
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(parserBackedOutputAdapter, {
    language: 'typescript',
    sourcePath,
    sourceText
  })));
}

function stripSourceHashesFromImport(importResult) {
  return {
    ...withoutSourceHash(importResult),
    nativeSource: importResult.nativeSource ? withoutSourceHash(importResult.nativeSource) : importResult.nativeSource,
    nativeAst: importResult.nativeAst ? withoutSourceHash(importResult.nativeAst) : importResult.nativeAst,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      documents: (importResult.semanticIndex.documents ?? []).map(withoutSourceHash)
    } : importResult.semanticIndex
  };
}

function withoutSourceHash(record) {
  if (!record || typeof record !== 'object') return record;
  const { sourceHash, ...rest } = record;
  return rest;
}
