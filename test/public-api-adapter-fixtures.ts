import { FrontierCompileTargets, NativeImportLanguageProfiles, NativeImportLossKinds, NativeImportFeatureEvidencePolicies, NativeImportReadinessBySeverity, NativeImportRegionTaxonomyKinds, NativeImportRoundtripReadinessStatuses, NativeImportTaxonomyKinds, NativeParserAstFormats, NativeParserAstFormatProfiles, NativeParserFeatureCategories, NativeParserFeatureCoverageStatuses, ProjectionTargetLossClasses, queryNativeParserFeatureMatrix, classifyNativeImportReadiness, classifyNativeImportRoundtripReadiness, compileNativeSource, compileFrontierDocument, compileFrontierSource, createBabelNativeImporterAdapter, createEstreeNativeImporterAdapter, createNativeImportCoverageMatrix, createNativeImportResultContract, createNativeParserAstFormatMatrix, createNativeParserFeatureMatrix, createProjectionTargetLossMatrix, createUniversalCapabilityMatrix, createNativeSourcePreservation, createCSharpRoslynNativeImporterAdapter, createClangAstNativeImporterAdapter, createGoAstNativeImporterAdapter, createJavaAstNativeImporterAdapter, createKotlinPsiNativeImporterAdapter, createPythonAstNativeImporterAdapter, createRustSynNativeImporterAdapter, createSwiftSyntaxNativeImporterAdapter, createSemanticImportSidecar, createSemanticSlice, createTreeSitterNativeImporterAdapter, createTypeScriptCompilerNativeImporterAdapter, createUniversalAstFromDocument, diffNativeSourceImports, diffNativeSources, emitForTarget, emitForTargetWithSourceMap, ExternalSemanticIndexFormats, getNativeImportFeatureEvidencePolicy, getNativeParserAstFormatProfile, importExternalSemanticIndex, importNativeProject, importNativeSource, normalizeCompileTarget, projectFrontierAst, projectNativeImportToSource, readSemanticSliceJson, readUniversalAstJson, renderTargetAst, renderTargetAstWithSourceMap, resolveCapabilityAdapters, runNativeImporterAdapter, runNativeTargetProjectionAdapter, summarizeNativeImportFeatureEvidence, summarizeNativeImportLosses, testSemanticSlice, writeSemanticSliceJson, writeUniversalAstJson } from '../src/index.js';
import { LanguageAdapterPackageContracts, createLanguageAdapterPackageContract, getLanguageAdapterPackageContract, queryLanguageAdapterPackageContracts, summarizeLanguageAdapterPackageContracts } from '../src/index.js';
import type { CapabilityResolution, CompileNativeSourceOptions, CreateNativeSourcePreservationOptions, ExternalSemanticIndexFormat, ExternalSemanticIndexImportResult, FrontierCompileOptions, FrontierCompileResult, FrontierCompileTarget, FrontierTargetAst, FrontierTargetDocumentSourceMapResult, FrontierTargetSourceMapResult, NativeImportContractSource, NativeImportFeatureEvidenceIssue, NativeImportFeatureEvidencePolicy, NativeImportFeatureEvidenceRisk, NativeImportFeatureEvidenceSummary, NativeImportCoverageMatrix, NativeImportCoverageMatrixOptions, NativeImportKnownLossKind, NativeImportLanguageProfile, NativeImportLossSummary, NativeParserAstFormatMatrix, NativeParserAstFormatMatrixOptions, NativeParserAstFormatProfile, NativeParserFeatureCategory, NativeParserFeatureCoverageStatus, NativeParserFeatureMatrix, NativeParserFeatureMatrixOptions, NativeParserFeatureMatrixQueryResult, NativeImportReadinessClassification, NativeImportRegionTaxonomyKind, NativeImportResultContract, NativeImportRoundtripReadinessClassification, NativeImportRoundtripReadinessStatus, NativeImportTaxonomyKind, NativeImporterAdapter, NativeImporterAdapterCoverageAggregate, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterDiagnostic, NativeImporterAdapterImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionResult, NativeProjectImportResult, NativeSourceChangeSet, NativeSourceChangeProjectionEndpoint, NativeSourceChangeProjectionMetadata, NativeSourceChangeProjectionSourceMapLink, NativeSourceChangeProjectionSummary, NativeSourceChangeSymbol, NativeSourceCompileOutputMode, NativeSourceCompileResult, NativeSourceImportResult, NativeSourcePreservation, NativeSourceProjectionResult, ProjectNativeImportToSourceOptions, ProjectionTargetLossClass, ProjectionTargetLossMatrix, ProjectionTargetLossMatrixOptions, CreateSemanticSliceOptions, SemanticSlice, SemanticSliceInput, SemanticSliceSourceFile, SemanticSliceSourceMapLink, SemanticSliceTestResult, TestSemanticSliceOptions, UniversalCapabilityMatrix, UniversalCapabilityMatrixOptions, ClangAstNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions, JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, SemanticImportSidecar, SemanticImportSidecarParadigmSemanticsSummary, SemanticImportSidecarProofSpecSummary, SemanticImportSidecarSourcePreservationRecord, SemanticImportRegionTaxonomySummary } from '../src/index.js';
import type { LanguageAdapterPackageContract, LanguageAdapterPackageContractQuery, LanguageAdapterPackageContractSummary, LanguageAdapterPackageReleaseReadinessStatus } from '../src/index.js';

const adapterFixtureSource = `
module AdapterApiTypes @id("mod_adapter_api_types")
entity AdapterTodo @id("ent_adapter_todo") {
  title @id("field_adapter_title"): Text
}
`;

const compiled: FrontierCompileResult = compileFrontierSource(adapterFixtureSource, { target: 'typescript' });
const imported: NativeSourceImportResult = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/adapter-api-types.js',
  sourceText: 'export function adapterApiTypes() {}\n'
});
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

const estreeAdapter: NativeImporterAdapter = createEstreeNativeImporterAdapter();
const babelAdapter: NativeImporterAdapter = createBabelNativeImporterAdapter();
const tsAdapter: NativeImporterAdapter = createTypeScriptCompilerNativeImporterAdapter();
const pythonAstAdapter: NativeImporterAdapter = createPythonAstNativeImporterAdapter();
const rustSynAdapter: NativeImporterAdapter = createRustSynNativeImporterAdapter();
const clangAstAdapter: NativeImporterAdapter = createClangAstNativeImporterAdapter();
const goAstAdapter: NativeImporterAdapter = createGoAstNativeImporterAdapter();
const javaAstAdapter: NativeImporterAdapter = createJavaAstNativeImporterAdapter();
const kotlinPsiAdapter: NativeImporterAdapter = createKotlinPsiNativeImporterAdapter();
const csharpRoslynAdapter: NativeImporterAdapter = createCSharpRoslynNativeImporterAdapter();
const swiftSyntaxAdapter: NativeImporterAdapter = createSwiftSyntaxNativeImporterAdapter();
const treeAdapter: NativeImporterAdapter = createTreeSitterNativeImporterAdapter({ language: 'javascript' });
const adapterPackageContracts: readonly LanguageAdapterPackageContract[] = LanguageAdapterPackageContracts;
const adapterPackageQuery: LanguageAdapterPackageContractQuery = { language: 'java', packageClass: 'platform-importer' };
const adapterPackageContract: LanguageAdapterPackageContract | undefined = getLanguageAdapterPackageContract('@shapeshift-labs/frontier-lang-typescript');
const queriedAdapterPackageContracts: readonly LanguageAdapterPackageContract[] = queryLanguageAdapterPackageContracts(adapterPackageQuery);
const adapterPackageSummary: LanguageAdapterPackageContractSummary = summarizeLanguageAdapterPackageContracts(adapterPackageContracts);
const customAdapterPackageContract: LanguageAdapterPackageContract = createLanguageAdapterPackageContract({
  packageName: '@fixture/frontier-lang-scala',
  packageVersion: '0.0.0',
  packageClass: 'platform-importer',
  language: 'scala',
  parser: 'scalameta',
  targets: [],
  releaseReady: false
});
const packageReleaseReadiness: LanguageAdapterPackageReleaseReadinessStatus = adapterPackageContract?.releaseReadiness.status ?? 'needs-review';
customAdapterPackageContract.runtime.importsAdapterPackage satisfies false;
adapterPackageSummary.runtimeImportsAdapterPackages satisfies number;
queriedAdapterPackageContracts[0]?.semanticIndex.supported satisfies boolean | undefined;
adapterPackageContract?.sourceParser.supportedLanguages satisfies readonly string[] | undefined;
adapterPackageContract?.sourceParser.caveats satisfies readonly string[] | undefined;
adapterPackageContract?.targetProjection.caveats satisfies readonly string[] | undefined;
adapterPackageContract?.releaseReadiness.signals satisfies readonly string[] | undefined;

const adapterDiagnostic: NativeImporterAdapterDiagnostic = {
  severity: 'warning',
  code: 'fixture.warning',
  kind: 'opaqueNative',
  message: 'fixture diagnostic'
};
const parseResult: NativeImporterAdapterParseResult = {
  rootId: 'root',
  nodes: {
    root: { id: 'root', kind: 'Program', languageKind: 'ESTree.Program' }
  },
  diagnostics: [adapterDiagnostic]
};
const parseInputHandler = (input: NativeImporterAdapterParseInput): NativeImporterAdapterParseResult => ({
  ...parseResult,
  sourcePath: input.sourcePath,
  sourceHash: input.sourceHash
});
const fixtureAdapter: NativeImporterAdapter = {
  id: 'fixture-public-api-types',
  language: 'javascript',
  parser: 'estree',
  parse: parseInputHandler
};
const adapterImport: Promise<NativeImporterAdapterImportResult> = runNativeImporterAdapter(fixtureAdapter, {
  sourcePath: 'src/adapter-api-types.js',
  sourceText: 'export function adapterApiTypes() {}\n'
});

const coverageOptions: NativeImportCoverageMatrixOptions = {
  generatedAt: 1,
  imports: [imported],
  adapters: [estreeAdapter, babelAdapter, tsAdapter, treeAdapter]
};
const coverage: NativeImportCoverageMatrix = createNativeImportCoverageMatrix(coverageOptions);
const adapterCoverageAggregate: NativeImporterAdapterCoverageAggregate = coverage.summary.adapterCoverage;
const adapterCapabilityEvidence: Promise<NativeImporterAdapterCoverageCapabilityEvidence | undefined> = adapterImport
  .then((result) => result.adapter.coverage.capabilityEvidence);
const parserFormatOptions: NativeParserAstFormatMatrixOptions = {
  generatedAt: 4,
  imports: [imported],
  adapters: [estreeAdapter, babelAdapter, tsAdapter, pythonAstAdapter, rustSynAdapter, clangAstAdapter, goAstAdapter, javaAstAdapter, kotlinPsiAdapter, csharpRoslynAdapter, swiftSyntaxAdapter, treeAdapter]
};
const parserFormatMatrix: NativeParserAstFormatMatrix = createNativeParserAstFormatMatrix(parserFormatOptions);
const rustSynAdapterOptions: RustSynNativeImporterAdapterOptions = {
  rustEdition: '2021',
  ast: { kind: 'File', items: [] }
};
const clangAstAdapterOptions: ClangAstNativeImporterAdapterOptions = {
  cStandard: 'c11',
  compileFlags: ['-std=c11'],
  preprocessorRecords: [{ kind: 'MacroDefinitionRecord', name: 'FEATURE' }],
  includeGraph: { hash: 'fixture' },
  ast: { kind: 'TranslationUnitDecl', inner: [] }
};
const goAstAdapterOptions: GoAstNativeImporterAdapterOptions = {
  goVersion: '1.22',
  packageName: 'todo',
  buildTags: ['frontier'],
  typeEvidence: { hash: 'fixture-go-types' },
  ast: { kind: 'File', Name: { kind: 'Ident', Name: 'todo' }, Decls: [] }
};
const javaAstAdapterOptions: JavaAstNativeImporterAdapterOptions = {
  javaVersion: '21',
  sourceLevel: '21',
  classPath: ['target/classes'],
  modulePath: ['mods'],
  bindingEvidence: { hash: 'fixture-java-bindings' },
  annotationProcessing: { enabled: false, processors: [] },
  ast: { kind: 'CompilationUnit', types: [] }
};
const kotlinPsiAdapterOptions: KotlinPsiNativeImporterAdapterOptions = {
  kotlinVersion: '2.1',
  languageVersion: '2.1',
  apiVersion: '2.1',
  analysisApiEvidence: { hash: 'fixture-kotlin-analysis-api' },
  firEvidence: { hash: 'fixture-kotlin-fir' },
  compilerPluginEvidence: { hash: 'fixture-kotlin-plugins', plugins: ['kotlinx.serialization'] },
  kspEvidence: { hash: 'fixture-kotlin-ksp' },
  kaptEvidence: { hash: 'fixture-kotlin-kapt' },
  multiplatformEvidence: { hash: 'fixture-kotlin-mpp', targetPlatform: 'jvm' },
  buildVariantEvidence: { hash: 'fixture-kotlin-build-variant', selectedVariant: 'debug' },
  ast: { kind: 'KtFile', declarations: [] }
};
const csharpRoslynAdapterOptions: CSharpRoslynNativeImporterAdapterOptions = {
  languageVersion: '12',
  nullableContext: 'enabled',
  projectReferences: { hash: 'fixture-csharp-projects', projects: ['Todo.csproj'] },
  semanticModelEvidence: { solver: 'roslyn', hash: 'fixture-csharp-semantic-model' },
  ast: { kind: 'CompilationUnit', members: [] }
};
const swiftSyntaxAdapterOptions: SwiftSyntaxNativeImporterAdapterOptions = {
  swiftVersion: '6',
  languageMode: 'swift-6',
  sourceKitEvidence: { solver: 'sourcekit-lsp', hash: 'fixture-swift-sourcekit' },
  macroExpansionEvidence: { hash: 'fixture-swift-macros', macros: ['Observable'] },
  packageResolutionEvidence: { hash: 'fixture-swift-package', packages: ['DemoPackage'] },
  ast: { kind: 'SourceFileSyntax', statements: [] }
};
const projectionLossOptions: ProjectionTargetLossMatrixOptions = {
  generatedAt: 2,
  imports: [imported],
  adapters: [estreeAdapter],
  targetAdapters: [targetProjectionAdapter],
  targets: ['javascript', 'rust']
};
const projectionLossMatrix: ProjectionTargetLossMatrix = createProjectionTargetLossMatrix(projectionLossOptions);
const universalCapabilityOptions: UniversalCapabilityMatrixOptions = {
  generatedAt: 3,
  imports: [imported],
  adapters: [estreeAdapter],
  targetAdapters: [targetProjectionAdapter],
  targets: ['javascript', 'rust'],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
};
const universalCapabilityMatrix: UniversalCapabilityMatrix = createUniversalCapabilityMatrix(universalCapabilityOptions);

const projectImport: Promise<NativeProjectImportResult> = importNativeProject({
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/project-api-types.js',
    sourceText: 'export function projectApiTypes() {}\n'
  }]
});

const universalAst = createUniversalAstFromDocument(compiled.document, {
  sourceMaps: imported.sourceMaps,
  evidence: imported.evidence
});
const universalJson: string = writeUniversalAstJson(universalAst);
const parsedUniversalAst = readUniversalAstJson(universalJson);

void targetProjectionAdapter;
void parsedUniversalAst;
