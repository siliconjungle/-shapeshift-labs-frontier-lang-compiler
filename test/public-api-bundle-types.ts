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
const typedHtmlRuntimeMergeOptions = {
  htmlBrowserRuntimeProofs: [{}],
  htmlSourceBoundRuntimeProofs: [{}],
  htmlRuntimeBoundaryProofs: [{}],
  htmlSourceBoundRuntimeBoundaryProofs: [{}],
  browserRuntimeProofs: [{}],
  sourceBoundRuntimeProofs: [{}],
  sourceBoundRuntimeBoundaryProofs: [{}],
  runtimeBoundaryProofs: [{}]
} satisfies compilerApi.JsTsProjectHtmlCssMergeOptions;
const typedCssRuntimeMergeOptions = {
  cssCascadeRuntimeProof: {},
  cssCascadeRuntimeProofs: [{}],
  cssCascadeRuntimeProofsByPath: { 'src/site.css': [{}] },
  cssSourceBoundCascadeProof: {},
  cssSourceBoundCascadeProofs: [{}],
  cssSourceBoundCascadeProofsByPath: { 'src/site.css': [{}] },
  cascadeRuntimeProof: {},
  cascadeRuntimeProofs: [{}],
  cascadeRuntimeProofsByPath: { 'src/site.css': [{}] },
  sourceBoundCascadeProof: {},
  sourceBoundCascadeProofs: [{}],
  sourceBoundCascadeProofsByPath: { 'src/site.css': [{}] }
} satisfies compilerApi.JsTsProjectHtmlCssMergeOptions;
const typedSvgMergeOptions = {} satisfies compilerApi.JsTsProjectHtmlCssMergeOptions;
const declaredCssRuntimeMergeOptions: compilerApi.JsTsProjectHtmlCssMergeOptions = typedCssRuntimeMergeOptions;
declaredCssRuntimeMergeOptions.cssSourceBoundCascadeProofs satisfies readonly unknown[] | undefined;
declaredCssRuntimeMergeOptions.cssSourceBoundCascadeProofsByPath satisfies Readonly<Record<string, unknown>> | undefined;
declaredCssRuntimeMergeOptions.cascadeRuntimeProofs satisfies readonly unknown[] | undefined;
declaredCssRuntimeMergeOptions.cascadeRuntimeProofsByPath satisfies Readonly<Record<string, unknown>> | undefined;
declaredCssRuntimeMergeOptions.sourceBoundCascadeProofs satisfies readonly unknown[] | undefined;
declaredCssRuntimeMergeOptions.sourceBoundCascadeProofsByPath satisfies Readonly<Record<string, unknown>> | undefined;
({
  language: 'html',
  htmlMergeOptions: typedHtmlRuntimeMergeOptions,
  htmlMergeOptionsByPath: { 'src/page.html': typedHtmlRuntimeMergeOptions },
  markupMergeOptions: typedHtmlRuntimeMergeOptions,
  markupMergeOptionsByPath: { 'src/page.html': typedHtmlRuntimeMergeOptions },
  htmlBrowserRuntimeProof: {},
  htmlBrowserRuntimeProofs: [{}],
  htmlBrowserRuntimeProofsByPath: { 'src/page.html': [{}] },
  htmlSourceBoundRuntimeProof: {},
  htmlSourceBoundRuntimeProofs: [{}],
  htmlSourceBoundRuntimeProofsByPath: { 'src/page.html': [{}] },
  htmlRuntimeBoundaryProof: {},
  htmlRuntimeBoundaryProofs: [{}],
  htmlRuntimeBoundaryProofsByPath: { 'src/page.html': [{}] },
  htmlSourceBoundRuntimeBoundaryProof: {},
  htmlSourceBoundRuntimeBoundaryProofs: [{}],
  htmlSourceBoundRuntimeBoundaryProofsByPath: { 'src/page.html': [{}] },
  browserRuntimeProof: {},
  browserRuntimeProofs: [{}],
  browserRuntimeProofsByPath: { 'src/page.html': [{}] },
  sourceBoundRuntimeBoundaryProof: {},
  sourceBoundRuntimeBoundaryProofs: [{}],
  sourceBoundRuntimeBoundaryProofsByPath: { 'src/page.html': [{}] },
  sourceBoundRuntimeProof: {},
  sourceBoundRuntimeProofs: [{}],
  sourceBoundRuntimeProofsByPath: { 'src/page.html': [{}] }
} satisfies compilerApi.JsTsProjectSafeMergeInput);
({
  language: 'css',
  cssMergeOptions: typedCssRuntimeMergeOptions,
  styleMergeOptions: typedCssRuntimeMergeOptions,
  cssMergeOptionsByPath: { 'src/site.css': typedCssRuntimeMergeOptions },
  styleMergeOptionsByPath: { 'src/site.css': typedCssRuntimeMergeOptions }
} satisfies compilerApi.JsTsProjectSafeMergeInput);
({
  language: 'svg',
  svgMergeOptions: typedSvgMergeOptions,
  svgMergeOptionsByPath: { 'src/icon.svg': typedSvgMergeOptions },
  svgRuntimeProof: {},
  svgRuntimeProofs: [{}],
  svgRuntimeProofsByPath: { 'src/icon.svg': [{}] },
  svgBrowserRuntimeProof: {},
  svgBrowserRuntimeProofs: [{}],
  svgBrowserRuntimeProofsByPath: { 'src/icon.svg': [{}] }
} satisfies compilerApi.JsTsProjectSafeMergeInput);
declare const typedProjectSafeMerge: compilerApi.JsTsProjectSafeMergeResult;
typedProjectSafeMerge.summary.files satisfies number;
typedProjectSafeMerge.summary.mergedFiles satisfies number;
typedProjectSafeMerge.summary.blockedFiles satisfies number;
typedProjectSafeMerge.summary.outputFiles satisfies number;
typedProjectSafeMerge.summary.sourceTextMergeCandidateStatus satisfies compilerApi.JsTsProjectSourceTextMergeCandidateStatus;
typedProjectSafeMerge.summary.sourceTextMergeCandidateFiles satisfies number;
typedProjectSafeMerge.summary.sourceTextMergeBlockedFiles satisfies number;
typedProjectSafeMerge.summary.sourceTextMergeOutputFiles satisfies number;
typedProjectSafeMerge.summary.htmlFiles satisfies number;
typedProjectSafeMerge.summary.cssFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssFiles satisfies number;
typedProjectSafeMerge.summary.htmlMergedFiles satisfies number;
typedProjectSafeMerge.summary.cssMergedFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssMergedFiles satisfies number;
typedProjectSafeMerge.summary.htmlBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssBlockedFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssBlockedFiles satisfies number;
typedProjectSafeMerge.summary.htmlParserEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssParserEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssParserEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlParserEvidenceFailedFiles satisfies number;
typedProjectSafeMerge.summary.cssParserEvidenceFailedFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssParserEvidenceFailedFiles satisfies number;
typedProjectSafeMerge.summary.htmlIdentityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlExplicitIdentityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlPathOnlyIdentityResidualFiles satisfies number;
typedProjectSafeMerge.summary.htmlDuplicateIdentityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlDuplicateIdentityKeys satisfies number;
typedProjectSafeMerge.summary.htmlRuntimeBoundaryEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlFrameworkBoundaryEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlProofGapBlockedFiles satisfies number;
typedProjectSafeMerge.summary.svgFiles satisfies number;
typedProjectSafeMerge.summary.svgMergedFiles satisfies number;
typedProjectSafeMerge.summary.svgBlockedFiles satisfies number;
typedProjectSafeMerge.summary.svgParserEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.svgParserEvidenceFailedFiles satisfies number;
typedProjectSafeMerge.summary.svgReferenceGraphEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.svgReferenceGraphEvidenceFailedFiles satisfies number;
typedProjectSafeMerge.summary.svgReferenceGraphDefinitionRecords satisfies number;
typedProjectSafeMerge.summary.svgReferenceGraphReferenceRecords satisfies number;
typedProjectSafeMerge.summary.svgReferenceGraphMissingReferenceRecords satisfies number;
typedProjectSafeMerge.summary.svgIdentityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.svgIdentityEvidenceFailedFiles satisfies number;
typedProjectSafeMerge.summary.svgExplicitIdentityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.svgPathOnlyIdentityResidualFiles satisfies number;
typedProjectSafeMerge.summary.svgDuplicateIdentityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.svgDuplicateIdentityKeys satisfies number;
typedProjectSafeMerge.summary.svgRuntimeBoundaryEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.svgFrameworkBoundaryEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.svgProofGapBlockedFiles satisfies number;
typedProjectSafeMerge.summary.svgStructuralAddFiles satisfies number;
typedProjectSafeMerge.summary.svgStructuralDeleteFiles satisfies number;
typedProjectSafeMerge.summary.svgStructuralMoveFiles satisfies number;
typedProjectSafeMerge.summary.svgBrowserRuntimeProofs satisfies number;
typedProjectSafeMerge.summary.svgBrowserRuntimeProofBlockedFiles satisfies number;
typedProjectSafeMerge.summary.htmlClassTokenMergeFiles satisfies number;
typedProjectSafeMerge.summary.htmlClassTokenMergeEvidenceRecords satisfies number;
typedProjectSafeMerge.summary.htmlTokenListMergeFiles satisfies number;
typedProjectSafeMerge.summary.htmlTokenListMergeEvidenceRecords satisfies number;
typedProjectSafeMerge.summary.htmlUnkeyedStructuralAddFiles satisfies number;
typedProjectSafeMerge.summary.htmlUnkeyedStructuralAddEvidenceRecords satisfies number;
typedProjectSafeMerge.summary.htmlUnkeyedStructuralDeleteFiles satisfies number;
typedProjectSafeMerge.summary.htmlUnkeyedStructuralDeleteEvidenceRecords satisfies number;
typedProjectSafeMerge.summary.htmlUnkeyedStructuralMoveFiles satisfies number;
typedProjectSafeMerge.summary.htmlUnkeyedStructuralMoveEvidenceRecords satisfies number;
typedProjectSafeMerge.summary.cssSelectorTargetEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssStructuralTargetEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlIdentityEvidenceFailedFiles satisfies number;
typedProjectSafeMerge.summary.cssSelectorTargetConflictFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssStructuralTargetEvidenceFailedFiles satisfies number;
typedProjectSafeMerge.summary.cssSelectorTargetGraphEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssSelectorSpecificityEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssSelectorTargetMoveFiles satisfies number;
typedProjectSafeMerge.summary.cssSelectorTargetRebasedFiles satisfies number;
typedProjectSafeMerge.summary.cssScopedCascadeFiles satisfies number;
typedProjectSafeMerge.summary.cssScopedCascadeEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssScopedCascadeShapeEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssScopedCascadeBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssDuplicateCascadeKeyBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssOrderedCascadeOccurrenceEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssOrderedCascadeOccurrenceEvidenceRecords satisfies number;
typedProjectSafeMerge.summary.cssShorthandExpansionEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssDeterministicShorthandExpansionFiles satisfies number;
typedProjectSafeMerge.summary.cssShorthandExpansionBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssDependencySurfaceFiles satisfies number;
typedProjectSafeMerge.summary.cssDependencyGraphEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssDependencyGraphMissingProofFiles satisfies number;
typedProjectSafeMerge.summary.cssDependencyGraphBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssRuntimeDescriptorFiles satisfies number;
typedProjectSafeMerge.summary.cssRuntimeDescriptorEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssRuntimeDescriptorBlockedFiles satisfies number;
typedProjectSafeMerge.summary.cssPropertyDescriptorFiles satisfies number;
typedProjectSafeMerge.summary.cssPropertyDescriptorEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.cssPageDescriptorFiles satisfies number;
typedProjectSafeMerge.summary.cssPageDescriptorEvidenceFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssBrowserRuntimeProofs satisfies number;
typedProjectSafeMerge.summary.htmlCssBrowserRuntimeProofAdmittedFiles satisfies number;
typedProjectSafeMerge.summary.htmlCssBrowserRuntimeProofBlockedFiles satisfies number;
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
typedProjectSafeMerge.summary.proofEvidenceLevelStatuses['css-runtime-descriptor-evidence'] satisfies compilerApi.JsTsProjectMergeSummaryProofStatus | undefined;
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
