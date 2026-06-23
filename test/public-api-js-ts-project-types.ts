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
  moduleResolution: typedModuleResolution,
  baseFiles: { 'src/example.ts': 'export const stable = 1;\n' },
  workerFiles: { 'src/example.ts': 'export const stable = 1;\nexport const workerOnly = 1;\n' },
  headFiles: { 'src/example.ts': 'export const stable = 1;\n' }
});

const typedJsTsProjectSafeMerge: compilerApi.JsTsProjectSafeMergeResult = jsTsProjectSafeMerge;
typedJsTsProjectSafeMerge.files[0]?.semanticArtifacts satisfies compilerApi.JsTsSafeMergeSemanticArtifacts | undefined;
typedJsTsProjectSafeMerge.outputFiles[0]?.operation satisfies compilerApi.JsTsProjectSafeMergeFileOperation | undefined;
typedJsTsProjectSafeMerge.outputProjectImport satisfies compilerApi.NativeProjectImportResult | undefined;
typedJsTsProjectSafeMerge.outputProjectSymbolGraph satisfies compilerApi.NativeProjectSymbolGraphSummary | undefined;
typedJsTsProjectSafeMerge.admission.autoMergeClaim satisfies false;
typedJsTsProjectSafeMerge.admission.semanticEquivalenceClaim satisfies false;

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
const typedProjectGraphDeltaStageSummary: compilerApi.JsTsProjectGraphDeltaStageSummary | undefined = typedProjectGraphDelta?.summary.stageSummaries.output;
typedJsTsProjectSafeMergeWithProjectGraphDelta.outputProjectImport satisfies compilerApi.NativeProjectImportResult | undefined;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphDeltaConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphPublicContractConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphReExportIdentityConflicts satisfies number;
typedJsTsProjectSafeMergeWithProjectGraphDelta.summary.projectGraphImportTargetConflicts satisfies number;
typedProjectGraphDelta?.stages.output.projectImport satisfies compilerApi.NativeProjectImportResult | undefined;
typedProjectGraphDelta?.stages.output.projectSymbolGraph satisfies compilerApi.NativeProjectSymbolGraphSummary | undefined;
typedProjectGraphDelta?.stages.output.summary.stage satisfies compilerApi.JsTsProjectGraphStageName | undefined;
typedProjectGraphDelta?.stages.output.summary.suppliedImports satisfies number | undefined;
typedProjectGraphDelta?.stages.output.summary.matchedSuppliedImports satisfies number | undefined;
typedProjectGraphDelta?.stages.output.summary.scannerFallbackImports satisfies number | undefined;
typedProjectGraphDelta?.summary.conflicts satisfies number | undefined;
typedProjectGraphDelta?.summary.publicContractConflicts satisfies number | undefined;
typedProjectGraphDelta?.summary.reExportIdentityConflicts satisfies number | undefined;
typedProjectGraphDelta?.summary.importTargetConflicts satisfies number | undefined;
typedProjectGraphDeltaStageSummary?.publicContractRegions satisfies number | undefined;

void typedOutputProjectImport;
void typedOutputProjectImports;
void typedJsTsProjectSafeMergeWithOutputImports;
void typedJsTsProjectSafeMergeWithOutputImportMap;
void typedProjectGraphImportsByStage;
void typedJsTsProjectSafeMergeWithProjectGraphDelta;
void typedProjectGraphDelta;
void typedProjectGraphDeltaStageSummary;
