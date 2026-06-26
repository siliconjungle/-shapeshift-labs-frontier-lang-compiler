import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const ClassPrivateAccessorRuntimeProofSchema = 'frontier.lang.typescript.classPrivateAccessorRuntimeProof.v1';
const ClassPrivateAccessorRuntimeProofKind = 'frontier.lang.typescript.classPrivateAccessorRuntimeProof';
const ClassPrivateAccessorRuntimeBoundCode = 'class-private-accessor-runtime-proof-bound';
const ClassPrivateAccessorRuntimeRouteId = 'prove-class-private-accessor-runtime-equivalence';
const ClassPrivateAccessorRuntimeRouteLane = 'class-private-accessor-runtime-boundaries';
const ClassPrivateAccessorRuntimeRouteNext = 'supply-class-private-accessor-runtime-proof';
const PassedStatuses = new Set(['passed', 'verified']);
const TraceHashSignalsByKey = Object.freeze({
  classConstructionOrderTraceHash: 'typescript-class-construction-order-trace',
  privateMemberInitializationTraceHash: 'typescript-private-member-initialization-trace',
  privateMemberAccessTraceHash: 'typescript-private-member-access-trace',
  privateBrandCheckTraceHash: 'typescript-private-brand-check-trace',
  privateMethodCallTraceHash: 'typescript-private-method-call-trace',
  privateAccessorGetSetTraceHash: 'typescript-private-accessor-get-set-trace',
  staticPrivateMemberAccessTraceHash: 'typescript-static-private-member-access-trace',
  subclassPrivateBrandBoundaryTraceHash: 'typescript-subclass-private-brand-boundary-trace',
  accessorInitializationTraceHash: 'typescript-accessor-field-initialization-trace',
  accessorGetSetTraceHash: 'typescript-accessor-field-get-set-trace',
  accessorDescriptorTraceHash: 'typescript-accessor-field-descriptor-trace'
});

function classPrivateAccessorRuntimeProjection(value, counts, source = {}) {
  const shapeProof = objectRecord(value.classMemberShapeProof);
  if (!shapeProof || !classPrivateAccessorRuntimeRequired(counts)) return { record: {} };
  const binding = classPrivateAccessorRuntimeProofBinding(value, counts, source);
  return {
    binding,
    record: compactRecord({
      classMemberShapeProof: boundClassMemberShapeProof(shapeProof, binding),
      classPrivateAccessorRuntimeHash: binding.classPrivateAccessorRuntimeHash,
      classPrivateAccessorRuntimeProof: binding.proof,
      classPrivateAccessorRuntimeProofReasonCodes: binding.passed ? undefined : nonEmptyArray(binding.reasonCodes)
    })
  };
}

function classPrivateAccessorRuntimeProofBinding(value, counts, source = {}) {
  if (!classPrivateAccessorRuntimeRequired(counts)) return { passed: false, evidenceIds: [], reasonCodes: [] };
  const proof = classPrivateAccessorRuntimeProofCandidate(value);
  if (!proof) return {
    passed: false,
    evidenceIds: [],
    reasonCodes: ['typescript-class-private-accessor-runtime-proof-missing']
  };
  const expectedHash = classPrivateAccessorRuntimeHash(value, counts, source, proof);
  const requiredSignals = classPrivateAccessorRuntimeRequiredSignals(value, counts);
  const reasonCodes = [];
  reasonCodes.push(...missingClassPrivateAccessorRuntimeTraceHashReasonCodes(proof, value, counts));
  if (!PassedStatuses.has(String(proof.status ?? ''))) reasonCodes.push('typescript-class-private-accessor-runtime-proof-status-not-passed');
  if (proof.schema !== ClassPrivateAccessorRuntimeProofSchema) reasonCodes.push('typescript-class-private-accessor-runtime-proof-schema-missing');
  if (proof.kind !== ClassPrivateAccessorRuntimeProofKind) reasonCodes.push('typescript-class-private-accessor-runtime-proof-kind-missing');
  if (!containsAllStrings(proof.requiredSignals, requiredSignals)) reasonCodes.push('typescript-class-private-accessor-runtime-proof-required-signals-missing');
  if (proof.sourcePath !== source.sourcePath) reasonCodes.push('typescript-class-private-accessor-runtime-proof-source-path-mismatch');
  if (proof.sourceHash !== source.sourceHash) reasonCodes.push('typescript-class-private-accessor-runtime-proof-source-hash-mismatch');
  if (counts.privateClassMemberCount > 0 && proof.privateClassMemberShapeHash !== value.privateClassMemberShapeHash) {
    reasonCodes.push('typescript-class-private-accessor-runtime-proof-private-shape-hash-mismatch');
  }
  if (counts.accessorFieldCount > 0 && proof.accessorFieldShapeHash !== value.accessorFieldShapeHash) {
    reasonCodes.push('typescript-class-private-accessor-runtime-proof-accessor-shape-hash-mismatch');
  }
  if (Number(proof.privateClassMemberCount ?? 0) !== Number(counts.privateClassMemberCount ?? 0)) {
    reasonCodes.push('typescript-class-private-accessor-runtime-proof-private-count-mismatch');
  }
  if (Number(proof.accessorFieldCount ?? 0) !== Number(counts.accessorFieldCount ?? 0)) {
    reasonCodes.push('typescript-class-private-accessor-runtime-proof-accessor-count-mismatch');
  }
  if (!proof.classPrivateAccessorRuntimeHash) {
    reasonCodes.push('typescript-class-private-accessor-runtime-proof-runtime-hash-missing');
  } else if (expectedHash && proof.classPrivateAccessorRuntimeHash !== expectedHash) {
    reasonCodes.push('typescript-class-private-accessor-runtime-proof-runtime-hash-mismatch');
  }
  if (!stringValue(proof.command)) reasonCodes.push('typescript-class-private-accessor-runtime-proof-command-missing');
  if (!stringValue(proof.traceHash)) reasonCodes.push('typescript-class-private-accessor-runtime-proof-trace-hash-missing');
  if (!stringValue(proof.evidenceHash)) reasonCodes.push('typescript-class-private-accessor-runtime-proof-evidence-hash-missing');
  if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
    || proof.privateMemberRuntimeEquivalenceClaim !== false || proof.accessorRuntimeEquivalenceClaim !== false) {
    reasonCodes.push('typescript-class-private-accessor-runtime-proof-claim-flags-missing');
  }
  return {
    passed: reasonCodes.length === 0,
    evidenceIds: uniqueStrings([proof.id, proof.evidenceId, ...arrayValue(proof.evidenceIds)]),
    reasonCodes: uniqueStrings(reasonCodes),
    classPrivateAccessorRuntimeHash: expectedHash,
    proof: compactRecord({
      id: proof.id,
      evidenceId: proof.evidenceId,
      schema: proof.schema,
      kind: proof.kind,
      status: proof.status,
      sourcePath: proof.sourcePath,
      sourceHash: proof.sourceHash,
      privateClassMemberShapeHash: proof.privateClassMemberShapeHash,
      accessorFieldShapeHash: proof.accessorFieldShapeHash,
      privateClassMemberCount: proof.privateClassMemberCount,
      accessorFieldCount: proof.accessorFieldCount,
      requiredSignals,
      classPrivateAccessorRuntimeHash: proof.classPrivateAccessorRuntimeHash,
      ...classPrivateAccessorRuntimeTraceHashes(proof, value, counts),
      command: proof.command,
      traceHash: proof.traceHash,
      evidenceHash: proof.evidenceHash,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      privateMemberRuntimeEquivalenceClaim: false,
      accessorRuntimeEquivalenceClaim: false
    })
  };
}

function classPrivateAccessorRuntimeHash(value, counts, source = {}, proof = {}) {
  const traceHashes = classPrivateAccessorRuntimeTraceHashes(proof, value, counts);
  if (requiredClassPrivateAccessorRuntimeTraceHashKeys(value, counts).some((key) => !traceHashes[key])) return undefined;
  return hashSemanticValue({
    kind: 'frontier.lang.typescript.classPrivateAccessorRuntimeProof.values',
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    privateClassMemberShapeHash: counts.privateClassMemberCount > 0 ? value.privateClassMemberShapeHash : undefined,
    accessorFieldShapeHash: counts.accessorFieldCount > 0 ? value.accessorFieldShapeHash : undefined,
    privateClassMemberCount: counts.privateClassMemberCount || undefined,
    accessorFieldCount: counts.accessorFieldCount || undefined,
    requiredSignals: classPrivateAccessorRuntimeRequiredSignals(value, counts),
    traceHashes
  });
}

function boundClassMemberShapeProof(shapeProof, binding) {
  if (!binding.passed) return compactRecord({
    ...shapeProof,
    proofScope: shapeProof.proofScope ?? 'static-private-accessor-shape-only',
    classPrivateAccessorRuntimeHash: binding.classPrivateAccessorRuntimeHash,
    classPrivateAccessorRuntimeProof: binding.proof,
    classPrivateAccessorRuntimeProofReasonCodes: nonEmptyArray(binding.reasonCodes),
    runtimeEquivalenceGap: boundClassPrivateAccessorRuntimeGap(shapeProof.runtimeEquivalenceGap, binding)
  });
  const { runtimeEquivalenceGap: _gap, conflictRouting: _routing, ...baseProof } = shapeProof;
  return compactRecord({
    ...baseProof,
    proofScope: 'static-private-accessor-shape-and-source-bound-runtime',
    classPrivateAccessorRuntimeHash: binding.classPrivateAccessorRuntimeHash,
    classPrivateAccessorRuntimeProof: binding.proof,
    conflictRouting: classPrivateAccessorRuntimeProofRouting(binding, baseProof),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  });
}

function boundClassPrivateAccessorRuntimeGap(gap, binding) {
  return compactRecord({
    ...(gap ?? {
      code: 'class-private-accessor-runtime-equivalence-not-claimed',
      status: 'not-claimed',
      summary: 'Private member initialization/access and accessor getter/setter runtime behavior remain unproved.',
      routeId: ClassPrivateAccessorRuntimeRouteId,
      routeLane: ClassPrivateAccessorRuntimeRouteLane,
      routeNext: ClassPrivateAccessorRuntimeRouteNext,
      failClosed: true,
      blocksSemanticEquivalence: true
    }),
    classPrivateAccessorRuntimeHash: binding.classPrivateAccessorRuntimeHash,
    proofReasonCodes: nonEmptyArray(binding.reasonCodes),
    proofEvidenceIds: nonEmptyArray(binding.evidenceIds)
  });
}

function classPrivateAccessorRuntimeProofRouting(binding, shapeProof = {}) {
  return {
    status: 'proof-bound',
    conflictCode: 'project-public-compiler-type-delta-conflict',
    reasonCode: ClassPrivateAccessorRuntimeBoundCode,
    branchDivergenceSignal: 'classPrivateAccessorRuntimeHash',
    routeId: ClassPrivateAccessorRuntimeRouteId,
    routeLane: ClassPrivateAccessorRuntimeRouteLane,
    routeNext: ClassPrivateAccessorRuntimeRouteNext,
    privateClassMemberShapeHash: shapeProof.privateClassMemberShapeHash,
    accessorFieldShapeHash: shapeProof.accessorFieldShapeHash,
    classPrivateAccessorRuntimeHash: binding.classPrivateAccessorRuntimeHash,
    proofEvidenceIds: nonEmptyArray(binding.evidenceIds),
    failClosed: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  };
}

function classPrivateAccessorRuntimeProofCandidate(value) {
  return objectRecord(value.classPrivateAccessorRuntimeProof)
    ?? objectRecord(value.classPrivateAccessorRuntimeEvidence)
    ?? objectRecord(value.classMemberShapeProof?.classPrivateAccessorRuntimeProof)
    ?? objectRecord(value.classMemberShapeProof?.runtimeProof);
}

function missingClassPrivateAccessorRuntimeTraceHashReasonCodes(proof, value, counts) {
  const hashes = classPrivateAccessorRuntimeTraceHashes(proof, value, counts);
  return requiredClassPrivateAccessorRuntimeTraceHashKeys(value, counts)
    .filter((key) => !hashes[key])
    .map((key) => `typescript-class-private-accessor-runtime-proof-${key.replace(/Hash$/, '').replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}-hash-missing`);
}

function requiredClassPrivateAccessorRuntimeTraceHashKeys(value, counts) {
  const privateMembers = privateClassMembers(value);
  const hasPrivateMembers = counts.privateClassMemberCount > 0;
  const hasPrivateIdentifier = privateMembers.some((member) => member.privateIdentifier === true || stringValue(member.name)?.startsWith('#'));
  const hasPrivateMethod = privateMembers.some((member) => member.kind === 'private-method');
  const hasPrivateAccessor = privateMembers.some((member) => member.kind === 'private-get-accessor' || member.kind === 'private-set-accessor' || member.kind === 'private-accessor-field');
  const hasStaticPrivate = privateMembers.some((member) => member.static === true);
  const hasClassHeritage = (numberValue(value.classHeritageCount) ?? arrayValue(value.classHeritage).length) > 0;
  return [
    'classConstructionOrderTraceHash',
    hasPrivateMembers ? 'privateMemberInitializationTraceHash' : undefined,
    hasPrivateMembers ? 'privateMemberAccessTraceHash' : undefined,
    hasPrivateIdentifier ? 'privateBrandCheckTraceHash' : undefined,
    hasPrivateMethod ? 'privateMethodCallTraceHash' : undefined,
    hasPrivateAccessor ? 'privateAccessorGetSetTraceHash' : undefined,
    hasStaticPrivate ? 'staticPrivateMemberAccessTraceHash' : undefined,
    hasPrivateIdentifier && hasClassHeritage ? 'subclassPrivateBrandBoundaryTraceHash' : undefined,
    counts.accessorFieldCount > 0 ? 'accessorInitializationTraceHash' : undefined,
    counts.accessorFieldCount > 0 ? 'accessorGetSetTraceHash' : undefined,
    counts.accessorFieldCount > 0 ? 'accessorDescriptorTraceHash' : undefined
  ].filter(Boolean);
}

function classPrivateAccessorRuntimeTraceHashes(proof, value, counts) {
  const required = new Set(requiredClassPrivateAccessorRuntimeTraceHashKeys(value, counts));
  return compactRecord({
    classConstructionOrderTraceHash: proof.classConstructionOrderTraceHash,
    privateMemberInitializationTraceHash: required.has('privateMemberInitializationTraceHash') ? proof.privateMemberInitializationTraceHash : undefined,
    privateMemberAccessTraceHash: required.has('privateMemberAccessTraceHash') ? proof.privateMemberAccessTraceHash : undefined,
    privateBrandCheckTraceHash: required.has('privateBrandCheckTraceHash') ? proof.privateBrandCheckTraceHash : undefined,
    privateMethodCallTraceHash: required.has('privateMethodCallTraceHash') ? proof.privateMethodCallTraceHash : undefined,
    privateAccessorGetSetTraceHash: required.has('privateAccessorGetSetTraceHash') ? proof.privateAccessorGetSetTraceHash : undefined,
    staticPrivateMemberAccessTraceHash: required.has('staticPrivateMemberAccessTraceHash') ? proof.staticPrivateMemberAccessTraceHash : undefined,
    subclassPrivateBrandBoundaryTraceHash: required.has('subclassPrivateBrandBoundaryTraceHash') ? proof.subclassPrivateBrandBoundaryTraceHash : undefined,
    accessorInitializationTraceHash: required.has('accessorInitializationTraceHash') ? proof.accessorInitializationTraceHash : undefined,
    accessorGetSetTraceHash: required.has('accessorGetSetTraceHash') ? proof.accessorGetSetTraceHash : undefined,
    accessorDescriptorTraceHash: required.has('accessorDescriptorTraceHash') ? proof.accessorDescriptorTraceHash : undefined
  });
}

function classPrivateAccessorRuntimeRequiredSignals(value, counts) {
  return uniqueStrings([
    'compiler-public-api-source-path',
    'compiler-public-api-source-hash',
    counts.privateClassMemberCount > 0 ? 'compiler-private-class-member-count' : undefined,
    counts.privateClassMemberCount > 0 ? 'compiler-private-class-member-shape-hash' : undefined,
    counts.accessorFieldCount > 0 ? 'compiler-accessor-field-count' : undefined,
    counts.accessorFieldCount > 0 ? 'compiler-accessor-field-shape-hash' : undefined,
    ...requiredClassPrivateAccessorRuntimeTraceHashKeys(value, counts).map((key) => TraceHashSignalsByKey[key]),
    'runtime-command',
    'runtime-trace-hash',
    'runtime-evidence-hash'
  ]);
}

function classPrivateAccessorRuntimeRequired(counts) {
  return counts.privateClassMemberCount > 0 || counts.accessorFieldCount > 0;
}

function privateClassMembers(value) { return arrayValue(value.privateClassMembers); }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function objectRecord(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function stringValue(value) { return value === undefined || value === null || value === '' ? undefined : String(value); }
function containsAllStrings(actual, expected) {
  const actualSet = new Set(arrayValue(actual).filter((value) => typeof value === 'string' && value.length > 0));
  return expected.every((value) => actualSet.has(value));
}

export {
  classPrivateAccessorRuntimeHash,
  classPrivateAccessorRuntimeProjection,
  classPrivateAccessorRuntimeProofBinding,
  classPrivateAccessorRuntimeRequiredSignals
};
