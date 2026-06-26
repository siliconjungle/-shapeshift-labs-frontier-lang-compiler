import { compactRecord } from './js-ts-safe-merge-context.js';

function missingSharedCompilerTypeInferenceSyntaxEvidence(workerRecord, headRecord) {
  const missing = [workerRecord, headRecord].filter((record) => (
    requiresCompilerTypeInferenceSyntaxProof(record) && !hasPassedCompilerTypeInferenceSyntaxProof(record)
  ));
  if (!missing.length) return undefined;
  return {
    reasonCode: 'typescript-public-api-type-inference-syntax-proof-missing',
    requiredEvidence: 'typescript-checker-public-api-type-inference-syntax-evidence',
    semanticEquivalenceClaim: false,
    missingRecords: missing.map(typeInferenceSyntaxMissingProofRecord)
  };
}

function typeInferenceSyntaxMissingProofRecord(record) {
  const proof = record?.typeInferenceSyntaxProof;
  return compactRecord({
    sourcePath: record.sourcePath,
    sourceHash: record.sourceHash,
    symbolId: record.symbolId,
    symbolName: record.symbolName,
    fullyQualifiedName: record.fullyQualifiedName,
    typeInferenceSyntaxHash: record.typeInferenceSyntaxHash,
    typeInferenceSyntaxProofStatus: proof?.status,
    proofTypeInferenceSyntaxHash: proof?.typeInferenceSyntaxHash,
    typeInferenceSyntaxProofSourcePath: proof?.sourcePath,
    typeInferenceSyntaxProofSourceHash: proof?.sourceHash,
    missingSignals: proof?.missingSignals,
    reasonCodes: typeInferenceSyntaxProofReasonCodes(record, proof),
    semanticEquivalenceClaim: proof?.semanticEquivalenceClaim ?? false,
    evidenceIds: record.evidenceIds
  });
}

function requiresCompilerTypeInferenceSyntaxProof(record) {
  return Boolean(record && (
    record.typeInferenceSyntaxCount > 0
      || record.satisfiesExpressionCount > 0
      || record.asConstAssertionCount > 0
      || record.constTypeParameterCount > 0
      || record.typeInferenceSyntaxHash
      || record.typeInferenceSyntaxProof
  ));
}

function hasPassedCompilerTypeInferenceSyntaxProof(record) {
  const proof = record?.typeInferenceSyntaxProof;
  return Boolean(
    record?.typeInferenceSyntaxHash
      && proof?.status === 'passed'
      && proof?.typeInferenceSyntaxHash === record.typeInferenceSyntaxHash
      && record?.sourcePath
      && record?.sourceHash
      && proof?.sourcePath === record.sourcePath
      && proof?.sourceHash === record.sourceHash
      && !arrayValue(proof?.missingSignals).length
      && !arrayValue(proof?.reasonCodes).length
      && proof.autoMergeClaim === false
      && proof.semanticEquivalenceClaim === false
  );
}

function typeInferenceSyntaxProofReasonCodes(record, proof) {
  const reasonCodes = ['typescript-public-api-type-inference-syntax-proof-missing'];
  if (!proof) return reasonCodes;
  if (proof.status !== 'passed') reasonCodes.push('typescript-type-inference-syntax-proof-status-not-passed');
  if (proof.typeInferenceSyntaxHash !== record?.typeInferenceSyntaxHash) reasonCodes.push('typescript-type-inference-syntax-proof-hash-mismatch');
  if (!record?.sourcePath) reasonCodes.push('typescript-type-inference-syntax-record-source-path-missing');
  if (!record?.sourceHash) reasonCodes.push('typescript-type-inference-syntax-record-source-hash-missing');
  if (proof.sourcePath !== record?.sourcePath) reasonCodes.push('typescript-type-inference-syntax-proof-source-path-mismatch');
  if (proof.sourceHash !== record?.sourceHash) reasonCodes.push('typescript-type-inference-syntax-proof-source-hash-mismatch');
  if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false) reasonCodes.push('typescript-type-inference-syntax-proof-claim-flags-missing');
  return uniqueStrings([...reasonCodes, ...arrayValue(proof.reasonCodes), ...arrayValue(proof.missingSignals).map((signal) => `typescript-${signal}-missing`)]);
}

function arrayValue(value) { return Array.isArray(value) ? value : []; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { missingSharedCompilerTypeInferenceSyntaxEvidence };
