import { assert } from './helpers.mjs';
import {
  createJsTsProjectMergeDeclarationEmitParityProof,
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const baseFiles = {};
const changedFiles = { 'src/box.ts': boxSource('string') };
const baseImports = await importsForFiles(baseFiles);
const changedImports = await importsForFiles(changedFiles);
const graphImports = { base: baseImports, worker: changedImports, head: changedImports, output: changedImports };

const admittedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_api_declaration_emit_parity',
  language: 'typescript',
  includeProjectGraphDelta: true,
  includeDeclarationOutput: true,
  typescript,
  projectGraphImports: graphImports,
  baseFiles,
  workerFiles: changedFiles,
  headFiles: changedFiles
});
assert.equal(admittedProject.status, 'merged');
assert.equal(admittedProject.declarationEmitParityProof.status, 'passed');
assert.equal(admittedProject.declarationEmitParityProof.kind, 'typescript-checker-public-api-declaration-emit-parity');
assert.equal(admittedProject.declarationEmitParityProof.autoMergeClaim, false);
assert.equal(admittedProject.declarationEmitParityProof.semanticEquivalenceClaim, false);
assert.equal(admittedProject.declarationEmitParityProof.workerDeclarationBoundaryHash, admittedProject.declarationEmitParityProof.headDeclarationBoundaryHash);
assert.equal(admittedProject.declarationEmitParityProof.workerDeclarationBoundaryHash, admittedProject.declarationEmitParityProof.outputDeclarationBoundaryHash);
assert.equal(admittedProject.summary.projectGraphCompilerTypeConflicts, 0);
assert.equal(admittedProject.outputDeclarationGate.status, 'passed');
assert.equal(admittedProject.outputDeclarationGate.declarationFiles[0].sourceText.includes('value: string'), true);

const directProof = createJsTsProjectMergeDeclarationEmitParityProof({
  typescript,
  includeDeclarationOutput: true
}, fileRecords(changedFiles), stageFiles(changedFiles), 'direct_declaration_emit_parity');
assert.equal(directProof.status, 'passed');
assert.equal(directProof.declarationFileCount, 1);

const blockedProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_api_declaration_emit_parity_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  declarationEmitParityProof: {
    status: 'failed',
    reasonCodes: ['typescript-public-api-declaration-emit-parity-mismatch']
  },
  projectGraphImports: graphImports,
  baseFiles,
  workerFiles: changedFiles,
  headFiles: changedFiles
});
const parityConflict = blockedProject.conflicts.find((conflict) => (
  conflict.details?.reasonCode === 'typescript-public-api-declaration-emit-parity-mismatch'
));
assert.equal(blockedProject.status, 'blocked');
assert.equal(Boolean(parityConflict), true);
assert.equal(parityConflict.details.declarationEmitParityEvidence.requiredEvidence, 'typescript-checker-public-api-declaration-emit-parity');
assert.equal(parityConflict.details.declarationEmitParityEvidence.semanticEquivalenceClaim, false);

function boxSource(valueType) {
  return ['export interface Box {', `  value: ${valueType};`, '}', ''].join('\n');
}

function stageFiles(files) {
  return Object.entries(files).map(([sourcePath, sourceText]) => ({ sourcePath, language: 'typescript', sourceText }));
}

function fileRecords(files) {
  return Object.entries(files).map(([sourcePath, sourceText]) => ({ sourcePath, language: 'typescript', baseSourceText: sourceText, workerSourceText: sourceText, headSourceText: sourceText }));
}

async function importsForFiles(files) {
  const program = typeScriptProgramForFiles(files);
  const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript, program });
  return await Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(adapter, {
    language: 'typescript',
    sourcePath,
    sourceText,
    adapterOptions: { sourceFile: program.getSourceFile(sourcePath) }
  })));
}

function typeScriptProgramForFiles(files) {
  const compilerOptions = { target: typescript.ScriptTarget.Latest, module: typescript.ModuleKind.ESNext, noLib: true, strict: true };
  const normalizedFiles = new Map(Object.entries(files).map(([sourcePath, sourceText]) => [normalizePath(sourcePath), sourceText]));
  const host = typescript.createCompilerHost(compilerOptions, true);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const sourceText = normalizedFiles.get(normalizePath(fileName));
    if (sourceText !== undefined) return typescript.createSourceFile(fileName, sourceText, languageVersion, true);
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };
  host.readFile = (fileName) => normalizedFiles.get(normalizePath(fileName));
  host.fileExists = (fileName) => normalizedFiles.has(normalizePath(fileName));
  return typescript.createProgram([...normalizedFiles.keys()], compilerOptions, host);
}

function normalizePath(sourcePath) {
  return String(sourcePath).replace(/\\/g, '/');
}
