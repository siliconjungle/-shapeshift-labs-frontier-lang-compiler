import * as compilerApi from '../src/index.js';

const semanticPatchBundle = compilerApi.createSemanticPatchBundleRecord({
  language: 'javascript',
  sourcePath: 'src/example.js',
  baseHash: 'base_hash',
  targetHash: 'target_hash',
  changedRegions: [{ key: 'source#src/example.js#function#run', conflictKey: 'source#src/example.js#function#run' }],
  evidenceIds: ['evidence_example'],
  proofIds: ['proof_example'],
  historyIds: ['history_example'],
  admission: { status: 'queued', readiness: 'needs-review' }
});
const typedSemanticPatchBundle: compilerApi.SemanticPatchBundleRecord = semanticPatchBundle;
const typedSemanticPatchBundleIndex: compilerApi.SemanticPatchBundleRecordIndex = typedSemanticPatchBundle.index;
typedSemanticPatchBundleIndex.sourceBackprojectionModes satisfies readonly string[];
typedSemanticPatchBundleIndex.transformCrossLanguages satisfies readonly string[];
typedSemanticPatchBundleIndex.transformSourceMapMappingIds satisfies readonly string[];
typedSemanticPatchBundleIndex.lineageResolutionIds satisfies readonly string[];
const semanticEditBundleAdmission = compilerApi.createSemanticEditBundleAdmission({ replays: [] });
const typedSemanticEditBundleAdmission: compilerApi.SemanticEditBundleAdmission = semanticEditBundleAdmission;
const semanticEditBundleStatus: compilerApi.SemanticEditBundleAdmissionStatus = 'ready';
const semanticPatchBundleOptions: compilerApi.CreateSemanticPatchBundleRecordOptions = {
  semanticEditReplays: [],
  semanticEditAdmission: typedSemanticEditBundleAdmission,
  targetPortability: { status: 'portable', action: 'port-with-source-map-review' },
  admission: { status: 'queued', readiness: 'needs-review' }
};
const semanticPatchBundleQuery: compilerApi.SemanticPatchBundleRecordQuery = {
  semanticEditReplayStatus: 'accepted-clean',
  semanticEditReplayAction: 'apply',
  semanticEditAdmissionStatus: 'ready',
  semanticEditAdmissionAction: 'admit',
  semanticEditAdmissionReadiness: 'ready',
  sourceBackprojectionMode: 'cross-language-explicit-source-replacement',
  targetPortabilityStatus: 'portable'
};
const semanticPatchBundleOverlapQuery: compilerApi.SemanticPatchBundleOverlapQuery = {
  overlapKind: 'replay-output',
  semanticEditReplayOutputHash: 'output_hash'
};
const semanticPatchBundleComposition: compilerApi.SemanticPatchBundleComposition = compilerApi.composeSemanticPatchBundleProjections({
  currentSourceText: 'export const value = 1;\n',
  bundles: [typedSemanticPatchBundle],
  projections: []
});
const diagnosticsGate: compilerApi.JsTsProjectMergeDiagnosticsGate | undefined = compilerApi.createJsTsProjectMergeDiagnosticsGate({
  outputDiagnostics: [{ code: 'CUSTOM', severity: 'warning', message: 'typed warning' }]
}, [{ sourcePath: 'src/example.ts', sourceText: 'export const value = 1;\n' }]);
const declarationGate: compilerApi.JsTsProjectMergeDeclarationGate | undefined = compilerApi.createJsTsProjectMergeDeclarationGate({
  outputDeclarations: { 'src/example.d.ts': 'export declare const value = 1;\n' }
}, [{ sourcePath: 'src/example.ts', sourceText: 'export const value = 1;\n' }]);
declare const typedProjectSafeMerge: compilerApi.JsTsProjectSafeMergeResult;
typedProjectSafeMerge.summary.sourceTextMergeCandidateStatus satisfies compilerApi.JsTsProjectSourceTextMergeCandidateStatus;
typedProjectSafeMerge.summary.sourceTextMergeCandidateFiles satisfies number;
typedProjectSafeMerge.summary.sourceTextMergeBlockedFiles satisfies number;
typedProjectSafeMerge.summary.sourceTextMergeOutputFiles satisfies number;
typedProjectSafeMerge.summary.htmlExplicitIdentityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlPathOnlyIdentityResidualFiles satisfies number;
typedProjectSafeMerge.summary.htmlDuplicateIdentityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlDuplicateIdentityKeys satisfies number;
typedProjectSafeMerge.summary.htmlRuntimeBoundaryEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlFrameworkBoundaryEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlProofGapBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssSelectorTargetGraphEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssSelectorSpecificityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssSelectorTargetMoveFiles satisfies number;
typedProjectSafeMerge.summary.cssScopedCascadeFiles satisfies number;
typedProjectSafeMerge.summary.cssScopedCascadeEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssScopedCascadeBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssDuplicateCascadeKeyBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssShorthandExpansionEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssDeterministicShorthandExpansionFiles satisfies number;
typedProjectSafeMerge.summary.cssShorthandExpansionBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssDependencySurfaceFiles satisfies number;
typedProjectSafeMerge.summary.cssDependencyGraphEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssDependencyGraphMissingProofFiles satisfies number;
typedProjectSafeMerge.summary.cssDependencyGraphBlockedFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssBrowserRuntimeProofs satisfies number;
typedProjectSafeMerge.summary.projectGraphEvidenceIncluded satisfies number;
typedProjectSafeMerge.summary.projectGraphCssModuleUseSiteBlockers satisfies number;
typedProjectSafeMerge.summary.projectGraphCssModuleUseSiteGraphs satisfies number;
typedProjectSafeMerge.summary.projectGraphCssModuleUseSites satisfies number;
typedProjectSafeMerge.summary.projectGraphCssModuleImportBindings satisfies number;
typedProjectSafeMerge.summary.proofEvidenceMissingSignals satisfies readonly string[];
typedProjectSafeMerge.summary.proofEvidenceNextMissingCode satisfies string | undefined;
typedProjectSafeMerge.summary.proofEvidenceNextMissingLevel satisfies compilerApi.JsTsProjectMergeProofLevel | undefined;
typedProjectSafeMerge.summary.proofEvidenceNextMissingScope satisfies string | undefined;
typedProjectSafeMerge.summary.proofEvidenceLevelStatuses['source-text-merge-candidate'] satisfies compilerApi.JsTsProjectMergeSummaryProofStatus | undefined;
typedProjectSafeMerge.summary.proofSourceSpanRoundtripStatus satisfies compilerApi.JsTsProjectMergeSummaryProofStatus;
typedProjectSafeMerge.summary.proofSemanticEditReplayCleanStatus satisfies compilerApi.JsTsProjectMergeSummaryProofStatus;
typedProjectSafeMerge.summary.proofDiagnosticsStatus satisfies compilerApi.JsTsProjectMergeSummaryProofStatus;
typedProjectSafeMerge.summary.proofDeclarationOutputStatus satisfies compilerApi.JsTsProjectMergeSummaryProofStatus;
typedProjectSafeMerge.summary.proofFocusedTestStatus satisfies compilerApi.JsTsProjectMergeSummaryProofStatus;
typedProjectSafeMerge.summary.proofSemanticEquivalenceStatus satisfies compilerApi.JsTsProjectMergeSummaryProofStatus;
typedProjectSafeMerge.summary.semanticEquivalenceClaim satisfies boolean;
typedProjectSafeMerge.summary.admissionMatrixPartialRows satisfies number;
typedProjectSafeMerge.proofEvidence.summary.levelStatuses['source-text-merge-candidate'] satisfies compilerApi.JsTsProjectMergeProofEvidenceRecordStatus | undefined;
typedProjectSafeMerge.proofEvidence.summary.missingSignals satisfies readonly string[];
typedProjectSafeMerge.proofEvidence.summary.semanticEquivalenceUnknown satisfies boolean;
const queriedSemanticPatchBundles: readonly compilerApi.SemanticPatchBundleRecord[] = compilerApi.querySemanticPatchBundleRecords(
  [typedSemanticPatchBundle],
  { ...semanticPatchBundleQuery, regionKey: 'source#src/example.js#function#run', evidenceId: 'evidence_example', admissionStatus: 'queued' }
);
semanticPatchBundleComposition.status satisfies compilerApi.SemanticPatchBundleCompositionStatus;
if (diagnosticsGate) diagnosticsGate.status satisfies compilerApi.JsTsProjectMergeDiagnosticsGateStatus;
if (declarationGate) declarationGate.status satisfies compilerApi.JsTsProjectMergeDeclarationGateStatus;

void queriedSemanticPatchBundles;
void typedSemanticPatchBundleIndex;
void semanticPatchBundleQuery;
void typedSemanticEditBundleAdmission;
void semanticEditBundleStatus;
void semanticPatchBundleOptions;
void semanticPatchBundleOverlapQuery;
void semanticPatchBundleComposition;
void diagnosticsGate;
void declarationGate;
void typedProjectSafeMerge;
