import { assert } from './helpers.mjs';
import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds,
  safeMergeJsTsImportsAndDeclarations
} from './compiler-api.mjs';

const independentNewImports = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_accepts_independent_new_import_declarations',
  language: 'typescript',
  sourcePath: 'src/new-imports.ts',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: [
    "import { readFile } from 'node:fs';",
    'export const stable = 1;',
    'export const workerOnly = readFile;',
    ''
  ].join('\n'),
  headSourceText: [
    "import type { Stats } from 'node:fs';",
    'export const stable = 1;',
    'export const headOnly = 2;',
    ''
  ].join('\n')
});

assert.equal(independentNewImports.status, 'merged');
assert.equal(independentNewImports.summary.importDeclarationAdditions, 1);
assert.equal(independentNewImports.summary.importSpecifierAdditions, 0);
assert.equal(independentNewImports.mergedSourceText, [
  "import { readFile } from 'node:fs';",
  "import type { Stats } from 'node:fs';",
  'export const stable = 1;',
  'export const headOnly = 2;',
  'export const workerOnly = readFile;',
  ''
].join('\n'));
assert.equal(independentNewImports.semanticArtifacts.status, 'verified');
assert.equal(independentNewImports.semanticArtifacts.script.summary.byKind.jsTsInsertImport, 1);
assertSemanticArtifactsVerified(independentNewImports, 'independent new imports');
const independentNewImportEdit = independentNewImports.semanticArtifacts.projection.edits.find((edit) => edit.kind === 'jsTsInsertImport');
assert.ok(independentNewImportEdit, 'independent new imports: expected insert import edit');
assert.equal(independentNewImportEdit.insertionMode, 'before');
assert.equal(independentNewImportEdit.insertionAnchorSymbolName, 'node:fs');
assert.equal(independentNewImportEdit.insertionAnchorSymbolKind, 'module');

const sameModuleTypeImportAnchorFixtures = [
  {
    id: 'default',
    sourcePath: 'src/default-import-anchor.ts',
    workerImport: "import fsDefault from 'node:fs';",
    headImport: "import type { Stats } from 'node:fs';",
    symbolName: 'fsDefault',
    moduleSpecifier: 'node:fs',
    expectedMergedSourceText: [
      "import fsDefault from 'node:fs';",
      "import type { Stats } from 'node:fs';",
      'export const stable = 1;',
      'export const headOnly = 3;',
      'export const workerOnly = 2;',
      ''
    ].join('\n')
  },
  {
    id: 'namespace',
    sourcePath: 'src/namespace-import-anchor.ts',
    workerImport: "import * as pathTools from 'node:path';",
    headImport: "import type { ParsedPath } from 'node:path';",
    symbolName: 'pathTools',
    moduleSpecifier: 'node:path',
    expectedMergedSourceText: [
      "import * as pathTools from 'node:path';",
      "import type { ParsedPath } from 'node:path';",
      'export const stable = 1;',
      'export const headOnly = 3;',
      'export const workerOnly = 2;',
      ''
    ].join('\n')
  }
];

for (const fixture of sameModuleTypeImportAnchorFixtures) {
  const result = safeMergeJsTsImportsAndDeclarations({
    id: `js_ts_safe_merge_${fixture.id}_import_before_same_module_type_import`,
    language: 'typescript',
    sourcePath: fixture.sourcePath,
    baseSourceText: 'export const stable = 1;\n',
    workerSourceText: [
      fixture.workerImport,
      'export const stable = 1;',
      'export const workerOnly = 2;',
      ''
    ].join('\n'),
    headSourceText: [
      fixture.headImport,
      'export const stable = 1;',
      'export const headOnly = 3;',
      ''
    ].join('\n')
  });

  assert.equal(result.status, 'merged', `${fixture.id}: status`);
  assert.equal(result.mergedSourceText, fixture.expectedMergedSourceText, `${fixture.id}: merged source`);
  assertSemanticArtifactsVerified(result, `${fixture.id} import before same-module type import`);
  assert.equal(result.semanticArtifacts.script.summary.byKind.jsTsInsertImport, 1, `${fixture.id}: insert import count`);
  const edit = result.semanticArtifacts.projection.edits.find((candidate) => candidate.symbolName === fixture.symbolName);
  assert.ok(edit, `${fixture.id}: expected import edit for ${fixture.symbolName}`);
  assert.equal(edit.kind, 'jsTsInsertImport', `${fixture.id}: edit kind`);
  assert.equal(edit.symbolKind, 'import', `${fixture.id}: symbol kind`);
  assert.equal(edit.insertionMode, 'before', `${fixture.id}: insertion mode`);
  assert.equal(edit.insertionAnchorSymbolName, fixture.moduleSpecifier, `${fixture.id}: insertion anchor`);
  assert.equal(edit.insertionAnchorSymbolKind, 'module', `${fixture.id}: insertion anchor kind`);
  assert.equal(
    result.semanticArtifacts.replay.edits.some((candidate) => candidate.symbolName === fixture.symbolName
      && candidate.status === 'applied'
      && candidate.reasonCodes.includes('current-insertion-anchor')),
    true,
    `${fixture.id}: replay anchored inserted import`
  );
  assert.equal(
    result.semanticArtifacts.alreadyAppliedReplay.edits.some((candidate) => candidate.symbolName === fixture.symbolName
      && candidate.status === 'already-applied'
      && candidate.reasonCodes.includes('current-inserted-symbol-matches-replacement-span')),
    true,
    `${fixture.id}: already-applied inserted import`
  );
}

const sameModuleNewImports = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_combines_same_module_new_import_declarations',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import { writeFile } from 'node:fs';\nexport const stable = 1;\n",
  headSourceText: "import { readFile } from 'node:fs';\nexport const stable = 1;\n"
});

assert.equal(sameModuleNewImports.status, 'merged');
assert.equal(sameModuleNewImports.mergedSourceText, "import { readFile, writeFile } from 'node:fs';\nexport const stable = 1;\n");

const defaultNamespaceMixedAndTypeOnlyNewImports = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_accepts_default_namespace_mixed_and_type_only_new_imports',
  language: 'typescript',
  sourcePath: 'src/new-import-syntax.ts',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: [
    "import DefaultThing from 'pkg-default';",
    "import DefaultTools, * as toolsDefault from 'pkg-default-namespace';",
    "import MixedThing, { helper } from 'pkg-mixed';",
    "import * as tools from 'pkg-namespace';",
    'export const stable = 1;',
    ''
  ].join('\n'),
  headSourceText: [
    "import type TypeThing from 'pkg-type-default';",
    "import type * as TypeTools from 'pkg-type-namespace';",
    'export const stable = 1;',
    ''
  ].join('\n')
});

assert.equal(defaultNamespaceMixedAndTypeOnlyNewImports.status, 'merged');
assert.equal(defaultNamespaceMixedAndTypeOnlyNewImports.mergedSourceText, [
  "import DefaultThing from 'pkg-default';",
  "import DefaultTools, * as toolsDefault from 'pkg-default-namespace';",
  "import MixedThing, { helper } from 'pkg-mixed';",
  "import * as tools from 'pkg-namespace';",
  "import type TypeThing from 'pkg-type-default';",
  "import type * as TypeTools from 'pkg-type-namespace';",
  'export const stable = 1;',
  ''
].join('\n'));

const sameModuleDefaultAndNamedNewImports = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_accepts_same_module_default_and_named_new_imports',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import SameDefault from 'pkg-same';\nexport const stable = 1;\n",
  headSourceText: "import { sameHelper } from 'pkg-same';\nexport const stable = 1;\n"
});

assert.equal(sameModuleDefaultAndNamedNewImports.status, 'merged');
assert.equal(sameModuleDefaultAndNamedNewImports.mergedSourceText, "import { sameHelper } from 'pkg-same';\nimport SameDefault from 'pkg-same';\nexport const stable = 1;\n");

const identicalNewImport = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_dedupes_identical_new_import_declarations',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import { readFile } from 'node:fs';\nexport const stable = 1;\n",
  headSourceText: "import { readFile } from 'node:fs';\nexport const stable = 1;\n"
});

assert.equal(identicalNewImport.status, 'merged');
assert.equal(identicalNewImport.mergedSourceText, "import { readFile } from 'node:fs';\nexport const stable = 1;\n");

const duplicateNewImportBinding = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_duplicate_new_import_bindings',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import { readFile as load } from 'node:fs';\nexport const stable = 1;\n",
  headSourceText: "import { readFile as load } from 'node:fs/promises';\nexport const stable = 1;\n"
});

assertBlocked(duplicateNewImportBinding, JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames);

const duplicateMixedImportBinding = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_duplicate_local_bindings_in_mixed_imports',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import duplicate, { helper as duplicate } from 'pkg';\nexport const stable = 1;\n",
  headSourceText: 'export const stable = 1;\n'
});

assertBlocked(duplicateMixedImportBinding, JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames);

const newSideEffectImport = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_new_side_effect_imports',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import 'reflect-metadata';\nexport const stable = 1;\n",
  headSourceText: 'export const stable = 1;\n'
});

assertBlocked(newSideEffectImport, JsTsSafeMergeConflictCodes.sideEffectImportReorder, JsTsSafeMergeGateIds.preserveBaseOrder);

const identicalNewSideEffectImport = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_identical_new_side_effect_imports',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import 'reflect-metadata';\nexport const stable = 1;\n",
  headSourceText: "import 'reflect-metadata';\nexport const stable = 1;\n"
});

assertBlocked(identicalNewSideEffectImport, JsTsSafeMergeConflictCodes.sideEffectImportReorder, JsTsSafeMergeGateIds.preserveBaseOrder);

function assertSemanticArtifactsVerified(result, label) {
  assert.equal(result.semanticArtifacts.status, 'verified', `${label}: semantic artifact status`);
  assert.equal(result.semanticArtifacts.projection.status, 'projected', `${label}: projection status`);
  assert.equal(result.semanticArtifacts.projection.sourceText, result.mergedSourceText, `${label}: projection output`);
  assert.equal(result.semanticArtifacts.replay.status, 'accepted-clean', `${label}: replay status`);
  assert.equal(result.semanticArtifacts.replay.outputSourceText, result.mergedSourceText, `${label}: replay output`);
  assert.equal(result.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied', `${label}: already-applied replay status`);
  assert.equal(result.semanticArtifacts.alreadyAppliedReplay.outputSourceText, result.mergedSourceText, `${label}: already-applied output`);
}

function assertBlocked(result, code, gateId) {
  assert.equal(result.status, 'blocked', `${code}: status`);
  assert.equal(result.admission.reasonCodes.includes(code), true, `${code}: reasons ${JSON.stringify(result.admission.reasonCodes)}`);
  assert.equal(result.conflicts.some((conflict) => conflict.code === code), true, `${code}: conflicts ${JSON.stringify(result.conflicts)}`);
  assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, `${gateId}: gates ${JSON.stringify(result.gates)}`);
}
