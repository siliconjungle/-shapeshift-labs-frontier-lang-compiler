import { assert } from './helpers.mjs';
import { assertNestedPathReachabilityOrder } from './semantic-effect-runtime-nested-path-reachability.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsProject
} from '../../src/index.js';
const unreachableMutationSource = [
  'export function returnThenWrite(log, value) {',
  '  return value;',
  '  log.push(value);',
  '}',
  ''
].join('\n');
const unreachableMutationSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-reachability.ts',
  sourceText: unreachableMutationSource
}), { generatedAt: 230 });
const unreachableMutationRegion = unreachableMutationSidecar.ownershipRegions
  .find((region) => region.symbolName === 'returnThenWrite:mutation:mutating-call#1');
assert.ok(unreachableMutationRegion);
assert.equal(unreachableMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].kind, 'same-block-unreachable-after-completion');
assert.equal(unreachableMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].completionKind, 'return');
assert.equal(unreachableMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].completionLine, 2);
assert.equal(unreachableMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].targetLine, 3);
assert.equal(unreachableMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].fullPathReachabilityClaim, false);

const unreachableEffectSource = [
  'export function throwThenLoad(api, error) {',
  '  throw error;',
  '  fetch(api);',
  '}',
  ''
].join('\n');
const unreachableEffectSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-throw-reachability.ts',
  sourceText: unreachableEffectSource
}), { generatedAt: 231 });
const unreachableEffectRegion = unreachableEffectSidecar.ownershipRegions
  .find((region) => region.symbolName === 'throwThenLoad:effect:network#1');
assert.ok(unreachableEffectRegion);
assert.equal(unreachableEffectRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].completionKind, 'throw');
assert.equal(unreachableEffectRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].staticReachabilityEvidence, true);

const conditionalReturnSource = [
  'export function conditionalThenWrite(log, value) {',
  '  if (!value) return value;',
  '  log.push(value);',
  '}',
  ''
].join('\n');
const conditionalReturnSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-conditional-reachability.ts',
  sourceText: conditionalReturnSource
}), { generatedAt: 232 });
const conditionalMutationRegion = conditionalReturnSidecar.ownershipRegions
  .find((region) => region.symbolName === 'conditionalThenWrite:mutation:mutating-call#1');
assert.ok(conditionalMutationRegion);
assert.equal(conditionalMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder, undefined);

const exhaustiveBranchSource = [
  'export function branchThenWrite(log, value) {',
  '  if (value) {',
  '    return value;',
  '  } else {',
  '    return null;',
  '  }',
  '  log.push(value);',
  '}',
  ''
].join('\n');
const exhaustiveBranchSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-branch-reachability.ts',
  sourceText: exhaustiveBranchSource
}), { generatedAt: 234 });
const exhaustiveBranchMutationRegion = exhaustiveBranchSidecar.ownershipRegions
  .find((region) => region.symbolName === 'branchThenWrite:mutation:mutating-call#1');
assert.ok(exhaustiveBranchMutationRegion);
assert.equal(exhaustiveBranchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].kind, 'exhaustive-if-else-unreachable-after-completion');
assert.equal(exhaustiveBranchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].proofLevel, 'lexical-if-else-completion');
assert.deepEqual(exhaustiveBranchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].branchCompletionKinds, ['return', 'return']);
assert.equal(exhaustiveBranchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].ifLine, 2);
assert.equal(exhaustiveBranchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].elseLine, 4);
assert.equal(exhaustiveBranchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].targetLine, 7);
assert.equal(exhaustiveBranchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].fullPathReachabilityClaim, false);

const exhaustiveChainSource = [
  'export function chainThenWrite(log, value) {',
  '  if (value === 1) {',
  '    return value;',
  '  } else if (value === 2) {',
  '    throw new Error(String(value));',
  '  } else {',
  '    return null;',
  '  }',
  '  log.push(value);',
  '}',
  ''
].join('\n');
const exhaustiveChainSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-chain-reachability.ts',
  sourceText: exhaustiveChainSource
}), { generatedAt: 236 });
const exhaustiveChainMutationRegion = exhaustiveChainSidecar.ownershipRegions
  .find((region) => region.symbolName === 'chainThenWrite:mutation:mutating-call#1');
assert.ok(exhaustiveChainMutationRegion);
assert.equal(exhaustiveChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].kind, 'exhaustive-if-chain-unreachable-after-completion');
assert.equal(exhaustiveChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].proofLevel, 'lexical-if-chain-completion');
assert.deepEqual(exhaustiveChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].branchLineNumbers, [2, 4, 6]);
assert.deepEqual(exhaustiveChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].elseIfLines, [4]);
assert.deepEqual(exhaustiveChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].branchCompletionKinds, ['return', 'throw', 'return']);
assert.equal(exhaustiveChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].completionKind, 'mixed');
assert.equal(exhaustiveChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].targetLine, 9);
assert.equal(exhaustiveChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].fullPathReachabilityClaim, false);
assertNestedPathReachabilityOrder();
const exhaustiveSwitchSource = [
  'export function switchThenWrite(log, value) {',
  '  switch (value.kind) {',
  "    case 'one':",
  '      return value;',
  "    case 'two':",
  '      throw new Error(String(value));',
  '    default:',
  '      return null;',
  '  }',
  '  log.push(value);',
  '}',
  ''
].join('\n');
const exhaustiveSwitchSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-switch-reachability.ts',
  sourceText: exhaustiveSwitchSource
}), { generatedAt: 239 });
const exhaustiveSwitchMutationRegion = exhaustiveSwitchSidecar.ownershipRegions
  .find((region) => region.symbolName === 'switchThenWrite:mutation:mutating-call#1');
assert.ok(exhaustiveSwitchMutationRegion);
assert.equal(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].kind, 'exhaustive-switch-unreachable-after-completion');
assert.equal(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].proofLevel, 'lexical-switch-default-completion');
assert.deepEqual(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].labelLineNumbers, [3, 5, 7]);
assert.deepEqual(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].caseLines, [3, 5]);
assert.deepEqual(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].branchCompletionKinds, ['return', 'throw', 'return']);
assert.equal(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].completionKind, 'mixed');
assert.equal(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].switchLine, 2);
assert.equal(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].defaultLine, 7);
assert.equal(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].targetLine, 10);
assert.equal(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].fullPathReachabilityClaim, false);
assert.equal(exhaustiveSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0].runtimeEquivalenceClaim, false);

const tryFinallyCompletionSource = ['export function tryFinallyThenWrite(log, value) {', '  try {', '    if (!value) throw new Error("missing");', '  } catch (error) {', '    void error;', '  } finally {', '    return value;', '  }', '  log.push(value);', '}', ''].join('\n');
const tryFinallyCompletionMutationRegion = createSemanticImportSidecar(importNativeSource({
  language: 'typescript', sourcePath: 'src/runtime-try-finally-reachability.ts', sourceText: tryFinallyCompletionSource
}), { generatedAt: 242 }).ownershipRegions
  .find((region) => region.symbolName === 'tryFinallyThenWrite:mutation:mutating-call#1');
assert.ok(tryFinallyCompletionMutationRegion);
const tryFinallyReachability = tryFinallyCompletionMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0];
assert.equal(tryFinallyReachability.kind, 'try-finally-unreachable-after-finalizer-completion');
assert.equal(tryFinallyReachability.proofLevel, 'lexical-try-finally-finalizer-completion');
assert.equal(tryFinallyReachability.tryLine, 2);
assert.deepEqual(tryFinallyReachability.catchLines, [4]);
assert.equal(tryFinallyReachability.finallyLine, 6);
assert.equal(tryFinallyReachability.completionKind, 'return');
assert.equal(tryFinallyReachability.completionLine, 7);
assert.equal(tryFinallyReachability.targetLine, 9);
assert.equal(tryFinallyReachability.staticReachabilityEvidence, true);
assert.equal(tryFinallyReachability.fullPathReachabilityClaim, false);
assert.equal(tryFinallyReachability.runtimeEquivalenceClaim, false);

const nonCompletingFinallySource = ['export function nonCompletingFinallyThenWrite(log, value) {', '  try {', '    if (!value) return value;', '  } finally {', '    void value;', '  }', '  log.push(value);', '}', ''].join('\n');
const nonCompletingFinallyMutationRegion = createSemanticImportSidecar(importNativeSource({
  language: 'typescript', sourcePath: 'src/runtime-non-completing-finally-reachability.ts', sourceText: nonCompletingFinallySource
}), { generatedAt: 243 }).ownershipRegions
  .find((region) => region.symbolName === 'nonCompletingFinallyThenWrite:mutation:mutating-call#1');
assert.ok(nonCompletingFinallyMutationRegion);
assert.equal(nonCompletingFinallyMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder, undefined);

const finalizerBreakSource = ['export function finalizerBreakThenWrite(log, items) {', '  for (const item of items) {', '    try {', '      if (!item) continue;', '    } finally {', '      break;', '    }', '    log.push(item);', '  }', '}', ''].join('\n');
const finalizerBreakMutationRegion = createSemanticImportSidecar(importNativeSource({
  language: 'typescript', sourcePath: 'src/runtime-finalizer-break-reachability.ts', sourceText: finalizerBreakSource
}), { generatedAt: 244 }).ownershipRegions
  .find((region) => region.symbolName === 'finalizerBreakThenWrite:mutation:mutating-call#1');
assert.ok(finalizerBreakMutationRegion);
assert.equal(finalizerBreakMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder, undefined);

const incompleteChainSource = [
  'export function incompleteChainThenWrite(log, value) {',
  '  if (value === 1) {',
  '    value++;',
  '  } else if (value === 2) {',
  '    return value;',
  '  } else {',
  '    return null;',
  '  }',
  '  log.push(value);',
  '}',
  ''
].join('\n');
const incompleteChainSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-incomplete-chain-reachability.ts',
  sourceText: incompleteChainSource
}), { generatedAt: 237 });
const incompleteChainMutationRegion = incompleteChainSidecar.ownershipRegions
  .find((region) => region.symbolName === 'incompleteChainThenWrite:mutation:mutating-call#1');
assert.ok(incompleteChainMutationRegion);
assert.equal(incompleteChainMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder, undefined);

const incompleteSwitchSource = [
  'export function incompleteSwitchThenWrite(log, value) {',
  '  switch (value.kind) {',
  "    case 'one':",
  '      value.count += 1;',
  "    case 'two':",
  '      return value;',
  '    default:',
  '      return null;',
  '  }',
  '  log.push(value);',
  '}',
  ''
].join('\n');
const incompleteSwitchSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-incomplete-switch-reachability.ts',
  sourceText: incompleteSwitchSource
}), { generatedAt: 240 });
const incompleteSwitchMutationRegion = incompleteSwitchSidecar.ownershipRegions
  .find((region) => region.symbolName === 'incompleteSwitchThenWrite:mutation:mutating-call#1');
assert.ok(incompleteSwitchMutationRegion);
assert.equal(incompleteSwitchMutationRegion.metadata.runtimeOrderEvidence.reachabilityOrder, undefined);

const project = safeMergeJsTsProject({
  id: 'semantic_runtime_reachability_project_records',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/runtime-reachability.ts': unreachableMutationSource },
  workerFiles: { 'src/runtime-reachability.ts': unreachableMutationSource },
  headFiles: { 'src/runtime-reachability.ts': unreachableMutationSource }
});
const mutationRecord = project.outputProjectSymbolGraph.runtimeRegionRecords
  .find((record) => record.symbolName === 'returnThenWrite' && record.regionKind === 'mutation' && record.runtimeKind === 'mutating-call');
assert.equal(project.status, 'merged');
assert.equal(mutationRecord.runtimeOrderEvidence.reachabilityOrder[0].completionKind, 'return');

const reachabilityScript = createSemanticEditScript({
  id: 'semantic_runtime_reachability_completion_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-reachability.ts',
  baseSourceText: unreachableMutationSource,
  workerSourceText: unreachableMutationSource.replace('log.push(value);', 'log.push(String(value));'),
  headSourceText: unreachableMutationSource.replace('return value;', 'return String(value);'),
  generatedAt: 233
});
const reachabilityOperation = reachabilityScript.operations
  .find((operation) => operation.anchor.symbolName === 'returnThenWrite:mutation:mutating-call#1');
assert.equal(reachabilityScript.admission.status, 'conflict');
assert.equal(reachabilityOperation.status, 'conflict');
assert.equal(reachabilityOperation.reasonCodes.includes('runtime-order-unreachable-region-merge-requires-reachability-evidence'), true);
assert.equal(reachabilityOperation.reasonCodes.includes('runtime-order-return-reachability-merge-requires-completion-value-evidence'), true);

const exhaustiveBranchScript = createSemanticEditScript({
  id: 'semantic_runtime_exhaustive_branch_reachability_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-branch-reachability.ts',
  baseSourceText: exhaustiveBranchSource,
  workerSourceText: exhaustiveBranchSource.replace('log.push(value);', 'log.push(String(value));'),
  headSourceText: exhaustiveBranchSource.replace('return null;', 'return undefined;'),
  generatedAt: 235
});
const exhaustiveBranchOperation = exhaustiveBranchScript.operations
  .find((operation) => operation.anchor.symbolName === 'branchThenWrite:mutation:mutating-call#1');
assert.equal(exhaustiveBranchScript.admission.status, 'conflict');
assert.equal(exhaustiveBranchOperation.status, 'conflict');
assert.equal(exhaustiveBranchOperation.reasonCodes.includes('runtime-order-unreachable-region-merge-requires-reachability-evidence'), true);
assert.equal(exhaustiveBranchOperation.reasonCodes.includes('runtime-order-return-reachability-merge-requires-completion-value-evidence'), true);

const exhaustiveChainScript = createSemanticEditScript({
  id: 'semantic_runtime_exhaustive_chain_reachability_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-chain-reachability.ts',
  baseSourceText: exhaustiveChainSource,
  workerSourceText: exhaustiveChainSource.replace('log.push(value);', 'log.push(String(value));'),
  headSourceText: exhaustiveChainSource.replace('return null;', 'return undefined;'),
  generatedAt: 238
});
const exhaustiveChainOperation = exhaustiveChainScript.operations
  .find((operation) => operation.anchor.symbolName === 'chainThenWrite:mutation:mutating-call#1');
assert.equal(exhaustiveChainScript.admission.status, 'conflict');
assert.equal(exhaustiveChainOperation.status, 'conflict');
assert.equal(exhaustiveChainOperation.reasonCodes.includes('runtime-order-unreachable-region-merge-requires-reachability-evidence'), true);

const exhaustiveSwitchScript = createSemanticEditScript({
  id: 'semantic_runtime_exhaustive_switch_reachability_blocked',
  language: 'typescript',
  sourcePath: 'src/runtime-switch-reachability.ts',
  baseSourceText: exhaustiveSwitchSource,
  workerSourceText: exhaustiveSwitchSource.replace('log.push(value);', 'log.push(String(value));'),
  headSourceText: exhaustiveSwitchSource.replace('return null;', 'return undefined;'),
  generatedAt: 241
});
const exhaustiveSwitchOperation = exhaustiveSwitchScript.operations
  .find((operation) => operation.anchor.symbolName === 'switchThenWrite:mutation:mutating-call#1');
assert.equal(exhaustiveSwitchScript.admission.status, 'conflict');
assert.equal(exhaustiveSwitchOperation.status, 'conflict');
assert.equal(exhaustiveSwitchOperation.reasonCodes.includes('runtime-order-unreachable-region-merge-requires-reachability-evidence'), true);

const tryFinallyCompletionScript = createSemanticEditScript({ id: 'semantic_runtime_try_finally_reachability_blocked', language: 'typescript', sourcePath: 'src/runtime-try-finally-reachability.ts', baseSourceText: tryFinallyCompletionSource, workerSourceText: tryFinallyCompletionSource.replace('log.push(value);', 'log.push(String(value));'), headSourceText: tryFinallyCompletionSource.replace('return value;', 'return String(value);'), generatedAt: 245 });
const tryFinallyCompletionOperation = tryFinallyCompletionScript.operations
  .find((operation) => operation.anchor.symbolName === 'tryFinallyThenWrite:mutation:mutating-call#1');
assert.equal(tryFinallyCompletionScript.admission.status, 'conflict');
assert.equal(tryFinallyCompletionOperation.status, 'conflict');
assert.equal(tryFinallyCompletionOperation.reasonCodes.includes('runtime-order-unreachable-region-merge-requires-reachability-evidence'), true);
assert.equal(tryFinallyCompletionOperation.reasonCodes.includes('runtime-order-return-reachability-merge-requires-completion-value-evidence'), true);
