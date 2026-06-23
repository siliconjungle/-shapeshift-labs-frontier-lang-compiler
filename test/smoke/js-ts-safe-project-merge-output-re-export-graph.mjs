import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const disjointBaseFiles = {
  'src/barrel.ts': 'export const stable = 1;\n',
  'src/worker.ts': 'export const workerOnly = 1;\n',
  'src/head.ts': 'export const headOnly = 2;\n'
};
const disjointWorkerFiles = {
  ...disjointBaseFiles,
  'src/barrel.ts': "export const stable = 1;\nexport * from './worker.js';\n"
};
const disjointHeadFiles = {
  ...disjointBaseFiles,
  'src/barrel.ts': "export const stable = 1;\nexport * from './head.js';\n"
};
const disjointProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_graph_export_star_disjoint',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: disjointBaseFiles,
  workerFiles: disjointWorkerFiles,
  headFiles: disjointHeadFiles
});
const disjointBarrel = disjointProject.outputFiles.find((file) => file.sourcePath === 'src/barrel.ts');
const disjointNames = disjointProject.outputProjectSymbolGraph.reExportIdentities.map((identity) => identity.exportedName).sort();
assert.equal(disjointProject.status, 'merged');
assert.equal(disjointProject.summary.outputProjectGraphConflicts, 0);
assert.equal(disjointBarrel.sourceText, "export const stable = 1;\nexport * from './head.js';\nexport * from './worker.js';\n");
assert.deepEqual(disjointNames, ['headOnly', 'workerOnly']);

const conflictBaseFiles = {
  'src/barrel.ts': 'export const stable = 1;\n',
  'src/worker.ts': 'export const shared = 1;\n',
  'src/head.ts': 'export const shared = 2;\n'
};
const conflictWorkerFiles = {
  ...conflictBaseFiles,
  'src/barrel.ts': "export const stable = 1;\nexport * from './worker.js';\n"
};
const conflictHeadFiles = {
  ...conflictBaseFiles,
  'src/barrel.ts': "export const stable = 1;\nexport * from './head.js';\n"
};
const conflictProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_output_graph_export_star_conflict',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: conflictBaseFiles,
  workerFiles: conflictWorkerFiles,
  headFiles: conflictHeadFiles
});
const conflict = conflictProject.conflicts.find((entry) => entry.code === 'project-output-re-export-identity-conflict');
assert.equal(conflictProject.status, 'blocked');
assert.equal(conflictProject.summary.blockedFiles, 0);
assert.equal(conflictProject.summary.outputProjectGraphConflicts, 1);
assert.equal(conflictProject.admission.reasonCodes.includes('project-output-re-export-identity-conflict'), true);
assert.equal(conflict.details.identityKey, 're-export-identity#src/barrel.ts#shared');
assert.deepEqual(conflict.details.records.map((record) => record.moduleSpecifier).sort(), ['./head.js', './worker.js']);
