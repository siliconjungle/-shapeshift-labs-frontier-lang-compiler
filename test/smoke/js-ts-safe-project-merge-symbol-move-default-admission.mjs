import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const movedExport = 'export const moved = 1;\n';
const importMovedLine = (specifier) => `import { moved } from '${specifier}';`;
const useMovedFromA = [importMovedLine('./a'), 'export const value = moved;', ''].join('\n');
const useMovedFromB = [importMovedLine('./b'), 'export const value = moved;', ''].join('\n');
const moveFiles = [
  { sourcePath: 'src/a.ts', baseSourceText: movedExport, workerSourceText: '', headSourceText: movedExport },
  { sourcePath: 'src/b.ts', workerSourceText: movedExport },
  { sourcePath: 'src/use.ts', baseSourceText: useMovedFromA, workerSourceText: useMovedFromB, headSourceText: useMovedFromA }
];

const workerSymbolMoveDefaultAdmitted = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_move_default_admitted',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  files: moveFiles
});
assert.equal(workerSymbolMoveDefaultAdmitted.status, 'merged');
assert.notEqual(workerSymbolMoveDefaultAdmitted.projectGraphDelta, undefined);
assert.equal(workerSymbolMoveDefaultAdmitted.summary.projectSymbolMoveClassifications, 2);
assert.equal(workerSymbolMoveDefaultAdmitted.summary.projectSymbolMoveAdmissions, 2);
assert.equal(workerSymbolMoveDefaultAdmitted.summary.projectExportedSymbolMoveAdmissions, 1);
assert.equal(workerSymbolMoveDefaultAdmitted.summary.projectImportedSymbolMoveAdmissions, 1);
assert.equal(workerSymbolMoveDefaultAdmitted.outputDiagnosticsGate.status, 'passed');
assert.equal(workerSymbolMoveDefaultAdmitted.outputDeclarationGate.status, 'passed');
assert.equal(workerSymbolMoveDefaultAdmitted.evidence.some((record) => (
  record.kind === 'js-ts-project-symbol-move-admission'
  && record.defaultAdmission === true
  && record.details.defaultAdmissionProof.route === 'default-exact-exported-symbol-move'
  && record.details.defaultAdmissionProof.importRewriteCount === 1
)), true);
assert.equal(workerSymbolMoveDefaultAdmitted.files.every((file) => (
  file.summary.projectSymbolMoveAdmissionEvidence.every((record) => (
    record.defaultAdmission === true
    && record.details.defaultAdmissionProof.requiredEvidence.includes('project-graph-delta-evidence')
    && record.details.defaultAdmissionProof.requiredEvidence.includes('output-diagnostics-gate')
    && record.details.defaultAdmissionProof.requiredEvidence.includes('output-declaration-gate')
  ))
)), true);

const workerSymbolMoveWithoutGraphStillBlocked = safeMergeJsTsProject({
  id: 'js_ts_project_worker_symbol_move_without_graph_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  files: moveFiles
});
assert.equal(workerSymbolMoveWithoutGraphStillBlocked.status, 'blocked');
assert.equal(workerSymbolMoveWithoutGraphStillBlocked.summary.projectSymbolMoveAdmissions, 0);
assert.equal(workerSymbolMoveWithoutGraphStillBlocked.admission.reasonCodes.includes('project-worker-exported-symbol-move-blocked'), true);
assert.equal(workerSymbolMoveWithoutGraphStillBlocked.evidence.some((record) => record.kind === 'js-ts-project-symbol-move-admission'), false);

const alsoMovedExport = 'export const alsoMoved = 2;\n';
const useAlsoMovedFromC = [importMovedLine('./c').replace('moved', 'alsoMoved'), 'export const other = alsoMoved;', ''].join('\n');
const useAlsoMovedFromD = [importMovedLine('./d').replace('moved', 'alsoMoved'), 'export const other = alsoMoved;', ''].join('\n');
const workerMultipleSymbolMovesDefaultAdmitted = safeMergeJsTsProject({
  id: 'js_ts_project_worker_multiple_symbol_moves_default_admitted',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  files: [
    ...moveFiles,
    { sourcePath: 'src/c.ts', baseSourceText: alsoMovedExport, workerSourceText: '', headSourceText: alsoMovedExport },
    { sourcePath: 'src/d.ts', workerSourceText: alsoMovedExport },
    { sourcePath: 'src/also-use.ts', baseSourceText: useAlsoMovedFromC, workerSourceText: useAlsoMovedFromD, headSourceText: useAlsoMovedFromC }
  ]
});
assert.equal(workerMultipleSymbolMovesDefaultAdmitted.status, 'merged');
assert.equal(workerMultipleSymbolMovesDefaultAdmitted.summary.projectExportedSymbolMoveClassifications, 2);
assert.equal(workerMultipleSymbolMovesDefaultAdmitted.summary.projectImportedSymbolMoveClassifications, 2);
assert.equal(workerMultipleSymbolMovesDefaultAdmitted.summary.projectSymbolMoveAdmissions, 4);
assert.equal(workerMultipleSymbolMovesDefaultAdmitted.summary.projectExportedSymbolMoveAdmissions, 2);
assert.equal(workerMultipleSymbolMovesDefaultAdmitted.summary.projectImportedSymbolMoveAdmissions, 2);
assert.equal(new Set(workerMultipleSymbolMovesDefaultAdmitted.evidence.filter((record) => (
  record.kind === 'js-ts-project-symbol-move-admission'
  && record.defaultAdmission === true
  && record.details.defaultAdmissionProof.route === 'default-exact-exported-symbol-move'
)).map((record) => record.details.conflictKey)).size, 4);

const workerDuplicateExportDefaultBlocked = safeMergeJsTsProject({
  id: 'js_ts_project_worker_duplicate_export_default_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  files: [
    { sourcePath: 'src/a.ts', baseSourceText: movedExport, workerSourceText: movedExport, headSourceText: movedExport },
    { sourcePath: 'src/b.ts', workerSourceText: movedExport },
    { sourcePath: 'src/use.ts', baseSourceText: useMovedFromA, workerSourceText: useMovedFromA, headSourceText: useMovedFromA }
  ]
});
assert.equal(workerDuplicateExportDefaultBlocked.status, 'blocked');
assert.equal(workerDuplicateExportDefaultBlocked.admission.reasonCodes.includes('project-worker-exported-symbol-move-duplicate-export-blocked'), true);
assert.equal(workerDuplicateExportDefaultBlocked.summary.projectSymbolMoveAdmissions, 0);
assert.equal(workerDuplicateExportDefaultBlocked.evidence.some((record) => record.kind === 'js-ts-project-symbol-move-admission'), false);

const workerStaleImportDefaultBlocked = safeMergeJsTsProject({
  id: 'js_ts_project_worker_stale_import_default_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  files: [
    { sourcePath: 'src/a.ts', baseSourceText: movedExport, workerSourceText: '', headSourceText: movedExport },
    { sourcePath: 'src/b.ts', workerSourceText: movedExport },
    { sourcePath: 'src/use.ts', baseSourceText: useMovedFromA, workerSourceText: useMovedFromA, headSourceText: useMovedFromA }
  ]
});
assert.equal(workerStaleImportDefaultBlocked.status, 'blocked');
assert.equal(workerStaleImportDefaultBlocked.admission.reasonCodes.includes('project-worker-imported-symbol-move-stale-import-blocked'), true);
assert.equal(workerStaleImportDefaultBlocked.summary.projectSymbolMoveAdmissions, 0);
assert.equal(workerStaleImportDefaultBlocked.evidence.some((record) => record.kind === 'js-ts-project-symbol-move-admission'), false);

const generatedUseFromA = [importMovedLine('./a.generated'), 'export const value = moved;', ''].join('\n');
const generatedUseFromB = [importMovedLine('./b.generated'), 'export const value = moved;', ''].join('\n');
const workerGeneratedOutputMoveDefaultBlocked = safeMergeJsTsProject({
  id: 'js_ts_project_worker_generated_output_move_default_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  files: [
    { sourcePath: 'dist/a.generated.ts', baseSourceText: movedExport, workerSourceText: '', headSourceText: movedExport },
    { sourcePath: 'dist/b.generated.ts', workerSourceText: movedExport },
    { sourcePath: 'dist/use.generated.ts', baseSourceText: generatedUseFromA, workerSourceText: generatedUseFromB, headSourceText: generatedUseFromA }
  ]
});
assert.equal(workerGeneratedOutputMoveDefaultBlocked.status, 'blocked');
assert.equal(workerGeneratedOutputMoveDefaultBlocked.admission.reasonCodes.includes('project-worker-exported-symbol-move-generated-output-boundary-blocked'), true);
assert.equal(workerGeneratedOutputMoveDefaultBlocked.summary.projectSymbolMoveAdmissions, 0);
assert.equal(workerGeneratedOutputMoveDefaultBlocked.evidence.some((record) => record.kind === 'js-ts-project-symbol-move-admission'), false);
