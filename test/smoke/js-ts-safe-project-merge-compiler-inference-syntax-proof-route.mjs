import { assert } from './helpers.mjs';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';

const inferenceProofBaseGraph = graphWithCompilerType(inferenceSyntaxCompilerType('base_inference_syntax_hash'));
const inferenceProofGraph = graphWithCompilerType(inferenceSyntaxCompilerType('shared_inference_syntax_hash'));
assert.equal(publicCompilerTypeDeltaConflicts(inferenceProofBaseGraph, inferenceProofGraph, inferenceProofGraph, undefined).length, 0);

const inferenceMissingProofGraph = graphWithCompilerType(inferenceSyntaxCompilerType('shared_inference_syntax_hash', {
  typeInferenceSyntaxProof: undefined
}));
const inferenceMissingProofConflict = publicCompilerTypeDeltaConflicts(
  inferenceProofBaseGraph,
  inferenceMissingProofGraph,
  inferenceMissingProofGraph,
  inferenceMissingProofGraph
)[0];
assert.equal(inferenceMissingProofConflict?.details?.reasonCode, 'typescript-public-api-type-inference-syntax-proof-missing');
assert.equal(inferenceMissingProofConflict?.details?.typeInferenceSyntaxEvidence?.missingRecords?.[0]?.reasonCodes?.includes('typescript-public-api-type-inference-syntax-proof-missing'), true);
assert.equal(inferenceMissingProofConflict?.details?.typeInferenceSyntaxEvidence?.semanticEquivalenceClaim, false);

const inferenceStaleSourceProofGraph = graphWithCompilerType(inferenceSyntaxCompilerType('shared_inference_syntax_hash', {
  typeInferenceSyntaxProof: inferenceSyntaxProof('shared_inference_syntax_hash', { sourceHash: 'stale-source-hash' })
}));
const staleSourceRecord = firstInferenceMissingRecord(inferenceStaleSourceProofGraph);
assert.equal(staleSourceRecord?.reasonCodes?.includes('typescript-type-inference-syntax-proof-source-hash-mismatch'), true);
assert.equal(staleSourceRecord?.typeInferenceSyntaxProofSourceHash, 'stale-source-hash');

const inferenceStaleSyntaxProofGraph = graphWithCompilerType(inferenceSyntaxCompilerType('shared_inference_syntax_hash', {
  typeInferenceSyntaxProof: inferenceSyntaxProof('shared_inference_syntax_hash', {
    typeInferenceSyntaxHash: 'stale_inference_syntax_hash'
  })
}));
const staleSyntaxRecord = firstInferenceMissingRecord(inferenceStaleSyntaxProofGraph);
assert.equal(staleSyntaxRecord?.reasonCodes?.includes('typescript-type-inference-syntax-proof-hash-mismatch'), true);
assert.equal(staleSyntaxRecord?.proofTypeInferenceSyntaxHash, 'stale_inference_syntax_hash');

const inferenceMissingSourceHashGraph = graphWithCompilerType(inferenceSyntaxCompilerType('shared_inference_syntax_hash', {
  sourceHash: undefined
}));
const missingSourceHashRecord = firstInferenceMissingRecord(inferenceMissingSourceHashGraph);
assert.equal(missingSourceHashRecord?.reasonCodes?.includes('typescript-type-inference-syntax-record-source-hash-missing'), true);

const inferenceClaimBearingProofGraph = graphWithCompilerType(inferenceSyntaxCompilerType('shared_inference_syntax_hash', {
  typeInferenceSyntaxProof: inferenceSyntaxProof('shared_inference_syntax_hash', { semanticEquivalenceClaim: true })
}));
const claimBearingRecord = firstInferenceMissingRecord(inferenceClaimBearingProofGraph);
assert.equal(claimBearingRecord?.reasonCodes?.includes('typescript-type-inference-syntax-proof-claim-flags-missing'), true);
assert.equal(claimBearingRecord?.semanticEquivalenceClaim, true);

function graphWithCompilerType(record) {
  return { compilerTypeRecords: [record] };
}

function firstInferenceMissingRecord(graph) {
  return publicCompilerTypeDeltaConflicts(inferenceProofBaseGraph, graph, graph, graph)[0]
    ?.details?.typeInferenceSyntaxEvidence?.missingRecords?.[0];
}

function inferenceSyntaxCompilerType(typeInferenceSyntaxHash, overrides = {}) {
  const sourcePath = overrides.sourcePath ?? 'src/inference.ts';
  const sourceHash = Object.hasOwn(overrides, 'sourceHash')
    ? overrides.sourceHash
    : `${typeInferenceSyntaxHash}_source`;
  return {
    publicContract: true,
    sourcePath,
    sourceHash,
    symbolId: 'compiler-symbol:inference',
    symbolName: 'palette',
    symbolKind: 'variable',
    fullyQualifiedName: '"src/inference".palette',
    compilerSymbolIdentityHash: 'compiler-symbol-identity:palette',
    identityHash: 'compiler-type-identity:palette',
    apiSignatureHash: 'compiler-api-signature:palette',
    typeText: '{ readonly tone: "blue"; readonly fixed: true; }',
    typeInferenceSyntaxCount: 1,
    typeInferenceSyntaxKinds: ['satisfies-expression'],
    satisfiesExpressionCount: 1,
    typeInferenceSyntaxHash,
    typeInferenceSyntax: [{
      kind: 'satisfies-expression',
      nodeText: 'palette satisfies { tone: string }',
      expressionText: 'palette',
      typeText: '{ tone: string }'
    }],
    typeInferenceSyntaxProof: inferenceSyntaxProof(typeInferenceSyntaxHash, { sourcePath, sourceHash }),
    ...overrides
  };
}

function inferenceSyntaxProof(typeInferenceSyntaxHash, overrides = {}) {
  return {
    kind: 'typescript-checker-public-api-type-inference-syntax-evidence',
    status: 'passed',
    sourcePath: 'src/inference.ts',
    sourceHash: `${typeInferenceSyntaxHash}_source`,
    typeInferenceSyntaxHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    ...overrides
  };
}
