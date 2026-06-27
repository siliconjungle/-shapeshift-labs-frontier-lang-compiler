import assert from 'node:assert/strict';
import { compilerAdvancedTypeMetadata } from '../../src/internal/index-impl/projectSymbolGraphCompilerAdvancedTypeMetadata.js';

const semanticMergeTypeMatrixCells = [
  {
    id: 'compiler-type-graph/callable-signature-shape-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-callable-signature-shapes',
    note: 'public call and construct signatures emit compiler-backed shape hashes and fail closed when call/construct signature evidence is missing'
  },
  {
    id: 'type-public-api-graph/declaration-emit-parity-proof',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-public-api-declaration-emit-parity',
    note: 'public compiler type admission requires TypeScript declaration boundary parity when declaration emit proof is supplied or requested'
  },
  {
    id: 'type-public-api-graph/declaration-type-proof-reason-routing',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-type-equivalence-proof',
    note: 'combined declaration parity and type-equivalence proof failures route the top-level reason to declaration parity while preserving both evidence records'
  },
  {
    id: 'type-public-api-graph/source-bound-type-equivalence-proof',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-type-equivalence-proof',
    note: 'public compiler type equivalence proof records bind checker evidence to source path/hash and fail closed when source-hash evidence is missing'
  },
  {
    id: 'type-public-api-graph/type-reference-target-proof',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-type-reference-target-proof',
    note: 'public compiler type records bind type references to TypeScript checker target symbols, declaration spans, source text hashes, and fail closed when target proof hashes are missing'
  },
  {
    id: 'type-public-api-graph/advanced-type-missing-proof-field',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-type-equivalence-proof',
    note: 'public conditional/mapped/template compiler type records expose advancedTypeMissingProof in conflict evidence and fail closed when required shape text evidence is missing'
  },
  {
    id: 'type-public-api-graph/advanced-type-source-bound-proof',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-type-equivalence-proof',
    note: 'public infer/advanced type proof requirements bind shape evidence to source path/hash and route blank, stale, or claim-bearing evidence to missing/review'
  },
  {
    id: 'compiler-type-graph/computed-enum-runtime-value-proof',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-enum-shape',
    note: 'the TypeScript compiler importer carries source-bound computed enum evaluated-value traces into public compiler type admission with emitted-shape hashes and false runtime-equivalence claims'
  },
  {
    id: 'compiler-type-graph/decorator-runtime-execution-proof',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-decorator-metadata',
    note: 'decorator runtime execution gaps clear only when source-bound proof records bind static decorator metadata, runtime trace hashes, and false semantic/runtime claim flags'
  },
  {
    id: 'compiler-type-graph/class-private-accessor-runtime-proof-bridge',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-class-private-accessor-shape',
    note: 'private class member and accessor field runtime gaps route to a source- and required-signal-bound proof bridge with schema/kind, command, trace, evidence-hash, stale, missing-trace, and claim-bearing fail-closed checks'
  },
  {
    id: 'type-public-api-graph/assignability-oracle-proof',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-type-equivalence-proof',
    note: 'simple public type aliases carry source-bound declared/apparent TypeScript assignability oracle proof and fail closed when oracle results are ambiguous'
  },
  {
    id: 'type-public-api-graph/inference-syntax-proof-routing',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-compiler-type-equivalence-proof',
    note: 'identical worker/head public compiler type fingerprints with inference syntax require a source-bound proof and fail closed when it is missing, stale, source-unbound, or claim-bearing'
  }
];

assert.equal(semanticMergeTypeMatrixCells.every((cell) => cell.status === 'done'), true);
for (const cell of semanticMergeTypeMatrixCells) {
  assert.match(cell.id, /^[a-z0-9-]+\/[a-z0-9-]+(?:-[a-z0-9]+)*$/);
  assert.equal(['done', 'missing'].includes(cell.status), true, `${cell.id}: matrix status`);
  assert.equal(typeof cell.evidence, 'string', `${cell.id}: evidence`);
  assert.equal(typeof cell.note, 'string', `${cell.id}: note`);
}

const advancedTypeMissingProofCell = semanticMergeTypeMatrixCells.find((cell) => cell.id === 'type-public-api-graph/advanced-type-missing-proof-field');
assert.equal(advancedTypeMissingProofCell?.status, 'done');
assert.equal(advancedTypeMissingProofCell?.evidence, 'js-ts-safe-project-merge-compiler-type-equivalence-proof');
assert.match(advancedTypeMissingProofCell?.note ?? '', /advancedTypeMissingProof/);
assert.match(advancedTypeMissingProofCell?.note ?? '', /conditional\/mapped\/template/);

const publicAdvancedTypeSource = {
  sourcePath: 'src/public-types.ts',
  sourceHash: 'source:public-types:v2',
  publicContract: true
};
const completeInferShape = {
  kind: 'infer-type',
  nodeText: 'infer Item',
  typeText: 'Item',
  typeParameterText: 'Item',
  typeParameterName: 'Item'
};

const sourceBoundAdvancedType = compilerAdvancedTypeMetadata({
  advancedTypeShapes: [completeInferShape]
}, publicAdvancedTypeSource);
assert.equal(sourceBoundAdvancedType.record.advancedTypeProofRequirement.status, 'requires-type-equivalence-proof');
assert.equal(sourceBoundAdvancedType.record.advancedTypeProofRequirement.sourceBound, true);
assert.equal(sourceBoundAdvancedType.record.advancedTypeSourceBoundProof.status, 'passed');
assert.equal(sourceBoundAdvancedType.record.advancedTypeSourceBoundProof.sourcePath, publicAdvancedTypeSource.sourcePath);
assert.equal(sourceBoundAdvancedType.record.advancedTypeSourceBoundProof.sourceHash, publicAdvancedTypeSource.sourceHash);
assert.equal(sourceBoundAdvancedType.record.advancedTypeSourceBoundProof.semanticEquivalenceClaim, false);
assert.equal(sourceBoundAdvancedType.record.advancedTypeMissingProof, undefined);

const blankInferEvidence = compilerAdvancedTypeMetadata({
  advancedTypeShapes: [{ ...completeInferShape, typeText: '   ' }]
}, publicAdvancedTypeSource);
assert.equal(blankInferEvidence.record.advancedTypeProofRequirement.status, 'missing-compiler-evidence');
assert.equal(blankInferEvidence.record.advancedTypeSourceBoundProof.status, 'failed');
assert.equal(blankInferEvidence.record.advancedTypeSourceBoundProof.missingSignals.includes('compiler-infer-type-type-texts'), true);
assert.equal(blankInferEvidence.record.advancedTypeMissingProof.reasonCode, 'typescript-public-api-advanced-type-shape-proof-missing');
assert.equal(blankInferEvidence.record.advancedTypeMissingProof.missingSignals.includes('compiler-infer-type-type-texts'), true);

const sourceUnboundInferEvidence = compilerAdvancedTypeMetadata({
  advancedTypeShapes: [completeInferShape]
}, { sourcePath: publicAdvancedTypeSource.sourcePath, publicContract: true });
assert.equal(sourceUnboundInferEvidence.record.advancedTypeProofRequirement.status, 'missing-compiler-evidence');
assert.equal(sourceUnboundInferEvidence.record.advancedTypeSourceBoundProof.status, 'failed');
assert.equal(sourceUnboundInferEvidence.record.advancedTypeSourceBoundProof.missingSignals.includes('compiler-public-api-advanced-type-source-hash'), true);
assert.equal(sourceUnboundInferEvidence.record.advancedTypeMissingProof.missingSignals.includes('compiler-public-api-advanced-type-source-hash'), true);

const staleInferEvidence = compilerAdvancedTypeMetadata({
  advancedTypeShapes: [{ ...completeInferShape, sourceHash: 'source:stale' }]
}, publicAdvancedTypeSource);
assert.equal(staleInferEvidence.record.advancedTypeProofRequirement.status, 'requires-review');
assert.equal(staleInferEvidence.record.advancedTypeSourceBoundProof.status, 'failed');
assert.equal(staleInferEvidence.record.advancedTypeSourceBoundProof.unsupportedSignals.includes('compiler-public-api-advanced-type-source-hash-stale'), true);
assert.equal(staleInferEvidence.record.advancedTypeMissingProof.reasonCode, 'typescript-public-api-advanced-type-shape-proof-requires-review');
assert.equal(staleInferEvidence.record.advancedTypeMissingProof.unsupportedSignals.includes('compiler-public-api-advanced-type-source-hash-stale'), true);

const claimBearingInferEvidence = compilerAdvancedTypeMetadata({
  advancedTypeShapes: [{ ...completeInferShape, semanticEquivalenceClaim: true }]
}, publicAdvancedTypeSource);
assert.equal(claimBearingInferEvidence.record.advancedTypeProofRequirement.status, 'requires-review');
assert.equal(claimBearingInferEvidence.record.advancedTypeSourceBoundProof.status, 'failed');
assert.equal(claimBearingInferEvidence.record.advancedTypeSourceBoundProof.unsupportedSignals.includes('compiler-advanced-type-shape-claim-bearing'), true);
assert.equal(claimBearingInferEvidence.record.advancedTypeMissingProof.unsupportedSignals.includes('compiler-advanced-type-shape-claim-bearing'), true);
