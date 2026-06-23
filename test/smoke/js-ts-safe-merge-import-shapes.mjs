import { assert } from './helpers.mjs';
import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds,
  safeMergeJsTsImportsAndDeclarations
} from './compiler-api.mjs';

const existingImportDefaultAddition = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_accepts_existing_import_default_addition',
  language: 'typescript',
  sourcePath: 'src/import-default-addition.ts',
  baseSourceText: "import { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  workerSourceText: "import fs, { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  headSourceText: "import { readFile, stat } from 'node:fs';\nexport const stable = readFile;\n"
});

assert.equal(existingImportDefaultAddition.status, 'merged');
assert.equal(existingImportDefaultAddition.summary.importSpecifierAdditions, 2);
assert.equal(existingImportDefaultAddition.mergedSourceText, "import fs, { readFile, stat } from 'node:fs';\nexport const stable = readFile;\n");
assertSemanticArtifactsVerified(existingImportDefaultAddition, 'existing import default addition');
assert.equal(existingImportDefaultAddition.semanticArtifacts.script.summary.byKind.jsTsReplaceImport, 1);

const existingImportDefaultAdditionFromHead = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_accepts_head_existing_import_default_addition',
  language: 'typescript',
  sourcePath: 'src/import-default-addition-head.ts',
  baseSourceText: "import { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  workerSourceText: "import { readFile, writeFile } from 'node:fs';\nexport const stable = readFile;\n",
  headSourceText: "import fs, { readFile } from 'node:fs';\nexport const stable = readFile;\n"
});

assert.equal(existingImportDefaultAdditionFromHead.status, 'merged');
assert.equal(existingImportDefaultAdditionFromHead.summary.importSpecifierAdditions, 2);
assert.equal(existingImportDefaultAdditionFromHead.mergedSourceText, "import fs, { readFile, writeFile } from 'node:fs';\nexport const stable = readFile;\n");
assertSemanticArtifactsVerified(existingImportDefaultAdditionFromHead, 'head existing import default addition');
assert.equal(existingImportDefaultAdditionFromHead.semanticArtifacts.script.summary.byKind.jsTsReplaceImport, 1);

const existingNamespaceImportDefaultAddition = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_accepts_existing_namespace_import_default_addition',
  language: 'typescript',
  sourcePath: 'src/import-namespace-default-addition.ts',
  baseSourceText: "import * as fs from 'node:fs';\nexport const stable = fs;\n",
  workerSourceText: "import fsDefault, * as fs from 'node:fs';\nexport const stable = fs;\n",
  headSourceText: "import * as fs from 'node:fs';\nexport const stable = fs;\nexport const headOnly = 1;\n"
});

assert.equal(existingNamespaceImportDefaultAddition.status, 'merged');
assert.equal(existingNamespaceImportDefaultAddition.summary.importSpecifierAdditions, 1);
assert.equal(existingNamespaceImportDefaultAddition.mergedSourceText, "import fsDefault, * as fs from 'node:fs';\nexport const stable = fs;\nexport const headOnly = 1;\n");
assertSemanticArtifactsVerified(existingNamespaceImportDefaultAddition, 'existing namespace import default addition');
assert.equal(existingNamespaceImportDefaultAddition.semanticArtifacts.script.summary.byKind.jsTsReplaceImport, 1);

const existingDefaultImportNamespaceAddition = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_accepts_existing_default_import_namespace_addition',
  language: 'typescript',
  sourcePath: 'src/import-default-namespace-addition.ts',
  baseSourceText: "import fsDefault from 'node:fs';\nexport const stable = fsDefault;\n",
  workerSourceText: "import fsDefault, * as fs from 'node:fs';\nexport const stable = fsDefault;\n",
  headSourceText: "import fsDefault from 'node:fs';\nexport const stable = fsDefault;\nexport const headOnly = 1;\n"
});

assert.equal(existingDefaultImportNamespaceAddition.status, 'merged');
assert.equal(existingDefaultImportNamespaceAddition.summary.importSpecifierAdditions, 1);
assert.equal(existingDefaultImportNamespaceAddition.mergedSourceText, "import fsDefault, * as fs from 'node:fs';\nexport const stable = fsDefault;\nexport const headOnly = 1;\n");
assertSemanticArtifactsVerified(existingDefaultImportNamespaceAddition, 'existing default import namespace addition');
assert.equal(existingDefaultImportNamespaceAddition.semanticArtifacts.script.summary.byKind.jsTsReplaceImport, 1);

const duplicateDefaultImportAddition = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_duplicate_default_import_additions',
  baseSourceText: "import { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  workerSourceText: "import fs, { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  headSourceText: "import otherFs, { readFile } from 'node:fs';\nexport const stable = readFile;\n"
});
assertBlocked(duplicateDefaultImportAddition, JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames);

const changedDefaultImport = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_existing_default_import_change',
  baseSourceText: "import fs, { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  workerSourceText: "import otherFs, { readFile } from 'node:fs';\nexport const stable = readFile;\n",
  headSourceText: "import fs, { readFile, stat } from 'node:fs';\nexport const stable = readFile;\n"
});
assertBlocked(changedDefaultImport, JsTsSafeMergeConflictCodes.importShapeChanged, JsTsSafeMergeGateIds.independentImportSpecifiers);

const namespaceAndNamedImportAddition = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_namespace_and_named_import_addition',
  baseSourceText: "import fsDefault from 'node:fs';\nexport const stable = fsDefault;\n",
  workerSourceText: "import fsDefault, * as fs from 'node:fs';\nexport const stable = fsDefault;\n",
  headSourceText: "import fsDefault, { readFile } from 'node:fs';\nexport const stable = fsDefault;\n"
});
assertBlocked(namespaceAndNamedImportAddition, JsTsSafeMergeConflictCodes.importShapeChanged, JsTsSafeMergeGateIds.independentImportSpecifiers);

function assertSemanticArtifactsVerified(result, label) {
  assert.equal(result.semanticArtifacts.status, 'verified', `${label}: semantic artifact status`);
  assert.equal(result.semanticArtifacts.projection.status, 'projected', `${label}: projection status`);
  assert.equal(result.semanticArtifacts.projection.sourceText, result.mergedSourceText, `${label}: projection output`);
  assert.equal(result.semanticArtifacts.replay.status, 'accepted-clean', `${label}: replay status`);
  assert.equal(result.semanticArtifacts.replay.outputSourceText, result.mergedSourceText, `${label}: replay output`);
  assert.equal(result.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied', `${label}: already-applied replay`);
  assert.equal(result.semanticArtifacts.alreadyAppliedReplay.outputSourceText, result.mergedSourceText, `${label}: already-applied output`);
}

function assertBlocked(result, code, gateId) {
  assert.equal(result.status, 'blocked', `${code}: status`);
  assert.equal(result.admission.reviewRequired, true, `${code}: review required`);
  assert.equal(result.admission.reasonCodes.includes(code), true, `${code}: reasons ${JSON.stringify(result.admission.reasonCodes)}`);
  assert.equal(result.conflicts.some((conflict) => conflict.code === code), true, `${code}: conflicts ${JSON.stringify(result.conflicts)}`);
  assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, `${gateId}: gates ${JSON.stringify(result.gates)}`);
}
