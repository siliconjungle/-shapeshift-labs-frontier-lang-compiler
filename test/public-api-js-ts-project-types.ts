import * as compilerApi from '../src/index.js';

const typedModuleResolution: compilerApi.NativeProjectModuleResolutionOptions = {
  baseUrl: '.',
  paths: { '@app/*': ['src/*'] },
  aliases: { '#shared': 'src/shared.ts' },
  packages: { '@pkg/core': { root: 'packages/core', exports: { './utils': { import: './src/utils.ts' } } } },
  packageExportConditions: ['import', 'default']
};

const jsTsProjectSafeMerge = compilerApi.safeMergeJsTsProject({
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  allowProjectSymbolRenames: true,
  allowProjectSymbolMoves: true,
  requireTypeScriptRefactorEvidence: true,
  requireTypeScriptLanguageServiceRefactorEvidence: true,
  allowProjectSplitMerges: true,
  projectGraphLimits: { maxFiles: 10, maxSourceBytes: 20_000, maxSourceSpans: 5_000, maxImportEdges: 100, maxExportEdges: 100, maxScopeBindings: 500, maxScopeReferences: 1_000, maxJsxElements: 50, maxJsxProps: 200, maxSerializedBytes: 2_000_000 },
  moduleResolution: typedModuleResolution,
  baseFiles: { 'src/example.ts': 'export const stable = 1;\n' },
  workerFiles: { 'src/example.ts': 'export const stable = 1;\nexport const workerOnly = 1;\n' },
  headFiles: { 'src/example.ts': 'export const stable = 1;\n' }
});

const typedJsTsProjectSafeMerge: compilerApi.JsTsProjectSafeMergeResult = jsTsProjectSafeMerge;
const typedProjectGraphLimits: compilerApi.JsTsProjectGraphLimits = { maxFiles: 10, maxSourceSpans: 500, maxScopeBindings: 50, maxScopeReferences: 100, maxJsxElements: 25, maxJsxProps: 75, maxSerializedBytes: 1_000_000 };
const typedParserTriviaEvidence: compilerApi.ParserTriviaEvidenceInput = { status: 'exact', exactParserTrivia: true, sourceHash: 'typed-source', adapterId: 'typed-parser' };
const typedParserTriviaProjectFile: compilerApi.JsTsProjectSafeMergeFileInput = { sourcePath: 'src/trivia.ts', baseSourceText: 'export const value = 1;\n', workerSourceText: 'export const value = 1;\n', headSourceText: 'export const value = 1;\n', outputParserTriviaEvidence: typedParserTriviaEvidence };
const typedParserTriviaProjectMap: compilerApi.JsTsProjectSafeMergeFileMap = { 'src/trivia.ts': { sourceText: 'export const value = 1;\n', parserTriviaEvidence: typedParserTriviaEvidence } };
typedJsTsProjectSafeMerge.files[0]?.semanticArtifacts satisfies compilerApi.JsTsSafeMergeSemanticArtifacts | undefined;
typedJsTsProjectSafeMerge.outputFiles[0]?.operation satisfies compilerApi.JsTsProjectSafeMergeFileOperation | undefined;
typedJsTsProjectSafeMerge.outputFiles[0]?.parserTriviaEvidence satisfies compilerApi.ParserTriviaEvidenceInput | undefined;
typedJsTsProjectSafeMerge.outputProjectImport satisfies compilerApi.NativeProjectImportResult | undefined;
typedJsTsProjectSafeMerge.outputProjectSymbolGraph satisfies compilerApi.NativeProjectSymbolGraphSummary | undefined;
typedJsTsProjectSafeMerge.outputDeclarationGate satisfies compilerApi.JsTsProjectMergeDeclarationGate | undefined;
typedJsTsProjectSafeMerge.admission.autoMergeClaim satisfies false;
typedJsTsProjectSafeMerge.admission.semanticEquivalenceClaim satisfies boolean;
typedJsTsProjectSafeMerge.summary.projectGraphLimitConflicts satisfies number;
typedJsTsProjectSafeMerge.summary.outputDeclarations satisfies number;
typedJsTsProjectSafeMerge.summary.outputDeclarationConflicts satisfies number;
typedJsTsProjectSafeMerge.summary.projectSymbolMoveAdmissions satisfies number;
typedJsTsProjectSafeMerge.summary.projectCrossFileSymbolRenameAdmissions satisfies number;
typedJsTsProjectSafeMerge.summary.projectSplitMergeAdmissions satisfies number;

void typedProjectGraphLimits;
void typedJsTsProjectSafeMerge;

const typedOutputProjectImport: compilerApi.NativeSourceImportResult = compilerApi.importNativeSource({
  language: 'typescript',
  sourcePath: 'src/output.ts',
  sourceText: 'export const stable = 1;\n'
});
const typedOutputProjectImports: compilerApi.JsTsProjectSafeMergeOutputProjectImports = new Map([
  ['src/output.ts', typedOutputProjectImport]
]);
const typedJsTsProjectSafeMergeWithOutputImports = compilerApi.safeMergeJsTsProject({
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [typedOutputProjectImport],
  baseFiles: { 'src/output.ts': 'export const stable = 1;\n' },
  workerFiles: { 'src/output.ts': 'export const stable = 1;\n' },
  headFiles: { 'src/output.ts': 'export const stable = 1;\n' }
});
const typedJsTsProjectSafeMergeWithOutputImportMap = compilerApi.safeMergeJsTsProject({
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: typedOutputProjectImports,
  baseFiles: { 'src/output.ts': 'export const stable = 1;\n' },
  workerFiles: { 'src/output.ts': 'export const stable = 1;\n' },
  headFiles: { 'src/output.ts': 'export const stable = 1;\n' }
});
typedJsTsProjectSafeMergeWithOutputImports.outputProjectImport?.imports[0] satisfies compilerApi.NativeSourceImportResult | undefined;
typedJsTsProjectSafeMergeWithOutputImportMap.outputProjectSymbolGraph satisfies compilerApi.NativeProjectSymbolGraphSummary | undefined;

const typedProjectGraphImportsByStage: compilerApi.JsTsProjectSafeMergeProjectGraphImportsByStage = {
  base: [typedOutputProjectImport],
  worker: typedOutputProjectImports,
  head: { 'src/output.ts': typedOutputProjectImport },
  output: [typedOutputProjectImport]
};
const typedJsTsProjectSafeMergeWithProjectGraphDelta = compilerApi.safeMergeJsTsProject({
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseProjectImports: [typedOutputProjectImport],
  workerProjectImports: typedOutputProjectImports,
  headProjectImports: { 'src/output.ts': typedOutputProjectImport },
  outputProjectImports: [typedOutputProjectImport],
  projectGraphImports: typedProjectGraphImportsByStage,
  baseFiles: { 'src/output.ts': 'export const stable = 1;\n' },
  workerFiles: { 'src/output.ts': 'export const stable = 1;\nexport const workerOnly = 1;\n' },
  headFiles: { 'src/output.ts': 'export const stable = 1;\n' }
});
const typedProjectGraphDelta: compilerApi.JsTsProjectGraphDelta | undefined = typedJsTsProjectSafeMergeWithProjectGraphDelta.projectGraphDelta;
const ds = typedProjectGraphDelta?.summary;
const typedProjectGraphDeltaStageSummary: compilerApi.JsTsProjectGraphDeltaStageSummary | undefined = typedProjectGraphDelta?.summary.stageSummaries.output;
typedJsTsProjectSafeMergeWithProjectGraphDelta.outputProjectImport satisfies compilerApi.NativeProjectImportResult | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphDeltaConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphDeltaEvidenceIncluded satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphPublicContractConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphSourceSpanConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphCompilerTypeConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphRuntimeRegionConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphScopeUseDefConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphJsxPropConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphJsxRenderRiskConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphReExportIdentityConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphImportAttributeConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphImportTargetConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.proofEvidenceMissing satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.proofEvidenceMissingLevels?.[0] satisfies compilerApi.JsTsProjectMergeProofLevel | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.nextMissingEvidenceCode satisfies string | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.confidence.recommendedAction satisfies compilerApi.JsTsProjectSafeMergeRecommendedAction;
typedJsTsProjectSafeMergeWithProjectGraphDelta.confidence.nextMissingEvidence?.code satisfies string | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.confidence.missingEvidence?.[0]?.semanticEquivalenceClaim satisfies false | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.proofEvidence.summary.nextMissingEvidence?.semanticEquivalenceClaim satisfies false | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.proofEvidence.summary.unsupportedSurfaceEvidenceCount satisfies number | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.proofEvidence.summary.unsupportedSurfaceKinds?.[0] satisfies string | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.proofEvidence.summary.unsupportedSurfaceReasonCodes?.[0] satisfies string | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.outputQualityGate?.decision?.autoMergeClaim satisfies false | undefined;
typedProjectGraphDelta?.stages.output.projectImport satisfies compilerApi.NativeProjectImportResult | undefined;
typedProjectGraphDelta?.stages.output.projectSymbolGraph satisfies compilerApi.NativeProjectSymbolGraphSummary | undefined;
typedProjectGraphDelta?.stages.output.summary.stage satisfies compilerApi.JsTsProjectGraphStageName | undefined;
typedProjectGraphDelta?.stages.output.summary.suppliedImports satisfies number | undefined;
typedProjectGraphDelta?.stages.output.summary.matchedSuppliedImports satisfies number | undefined;
typedProjectGraphDelta?.stages.output.summary.scannerFallbackImports satisfies number | undefined;
typedProjectGraphDelta?.stages.output.summary.sourceBytes satisfies number | undefined;
typedProjectGraphDelta?.stages.output.summary.serializedBytes satisfies number | undefined;
typedProjectGraphDelta?.stages.output.summary.limitConflicts satisfies number | undefined;
const ie = typedJsTsProjectSafeMerge.outputProjectSymbolGraph?.importEdges[0];
ie?.hasImportAttributes satisfies boolean | undefined;
ie?.importAttributeCount satisfies number | undefined;
ie?.importAttributeKeys?.[0] satisfies string | undefined;
ie?.importAttributeHash satisfies string | undefined;
ie?.packageExportKey satisfies string | undefined;
ie?.packageExportTarget satisfies string | undefined;
ie?.packageRuntimeCondition satisfies string | undefined;
ie?.packageRuntimeConditionEvidenceSource satisfies string | undefined;
ie?.commonJs satisfies boolean | undefined;
ie?.interopHelper satisfies string | undefined;
ie?.packageEnvironmentCondition satisfies string | undefined;
ie?.packageEnvironmentConditionEvidenceSource satisfies string | undefined;
ie?.packageEnvironmentConditionCandidates?.[0] satisfies string | undefined;
ie?.packageEnvironmentConditionReasonCode satisfies string | undefined;
ie?.packageType satisfies string | undefined;
ie?.reExportResolved satisfies boolean | undefined;
ie?.reExportResolutionKind satisfies string | undefined;
ie?.reExportTargetSourcePath satisfies string | undefined;
const typedProjectGraphLimitKind = typedProjectGraphDelta?.stages.output.limitConflicts?.[0]?.details?.limitKind as compilerApi.JsTsProjectGraphLimitKind | undefined;
typedProjectGraphLimitKind satisfies compilerApi.JsTsProjectGraphLimitKind | undefined;
const typedCommonJsRuntimeInteropProof: compilerApi.JsTsProjectCommonJsRuntimeInteropProof = {
  schema: 'frontier.lang.commonJsRuntimeInteropProof.v1',
  status: 'passed',
  sourcePath: 'src/consumer.js',
  sourceHash: 'source-hash',
  moduleSpecifier: './legacy.cjs',
  importedName: 'default',
  localName: 'legacy',
  importKind: 'default',
  outputTargetSymbolId: 'symbol:javascript:export:module_exports',
  runtimeTraceHash: 'trace-hash',
  evidenceHash: 'evidence-hash',
  autoMergeClaim: false,
  semanticEquivalenceClaim: false,
  runtimeEquivalenceClaim: false,
  runtimeInteropEquivalenceClaim: false
};
compilerApi.safeMergeJsTsProject({ commonJsRuntimeInteropProof: typedCommonJsRuntimeInteropProof });
ds?.conflicts satisfies number | undefined;
ds?.publicContractConflicts satisfies number | undefined;
ds?.sourceSpanConflicts satisfies number | undefined;
ds?.compilerTypeConflicts satisfies number | undefined;
ds?.runtimeRegionConflicts satisfies number | undefined;
ds?.scopeUseDefConflicts satisfies number | undefined;
ds?.jsxPropConflicts satisfies number | undefined;
ds?.jsxRenderRiskConflicts satisfies number | undefined;
ds?.reExportIdentityConflicts satisfies number | undefined;
ds?.importAttributeConflicts satisfies number | undefined;
ds?.importTargetConflicts satisfies number | undefined;
ds?.limitConflicts satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.publicContractRegions satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.sourceFileRecords satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.sourceSpanRecords satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.compilerTypeRecords satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.runtimeRegionRecords satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.scopeBindingRecords satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.scopeReferenceRecords satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.jsxElementRecords satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.jsxPropRecords satisfies number | undefined;
const typedCompilerTypeRecord = typedJsTsProjectSafeMerge.outputProjectSymbolGraph?.compilerTypeRecords[0];
typedCompilerTypeRecord?.typeText satisfies string | undefined;
typedCompilerTypeRecord?.apiSignatureHash satisfies string | undefined;
typedCompilerTypeRecord?.declarationCount satisfies number | undefined;
typedCompilerTypeRecord?.overloadSignatureCount satisfies number | undefined;
typedCompilerTypeRecord?.typeParameterCount satisfies number | undefined;
typedCompilerTypeRecord?.typeParameterDefaultCount satisfies number | undefined;
typedCompilerTypeRecord?.typeParameterConstraintCount satisfies number | undefined;
typedCompilerTypeRecord?.propertyCount satisfies number | undefined;
typedCompilerTypeRecord?.propertyOptionalCount satisfies number | undefined;
typedCompilerTypeRecord?.propertyReadonlyCount satisfies number | undefined;
typedCompilerTypeRecord?.constructorSignatureCount satisfies number | undefined;
typedCompilerTypeRecord?.classHeritageCount satisfies number | undefined;
typedCompilerTypeRecord?.advancedTypeShapeCount satisfies number | undefined;
typedCompilerTypeRecord?.advancedTypeShapeKinds?.[0] satisfies string | undefined;
typedCompilerTypeRecord?.advancedTypeShapes?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerAdvancedTypeShapeRecord | undefined;
typedCompilerTypeRecord?.typeReferenceTargetCount satisfies number | undefined;
typedCompilerTypeRecord?.typeReferenceTargets?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerTypeReferenceTargetRecord | undefined;
typedCompilerTypeRecord?.typeEquivalenceStatus satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceReasonCodes?.[0] satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceSignatureSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceTypeParameterSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalencePropertySetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceConstructorSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceClassHeritageHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceAssignabilityOracleHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceConditionalTypeSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceIndexedAccessTypeSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceMappedTypeSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceKeyofTypeOperatorSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceTypeReferenceTargetSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.status satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.typeParameterSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.propertySetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.constructorSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.classHeritageHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.assignabilityOracleHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.assignabilityOracleScope satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.conditionalTypeSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.indexedAccessTypeSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.mappedTypeSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.keyofTypeOperatorSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.typeReferenceTargetSetHash satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.typeReferenceTargetCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.typeParameterDefaultCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.propertyCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.propertyOptionalCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.propertyReadonlyCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.constructorSignatureCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.classHeritageCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.assignabilityOracleCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.assignabilityOracleDirectionCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.advancedTypeShapeCount satisfies number | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.unsupportedSignals?.[0] satisfies string | undefined;
typedCompilerTypeRecord?.typeEquivalenceProof?.semanticEquivalenceClaim satisfies false | undefined;
typedCompilerTypeRecord?.typeEquivalenceCheckerEvidence satisfies unknown;
typedCompilerTypeRecord?.typeParameters?.[0]?.defaultTypeText satisfies string | undefined;
typedCompilerTypeRecord?.properties?.[0]?.typeText satisfies string | undefined;
typedCompilerTypeRecord?.properties?.[0]?.optional satisfies boolean | undefined;
typedCompilerTypeRecord?.properties?.[0]?.['readonly'] satisfies boolean | undefined;
typedCompilerTypeRecord?.assignabilityOracleCount satisfies number | undefined;
typedCompilerTypeRecord?.assignabilityOracleDirectionCount satisfies number | undefined;
typedCompilerTypeRecord?.assignabilityOracleHash satisfies string | undefined;
typedCompilerTypeRecord?.assignabilityOracle satisfies compilerApi.NativeProjectSymbolGraphCompilerAssignabilityOracleRecord | undefined;
typedCompilerTypeRecord?.assignabilityOracle?.directions?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerAssignabilityOracleDirectionRecord | undefined;
typedCompilerTypeRecord?.callSignatures?.[0]?.returnTypeText satisfies string | undefined;
typedCompilerTypeRecord?.constructorSignatures?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerConstructorRecord | undefined;
typedCompilerTypeRecord?.constructorSignatures?.[0]?.parameters?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerConstructorParameterRecord | undefined;
typedCompilerTypeRecord?.classHeritage?.[0] satisfies compilerApi.NativeProjectSymbolGraphCompilerClassHeritageRecord | undefined;
typedJsTsProjectSafeMerge.outputProjectSymbolGraph?.sourceFileRecords[0]?.shapeHash satisfies string | undefined;
typedJsTsProjectSafeMerge.outputProjectSymbolGraph?.sourceSpanRecords[0]?.signatureHash satisfies string | undefined;
const typedRuntimeRegionRecord = typedJsTsProjectSafeMerge.outputProjectSymbolGraph?.runtimeRegionRecords[0];
typedRuntimeRegionRecord?.runtimeKind satisfies string | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence satisfies
  compilerApi.NativeProjectRuntimeOrderEvidence | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.branchOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderControlRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.loopOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderControlRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.sameLineThrowOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderThrowRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.sameLineShortCircuit?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderShortCircuitRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.sameLineAwaitOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderAwaitRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.sameLineOptionalChain?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderOptionalChainRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.sameLineConditionalExpression?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderConditionalExpressionRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.sameLinePromiseCombinator?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderPromiseCombinatorRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.controlTransferOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderControlTransferRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.controlTransferOrder?.[0]?.labelTargetKind satisfies
  string | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.exitOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderExitRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.loopIterationOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderLoopIterationRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.switchDispatchOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderSwitchDispatchRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.switchDispatchOrder?.[0]?.fallthroughFromPrevious satisfies
  boolean | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.tryCatchOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderTryCatchRecord | undefined;
typedRuntimeRegionRecord?.runtimeOrderEvidence?.tryFinallyOrder?.[0] satisfies
  compilerApi.NativeProjectRuntimeOrderTryFinallyRecord | undefined;
void typedOutputProjectImport;
void typedOutputProjectImports;
void typedJsTsProjectSafeMergeWithOutputImports;
void typedJsTsProjectSafeMergeWithOutputImportMap;
void typedProjectGraphImportsByStage;
void typedJsTsProjectSafeMergeWithProjectGraphDelta;
void typedProjectGraphDelta;
void ds;
void typedProjectGraphDeltaStageSummary;
void typedProjectGraphLimitKind;
void typedParserTriviaProjectFile;
void typedParserTriviaProjectMap;
