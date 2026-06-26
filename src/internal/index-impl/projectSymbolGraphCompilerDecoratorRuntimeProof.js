import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const DecoratorRuntimeExecutionProofSchema = 'frontier.lang.typescript.decoratorRuntimeExecutionProof.v1';
const DecoratorRuntimeExecutionProofKind = 'frontier.lang.typescript.decoratorRuntimeExecutionProof';
const DecoratorRuntimeExecutionBoundCode = 'decorator-runtime-execution-proof-bound';
const DecoratorRuntimeExecutionRouteId = 'prove-decorator-runtime-execution-equivalence';
const DecoratorRuntimeExecutionRouteLane = 'decorator-runtime-boundaries';
const DecoratorRuntimeExecutionRouteNext = 'supply-decorator-runtime-execution-proof';
const PassedStatuses = new Set(['passed', 'verified']);

function decoratorRuntimeExecutionProjection(value, counts, source = {}) {
  const metadataProof = objectRecord(value.decoratorMetadataProof);
  if (!metadataProof || counts.decoratorMetadataCount <= 0) return { record: {} };
  const binding = decoratorRuntimeExecutionProofBinding(value, counts, source);
  return {
    binding,
    record: compactRecord({
      decoratorMetadataProof: boundDecoratorMetadataProof(metadataProof, binding),
      decoratorRuntimeExecutionHash: binding.decoratorRuntimeExecutionHash,
      decoratorRuntimeExecutionProof: binding.proof,
      decoratorRuntimeExecutionProofReasonCodes: binding.passed ? undefined : nonEmptyArray(binding.reasonCodes)
    })
  };
}

function decoratorRuntimeExecutionProofBinding(value, counts, source = {}) {
  if (counts.decoratorMetadataCount <= 0) return { passed: false, evidenceIds: [], reasonCodes: [] };
  const proof = decoratorRuntimeExecutionProofCandidate(value);
  if (!proof) return {
    passed: false,
    evidenceIds: [],
    reasonCodes: ['typescript-decorator-runtime-execution-proof-missing']
  };
  const expectedHash = decoratorRuntimeExecutionHash(value, counts, source, proof);
  const reasonCodes = [];
  reasonCodes.push(...missingDecoratorRuntimeTraceHashReasonCodes(proof));
  if (!PassedStatuses.has(String(proof.status ?? ''))) reasonCodes.push('typescript-decorator-runtime-execution-proof-status-not-passed');
  if (proof.schema !== DecoratorRuntimeExecutionProofSchema && proof.kind !== DecoratorRuntimeExecutionProofKind) {
    reasonCodes.push('typescript-decorator-runtime-execution-proof-schema-missing');
  }
  if (proof.sourcePath !== source.sourcePath) reasonCodes.push('typescript-decorator-runtime-execution-proof-source-path-mismatch');
  if (proof.sourceHash !== source.sourceHash) reasonCodes.push('typescript-decorator-runtime-execution-proof-source-hash-mismatch');
  if (proof.decoratorMetadataHash !== value.decoratorMetadataHash) reasonCodes.push('typescript-decorator-runtime-execution-proof-metadata-hash-mismatch');
  if (Number(proof.decoratorMetadataCount) !== Number(counts.decoratorMetadataCount)) {
    reasonCodes.push('typescript-decorator-runtime-execution-proof-count-mismatch');
  }
  if (!proof.decoratorRuntimeExecutionHash) {
    reasonCodes.push('typescript-decorator-runtime-execution-proof-execution-hash-missing');
  } else if (expectedHash && proof.decoratorRuntimeExecutionHash !== expectedHash) {
    reasonCodes.push('typescript-decorator-runtime-execution-proof-execution-hash-mismatch');
  }
  if (proof.autoMergeClaim !== false || proof.semanticEquivalenceClaim !== false || proof.runtimeEquivalenceClaim !== false
    || proof.decoratorExecutionEquivalenceClaim !== false || proof.decoratorEmitRuntimeEquivalenceClaim !== false) {
    reasonCodes.push('typescript-decorator-runtime-execution-proof-claim-flags-missing');
  }
  return {
    passed: reasonCodes.length === 0,
    evidenceIds: uniqueStrings([proof.id, proof.evidenceId, ...arrayValue(proof.evidenceIds)]),
    reasonCodes: uniqueStrings(reasonCodes),
    decoratorRuntimeExecutionHash: expectedHash,
    proof: compactRecord({
      id: proof.id,
      evidenceId: proof.evidenceId,
      schema: proof.schema,
      kind: proof.kind,
      status: proof.status,
      sourcePath: proof.sourcePath,
      sourceHash: proof.sourceHash,
      decoratorMetadataHash: proof.decoratorMetadataHash,
      decoratorMetadataCount: proof.decoratorMetadataCount,
      decoratorRuntimeExecutionHash: proof.decoratorRuntimeExecutionHash,
      ...decoratorRuntimeTraceHashes(proof),
      command: proof.command,
      traceHash: proof.traceHash,
      evidenceHash: proof.evidenceHash,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      decoratorExecutionEquivalenceClaim: false,
      decoratorEmitRuntimeEquivalenceClaim: false
    })
  };
}

function decoratorRuntimeExecutionHash(value, counts, source = {}, proof = {}) {
  const traceHashes = decoratorRuntimeTraceHashes(proof);
  if (requiredDecoratorRuntimeTraceHashKeys().some((key) => !traceHashes[key])) return undefined;
  return hashSemanticValue({
    kind: 'frontier.lang.typescript.decoratorRuntimeExecutionProof.values',
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    decoratorMetadataHash: value.decoratorMetadataHash,
    decoratorMetadataCount: counts.decoratorMetadataCount,
    classDecoratorCount: counts.classDecoratorCount || undefined,
    memberDecoratorCount: counts.memberDecoratorCount || undefined,
    parameterDecoratorCount: counts.parameterDecoratorCount || undefined,
    traceHashes
  });
}

function boundDecoratorMetadataProof(metadataProof, binding) {
  if (!binding.passed) return compactRecord({
    ...metadataProof,
    decoratorRuntimeExecutionHash: binding.decoratorRuntimeExecutionHash,
    decoratorRuntimeExecutionProof: binding.proof,
    decoratorRuntimeExecutionProofReasonCodes: nonEmptyArray(binding.reasonCodes),
    runtimeExecutionEquivalenceGap: boundDecoratorRuntimeExecutionGap(metadataProof.runtimeExecutionEquivalenceGap, binding)
  });
  const { runtimeExecutionEquivalenceGap: _gap, conflictRouting: _routing, ...baseProof } = metadataProof;
  return compactRecord({
    ...baseProof,
    proofScope: 'static-decorator-metadata-and-source-bound-runtime-execution',
    decoratorRuntimeExecutionHash: binding.decoratorRuntimeExecutionHash,
    decoratorRuntimeExecutionProof: binding.proof,
    conflictRouting: decoratorRuntimeProofRouting(binding, baseProof.decoratorMetadataHash),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    decoratorExecutionEquivalenceClaim: false
  });
}

function boundDecoratorRuntimeExecutionGap(gap, binding) {
  if (!gap) return undefined;
  return compactRecord({
    ...gap,
    decoratorRuntimeExecutionHash: binding.decoratorRuntimeExecutionHash,
    proofReasonCodes: nonEmptyArray(binding.reasonCodes),
    proofEvidenceIds: nonEmptyArray(binding.evidenceIds)
  });
}

function decoratorRuntimeProofRouting(binding, decoratorMetadataHash) {
  return {
    status: 'proof-bound',
    conflictCode: 'project-public-compiler-type-delta-conflict',
    reasonCode: DecoratorRuntimeExecutionBoundCode,
    branchDivergenceSignal: 'decoratorMetadataHash',
    routeId: DecoratorRuntimeExecutionRouteId,
    routeLane: DecoratorRuntimeExecutionRouteLane,
    routeNext: DecoratorRuntimeExecutionRouteNext,
    decoratorMetadataHash,
    decoratorRuntimeExecutionHash: binding.decoratorRuntimeExecutionHash,
    proofEvidenceIds: nonEmptyArray(binding.evidenceIds),
    failClosed: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    decoratorExecutionEquivalenceClaim: false
  };
}

function decoratorRuntimeExecutionProofCandidate(value) {
  return objectRecord(value.decoratorRuntimeExecutionProof)
    ?? objectRecord(value.decoratorRuntimeExecutionEvidence)
    ?? objectRecord(value.decoratorMetadataProof?.decoratorRuntimeExecutionProof)
    ?? objectRecord(value.decoratorMetadataProof?.runtimeExecutionProof);
}

function missingDecoratorRuntimeTraceHashReasonCodes(proof) {
  const hashes = decoratorRuntimeTraceHashes(proof);
  return requiredDecoratorRuntimeTraceHashKeys()
    .filter((key) => !hashes[key])
    .map((key) => `typescript-decorator-runtime-execution-proof-${key.replace(/Hash$/, '').replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}-hash-missing`);
}

function requiredDecoratorRuntimeTraceHashKeys() {
  return [
    'decoratorFactoryCallOrderHash',
    'decoratorInvocationOrderHash',
    'decoratorSideEffectTraceHash',
    'decoratorResultApplicationHash',
    'decoratorEmitRuntimeEquivalenceHash'
  ];
}

function decoratorRuntimeTraceHashes(proof) {
  return compactRecord({
    decoratorFactoryCallOrderHash: proof.decoratorFactoryCallOrderHash,
    decoratorInvocationOrderHash: proof.decoratorInvocationOrderHash,
    decoratorSideEffectTraceHash: proof.decoratorSideEffectTraceHash,
    decoratorResultApplicationHash: proof.decoratorResultApplicationHash,
    decoratorEmitRuntimeEquivalenceHash: proof.decoratorEmitRuntimeEquivalenceHash
  });
}

function arrayValue(value) { return Array.isArray(value) ? value : []; }
function objectRecord(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  decoratorRuntimeExecutionHash,
  decoratorRuntimeExecutionProjection,
  decoratorRuntimeExecutionProofBinding
};
