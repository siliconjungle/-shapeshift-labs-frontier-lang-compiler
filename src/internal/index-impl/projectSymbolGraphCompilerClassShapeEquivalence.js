import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const ClassPrivateAccessorShapeProofKind = 'typescript-checker-public-api-class-private-accessor-shape-equivalence';

function classShapeSetHashes(value, counts) {
  return compactRecord({
    privateClassMemberSetHash: counts.privateClassMemberCount > 0
      ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerPrivateClassMemberSetEquivalence.v1', privateClassMembers: canonicalMemberRecords(value.privateClassMembers) })
      : undefined,
    accessorFieldSetHash: counts.accessorFieldCount > 0
      ? hashSemanticValue({ kind: 'frontier.lang.typescript.compilerAccessorFieldSetEquivalence.v1', accessorFieldMembers: canonicalMemberRecords(value.accessorFieldMembers) })
      : undefined
  });
}

function classShapeUnsupportedReasonCodes(counts) {
  return [
    counts.privateClassMemberCount > 0 ? 'typescript-private-class-member-shape-equivalence-unproven' : undefined,
    counts.accessorFieldCount > 0 ? 'typescript-accessor-field-shape-equivalence-unproven' : undefined
  ].filter(Boolean);
}

function classShapeProofKind(counts) {
  return counts.privateClassMemberCount > 0 || counts.accessorFieldCount > 0 ? ClassPrivateAccessorShapeProofKind : undefined;
}

function classShapeProofLevel(counts) {
  const levels = [];
  if (counts.privateClassMemberCount > 0) levels.push('private-class-member-set');
  if (counts.accessorFieldCount > 0) levels.push('accessor-field-set');
  return levels.length ? levels.join('-and-') : undefined;
}

function classShapeCheckerInvariant(counts) {
  const invariants = [];
  if (counts.privateClassMemberCount > 0) invariants.push('private class member names/kinds/types complete');
  if (counts.accessorFieldCount > 0) invariants.push('accessor field names/types/modifiers complete');
  return invariants.join('; ');
}

function classShapeRequiredSignals(counts) {
  return [
    counts.privateClassMemberCount > 0 ? 'compiler-private-class-member-count' : undefined,
    counts.privateClassMemberCount > 0 ? 'compiler-private-class-member-names' : undefined,
    counts.privateClassMemberCount > 0 ? 'compiler-private-class-member-type-or-signature-texts' : undefined,
    counts.privateClassMemberCount > 0 ? 'compiler-private-class-member-shape-hash' : undefined,
    counts.accessorFieldCount > 0 ? 'compiler-accessor-field-count' : undefined,
    counts.accessorFieldCount > 0 ? 'compiler-accessor-field-names' : undefined,
    counts.accessorFieldCount > 0 ? 'compiler-accessor-field-type-texts' : undefined,
    counts.accessorFieldCount > 0 ? 'compiler-accessor-field-shape-hash' : undefined
  ].filter(Boolean);
}

function missingClassShapeEquivalenceSignals(value, counts, checkerEvidence) {
  const missing = [];
  if (counts.privateClassMemberCount > 0 && checkerEvidence.privateClassMemberNames.length !== counts.privateClassMemberCount) missing.push('compiler-private-class-member-count');
  if (counts.privateClassMemberCount > 0 && checkerEvidence.privateClassMemberNames.some((text) => !text)) missing.push('compiler-private-class-member-names');
  if (counts.privateClassMemberCount > 0 && checkerEvidence.privateClassMemberTypeOrSignatureTexts.some((text) => !text)) missing.push('compiler-private-class-member-type-or-signature-texts');
  if (counts.privateClassMemberCount > 0 && !value.privateClassMemberShapeHash) missing.push('compiler-private-class-member-shape-hash');
  if (counts.accessorFieldCount > 0 && checkerEvidence.accessorFieldNames.length !== counts.accessorFieldCount) missing.push('compiler-accessor-field-count');
  if (counts.accessorFieldCount > 0 && checkerEvidence.accessorFieldNames.some((text) => !text)) missing.push('compiler-accessor-field-names');
  if (counts.accessorFieldCount > 0 && checkerEvidence.accessorFieldTypeTexts.some((text) => !text)) missing.push('compiler-accessor-field-type-texts');
  if (counts.accessorFieldCount > 0 && !value.accessorFieldShapeHash) missing.push('compiler-accessor-field-shape-hash');
  return uniqueStrings(missing);
}

function classShapeCheckerEvidence(value, counts) {
  const privateClassMembers = arrayValue(value.privateClassMembers);
  const accessorFieldMembers = arrayValue(value.accessorFieldMembers);
  return compactRecord({
    privateClassMemberCount: counts.privateClassMemberCount || undefined,
    privateClassMemberNames: privateClassMembers.map((member) => member.name),
    privateClassMemberKinds: privateClassMembers.map((member) => member.kind),
    privateClassMemberTypeOrSignatureTexts: privateClassMembers.map((member) => member.typeText ?? member.signatureText),
    privateClassMemberShapeHash: value.privateClassMemberShapeHash,
    accessorFieldCount: counts.accessorFieldCount || undefined,
    accessorFieldNames: accessorFieldMembers.map((member) => member.name),
    accessorFieldTypeTexts: accessorFieldMembers.map((member) => member.typeText),
    accessorFieldShapeHash: value.accessorFieldShapeHash,
    privateClassMembers: nonEmptyArray(privateClassMembers),
    accessorFieldMembers: nonEmptyArray(accessorFieldMembers)
  });
}

function canonicalMemberRecords(records) {
  return arrayValue(records).map(({ memberText: _memberText, ...record }) => record);
}

function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  classShapeCheckerEvidence,
  classShapeCheckerInvariant,
  classShapeProofKind,
  classShapeProofLevel,
  classShapeRequiredSignals,
  classShapeSetHashes,
  classShapeUnsupportedReasonCodes,
  missingClassShapeEquivalenceSignals
};
