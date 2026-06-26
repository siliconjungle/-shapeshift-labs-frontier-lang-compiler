import * as compilerApi from '../src/index.js';

const typedGlobalAugmentationCompatibilityProof: compilerApi.JsTsProjectGlobalAugmentationCompatibilityProof = {
  schema: 'frontier.lang.globalAugmentationCompatibilityProof.v1',
  version: 1,
  status: 'passed',
  surfaceKind: 'global-augmentation',
  sourcePath: 'src/window-contract.ts',
  sourceHash: 'source-hash',
  moduleName: 'global',
  moduleDeclarationRecordId: 'module-declaration-id',
  moduleDeclarationShapeHash: 'shape-hash',
  moduleDeclarationSignatureHash: 'signature-hash',
  sourceSpanHash: 'span-hash',
  declarationOutputGateId: 'declaration-output',
  declarationOutputHash: 'declaration-boundary-hash',
  declarationEmitParityProofId: 'declaration-parity-proof',
  consumerDiagnosticsGateId: 'consumer-diagnostics',
  consumerDiagnosticsHash: 'diagnostics-hash',
  consumerEntrypoints: ['src/index.ts'],
  consumerDiagnosticsPassed: true,
  proofHash: 'proof-hash',
  evidenceIds: ['evidence-id'],
  globalCompatibilityClaim: 'declaration-boundary-consumer-diagnostics-only',
  hostRuntimeInteractionClaim: false,
  autoMergeClaim: false,
  runtimeEquivalenceClaim: false,
  semanticEquivalenceClaim: false
};

compilerApi.safeMergeJsTsProject({
  globalAugmentationCompatibilityProof: typedGlobalAugmentationCompatibilityProof,
  globalAugmentationCompatibilityProofs: [typedGlobalAugmentationCompatibilityProof]
});
