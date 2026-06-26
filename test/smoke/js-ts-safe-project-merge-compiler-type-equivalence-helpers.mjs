import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

function readerSource(...body) {
  return [
    'export function read(input: string): string;',
    'export function read(input: number): number;',
    'export function read(input: string | number): string | number {',
    ...body.map((line) => `  ${line}`),
    '}',
    ''
  ].join('\n');
}

function contractSource(numberReturnType) {
  return ['export interface Reader {', '  (input: string): string;', `  (input: number): ${numberReturnType};`, '}', ''].join('\n');
}

function boxSource(defaultType, ...body) {
  return [`export interface Box<T = ${defaultType}> {`, ...body, '  value: T;', '}', ''].join('\n');
}

function optionsSource(labelType, ...body) {
  return ['export interface Options {', ...body, '  readonly id: string;', `  label?: ${labelType};`, '}', ''].join('\n');
}

function aliasSource(typeText, ...body) {
  return [`export type Token = ${typeText};`, ...body, ''].join('\n');
}

function serviceSource(returnType, ...body) {
  return [
    'export class Service {',
    '  readonly id: string = "";',
    `  load(input: string): ${returnType} {`,
    ...body.map((line) => `    ${line}`),
    '  }',
    '}',
    ''
  ].join('\n');
}

function publicReaderType(graph, fullyQualifiedName) {
  return graph.compilerTypeRecords.find((record) => record.publicContract && record.fullyQualifiedName === fullyQualifiedName);
}

async function compilerGraph(files, transformImports = (imports) => imports, id = 'graph') {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_type_equivalence_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    outputProjectImports: transformImports(await importsForFiles(files)),
    baseFiles: {},
    workerFiles: {},
    headFiles: files
  });
  assert.equal(project.status, 'merged');
  assert.equal(project.admission.semanticEquivalenceClaim, false);
  return project.outputProjectSymbolGraph;
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

function importsWithoutCompilerApiSignatureHash(imports) {
  return mapCompilerTypeFacts(imports, (value) => omitKey(value, 'apiSignatureHash'));
}

function importsWithoutCompilerTypeParameterDefaultText(imports) {
  return mapCompilerTypeFacts(imports, (value) => ({
    ...value,
    typeParameters: (value?.typeParameters ?? []).map((parameter) => parameter.hasDefault
      ? omitKey(parameter, 'defaultTypeText')
      : parameter)
  }));
}

function importsWithoutCompilerPropertyTypeText(imports) {
  return mapCompilerTypeFacts(imports, (value) => ({
    ...value,
    properties: (value?.properties ?? []).map((property) => omitKey(property, 'typeText'))
  }));
}

function importsWithoutCompilerPropertyModifierEvidence(imports) {
  return mapCompilerTypeFacts(imports, (value) => ({
    ...value,
    properties: (value?.properties ?? []).map((property) => omitKey(omitKey(property, 'optional'), 'readonly'))
  }));
}

function importsWithAmbiguousAssignabilityOracle(imports) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType' && fact.value?.assignabilityOracle
        ? {
            ...fact,
            value: {
              ...fact.value,
              assignabilityOracle: {
                ...fact.value.assignabilityOracle,
                ambiguous: true,
                equivalentByBidirectionalAssignability: undefined,
                directions: (fact.value.assignabilityOracle.directions ?? []).map((direction) => omitKey(direction, 'assignable'))
              }
            }
          }
        : fact)
    } : importResult.semanticIndex
  }));
}

function importsWithoutDocumentSourceHash(imports) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      documents: (importResult.semanticIndex.documents ?? []).map((document) => omitKey(document, 'sourceHash'))
    } : importResult.semanticIndex
  }));
}

function mapCompilerTypeFacts(imports, mapValue) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? { ...fact, value: mapValue(fact.value) }
        : fact)
    } : importResult.semanticIndex
  }));
}

function omitKey(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const { [key]: _omitted, ...rest } = value;
  return rest;
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

export {
  aliasSource,
  boxSource,
  compilerGraph,
  contractSource,
  importsWithAmbiguousAssignabilityOracle,
  importsWithoutCompilerApiSignatureHash,
  importsWithoutCompilerPropertyModifierEvidence,
  importsWithoutCompilerPropertyTypeText,
  importsWithoutCompilerTypeParameterDefaultText,
  importsWithoutDocumentSourceHash,
  optionsSource,
  publicReaderType,
  readerSource,
  serviceSource
};
