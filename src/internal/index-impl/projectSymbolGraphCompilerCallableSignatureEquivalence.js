import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function compilerCallableSignatureEquivalenceRecord(value, counts, sourceBinding = {}) {
  if (!requiresCallableSignatureProof(counts)) return { reasonCodes: [] };
  const checkerEvidence = callableSignatureCheckerEvidence(value, counts, sourceBinding);
  const missingSignals = missingCallableSignatureEquivalenceSignals(value, counts, checkerEvidence, sourceBinding);
  const reasonCodes = callableSignatureReasonCodes(counts, missingSignals);
  const canProve = missingSignals.length === 0;
  const callSignatureSetHash = canProve && counts.callSignatureCount > 0 ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerCallSignatureSetEquivalence.v1', callSignatures: canonicalSignatureRecords(value.callSignatures) }) : undefined;
  const constructSignatureSetHash = canProve && counts.constructSignatureCount > 0 ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerConstructSignatureSetEquivalence.v1', constructSignatures: canonicalSignatureRecords(value.constructSignatures) }) : undefined;
  const proof = compactRecord({
    kind: callableSignatureProofKind(counts),
    status: canProve ? 'passed' : 'failed',
    proofLevel: callableSignatureProofLevel(counts),
    checkerInvariant: callableSignatureCheckerInvariant(counts, sourceBinding),
    requiredSignals: callableSignatureRequiredSignals(counts, sourceBinding),
    missingSignals: nonEmptyArray(missingSignals),
    reasonCodes: nonEmptyArray(reasonCodes),
    callSignatureSetHash,
    constructSignatureSetHash,
    sourcePath: sourceBinding.sourcePath,
    sourceHash: sourceBinding.sourceHash,
    sourceBoundPublicApi: sourceBinding.publicContract === true || undefined,
    callSignatureCount: counts.callSignatureCount || undefined,
    constructSignatureCount: counts.constructSignatureCount || undefined,
    evidenceIds: counts.evidenceIds,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
  return { status: canProve ? 'compiler-backed-equivalent' : 'unsupported', reasonCodes: canProve ? [] : reasonCodes, callSignatureSetHash, constructSignatureSetHash, proof, checkerEvidence };
}

function requiresCallableSignatureProof(counts) { return counts.callSignatureCount > 0 || counts.constructSignatureCount > 0; }
function callableSignatureProofKind(counts) {
  if (counts.callSignatureCount > 0 && counts.constructSignatureCount > 0) return 'typescript-checker-public-api-callable-and-construct-signature-shape-equivalence';
  return counts.constructSignatureCount > 0 ? 'typescript-checker-public-api-construct-signature-shape-equivalence' : 'typescript-checker-public-api-call-signature-shape-equivalence';
}
function callableSignatureProofLevel(counts) {
  const levels = [counts.callSignatureCount > 0 ? 'call-signature-set' : undefined, counts.constructSignatureCount > 0 ? 'construct-signature-set' : undefined].filter(Boolean);
  return `typescript-checker-public-api-${levels.join('-and-')}`;
}
function callableSignatureCheckerInvariant(counts, sourceBinding = {}) {
  return [
    sourceBinding.publicContract === true ? 'public API source path/hash bound' : undefined,
    counts.callSignatureCount > 0 ? 'call signatures/returns/parameters complete' : undefined,
    counts.constructSignatureCount > 0 ? 'construct signatures/returns/parameters complete' : undefined
  ].filter(Boolean).join('; ');
}
function callableSignatureRequiredSignals(counts, sourceBinding = {}) {
  return [
    sourceBinding.publicContract === true ? 'compiler-public-api-source-path' : undefined,
    sourceBinding.publicContract === true ? 'compiler-public-api-source-hash' : undefined,
    counts.callSignatureCount > 0 ? 'compiler-call-signature-count' : undefined,
    counts.callSignatureCount > 0 ? 'compiler-call-signature-texts' : undefined,
    counts.callSignatureCount > 0 ? 'compiler-call-signature-return-type-texts' : undefined,
    counts.callSignatureCount > 0 ? 'compiler-call-signature-parameter-type-texts' : undefined,
    counts.constructSignatureCount > 0 ? 'compiler-construct-signature-count' : undefined,
    counts.constructSignatureCount > 0 ? 'compiler-construct-signature-texts' : undefined,
    counts.constructSignatureCount > 0 ? 'compiler-construct-signature-return-type-texts' : undefined,
    counts.constructSignatureCount > 0 ? 'compiler-construct-signature-parameter-type-texts' : undefined
  ].filter(Boolean);
}
function callableSignatureReasonCodes(counts, missingSignals = []) {
  return uniqueStrings([
    counts.callSignatureCount > 0 ? 'typescript-public-call-signature-shape-equivalence-unproven' : undefined,
    counts.constructSignatureCount > 0 ? 'typescript-public-construct-signature-shape-equivalence-unproven' : undefined,
    ...missingSignals.map((signal) => `typescript-${signal}-missing`)
  ]);
}
function missingCallableSignatureEquivalenceSignals(value, counts, checkerEvidence = callableSignatureCheckerEvidence(value, counts), sourceBinding = {}) {
  const missing = [];
  if (sourceBinding.publicContract === true && !checkerEvidence.sourcePath) missing.push('compiler-public-api-source-path');
  if (sourceBinding.publicContract === true && !checkerEvidence.sourceHash) missing.push('compiler-public-api-source-hash');
  if (counts.callSignatureCount > 0 && checkerEvidence.callSignatureTexts.length !== counts.callSignatureCount) missing.push('compiler-call-signature-count');
  if (counts.callSignatureCount > 0 && checkerEvidence.callSignatureTexts.some((text) => !text)) missing.push('compiler-call-signature-texts');
  if (counts.callSignatureCount > 0 && checkerEvidence.callReturnTypeTexts.some((text) => !text)) missing.push('compiler-call-signature-return-type-texts');
  if (counts.callSignatureCount > 0 && !signaturesHaveParameterTypes(value.callSignatures)) missing.push('compiler-call-signature-parameter-type-texts');
  if (counts.constructSignatureCount > 0 && checkerEvidence.constructSignatureTexts.length !== counts.constructSignatureCount) missing.push('compiler-construct-signature-count');
  if (counts.constructSignatureCount > 0 && checkerEvidence.constructSignatureTexts.some((text) => !text)) missing.push('compiler-construct-signature-texts');
  if (counts.constructSignatureCount > 0 && checkerEvidence.constructReturnTypeTexts.some((text) => !text)) missing.push('compiler-construct-signature-return-type-texts');
  if (counts.constructSignatureCount > 0 && !signaturesHaveParameterTypes(value.constructSignatures)) missing.push('compiler-construct-signature-parameter-type-texts');
  return uniqueStrings(missing);
}
function callableSignatureCheckerEvidence(value, counts, sourceBinding = {}) {
  const callSignatures = arrayValue(value.callSignatures), constructSignatures = arrayValue(value.constructSignatures);
  return compactRecord({
    sourcePath: sourceBinding.sourcePath,
    sourceHash: sourceBinding.sourceHash,
    sourceBoundPublicApi: sourceBinding.publicContract === true || undefined,
    callSignatureCount: counts.callSignatureCount || undefined,
    constructSignatureCount: counts.constructSignatureCount || undefined,
    callSignatureTexts: callSignatures.map((signature) => signature.signatureText),
    callReturnTypeTexts: callSignatures.map((signature) => signature.returnTypeText),
    callParameterTypeTexts: callSignatures.map((signature) => arrayValue(signature.parameters).map((parameter) => parameter.typeText)),
    constructSignatureTexts: constructSignatures.map((signature) => signature.signatureText),
    constructReturnTypeTexts: constructSignatures.map((signature) => signature.returnTypeText),
    constructParameterTypeTexts: constructSignatures.map((signature) => arrayValue(signature.parameters).map((parameter) => parameter.typeText))
  });
}
function signaturesHaveParameterTypes(signatures) { return arrayValue(signatures).every((signature) => arrayValue(signature.parameters).every((parameter) => Boolean(parameter.typeText))); }
function canonicalSignatureRecords(signatures) { return arrayValue(signatures).map((signature) => compactRecord({ ...signature, parameters: nonEmptyArray(arrayValue(signature.parameters).map(({ flags: _flags, ...parameter }) => parameter)) })); }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { callableSignatureCheckerEvidence, callableSignatureProofKind, callableSignatureReasonCodes, callableSignatureRequiredSignals, compilerCallableSignatureEquivalenceRecord, missingCallableSignatureEquivalenceSignals, requiresCallableSignatureProof };
