import { assert } from './helpers.mjs';
import { assertSafeMergeBlocked } from './js-ts-semantic-merge-oracle-helpers.mjs';
import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds, safeMergeJsTsImportsAndDeclarations } from '../../src/js-ts-safe-merge.js';
import { safeMergeJsTsProject, safeMergeJsTsSource } from '../../src/js-ts-semantic-merge.js';

const typeValueImportBindingConflict = safeMergeJsTsImportsAndDeclarations({
  id: 'oracle_unsafe_type_value_import_binding_conflict',
  language: 'typescript',
  sourcePath: 'src/oracles/type-value-import-conflict.ts',
  baseSourceText: [
    "import { parse } from './api.js';",
    'export const stable = parse;',
    ''
  ].join('\n'),
  workerSourceText: [
    "import { parse, type Schema } from './api.js';",
    'export const stable = parse;',
    'export type WorkerSchema = Schema;',
    ''
  ].join('\n'),
  headSourceText: [
    "import { parse, Schema } from './api.js';",
    'export const stable = parse;',
    'export const headSchema = Schema;',
    ''
  ].join('\n')
});
assertSafeMergeBlocked(typeValueImportBindingConflict, JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames);
assert.equal(
  typeValueImportBindingConflict.conflicts.some((conflict) => conflict.details?.specifier === 'type Schema'),
  true,
  JSON.stringify(typeValueImportBindingConflict.conflicts)
);

const enumMemberValueImportDependency = safeMergeJsTsSource({
  id: 'oracle_safe_enum_member_value_import_dependencies',
  language: 'typescript',
  sourcePath: 'src/oracles/status.ts',
  baseSourceText: [
    "import { base } from './values.js';",
    'export enum Status {',
    '  Open = base,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    "import { base, worker } from './values.js';",
    'export enum Status {',
    '  Open = worker,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    "import { base, head } from './values.js';",
    'export enum Status {',
    '  Open = base,',
    '  Closed = head,',
    '}',
    ''
  ].join('\n')
});
assert.equal(enumMemberValueImportDependency.status, 'merged');
assert.equal(enumMemberValueImportDependency.summary.importSpecifierAdditions, 2);
assert.equal(enumMemberValueImportDependency.summary.enumMemberEdits, 1);
assert.equal(enumMemberValueImportDependency.mergedSourceText, [
  "import { base, head, worker } from './values.js';",
  'export enum Status {',
  '  Open = worker,',
  '  Closed = head,',
  '}',
  ''
].join('\n'));

const projectTypeImportDependency = safeMergeJsTsProject({
  id: 'oracle_project_type_import_dependency_output_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: {
    'src/consumer.ts': "import { type Stable } from './types.js';\nexport type Used = Stable;\n",
    'src/types.ts': 'export interface Stable { id: string; }\nexport const runtime = 1;\n'
  },
  workerFiles: {
    'src/consumer.ts': "import { type Stable, type WorkerModel } from './types.js';\nexport type Used = Stable;\nexport type WorkerUsed = WorkerModel;\n",
    'src/types.ts': 'export interface Stable { id: string; }\nexport interface WorkerModel { label: string; }\nexport const runtime = 1;\n'
  },
  headFiles: {
    'src/consumer.ts': "import { type Stable, runtime } from './types.js';\nexport type Used = Stable;\nexport const headUsed = runtime;\n",
    'src/types.ts': 'export interface Stable { id: string; }\nexport const runtime = 1;\n'
  }
});
const projectTypeImportEdge = projectTypeImportDependency.outputProjectSymbolGraph.importEdges.find((edge) => (
  edge.moduleSpecifier === './types.js' && edge.importedName === 'WorkerModel'
));
assert.equal(projectTypeImportDependency.status, 'merged');
assert.equal(projectTypeImportDependency.summary.outputProjectGraphConflicts, 0);
assert.equal(projectTypeImportEdge.importKind, 'type-named');
assert.equal(projectTypeImportEdge.isTypeOnly, true);
assert.equal(projectTypeImportEdge.resolvedTargetSymbolId, 'symbol:typescript:export:workermodel');

const projectTypeImportDependencyDelta = safeMergeJsTsProject({
  id: 'oracle_project_type_import_dependency_delta_conflict',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: {
    'src/consumer.ts': "import { type Stable } from './types.js';\nexport type Used = Stable;\n",
    'src/types.ts': 'export interface Stable { id: string; }\n'
  },
  workerFiles: {
    'src/consumer.ts': "import { type Stable, type HeadModel } from './types.js';\nexport type Used = Stable;\nexport type WorkerUsesHead = HeadModel;\n",
    'src/types.ts': 'export interface Stable { id: string; }\n'
  },
  headFiles: {
    'src/consumer.ts': "import { type Stable } from './types.js';\nexport type Used = Stable;\n",
    'src/types.ts': 'export interface Stable { id: string; }\nexport interface HeadModel { id: string; }\n'
  }
});
const projectTypeImportDeltaConflict = projectTypeImportDependencyDelta.conflicts.find((conflict) => conflict.code === 'project-import-target-delta-conflict');
assert.equal(projectTypeImportDependencyDelta.status, 'blocked');
assert.equal(projectTypeImportDependencyDelta.admission.reasonCodes.includes('project-import-target-delta-conflict'), true);
assert.equal(projectTypeImportDependencyDelta.summary.projectGraphImportTargetConflicts, 1);
assert.equal(projectTypeImportDeltaConflict.details.importKind, 'type-named');
assert.equal(projectTypeImportDeltaConflict.details.outputTargetSymbolId, 'symbol:typescript:export:headmodel');
assert.equal(projectTypeImportDeltaConflict.details.workerTargetSymbolId, undefined);
