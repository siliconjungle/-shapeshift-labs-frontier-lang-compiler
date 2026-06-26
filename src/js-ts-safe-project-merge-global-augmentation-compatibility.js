import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

const GlobalAugmentationCompatibilityRoute = Object.freeze({
  routeId: 'prove-global-augmentation-compatibility',
  routeLane: 'module-runtime-global-augmentation',
  routeNext: 'supply-source-bound-global-augmentation-compatibility-proof'
});

function globalAugmentationCompatibilityAssessment(input = {}, options = {}) {
  const proof = globalAugmentationCompatibilityProofFor(input, options);
  const reasonCodes = [];
  if (!proof) reasonCodes.push('global-augmentation-compatibility-proof-missing');
  else {
    if (proof.status !== 'passed') reasonCodes.push('global-augmentation-compatibility-proof-status-not-passed');
    if (proof.kind !== undefined && proof.kind !== 'frontier.lang.globalAugmentationCompatibilityProof') reasonCodes.push('global-augmentation-compatibility-proof-schema-mismatch');
    if (proof.schema !== undefined && proof.schema !== 'frontier.lang.globalAugmentationCompatibilityProof.v1') reasonCodes.push('global-augmentation-compatibility-proof-schema-mismatch');
    if (proof.surfaceKind !== 'global-augmentation') reasonCodes.push('global-augmentation-compatibility-proof-surface-mismatch');
    if (input.sourcePath && proof.sourcePath !== input.sourcePath) reasonCodes.push('global-augmentation-compatibility-proof-source-path-mismatch');
    if (!sourceHashesMatch(input, proof)) reasonCodes.push('global-augmentation-compatibility-proof-stale-source');
    if (input.moduleName && proof.moduleName !== input.moduleName) reasonCodes.push('global-augmentation-compatibility-proof-surface-mismatch');
    if (input.moduleDeclarationRecordId && proof.moduleDeclarationRecordId !== input.moduleDeclarationRecordId) reasonCodes.push('global-augmentation-compatibility-shape-hash-mismatch');
    if (input.moduleDeclarationShapeHash && proof.moduleDeclarationShapeHash !== input.moduleDeclarationShapeHash) reasonCodes.push('global-augmentation-compatibility-shape-hash-mismatch');
    if (input.moduleDeclarationSignatureHash && proof.moduleDeclarationSignatureHash !== input.moduleDeclarationSignatureHash) reasonCodes.push('global-augmentation-compatibility-shape-hash-mismatch');
    if (input.sourceSpanHash && proof.sourceSpanHash !== input.sourceSpanHash) reasonCodes.push('global-augmentation-compatibility-source-span-mismatch');
    if (input.declarationOutputHash && proof.declarationOutputHash !== input.declarationOutputHash) reasonCodes.push('global-augmentation-compatibility-declaration-output-mismatch');
    if (!proof.declarationOutputGateId || !proof.declarationOutputHash) reasonCodes.push('global-augmentation-compatibility-declaration-output-missing');
    if (!proof.consumerDiagnosticsGateId || !proof.consumerDiagnosticsHash) reasonCodes.push('global-augmentation-compatibility-consumer-diagnostics-missing');
    if (proof.consumerDiagnosticsPassed !== true || input.consumerDiagnosticsPassed === false) reasonCodes.push('global-augmentation-compatibility-consumer-diagnostics-failed');
    if (!Array.isArray(proof.consumerEntrypoints) || proof.consumerEntrypoints.length === 0) reasonCodes.push('global-augmentation-compatibility-consumer-diagnostics-missing');
    if (proof.globalCompatibilityClaim !== 'declaration-boundary-consumer-diagnostics-only'
      || proof.hostRuntimeInteractionClaim !== false
      || proof.runtimeEquivalenceClaim !== false
      || proof.semanticEquivalenceClaim !== false
      || proof.autoMergeClaim !== false) reasonCodes.push('global-augmentation-compatibility-proof-claim-bearing');
  }
  const status = proof && reasonCodes.length === 0 ? 'passed' : proof ? 'failed' : 'missing';
  return {
    status,
    ...GlobalAugmentationCompatibilityRoute,
    reasonCodes: uniqueStrings(reasonCodes),
    record: compactRecord({
      schema: 'frontier.lang.globalAugmentationCompatibilityProofAssessment.v1',
      status,
      proofStatus: proof?.status,
      proofId: proof?.id,
      proofHash: proof?.proofHash,
      ...GlobalAugmentationCompatibilityRoute,
      reasonCodes: uniqueStrings(reasonCodes),
      expected: compactRecord(input),
      globalCompatibilityClaim: 'declaration-boundary-consumer-diagnostics-only',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      hostRuntimeInteractionClaim: false
    })
  };
}

function globalAugmentationCompatibilityProofFor(input = {}, options = {}) {
  const proofs = [
    options.globalAugmentationCompatibilityProof,
    ...(Array.isArray(options.globalAugmentationCompatibilityProofs) ? options.globalAugmentationCompatibilityProofs : [])
  ].filter(Boolean);
  return proofs.find((proof) => (
    proof.moduleDeclarationRecordId === input.moduleDeclarationRecordId
      || proof.sourcePath === input.sourcePath
        && proof.moduleName === (input.moduleName ?? 'global')
        && proof.surfaceKind === 'global-augmentation'
  ));
}

function sourceHashesMatch(input, proof) {
  const expectedHashes = uniqueStrings([input.sourceHash, ...(input.sourceHashes ?? [])]);
  if (!expectedHashes.length) return true;
  const proofHashes = uniqueStrings([proof.sourceHash, ...(proof.sourceHashes ?? [])]);
  return expectedHashes.every((hash) => proofHashes.includes(hash));
}

function sourceSpanHash(sourceSpan) {
  return sourceSpan ? hashSemanticValue({
    start: sourceSpan.start,
    end: sourceSpan.end,
    startLine: sourceSpan.startLine,
    startColumn: sourceSpan.startColumn,
    endLine: sourceSpan.endLine,
    endColumn: sourceSpan.endColumn
  }) : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export {
  GlobalAugmentationCompatibilityRoute,
  globalAugmentationCompatibilityAssessment,
  sourceSpanHash
};
