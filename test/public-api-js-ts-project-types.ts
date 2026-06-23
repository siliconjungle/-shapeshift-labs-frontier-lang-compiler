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

void typedOutputProjectImport; void typedOutputProjectImports; void typedJsTsProjectSafeMergeWithOutputImports; void typedJsTsProjectSafeMergeWithOutputImportMap;
