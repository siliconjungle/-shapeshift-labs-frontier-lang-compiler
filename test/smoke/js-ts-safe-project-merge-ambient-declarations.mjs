import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const ambientAddition = safeMergeJsTsProject({
  id: 'js_ts_project_ambient_dts_addition_blocked',
  language: 'typescript',
  files: [{
    sourcePath: 'src/env.d.ts',
    workerSourceText: [
      'declare global {',
      '  interface Window { appVersion: string; }',
      '}',
      'export {};',
      ''
    ].join('\n')
  }]
});
assert.equal(ambientAddition.status, 'blocked');
assert.equal(ambientAddition.files[0].operation, 'blocked-ambient-declaration');
assert.equal(ambientAddition.admission.reasonCodes.includes('project-ambient-declaration-merge-blocked'), true);
assert.equal(ambientAddition.conflicts[0].gateId, 'project-ambient-declaration-classifier');

const globalAugmentationBase = [
  'declare global {',
  '  interface Window { currentUser?: string; }',
  '}',
  'export function readWindow() {',
  '  return globalThis.window.currentUser;',
  '}',
  ''
].join('\n');
const globalAugmentationEdit = safeMergeJsTsProject({
  id: 'js_ts_project_global_augmentation_edit_blocked',
  language: 'typescript',
  files: [{
    sourcePath: 'src/window-contract.ts',
    baseSourceText: globalAugmentationBase,
    workerSourceText: globalAugmentationBase.replace('currentUser?: string', 'currentUser?: string | undefined'),
    headSourceText: globalAugmentationBase
  }]
});
assert.equal(globalAugmentationEdit.status, 'blocked');
assert.equal(globalAugmentationEdit.files[0].operation, 'blocked-global-augmentation');
assert.equal(globalAugmentationEdit.admission.reasonCodes.includes('project-global-augmentation-merge-blocked'), true);
assert.deepEqual(globalAugmentationEdit.conflicts[0].details.requiredEvidence, [
  'typescript-program-symbol-evidence',
  'declaration-output-gate',
  'consumer-diagnostics-gate',
  'global-augmentation-compatibility-evidence'
]);
assert.equal(globalAugmentationEdit.conflicts[0].details.routeId, 'prove-global-augmentation-compatibility');
assert.equal(globalAugmentationEdit.conflicts[0].details.reasonCodes.includes('global-augmentation-compatibility-proof-missing'), true);

const globalAugmentationWorker = globalAugmentationBase.replace('currentUser?: string', 'currentUser?: string | undefined');
const passedGlobalAugmentationEdit = safeMergeJsTsProject({
  id: 'js_ts_project_global_augmentation_edit_proof_passed',
  language: 'typescript',
  files: [{
    sourcePath: 'src/window-contract.ts',
    baseSourceText: globalAugmentationBase,
    workerSourceText: globalAugmentationWorker,
    headSourceText: globalAugmentationBase
  }],
  globalAugmentationCompatibilityProof: globalProof(globalAugmentationWorker)
});
assert.equal(passedGlobalAugmentationEdit.status, 'blocked');
assert.equal(passedGlobalAugmentationEdit.conflicts.some((conflict) => conflict.code === 'project-global-augmentation-merge-blocked'), false);
assert.equal(passedGlobalAugmentationEdit.conflicts.some((conflict) => conflict.code === 'malformed-syntax'), true);

const staleGlobalAugmentationEdit = safeMergeJsTsProject({
  id: 'js_ts_project_global_augmentation_edit_stale_proof_blocked',
  language: 'typescript',
  files: [{
    sourcePath: 'src/window-contract.ts',
    baseSourceText: globalAugmentationBase,
    workerSourceText: globalAugmentationWorker,
    headSourceText: globalAugmentationBase
  }],
  globalAugmentationCompatibilityProof: globalProof(globalAugmentationBase)
});
assert.equal(staleGlobalAugmentationEdit.status, 'blocked');
assert.equal(staleGlobalAugmentationEdit.conflicts[0].details.reasonCodes.includes('global-augmentation-compatibility-proof-stale-source'), true);

const failedConsumerDiagnosticsEdit = safeMergeJsTsProject({
  id: 'js_ts_project_global_augmentation_edit_failed_consumer_proof_blocked',
  language: 'typescript',
  files: [{
    sourcePath: 'src/window-contract.ts',
    baseSourceText: globalAugmentationBase,
    workerSourceText: globalAugmentationWorker,
    headSourceText: globalAugmentationBase
  }],
  globalAugmentationCompatibilityProof: globalProof(globalAugmentationWorker, { consumerDiagnosticsPassed: false })
});
assert.equal(failedConsumerDiagnosticsEdit.status, 'blocked');
assert.equal(failedConsumerDiagnosticsEdit.conflicts[0].details.reasonCodes.includes('global-augmentation-compatibility-consumer-diagnostics-failed'), true);

const claimBearingGlobalAugmentationEdit = safeMergeJsTsProject({
  id: 'js_ts_project_global_augmentation_edit_claim_bearing_proof_blocked',
  language: 'typescript',
  files: [{
    sourcePath: 'src/window-contract.ts',
    baseSourceText: globalAugmentationBase,
    workerSourceText: globalAugmentationWorker,
    headSourceText: globalAugmentationBase
  }],
  globalAugmentationCompatibilityProof: globalProof(globalAugmentationWorker, { semanticEquivalenceClaim: true })
});
assert.equal(claimBearingGlobalAugmentationEdit.status, 'blocked');
assert.equal(claimBearingGlobalAugmentationEdit.conflicts[0].details.reasonCodes.includes('global-augmentation-compatibility-proof-claim-bearing'), true);

function globalProof(sourceText, overrides = {}) {
  return {
    schema: 'frontier.lang.globalAugmentationCompatibilityProof.v1',
    version: 1,
    status: 'passed',
    surfaceKind: 'global-augmentation',
    sourcePath: 'src/window-contract.ts',
    sourceHash: hashSemanticValue(sourceText),
    moduleName: 'global',
    declarationOutputGateId: 'declaration-output',
    declarationOutputHash: 'declaration-boundary-hash',
    consumerDiagnosticsGateId: 'consumer-diagnostics',
    consumerDiagnosticsHash: 'consumer-diagnostics-hash',
    consumerEntrypoints: ['src/index.ts'],
    consumerDiagnosticsPassed: true,
    globalCompatibilityClaim: 'declaration-boundary-consumer-diagnostics-only',
    hostRuntimeInteractionClaim: false,
    autoMergeClaim: false,
    runtimeEquivalenceClaim: false,
    semanticEquivalenceClaim: false,
    ...overrides
  };
}
