import { assert } from './helpers.mjs';
import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds,
  safeMergeJsTsImportsAndDeclarations
} from './compiler-api.mjs';

const withoutProjectProof = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_rejects_unused_import_specifier_removal_without_project_proof',
  language: 'typescript',
  baseSourceText: "import { used, unused } from './dep.js';\nexport const value = used;\n",
  workerSourceText: "import { used } from './dep.js';\nexport const value = used;\n",
  headSourceText: "import { used, unused } from './dep.js';\nexport const value = used;\n"
});

assert.equal(withoutProjectProof.status, 'blocked');
assert.equal(withoutProjectProof.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.importSpecifierRemoved), true);
assert.equal(withoutProjectProof.conflicts[0].details.missing.includes('unused'), true);
assert.equal(
  withoutProjectProof.gates.some((gate) => gate.id === JsTsSafeMergeGateIds.independentImportSpecifiers && gate.status === 'blocked'),
  true
);
