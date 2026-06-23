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

const sameModuleNewImports = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_combines_same_module_new_import_declarations',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import { writeFile } from 'node:fs';\nexport const stable = 1;\n",
  headSourceText: "import { readFile } from 'node:fs';\nexport const stable = 1;\n"
});

assert.equal(sameModuleNewImports.status, 'merged');
assert.equal(sameModuleNewImports.mergedSourceText, "import { readFile, writeFile } from 'node:fs';\nexport const stable = 1;\n");

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

const newSideEffectImport = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_new_side_effect_imports',
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: "import 'reflect-metadata';\nexport const stable = 1;\n",
  headSourceText: 'export const stable = 1;\n'
});

assertBlocked(newSideEffectImport, JsTsSafeMergeConflictCodes.sideEffectImportReorder, JsTsSafeMergeGateIds.preserveBaseOrder);

function assertBlocked(result, code, gateId) {
  assert.equal(result.status, 'blocked', `${code}: status`);
  assert.equal(result.admission.reasonCodes.includes(code), true, `${code}: reasons ${JSON.stringify(result.admission.reasonCodes)}`);
  assert.equal(result.conflicts.some((conflict) => conflict.code === code), true, `${code}: conflicts ${JSON.stringify(result.conflicts)}`);
  assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, `${gateId}: gates ${JSON.stringify(result.gates)}`);
}
