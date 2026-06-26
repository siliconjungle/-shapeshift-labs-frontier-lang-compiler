import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const unusedImportRemovalProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_unused_import_removal_diagnostics_admitted',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = used;\n"
  },
  workerFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used } from './dep.js';\nexport const value = used;\n"
  },
  headFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = used;\n"
  }
});
const unusedImportRemovalFile = unusedImportRemovalProject.files.find((file) => file.sourcePath === 'src/consumer.ts');
assert.equal(unusedImportRemovalProject.status, 'merged');
assert.equal(unusedImportRemovalProject.outputDiagnosticsGate.status, 'passed');
assert.equal(unusedImportRemovalProject.outputDiagnosticsGate.diagnostics.length, 0);
assert.equal(unusedImportRemovalFile.operation, 'merged-import-removal-usage-proof');
assert.equal(unusedImportRemovalFile.outputSourceText, "import { used } from './dep.js';\nexport const value = used;\n");
assert.equal(unusedImportRemovalFile.metadata.importRemovalUsageProof.proof, 'project-output-diagnostics');
assert.equal(unusedImportRemovalFile.metadata.importRemovalUsageProof.removedSpecifier, 'unused');

const usedImportRemovalProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_used_import_removal_diagnostics_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = used;\n"
  },
  workerFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { unused } from './dep.js';\nexport const value = used;\n"
  },
  headFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = used;\n"
  }
});
assert.equal(usedImportRemovalProject.status, 'blocked');
assert.equal(usedImportRemovalProject.outputDiagnosticsGate, undefined);
assert.equal(usedImportRemovalProject.admission.reasonCodes.includes('project-import-removal-lexical-use-def-blocked'), true);
assert.equal(usedImportRemovalProject.admission.reasonCodes.includes('lexical-scope-live-reference'), true);

const missingImportRemovalProofProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_import_removal_missing_usage_proof_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  baseFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = used;\n"
  },
  workerFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used } from './dep.js';\nexport const value = used;\n"
  },
  headFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = used;\n"
  }
});
assert.equal(missingImportRemovalProofProject.status, 'blocked');
assert.equal(
  missingImportRemovalProofProject.admission.reasonCodes.includes('project-import-removal-usage-proof-unavailable'),
  true
);
assert.equal(missingImportRemovalProofProject.outputDiagnosticsGate, undefined);
