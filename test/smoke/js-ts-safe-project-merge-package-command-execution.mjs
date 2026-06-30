import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sourceProof({ id, sourcePath, base, worker, head, output, extra = {} }) {
  return {
    id,
    kind: 'source-bound-proof',
    status: 'passed',
    sourcePath,
    sourceHashes: {
      base: hashSemanticValue(base),
      worker: hashSemanticValue(worker),
      head: hashSemanticValue(head),
      output: output === undefined ? undefined : hashSemanticValue(output)
    },
    outputSourceHash: output === undefined ? undefined : hashSemanticValue(output),
    command: `node proof/${id}.mjs`,
    probeId: id,
    evidenceHash: `evidence:${id}`,
    ...extra
  };
}

const commandBase = json({ name: '@demo/app', version: '1.0.0', packageManager: 'npm@10.9.0', scripts: { test: 'vitest --run' } });
const commandWorker = json({ name: '@demo/app', version: '1.0.0', packageManager: 'npm@10.9.0', scripts: { test: 'vitest --run --coverage' } });
const commandOutput = json({ name: '@demo/app', version: '1.0.0', scripts: { test: 'vitest --run --coverage' }, packageManager: 'npm@10.9.0' });

const blockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_command_execution_blocked',
  files: [{ sourcePath: 'package.json', baseSourceText: commandBase, workerSourceText: commandWorker, headSourceText: commandBase }]
});
assert.equal(blockedProject.status, 'blocked');
assert.equal(blockedProject.summary.packageManagerCommandExecutionBlockedFiles, 1);
assert.equal(blockedProject.conflicts.some((conflict) => conflict.code === 'package-manager-command-execution-proof-missing'), true);
assert.equal(matrixSurface(blockedProject, 'package-manager-command-execution-proof').proofStatuses['package-manager-command-execution-proof'], 'failed');

const provenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_command_execution_proven',
  packageManagerCommandExecutionProofsByPath: {
    'package.json': [sourceProof({
      id: 'package_command_execution',
      sourcePath: 'package.json',
      base: commandBase,
      worker: commandWorker,
      head: commandBase,
      output: commandOutput,
      extra: commandExecutionProofFields()
    })]
  },
  files: [{ sourcePath: 'package.json', baseSourceText: commandBase, workerSourceText: commandWorker, headSourceText: commandBase }]
});
assert.equal(provenProject.status, 'merged');
assert.equal(provenProject.summary.packageManagerCommandExecutionProofs, 1);
assert.equal(provenProject.files[0].result.packageManagementProofs[0].packageManagerCommandExecutionProof, true);
assert.equal(provenProject.files[0].result.admission.packageInstallEquivalenceClaim, false);
assert.equal(matrixSurface(provenProject, 'package-manager-command-execution-proof').proofStatuses['package-manager-command-execution-proof'], 'passed');

function commandExecutionProofFields() {
  return {
    proofLevel: 'package-manager-command-execution-proof',
    executionPhase: 'test',
    changedScripts: [{
      script: 'test',
      baseCommandHash: hashSemanticValue('vitest --run'),
      workerCommandHash: hashSemanticValue('vitest --run --coverage'),
      headCommandHash: hashSemanticValue('vitest --run'),
      outputCommandHash: hashSemanticValue('vitest --run --coverage')
    }],
    packageManagerName: 'npm',
    packageManagerVersion: '10.9.0',
    packageManagerFieldValue: 'npm@10.9.0',
    packageManagerFieldHash: hashSemanticValue('npm@10.9.0'),
    packageManagerSource: 'packageManager-field',
    commandArgv: ['npm', 'test', '--', '--coverage'],
    shell: false,
    cwd: '.',
    commandAllowlistId: 'npm-test-v1',
    exitCode: 0,
    signal: null,
    durationMs: 1200,
    timeoutMs: 30000,
    stdoutHash: 'stdout:test',
    stderrHash: 'stderr:test',
    stdoutBytes: 128,
    stderrBytes: 0,
    stdoutTruncated: false,
    stderrTruncated: false,
    dependencyInstallExecution: 'not-run-default-network-free',
    networkPolicy: 'offline',
    envAllowlistHash: 'env:test',
    commandExecutionEvidenceHash: 'command:evidence'
  };
}
