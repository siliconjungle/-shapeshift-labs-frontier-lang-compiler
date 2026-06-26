import { JsTsSafeMergeStatuses, jsTsSafeMergeGateOrder } from './js-ts-safe-merge-constants.js';
import { createJsTsSafeMergeSemanticArtifacts } from './js-ts-safe-merge-semantic-artifacts.js';
import { uniqueStrings } from './js-ts-safe-merge-context.js';
import { mergeJsxChildExpressionSources } from './js-ts-safe-merge-jsx-child-expression-merge.js';
import { semanticFallbackChangedExistingDeclarations } from './js-ts-safe-merge-semantic-edit-fallback-utils.js';

function createJsxChildExpressionSemanticFallbackResult(input, topLevelResult, stagedFallback) {
  const currentSourceText = stagedFallback?.directReplayCurrentSourceText
    ?? stagedFallback?.replayCurrentSourceText
    ?? input.headSourceText;
  const merge = mergeJsxChildExpressionSources({
    baseSourceText: input.baseSourceText,
    workerSourceText: input.workerSourceText,
    headSourceText: input.headSourceText,
    currentSourceText
  });
  if (!merge.ok) return merge.policyBlocker ? jsxChildExpressionBlockedResult(input, topLevelResult, merge, stagedFallback) : undefined;
  if (merge.sourceText === currentSourceText) return undefined;
  const resultBase = stagedFallback?.stagedTopLevelResult ?? topLevelResult;
  const language = input.language ?? topLevelResult.language ?? 'tsx';
  const sourcePath = input.sourcePath ?? topLevelResult.sourcePath ?? 'inline.tsx';
  const id = String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge');
  const artifacts = createJsTsSafeMergeSemanticArtifacts({
    ...input,
    id: `${id}_jsx_child_expression`,
    language,
    sourcePath,
    headSourceText: currentSourceText,
    headHash: undefined,
    currentSourceHash: undefined
  }, {
    ...resultBase,
    id: `${String(input.id ?? resultBase.id ?? 'js_ts_safe_merge')}_jsx_child_expression`,
    language,
    sourcePath,
    mergedSourceText: merge.sourceText,
    outputSourceText: merge.sourceText
  });
  if (artifacts.status !== 'verified') return undefined;
  const gates = semanticArtifactGates(artifacts);
  return {
    ...resultBase,
    id: String(input.id ?? resultBase.id ?? topLevelResult.id),
    status: JsTsSafeMergeStatuses.merged,
    mergedSourceText: merge.sourceText,
    outputSourceText: merge.sourceText,
    conflicts: [],
    gates,
    admission: {
      status: 'auto-merge-candidate',
      action: 'apply',
      reviewRequired: false,
      autoApplyCandidate: true,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: []
    },
    summary: {
      ...resultBase.summary,
      changedExistingDeclarations: semanticFallbackChangedExistingDeclarations(topLevelResult, resultBase, stagedFallback),
      conflicts: 0,
      gatesPassed: gates.filter((gate) => gate.status === 'passed').length,
      semanticEditOperations: artifacts.script.summary.operations,
      semanticEditAppliedOperations: artifacts.replay.summary.applied,
      semanticEditReplayStatus: artifacts.replay.status,
      jsxChildExpressionElements: merge.summary.elements,
      jsxChildExpressionEdits: merge.summary.edits,
      jsxChildAdditions: merge.summary.childAdditions,
      jsxKeyedChildAdditions: merge.summary.keyedChildAdditions,
      jsxKeyedFragmentAdditions: merge.summary.keyedFragmentAdditions,
      composedPhases: 2
    },
    metadata: {
      ...resultBase.metadata,
      composed: {
        phase: stagedFallback ? 'staged-top-level-jsx-child-expression-semantic-fallback' : 'jsx-child-expression-semantic-fallback',
        phases: stagedFallback
          ? ['top-level-neutralization', 'top-level-ledger', 'jsx-child-expression']
          : ['top-level-ledger', 'jsx-child-expression'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        stagedTopLevelSummary: stagedFallback?.stagedTopLevelResult?.summary,
        neutralization: stagedFallback?.neutralization?.summary,
        jsxChildExpressionFallback: merge.summary
      }
    },
    semanticArtifacts: artifacts
  };
}

function jsxChildExpressionBlockedResult(input, topLevelResult, merge, stagedFallback) {
  const reasonCodes = uniqueStrings(merge.reasonCodes);
  const gates = jsTsSafeMergeGateOrder.map((id, index) => ({
    id,
    status: index === 0 ? 'blocked' : 'skipped',
    reasonCodes: index === 0 ? reasonCodes : []
  }));
  return {
    ...topLevelResult,
    id: String(input.id ?? topLevelResult.id),
    status: JsTsSafeMergeStatuses.blocked,
    mergedSourceText: undefined,
    outputSourceText: undefined,
    conflicts: [{
      code: 'jsx-child-expression-policy-blocked',
      gateId: 'parse-ledger',
      message: 'JSX child merge policy could not prove stable keyed identity and render ordering.',
      side: 'worker',
      sourcePath: input.sourcePath ?? topLevelResult.sourcePath,
      details: { reasonCodes }
    }],
    gates,
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes
    },
    summary: {
      ...topLevelResult.summary,
      changedExistingDeclarations: semanticFallbackChangedExistingDeclarations(topLevelResult, topLevelResult, stagedFallback),
      conflicts: 1,
      gatesPassed: 0,
      jsxChildExpressionPolicyBlocked: true,
      composedPhases: 2
    },
    metadata: {
      ...topLevelResult.metadata,
      composed: {
        phase: stagedFallback
          ? 'staged-top-level-jsx-child-expression-policy-blocked'
          : 'jsx-child-expression-policy-blocked',
        phases: stagedFallback
          ? ['top-level-neutralization', 'top-level-ledger', 'jsx-child-expression-policy']
          : ['top-level-ledger', 'jsx-child-expression-policy'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        stagedTopLevelSummary: stagedFallback?.stagedTopLevelResult?.summary,
        neutralization: stagedFallback?.neutralization?.summary,
        jsxChildExpressionPolicy: { reasonCodes }
      }
    },
    semanticArtifacts: topLevelResult.semanticArtifacts
  };
}

function semanticArtifactGates(artifacts) {
  return [
    gate('semantic-edit-script', artifacts.script?.admission?.status === 'auto-merge-candidate', artifacts.script?.admission?.reasonCodes),
    gate('semantic-edit-projection', artifacts.projection?.status === 'projected', artifacts.projection?.admission?.reasonCodes),
    gate('semantic-edit-replay', artifacts.replay?.status === 'accepted-clean', artifacts.replay?.admission?.reasonCodes),
    gate('semantic-edit-already-applied', artifacts.alreadyAppliedReplay?.status === 'already-applied', artifacts.alreadyAppliedReplay?.admission?.reasonCodes)
  ];
}

function gate(id, passed, reasonCodes = []) {
  return { id, status: passed ? 'passed' : 'blocked', reasonCodes: passed ? [] : uniqueStrings(reasonCodes) };
}

export { createJsxChildExpressionSemanticFallbackResult };
