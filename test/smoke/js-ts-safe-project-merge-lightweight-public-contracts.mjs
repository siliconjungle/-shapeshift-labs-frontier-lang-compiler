import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const fixtures = [{
  label: 'interface',
  sourcePath: 'src/lightweight-options.ts',
  symbolName: 'Options',
  policy: { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] },
  base: [
    'export interface Options {',
    '  enabled: boolean;',
    '}',
    ''
  ].join('\n'),
  worker: [
    'export interface Options {',
    '  enabled: boolean;',
    '  label?: string;',
    '}',
    ''
  ].join('\n'),
  head: [
    'export interface Options {',
    '  enabled: boolean;',
    '  retries: number;',
    '}',
    ''
  ].join('\n')
}, {
  label: 'type',
  sourcePath: 'src/lightweight-runner.ts',
  symbolName: 'Runner',
  policy: { unorderedRegions: [{ kind: 'type', name: 'Runner', order: 'non-semantic' }] },
  base: [
    'export type Runner = {',
    '  run(): void;',
    '};',
    ''
  ].join('\n'),
  worker: [
    'export type Runner = {',
    '  run(): void;',
    '  stop(): void;',
    '};',
    ''
  ].join('\n'),
  head: [
    'export type Runner = {',
    '  run(): void;',
    '  reset(): void;',
    '};',
    ''
  ].join('\n')
}, {
  label: 'class',
  sourcePath: 'src/lightweight-store.ts',
  symbolName: 'Store',
  policy: { unorderedRegions: [{ kind: 'class', name: 'Store', order: 'non-semantic' }] },
  base: [
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '}',
    ''
  ].join('\n'),
  worker: [
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '',
    '  load(value: string) {',
    '    return value;',
    '  }',
    '}',
    ''
  ].join('\n'),
  head: [
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '',
    '  static create() {',
    '    return new Store();',
    '  }',
    '}',
    ''
  ].join('\n')
}];

for (const fixture of fixtures) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_lightweight_${fixture.label}_public_contract_delta_conflict`,
    language: 'typescript',
    includeProjectGraphDelta: true,
    baseFiles: { [fixture.sourcePath]: fixture.base },
    workerFiles: { [fixture.sourcePath]: fixture.worker },
    headFiles: { [fixture.sourcePath]: fixture.head },
    policyByPath: { [fixture.sourcePath]: fixture.policy }
  });
  const conflict = project.conflicts.find((record) => record.code === 'project-public-contract-delta-conflict');
  assert.equal(project.status, 'blocked');
  assert.equal(project.admission.reasonCodes.includes('project-public-contract-delta-conflict'), true);
  assert.equal(project.summary.projectGraphPublicContractConflicts, 1);
  assert.equal(project.projectGraphDelta.summary.publicContractConflicts, 1);
  assert.equal(project.projectGraphDelta.stages.base.summary.publicContractRegions, 1);
  assert.equal(project.projectGraphDelta.stages.worker.summary.publicContractRegions, 1);
  assert.equal(project.projectGraphDelta.stages.head.summary.publicContractRegions, 1);
  assert.equal(project.projectGraphDelta.stages.output.summary.publicContractRegions, 1);
  assert.equal(conflict.details.identityKey, `source#${fixture.sourcePath}#export#${fixture.symbolName}`);
  assert.equal(conflict.details.worker.contractHash === conflict.details.head.contractHash, false);
}

const exportedDeleteSourcePath = 'src/lightweight-public-delete.ts';
const exportedDeleteBase = [
  'export interface PublicApi {',
  '  read(): string;',
  '}',
  ''
].join('\n');
const exportedDeleteHead = [
  'export interface PublicApi {',
  '  read(): string;',
  '  write(value: string): void;',
  '}',
  ''
].join('\n');
const exportedDeleteProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_lightweight_exported_delete_public_contract_delta_conflict',
  language: 'typescript',
  includeProjectGraphDelta: true,
  allowFileDeletes: true,
  files: [{
    sourcePath: exportedDeleteSourcePath,
    baseSourceText: exportedDeleteBase,
    workerDeleted: true,
    headSourceText: exportedDeleteHead
  }],
  policyByPath: {
    [exportedDeleteSourcePath]: { unorderedRegions: [{ kind: 'interface', name: 'PublicApi', order: 'non-semantic' }] }
  }
});
const exportedDeleteConflict = exportedDeleteProject.conflicts.find((record) => record.code === 'project-public-contract-delta-conflict');
assert.equal(exportedDeleteProject.status, 'blocked');
assert.equal(exportedDeleteProject.summary.operations['worker-deleted'], 1);
assert.equal(exportedDeleteProject.summary.projectGraphPublicContractConflicts, 1);
assert.equal(exportedDeleteProject.admission.reasonCodes.includes('project-public-contract-delta-conflict'), true);
assert.equal(exportedDeleteProject.projectGraphDelta.summary.publicContractConflicts, 1);
assert.equal(exportedDeleteProject.projectGraphDelta.stages.base.summary.publicContractRegions, 1);
assert.equal(exportedDeleteProject.projectGraphDelta.stages.worker.summary.publicContractRegions, 0);
assert.equal(exportedDeleteProject.projectGraphDelta.stages.head.summary.publicContractRegions, 1);
assert.equal(exportedDeleteProject.projectGraphDelta.stages.output.summary.publicContractRegions, 0);
assert.equal(exportedDeleteConflict.details.identityKey, `source#${exportedDeleteSourcePath}#export#PublicApi`);
assert.equal(exportedDeleteConflict.details.base.exportedName, 'PublicApi');
assert.equal(exportedDeleteConflict.details.worker, undefined);
assert.equal(exportedDeleteConflict.details.head.exportedName, 'PublicApi');
assert.equal(exportedDeleteConflict.details.output, undefined);
