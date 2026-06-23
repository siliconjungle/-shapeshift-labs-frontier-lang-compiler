import { JsTsSafeMergeStatuses } from './js-ts-safe-merge-constants.js';
import { createIndependentTopLevelDeletionArtifacts } from './js-ts-safe-merge-independent-deletion-artifacts.js';
import { createIndependentTopLevelDeletionPlan } from './js-ts-safe-merge-independent-deletion-plan.js';
import { semanticEditGates } from './js-ts-safe-merge-semantic-edit-gates.js';

function independentTopLevelDeletionFallbackResult(input, topLevelResult) {
  const deletionPlan = createIndependentTopLevelDeletionPlan(input, topLevelResult);
  if (!deletionPlan.ok) return undefined;
  const artifacts = createIndependentTopLevelDeletionArtifacts(input, topLevelResult, deletionPlan);
  if (artifacts.status !== 'verified') return undefined;
  const gates = semanticEditGates(artifacts);
  return {
    ...topLevelResult,
    id: String(input.id ?? topLevelResult.id ?? 'js_ts_safe_merge'),
    status: JsTsSafeMergeStatuses.merged,
    mergedSourceText: deletionPlan.mergedSourceText,
    outputSourceText: deletionPlan.mergedSourceText,
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
      ...topLevelResult.summary,
      changedExistingDeclarations: 0,
      conflicts: 0,
      gatesPassed: gates.filter((gateRecord) => gateRecord.status === 'passed').length,
      topLevelDeclarationDeletions: 1,
      semanticEditOperations: artifacts.script.summary.operations,
      semanticEditAppliedOperations: artifacts.replay.summary.applied,
      semanticEditReplayStatus: artifacts.replay.status,
      composedPhases: 2
    },
    metadata: {
      ...topLevelResult.metadata,
      composed: {
        phase: 'independent-top-level-deletion-fallback',
        phases: ['top-level-ledger', 'independent-top-level-deletion'],
        originalReasonCodes: topLevelResult.admission?.reasonCodes ?? [],
        deletion: deletionPlan.summary
      }
    },
    semanticArtifacts: artifacts
  };
}

export { independentTopLevelDeletionFallbackResult };
