import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sourceProof({ id, sourcePath, base, worker, head, output, command, probeId, evidenceHash, extra = {} }) {
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
    command,
    probeId: probeId ?? id,
    evidenceHash,
    ...extra
  };
}

function packageCommandExecutionProofFields({ script, phase, manager, managerVersion, packageManagerFieldValue, baseCommand, workerCommand, headCommand, outputCommand, commandArgv, evidenceId, overrides = {} }) {
  return {
    proofLevel: 'package-manager-command-execution-proof',
    executionPhase: phase,
    changedScripts: [{
      script,
      baseCommandHash: hashSemanticValue(baseCommand),
      workerCommandHash: hashSemanticValue(workerCommand),
      headCommandHash: hashSemanticValue(headCommand),
      outputCommandHash: hashSemanticValue(outputCommand)
    }],
    packageManagerName: manager,
    packageManagerVersion: managerVersion,
    packageManagerFieldValue,
    packageManagerFieldHash: hashSemanticValue(packageManagerFieldValue),
    packageManagerSource: 'packageManager-field',
    commandArgv,
    shell: false,
    cwd: '.',
    commandAllowlistId: `${manager}-${phase}-${script}-v1`,
    exitCode: 0,
    signal: null,
    durationMs: 900,
    timeoutMs: 30000,
    stdoutHash: `sha256:${evidenceId}:stdout`,
    stderrHash: `sha256:${evidenceId}:stderr`,
    stdoutBytes: 64,
    stderrBytes: 0,
    stdoutTruncated: false,
    stderrTruncated: false,
    dependencyInstallExecution: 'not-run-default-network-free',
    networkPolicy: 'offline',
    envAllowlistHash: `sha256:${evidenceId}:env`,
    commandExecutionEvidenceHash: `sha256:${evidenceId}:command-execution`,
    ...overrides
  };
}

const commandBase = json({
  name: '@demo/app',
  version: '1.0.0',
  scripts: {
    build: 'node scripts/build.mjs',
    test: 'node test/index.mjs'
  },
  packageManager: 'npm@10.9.0'
});
const commandWorker = json({
  name: '@demo/app',
  version: '1.0.0',
  scripts: {
    build: 'node scripts/build.mjs --production',
    test: 'node test/index.mjs'
  },
  packageManager: 'npm@10.9.0'
});
const commandHead = json({
  name: '@demo/app',
  version: '1.0.0',
  scripts: {
    build: 'node scripts/build.mjs',
    test: 'node test/index.mjs --coverage'
  },
  packageManager: 'npm@10.9.0'
});
const commandOutput = json({
  name: '@demo/app',
  version: '1.0.0',
  scripts: {
    build: 'node scripts/build.mjs --production',
    test: 'node test/index.mjs --coverage'
  },
  packageManager: 'npm@10.9.0'
});

const commandCorpusProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_manager_command_corpus',
  packageManagerCommandExecutionProofsByPath: {
    'package.json': [
      sourceProof({
        id: 'package_manager_command_corpus_build',
        sourcePath: 'package.json',
        base: commandBase,
        worker: commandWorker,
        head: commandHead,
        output: commandOutput,
        command: 'npm run build -- --production',
        evidenceHash: 'sha256:package-manager-command-corpus-build',
        extra: packageCommandExecutionProofFields({
          script: 'build',
          phase: 'build',
          manager: 'npm',
          managerVersion: '10.9.0',
          packageManagerFieldValue: 'npm@10.9.0',
          baseCommand: 'node scripts/build.mjs',
          workerCommand: 'node scripts/build.mjs --production',
          headCommand: 'node scripts/build.mjs',
          outputCommand: 'node scripts/build.mjs --production',
          commandArgv: ['npm', 'run', 'build', '--', '--production'],
          evidenceId: 'build'
        })
      }),
      sourceProof({
        id: 'package_manager_command_corpus_test',
        sourcePath: 'package.json',
        base: commandBase,
        worker: commandWorker,
        head: commandHead,
        output: commandOutput,
        command: 'npm test -- --coverage',
        evidenceHash: 'sha256:package-manager-command-corpus-test',
        extra: packageCommandExecutionProofFields({
          script: 'test',
          phase: 'test',
          manager: 'npm',
          managerVersion: '10.9.0',
          packageManagerFieldValue: 'npm@10.9.0',
          baseCommand: 'node test/index.mjs',
          workerCommand: 'node test/index.mjs',
          headCommand: 'node test/index.mjs --coverage',
          outputCommand: 'node test/index.mjs --coverage',
          commandArgv: ['npm', 'test', '--', '--coverage'],
          evidenceId: 'test'
        })
      })
    ]
  },
  files: [{ sourcePath: 'package.json', baseSourceText: commandBase, workerSourceText: commandWorker, headSourceText: commandHead }]
});
assert.equal(commandCorpusProject.status, 'merged');
assert.equal(commandCorpusProject.summary.packageManagerCommandExecutionProofs, 2);
assert.equal(commandCorpusProject.files[0].result.packageManagementProofs.every((proof) => proof.packageManagerCommandExecutionProof === true), true);
assert.deepEqual(commandCorpusProject.files[0].result.packageManagementProofs.map((proof) => proof.executionPhase).sort(), ['build', 'test']);
assert.equal(commandCorpusProject.files[0].result.admission.packageInstallEquivalenceClaim, false);
assert.equal(matrixSurface(commandCorpusProject, 'package-manager-command-execution-proof').proofStatuses['package-manager-command-execution-proof'], 'passed');

const invalidCommandProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_manager_command_invalid_shell',
  packageManagerCommandExecutionProofsByPath: {
    'package.json': [sourceProof({
      id: 'package_manager_command_invalid_shell',
      sourcePath: 'package.json',
      base: commandBase,
      worker: commandWorker,
      head: commandBase,
      output: commandWorker,
      command: 'npm run build -- --production',
      evidenceHash: 'sha256:package-manager-command-invalid-shell',
      extra: packageCommandExecutionProofFields({
        script: 'build',
        phase: 'build',
        manager: 'npm',
        managerVersion: '10.9.0',
        packageManagerFieldValue: 'npm@10.9.0',
        baseCommand: 'node scripts/build.mjs',
        workerCommand: 'node scripts/build.mjs --production',
        headCommand: 'node scripts/build.mjs',
        outputCommand: 'node scripts/build.mjs --production',
        commandArgv: ['npm run build -- --production'],
        evidenceId: 'invalid-shell',
        overrides: { shell: true }
      })
    })]
  },
  files: [{ sourcePath: 'package.json', baseSourceText: commandBase, workerSourceText: commandWorker, headSourceText: commandBase }]
});
assert.equal(invalidCommandProject.status, 'blocked');
assert.equal(invalidCommandProject.summary.packageManagerCommandExecutionBlockedFiles, 1);
assert.equal(matrixSurface(invalidCommandProject, 'package-manager-command-execution-proof').proofStatuses['package-manager-command-execution-proof'], 'failed');

const lockfileCases = [
  {
    manager: 'npm',
    version: '10.9.0',
    sourcePath: 'package-lock.json',
    command: 'npm install --package-lock-only --ignore-scripts',
    base: json({ lockfileVersion: 3, packages: { '': { dependencies: { react: '^18.2.0' } } } }),
    worker: json({ lockfileVersion: 3, packages: { '': { dependencies: { react: '^18.2.0', zod: '^3.23.0' } } } })
  },
  {
    manager: 'pnpm',
    version: '9.15.0',
    sourcePath: 'pnpm-lock.yaml',
    command: 'pnpm install --lockfile-only --ignore-scripts',
    base: 'lockfileVersion: "9.0"\nimporters:\n  .:\n    dependencies:\n      react:\n        specifier: ^18.2.0\n        version: 18.2.0\n',
    worker: 'lockfileVersion: "9.0"\nimporters:\n  .:\n    dependencies:\n      react:\n        specifier: ^18.2.0\n        version: 18.2.0\n      zod:\n        specifier: ^3.23.0\n        version: 3.23.8\n'
  },
  {
    manager: 'yarn',
    version: '1.22.22',
    sourcePath: 'yarn.lock',
    command: 'yarn install --mode=skip-builds',
    base: '# yarn lockfile v1\n\nreact@^18.2.0:\n  version "18.2.0"\n',
    worker: '# yarn lockfile v1\n\nreact@^18.2.0:\n  version "18.2.0"\n\nzod@^3.23.0:\n  version "3.23.8"\n'
  }
];

const lockfileProofsByPath = Object.fromEntries(lockfileCases.map((fixture) => [fixture.sourcePath, [lockfileRegenerationProof(fixture)]]));
const lockfileCorpusProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_manager_lockfile_corpus',
  packageLockfileRegenerationProofsByPath: lockfileProofsByPath,
  files: lockfileCases.map((fixture) => ({
    sourcePath: fixture.sourcePath,
    baseSourceText: fixture.base,
    workerSourceText: fixture.worker,
    headSourceText: fixture.base
  }))
});
assert.equal(lockfileCorpusProject.status, 'merged');
assert.equal(lockfileCorpusProject.summary.packageLockfileRegeneratedFiles, 3);
assert.equal(lockfileCorpusProject.summary.packageLockfileRegenerationProofs, 3);
assert.deepEqual(lockfileCorpusProject.files.map((file) => file.result.packageManagementProofs[0].lockfileLanguage).sort(), ['npm-lockfile', 'pnpm-lockfile', 'yarn-lockfile']);
assert.equal(matrixSurface(lockfileCorpusProject, 'package-lockfile-regeneration-proof').proofStatuses['package-lockfile-regeneration-proof'], 'passed');

const staleLockfileProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_package_manager_lockfile_stale_output',
  packageLockfileRegenerationProofsByPath: {
    'pnpm-lock.yaml': [{
      ...lockfileRegenerationProof(lockfileCases[1]),
      outputSourceHash: hashSemanticValue(`${lockfileCases[1].worker}# stale\n`)
    }]
  },
  files: [{
    sourcePath: 'pnpm-lock.yaml',
    baseSourceText: lockfileCases[1].base,
    workerSourceText: lockfileCases[1].worker,
    headSourceText: lockfileCases[1].base
  }]
});
assert.equal(staleLockfileProject.status, 'blocked');
assert.equal(staleLockfileProject.summary.packageLockfileRegenerationBlockedFiles, 1);
assert.equal(staleLockfileProject.conflicts.some((conflict) => conflict.code === 'package-lockfile-regeneration-output-mismatch'), true);
assert.equal(matrixSurface(staleLockfileProject, 'package-lockfile-regeneration-proof').proofStatuses['package-lockfile-regeneration-proof'], 'failed');

function lockfileRegenerationProof(fixture) {
  return sourceProof({
    id: `lockfile_regeneration_${fixture.manager}`,
    sourcePath: fixture.sourcePath,
    base: fixture.base,
    worker: fixture.worker,
    head: fixture.base,
    output: fixture.worker,
    command: fixture.command,
    probeId: `package-manager:${fixture.manager}:lockfile-regeneration`,
    evidenceHash: `sha256:lockfile-regeneration:${fixture.manager}`,
    extra: {
      kind: 'package-lockfile-regeneration-proof',
      packageManager: fixture.manager,
      packageManagerName: fixture.manager,
      packageManagerVersion: fixture.version,
      packageManagerCommand: fixture.command,
      lockfileRegenerationHash: `sha256:lockfile:${fixture.manager}:regenerated`,
      outputSourceText: fixture.worker,
      dependencyInstallExecution: 'lockfile-only',
      frozenInstallEquivalent: true,
      networkPolicy: 'offline-fixture',
      shell: false,
      commandArgv: fixture.command.split(/\s+/),
      stdoutHash: `sha256:lockfile:${fixture.manager}:stdout`,
      stderrHash: `sha256:lockfile:${fixture.manager}:stderr`,
      stdoutBytes: 96,
      stderrBytes: 0,
      stdoutTruncated: false,
      stderrTruncated: false,
      packageInstallEquivalenceClaim: false
    }
  });
}
