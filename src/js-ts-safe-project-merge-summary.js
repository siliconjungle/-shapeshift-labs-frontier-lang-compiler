import { compactMissingEvidenceTelemetry, confidenceRecommendedAction, createProjectMergeAdmissionMatrixAudit, missingEvidenceItems, missingEvidenceSignals, prioritizedMissingEvidence } from './js-ts-safe-project-merge-missing-evidence.js';
import { failedEvidenceMissingItems, fileAdmissionEvidenceRecords } from './js-ts-safe-project-merge-evidence-routing.js'; import { compactProjectMergeRoutingCalibration } from './js-ts-safe-project-merge-routing-calibration.js';
import { htmlCssProjectSummary } from './js-ts-safe-project-merge-html-css-summary.js';
import { sourceTextMergeCandidateEvidenceRecord, sourceTextMergeSummary } from './js-ts-safe-project-merge-source-text-candidate.js';

function projectSummary(files, graphConflicts = [], hasProjectGraphDelta = false, outputDiagnosticsGate = undefined, outputDeclarationGate = undefined, outputQualityGate = undefined, moveRenameSummary = undefined, proofEvidence = undefined, symbolRenameSummary = undefined, splitMergeSummary = undefined, projectSymbolGraph = undefined) {
  const byOperation = {};
  for (const file of files) byOperation[file.operation] = (byOperation[file.operation] ?? 0) + 1;
  const limitConflicts = graphConflicts.filter((conflict) => conflict.gateId === 'project-graph-limit');
  const deltaConflicts = graphConflicts.filter((conflict) => conflict.gateId === 'project-graph-delta' || (hasProjectGraphDelta && conflict.gateId === 'project-graph-limit'));
  const outputConflicts = graphConflicts.filter((conflict) => conflict.gateId === 'project-symbol-graph' || (!hasProjectGraphDelta && conflict.gateId === 'project-graph-limit')), cssModuleConflicts = graphConflicts.filter((conflict) => conflict.gateId === 'project-css-module-use-site-graph');
  const proofLevelStatuses = proofEvidence?.summary?.levelStatuses ?? {};
  return {
    files: files.length,
    ...sourceTextMergeSummary(files),
    ...htmlCssProjectSummary(files),
    projectGraphConflicts: graphConflicts.length,
    projectGraphDeltaEvidenceIncluded: hasProjectGraphDelta ? 1 : 0, projectGraphEvidenceIncluded: projectSymbolGraph || hasProjectGraphDelta ? 1 : 0,
    outputProjectGraphConflicts: outputConflicts.length, projectGraphCssModuleUseSiteConflicts: cssModuleConflicts.length,
    projectGraphDeltaConflicts: deltaConflicts.length, projectGraphCssModuleUseSiteBlockers: projectSymbolGraph?.cssModuleUseSiteBlockers?.length ?? cssModuleConflicts.length,
    projectGraphLimitConflicts: limitConflicts.length, projectGraphCssModuleUseSiteGraphs: projectSymbolGraph?.cssModuleUseSiteGraphs?.length ?? 0, projectGraphCssModuleUseSites: projectSymbolGraph?.cssModuleUseSites?.length ?? 0, projectGraphCssModuleImportBindings: projectSymbolGraph?.cssModuleImportBindings?.length ?? 0,
    projectGraphPublicContractConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-public-contract-delta-conflict').length,
    projectGraphSourceSpanConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-source-span-delta-conflict').length,
    projectGraphCompilerTypeConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-public-compiler-type-delta-conflict').length,
    projectGraphRuntimeRegionConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-public-runtime-region-delta-conflict').length,
    projectGraphScopeUseDefConflicts: deltaConflicts.filter(isScopeUseDefConflict).length,
    projectGraphJsxPropConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-jsx-public-prop-delta-conflict').length,
    projectGraphJsxRenderRiskConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-jsx-public-render-risk-delta-conflict').length,
    projectGraphReExportIdentityConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-re-export-identity-delta-conflict').length,
    projectGraphModuleDeclarationShapeConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-module-declaration-shape-delta-conflict').length, projectGraphExportAssignmentShapeConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-export-assignment-shape-delta-conflict').length,
    projectGraphImportAttributeConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-import-attribute-delta-conflict').length,
    projectGraphImportTargetConflicts: deltaConflicts.filter((conflict) => conflict.code === 'project-import-target-delta-conflict').length,
    outputDiagnostics: outputDiagnosticsGate?.summary?.diagnostics ?? 0,
    outputDiagnosticConflicts: outputDiagnosticsGate?.summary?.conflicts ?? 0,
    outputDiagnosticErrors: outputDiagnosticsGate?.summary?.errors ?? 0,
    outputDiagnosticWarnings: outputDiagnosticsGate?.summary?.warnings ?? 0,
    outputDeclarations: outputDeclarationGate?.summary?.declarationFiles ?? 0,
    outputDeclarationBytes: outputDeclarationGate?.summary?.declarationBytes ?? 0,
    outputDeclarationConflicts: outputDeclarationGate?.summary?.conflicts ?? 0,
    outputDeclarationDiagnosticErrors: outputDeclarationGate?.summary?.errors ?? 0,
    outputQualityGates: outputQualityGate?.summary?.gates ?? 0,
    outputQualityGateConflicts: outputQualityGate?.summary?.failed ?? 0,
    proofEvidenceRecords: proofEvidence?.summary?.records ?? 0,
    proofEvidencePassed: proofEvidence?.summary?.passed ?? 0,
    proofEvidenceFailed: proofEvidence?.summary?.failed ?? 0,
    proofEvidenceSkipped: proofEvidence?.summary?.skipped ?? 0,
    proofEvidenceUnknown: proofEvidence?.summary?.unknown ?? 0,
    proofEvidenceMissing: proofEvidence?.summary?.missingLevels?.length ?? 0,
    proofEvidenceMissingLevels: proofEvidence?.summary?.missingLevels ?? [],
    proofEvidenceMissingSignals: proofEvidence?.summary?.missingSignals ?? [],
    proofEvidenceNextMissingCode: proofEvidence?.summary?.nextMissingEvidence?.code,
    proofEvidenceNextMissingLevel: proofEvidence?.summary?.nextMissingEvidence?.proofLevel,
    proofEvidenceNextMissingScope: proofEvidence?.summary?.nextMissingEvidence?.scope,
    proofEvidenceLevelStatuses: proofLevelStatuses,
    proofSyntaxIdentityStatus: proofLevelStatuses['syntax-identity'] ?? 'absent',
    proofSourceSpanRoundtripStatus: proofLevelStatuses['source-span-roundtrip'] ?? proofLevelStatuses['parser-roundtrip'] ?? 'absent',
    proofSemanticEditReplayCleanStatus: proofLevelStatuses['semantic-edit-replay-clean'] ?? 'absent',
    proofDiagnosticsStatus: proofLevelStatuses['diagnostics-clean'] ?? 'absent',
    proofDeclarationOutputStatus: proofLevelStatuses['declaration-output-stable'] ?? 'absent',
    proofFocusedTestStatus: proofLevelStatuses['focused-test-passed'] ?? 'absent',
    proofSemanticEquivalenceStatus: proofLevelStatuses['semantic-equivalence-external'] ?? proofLevelStatuses['semantic-equivalence-unknown'] ?? 'unknown',
    semanticEquivalenceLevel: proofEvidence?.summary?.semanticEquivalenceLevel ?? 'semantic-equivalence-unknown',
    semanticEquivalenceClaim: proofEvidence?.summary?.semanticEquivalenceClaim === true,
    projectMoveRenameClassifications: moveRenameSummary?.classifications ?? 0,
    projectFileMoveRenameClassifications: moveRenameSummary?.fileMoveRenames ?? 0,
    projectSymbolMoveClassifications: moveRenameSummary?.symbolMoves ?? 0,
    projectExportedSymbolMoveClassifications: moveRenameSummary?.exportedSymbolMoves ?? 0,
    projectImportedSymbolMoveClassifications: moveRenameSummary?.importedSymbolMoves ?? 0,
    projectSymbolMoveAdmissions: moveRenameSummary?.symbolMoveAdmissions ?? 0,
    projectExportedSymbolMoveAdmissions: moveRenameSummary?.exportedSymbolMoveAdmissions ?? 0,
    projectImportedSymbolMoveAdmissions: moveRenameSummary?.importedSymbolMoveAdmissions ?? 0,
    projectCrossFileSymbolRenameClassifications: symbolRenameSummary?.crossFileSymbolRenames ?? 0,
    projectCrossFileSymbolRenameAdmissions: symbolRenameSummary?.crossFileSymbolRenameAdmissions ?? 0,
    projectSplitMergeClassifications: splitMergeSummary?.classifications ?? 0,
    projectModuleSplitClassifications: splitMergeSummary?.moduleSplits ?? 0,
    projectModuleMergeClassifications: splitMergeSummary?.moduleMerges ?? 0,
    projectClassSplitClassifications: splitMergeSummary?.classSplits ?? 0,
    projectClassMergeClassifications: splitMergeSummary?.classMerges ?? 0,
    projectSplitMergeAdmissions: splitMergeSummary?.splitMergeAdmissions ?? 0,
    projectModuleSplitAdmissions: splitMergeSummary?.moduleSplitAdmissions ?? 0,
    projectModuleMergeAdmissions: splitMergeSummary?.moduleMergeAdmissions ?? 0,
    projectClassSplitAdmissions: splitMergeSummary?.classSplitAdmissions ?? 0,
    projectClassMergeAdmissions: splitMergeSummary?.classMergeAdmissions ?? 0,
    semanticArtifactFiles: files.filter(hasSemanticArtifacts).length,
    operations: byOperation
  };
}

function projectSummaryWithConfidenceEvidence(summary, evidence = [], confidence = undefined) {
  return {
    ...summary,
    evidenceRecords: evidence.length,
    passedEvidenceRecords: evidence.filter((record) => record.status === 'passed').length,
    failedEvidenceRecords: evidence.filter((record) => record.status === 'failed').length,
    unknownEvidenceRecords: evidence.filter((record) => record.status === 'unknown').length,
    confidenceScore: confidence?.score ?? 0,
    confidenceLevel: confidence?.level ?? 'unknown',
    confidenceDimensions: confidence?.dimensions ?? {},
    missingEvidenceMatrix: confidence?.missingEvidenceMatrix ?? compactMissingEvidenceTelemetry(), routingCalibration: confidence?.routingCalibration,
    missingSignals: confidence?.missingSignals?.length ?? 0,
    admissionMatrixPartialRows: confidence?.admissionMatrixAudit?.partialRows ?? 0,
    nextMissingEvidenceCode: confidence?.nextMissingEvidence?.code,
    nextMissingEvidenceKind: confidence?.nextMissingEvidence?.kind,
    nextMissingEvidenceScope: confidence?.nextMissingEvidence?.scope,
    nextMissingProofLevel: confidence?.nextMissingEvidence?.proofLevel,
    nextMissingEvidenceAction: confidence?.nextMissingEvidence?.action,
    nextMissingEvidenceRouteId: confidence?.nextMissingEvidence?.routeId ?? confidence?.nextMissingEvidence?.route?.id,
    nextMissingEvidenceRouteLane: confidence?.nextMissingEvidence?.routeLane ?? confidence?.nextMissingEvidence?.route?.lane,
    nextMissingEvidenceRouteNext: confidence?.nextMissingEvidence?.routeNext ?? confidence?.nextMissingEvidence?.route?.next
  };
}

function projectEvidence(id, status, summary, context = {}) {
  return uniqueRecords([
    sourceTextMergeCandidateEvidenceRecord(id, summary),
    projectMergeEvidenceRecord(id, status, summary, context),
    graphEvidenceRecord(id, summary, context),
    ...fileAdmissionEvidenceRecords(context.fileResults),
    ...(context.proofEvidence?.records ?? []),
    ...gateEvidenceRecords(context.outputQualityGate)
  ]);
}

function projectConfidence(id, status, summary, evidence = [], reasonCodes = [], conflictKeys = [], context = {}) {
  const failedEvidence = evidence.filter((record) => record.status === 'failed').length;
  const failedEvidenceMissing = failedEvidenceMissingItems(evidence);
  const missingEvidence = prioritizedMissingEvidence([
    ...failedEvidenceMissing,
    ...(context.proofEvidence?.summary?.missingEvidence ?? [])
  ], missingEvidenceItems(summary, context));
  const missingSignalValues = missingEvidenceSignals(missingEvidence);
  const recommendedAction = confidenceRecommendedAction(status, failedEvidence, missingEvidence, {
    reasonCodes,
    rerunReasonCodes: failedEvidenceMissing.map((item) => item.code)
  });
  const score = confidenceScore(status, summary, evidence, context);
  const missingEvidenceMatrix = compactMissingEvidenceTelemetry(missingEvidence);
  const admissionMatrixAudit = createProjectMergeAdmissionMatrixAudit(summary, missingEvidence, context.proofEvidence); const routingCalibration = compactProjectMergeRoutingCalibration(missingEvidence, context.proofEvidence);
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectMergeConfidence',
    version: 1,
    schema: 'frontier.lang.jsTsProjectMergeConfidence.v1',
    id: `${id}_confidence`,
    score,
    level: confidenceLevel(score, status),
    higherIsBetter: true,
    reviewRequired: status !== 'merged' || failedEvidence > 0,
    autoApplyCandidate: status === 'merged' && failedEvidence === 0,
    recommendedAction,
    reviewRecommended: recommendedAction === 'review',
    blockRecommended: recommendedAction === 'block',
    autoApplyEvidenceComplete: recommendedAction === 'apply',
    autoMergeClaim: false,
    semanticEquivalenceClaim: summary.semanticEquivalenceClaim === true,
    evidenceIds: evidence.map((record) => record.id).filter(Boolean),
    reasonCodes,
    conflictKeys,
    missingSignals: missingSignalValues,
    nextMissingSignal: missingSignalValues[0],
    nextMissingEvidence: missingEvidence[0],
    missingEvidence,
    missingEvidenceMatrix,
    routingCalibration,
    admissionMatrixAudit,
    dimensions: compactConfidenceDimensions(status, summary, context, routingCalibration),
    signals: compactRecord({
      files: summary.files,
      mergedFiles: summary.mergedFiles,
      blockedFiles: summary.blockedFiles,
      outputFiles: summary.outputFiles,
      sourceTextMergeCandidateStatus: summary.sourceTextMergeCandidateStatus,
      sourceTextMergeCandidateFiles: summary.sourceTextMergeCandidateFiles,
      sourceTextMergeBlockedFiles: summary.sourceTextMergeBlockedFiles,
      projectGraphConflicts: summary.projectGraphConflicts,
      outputDiagnosticConflicts: summary.outputDiagnosticConflicts,
      outputDeclarationConflicts: summary.outputDeclarationConflicts,
      outputQualityGateConflicts: summary.outputQualityGateConflicts,
      proofEvidenceFailed: summary.proofEvidenceFailed,
      proofEvidenceMissing: summary.proofEvidenceMissing,
      proofEvidenceNextMissingCode: summary.proofEvidenceNextMissingCode,
      proofSourceSpanRoundtripStatus: summary.proofSourceSpanRoundtripStatus,
      proofSemanticEditReplayCleanStatus: summary.proofSemanticEditReplayCleanStatus,
      proofDiagnosticsStatus: summary.proofDiagnosticsStatus,
      proofDeclarationOutputStatus: summary.proofDeclarationOutputStatus,
      proofFocusedTestStatus: summary.proofFocusedTestStatus,
      semanticArtifactFiles: summary.semanticArtifactFiles,
      semanticEditReplayClean: summary.proofSemanticEditReplayCleanStatus,
      evidenceRecords: evidence.length,
      failedEvidenceRecords: failedEvidence,
      nextMissingEvidenceRouteId: missingEvidence[0]?.routeId ?? missingEvidence[0]?.route?.id
    })
  });
}

function projectMergeEvidenceRecord(id, status, summary, context) {
  const conflicts = Number(summary.blockedFiles ?? 0) + Number(summary.projectGraphConflicts ?? 0)
    + Number(summary.outputDiagnosticConflicts ?? 0) + Number(summary.outputDeclarationConflicts ?? 0)
    + Number(summary.outputQualityGateConflicts ?? 0) + Number(summary.proofEvidenceFailed ?? 0);
  return {
    id: `${id}_project_merge_evidence`,
    kind: 'js-ts-project-safe-merge-summary',
    status: status === 'merged' ? 'passed' : 'failed',
    summary: status === 'merged'
      ? `Merged ${summary.mergedFiles} of ${summary.files} JS/TS project file(s).`
      : `Blocked JS/TS project merge with ${summary.blockedFiles} blocked file(s) and ${conflicts} conflict signal(s).`,
    metadata: compactRecord({
      files: summary.files,
      mergedFiles: summary.mergedFiles,
      blockedFiles: summary.blockedFiles,
      outputFiles: summary.outputFiles,
      conflicts,
      projectGraphEvidence: Boolean(context.hasProjectGraphEvidence),
      proofEvidenceRecords: summary.proofEvidenceRecords,
      semanticEquivalenceLevel: summary.semanticEquivalenceLevel,
      autoMergeClaim: false,
      semanticEquivalenceClaim: summary.semanticEquivalenceClaim === true
    })
  };
}

function graphEvidenceRecord(id, summary, context) {
  if (!context.hasProjectGraphEvidence && !summary.projectGraphConflicts) {
    const graphMissingEvidence = missingEvidenceItems(summary, context).filter((item) => item.scope === 'project-graph');
    return {
      id: `${id}_project_graph_evidence`,
      kind: 'js-ts-project-graph-evidence',
      level: 'project-graph-evidence-missing',
      status: 'skipped',
      scope: 'project-graph',
      summary: 'Project graph evidence was not included; broad semantic merge gaps remain review-only until output graph or delta evidence is supplied.',
      metadata: compactRecord({
        projectGraphEvidence: false,
        projectGraphDeltaEvidenceIncluded: false,
        missingSignals: missingEvidenceSignals(graphMissingEvidence),
        nextMissingEvidence: graphMissingEvidence[0],
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      })
    };
  }
  return {
    id: `${id}_project_graph_evidence`,
    kind: 'js-ts-project-graph-evidence',
    level: summary.projectGraphDeltaEvidenceIncluded ? 'project-graph-delta' : 'project-symbol-graph',
    status: summary.projectGraphConflicts ? 'failed' : 'passed',
    scope: 'project-graph',
    summary: summary.projectGraphConflicts
      ? `Project graph evidence found ${summary.projectGraphConflicts} conflict signal(s).`
      : 'Project graph evidence was available with no conflict signals.',
    metadata: compactRecord({
      projectGraphEvidence: true,
      projectGraphDeltaEvidenceIncluded: Boolean(summary.projectGraphDeltaEvidenceIncluded),
      projectGraphConflicts: summary.projectGraphConflicts,
      outputProjectGraphConflicts: summary.outputProjectGraphConflicts,
      projectGraphDeltaConflicts: summary.projectGraphDeltaConflicts,
      projectGraphSourceSpanConflicts: summary.projectGraphSourceSpanConflicts,
      projectGraphCompilerTypeConflicts: summary.projectGraphCompilerTypeConflicts,
      projectGraphRuntimeRegionConflicts: summary.projectGraphRuntimeRegionConflicts,
      projectGraphScopeUseDefConflicts: summary.projectGraphScopeUseDefConflicts,
      projectGraphJsxPropConflicts: summary.projectGraphJsxPropConflicts,
      projectGraphJsxRenderRiskConflicts: summary.projectGraphJsxRenderRiskConflicts,
      projectGraphModuleDeclarationShapeConflicts: summary.projectGraphModuleDeclarationShapeConflicts, projectGraphExportAssignmentShapeConflicts: summary.projectGraphExportAssignmentShapeConflicts,
      projectGraphLimitConflicts: summary.projectGraphLimitConflicts
    })
  };
}

function gateEvidenceRecords(gate) { return Array.isArray(gate?.evidence) ? gate.evidence : []; }
function hasSemanticArtifacts(file) { return Boolean(file?.semanticArtifacts ?? file?.result?.semanticArtifacts); }

function confidenceScore(status, summary, evidence, context) {
  const failedEvidence = evidence.filter((record) => record.status === 'failed').length;
  if (status !== 'merged') {
    const conflicts = Number(summary.blockedFiles ?? 0) + Number(summary.projectGraphConflicts ?? 0)
      + Number(summary.outputDiagnosticConflicts ?? 0) + Number(summary.outputDeclarationConflicts ?? 0)
      + Number(summary.outputQualityGateConflicts ?? 0) + Number(summary.proofEvidenceFailed ?? 0);
    return clampScore(34 - Math.min(34, conflicts * 8));
  }
  let score = 66;
  if (context.outputDiagnosticsGate?.status === 'passed') score += 8;
  if (context.outputDeclarationGate?.status === 'passed') score += 6;
  if (context.outputQualityGate?.status === 'passed') score += 6;
  if (context.hasProjectGraphEvidence && summary.projectGraphConflicts === 0) score += 6;
  if (summary.semanticArtifactFiles > 0) score += 4;
  if (summary.proofEvidencePassed > 0) score += Math.min(6, summary.proofEvidencePassed);
  score -= Math.min(failedEvidence * 8, 32);
  score -= summary.semanticEquivalenceLevel === 'semantic-equivalence-unknown' ? 8 : 0;
  return clampScore(score);
}

function confidenceLevel(score, status) {
  if (status !== 'merged' || score < 35) return 'blocked';
  return score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low';
}

function compactConfidenceDimensions(status, summary, context, routingCalibration = {}) {
  return compactRecord({
    merge: status === 'merged' ? 'merged' : 'blocked',
    sourceText: summary.sourceTextMergeCandidateStatus ?? 'absent',
    graph: context.hasProjectGraphEvidence ? (summary.projectGraphConflicts ? 'failed' : 'passed') : 'missing',
    diagnostics: gateConfidenceDimension(context.outputDiagnosticsGate),
    declarations: gateConfidenceDimension(context.outputDeclarationGate),
    quality: gateConfidenceDimension(context.outputQualityGate),
    proof: summary.proofEvidenceFailed ? 'failed' : summary.proofEvidenceMissing ? 'partial' : 'complete', semanticEquivalence: summary.semanticEquivalenceLevel === 'semantic-equivalence-unknown' ? 'unknown' : 'claimed', semanticEquivalenceProof: semanticEquivalenceProofDimension(summary), routeLane: routingCalibration.nextRouteLane, routeId: routingCalibration.nextRouteId, focusedProofGapRoute: routingCalibration.nextFocusedProofGapRouteId
  });
}

function gateConfidenceDimension(gate) { return !gate ? 'missing' : gate.status === 'passed' ? 'passed' : gate.status === 'skipped' ? 'missing' : 'failed'; }
function semanticEquivalenceProofDimension(summary) { return summary.proofSemanticEquivalenceStatus === 'failed' ? 'failed' : summary.semanticEquivalenceLevel === 'semantic-equivalence-unknown' ? 'missing' : 'passed'; }

function uniqueRecords(records) { const seen = new Set(); return records.filter((record) => !record?.id || seen.has(record.id) ? false : (seen.add(record.id), true)); }

function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function clampScore(value) { return Math.max(0, Math.min(100, Math.round(value))); }
function isScopeUseDefConflict(conflict) { return conflict.code === 'project-public-scope-use-def-delta-conflict' || conflict.code === 'project-public-scope-reference-delta-conflict'; }

export { projectConfidence, projectEvidence, projectSummary, projectSummaryWithConfidenceEvidence };
