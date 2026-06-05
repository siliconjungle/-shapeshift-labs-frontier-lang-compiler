import * as compilerApi from '../src/index.js';
import {
  FrontierCompileTargets,
  NativeImportLanguageProfiles,
  NativeImportLossKinds,
  NativeImportReadinessBySeverity,
  NativeImportRegionTaxonomyKinds,
  NativeImportRoundtripReadinessStatuses,
  NativeImportTaxonomyKinds,
  classifyNativeImportReadiness,
  classifyNativeImportRoundtripReadiness,
  compileFrontierDocument,
  compileFrontierSource,
  createBabelNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createNativeImportResultContract,
  createNativeSourcePreservation,
  createSemanticImportSidecar,
  createTreeSitterNativeImporterAdapter,
  createTypeScriptCompilerNativeImporterAdapter,
  createUniversalAstFromDocument,
  emitForTarget,
  importNativeProject,
  importNativeSource,
  normalizeCompileTarget,
  projectFrontierAst,
  projectNativeImportToSource,
  readUniversalAstJson,
  renderTargetAst,
  resolveCapabilityAdapters,
  runNativeImporterAdapter,
  summarizeNativeImportLosses,
  writeUniversalAstJson
} from '../src/index.js';
import type {
  CapabilityResolution,
  CreateNativeSourcePreservationOptions,
  FrontierCompileOptions,
  FrontierCompileResult,
  FrontierCompileTarget,
  FrontierTargetAst,
  NativeImportContractSource,
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
  NativeImporterAdapterDiagnostic,
  NativeImporterAdapterImportResult,
  NativeImporterAdapterParseInput,
  NativeImporterAdapterParseResult,
  NativeProjectImportResult,
  NativeSourceImportResult,
  NativeSourcePreservation,
  NativeSourceProjectionResult,
  ProjectNativeImportToSourceOptions,
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
  | 'NativeImportReadinessBySeverity'
  | 'NativeImportRegionTaxonomyKinds'
  | 'NativeImportRoundtripReadinessStatuses'
  | 'NativeImportTaxonomyKinds'
  | 'classifyNativeImportReadiness'
  | 'classifyNativeImportRoundtripReadiness'
  | 'compileFrontierDocument'
  | 'compileFrontierSource'
  | 'createBabelNativeImporterAdapter'
  | 'createEstreeNativeImporterAdapter'
  | 'createNativeImportCoverageMatrix'
  | 'createNativeImportResultContract'
  | 'createNativeSourcePreservation'
  | 'createSemanticImportSidecar'
  | 'createTreeSitterNativeImporterAdapter'
  | 'createTypeScriptCompilerNativeImporterAdapter'
  | 'createUniversalAstFromDocument'
  | 'emitForTarget'
  | 'importNativeProject'
  | 'importNativeSource'
  | 'normalizeCompileTarget'
  | 'projectFrontierAst'
  | 'projectNativeImportToSource'
  | 'readUniversalAstJson'
  | 'renderTargetAst'
  | 'resolveCapabilityAdapters'
  | 'runNativeImporterAdapter'
  | 'summarizeNativeImportLosses'
  | 'writeUniversalAstJson';

type PublicRuntimeExportsMatchDeclarations = Expect<Equal<keyof typeof compilerApi, ExpectedPublicRuntimeExport>>;

const target: FrontierCompileTarget = normalizeCompileTarget('ts');
const targets: readonly FrontierCompileTarget[] = FrontierCompileTargets;
const taxonomyKind: NativeImportTaxonomyKind = NativeImportTaxonomyKinds[0] ?? 'sourcePreservation';
const lossKind: NativeImportKnownLossKind = NativeImportLossKinds[0] ?? 'sourcePreservation';
const regionKind: NativeImportRegionTaxonomyKind = NativeImportRegionTaxonomyKinds[0] ?? 'symbol';
const roundtripStatus: NativeImportRoundtripReadinessStatus = NativeImportRoundtripReadinessStatuses[0] ?? 'source-preserved';
const languageProfiles: readonly NativeImportLanguageProfile[] = NativeImportLanguageProfiles;

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
const projectedAst: FrontierTargetAst = projectFrontierAst(compiled.document, 'python');
const rendered: string = renderTargetAst(projectedAst, 'python');
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

const summary: NativeImportLossSummary = summarizeNativeImportLosses(imported.losses, { evidence: imported.evidence });
const readiness: NativeImportReadinessClassification = classifyNativeImportReadiness(imported.losses, {
  evidence: imported.evidence
});
const roundtripReadiness: NativeImportRoundtripReadinessClassification = classifyNativeImportRoundtripReadiness(imported);
const readinessBySeverity = NativeImportReadinessBySeverity[summary.highestSeverity];

const projectionOptions: ProjectNativeImportToSourceOptions = { preferPreservedSource: true };
const projection: NativeSourceProjectionResult = projectNativeImportToSource(imported, projectionOptions);
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
void regionKind;
void roundtripStatus;
void languageProfiles;
void compiledAgain;
void emitted;
void rendered;
void capabilityResolutions;
void readiness;
void roundtripReadiness;
void readinessBySeverity;
void projection;
void sidecar;
void regionTaxonomy;
void contractSource;
void adapterImport;
void coverage;
void projectImport;
void parsedUniversalAst;
void (null as unknown as PublicRuntimeExportsMatchDeclarations);
