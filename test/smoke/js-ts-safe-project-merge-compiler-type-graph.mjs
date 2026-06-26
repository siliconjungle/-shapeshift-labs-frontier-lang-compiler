import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const baseFiles = { 'src/options.ts': optionsSource([]) };
const workerFiles = { 'src/options.ts': optionsSource(['  label?: string;']) };
const headFiles = { 'src/options.ts': optionsSource(['  retries: number;']) };
const outputFiles = { 'src/options.ts': optionsSource(['  retries: number;', '  label?: string;']) };
const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_compiler_type_delta_conflict',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles,
  workerFiles,
  headFiles,
  baseProjectImports: await parserBackedImportsForFiles(baseFiles),
  workerProjectImports: await parserBackedImportsForFiles(workerFiles),
  headProjectImports: await parserBackedImportsForFiles(headFiles),
  outputProjectImports: await parserBackedImportsForFiles(outputFiles),
  policyByPath: {
    'src/options.ts': { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
  }
});
const compilerTypeConflict = project.conflicts.find((conflict) => conflict.code === 'project-public-compiler-type-delta-conflict');
const outputGraph = project.projectGraphDelta.stages.output.projectSymbolGraph;
assert.equal(project.status, 'blocked');
assert.equal(project.admission.reasonCodes.includes('project-public-compiler-type-delta-conflict'), true);
assert.equal(project.admission.autoMergeClaim, false);
assert.equal(project.admission.semanticEquivalenceClaim, false);
assert.equal(project.summary.projectGraphCompilerTypeConflicts, 1);
assert.equal(project.projectGraphDelta.summary.compilerTypeConflicts, 1);
assert.equal(project.projectGraphDelta.stages.worker.summary.compilerTypeRecords > 0, true);
assert.equal(outputGraph.compilerSymbolRecords.some((record) => record.publicContract && record.fullyQualifiedName === '"src/options".Options'), true);
const outputOptionsType = outputGraph.compilerTypeRecords.find((record) => record.publicContract && record.fullyQualifiedName === '"src/options".Options');
assert.equal(Boolean(outputOptionsType?.apiSignatureHash), true);
assert.equal(hasCompilerProperty(outputOptionsType, 'label', 'string'), true);
assert.equal(hasCompilerProperty(outputOptionsType, 'retries', 'number'), true);
assert.equal(compilerTypeConflict.details.identityKey, 'compiler-public-type#"src/options".Options');
assert.equal(hasCompilerProperty(compilerTypeConflict.details.worker, 'label', 'string'), true);
assert.equal(hasCompilerProperty(compilerTypeConflict.details.head, 'retries', 'number'), true);
assert.equal(Boolean(compilerTypeConflict.details.worker.apiSignatureHash), true);
assert.notEqual(compilerTypeConflict.details.worker.apiSignatureHash, compilerTypeConflict.details.head.apiSignatureHash);

const staleWorkerImportProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_compiler_type_delta_stale_worker_import_blocks',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles,
  workerFiles,
  headFiles,
  baseProjectImports: await parserBackedImportsForFiles(baseFiles),
  workerProjectImports: await parserBackedImportsForFiles(baseFiles),
  headProjectImports: await parserBackedImportsForFiles(headFiles),
  outputProjectImports: await parserBackedImportsForFiles(outputFiles),
  policyByPath: {
    'src/options.ts': { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
  }
});
const staleWorkerCompilerTypeConflict = staleWorkerImportProject.conflicts.find((conflict) => conflict.code === 'project-public-compiler-type-delta-conflict');
assert.equal(staleWorkerImportProject.status, 'blocked');
assert.equal(staleWorkerImportProject.projectGraphDelta.stages.worker.summary.matchedSuppliedImports, 0);
assert.equal(staleWorkerImportProject.projectGraphDelta.stages.worker.summary.scannerFallbackImports, 1);
assert.equal(staleWorkerCompilerTypeConflict.details.worker, undefined);
assert.equal(staleWorkerImportProject.admission.semanticEquivalenceClaim, false);

const privateBaseFiles = { 'src/options.ts': privateOptionsSource([]) };
const privateWorkerFiles = { 'src/options.ts': privateOptionsSource(['  workerOnly?: string;']) };
const privateHeadFiles = { 'src/options.ts': privateOptionsSource(['  headOnly?: number;']) };
const privateProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_private_compiler_type_delta_allowed',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: privateBaseFiles,
  workerFiles: privateWorkerFiles,
  headFiles: privateHeadFiles,
  baseProjectImports: await parserBackedImportsForFiles(privateBaseFiles),
  workerProjectImports: await parserBackedImportsForFiles(privateWorkerFiles),
  headProjectImports: await parserBackedImportsForFiles(privateHeadFiles),
  policyByPath: {
    'src/options.ts': { unorderedRegions: [{ kind: 'interface', name: 'InternalOptions', order: 'non-semantic' }] }
  }
});
assert.equal(privateProject.status, 'merged');
assert.equal(privateProject.summary.projectGraphCompilerTypeConflicts, 0);
assert.equal(privateProject.projectGraphDelta.summary.compilerTypeConflicts, 0);
assert.equal(privateProject.admission.autoMergeClaim, false);
assert.equal(privateProject.admission.semanticEquivalenceClaim, false);

const inferredFactoryFiles = {
  'src/factory.ts': [
    'export const createOptions = (enabled = true) => ({ enabled, retries: 3 });',
    ''
  ].join('\n')
};
const inferredFactoryProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_inferred_factory_type_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: await parserBackedImportsForFiles(inferredFactoryFiles),
  baseFiles: {},
  workerFiles: {},
  headFiles: inferredFactoryFiles
});
const inferredFactoryType = inferredFactoryProject.outputProjectSymbolGraph.compilerTypeRecords.find((record) => (
  record.publicContract
    && record.fullyQualifiedName === '"src/factory".createOptions'
    && record.typeText === '(enabled?: boolean) => { enabled: boolean; retries: number; }'
));
assert.equal(inferredFactoryProject.status, 'merged');
assert.equal(inferredFactoryProject.outputProjectImport.metadata.outputProjectImportSource.matchedSuppliedImports, 1);
assert.equal(inferredFactoryProject.outputProjectImport.metadata.outputProjectImportSource.scannerFallbackImports, 0);
assert.equal(Boolean(inferredFactoryType?.apiSignatureHash), true);
assert.equal(hasCompilerCallSignature(inferredFactoryType, {
  signatureText: '(enabled?: boolean): { enabled: boolean; retries: number; }',
  returnTypeText: '{ enabled: boolean; retries: number; }',
  parameterName: 'enabled',
  parameterTypeText: 'boolean'
}), true);
assert.equal(inferredFactoryProject.admission.autoMergeClaim, false);
assert.equal(inferredFactoryProject.admission.semanticEquivalenceClaim, false);

const overloadedReaderFiles = {
  'src/reader.ts': [
    'export function read(input: string): string;',
    'export function read(input: number): number;',
    'export function read(input: string | number): string | number {',
    '  return input;',
    '}',
    ''
  ].join('\n')
};
const overloadedReaderProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_overload_type_equivalence_gap',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: await parserBackedImportsForFiles(overloadedReaderFiles),
  baseFiles: {},
  workerFiles: {},
  headFiles: overloadedReaderFiles
});
const overloadedReaderType = overloadedReaderProject.outputProjectSymbolGraph.compilerTypeRecords.find((record) => (
  record.publicContract
    && record.fullyQualifiedName === '"src/reader".read'
    && hasCompilerCallSignature(record, {
      signatureText: '(input: string): string',
      returnTypeText: 'string',
      parameterName: 'input',
      parameterTypeText: 'string'
    })
    && hasCompilerCallSignature(record, {
      signatureText: '(input: number): number',
      returnTypeText: 'number',
      parameterName: 'input',
      parameterTypeText: 'number'
    })
));
assert.equal(overloadedReaderProject.status, 'merged');
assert.equal(overloadedReaderProject.outputProjectImport.metadata.outputProjectImportSource.matchedSuppliedImports, 1);
assert.equal(overloadedReaderProject.outputProjectImport.metadata.outputProjectImportSource.scannerFallbackImports, 0);
assert.equal(Boolean(overloadedReaderType?.apiSignatureHash), true);
assert.equal(overloadedReaderType?.declarationCount, 3);
assert.equal(overloadedReaderType?.callSignatureCount, 2);
assert.equal(overloadedReaderType?.overloadSignatureCount, 2);
assert.equal(overloadedReaderType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(overloadedReaderType?.typeEquivalenceReasonCodes, undefined);
assert.equal(Boolean(overloadedReaderType?.typeEquivalenceSignatureSetHash), true);
assert.equal(overloadedReaderType?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-signature-set-equivalence');
assert.equal(overloadedReaderType?.typeEquivalenceProof?.status, 'passed');
assert.equal(overloadedReaderType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(overloadedReaderType?.typeEquivalenceCheckerEvidence?.signatureTexts?.length, 2);
assert.equal(overloadedReaderProject.admission.autoMergeClaim, false);
assert.equal(overloadedReaderProject.admission.semanticEquivalenceClaim, false);

const genericBoxFiles = {
  'src/box.ts': [
    'export interface Box<T extends string = string> {',
    '  value: T;',
    '}',
    ''
  ].join('\n')
};
const genericBoxProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_generic_type_parameter_default_equivalence',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: await parserBackedImportsForFiles(genericBoxFiles),
  baseFiles: {},
  workerFiles: {},
  headFiles: genericBoxFiles
});
const genericBoxType = genericBoxProject.outputProjectSymbolGraph.compilerTypeRecords.find((record) => (
  record.publicContract
    && record.fullyQualifiedName === '"src/box".Box'
    && hasCompilerTypeParameter(record, { name: 'T', constraintTypeText: 'string', defaultTypeText: 'string' })
));
assert.equal(genericBoxProject.status, 'merged');
assert.equal(genericBoxProject.outputProjectImport.metadata.outputProjectImportSource.matchedSuppliedImports, 1);
assert.equal(genericBoxProject.outputProjectImport.metadata.outputProjectImportSource.scannerFallbackImports, 0);
assert.equal(Boolean(genericBoxType?.apiSignatureHash), true);
assert.equal(genericBoxType?.typeParameterCount, 1);
assert.equal(genericBoxType?.typeParameterDefaultCount, 1);
assert.equal(genericBoxType?.typeParameterConstraintCount, 1);
assert.equal(genericBoxType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(Boolean(genericBoxType?.typeEquivalenceTypeParameterSetHash), true);
assert.equal(genericBoxType?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-generic-parameter-equivalence');
assert.equal(genericBoxType?.typeEquivalenceProof?.status, 'passed');
assert.equal(genericBoxType?.typeEquivalenceProof?.typeParameterDefaultCount, 1);
assert.equal(genericBoxType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(genericBoxType?.typeEquivalenceCheckerEvidence?.typeParameterDefaultTypeTexts?.[0], 'string');
assert.equal(genericBoxProject.admission.autoMergeClaim, false);
assert.equal(genericBoxProject.admission.semanticEquivalenceClaim, false);

function optionsSource(extraMembers) {
  return ['export interface Options {', '  enabled: boolean;', ...extraMembers, '}', ''].join('\n');
}

function privateOptionsSource(extraMembers) {
  return [
    'export interface Options {',
    '  enabled: boolean;',
    '}',
    'interface InternalOptions {',
    '  cache: boolean;',
    ...extraMembers,
    '}',
    ''
  ].join('\n');
}

function hasCompilerProperty(record, name, typeText) {
  return Boolean(record?.properties?.some((property) => property.name === name && (
    property.typeText === typeText || property.typeText === `${typeText} | undefined`
  )));
}

function hasCompilerCallSignature(record, expected) {
  return Boolean(record?.callSignatures?.some((signature) => (
    signature.signatureText === expected.signatureText
      && signature.returnTypeText === expected.returnTypeText
      && signature.parameters?.some((parameter) => parameter.name === expected.parameterName && parameter.typeText === expected.parameterTypeText)
  )));
}

function hasCompilerTypeParameter(record, expected) {
  return Boolean(record?.typeParameters?.some((parameter) => Object.entries(expected).every(([key, value]) => parameter[key] === value)));
}

function parserBackedImportsForFiles(files) {
  const program = typeScriptProgramForFiles(files);
  const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript, program });
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(adapter, {
    language: 'typescript',
    sourcePath,
    sourceText,
    adapterOptions: { sourceFile: program.getSourceFile(sourcePath) }
  })));
}

function typeScriptProgramForFiles(files) {
  const compilerOptions = {
    target: typescript.ScriptTarget.Latest,
    module: typescript.ModuleKind.ESNext,
    noLib: true,
    strict: true
  };
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
