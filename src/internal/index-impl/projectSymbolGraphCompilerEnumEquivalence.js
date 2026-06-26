import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const EnumShapeTypeEquivalenceProofKind = 'typescript-checker-public-api-enum-runtime-shape-equivalence';
const ComputedEnumRuntimeValueProofSchema = 'frontier.lang.typescript.computedEnumRuntimeValueProof.v1';
const ComputedEnumRuntimeValueProofKind = 'frontier.lang.typescript.computedEnumRuntimeValueProof';
const PassedStatuses = new Set(['passed', 'verified']);

function enumRuntimeShapeHash(value, counts) {
  return counts.enumMemberCount > 0 ? value.enumRuntimeShapeHash : undefined;
}

function enumUnsupportedReasonCodes(value, counts, source = {}) {
  const reasonCodes = [];
  if (counts.enumMemberCount > 0) reasonCodes.push('typescript-enum-runtime-shape-equivalence-unproven');
  const computedProof = computedEnumRuntimeValueProofBinding(value, counts, source);
  if (counts.enumComputedMemberCount > 0 && !computedProof.passed) {
    reasonCodes.push('typescript-enum-computed-runtime-value-equivalence-unproven');
    reasonCodes.push(...computedProof.reasonCodes);
  }
  return reasonCodes;
}

function enumProofKind(counts) {
  return counts.enumMemberCount > 0 ? EnumShapeTypeEquivalenceProofKind : undefined;
}

function enumProofLevel(counts) {
  return counts.enumMemberCount > 0 ? 'enum-runtime-shape' : undefined;
}

function enumCheckerInvariant(counts) {
  return counts.enumMemberCount > 0 ? 'enum member names, order, initializer texts, and constant runtime values complete' : undefined;
}

function enumRequiredSignals(counts) {
  if (counts.enumMemberCount <= 0) return [];
  return [
    'compiler-enum-member-count',
    'compiler-enum-member-names',
    'compiler-enum-member-value-texts',
    'compiler-enum-member-initializer-texts',
    counts.enumComputedMemberCount > 0 ? 'compiler-enum-computed-runtime-value-proof' : undefined
  ].filter(Boolean);
}

function missingEnumEquivalenceSignals(value, counts) {
  if (counts.enumMemberCount <= 0) return [];
  const members = arrayValue(value.enumMembers);
  const missing = [];
  if (members.length !== counts.enumMemberCount) missing.push('compiler-enum-member-count');
  if (members.length !== counts.enumMemberCount || members.some((member) => !member.name)) missing.push('compiler-enum-member-names');
  if (members.length !== counts.enumMemberCount || members.some((member) => member.valueText === undefined && !member.computed)) missing.push('compiler-enum-member-value-texts');
  if (!value.enumRuntimeShapeHash) missing.push('compiler-enum-runtime-shape-hash');
  return missing;
}

function enumUnsupportedSignals(value, counts, source = {}) {
  if (counts.enumComputedMemberCount <= 0) return [];
  return computedEnumRuntimeValueProofBinding(value, counts, source).passed
    ? []
    : ['compiler-enum-computed-runtime-value'];
}

function enumCheckerEvidence(value, counts) {
  if (counts.enumMemberCount <= 0) return {};
  const members = arrayValue(value.enumMembers);
  return compactRecord({
    enumKind: value.enumKind,
    constEnum: value.constEnum,
    declareEnum: value.declareEnum,
    enumDeclarationCount: value.enumDeclarationCount,
    enumMemberCount: counts.enumMemberCount,
    enumNumericMemberCount: counts.enumNumericMemberCount || undefined,
    enumStringMemberCount: counts.enumStringMemberCount || undefined,
    enumAutoMemberCount: counts.enumAutoMemberCount || undefined,
    enumComputedMemberCount: counts.enumComputedMemberCount || undefined,
    enumRuntimeShapeHash: value.enumRuntimeShapeHash,
    enumMemberNames: members.map((member) => member.name),
    enumMemberValueTexts: members.map((member) => member.valueText),
    enumMemberInitializerTexts: members.map((member) => member.initializerText),
    enumMembers: nonEmptyArray(members)
  });
}

function computedEnumRuntimeValueProofBinding(value, counts, source = {}) {
  if (counts.enumComputedMemberCount <= 0) return { passed: false, evidenceIds: [], reasonCodes: [] };
  const proof = computedEnumRuntimeValueProofCandidate(value);
  const expectedHash = computedEnumRuntimeValueHash(value, source);
  if (!proof) return {
    passed: false,
    evidenceIds: [],
    reasonCodes: ['typescript-computed-enum-runtime-value-proof-missing'],
    computedEnumRuntimeValueHash: expectedHash
  };
  const reasonCodes = [];
  if (!PassedStatuses.has(String(proof.status ?? ''))) reasonCodes.push('typescript-computed-enum-runtime-value-proof-status-not-passed');
  if (proof.schema !== ComputedEnumRuntimeValueProofSchema && proof.kind !== ComputedEnumRuntimeValueProofKind) reasonCodes.push('typescript-computed-enum-runtime-value-proof-schema-missing');
  if (proof.sourcePath !== source.sourcePath) reasonCodes.push('typescript-computed-enum-runtime-value-proof-source-path-mismatch');
  if (proof.sourceHash !== source.sourceHash) reasonCodes.push('typescript-computed-enum-runtime-value-proof-source-hash-mismatch');
  if (proof.enumRuntimeShapeHash !== value.enumRuntimeShapeHash) reasonCodes.push('typescript-computed-enum-runtime-value-proof-enum-shape-hash-mismatch');
  if (value.enumEmittedRuntimeShapeHash && !proof.enumEmittedRuntimeShapeHash) reasonCodes.push('typescript-computed-enum-emitted-runtime-shape-proof-missing');
  if (proof.enumEmittedRuntimeShapeHash && proof.enumEmittedRuntimeShapeHash !== value.enumEmittedRuntimeShapeHash) reasonCodes.push('typescript-computed-enum-emitted-runtime-shape-proof-mismatch');
  if (Number(proof.enumComputedMemberCount) !== Number(counts.enumComputedMemberCount)) reasonCodes.push('typescript-computed-enum-runtime-value-proof-member-count-mismatch');
  if (computedRuntimeValueMissing(value)) reasonCodes.push('typescript-computed-enum-runtime-value-proof-runtime-value-missing');
  if (proof.computedEnumRuntimeValueHash !== expectedHash) reasonCodes.push('typescript-computed-enum-runtime-value-proof-value-hash-mismatch');
  if (!proof.traceHash) reasonCodes.push('typescript-computed-enum-runtime-value-proof-trace-hash-missing');
  if (!proof.evidenceHash) reasonCodes.push('typescript-computed-enum-runtime-value-proof-evidence-hash-missing');
  if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
    || proof.computedEnumRuntimeEvaluationEquivalenceClaim !== false) {
    reasonCodes.push('typescript-computed-enum-runtime-value-proof-claim-flags-missing');
  }
  return {
    passed: reasonCodes.length === 0,
    evidenceIds: uniqueStrings([proof.id, proof.evidenceId, ...arrayValue(proof.evidenceIds)]),
    reasonCodes: uniqueStrings(reasonCodes),
    computedEnumRuntimeValueHash: expectedHash,
    proof: compactRecord({
      id: proof.id,
      evidenceId: proof.evidenceId,
      status: proof.status,
      sourcePath: proof.sourcePath,
      sourceHash: proof.sourceHash,
      enumRuntimeShapeHash: proof.enumRuntimeShapeHash,
      enumEmittedRuntimeShapeHash: proof.enumEmittedRuntimeShapeHash,
      enumComputedMemberCount: proof.enumComputedMemberCount,
      computedMembers: nonEmptyArray(arrayValue(proof.computedMembers)),
      computedEnumRuntimeValueHash: proof.computedEnumRuntimeValueHash,
      command: proof.command,
      traceHash: proof.traceHash,
      evidenceHash: proof.evidenceHash,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      computedEnumRuntimeEvaluationEquivalenceClaim: false
    })
  };
}

function computedEnumRuntimeValueProofCandidate(value) {
  return objectValue(value.computedEnumRuntimeValueProof)
    ?? objectValue(value.computedEnumRuntimeValueEvidence)
    ?? objectValue(value.enumRuntimeShapeProof?.computedEnumRuntimeValueProof);
}

function computedRuntimeValueMissing(value) {
  return arrayValue(value.enumMembers)
    .filter((member) => member?.computed === true)
    .some((member) => member.runtimeValueText === undefined || member.runtimeValueKind === undefined);
}

function computedEnumRuntimeValueHash(value, source = {}) {
  const computedMembers = arrayValue(value.enumMembers).filter((member) => member?.computed === true);
  if (!computedMembers.length) return undefined;
  return hashSemanticValue({
    kind: 'frontier.lang.typescript.computedEnumRuntimeValueProof.values',
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    enumRuntimeShapeHash: value.enumRuntimeShapeHash,
    computedMembers: computedMembers.map((member) => compactRecord({
      name: member.name,
      ordinal: member.ordinal,
      declarationOrdinal: member.declarationOrdinal,
      initializerText: member.initializerText,
      runtimeValueText: member.runtimeValueText,
      runtimeValueKind: member.runtimeValueKind
    }))
  });
}

function arrayValue(value) { return Array.isArray(value) ? value : []; }
function objectValue(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  computedEnumRuntimeValueHash,
  computedEnumRuntimeValueProofBinding,
  enumCheckerEvidence,
  enumCheckerInvariant,
  enumProofKind,
  enumProofLevel,
  enumRequiredSignals,
  enumRuntimeShapeHash,
  enumUnsupportedReasonCodes,
  enumUnsupportedSignals,
  missingEnumEquivalenceSignals
};
