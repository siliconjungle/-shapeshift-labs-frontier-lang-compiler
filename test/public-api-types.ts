import * as compilerApi from '../src/index.js';
import './public-api-native-fixtures.js';
import './public-api-adapter-fixtures.js';
import './public-api-bundle-types.js';
import './public-api-transform-types.js';
import './public-api-universal-conversion-receipt-types.js'; import './public-api-semantic-resource-graph-types.js';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? (<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2)
      ? true
      : false
    : false;

type ExpectedPublicRuntimeExport =
  | 'FrontierCompileTargets'
  | 'NativeImportLanguageProfiles'
  | 'NativeImportLossKinds'
  | 'NativeImportFeatureEvidencePolicies'
  | 'NativeImportReadinessBySeverity'
  | 'NativeImportRegionTaxonomyKinds'
  | 'NativeImportRoundtripReadinessStatuses'
  | 'NativeImportTaxonomyKinds'
  | 'NativeParserAstFormats'
  | 'NativeParserAstFormatProfiles'
  | 'NativeParserFeatureCategories'
  | 'NativeParserFeatureCoverageStatuses'
  | 'ProjectionReadinessStatuses'
  | 'ProjectionTargetLossClasses'
  | 'LanguageAdapterPackageContracts'
  | 'LanguageAdapterPackageReleaseReadinessStatuses'
  | 'JsTsSafeMergeConflictCodes'
  | 'JsTsSafeMergeGateIds'
  | 'JsTsSafeMergeStatuses'
  | 'JsTsSemanticConflictSidecarClasses'
  | 'JsTsSemanticMergeConflictClasses'
  | 'JsTsSemanticMergeGateStatuses'
  | 'SemanticMergeConflictClasses'
  | 'SemanticMergeCandidateProjectionRisks'
  | 'SemanticPatchBundleAdmissionStatuses' | 'SemanticPatchBundleOverlapKinds' | 'SemanticPatchBundleOverlapStatuses'
  | 'SemanticEditBundleAdmissionStatuses'
  | 'SemanticEditScriptAdmissionStatuses' | 'SemanticGraphLayerKinds'
  | 'SemanticResourceGraphRecordKinds' | 'SemanticResourceLoanModes'
  | 'SemanticHistoryAdmissionStatuses'
  | 'SemanticHistoryConflictReasons'
  | 'SemanticLineageEventKinds'
  | 'SemanticLineageResolutionStatuses'
  | 'SemanticHistoryOverlapKinds'
  | 'SemanticHistoryReviewerStatuses'
  | 'UniversalDialectConstructKinds' | 'UniversalDialectProjectionDispositions' | 'UniversalBorrowCheckerConstraintStatuses' | 'UniversalBorrowScopeConstraintStatuses' | 'UniversalControlFlowConstraintStatuses' | 'UniversalAdtPatternConstraintStatuses' | 'UniversalDataLayoutConstraintStatuses' | 'UniversalConcurrencyModelConstraintStatuses' | 'UniversalEffectConstraintStatuses' | 'UniversalErrorModelConstraintStatuses' | 'UniversalEvaluationModelConstraintStatuses' | 'UniversalHostEnvironmentConstraintStatuses' | 'UniversalLifetimeConstraintStatuses' | 'UniversalMemoryModelConstraintStatuses' | 'UniversalMetaprogrammingConstraintStatuses' | 'UniversalScopeBindingConstraintStatuses' | 'UniversalModuleConstraintStatuses' | 'UniversalObjectModelConstraintStatuses' | 'UniversalProtocolConstraintStatuses' | 'UniversalTypeConstraintStatuses'
  | 'UniversalInterlinguaConstraintEdgeKinds' | 'UniversalInterlinguaLayerKinds' | 'UniversalInterlinguaLoweringDispositions'
  | 'UniversalRepresentationConstructKinds' | 'UniversalOwnershipConstraintStatuses' | 'UniversalResourceTransferStatuses' | 'UniversalRuntimeCapabilityKinds'
  | 'UniversalRuntimeHostProfiles'
  | 'ExternalSemanticIndexFormats'
  | 'attachUniversalDialectRegistry'
  | 'classifyNativeImportReadiness'
  | 'classifyNativeImportRoundtripReadiness'
  | 'compileNativeSource'
  | 'compileFrontierDocument'
  | 'compileFrontierSource'
  | 'compactSemanticSidecarExample'
  | 'createBabelNativeImporterAdapter'
  | 'createBidirectionalTargetChangeRecord'
  | 'createEstreeNativeImporterAdapter'
  | 'createLanguageAdapterPackageContract'
  | 'createNativeImportCoverageMatrix'
  | 'createNativeImportResultContract'
  | 'createNativeParserAstFormatMatrix'
  | 'createNativeParserFeatureMatrix' | 'createNativeProjectModuleResolutionFromPackageManifests'
  | 'createNativeRoundtripEvidence'
  | 'createProjectImportAdmissionRecord'
  | 'createProjectionReadinessMatrix'
  | 'createProjectionTargetLossMatrix'
  | 'createSemanticHistoryRecord'
  | 'createSemanticAnchor'
  | 'createSemanticLineageEvent'
  | 'createSemanticLineageMap'
  | 'createSemanticMergeCandidateAdmissionRecord'
  | 'createSemanticEditBundleAdmission'
  | 'createSemanticEditScript' | 'createSemanticGraphLayerSummary' | 'createSemanticResourceGraph'
  | 'createSemanticPatchBundleRecord' | 'compareSemanticPatchBundleRecords' | 'composeSemanticPatchBundleProjections'
  | 'createSemanticTransformIdentityRecord' | 'deriveSemanticTransformIdentityRecords'
  | 'createUniversalCapabilityMatrix' | 'createUniversalConversionArtifacts' | 'createUniversalConversionPlan' | 'createUniversalConversionRouteEvidenceReceipt' | 'createUniversalConversionWorklist'
  | 'createUniversalRuntimeCapabilityMatrix' | 'createUniversalBorrowCheckerConstraintEvidence' | 'createUniversalBorrowScopeConstraintEvidence' | 'createUniversalControlFlowConstraintEvidence' | 'createUniversalAdtPatternConstraintEvidence' | 'createUniversalDataLayoutConstraintEvidence' | 'createUniversalConcurrencyModelConstraintEvidence' | 'createUniversalEffectConstraintEvidence' | 'createUniversalErrorModelConstraintEvidence' | 'createUniversalEvaluationModelConstraintEvidence' | 'createUniversalHostEnvironmentConstraintEvidence' | 'createUniversalLifetimeConstraintEvidence' | 'createUniversalMemoryModelConstraintEvidence' | 'createUniversalMetaprogrammingConstraintEvidence' | 'createUniversalScopeBindingConstraintEvidence' | 'createUniversalModuleConstraintEvidence' | 'createUniversalObjectModelConstraintEvidence' | 'createUniversalProtocolConstraintEvidence' | 'createUniversalTypeConstraintEvidence' | 'createUniversalOwnershipConstraintEvidence' | 'createUniversalResourceTransferEvidence'
  | 'createUniversalDialectRecord'
  | 'createUniversalDialectRegistry'
  | 'createUniversalExternRecord' | 'createUniversalInterlinguaRecord'
  | 'createUniversalRepresentationCoverage'
  | 'createNativeSourcePreservation'
  | 'decorateSemanticMergeCandidateForAdmission'
  | 'createCSharpRoslynNativeImporterAdapter'
  | 'createClangAstNativeImporterAdapter'
  | 'createGoAstNativeImporterAdapter'
  | 'createJavaAstNativeImporterAdapter'
  | 'createKotlinPsiNativeImporterAdapter'
  | 'createPythonAstNativeImporterAdapter'
  | 'createRustSynNativeImporterAdapter'
  | 'createSwiftSyntaxNativeImporterAdapter'
  | 'createJsTsSemanticConflictSidecars'
  | 'createJsTsSemanticMergeConflictExplanation'
  | 'createJsTsSemanticMergeGateResult'
  | 'createJsTsProjectMergeDeclarationEmitParityProof' | 'createJsTsProjectMergeDeclarationGate' | 'createJsTsProjectMergeDiagnosticsGate' | 'createJsTsProjectReferenceCompositeProof' | 'createJsxSemanticMergeEvidence' | 'createSvgSemanticMergeEvidence' | 'createPackageManifestSemanticMergeEvidence' | 'createRustSemanticMergeEvidence'
  | 'createSemanticImportSidecar'
  | 'createSemanticSlice'
  | 'createSemanticSliceAdmissionRecord'
  | 'createTreeSitterNativeImporterAdapter'
  | 'createTypeScriptCompilerNativeImporterAdapter'
  | 'createUniversalAstFromDocument'
  | 'diffNativeSourceImports'
  | 'diffNativeSources'
  | 'emitForTarget'
  | 'emitForTargetWithSourceMap'
  | 'getLanguageAdapterPackageContract'
  | 'getNativeImportFeatureEvidencePolicy'
  | 'getNativeParserAstFormatProfile'
  | 'parseJsxSemanticTree' | 'parseSvgSemanticTree' | 'parsePackageManifestSemanticTree' | 'parseRustSemanticTree'
  | 'queryLanguageAdapterPackageContracts' | 'queryJsxElementRecords' | 'queryPackageDependencyRecords' | 'queryRustItemRecords'
  | 'queryNativeParserFeatureMatrix'
  | 'queryProjectionReadinessMatrix' | 'queryUniversalCapabilityMatrix'
  | 'querySemanticHistoryRecordOverlaps'
  | 'querySemanticLineageEvents'
  | 'querySemanticMergeCandidateAdmissionOverlaps'
  | 'querySemanticResourceGraph'
  | 'querySemanticPatchBundleRecords' | 'querySemanticPatchBundleOverlaps' | 'querySvgReferenceGraph'
  | 'querySemanticMergeConflictClasses'
  | 'queryUniversalConversionArtifacts' | 'queryUniversalConversionPlan' | 'queryUniversalConversionWorklist' | 'queryUniversalRuntimeCapabilityMatrix' | 'UniversalConversionWorkItemKinds'
  | 'resolveSemanticLineage'
  | 'resolveSemanticLineageBatch'
  | 'resolveSemanticHistoryRecordLineage'
  | 'resolveSemanticHistoryRecordsLineage'
  | 'importExternalSemanticIndex'
  | 'importNativeProject'
  | 'importNativeSource'
  | 'inferSemanticLineageEvents'
  | 'mergeJsTsSafeMemberAdditions'
  | 'normalizeCompileTarget'
  | 'projectFrontierAst'
  | 'projectSemanticEditScriptToSource' | 'replaySemanticEditProjection'
  | 'projectNativeImportToSource'
  | 'readSemanticSliceJson'
  | 'readUniversalAstJson'
  | 'renderTargetAst'
  | 'renderTargetAstWithSourceMap'
  | 'representationCoverageMatches' | 'resourceTransferMatches' | 'borrowCheckerConstraintMatches' | 'borrowScopeConstraintMatches' | 'controlFlowConstraintMatches' | 'adtPatternConstraintMatches' | 'dataLayoutConstraintMatches' | 'concurrencyModelConstraintMatches' | 'effectConstraintMatches' | 'errorModelConstraintMatches' | 'evaluationModelConstraintMatches' | 'hostEnvironmentConstraintMatches' | 'lifetimeConstraintMatches' | 'memoryModelConstraintMatches' | 'metaprogrammingConstraintMatches' | 'scopeBindingConstraintMatches' | 'moduleConstraintMatches' | 'objectModelConstraintMatches' | 'protocolConstraintMatches' | 'typeConstraintMatches' | 'ownershipConstraintMatches' | 'interlinguaRecordMatches'
  | 'resolveCapabilityAdapters'
  | 'runNativeImporterAdapter'
  | 'runNativeTargetProjectionAdapter'
  | 'safeMergeJsTsImportsAndDeclarations'
  | 'safeMergeJsTsProject'
  | 'safeMergeJsTsSource'
  | 'safeMergeJsTsMembers'
  | 'semanticMergeCandidateReadinessSortKey'
  | 'semanticMergeConflictRiskScore'
  | 'semanticHistoryRecordsConflict'
  | 'semanticHistoryRecordsOverlap'
  | 'semanticTransformIdentityFields'
  | 'sortSemanticMergeCandidateAdmissionRecords'
  | 'sortSemanticMergeCandidatesByConflictRisk' | 'summarizeJsxSemanticTree'
  | 'summarizeLanguageAdapterPackageContracts' | 'summarizeJsTsSemanticConflictSidecars'
  | 'summarizeSemanticMergeConflicts'
  | 'summarizeSemanticResourceGraph'
  | 'summarizeNativeImportFeatureEvidence'
  | 'summarizeNativeImportLosses' | 'summarizeSvgSemanticTree' | 'summarizePackageManifestSemanticTree' | 'summarizeRustSemanticTree'
  | 'summarizeUniversalDialectRegistry'
  | 'testSemanticSlice'
  | 'writeSemanticSliceJson'
  | 'writeUniversalAstJson';

type PublicRuntimeExportsMatchDeclarations = Expect<Equal<keyof typeof compilerApi, ExpectedPublicRuntimeExport>>;
type RoundtripRouteAuditBuckets = Expect<Equal<keyof compilerApi.NativeRoundtripRoutePathsAudit, 'reversible' | 'preservedSource' | 'stubOnly' | 'adapterProjected'>>;
type RoundtripSemanticEquivalenceClaimStaysFalse = Expect<Equal<compilerApi.NativeRoundtripSemanticEquivalenceAudit['claimed'], false>>;
type RoundtripRouteSourceMapPrecisionIsTyped = compilerApi.NativeRoundtripRouteSourceMapsAudit['output']['precision'];

void (null as unknown as PublicRuntimeExportsMatchDeclarations);
void (null as unknown as RoundtripRouteAuditBuckets);
void (null as unknown as RoundtripSemanticEquivalenceClaimStaysFalse);
void (null as unknown as RoundtripRouteSourceMapPrecisionIsTyped);
type RustBorrowPrimitiveModelFields = Expect<Equal<compilerApi.UniversalOwnershipConstraintModel['hasReborrow'] | compilerApi.UniversalOwnershipConstraintModel['hasTwoPhaseBorrow'] | compilerApi.UniversalOwnershipConstraintModel['hasInteriorMutability'] | compilerApi.UniversalOwnershipConstraintModel['hasPinnedResource'] | compilerApi.UniversalLifetimeConstraintModel['hasNonLexicalLifetime'] | compilerApi.UniversalLifetimeConstraintModel['hasHigherRankedLifetime'] | compilerApi.UniversalBorrowScopeConstraintModel['hasPinProjection'], boolean>>;
void (null as unknown as RustBorrowPrimitiveModelFields);
const bidirectionalTargetChange = compilerApi.createBidirectionalTargetChangeRecord({
  source: {
    language: 'typescript',
    sourcePath: 'src/example.ts',
    sourceText: 'export function run() { return 1; }\n'
  },
  targetLanguage: 'rust',
  targetPath: 'src/example.rs',
  baseTarget: {
    language: 'rust',
    sourcePath: 'src/example.rs',
    sourceText: 'pub fn run() -> i32 { 1 }\n'
  },
  editedTarget: {
    language: 'rust',
    sourcePath: 'src/example.rs',
    sourceText: 'pub fn run() -> i32 { 2 }\n'
  }
});
const typedBidirectionalTargetChange: compilerApi.BidirectionalTargetChangeRecord = bidirectionalTargetChange;
const typedBidirectionalTargetPortability: compilerApi.BidirectionalTargetPortabilityRecord = typedBidirectionalTargetChange.targetPortability;
const typedBidirectionalMatchPortability: compilerApi.BidirectionalTargetMatchPortability | undefined = typedBidirectionalTargetChange.sourceAnchorMatches[0]?.portability;
typedBidirectionalTargetPortability.status satisfies compilerApi.BidirectionalTargetPortabilityStatus;
typedBidirectionalTargetPortability.action satisfies compilerApi.BidirectionalTargetPortabilityAction;
typedBidirectionalMatchPortability?.status satisfies compilerApi.BidirectionalTargetPortabilityStatus | undefined;

void typedBidirectionalTargetChange;
void typedBidirectionalTargetPortability;
void typedBidirectionalMatchPortability;

const jsTsSafeMergeWithSemanticArtifacts = compilerApi.safeMergeJsTsImportsAndDeclarations({
  baseSourceText: 'export const stable = 1;\n',
  workerSourceText: 'export const stable = 1;\nexport const workerOnly = 1;\n',
  headSourceText: 'export const stable = 1;\n',
  language: 'typescript',
  sourcePath: 'src/example.ts'
});
const typedJsTsSafeMergeSemanticArtifacts: compilerApi.JsTsSafeMergeSemanticArtifacts | undefined = jsTsSafeMergeWithSemanticArtifacts.semanticArtifacts;
typedJsTsSafeMergeSemanticArtifacts?.script satisfies compilerApi.SemanticEditScript | undefined;
typedJsTsSafeMergeSemanticArtifacts?.projection satisfies compilerApi.SemanticEditProjection | undefined;
typedJsTsSafeMergeSemanticArtifacts?.replay satisfies compilerApi.SemanticEditReplay | undefined;
typedJsTsSafeMergeSemanticArtifacts?.alreadyAppliedReplay satisfies compilerApi.SemanticEditReplay | undefined;
typedJsTsSafeMergeSemanticArtifacts?.admission.autoMergeClaim satisfies false | undefined;
typedJsTsSafeMergeSemanticArtifacts?.admission.semanticEquivalenceClaim satisfies false | undefined;
jsTsSafeMergeWithSemanticArtifacts.summary.importDeclarationAdditions satisfies number; [jsTsSafeMergeWithSemanticArtifacts.summary.jsxAttributeEdits, jsTsSafeMergeWithSemanticArtifacts.summary.jsxChildExpressionEdits, jsTsSafeMergeWithSemanticArtifacts.summary.jsxChildAdditions, jsTsSafeMergeWithSemanticArtifacts.summary.jsxKeyedChildAdditions, jsTsSafeMergeWithSemanticArtifacts.summary.jsxKeyedFragmentAdditions] satisfies readonly (number | undefined)[];

void typedJsTsSafeMergeSemanticArtifacts;

const semanticLineage = compilerApi.createSemanticLineageEvent({
  eventKind: 'moved',
  from: { key: 'source#src/example.js#function#run', bodyHash: 'body_old' },
  to: { key: 'source#src/runtime.js#function#run', bodyHash: 'body_old' },
  operationId: 'typed-agent:1',
  heads: ['typed-agent:1'],
  stateVector: { 'typed-agent': 1 },
  evidenceIds: ['evidence_lineage']
});
const typedSemanticLineage: compilerApi.SemanticLineageEvent = semanticLineage;
const semanticLineageMap: compilerApi.SemanticLineageMap = compilerApi.createSemanticLineageMap([typedSemanticLineage]);
const queriedSemanticLineage: readonly compilerApi.SemanticLineageEvent[] = compilerApi.querySemanticLineageEvents(
  semanticLineageMap.events,
  { operationId: 'typed-agent:1' }
);
const semanticAnchor: compilerApi.SemanticAnchor | undefined = compilerApi.createSemanticAnchor('source#src/example.js#function#run');
const inferredSemanticLineage: compilerApi.SemanticLineageInferenceResult = compilerApi.inferSemanticLineageEvents({
  before: { language: 'typescript', sourcePath: 'src/example.ts', sourceText: 'export function run() { return 1; }\n' },
  after: { language: 'typescript', sourcePath: 'src/runtime.ts', sourceText: 'export function run() { return 1; }\n' }
});
const inferredSemanticLineageOptions: compilerApi.InferSemanticLineageEventsOptions = {
  before: { language: 'typescript', sourcePath: 'src/example.ts', sourceText: 'export const value = 1;\n' },
  after: { language: 'typescript', sourcePath: 'src/example.ts', sourceText: 'export const value = 2;\n' },
  minConfidence: 0.5
};

void queriedSemanticLineage; void semanticAnchor; void inferredSemanticLineage; void inferredSemanticLineageOptions;

const semanticMergeAdmission = compilerApi.createSemanticMergeCandidateAdmissionRecord({
  id: 'typed_candidate',
  language: 'javascript',
  sourcePath: 'src/example.js',
  baseHash: 'base_hash',
  targetHash: 'target_hash',
  readiness: 'needs-review',
  changedSemanticRegions: [{
    id: 'typed_region',
    key: 'source#src/example.js#function#run',
    conflictKey: 'source#src/example.js#function#run',
    sourceSpan: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 20 }
  }],
  evidenceIds: ['evidence_example']
});
const typedSemanticMergeAdmission: compilerApi.SemanticMergeCandidateAdmissionRecord = semanticMergeAdmission;
const sortedSemanticMergeAdmissions: readonly compilerApi.SemanticMergeCandidateAdmissionRecord[] =
  compilerApi.sortSemanticMergeCandidateAdmissionRecords([typedSemanticMergeAdmission]);
const semanticMergeAdmissionOverlaps: readonly compilerApi.SemanticMergeCandidateOverlapRecord[] =
  compilerApi.querySemanticMergeCandidateAdmissionOverlaps([typedSemanticMergeAdmission]);
const semanticMergeAdmissionSortKey: number = compilerApi.semanticMergeCandidateReadinessSortKey(typedSemanticMergeAdmission);

void sortedSemanticMergeAdmissions; void semanticMergeAdmissionOverlaps; void semanticMergeAdmissionSortKey;

const conversionArtifacts = compilerApi.createUniversalConversionArtifacts({
  id: 'type-admission-route',
  sourceLanguage: 'javascript',
  target: 'javascript',
  mode: 'preserve-source',
  routeAction: 'preserve-source',
  priority: 'normal',
  readiness: 'ready',
  admissionAction: 'admit',
  missingEvidence: [],
  blockers: [],
  review: [],
  mergeScore: {
    schema: 'frontier.lang.semanticMergeScore.v1',
    version: 1,
    value: 90,
    uncappedValue: 90,
    sortKey: 3290,
    higherIsBetter: true,
    readiness: 'ready',
    risk: 'low',
    action: 'admit',
    components: {},
    penalties: []
  },
  mergeRefs: {
    sources: [{ sourcePath: 'src/type-admission.js', sourceHash: 'type_hash' }],
    semanticOwnershipKeys: ['types.admission'],
    conflictKeys: ['types.admission']
  }
} as unknown as compilerApi.UniversalConversionRoute);
const typedAdmission: compilerApi.UniversalConversionAdmissionRecord = conversionArtifacts.admissionRecords[0];
const typedAdmissionQuery: readonly compilerApi.UniversalConversionRouteArtifact[] =
  compilerApi.queryUniversalConversionArtifacts(conversionArtifacts, {
    admissionBucket: typedAdmission.admissionBucket,
    admissionRecordId: typedAdmission.id,
    risk: typedAdmission.risk
  });

void typedAdmissionQuery;
