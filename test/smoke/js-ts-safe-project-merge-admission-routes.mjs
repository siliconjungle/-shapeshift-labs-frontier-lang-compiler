import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectAdmissionRouteFromMissingEvidence } from '../../src/js-ts-safe-project-merge-admission-routes.js';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const missingDiagnosticsRoute = safeMergeJsTsProject({
  id: 'js_ts_project_admission_routes_missing_diagnostics',
  language: 'typescript',
  baseFiles: { 'src/value.ts': 'export const value = 1;\n' },
  workerFiles: { 'src/value.ts': 'export const value = 2;\n' },
  headFiles: { 'src/value.ts': 'export const value = 1;\n' },
  testGates: { id: 'admission-routes', status: 'passed', command: 'node test/smoke/js-ts-safe-project-merge-admission-routes.mjs' }
});
const missingRoute = routeById(missingDiagnosticsRoute, 'run-output-diagnostics');
assert.equal(missingRoute.routeKind, 'review');
assert.equal(missingRoute.source, 'missing-evidence');
assert.equal(missingRoute.semanticEquivalenceClaim, false);
assert.equal(missingDiagnosticsRoute.admission.routeSummary.byRoute['run-output-diagnostics'], 1);

const movedExport = 'export const moved = 1;\n';
const useMovedFromA = "import { moved } from './a.js';\nexport const value = moved;\n";
const useMovedFromB = "import { moved } from './b.js';\nexport const value = moved;\n";
const symbolMoveRoutes = safeMergeJsTsProject({
  id: 'js_ts_project_admission_routes_symbol_move',
  language: 'typescript',
  allowProjectSymbolMoves: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  files: [
    { sourcePath: 'src/a.ts', baseSourceText: movedExport, workerSourceText: '', headSourceText: movedExport },
    { sourcePath: 'src/b.ts', workerSourceText: movedExport },
    { sourcePath: 'src/use.ts', baseSourceText: useMovedFromA, workerSourceText: useMovedFromB, headSourceText: useMovedFromA }
  ]
});
assert.equal(symbolMoveRoutes.status, 'merged');
const moveRoute = routeById(symbolMoveRoutes, 'apply-symbol-move-between-files');
assert.equal(moveRoute.routeKind, 'apply');
assert.equal(moveRoute.routeLane, 'symbol-move-between-files');
assert.equal(moveRoute.action, 'apply');
assert.equal(moveRoute.autoMergeClaim, false);

const renameBaseFiles = {
  'src/provider.ts': 'export const oldName = 1;\n',
  'src/use.ts': "import { oldName } from './provider.js';\nexport const value = oldName;\n"
};
const renameWorkerFiles = {
  'src/provider.ts': 'export const newName = 1;\n',
  'src/use.ts': "import { newName } from './provider.js';\nexport const value = newName;\n"
};
const symbolRenameRoutes = safeMergeJsTsProject({
  id: 'js_ts_project_admission_routes_symbol_rename',
  language: 'typescript',
  allowProjectSymbolRenames: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  baseFiles: renameBaseFiles,
  workerFiles: renameWorkerFiles,
  headFiles: renameBaseFiles
});
assert.equal(symbolRenameRoutes.status, 'merged');
const renameRoute = routeById(symbolRenameRoutes, 'apply-cross-file-symbol-rename');
assert.equal(renameRoute.routeKind, 'apply');
assert.equal(renameRoute.routeLane, 'cross-file-symbol-rename');
assert.equal(renameRoute.semanticEquivalenceClaim, false);

const classSplitBase = [
  'export class Service {',
  '  read() { return 1; }',
  '  write() { return 2; }',
  '}',
  ''
].join('\n');
const classSplitWorker = [
  'export class ReadService {',
  '  read() { return 1; }',
  '}',
  'export class WriteService {',
  '  write() { return 2; }',
  '}',
  ''
].join('\n');
const splitEvidence = {
  language: 'typescript',
  allowProjectSplitMerges: true,
  includeOutputProjectSymbolGraph: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript
};
const splitRoutes = safeMergeJsTsProject({
  ...splitEvidence,
  id: 'js_ts_project_admission_routes_split_apply',
  files: [{ sourcePath: 'src/service.ts', baseSourceText: classSplitBase, workerSourceText: classSplitWorker, headSourceText: classSplitBase }]
});
assert.equal(splitRoutes.status, 'merged');
const splitRoute = routeById(splitRoutes, 'apply-project-split-merge');
assert.equal(splitRoute.routeKind, 'apply');
assert.equal(splitRoute.routeLane, 'split-merge-modules-classes');

const staleSplitRoutes = safeMergeJsTsProject({
  ...splitEvidence,
  id: 'js_ts_project_admission_routes_split_rebase',
  files: [{ sourcePath: 'src/service.ts', baseSourceText: classSplitBase, workerSourceText: classSplitWorker, headSourceText: classSplitBase.replace('return 1;', 'return 10;') }]
});
assert.equal(staleSplitRoutes.status, 'blocked');
const staleRoute = routeById(staleSplitRoutes, 'prove-project-split-merge-current-branch-output');
assert.equal(staleRoute.routeKind, 'rebase');
assert.equal(staleRoute.action, 'rebase');
assert.equal(staleRoute.reasonCodes.includes('other-branch-unchanged-proof'), true);
assert.equal(staleRoute.semanticEquivalenceClaim, false);

const rejectRoute = projectAdmissionRouteFromMissingEvidence({
  code: 'semantic-edit-replay-proof-output-mismatch',
  kind: 'proof-level',
  status: 'failed',
  action: 'reject-proof',
  routeId: 'reject-semantic-edit-replay-output-mismatch',
  routeLane: 'source-files',
  routeNext: 'inspect-semantic-edit-replay-output-binding'
});
assert.equal(rejectRoute.routeKind, 'reject');
assert.equal(rejectRoute.action, 'reject');
assert.equal(rejectRoute.semanticEquivalenceClaim, false);

const rerunRoute = projectAdmissionRouteFromMissingEvidence({
  code: 'semantic-edit-replay-proof-stale-current-source',
  kind: 'proof-level',
  status: 'stale',
  action: 'rerun',
  routeId: 'rerun-semantic-edit-replay-current-head',
  routeLane: 'source-files',
  routeNext: 'rerun-semantic-edit-replay-on-current-head'
});
assert.equal(rerunRoute.routeKind, 'rerun');
assert.equal(rerunRoute.action, 'rerun');
assert.equal(rerunRoute.autoMergeClaim, false);

function routeById(result, routeId) {
  const route = result.admission.routes.find((entry) => entry.routeId === routeId);
  assert.notEqual(route, undefined, `${result.id} missing route ${routeId}`);
  return route;
}
