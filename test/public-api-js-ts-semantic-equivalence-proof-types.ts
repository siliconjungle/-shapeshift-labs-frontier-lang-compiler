import * as compilerApi from '../src/index.js';

const typedSemanticEquivalenceProof: compilerApi.JsTsProjectSemanticEquivalenceProof = {
  schema: 'frontier.lang.jsTsProjectSemanticEquivalenceProof.v1',
  kind: 'frontier.lang.jsTsProjectSemanticEquivalenceProof',
  status: 'passed',
  evidenceId: 'proof-evidence',
  verifier: { name: 'external-verifier', version: '1' },
  command: 'node verify.mjs',
  artifactHash: 'artifact-hash',
  projectId: 'project',
  language: 'typescript',
  sourceFileBindings: [{
    sourcePath: 'src/view.ts',
    operation: 'merged-source',
    baseHash: 'base',
    workerHash: 'worker',
    headHash: 'head',
    outputHash: 'output'
  }],
  sourceSetHash: 'source-set',
  outputSetHash: 'output-set',
  gates: {
    diagnostics: { id: 'diagnostics', status: 'passed', hash: 'diagnostics-hash' },
    declarations: { id: 'declarations', status: 'passed', hash: 'declarations-hash' },
    quality: { id: 'quality', status: 'passed', hash: 'quality-hash', gateIds: ['focused'] }
  },
  proofHash: 'proof-hash',
  claimKind: 'external-semantic-equivalence',
  claimBoundary: 'exact-js-ts-project-source-output-and-gates',
  semanticEquivalenceClaim: true,
  autoMergeClaim: false
};

typedSemanticEquivalenceProof.claimBoundary satisfies compilerApi.JsTsProjectSemanticEquivalenceProofClaimBoundary;
typedSemanticEquivalenceProof.sourceFileBindings[0] satisfies compilerApi.JsTsProjectSemanticEquivalenceProofFileBinding;
typedSemanticEquivalenceProof.gates.quality satisfies compilerApi.JsTsProjectSemanticEquivalenceProofGateBinding;
typedSemanticEquivalenceProof.semanticEquivalenceClaim satisfies true;
typedSemanticEquivalenceProof.autoMergeClaim satisfies false;

compilerApi.safeMergeJsTsProject({
  externalSemanticEquivalenceProof: typedSemanticEquivalenceProof,
  semanticEquivalenceProof: typedSemanticEquivalenceProof
});
