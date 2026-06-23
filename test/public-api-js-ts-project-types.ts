import * as compilerApi from '../src/index.js';

const typedModuleResolution: compilerApi.NativeProjectModuleResolutionOptions = {
  baseUrl: '.',
  paths: { '@app/*': ['src/*'] },
  aliases: { '#shared': 'src/shared.ts' }
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
