import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';

const twoFileProject = {
  baseFiles: { 'src/a.ts': 'export const a = 1;\n', 'src/b.ts': 'export const b = 2;\n' },
  workerFiles: { 'src/a.ts': 'export const a = 1;\n', 'src/b.ts': 'export const b = 2;\n' },
  headFiles: { 'src/a.ts': 'export const a = 1;\n', 'src/b.ts': 'export const b = 2;\n' }
};

const fileLimitProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_project_graph_file_limit',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  projectGraphLimits: { maxFiles: 1 },
  ...twoFileProject
});
const fileLimitConflict = fileLimitProject.conflicts.find((conflict) => conflict.code === 'project-graph-limit-exceeded');
assert.equal(fileLimitProject.status, 'blocked');
assert.equal(fileLimitProject.summary.projectGraphLimitConflicts, 1);
assert.equal(fileLimitProject.summary.outputProjectGraphConflicts, 1);
assert.equal(fileLimitProject.metadata.outputProjectGraphConflicts, 1);
assert.equal(fileLimitProject.outputProjectImport, undefined);
assert.equal(fileLimitProject.outputProjectSymbolGraph, undefined);
assert.equal(fileLimitConflict.details.stage, 'output');
assert.equal(fileLimitConflict.details.limitKind, 'source-files');
assert.equal(fileLimitConflict.details.actual, 2);
assert.equal(fileLimitConflict.details.limit, 1);

const sourceByteLimitProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_project_graph_source_byte_limit',
  language: 'typescript',
  includeProjectGraphDelta: true,
  projectGraphLimits: { maxSourceBytes: 8 },
  baseFiles: { 'src/bytes.ts': 'export const bytes = 1;\n' },
  workerFiles: { 'src/bytes.ts': 'export const bytes = 1;\nexport const worker = 1;\n' },
  headFiles: { 'src/bytes.ts': 'export const bytes = 1;\n' }
});
assert.equal(sourceByteLimitProject.status, 'blocked');
assert.equal(sourceByteLimitProject.summary.projectGraphLimitConflicts, 4);
assert.equal(sourceByteLimitProject.summary.projectGraphDeltaConflicts, 4);
assert.equal(sourceByteLimitProject.metadata.projectGraphDeltaConflicts, 4);
assert.equal(sourceByteLimitProject.projectGraphDelta.summary.limitConflicts, 4);
assert.equal(sourceByteLimitProject.projectGraphDelta.stages.base.summary.sourceBytes > 8, true);
assert.equal(sourceByteLimitProject.projectGraphDelta.stages.base.summary.limitConflicts, 1);
assert.equal(sourceByteLimitProject.projectGraphDelta.stages.base.limitConflicts[0].details.limitKind, 'source-bytes');
assert.equal(sourceByteLimitProject.projectGraphDelta.stages.base.projectImport, undefined);

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
const importEdgeLimitProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_project_graph_import_edge_limit',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  projectGraphLimits: { maxImportEdges: 0 },
  baseFiles: crossBranchBaseFiles,
  workerFiles: crossBranchWorkerFiles,
  headFiles: crossBranchHeadFiles
});
const importEdgeLimitConflict = importEdgeLimitProject.conflicts.find((conflict) => conflict.details?.limitKind === 'import-edges');
assert.equal(importEdgeLimitProject.status, 'blocked');
assert.equal(importEdgeLimitProject.summary.projectGraphLimitConflicts, 1);
assert.equal(importEdgeLimitProject.summary.outputProjectGraphConflicts, 1);
assert.equal(importEdgeLimitProject.outputProjectImport, undefined);
assert.equal(importEdgeLimitProject.outputProjectSymbolGraph, undefined);
assert.equal(importEdgeLimitConflict.details.actual > 0, true);
assert.equal(importEdgeLimitConflict.details.limit, 0);

const staleImportEdgeLimitProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_project_graph_stale_import_edge_limit',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  projectGraphLimits: { maxImportEdges: 0 },
  outputProjectImports: [importNativeSource({
    language: 'typescript',
    sourcePath: 'src/consumer.ts',
    sourceText: 'export const stale = 0;\n'
  })],
  baseFiles: {
    'src/consumer.ts': "import { dep } from './dep.js';\nexport const used = dep;\n",
    'src/dep.ts': 'export const dep = 1;\n'
  },
  workerFiles: {
    'src/consumer.ts': "import { dep } from './dep.js';\nexport const used = dep;\n",
    'src/dep.ts': 'export const dep = 1;\n'
  },
  headFiles: {
    'src/consumer.ts': "import { dep } from './dep.js';\nexport const used = dep;\n",
    'src/dep.ts': 'export const dep = 1;\n'
  }
});
const staleImportEdgeLimitConflict = staleImportEdgeLimitProject.conflicts.find((conflict) => conflict.details?.limitKind === 'import-edges');
assert.equal(staleImportEdgeLimitProject.status, 'blocked');
assert.equal(staleImportEdgeLimitConflict.details.actual > 0, true);
assert.equal(staleImportEdgeLimitProject.outputProjectImport, undefined);

const serializedLimitProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_project_graph_serialized_limit',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  projectGraphLimits: { maxSerializedBytes: 1 },
  baseFiles: { 'src/tiny.ts': 'export const tiny = 1;\n' },
  workerFiles: { 'src/tiny.ts': 'export const tiny = 1;\n' },
  headFiles: { 'src/tiny.ts': 'export const tiny = 1;\n' }
});
const serializedLimitConflict = serializedLimitProject.conflicts.find((conflict) => conflict.details?.limitKind === 'serialized-bytes');
assert.equal(serializedLimitProject.status, 'blocked');
assert.equal(serializedLimitProject.summary.projectGraphLimitConflicts, 1);
assert.equal(serializedLimitProject.summary.outputProjectGraphConflicts, 1);
assert.equal(serializedLimitProject.outputProjectImport, undefined);
assert.equal(serializedLimitProject.outputProjectSymbolGraph, undefined);
assert.equal(serializedLimitConflict.details.actual > 1, true);
assert.equal(serializedLimitConflict.details.limit, 1);

for (const invalidLimit of [Number.NaN, -1, Infinity]) {
  const invalidLimitProject = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_project_graph_invalid_limit_${String(invalidLimit)}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    projectGraphLimits: { maxFiles: invalidLimit },
    baseFiles: { 'src/invalid.ts': 'export const invalid = 1;\n' },
    workerFiles: { 'src/invalid.ts': 'export const invalid = 1;\n' },
    headFiles: { 'src/invalid.ts': 'export const invalid = 1;\n' }
  });
  const invalidLimitConflict = invalidLimitProject.conflicts.find((conflict) => conflict.code === 'project-graph-limit-invalid');
  assert.equal(invalidLimitProject.status, 'blocked');
  assert.equal(invalidLimitProject.admission.reasonCodes.includes('project-graph-limit-invalid'), true);
  assert.equal(invalidLimitProject.summary.projectGraphLimitConflicts, 1);
  assert.equal(invalidLimitProject.outputProjectImport, undefined);
  assert.equal(invalidLimitProject.outputProjectSymbolGraph, undefined);
  assert.equal(invalidLimitConflict.details.limitKind, 'source-files');
}
