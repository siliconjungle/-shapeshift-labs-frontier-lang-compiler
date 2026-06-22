import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds,
  JsTsSafeMergeStatuses,
  jsTsSafeMergeGateOrder
} from './js-ts-safe-merge-constants.js';
import { safeMergeJsTsImportsAndDeclarations } from './js-ts-safe-merge.js';
import { createJsTsSafeMergeSemanticArtifacts } from './js-ts-safe-merge-semantic-artifacts.js';
import {
  applyJsTsPreparedMemberAdditions,
  neutralizeJsTsSafeMemberMergeSources
} from './js-ts-safe-member-merge.js';

function safeMergeJsTsSource(input = {}) {
  if (!hasMemberMergePolicy(input)) return safeMergeJsTsImportsAndDeclarations(input);

  const memberNeutralization = neutralizeJsTsSafeMemberMergeSources(input);
  if (!memberNeutralization.ok) {
    return composedBlockedResult(input, 'member-analysis', memberNeutralization.result, memberNeutralization.analysis);
  }

  const topLevelResult = safeMergeJsTsImportsAndDeclarations({
    ...input,
    baseSourceText: memberNeutralization.baseSourceText,
    workerSourceText: memberNeutralization.workerSourceText,
    headSourceText: memberNeutralization.headSourceText
  });
  if (topLevelResult.status !== JsTsSafeMergeStatuses.merged) {
    return composedBlockedResult(input, 'top-level', topLevelResult, memberNeutralization.analysis);
  }

  const memberApplication = applyJsTsPreparedMemberAdditions(
    topLevelResult.mergedSourceText,
    memberNeutralization.analysis.preparedRegions,
    ['head', 'worker']
  );
  if (memberApplication.reasonCodes.length) {
    return composedMemberApplicationBlockedResult(input, topLevelResult, memberNeutralization.analysis, memberApplication.reasonCodes);
  }

  const memberAdditions = memberNeutralization.analysis.preparedRegions.reduce((total, region) => (
    total + region.workerAddedKeys.length + region.headAddedKeys.length
  ), 0);
  const result = {
    ...topLevelResult,
    id: String(input.id ?? topLevelResult.id),
    mergedSourceText: memberApplication.sourceText,
    outputSourceText: memberApplication.sourceText,
    summary: {
      ...topLevelResult.summary,
      memberRegions: memberNeutralization.analysis.preparedRegions.length,
      memberAdditions,
      composedPhases: 2
    },
    metadata: {
      ...topLevelResult.metadata,
      composed: {
        phases: ['top-level', 'member'],
        memberRegions: memberNeutralization.analysis.preparedRegions.map((region) => ({
          kind: region.kind,
          name: region.name,
          regionKind: region.policy.regionKind,
          workerAddedKeys: region.workerAddedKeys,
          headAddedKeys: region.headAddedKeys
        }))
      }
    }
  };
  return {
    ...result,
    semanticArtifacts: createJsTsSafeMergeSemanticArtifacts(input, result)
  };
}

function hasMemberMergePolicy(input) {
  const policy = input.policy ?? input.mergePolicy ?? input;
  const regions = Array.isArray(policy)
    ? policy
    : policy?.unorderedRegions
      ?? policy?.unorderedMemberRegions
      ?? policy?.safeList
      ?? policy?.safeMembers
      ?? [];
  return Array.isArray(regions) && regions.length > 0;
}

function composedBlockedResult(input, phase, result, memberAnalysis) {
  return {
    kind: 'frontier.lang.jsTsSafeMerge',
    version: 1,
    schema: 'frontier.lang.jsTsSafeMerge.v1',
    id: String(input.id ?? result.id ?? 'js_ts_safe_merge'),
    status: JsTsSafeMergeStatuses.blocked,
    sourcePath: input.sourcePath,
    language: input.language ?? 'typescript',
    conflicts: result.conflicts ?? [],
    gates: result.gates ?? [],
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: result.admission?.reasonCodes ?? result.reasonCodes ?? []
    },
    summary: {
      importSpecifierAdditions: 0,
      topLevelDeclarationAdditions: 0,
      changedExistingDeclarations: result.summary?.changedExistingDeclarations ?? 0,
      conflicts: result.conflicts?.length ?? result.summary?.conflicts ?? 0,
      gatesPassed: result.gates?.filter((gate) => gate.status === 'passed').length ?? 0,
      memberRegions: memberAnalysis?.preparedRegions?.length ?? 0,
      memberAdditions: 0,
      composedPhases: phase === 'top-level' ? 2 : 1
    },
    metadata: {
      composed: {
        phase,
        sourceKind: result.kind
      }
    }
  };
}

function composedMemberApplicationBlockedResult(input, topLevelResult, memberAnalysis, reasonCodes) {
  const conflicts = reasonCodes.map((reason) => ({
    code: JsTsSafeMergeConflictCodes.parserLedgerLoss,
    gateId: JsTsSafeMergeGateIds.parseLedger,
    message: 'Composed member application could not find a stable target container.',
    side: 'merged',
    sourcePath: input.sourcePath,
    details: { reason }
  }));
  return {
    ...topLevelResult,
    status: JsTsSafeMergeStatuses.blocked,
    mergedSourceText: undefined,
    outputSourceText: undefined,
    conflicts,
    gates: jsTsSafeMergeGateOrder.map((id, index) => ({
      id,
      status: index === 0 ? 'blocked' : 'skipped',
      reasonCodes: index === 0 ? [JsTsSafeMergeConflictCodes.parserLedgerLoss] : []
    })),
    admission: {
      status: 'blocked',
      action: 'human-review',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: [JsTsSafeMergeConflictCodes.parserLedgerLoss]
    },
    summary: {
      ...topLevelResult.summary,
      conflicts: conflicts.length,
      gatesPassed: 0,
      memberRegions: memberAnalysis.preparedRegions.length,
      memberAdditions: 0,
      composedPhases: 2
    },
    metadata: {
      ...topLevelResult.metadata,
      composed: {
        phase: 'member-application',
        reasonCodes
      }
    }
  };
}

export {
  safeMergeJsTsSource
};
