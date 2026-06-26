import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const IndexSignatureTypeEquivalenceProofKind = 'typescript-checker-public-api-index-signature-equivalence';

function indexSignatureSetHash(value, counts) {
  return counts.indexSignatureCount > 0 ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerPublicIndexSignatureSetEquivalence.v1', indexSignatures: arrayValue(value.indexSignatures) }) : undefined;
}

function indexSignatureProofKind(counts) { return counts.indexSignatureCount > 0 ? IndexSignatureTypeEquivalenceProofKind : undefined; }
function indexSignatureUnsupportedReasonCodes(counts) { return counts.indexSignatureCount > 0 ? ['typescript-public-index-signature-equivalence-unproven'] : []; }
function indexSignatureProofLevel(counts) { return counts.indexSignatureCount > 0 ? 'index-signature-set' : undefined; }
function indexSignatureCheckerInvariant(counts) { return counts.indexSignatureCount > 0 ? 'index signature key/value/modifiers complete' : undefined; }
function indexSignatureRequiredSignals(counts) {
  return counts.indexSignatureCount > 0 ? [
    'compiler-index-signature-count',
    'compiler-index-signature-key-type-texts',
    'compiler-index-signature-value-type-texts',
    'compiler-index-signature-readonly'
  ] : [];
}

function missingIndexSignatureEquivalenceSignals(_value, counts, checkerEvidence) {
  const missing = [];
  if (counts.indexSignatureCount > 0 && checkerEvidence.indexSignatureKeyTypeTexts.length !== counts.indexSignatureCount) missing.push('compiler-index-signature-count');
  if (counts.indexSignatureCount > 0 && (checkerEvidence.indexSignatureKeyTypeTexts.length !== counts.indexSignatureCount || checkerEvidence.indexSignatureKeyTypeTexts.some((text) => !text))) missing.push('compiler-index-signature-key-type-texts');
  if (counts.indexSignatureCount > 0 && (checkerEvidence.indexSignatureValueTypeTexts.length !== counts.indexSignatureCount || checkerEvidence.indexSignatureValueTypeTexts.some((text) => !text))) missing.push('compiler-index-signature-value-type-texts');
  if (counts.indexSignatureCount > 0 && !compilerBooleanSignalsCovered(checkerEvidence.indexSignatureReadonly, counts.indexSignatureCount)) missing.push('compiler-index-signature-readonly');
  return missing;
}

function indexSignatureCheckerEvidence(value, counts) {
  const indexSignatures = arrayValue(value.indexSignatures);
  return compactRecord({
    indexSignatureCount: counts.indexSignatureCount || undefined,
    indexSignatureReadonlyCount: counts.indexSignatureReadonlyCount || undefined,
    indexSignatureKeyTypeTexts: indexSignatures.map((signature) => signature.keyTypeText),
    indexSignatureValueTypeTexts: indexSignatures.map((signature) => signature.valueTypeText),
    indexSignatureReadonly: indexSignatures.map((signature) => signature.readonly),
    indexSignatureDeclarationTexts: indexSignatures.map((signature) => signature.declarationText),
    indexSignatures: nonEmptyArray(indexSignatures)
  });
}

function compilerBooleanSignalsCovered(values, count) { return Array.isArray(values) && values.length === count && values.every((value) => typeof value === 'boolean'); }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export {
  indexSignatureCheckerEvidence,
  indexSignatureCheckerInvariant,
  indexSignatureProofKind,
  indexSignatureProofLevel,
  indexSignatureRequiredSignals,
  indexSignatureSetHash,
  indexSignatureUnsupportedReasonCodes,
  missingIndexSignatureEquivalenceSignals
};
