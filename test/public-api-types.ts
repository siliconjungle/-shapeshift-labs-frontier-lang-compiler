import * as compilerApi from '../src/index.js';
import './public-api-native-fixtures.js';
import './public-api-adapter-fixtures.js';

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
  | 'SemanticMergeConflictClasses'
  | 'SemanticPatchBundleAdmissionStatuses'
  | 'SemanticHistoryAdmissionStatuses'
  | 'SemanticHistoryConflictReasons'
  | 'SemanticHistoryOverlapKinds'
  | 'SemanticHistoryReviewerStatuses'
  | 'UniversalDialectConstructKinds'
  | 'UniversalDialectProjectionDispositions'
  | 'ExternalSemanticIndexFormats'
  | 'attachUniversalDialectRegistry'
  | 'classifyNativeImportReadiness'
  | 'classifyNativeImportRoundtripReadiness'
  | 'compileNativeSource'
  | 'compileFrontierDocument'
  | 'compileFrontierSource'
  | 'createBabelNativeImporterAdapter'
  | 'createEstreeNativeImporterAdapter'
  | 'createLanguageAdapterPackageContract'
  | 'createNativeImportCoverageMatrix'
  | 'createNativeImportResultContract'
  | 'createNativeParserAstFormatMatrix'
  | 'createNativeParserFeatureMatrix'
  | 'createNativeRoundtripEvidence'
  | 'createProjectImportAdmissionRecord'
  | 'createProjectionReadinessMatrix'
  | 'createProjectionTargetLossMatrix'
  | 'createSemanticHistoryRecord'
  | 'createSemanticPatchBundleRecord'
  | 'createUniversalCapabilityMatrix'
  | 'createUniversalConversionArtifacts'
  | 'createUniversalConversionPlan'
  | 'createUniversalDialectRecord'
  | 'createUniversalDialectRegistry'
  | 'createUniversalExternRecord'
  | 'createNativeSourcePreservation'
  | 'createCSharpRoslynNativeImporterAdapter'
  | 'createClangAstNativeImporterAdapter'
  | 'createGoAstNativeImporterAdapter'
  | 'createJavaAstNativeImporterAdapter'
  | 'createKotlinPsiNativeImporterAdapter'
  | 'createPythonAstNativeImporterAdapter'
  | 'createRustSynNativeImporterAdapter'
  | 'createSwiftSyntaxNativeImporterAdapter'
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
  | 'queryLanguageAdapterPackageContracts'
  | 'queryNativeParserFeatureMatrix'
  | 'queryProjectionReadinessMatrix'
  | 'querySemanticHistoryRecordOverlaps'
  | 'querySemanticPatchBundleRecords'
  | 'querySemanticMergeConflictClasses'
  | 'queryUniversalConversionArtifacts'
  | 'queryUniversalConversionPlan'
  | 'importExternalSemanticIndex'
  | 'importNativeProject'
  | 'importNativeSource'
  | 'normalizeCompileTarget'
  | 'projectFrontierAst'
  | 'projectNativeImportToSource'
  | 'readSemanticSliceJson'
  | 'readUniversalAstJson'
  | 'renderTargetAst'
  | 'renderTargetAstWithSourceMap'
  | 'resolveCapabilityAdapters'
  | 'runNativeImporterAdapter'
  | 'runNativeTargetProjectionAdapter'
  | 'semanticMergeConflictRiskScore'
  | 'semanticHistoryRecordsConflict'
  | 'semanticHistoryRecordsOverlap'
  | 'sortSemanticMergeCandidatesByConflictRisk'
  | 'summarizeLanguageAdapterPackageContracts'
  | 'summarizeSemanticMergeConflicts'
  | 'summarizeNativeImportFeatureEvidence'
  | 'summarizeNativeImportLosses'
  | 'summarizeUniversalDialectRegistry'
  | 'testSemanticSlice'
  | 'writeSemanticSliceJson'
  | 'writeUniversalAstJson';

type PublicRuntimeExportsMatchDeclarations = Expect<Equal<keyof typeof compilerApi, ExpectedPublicRuntimeExport>>;

void (null as unknown as PublicRuntimeExportsMatchDeclarations);

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
const queriedSemanticPatchBundles: readonly compilerApi.SemanticPatchBundleRecord[] = compilerApi.querySemanticPatchBundleRecords(
  [typedSemanticPatchBundle],
  { regionKey: 'source#src/example.js#function#run', evidenceId: 'evidence_example', admissionStatus: 'queued' }
);

void queriedSemanticPatchBundles;

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
