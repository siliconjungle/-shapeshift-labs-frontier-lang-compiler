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
  | 'SemanticMergeCandidateProjectionRisks'
  | 'SemanticPatchBundleAdmissionStatuses'
  | 'SemanticHistoryAdmissionStatuses'
  | 'SemanticHistoryConflictReasons'
  | 'SemanticLineageEventKinds'
  | 'SemanticLineageResolutionStatuses'
  | 'SemanticHistoryOverlapKinds'
  | 'SemanticHistoryReviewerStatuses'
  | 'UniversalDialectConstructKinds'
  | 'UniversalDialectProjectionDispositions'
  | 'UniversalRuntimeCapabilityKinds'
  | 'UniversalRuntimeHostProfiles'
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
  | 'createSemanticAnchor'
  | 'createSemanticLineageEvent'
  | 'createSemanticLineageMap'
  | 'createSemanticMergeCandidateAdmissionRecord'
  | 'createSemanticPatchBundleRecord'
  | 'createUniversalCapabilityMatrix'
  | 'createUniversalConversionArtifacts'
  | 'createUniversalConversionPlan'
  | 'createUniversalRuntimeCapabilityMatrix'
  | 'createUniversalDialectRecord'
  | 'createUniversalDialectRegistry'
  | 'createUniversalExternRecord'
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
  | 'querySemanticLineageEvents'
  | 'querySemanticMergeCandidateAdmissionOverlaps'
  | 'querySemanticPatchBundleRecords'
  | 'querySemanticMergeConflictClasses'
  | 'queryUniversalConversionArtifacts'
  | 'queryUniversalConversionPlan'
  | 'queryUniversalRuntimeCapabilityMatrix'
  | 'resolveSemanticLineage'
  | 'resolveSemanticLineageBatch'
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
  | 'semanticMergeCandidateReadinessSortKey'
  | 'semanticMergeConflictRiskScore'
  | 'semanticHistoryRecordsConflict'
  | 'semanticHistoryRecordsOverlap'
  | 'sortSemanticMergeCandidateAdmissionRecords'
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
type RoundtripRouteAuditBuckets = Expect<Equal<keyof compilerApi.NativeRoundtripRoutePathsAudit, 'reversible' | 'preservedSource' | 'stubOnly' | 'adapterProjected'>>;
type RoundtripSemanticEquivalenceClaimStaysFalse = Expect<Equal<compilerApi.NativeRoundtripSemanticEquivalenceAudit['claimed'], false>>;
type RoundtripRouteSourceMapPrecisionIsTyped = compilerApi.NativeRoundtripRouteSourceMapsAudit['output']['precision'];

void (null as unknown as PublicRuntimeExportsMatchDeclarations);
void (null as unknown as RoundtripRouteAuditBuckets);
void (null as unknown as RoundtripSemanticEquivalenceClaimStaysFalse);
void (null as unknown as RoundtripRouteSourceMapPrecisionIsTyped);

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
const semanticLineageMap: compilerApi.SemanticLineageMap = compilerApi.createSemanticLineageMap([
  typedSemanticLineage
]);
const queriedSemanticLineage: readonly compilerApi.SemanticLineageEvent[] = compilerApi.querySemanticLineageEvents(
  semanticLineageMap.events,
  { operationId: 'typed-agent:1' }
);
const semanticAnchor: compilerApi.SemanticAnchor | undefined = compilerApi.createSemanticAnchor('source#src/example.js#function#run');

void queriedSemanticLineage;
void semanticAnchor;

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
const sortedSemanticMergeAdmissions: readonly compilerApi.SemanticMergeCandidateAdmissionRecord[] = compilerApi.sortSemanticMergeCandidateAdmissionRecords([
  typedSemanticMergeAdmission
]);
const semanticMergeAdmissionOverlaps: readonly compilerApi.SemanticMergeCandidateOverlapRecord[] = compilerApi.querySemanticMergeCandidateAdmissionOverlaps([
  typedSemanticMergeAdmission
]);
const semanticMergeAdmissionSortKey: number = compilerApi.semanticMergeCandidateReadinessSortKey(typedSemanticMergeAdmission);

void sortedSemanticMergeAdmissions;
void semanticMergeAdmissionOverlaps;
void semanticMergeAdmissionSortKey;

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

const typedSliceOptions: compilerApi.CreateSemanticSliceOptions = {
  expectedSymbols: ['typedSymbol'],
  expectedRegions: ['typedRegion'],
  expectedSourceHashes: { 'src/typed.ts': 'fnv1a32:typed' },
  expectedSymbolCount: 1,
  expectedRegionCount: 1,
  expectedSourceFileCount: 1
};
const typedSliceTestOptions: compilerApi.TestSemanticSliceOptions = {
  expectedSymbolRefs: ['typedSymbol'],
  expectedRegionRefs: ['typedRegion'],
  expectedSourceHashes: new Map<string, string>([['src/typed.ts', 'fnv1a32:typed']])
};
const typedSelectedSurface: compilerApi.SemanticSliceAdmissionSelectedSurface = {
  entryRefs: ['symbol:typedSymbol'],
  matchedEntryRefs: ['symbol:typedSymbol'],
  unresolvedEntryRefs: [],
  symbols: [{ id: 'typedSymbol', name: 'typedSymbol' }],
  ownershipRegions: [{ id: 'typedRegion', key: 'region:typedRegion' }],
  nativeNodes: [],
  relations: [],
  occurrences: [],
  sourceMapLinks: [],
  sourceSpans: [],
  sourceFiles: [{ path: 'src/typed.ts', sourceHash: 'fnv1a32:typed', spanCount: 1, excerptCount: 0, sourceTextAvailable: false }],
  sourceHashes: [{ path: 'src/typed.ts', sourceHash: 'fnv1a32:typed' }],
  conflictKeys: ['symbol:typedSymbol'],
  ownershipKeys: ['region:typedRegion']
};

void typedAdmissionQuery;
void typedSliceOptions;
void typedSliceTestOptions;
void typedSelectedSurface;
