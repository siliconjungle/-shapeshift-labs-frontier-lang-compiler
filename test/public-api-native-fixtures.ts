import { FrontierCompileTargets, NativeImportLanguageProfiles, NativeImportLossKinds, NativeImportFeatureEvidencePolicies, NativeImportReadinessBySeverity, NativeImportRegionTaxonomyKinds, NativeImportRoundtripReadinessStatuses, NativeImportTaxonomyKinds, NativeParserAstFormats, NativeParserAstFormatProfiles, NativeParserFeatureCategories, NativeParserFeatureCoverageStatuses, ProjectionTargetLossClasses, queryNativeParserFeatureMatrix, classifyNativeImportReadiness, classifyNativeImportRoundtripReadiness, compileNativeSource, compileFrontierDocument, compileFrontierSource, createBabelNativeImporterAdapter, createEstreeNativeImporterAdapter, createNativeImportCoverageMatrix, createNativeImportResultContract, createNativeParserAstFormatMatrix, createNativeParserFeatureMatrix, createNativeRoundtripEvidence, createProjectionTargetLossMatrix, createUniversalCapabilityMatrix, createNativeSourcePreservation, createCSharpRoslynNativeImporterAdapter, createClangAstNativeImporterAdapter, createGoAstNativeImporterAdapter, createJavaAstNativeImporterAdapter, createKotlinPsiNativeImporterAdapter, createPythonAstNativeImporterAdapter, createRustSynNativeImporterAdapter, createSwiftSyntaxNativeImporterAdapter, createSemanticImportSidecar, createSemanticSlice, createTreeSitterNativeImporterAdapter, createTypeScriptCompilerNativeImporterAdapter, createUniversalAstFromDocument, diffNativeSourceImports, diffNativeSources, emitForTarget, emitForTargetWithSourceMap, ExternalSemanticIndexFormats, getNativeImportFeatureEvidencePolicy, getNativeParserAstFormatProfile, importExternalSemanticIndex, importNativeProject, importNativeSource, normalizeCompileTarget, projectFrontierAst, projectNativeImportToSource, readSemanticSliceJson, readUniversalAstJson, renderTargetAst, renderTargetAstWithSourceMap, resolveCapabilityAdapters, runNativeImporterAdapter, runNativeTargetProjectionAdapter, summarizeNativeImportFeatureEvidence, summarizeNativeImportLosses, testSemanticSlice, writeSemanticSliceJson, writeUniversalAstJson } from '../src/index.js';
import { createProjectImportAdmissionRecord, createProjectionReadinessMatrix, createSemanticSliceAdmissionRecord, createUniversalConversionArtifacts, createUniversalConversionPlan, createUniversalDialectRegistry, queryProjectionReadinessMatrix, queryUniversalConversionArtifacts, queryUniversalConversionPlan } from '../src/index.js';
import type { CapabilityResolution, CompileNativeSourceOptions, CreateNativeSourcePreservationOptions, ExternalSemanticIndexFormat, ExternalSemanticIndexImportResult, FrontierCompileOptions, FrontierCompileResult, FrontierCompileTarget, FrontierTargetAst, FrontierTargetDocumentSourceMapResult, FrontierTargetSourceMapResult, NativeImportContractSource, NativeImportFeatureEvidenceIssue, NativeImportFeatureEvidencePolicy, NativeImportFeatureEvidenceRisk, NativeImportFeatureEvidenceSummary, NativeImportCoverageMatrix, NativeImportCoverageMatrixOptions, NativeImportKnownLossKind, NativeImportLanguageProfile, NativeImportLossSummary, NativeParserAstFormatMatrix, NativeParserAstFormatMatrixOptions, NativeParserAstFormatProfile, NativeParserFeatureCategory, NativeParserFeatureCoverageStatus, NativeParserFeatureMatrix, NativeParserFeatureMatrixOptions, NativeParserFeatureMatrixQueryResult, NativeImportReadinessClassification, NativeImportRegionTaxonomyKind, NativeImportResultContract, NativeImportRoundtripReadinessClassification, NativeImportRoundtripReadinessStatus, NativeRoundtripEvidenceMetadata, NativeRoundtripEvidenceRecord, NativeRoundtripSourceMapEvidence, NativeImportTaxonomyKind, NativeImporterAdapter, NativeImporterAdapterCoverageAggregate, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterDiagnostic, NativeImporterAdapterImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionResult, NativeProjectImportResult, NativeSourceChangeSet, NativeSourceChangeProjectionEndpoint, NativeSourceChangeProjectionMetadata, NativeSourceChangeProjectionSourceMapLink, NativeSourceChangeProjectionSummary, NativeSourceChangeSymbol, NativeSourceCompileOutputMode, NativeSourceCompileResult, NativeSourceImportResult, NativeSourcePreservation, NativeSourceProjectionResult, ProjectNativeImportToSourceOptions, ProjectionTargetLossClass, ProjectionTargetLossMatrix, ProjectionTargetLossMatrixOptions, CreateSemanticSliceOptions, SemanticSlice, SemanticSliceAdmissionRecord, SemanticSliceInput, SemanticSliceSourceFile, SemanticSliceSourceMapLink, SemanticSliceTestResult, TestSemanticSliceOptions, UniversalCapabilityMatrix, UniversalCapabilityMatrixOptions, ClangAstNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions, JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, SemanticImportSidecar, SemanticImportSidecarParadigmSemanticsSummary, SemanticImportSidecarProofSpecSummary, SemanticImportSidecarSourcePreservationRecord, SemanticImportRegionTaxonomySummary } from '../src/index.js';
import type { NativeProjectAdmissionMergeScore, NativeProjectImportAdmission, ProjectionReadinessMatrix, ProjectionReadinessMatrixQueryResult, UniversalConversionArtifacts, UniversalConversionPlan, UniversalConversionPlanQueryResult, UniversalConversionRoute, UniversalConversionRouteArtifact, UniversalDialectRegistry } from '../src/index.js';

const target: FrontierCompileTarget = normalizeCompileTarget('ts');
const targets: readonly FrontierCompileTarget[] = FrontierCompileTargets;
const taxonomyKind: NativeImportTaxonomyKind = NativeImportTaxonomyKinds[0] ?? 'sourcePreservation';
const lossKind: NativeImportKnownLossKind = NativeImportLossKinds[0] ?? 'sourcePreservation';
const featureEvidenceRisk: NativeImportFeatureEvidenceRisk = 'high';
const featureEvidencePolicy: NativeImportFeatureEvidencePolicy | undefined = getNativeImportFeatureEvidencePolicy('preprocessor');
const featureEvidencePolicies: Readonly<Record<string, NativeImportFeatureEvidencePolicy>> = NativeImportFeatureEvidencePolicies;
const regionKind: NativeImportRegionTaxonomyKind = NativeImportRegionTaxonomyKinds[0] ?? 'symbol';
const routeRegionKind: NativeImportRegionTaxonomyKind = 'route';
const roundtripStatus: NativeImportRoundtripReadinessStatus = NativeImportRoundtripReadinessStatuses[0] ?? 'source-preserved';
const projectionLossClass: ProjectionTargetLossClass = ProjectionTargetLossClasses[0] ?? 'exactSourceProjection';
const languageProfiles: readonly NativeImportLanguageProfile[] = NativeImportLanguageProfiles;
const parserAstFormats: readonly string[] = NativeParserAstFormats;
const parserAstFormatProfiles: readonly NativeParserAstFormatProfile[] = NativeParserAstFormatProfiles;
const pythonAstFormatProfile: NativeParserAstFormatProfile | undefined = getNativeParserAstFormatProfile('python_ast');
const parserFeatureCategories: readonly NativeParserFeatureCategory[] = NativeParserFeatureCategories;
const parserFeatureStatuses: readonly NativeParserFeatureCoverageStatus[] = NativeParserFeatureCoverageStatuses;
const externalSemanticFormat: ExternalSemanticIndexFormat = ExternalSemanticIndexFormats[0] ?? 'scip';

const source = `
module ApiTypes @id("mod_api_types")
type TodoInput @id("type_todo_input") {
  title: Text
}
entity Todo @id("ent_todo") {
  title @id("field_title"): Text
}
action addTodo @id("action_add") {
  input TodoInput
  writes field_title
  returns Patch
}
`;

const compileOptions: FrontierCompileOptions = { target, emitOnError: false };
const compiled: FrontierCompileResult = compileFrontierSource(source, compileOptions);
const compiledAgain: FrontierCompileResult = compileFrontierDocument(compiled.document, { target: 'javascript' });
const emitted: string = emitForTarget(compiled.document, 'js');
const mappedEmit: FrontierTargetDocumentSourceMapResult = emitForTargetWithSourceMap(compiled.document, 'js', { targetPath: 'api-types.js' });
const projectedAst: FrontierTargetAst = projectFrontierAst(compiled.document, 'python');
const rendered: string = renderTargetAst(projectedAst, 'python');
const mappedRender: FrontierTargetSourceMapResult = renderTargetAstWithSourceMap(projectedAst, 'python', { targetPath: 'api-types.py' });
const capabilityResolutions: readonly CapabilityResolution[] = resolveCapabilityAdapters(compiled.document, target);

const preservationOptions: CreateNativeSourcePreservationOptions = {
  language: 'javascript',
  sourcePath: 'src/api-types.js',
  sourceText: '// kept\nexport function apiTypes() { return true; }\n',
  includeDirectives: true
};
const preservation: NativeSourcePreservation = createNativeSourcePreservation(preservationOptions);
const imported: NativeSourceImportResult = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/api-types.js',
  sourceText: preservation.sourceText,
  sourcePreservation: preservation
});
const externalSemanticImport: ExternalSemanticIndexImportResult = importExternalSemanticIndex({
  format: externalSemanticFormat,
  language: 'javascript',
  payload: {
    kind: 'frontier.lang.semanticIndex',
    version: 1,
    id: 'index_api_types_external',
    documents: [{ id: 'doc_api_types_external', path: 'src/api-types.js', language: 'javascript' }],
    symbols: [{ id: 'symbol:apiTypes', scheme: 'frontier', name: 'apiTypes', kind: 'function', language: 'javascript' }],
    occurrences: [{ id: 'occ_api_types_external', documentId: 'doc_api_types_external', symbolId: 'symbol:apiTypes', role: 'definition', span: { path: 'src/api-types.js', startLine: 1, startColumn: 1 } }],
    relations: [],
    facts: []
  }
});
externalSemanticImport.semanticIndex satisfies typeof externalSemanticImport.universalAst.semanticIndex;
externalSemanticImport.summary.readiness satisfies ExternalSemanticIndexImportResult['readiness']['readiness'];

const summary: NativeImportLossSummary = summarizeNativeImportLosses(imported.losses, { evidence: imported.evidence });
const parserFeatureMatrixOptions: NativeParserFeatureMatrixOptions = {
  imports: [imported],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
};
const parserFeatureMatrix: NativeParserFeatureMatrix = createNativeParserFeatureMatrix(parserFeatureMatrixOptions);
const parserFeatureQuery: NativeParserFeatureMatrixQueryResult = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
  language: 'javascript',
  parser: imported.nativeAst?.parser ?? 'javascript.lightweight-declaration-scan',
  requiredFeatures: parserFeatureCategories.slice(0, 2)
});
parserFeatureStatuses.includes(parserFeatureQuery.row?.features.syntax.status ?? 'missing');
parserFeatureQuery.merge.mergeReady satisfies boolean;
const featureEvidenceSummary: NativeImportFeatureEvidenceSummary = summarizeNativeImportFeatureEvidence(imported.losses, {
  evidence: imported.evidence
});
const featureEvidenceIssue: NativeImportFeatureEvidenceIssue | undefined = featureEvidenceSummary.issues[0];
const readiness: NativeImportReadinessClassification = classifyNativeImportReadiness(imported.losses, {
  evidence: imported.evidence
});
const roundtripReadiness: NativeImportRoundtripReadinessClassification = classifyNativeImportRoundtripReadiness(imported);
const readinessBySeverity = NativeImportReadinessBySeverity[summary.highestSeverity];

const projectionOptions: ProjectNativeImportToSourceOptions = { preferPreservedSource: true };
const projection: NativeSourceProjectionResult = projectNativeImportToSource(imported, projectionOptions);
const roundtripEvidence: NativeRoundtripEvidenceRecord = createNativeRoundtripEvidence(imported, { projection });
const roundtripEvidenceMetadata: NativeRoundtripEvidenceMetadata = roundtripEvidence.metadata.roundtripEvidence;
const roundtripSourceMapEvidence: NativeRoundtripSourceMapEvidence = roundtripEvidenceMetadata.universalAst.sourceMaps;
roundtripSourceMapEvidence.precision satisfies string;
const targetProjectionAdapter: NativeTargetProjectionAdapter = {
  id: 'fixture-target-projection-api-types',
  sourceLanguage: 'javascript',
  target: 'rust',
  coverage: {
    readiness: 'needs-review',
    handledLossKinds: ['dynamicRuntime']
  },
  project(input: NativeTargetProjectionAdapterInput): NativeTargetProjectionAdapterResult {
    return {
      output: `// ${input.sourceLanguage} to ${input.target}\n`,
      readiness: 'needs-review'
    };
  }
};
const nativeCompileOptions: CompileNativeSourceOptions = {
  target: 'rust',
  emitOnBlocked: true,
  emitSourceMap: true,
  sourceMapId: 'api-types-native-compile-map',
  targetPath: 'dist/api-types.rs',
  targetHash: 'fnv1a32:api-types-target',
  targetAdapters: [targetProjectionAdapter],
  targetAdapter: targetProjectionAdapter.id,
  targetAdapterOptions: { mode: 'api-types' },
  targetAdapterMetadata: { fixture: true }
};
const nativeCompiled: NativeSourceCompileResult = compileNativeSource(imported, nativeCompileOptions);
const nativeCompileMode: NativeSourceCompileOutputMode = nativeCompiled.outputMode;
const nativeCompileSourceMap: NativeSourceCompileResult['sourceMap'] = nativeCompiled.sourceMap;
const nativeCompileSourceMaps: NativeSourceCompileResult['sourceMaps'] = nativeCompiled.sourceMaps;
const targetProjection: NativeTargetProjectionResult | undefined = nativeCompiled.targetProjection;
async function projectAdmissionTypes(): Promise<void> {
  const projectResult: NativeProjectImportResult = await importNativeProject({
    id: 'api-types-project-admission',
    sources: [{
      language: 'javascript',
      sourcePath: 'src/api-types-project.js',
      sourceText: 'export const apiTypesProject = true;\n'
    }]
  });
  const projectAdmission: NativeProjectImportAdmission | undefined = projectResult.metadata?.projectAdmission;
  const recomputedAdmission = createProjectImportAdmissionRecord(projectResult);
  const mergeScore: NativeProjectAdmissionMergeScore | undefined = projectAdmission?.mergeScore;
  recomputedAdmission.action satisfies NativeProjectImportAdmission['action'];
  recomputedAdmission.mergeScore?.components.targetProjectionCoverage.score satisfies number | undefined;
  mergeScore?.sortKey satisfies number | undefined;
  projectAdmission?.languages.rows[0]?.readiness satisfies NativeProjectImportAdmission['readiness'] | undefined;
}
void projectAdmissionTypes;
const dialectRegistryTypes: UniversalDialectRegistry = createUniversalDialectRegistry({
  language: 'javascript',
  dialects: [{ dialect: 'node.runtime', constructKind: 'runtime', name: 'process.env' }]
});
dialectRegistryTypes.summary.projectionReadiness satisfies UniversalDialectRegistry['summary']['projectionReadiness'];
const projectionReadinessTypes: ProjectionReadinessMatrix = createProjectionReadinessMatrix({
  imports: [imported],
  targets: ['javascript']
});
const projectionReadinessQueryTypes: ProjectionReadinessMatrixQueryResult = queryProjectionReadinessMatrix(projectionReadinessTypes, {
  sourceLanguage: 'javascript',
  target: 'javascript'
});
projectionReadinessQueryTypes.status satisfies ProjectionReadinessMatrixQueryResult['status'];
const conversionPlanTypes: UniversalConversionPlan = createUniversalConversionPlan({
  imports: [imported],
  targets: ['javascript']
});
const conversionPlanQueryTypes: UniversalConversionPlanQueryResult = queryUniversalConversionPlan(conversionPlanTypes, {
  sourceLanguage: 'javascript',
  target: 'javascript'
});
const conversionRouteTypes: UniversalConversionRoute | undefined = conversionPlanQueryTypes.bestRoute;
conversionRouteTypes?.mergeScore.schema satisfies 'frontier.lang.semanticMergeScore.v1' | undefined;
conversionRouteTypes?.autoMergeClaim satisfies false | undefined;
conversionRouteTypes?.mergeRefs.historyIds satisfies readonly string[] | undefined;
const conversionArtifactsTypes: UniversalConversionArtifacts = createUniversalConversionArtifacts(conversionPlanTypes);
const conversionArtifactTypes: UniversalConversionRouteArtifact | undefined = queryUniversalConversionArtifacts(conversionArtifactsTypes, {
  target: 'javascript'
})[0];
conversionArtifactsTypes.summary.autoMergeClaims satisfies 0;
conversionArtifactTypes?.history.kind satisfies 'frontier.lang.semanticHistoryRecord' | undefined;
conversionArtifactTypes?.materialization.status satisfies string | undefined;
conversionArtifactTypes?.patchBundle.admission.autoMergeClaim satisfies false | undefined;
const directTargetProjection: NativeTargetProjectionResult = runNativeTargetProjectionAdapter(targetProjectionAdapter, {
  importResult: imported,
  sourceProjection: projection,
  sourceLanguage: 'javascript',
  target: 'rust',
  options: {},
  metadata: {}
});
const sidecar: SemanticImportSidecar = createSemanticImportSidecar(imported, { targetPath: 'dist/api-types.js' });
const regionTaxonomy: SemanticImportRegionTaxonomySummary = sidecar.regionTaxonomy;
const proofSpecSummary: SemanticImportSidecarProofSpecSummary = sidecar.proofSpec;
const paradigmSummary: SemanticImportSidecarParadigmSemanticsSummary = sidecar.paradigmSemantics;
const sourcePreservationRow: SemanticImportSidecarSourcePreservationRecord | undefined = sidecar.sourcePreservation.records[0];
const sourcePreservationCount: number = sidecar.summary.sourcePreservationRecords + (sourcePreservationRow?.lossIds.length ?? 0) + proofSpecSummary.obligations + paradigmSummary.loweringRecords;
void sourcePreservationCount;
const sliceInput: SemanticSliceInput = imported;
const sliceOptions: CreateSemanticSliceOptions = {
  entryRefs: ['symbol:apiTypes'],
  includeDependencies: true,
  focusedCommands: ['npm test -- api-types'],
  fixtureHints: ['api type fixture']
};
const semanticSlice: SemanticSlice = createSemanticSlice(sliceInput, sliceOptions);
const semanticSliceLink: SemanticSliceSourceMapLink | undefined = semanticSlice.sourceMapLinks[0];
const semanticSliceFile: SemanticSliceSourceFile | undefined = semanticSlice.sourceFiles[0];
const semanticSliceTestOptions: TestSemanticSliceOptions = {
  currentSources: {
    'src/api-types.js': preservation.sourceText ?? ''
  }
};
const semanticSliceTest: SemanticSliceTestResult = testSemanticSlice(semanticSlice, semanticSliceTestOptions);
const semanticSliceAdmission: SemanticSliceAdmissionRecord = createSemanticSliceAdmissionRecord(semanticSlice, {
  testResult: semanticSliceTest
});
const semanticSliceJson: string = writeSemanticSliceJson(semanticSlice);
const semanticSliceAgain: SemanticSlice = readSemanticSliceJson(semanticSliceJson);
semanticSlice.mergeAdmission.autoMergeClaim satisfies false;
semanticSliceTest.status satisfies SemanticSliceTestResult['status'];
semanticSliceAdmission.autoMergeClaim satisfies false;
semanticSliceAdmission.mergeScore.schema satisfies 'frontier.lang.semanticMergeScore.v1';
void semanticSliceLink;
void semanticSliceFile;
void semanticSliceAgain;
const contract: NativeImportResultContract = createNativeImportResultContract(imported, { sidecarId: sidecar.id });
const contractSource: NativeImportContractSource = contract.sources[0] ?? {
  id: 'missing',
  sourceMapIds: [],
  sourceMapMappings: 0,
  symbolCount: 0,
  lossCount: 0,
  evidenceCount: 0
};

const changedSource: NativeSourceChangeSet = diffNativeSources({
  language: 'javascript',
  sourcePath: 'src/api-types.js',
  beforeSourceText: preservation.sourceText,
  afterSourceText: '// kept\nexport function apiTypes() { return false; }\n'
});
const changedSourceAgain: NativeSourceChangeSet = diffNativeSourceImports({
  before: imported,
  after: changedSource.after
});
const changedSymbol: NativeSourceChangeSymbol | undefined = changedSource.changedSymbols[0];
const changedRegionProjectionSummary: NativeSourceChangeProjectionSummary | undefined = changedSource.metadata?.changedRegionProjectionSummary;
const changedRegionProjection: NativeSourceChangeProjectionMetadata | undefined = changedSource.changedRegions[0]?.metadata?.changedRegionProjection;
const changedRegionProjectionEndpoint: NativeSourceChangeProjectionEndpoint | undefined = changedRegionProjection?.after;
const changedRegionProjectionLink: NativeSourceChangeProjectionSourceMapLink | undefined = changedRegionProjection?.sourceMapLinks[0];
if (changedRegionProjection) changedRegionProjection.autoMergeClaim satisfies false;
if (changedRegionProjectionEndpoint) changedRegionProjectionEndpoint.exactSourceAvailable satisfies boolean;
if (changedRegionProjectionLink) changedRegionProjectionLink.precision satisfies string | undefined;
if (changedRegionProjectionSummary) changedRegionProjectionSummary.autoMergeClaims satisfies number;

void routeRegionKind;
void changedSourceAgain;
void changedSymbol;
