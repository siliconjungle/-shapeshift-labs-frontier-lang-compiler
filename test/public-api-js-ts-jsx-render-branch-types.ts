import * as compilerApi from '../src/index.js';

const typedJsxRenderReturnBranchProof: compilerApi.JsTsProjectJsxRenderReturnBranchProof = {
  schema: 'frontier.lang.jsxRenderReturnBranchProof.v1',
  kind: 'frontier.lang.jsxRenderReturnBranchProof',
  status: 'passed',
  sourcePath: 'src/view.tsx',
  identityKey: 'jsx-render-risk#src/view.tsx#View#Button#1#Button',
  baseSourceHash: 'base-source',
  workerSourceHash: 'worker-source',
  headSourceHash: 'head-source',
  outputSourceHash: 'output-source',
  publicOwnerName: 'View',
  tagName: 'Button',
  tagKey: 'Button#1',
  returnOrdinal: 1,
  returnKind: 'implicit-arrow-expression',
  branchControlKind: 'conditional-expression',
  conditionHash: 'condition:ready',
  outputConditionHash: 'condition:ready',
  consequentHash: 'consequent:worker',
  outputConsequentHash: 'consequent:worker',
  consequentOrigin: 'worker',
  alternateHash: 'alternate:head',
  outputAlternateHash: 'alternate:head',
  alternateOrigin: 'head',
  branchArmPreservationHash: 'branch-preservation',
  autoMergeClaim: false,
  semanticEquivalenceClaim: false,
  runtimeEquivalenceClaim: false,
  renderEquivalenceClaim: false,
  branchArmPreservationClaim: true,
  claimScope: 'static-render-return-branch-arm-preservation-only'
};

typedJsxRenderReturnBranchProof.branchControlKind satisfies compilerApi.JsTsProjectJsxRenderReturnBranchControlKind;
typedJsxRenderReturnBranchProof.consequentOrigin satisfies compilerApi.JsTsProjectJsxRenderReturnBranchArmOrigin | undefined;
typedJsxRenderReturnBranchProof.autoMergeClaim satisfies false;
typedJsxRenderReturnBranchProof.semanticEquivalenceClaim satisfies false;
typedJsxRenderReturnBranchProof.runtimeEquivalenceClaim satisfies false;
typedJsxRenderReturnBranchProof.renderEquivalenceClaim satisfies false;
typedJsxRenderReturnBranchProof.branchArmPreservationClaim satisfies true;

compilerApi.safeMergeJsTsProject({
  jsxRenderReturnBranchProof: typedJsxRenderReturnBranchProof,
  jsxRenderReturnBranchProofs: [typedJsxRenderReturnBranchProof]
});
