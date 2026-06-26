import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource
} from '../../src/index.js';

const nestedBranchSource = [
  'export function nestedBranchThenWrite(log, value) {',
  '  if (value.ready) {',
  "    if (value.kind === 'skip') {",
  '      return value;',
  '    } else {',
  '      throw new Error(String(value));',
  '    }',
  '  } else {',
  '    return null;',
  '  }',
  '  log.push(value);',
  '}',
  ''
].join('\n');

const incompleteNestedBranchSource = [
  'export function incompleteNestedBranchThenWrite(log, value) {',
  '  if (value.ready) {',
  "    if (value.kind === 'skip') {",
  '      return value;',
  '    }',
  '  } else {',
  '    return null;',
  '  }',
  '  log.push(value);',
  '}',
  ''
].join('\n');

function assertNestedPathReachabilityOrder() {
  const nestedBranchRegion = createSemanticImportSidecar(importNativeSource({
    language: 'typescript',
    sourcePath: 'src/runtime-nested-branch-reachability.ts',
    sourceText: nestedBranchSource
  }), { generatedAt: 246 }).ownershipRegions
    .find((region) => region.symbolName === 'nestedBranchThenWrite:mutation:mutating-call#1');
  assert.ok(nestedBranchRegion);
  const reachability = nestedBranchRegion.metadata.runtimeOrderEvidence.reachabilityOrder[0];
  assert.equal(reachability.kind, 'exhaustive-if-else-unreachable-after-completion');
  assert.equal(reachability.proofLevel, 'lexical-if-else-bounded-nested-completion');
  assert.equal(reachability.boundedNestedPathEvidence, true);
  assert.deepEqual(reachability.branchLineNumbers, [2, 8]);
  assert.deepEqual(reachability.branchCompletionKinds, ['mixed', 'return']);
  assert.deepEqual(reachability.branchCompletionProofLevels, ['lexical-if-else-completion', 'lexical-same-block-completion']);
  assert.equal(reachability.completionKind, 'mixed');
  assert.equal(reachability.targetLine, 11);
  assert.equal(reachability.fullPathReachabilityClaim, false);
  assert.equal(reachability.runtimeEquivalenceClaim, false);

  const incompleteRegion = createSemanticImportSidecar(importNativeSource({
    language: 'typescript',
    sourcePath: 'src/runtime-incomplete-nested-branch-reachability.ts',
    sourceText: incompleteNestedBranchSource
  }), { generatedAt: 247 }).ownershipRegions
    .find((region) => region.symbolName === 'incompleteNestedBranchThenWrite:mutation:mutating-call#1');
  assert.ok(incompleteRegion);
  assert.equal(incompleteRegion.metadata.runtimeOrderEvidence.reachabilityOrder, undefined);

  const script = createSemanticEditScript({
    id: 'semantic_runtime_nested_branch_reachability_blocked',
    language: 'typescript',
    sourcePath: 'src/runtime-nested-branch-reachability.ts',
    baseSourceText: nestedBranchSource,
    workerSourceText: nestedBranchSource.replace('log.push(value);', 'log.push(String(value));'),
    headSourceText: nestedBranchSource.replace('return null;', 'return undefined;'),
    generatedAt: 248
  });
  const operation = script.operations
    .find((candidate) => candidate.anchor.symbolName === 'nestedBranchThenWrite:mutation:mutating-call#1');
  assert.equal(script.admission.status, 'conflict');
  assert.equal(operation.status, 'conflict');
  assert.equal(operation.reasonCodes.includes('runtime-order-unreachable-region-merge-requires-reachability-evidence'), true);
  assert.equal(operation.reasonCodes.includes('runtime-order-reachability-merge-requires-completion-path-evidence'), true);
}

export { assertNestedPathReachabilityOrder };
