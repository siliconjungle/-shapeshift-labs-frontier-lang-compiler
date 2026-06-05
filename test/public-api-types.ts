import * as compilerApi from '../src/index.js';
import {
  FrontierCompileTargets,
  NativeImportLanguageProfiles,
  NativeImportLossKinds,
  NativeImportFeatureEvidencePolicies,
  NativeImportReadinessBySeverity,
  NativeImportRegionTaxonomyKinds,
  NativeImportRoundtripReadinessStatuses,
  NativeImportTaxonomyKinds,
  ProjectionTargetLossClasses,
  classifyNativeImportReadiness,
  classifyNativeImportRoundtripReadiness,
  compileNativeSource,
  compileFrontierDocument,
  compileFrontierSource,
  createBabelNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createNativeImportResultContract,
  createProjectionTargetLossMatrix,
  createNativeSourcePreservation,
  createSemanticImportSidecar,
  createTreeSitterNativeImporterAdapter,
  createTypeScriptCompilerNativeImporterAdapter,
  createUniversalAstFromDocument,
  diffNativeSourceImports,
  diffNativeSources,
  emitForTarget,
  emitForTargetWithSourceMap,
  ExternalSemanticIndexFormats,
  getNativeImportFeatureEvidencePolicy,
  importExternalSemanticIndex,
  importNativeProject,
  importNativeSource,
  normalizeCompileTarget,
  projectFrontierAst,
  projectNativeImportToSource,
  readUniversalAstJson,
  renderTargetAst,
  renderTargetAstWithSourceMap,
  resolveCapabilityAdapters,
  runNativeImporterAdapter,
  runNativeTargetProjectionAdapter,
  summarizeNativeImportFeatureEvidence,
  summarizeNativeImportLosses,
  writeUniversalAstJson
} from '../src/index.js';
import type {
  CapabilityResolution,
  CompileNativeSourceOptions,
  CreateNativeSourcePreservationOptions,
  ExternalSemanticIndexFormat,
  ExternalSemanticIndexImportResult,
  FrontierCompileOptions,
  FrontierCompileResult,
  FrontierCompileTarget,
  FrontierTargetAst,
  FrontierTargetDocumentSourceMapResult,
  FrontierTargetSourceMapResult,
  NativeImportContractSource,
  NativeImportFeatureEvidenceIssue,
  NativeImportFeatureEvidencePolicy,
  NativeImportFeatureEvidenceRisk,
  NativeImportFeatureEvidenceSummary,
  NativeImportCoverageMatrix,
  NativeImportCoverageMatrixOptions,
  NativeImportKnownLossKind,
  NativeImportLanguageProfile,
  NativeImportLossSummary,
  NativeImportReadinessClassification,
  NativeImportRegionTaxonomyKind,
  NativeImportResultContract,
  NativeImportRoundtripReadinessClassification,
  NativeImportRoundtripReadinessStatus,
  NativeImportTaxonomyKind,
  NativeImporterAdapter,
  NativeImporterAdapterCoverageAggregate,
  NativeImporterAdapterCoverageCapabilityEvidence,
  NativeImporterAdapterDiagnostic,
  NativeImporterAdapterImportResult,
  NativeImporterAdapterParseInput,
  NativeImporterAdapterParseResult,
  NativeTargetProjectionAdapter,
  NativeTargetProjectionAdapterInput,
  NativeTargetProjectionAdapterResult,
  NativeTargetProjectionResult,
  NativeProjectImportResult,
  NativeSourceChangeSet,
  NativeSourceChangeSymbol,
  NativeSourceCompileOutputMode,
  NativeSourceCompileResult,
  NativeSourceImportResult,
  NativeSourcePreservation,
  NativeSourceProjectionResult,
  ProjectNativeImportToSourceOptions,
  ProjectionTargetLossClass,
  ProjectionTargetLossMatrix,
  ProjectionTargetLossMatrixOptions,
  SemanticImportSidecar,
  SemanticImportRegionTaxonomySummary
} from '../src/index.js';

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
  | 'ProjectionTargetLossClasses'
  | 'ExternalSemanticIndexFormats'
  | 'classifyNativeImportReadiness'
  | 'classifyNativeImportRoundtripReadiness'
  | 'compileNativeSource'
  | 'compileFrontierDocument'
  | 'compileFrontierSource'
  | 'createBabelNativeImporterAdapter'
  | 'createEstreeNativeImporterAdapter'
  | 'createNativeImportCoverageMatrix'
  | 'createNativeImportResultContract'
  | 'createProjectionTargetLossMatrix'
  | 'createNativeSourcePreservation'
  | 'createSemanticImportSidecar'
  | 'createTreeSitterNativeImporterAdapter'
  | 'createTypeScriptCompilerNativeImporterAdapter'
  | 'createUniversalAstFromDocument'
  | 'diffNativeSourceImports'
  | 'diffNativeSources'
  | 'emitForTarget'
  | 'emitForTargetWithSourceMap'
  | 'getNativeImportFeatureEvidencePolicy'
  | 'importExternalSemanticIndex'
  | 'importNativeProject'
  | 'importNativeSource'
  | 'normalizeCompileTarget'
  | 'projectFrontierAst'
  | 'projectNativeImportToSource'
  | 'readUniversalAstJson'
  | 'renderTargetAst'
  | 'renderTargetAstWithSourceMap'
  | 'resolveCapabilityAdapters'
  | 'runNativeImporterAdapter'
  | 'runNativeTargetProjectionAdapter'
  | 'summarizeNativeImportFeatureEvidence'
  | 'summarizeNativeImportLosses'
  | 'writeUniversalAstJson';

type PublicRuntimeExportsMatchDeclarations = Expect<Equal<keyof typeof compilerApi, ExpectedPublicRuntimeExport>>;

const target: FrontierCompileTarget = normalizeCompileTarget('ts');
const targets: readonly FrontierCompileTarget[] = FrontierCompileTargets;
const taxonomyKind: NativeImportTaxonomyKind = NativeImportTaxonomyKinds[0] ?? 'sourcePreservation';
const lossKind: NativeImportKnownLossKind = NativeImportLossKinds[0] ?? 'sourcePreservation';
const featureEvidenceRisk: NativeImportFeatureEvidenceRisk = 'high';
const featureEvidencePolicy: NativeImportFeatureEvidencePolicy | undefined = getNativeImportFeatureEvidencePolicy('preprocessor');
const featureEvidencePolicies: Readonly<Record<string, NativeImportFeatureEvidencePolicy>> = NativeImportFeatureEvidencePolicies;
const regionKind: NativeImportRegionTaxonomyKind = NativeImportRegionTaxonomyKinds[0] ?? 'symbol';
const roundtripStatus: NativeImportRoundtripReadinessStatus = NativeImportRoundtripReadinessStatuses[0] ?? 'source-preserved';
const projectionLossClass: ProjectionTargetLossClass = ProjectionTargetLossClasses[0] ?? 'exactSourceProjection';
const languageProfiles: readonly NativeImportLanguageProfile[] = NativeImportLanguageProfiles;
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

const estreeAdapter: NativeImporterAdapter = createEstreeNativeImporterAdapter();
const babelAdapter: NativeImporterAdapter = createBabelNativeImporterAdapter();
const tsAdapter: NativeImporterAdapter = createTypeScriptCompilerNativeImporterAdapter();
const treeAdapter: NativeImporterAdapter = createTreeSitterNativeImporterAdapter({ language: 'javascript' });

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
const projectionLossOptions: ProjectionTargetLossMatrixOptions = {
  generatedAt: 2,
  imports: [imported],
  adapters: [estreeAdapter],
  targetAdapters: [targetProjectionAdapter],
  targets: ['javascript', 'rust']
};
const projectionLossMatrix: ProjectionTargetLossMatrix = createProjectionTargetLossMatrix(projectionLossOptions);

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

void targets;
void taxonomyKind;
void lossKind;
void featureEvidenceRisk;
void featureEvidencePolicy;
void featureEvidencePolicies;
void featureEvidenceSummary;
void featureEvidenceIssue;
void regionKind;
void roundtripStatus;
void projectionLossClass;
void languageProfiles;
void compiledAgain;
void emitted;
void mappedEmit;
void rendered;
void mappedRender;
void capabilityResolutions;
void readiness;
void roundtripReadiness;
void readinessBySeverity;
void projection;
void targetProjectionAdapter;
void nativeCompiled;
void nativeCompileMode;
void nativeCompileSourceMap;
void nativeCompileSourceMaps;
void targetProjection;
void directTargetProjection;
void sidecar;
void regionTaxonomy;
void contractSource;
void adapterImport;
void coverage;
void adapterCoverageAggregate;
void adapterCapabilityEvidence;
void projectionLossMatrix;
void projectImport;
void parsedUniversalAst;
void (null as unknown as PublicRuntimeExportsMatchDeclarations);
