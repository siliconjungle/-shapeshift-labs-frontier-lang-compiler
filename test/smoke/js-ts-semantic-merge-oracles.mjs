import { assert } from './helpers.mjs';
import {
  assertCorpusFixture,
  assertSafeMergeBlocked,
  assertSafeMergeCorpusFixture,
  corpus,
  fixturesById
} from './js-ts-semantic-merge-oracle-helpers.mjs';
import { createJsTsSemanticConflictSidecars } from '../../src/js-ts-semantic-conflict-sidecars.js';
import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds, safeMergeJsTsImportsAndDeclarations } from '../../src/js-ts-safe-merge.js';
import { mergeJsTsSafeMemberAdditions } from '../../src/js-ts-safe-member-merge.js';
for (const coverage of [
  'imports', 'import-specifier-order', 'import-shape-additions', 'new-import-declarations',
  'type-only-imports',
  'value-import-dependencies',
  'exports',
  'exported-types',
  'conflicting-exports',
  'dependency-sensitive-edits',
  'composed-safe-merge',
  'import-meta-host-context',
  'interfaces',
  'type-aliases',
  'type-interface-members',
  'object-members',
  'member-duplicate-keys',
  'order-sensitive-member-regions',
  'source-ledger-spans',
  'computed-keys',
  'decorators',
  'overloads',
  'tsx-jsx-text',
  'jsx-ish-source',
  'malformed-stale-edits',
  'comments-trivia',
  'generated-source-map-boundary'
]) {
  assert.equal(corpus.coverageRequirements.includes(coverage), true, `missing oracle coverage requirement ${coverage}`);
  assert.equal(
    corpus.fixtures.some((fixture) => fixture.coverage.includes(coverage)),
    true,
    `missing concrete oracle fixture for ${coverage}`
  );
}

assertCorpusFixture('imports-independent-additions', 'accepted', ['added-anchor-absent-from-head']);
assertCorpusFixture('exports-independent-additions', 'accepted', ['added-anchor-absent-from-head']);
assertCorpusFixture('conflicting-export-additions', 'rejected', ['duplicate-export-name']);
assertCorpusFixture('interface-member-independent-additions', 'accepted', ['added-anchor-absent-from-head']);
assertCorpusFixture('type-alias-member-independent-additions', 'accepted', ['added-anchor-absent-from-head']);
assertCorpusFixture('object-member-independent-additions', 'accepted', ['added-anchor-absent-from-head']);
assertCorpusFixture('tsx-jsx-text-control-flow', 'accepted', ['head-anchor-matches-base']);
assertCorpusFixture('overload-body-prefix-merge', 'accepted', ['head-anchor-matches-base']);
assertCorpusFixture('decorator-stale-malformed-conflicts', 'rejected', [
  'parser-or-ledger-loss',
  'malformed-syntax-tree',
  'stale-source-hash',
  'unsupported-decorator-merge-anchor'
]);
assertCorpusFixture('comments-trivia-source-ledger', 'accepted');
assertCorpusFixture('generated-source-map-boundary', 'rejected', ['generated-source-boundary', 'source-map-boundary']);
assertCorpusFixture('unsafe-object-same-member-conflict', 'rejected', ['head-anchor-changed-since-base']);
assertCorpusFixture('unsafe-control-flow-conflict', 'rejected', ['head-anchor-changed-since-base']);
assertCorpusFixture('unsafe-import-meta-host-context-divergence', 'rejected', [
  'effect-import-meta-merge-requires-host-context-evidence',
  'runtime-order-import-meta-merge-requires-host-context-evidence'
]);
assertCorpusFixture('unsafe-delete-modify-conflict', 'rejected', ['head-anchor-changed-since-base']);
assertCorpusFixture('safe-import-declaration-additions', 'accepted');
assertCorpusFixture('safe-type-value-import-dependencies', 'accepted');
assertCorpusFixture('safe-composed-source-additions', 'accepted');
assertCorpusFixture('safe-new-import-declaration-additions', 'accepted');
assertCorpusFixture('safe-import-specifier-reorder', 'accepted');
assertCorpusFixture('safe-existing-import-default-addition', 'accepted');
assertCorpusFixture('unsafe-missing-source-ledger-span', 'rejected', ['missing-source-ledger-span']);
assertCorpusFixture('unsafe-computed-key-declaration', 'rejected', ['computed-key']);
assertCorpusFixture('unsafe-composed-member-conflict', 'rejected', ['duplicate-member-name']);
assertCorpusFixture('unsafe-object-duplicate-member-key', 'rejected', ['duplicate-added-key:flag:object:config']);
assertCorpusFixture('unsafe-order-sensitive-member-region', 'rejected', [
  'order-sensitive-region-kind:route',
  'object-region-kind-not-safe-listed'
]);

assertSafeMergeCorpusFixture('safe-import-declaration-additions');
assertSafeMergeCorpusFixture('safe-type-value-import-dependencies');
assertSafeMergeCorpusFixture('safe-composed-source-additions');
assertSafeMergeCorpusFixture('safe-new-import-declaration-additions');
assertSafeMergeCorpusFixture('safe-import-specifier-reorder');
assertSafeMergeCorpusFixture('safe-existing-import-default-addition');
assertSafeMergeCorpusFixture('unsafe-import-meta-host-context-divergence');
assertSafeMergeCorpusFixture('unsafe-missing-source-ledger-span');
assertSafeMergeCorpusFixture('unsafe-computed-key-declaration');
assertSafeMergeCorpusFixture('unsafe-composed-member-conflict');
assertSafeMergeCorpusFixture('unsafe-object-duplicate-member-key');
assertSafeMergeCorpusFixture('unsafe-order-sensitive-member-region');

const independentImportsExports = safeMergeJsTsImportsAndDeclarations({
  id: 'oracle_safe_independent_imports_exports',
  language: 'typescript',
  sourcePath: 'src/oracles/independent.ts',
  baseSourceText: [
    "import { readFile } from 'node:fs';",
    'export const stable = readFile;',
    ''
  ].join('\n'),
  workerSourceText: [
    "import { readFile, writeFile } from 'node:fs';",
    'export const stable = readFile;',
    'export const workerOnly = writeFile;',
    ''
  ].join('\n'),
  headSourceText: [
    "import { readFile, stat } from 'node:fs';",
    'export const stable = readFile;',
    'export function headOnly() { return stat; }',
    ''
  ].join('\n')
});
assert.equal(independentImportsExports.status, 'merged');
assert.equal(independentImportsExports.admission.status, 'auto-merge-candidate');
assert.equal(independentImportsExports.conflicts.length, 0);

const conflictingExports = safeMergeJsTsImportsAndDeclarations({
  id: 'oracle_unsafe_conflicting_exports',
  language: 'typescript',
  sourcePath: 'src/oracles/export-conflict.ts',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: 'export const stable = 1;\nexport const feature = 1;\n',
  headSourceText: 'export const stable = 1;\nexport function feature() { return 2; }\n'
});
assertSafeMergeBlocked(conflictingExports, JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames);

const malformedEdit = safeMergeJsTsImportsAndDeclarations({
  id: 'oracle_unsafe_malformed_edit',
  language: 'typescript',
  sourcePath: 'src/oracles/malformed.ts',
  baseSourceText: 'export const broken = (\n',
  workerSourceText: 'export const broken = (\n',
  headSourceText: 'export const broken = (\n'
});
assertSafeMergeBlocked(malformedEdit, JsTsSafeMergeConflictCodes.malformedSyntax, JsTsSafeMergeGateIds.parseLedger);

const staleSourceHash = safeMergeJsTsImportsAndDeclarations({
  id: 'oracle_unsafe_stale_source_hash',
  language: 'typescript',
  sourcePath: 'src/oracles/stale.ts',
  expectedSourceHash: 'hash_base_oracle',
  currentSourceHash: 'hash_head_oracle',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: 'export const stable = 1;\nexport const workerOnly = 1;\n',
  headSourceText: 'export const stable = 1;\n'
});
assertSafeMergeBlocked(staleSourceHash, JsTsSafeMergeConflictCodes.staleSourceHash, JsTsSafeMergeGateIds.parseLedger);

const decoratorAnchor = safeMergeJsTsImportsAndDeclarations({
  id: 'oracle_unsafe_decorator_anchor',
  language: 'typescript',
  sourcePath: 'src/oracles/decorator.ts',
  baseSourceText: '@sealed\nexport class Widget {}\n',
  workerSourceText: '@sealed\nexport class Widget {}\nexport const workerOnly = 1;\n',
  headSourceText: '@sealed\nexport class Widget {}\n'
});
assertSafeMergeBlocked(decoratorAnchor, JsTsSafeMergeConflictCodes.unsupportedDecorator, JsTsSafeMergeGateIds.parseLedger);

const overloadAnchor = safeMergeJsTsImportsAndDeclarations({
  id: 'oracle_unsafe_overload_anchor',
  language: 'typescript',
  sourcePath: 'src/oracles/overload.ts',
  baseSourceText: [
    'export function parse(value: string): string;',
    'export function parse(value: string | number): string { return String(value); }',
    ''
  ].join('\n'),
  workerSourceText: [
    'export function parse(value: string): string;',
    'export function parse(value: string | number): string { return String(value); }',
    'export const workerOnly = 1;',
    ''
  ].join('\n'),
  headSourceText: [
    'export function parse(value: string): string;',
    'export function parse(value: string | number): string { return String(value); }',
    ''
  ].join('\n')
});
assertSafeMergeBlocked(overloadAnchor, JsTsSafeMergeConflictCodes.unsupportedOverload, JsTsSafeMergeGateIds.parseLedger);

const interfaceMemberAdditions = mergeJsTsSafeMemberAdditions({
  baseSourceText: 'export interface Options {\n  enabled: boolean;\n}\n',
  workerSourceText: 'export interface Options {\n  enabled: boolean;\n  label?: string;\n}\n',
  headSourceText: 'export interface Options {\n  enabled: boolean;\n  retries: number;\n}\n',
  policy: { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
});
assert.equal(interfaceMemberAdditions.status, 'merged');
assert.deepEqual(interfaceMemberAdditions.reasonCodes, []);
assert.deepEqual(interfaceMemberAdditions.mergedRegions[0].workerAddedKeys, ['label']);
assert.deepEqual(interfaceMemberAdditions.mergedRegions[0].headAddedKeys, ['retries']);

const objectMemberConflict = mergeJsTsSafeMemberAdditions({
  baseSourceText: "export const config = {\n  mode: 'a',\n};\n",
  workerSourceText: "export const config = {\n  mode: 'a',\n  flag: true,\n};\n",
  headSourceText: "export const config = {\n  mode: 'a',\n  flag: false,\n};\n",
  policy: { unorderedRegions: [{ kind: 'object', name: 'config', regionKind: 'config', order: 'non-semantic' }] }
});
assert.equal(objectMemberConflict.status, 'rejected');
assert.equal(
  objectMemberConflict.reasonCodes.some((code) => code.includes('duplicate-added-key:flag')),
  true,
  objectMemberConflict.reasonCodes.join(', ')
);

const duplicateExportSidecar = createJsTsSemanticConflictSidecars({
  id: 'oracle_duplicate_export_sidecar',
  language: 'typescript',
  sourcePath: 'src/oracles/export-conflict.ts',
  exports: [
    { id: 'worker_feature_export', kind: 'export', name: 'feature', exportName: 'feature', exported: true },
    { id: 'head_feature_export', kind: 'export', name: 'feature', exportName: 'feature', exported: true }
  ]
});
assert.equal(duplicateExportSidecar.admission.status, 'blocked');
assert.equal(duplicateExportSidecar.summary.classes.includes('duplicate-export'), true);
assert.equal(duplicateExportSidecar.admission.reasonCodes.includes('duplicate-export-name'), true);

const conflictingExportFixture = fixturesById.get('conflicting-export-additions');
const conflictingExportFixtureSidecar = createJsTsSemanticConflictSidecars({
  id: `oracle_fixture_${conflictingExportFixture.id}`,
  language: conflictingExportFixture.language,
  sourcePath: conflictingExportFixture.sourcePath,
  ...conflictingExportFixture.sidecarInput
});
assert.equal(conflictingExportFixtureSidecar.admission.status, conflictingExportFixture.expected.admissionStatus);
assert.equal(conflictingExportFixtureSidecar.summary.classes.includes('duplicate-export'), true);
assert.equal(conflictingExportFixtureSidecar.admission.reasonCodes.includes('duplicate-export-name'), true);
