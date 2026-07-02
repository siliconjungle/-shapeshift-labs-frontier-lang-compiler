import { parseFrontierFile, parseFrontierSource } from '@shapeshift-labs/frontier-lang-parser';
import { createUniversalConversionPlan } from './createUniversalConversionPlan.js';

export function createUniversalConversionPlanFromFrontierSource(source, options = {}) {
  const { fileName, parse, sourcePath, ...planOptions } = options;
  const document = fileName ? parseFrontierFile(fileName, source) : parseFrontierSource(source, parse);
  const plan = createUniversalConversionPlan({ ...planOptions, document });
  return {
    ...plan,
    document,
    ...(sourcePath ?? fileName ? { sourcePath: sourcePath ?? fileName } : {}),
    metadata: {
      ...plan.metadata,
      authoredFrontierSource: sourceMetadata(document, sourcePath ?? fileName)
    }
  };
}

function sourceMetadata(document, sourcePath) {
  const authored = document.metadata?.universalConversionPlan;
  const constraintSpaces = document.metadata?.constraintSpaces;
  const decisionGraph = document.metadata?.decisionGraph;
  return {
    documentId: document.id,
    ...(sourcePath ? { sourcePath } : {}),
    conversionPlanId: authored?.id,
    targets: authored?.targets ?? [],
    constraintFamilies: Object.keys(authored ?? {}).filter((key) => key.endsWith('Constraints') || key === 'resourceTransfers'),
    constraintSpaceId: constraintSpaces?.id,
    constraintSpaceIds: ids(constraintSpaces?.spaces),
    constraintSpaceVariableIds: constraintSpaces?.variableIds ?? [],
    constraintSpaceConstraintIds: constraintSpaces?.constraintIds ?? [],
    constraintSpacePreferenceIds: constraintSpaces?.preferenceIds ?? [],
    constraintSpaceCollapseStrategyIds: constraintSpaces?.collapseStrategyIds ?? [],
    constraintSpaceAdmissionIds: constraintSpaces?.admissionIds ?? [],
    constraintSpaceSummary: constraintSpaces?.summary,
    sourceRuntimes: authored?.sourceRuntimes ?? {},
    targetRuntimes: authored?.targetRuntimes ?? {},
    runtimeRequirementIds: ids(authored?.runtimeRequirements),
    dialectRecordIds: ids(authored?.dialects),
    externRecordIds: ids(authored?.externs),
    decisionGraphId: decisionGraph?.id,
    decisionGraphIds: decisionGraph?.graphIds ?? [],
    decisionGraphRecordIds: decisionGraph?.recordIds ?? [],
    decisionGraphGateIds: decisionGraph?.gateIds ?? [],
    decisionGraphEvidenceIds: decisionGraph?.evidenceIds ?? [],
    decisionGraphSemanticChangeIds: decisionGraph?.semanticChangeIds ?? [],
    decisionGraphPatchEventIds: decisionGraph?.patchEventIds ?? [],
    decisionGraphAdmissionDecisionIds: decisionGraph?.admissionDecisionIds ?? [],
    decisionGraphDecisionIds: decisionGraph?.decisionIds ?? [],
    decisionGraphReplayRecordIds: decisionGraph?.replayRecordIds ?? [],
    decisionGraphTournamentRecordIds: decisionGraph?.tournamentRecordIds ?? [],
    decisionGraphRsiLoopIds: decisionGraph?.rsiLoopIds ?? [],
    decisionGraphSummary: decisionGraph?.summary
  };
}

function ids(records = []) {
  return records.map((record) => record?.id).filter(Boolean);
}
