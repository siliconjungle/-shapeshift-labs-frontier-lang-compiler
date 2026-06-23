import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const newImportDeclarationBaseFiles = {
  'src/consumer.ts': "import { stable } from './provider.js';\nexport const used = stable;\n",
  'src/provider.ts': 'export const stable = 1;\n',
  'src/worker-dep.ts': 'export const workerValue = 2;\n'
};
const newImportDeclarationWorkerFiles = {
  ...newImportDeclarationBaseFiles,
  'src/consumer.ts': "import { stable } from './provider.js';\nimport { workerValue } from './worker-dep.js';\nexport const used = stable;\nexport const workerOnly = workerValue;\n"
};
const newImportDeclarationHeadFiles = {
  ...newImportDeclarationBaseFiles,
  'src/consumer.ts': "import { stable } from './provider.js';\nexport const used = stable;\nexport const headOnly = stable;\n"
};
const newImportDeclarationGraphProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_new_import_declaration_output_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: newImportDeclarationBaseFiles,
  workerFiles: newImportDeclarationWorkerFiles,
  headFiles: newImportDeclarationHeadFiles
});
const newImportDeclarationOutputByPath = new Map(newImportDeclarationGraphProject.outputFiles.map((file) => [file.sourcePath, file]));
const newImportDeclarationEdge = newImportDeclarationGraphProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './worker-dep.js' && edge.importedName === 'workerValue');
assert.equal(newImportDeclarationGraphProject.status, 'merged');
assert.equal(newImportDeclarationGraphProject.summary.semanticArtifactFiles, 3);
assert.equal(newImportDeclarationGraphProject.summary.outputProjectGraphConflicts, 0);
assert.equal(newImportDeclarationOutputByPath.get('src/consumer.ts').sourceText, "import { stable } from './provider.js';\nimport { workerValue } from './worker-dep.js';\nexport const used = stable;\nexport const headOnly = stable;\nexport const workerOnly = workerValue;\n");
assert.equal(newImportDeclarationEdge.resolvedModulePath, 'src/worker-dep.ts');
assert.equal(newImportDeclarationEdge.resolutionKind, 'relative-source');
assert.equal(newImportDeclarationEdge.resolvedTargetSymbolId, 'symbol:typescript:export:workervalue');

const missingNewImportDeclarationProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_missing_new_import_declaration_output_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/consumer.ts': 'export const stable = 1;\n' },
  workerFiles: { 'src/consumer.ts': "import { missing } from './missing.js';\nexport const stable = 1;\nexport const workerOnly = missing;\n" },
  headFiles: { 'src/consumer.ts': 'export const stable = 1;\n' }
});
const missingNewImportDeclarationConflict = missingNewImportDeclarationProject.conflicts.find((conflict) => conflict.code === 'project-output-module-unresolved');
const missingNewImportDeclarationEdge = missingNewImportDeclarationProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './missing.js' && edge.importedName === 'missing');
assert.equal(missingNewImportDeclarationProject.status, 'blocked');
assert.equal(missingNewImportDeclarationProject.admission.reasonCodes.includes('project-output-module-unresolved'), true);
assert.equal(missingNewImportDeclarationProject.summary.outputProjectGraphConflicts, 1);
assert.equal(missingNewImportDeclarationProject.summary.semanticArtifactFiles, 1);
assert.equal(missingNewImportDeclarationEdge.resolutionKind, 'relative-missing');
assert.equal(missingNewImportDeclarationConflict.details.importedNames.includes('missing'), true);

const newImportDeclarationDeltaBaseFiles = {
  'src/consumer.ts': 'export const stable = 1;\n',
  'src/provider.ts': 'export const providerStable = 1;\n'
};
const newImportDeclarationDeltaWorkerFiles = {
  ...newImportDeclarationDeltaBaseFiles,
  'src/consumer.ts': "import { headValue } from './provider.js';\nexport const stable = 1;\nexport const workerUsesHead = headValue;\n"
};
const newImportDeclarationDeltaHeadFiles = {
  ...newImportDeclarationDeltaBaseFiles,
  'src/provider.ts': 'export const providerStable = 1;\nexport const headValue = 2;\n'
};
const newImportDeclarationDeltaProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_new_import_declaration_delta_graph',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: newImportDeclarationDeltaBaseFiles,
  workerFiles: newImportDeclarationDeltaWorkerFiles,
  headFiles: newImportDeclarationDeltaHeadFiles
});
const newImportDeclarationDeltaConflict = newImportDeclarationDeltaProject.conflicts.find((conflict) => conflict.code === 'project-import-target-delta-conflict');
const newImportDeclarationDeltaEdge = newImportDeclarationDeltaProject.projectGraphDelta.stages.output.projectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === './provider.js' && edge.importedName === 'headValue');
assert.equal(newImportDeclarationDeltaProject.status, 'blocked');
assert.equal(newImportDeclarationDeltaProject.admission.reasonCodes.includes('project-import-target-delta-conflict'), true);
assert.equal(newImportDeclarationDeltaProject.summary.projectGraphImportTargetConflicts, 1);
assert.equal(newImportDeclarationDeltaProject.projectGraphDelta.summary.importTargetConflicts, 1);
assert.equal(newImportDeclarationDeltaProject.summary.semanticArtifactFiles, 2);
assert.equal(newImportDeclarationDeltaEdge.resolvedTargetSymbolId, 'symbol:typescript:export:headvalue');
assert.equal(newImportDeclarationDeltaConflict.details.workerTargetSymbolId, undefined);
assert.equal(newImportDeclarationDeltaConflict.details.outputTargetSymbolId, 'symbol:typescript:export:headvalue');
