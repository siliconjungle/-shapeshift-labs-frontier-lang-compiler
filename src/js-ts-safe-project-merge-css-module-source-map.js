import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

function cssModuleSourceMapIdentityProof(mergeOptions = {}, context = {}) {
  const proof = firstObject(
    mergeOptions.cssModuleSourceMapIdentityProof,
    mergeOptions.sourceMapIdentityProof,
    mergeOptions.cssModuleSourceMapProof,
    mergeOptions.sourceMapProof
  );
  const declaredHash = firstString(mergeOptions.sourceMapProofHash, mergeOptions.cssModuleSourceMapProofHash);
  if (!proof) return {
    status: declaredHash ? 'hash-only' : 'missing',
    sourceMapProofHash: declaredHash,
    reasonCodes: declaredHash ? [] : ['css-module-source-map-proof-missing']
  };
  const reasonCodes = [];
  if (proof.status !== 'passed' && proof.status !== 'verified') reasonCodes.push('css-module-source-map-proof-status-not-passed');
  if (proof.schema !== 'frontier.lang.cssModuleSourceMapIdentityProof.v1' && proof.kind !== 'frontier.lang.cssModuleSourceMapIdentityProof') reasonCodes.push('css-module-source-map-proof-schema-missing');
  const sourcePath = firstString(context.sourcePath, proof.sourcePath);
  const originalSourcePath = firstString(proof.originalSourcePath, proof.sourcePath, sourcePath);
  const generatedSourcePath = firstString(proof.generatedSourcePath, proof.generatedPath, proof.outputSourcePath);
  const originalSourceHash = firstString(proof.originalSourceHash, proof.sourceHash, context.sourceHash, context.outputSourceHash);
  const generatedSourceHash = firstString(proof.generatedSourceHash, proof.generatedHash, proof.outputGeneratedSourceHash, context.generatedSourceHash);
  const generatedClassNameMapHash = firstString(proof.generatedClassNameMapHash, context.generatedClassNameMapHash);
  const bundlerTransformHash = firstString(proof.bundlerTransformHash, context.bundlerTransformHash);
  if (proof.sourcePath !== undefined && proof.sourcePath !== sourcePath) reasonCodes.push('css-module-source-map-proof-source-path-mismatch');
  if (proof.originalSourcePath !== undefined && proof.originalSourcePath !== sourcePath) reasonCodes.push('css-module-source-map-proof-source-path-mismatch');
  if (context.sourceHash && originalSourceHash !== context.sourceHash && originalSourceHash !== context.outputSourceHash) reasonCodes.push('css-module-source-map-proof-source-hash-mismatch');
  if (!generatedSourceHash) reasonCodes.push('css-module-source-map-proof-generated-source-hash-missing');
  if (context.generatedClassNameMapHash && generatedClassNameMapHash !== context.generatedClassNameMapHash) reasonCodes.push('css-module-source-map-proof-generated-class-map-hash-mismatch');
  if (context.bundlerTransformHash && bundlerTransformHash !== context.bundlerTransformHash) reasonCodes.push('css-module-source-map-proof-bundler-transform-hash-mismatch');
  const mappings = normalizeMappings(proof.mappings ?? mergeOptions.sourceMapMappings);
  if (!mappings.length) reasonCodes.push('css-module-source-map-proof-mappings-missing');
  for (const mapping of mappings) reasonCodes.push(...mappingReasonCodes(mapping, originalSourcePath, generatedSourcePath));
  if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
    || proof.sourceMapIdentityClaim !== true || proof.claimScope !== 'css-module-source-map-generated-class-identity-only') {
    reasonCodes.push('css-module-source-map-proof-claim-flags-missing');
  }
  const hashInput = compactRecord({
    kind: 'frontier.lang.cssModuleSourceMapIdentityProof.hash.v1',
    sourcePath,
    originalSourcePath,
    generatedSourcePath,
    originalSourceHash,
    generatedSourceHash,
    generatedClassNameMapHash,
    bundlerTransformHash,
    mappings
  });
  const computedSourceMapProofHash = hashSemanticValue(hashInput);
  if (proof.proofHash !== undefined && proof.proofHash !== computedSourceMapProofHash) reasonCodes.push('css-module-source-map-proof-hash-mismatch');
  if (declaredHash && declaredHash !== computedSourceMapProofHash) reasonCodes.push('css-module-source-map-proof-hash-mismatch');
  const status = reasonCodes.length ? 'failed' : 'passed';
  return compactRecord({
    status,
    sourceMapProofHash: status === 'passed' ? computedSourceMapProofHash : undefined,
    computedSourceMapProofHash,
    reasonCodes: uniqueStrings(reasonCodes),
    record: {
      schema: 'frontier.lang.cssModuleSourceMapIdentityProofAssessment.v1',
      status,
      expected: hashInput,
      reasonCodes: uniqueStrings(reasonCodes),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      sourceMapIdentityClaim: status === 'passed'
    }
  });
}

function cssModuleSourceMapIdentityMergeOptions(mergeOptions = {}, context = {}) {
  const proof = cssModuleSourceMapIdentityProof(mergeOptions, context);
  if (!proof.sourceMapProofHash || firstString(mergeOptions.sourceMapProofHash, mergeOptions.cssModuleSourceMapProofHash)) return {};
  return { sourceMapProofHash: proof.sourceMapProofHash, cssModuleSourceMapProofHash: proof.sourceMapProofHash };
}

function normalizeMappings(value) {
  return Array.isArray(value) ? value.map((item) => compactRecord({
    originalSourcePath: firstString(item?.originalSourcePath, item?.sourcePath),
    generatedSourcePath: firstString(item?.generatedSourcePath, item?.generatedPath),
    originalStart: numberValue(item?.originalStart ?? item?.sourceStart),
    originalEnd: numberValue(item?.originalEnd ?? item?.sourceEnd),
    generatedStart: numberValue(item?.generatedStart),
    generatedEnd: numberValue(item?.generatedEnd),
    originalName: firstString(item?.originalName, item?.name),
    generatedName: firstString(item?.generatedName)
  })) : [];
}

function mappingReasonCodes(mapping, originalSourcePath, generatedSourcePath) {
  const reasons = [];
  if (mapping.originalSourcePath && mapping.originalSourcePath !== originalSourcePath) reasons.push('css-module-source-map-proof-mapping-source-path-mismatch');
  if (generatedSourcePath && mapping.generatedSourcePath && mapping.generatedSourcePath !== generatedSourcePath) reasons.push('css-module-source-map-proof-mapping-generated-path-mismatch');
  for (const field of ['originalStart', 'originalEnd', 'generatedStart', 'generatedEnd']) {
    if (!Number.isFinite(mapping[field])) reasons.push('css-module-source-map-proof-mapping-span-missing');
  }
  if (Number.isFinite(mapping.originalStart) && Number.isFinite(mapping.originalEnd) && mapping.originalStart >= mapping.originalEnd) reasons.push('css-module-source-map-proof-mapping-span-invalid');
  if (Number.isFinite(mapping.generatedStart) && Number.isFinite(mapping.generatedEnd) && mapping.generatedStart >= mapping.generatedEnd) reasons.push('css-module-source-map-proof-mapping-span-invalid');
  return reasons;
}

function firstObject(...values) { return values.find((value) => value && typeof value === 'object' && !Array.isArray(value)); }
function firstString(...values) { for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value); return undefined; }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { cssModuleSourceMapIdentityMergeOptions, cssModuleSourceMapIdentityProof };
