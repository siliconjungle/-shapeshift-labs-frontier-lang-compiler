import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';
import './js-ts-safe-project-merge-symbol-move-default-admission.mjs';
import { typeScriptProgramForFiles } from './js-ts-compiler-program-helpers.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const movedSource = [
  'export function moved(value: number) {',
  '  return value + 1;',
  '}',
  ''
].join('\n');

const workerMove = safeMergeJsTsProject({
  id: 'js_ts_project_worker_file_move_rename_blocked',
  language: 'typescript',
  files: [
    {
      sourcePath: 'src/old-name.ts',
      baseSourceText: movedSource,
      headSourceText: movedSource,
      workerDeleted: true
    },
    {
      sourcePath: 'src/new-name.ts',
      workerSourceText: movedSource
    }
  ]
});
assert.equal(workerMove.status, 'blocked');
assert.equal(workerMove.summary.projectMoveRenameClassifications, 1);
assert.equal(workerMove.summary.projectFileMoveRenameClassifications, 1);
assert.equal(workerMove.summary.operations['blocked-worker-file-move-rename'], 2);
assert.equal(workerMove.admission.reasonCodes.includes('project-worker-file-move-rename-blocked'), true);
assert.equal(workerMove.conflicts.every((conflict) => conflict.gateId === 'project-move-rename-classifier'), true);
assert.equal(workerMove.metadata.projectMoveRenameClassifications.reasonCodes.includes('project-worker-file-move-rename-blocked'), true);

const headMove = safeMergeJsTsProject({
  id: 'js_ts_project_head_file_move_rename_blocked',
  language: 'typescript',
  files: [
    {
      sourcePath: 'src/current.ts',
      baseSourceText: movedSource,
      workerSourceText: movedSource,
      headDeleted: true
    },
    {
      sourcePath: 'src/renamed.ts',
      headSourceText: movedSource
    }
  ]
});
assert.equal(headMove.status, 'blocked');
assert.equal(headMove.summary.projectMoveRenameClassifications, 1);
assert.equal(headMove.summary.operations['blocked-head-file-move-rename'], 2);
assert.equal(headMove.admission.reasonCodes.includes('project-head-file-move-rename-blocked'), true);
assert.equal(headMove.conflicts.some((conflict) => conflict.details.movementKind === 'rename'), true);

const movedExport = 'export const moved = 1;\n';
const workerExportedSymbolMove = safeMergeJsTsProject({
  id: 'js_ts_project_worker_exported_symbol_move_blocked',
  language: 'typescript',
  files: [
    {
      sourcePath: 'src/a.ts',
      baseSourceText: movedExport,
      workerSourceText: '',
      headSourceText: movedExport
    },
    {
      sourcePath: 'src/b.ts',
      workerSourceText: movedExport
    }
  ]
});
assert.equal(workerExportedSymbolMove.status, 'blocked');
assert.equal(workerExportedSymbolMove.summary.projectFileMoveRenameClassifications, 0);
assert.equal(workerExportedSymbolMove.summary.projectExportedSymbolMoveClassifications, 1);
assert.equal(workerExportedSymbolMove.summary.operations['blocked-worker-exported-symbol-move'], 2);
assert.equal(workerExportedSymbolMove.admission.reasonCodes.includes('project-worker-exported-symbol-move-blocked'), true);
assert.equal(workerExportedSymbolMove.conflicts.some((conflict) => (
  conflict.details.symbolMoveKind === 'exported'
  && conflict.details.requiredEvidence.includes('symbol-lineage-evidence')
  && conflict.details.requiredEvidence.includes('output-declaration-gate')
)), true);

const importMovedLine = (specifier) => `import { moved } from '${specifier}';`;
const useMovedFromA = [importMovedLine('./a'), 'export const value = moved;', ''].join('\n');
const useMovedFromB = [importMovedLine('./b'), 'export const value = moved;', ''].join('\n');
const workerImportedSymbolMove = safeMergeJsTsProject({
  id: 'js_ts_project_worker_imported_symbol_move_blocked',
  language: 'typescript',
  files: [
    {
      sourcePath: 'src/a.ts',
      baseSourceText: movedExport,
      workerSourceText: movedExport,
      headSourceText: movedExport
    },
    {
      sourcePath: 'src/b.ts',
      workerSourceText: movedExport
    },
    {
      sourcePath: 'src/use.ts',
      baseSourceText: useMovedFromA,
      workerSourceText: useMovedFromB,
      headSourceText: useMovedFromA
    }
  ]
});
assert.equal(workerImportedSymbolMove.status, 'blocked');
assert.equal(workerImportedSymbolMove.summary.projectFileMoveRenameClassifications, 0);
assert.equal(workerImportedSymbolMove.summary.projectImportedSymbolMoveClassifications, 1);
assert.equal(workerImportedSymbolMove.summary.operations['blocked-worker-imported-symbol-move'], 1);
assert.equal(workerImportedSymbolMove.admission.reasonCodes.includes('project-worker-imported-symbol-move-blocked'), true);
assert.equal(workerImportedSymbolMove.conflicts.some((conflict) => (
  conflict.details.symbolMoveKind === 'imported'
  && conflict.details.fromSourcePath === 'src/a.ts'
  && conflict.details.toSourcePath === 'src/b.ts'
  && conflict.details.graphEvidence.worker.importEdge.resolvedModulePath === 'src/b.ts'
)), true);

const workerStaleImportSymbolMove = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_move_stale_import_blocked',
  language: 'typescript',
  files: [
    { sourcePath: 'src/a.ts', baseSourceText: movedExport, workerSourceText: '', headSourceText: movedExport },
    { sourcePath: 'src/b.ts', workerSourceText: movedExport },
    { sourcePath: 'src/use.ts', baseSourceText: useMovedFromA, workerSourceText: useMovedFromA, headSourceText: useMovedFromA }
  ]
});
assert.equal(workerStaleImportSymbolMove.status, 'blocked');
assert.equal(workerStaleImportSymbolMove.conflicts.some((conflict) => (
  conflict.code === 'project-worker-imported-symbol-move-stale-import-blocked'
  && conflict.details.ambiguityKind === 'stale-import-reference'
)), true);

const workerDuplicateExportedSymbolMove = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_move_duplicate_export_blocked',
  language: 'typescript',
  files: [
    { sourcePath: 'src/a.ts', baseSourceText: movedExport, workerSourceText: movedExport, headSourceText: movedExport },
    { sourcePath: 'src/b.ts', workerSourceText: movedExport }
  ]
});
assert.equal(workerDuplicateExportedSymbolMove.status, 'blocked');
assert.equal(workerDuplicateExportedSymbolMove.admission.reasonCodes.includes('project-worker-exported-symbol-move-duplicate-export-blocked'), true);
assert.equal(workerDuplicateExportedSymbolMove.conflicts.some((conflict) => (
  conflict.code === 'project-worker-exported-symbol-move-duplicate-export-blocked'
  && conflict.details.ambiguityKind === 'duplicate-export'
  && conflict.details.candidateSourcePaths.includes('src/a.ts')
  && conflict.details.candidateSourcePaths.includes('src/b.ts')
)), true);
assert.equal(workerDuplicateExportedSymbolMove.summary.projectSymbolMoveAdmissions, 0);

const workerSymbolMoveAdmitted = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_move_admitted',
  language: 'typescript',
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  allowProjectSymbolMoves: true,
  typescript,
  files: [
    {
      sourcePath: 'src/a.ts',
      baseSourceText: movedExport,
      workerSourceText: '',
      headSourceText: movedExport
    },
    {
      sourcePath: 'src/b.ts',
      workerSourceText: movedExport
    },
    {
      sourcePath: 'src/use.ts',
      baseSourceText: useMovedFromA,
      workerSourceText: useMovedFromB,
      headSourceText: useMovedFromA
    }
  ]
});
assert.equal(workerSymbolMoveAdmitted.status, 'merged');
assert.equal(workerSymbolMoveAdmitted.summary.projectSymbolMoveClassifications, 2);
assert.equal(workerSymbolMoveAdmitted.summary.projectSymbolMoveAdmissions, 2);
assert.equal(workerSymbolMoveAdmitted.summary.projectExportedSymbolMoveAdmissions, 1);
assert.equal(workerSymbolMoveAdmitted.summary.projectImportedSymbolMoveAdmissions, 1);
assert.equal(workerSymbolMoveAdmitted.outputFiles.find((file) => file.sourcePath === 'src/a.ts').sourceText, '');
assert.equal(workerSymbolMoveAdmitted.outputFiles.find((file) => file.sourcePath === 'src/b.ts').sourceText, movedExport);
assert.equal(workerSymbolMoveAdmitted.outputFiles.find((file) => file.sourcePath === 'src/use.ts').sourceText, useMovedFromB);
assert.equal(workerSymbolMoveAdmitted.outputDiagnosticsGate.status, 'passed');
assert.equal(workerSymbolMoveAdmitted.outputDeclarationGate.status, 'passed');
assert.equal(workerSymbolMoveAdmitted.evidence.some((record) => record.kind === 'js-ts-project-symbol-move-admission'), true);
assert.equal(workerSymbolMoveAdmitted.confidence.evidenceIds.some((id) => id.includes('symbol_move')), true);

const renameBaseFiles = {
  'src/provider.ts': 'export const oldName = 1;\n',
  'src/use.ts': "import { oldName } from './provider.js';\nexport const value = oldName;\n"
};
const renameWorkerFiles = {
  'src/provider.ts': 'export const newName = 1;\n',
  'src/use.ts': "import { newName } from './provider.js';\nexport const value = newName;\n"
};
const renameMissingTypeScriptRefactorEvidence = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_rename_missing_typescript_refactor_evidence',
  language: 'typescript',
  allowProjectSymbolRenames: true,
  requireTypeScriptRefactorEvidence: true,
  baseFiles: renameBaseFiles,
  workerFiles: renameWorkerFiles,
  headFiles: renameBaseFiles
});
assert.equal(renameMissingTypeScriptRefactorEvidence.status, 'blocked');
assert.equal(renameMissingTypeScriptRefactorEvidence.admission.reasonCodes.includes('project-typescript-refactor-evidence-missing'), true);
assert.equal(renameMissingTypeScriptRefactorEvidence.conflicts.some((conflict) => (
  conflict.code === 'project-typescript-refactor-evidence-missing'
  && conflict.details.typeScriptRefactorEvidence.status === 'failed'
  && conflict.details.typeScriptRefactorEvidence.metadata.missing.some((item) => item.code === 'typescript-refactor-project-import-missing')
)), true);
assert.equal(renameMissingTypeScriptRefactorEvidence.evidence.some((record) => (
  record.kind === 'typescript-language-service-refactor-evidence-oracle'
  && record.status === 'failed'
)), true);

const renameWithTypeScriptRefactorEvidence = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_rename_with_typescript_refactor_evidence',
  language: 'typescript',
  allowProjectSymbolRenames: true,
  requireTypeScriptRefactorEvidence: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  baseFiles: renameBaseFiles,
  workerFiles: renameWorkerFiles,
  headFiles: renameBaseFiles,
  baseProjectImports: await parserBackedImportsForFiles(renameBaseFiles),
  workerProjectImports: await parserBackedImportsForFiles(renameWorkerFiles),
  headProjectImports: await parserBackedImportsForFiles(renameBaseFiles)
});
assert.equal(renameWithTypeScriptRefactorEvidence.status, 'merged');
assert.equal(renameWithTypeScriptRefactorEvidence.summary.projectCrossFileSymbolRenameAdmissions, 1);
assert.equal(renameWithTypeScriptRefactorEvidence.outputDiagnosticsGate.status, 'passed');
assert.equal(renameWithTypeScriptRefactorEvidence.outputDeclarationGate.status, 'passed');
assert.equal(renameWithTypeScriptRefactorEvidence.evidence.some((record) => (
  record.kind === 'js-ts-project-symbol-rename-admission'
  && record.details.typeScriptRefactorEvidence.status === 'passed'
  && record.details.typeScriptRefactorEvidence.metadata.requirements.some((item) => item.requirement === 'reference' && item.compilerReferences > 0)
)), true);

const moveBaseFiles = {
  'src/a.ts': movedExport,
  'src/use.ts': useMovedFromA
};
const moveWorkerFiles = {
  'src/a.ts': '',
  'src/b.ts': movedExport,
  'src/use.ts': useMovedFromB
};
const moveMissingTypeScriptRefactorEvidence = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_move_missing_typescript_refactor_evidence',
  language: 'typescript',
  allowProjectSymbolMoves: true,
  requireTypeScriptRefactorEvidence: true,
  baseFiles: moveBaseFiles,
  workerFiles: moveWorkerFiles,
  headFiles: moveBaseFiles
});
assert.equal(moveMissingTypeScriptRefactorEvidence.status, 'blocked');
assert.equal(moveMissingTypeScriptRefactorEvidence.admission.reasonCodes.includes('project-typescript-refactor-evidence-missing'), true);
assert.equal(moveMissingTypeScriptRefactorEvidence.conflicts.some((conflict) => (
  conflict.code === 'project-typescript-refactor-evidence-missing'
  && conflict.details.typeScriptRefactorEvidence.status === 'failed'
)), true);
assert.equal(moveMissingTypeScriptRefactorEvidence.evidence.some((record) => (
  record.kind === 'typescript-language-service-refactor-evidence-oracle'
  && record.status === 'failed'
)), true);

const moveWithTypeScriptRefactorEvidence = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_move_with_typescript_refactor_evidence',
  language: 'typescript',
  allowProjectSymbolMoves: true,
  requireTypeScriptRefactorEvidence: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  baseFiles: moveBaseFiles,
  workerFiles: moveWorkerFiles,
  headFiles: moveBaseFiles,
  baseProjectImports: await parserBackedImportsForFiles(moveBaseFiles),
  workerProjectImports: await parserBackedImportsForFiles(moveWorkerFiles),
  headProjectImports: await parserBackedImportsForFiles(moveBaseFiles)
});
assert.equal(moveWithTypeScriptRefactorEvidence.status, 'merged');
assert.equal(moveWithTypeScriptRefactorEvidence.summary.projectImportedSymbolMoveAdmissions, 1);
assert.equal(moveWithTypeScriptRefactorEvidence.outputDiagnosticsGate.status, 'passed');
assert.equal(moveWithTypeScriptRefactorEvidence.outputDeclarationGate.status, 'passed');
assert.equal(moveWithTypeScriptRefactorEvidence.evidence.some((record) => (
  record.kind === 'js-ts-project-symbol-move-admission'
  && record.details.typeScriptRefactorEvidence.status === 'passed'
  && record.details.typeScriptRefactorEvidence.metadata.requirements.some((item) => item.requirement === 'reference' && item.compilerReferences > 0)
)), true);

function parserBackedImportsForFiles(files) {
  const program = typeScriptProgramForFiles(typescript, files);
  const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript, program });
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(adapter, {
    language: 'typescript',
    sourcePath,
    sourceText,
    adapterOptions: { sourceFile: program.getSourceFile(sourcePath) }
  })));
}
