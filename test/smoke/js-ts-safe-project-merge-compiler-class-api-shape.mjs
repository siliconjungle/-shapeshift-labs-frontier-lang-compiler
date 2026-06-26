import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const baseFiles = { 'src/service.ts': serviceSource('this.id;') };
const variantFiles = { 'src/service.ts': serviceSource('const value = this.id;', 'void value;') };
const baseGraph = await compilerGraph(baseFiles, 'base');
const variantGraph = await compilerGraph(variantFiles, 'variant');
const baseServiceType = publicType(baseGraph, '"src/service".Service');
const variantServiceType = publicType(variantGraph, '"src/service".Service');

assert.notEqual(variantServiceType?.sourceHash, baseServiceType?.sourceHash);
assert.equal(variantServiceType?.apiSignatureHash, baseServiceType?.apiSignatureHash);
assert.equal(variantServiceType?.constructorSignatureCount, 1);
assert.equal(variantServiceType?.classHeritageCount, 2);
assert.equal(variantServiceType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(variantServiceType?.typeEquivalenceConstructorSetHash, baseServiceType?.typeEquivalenceConstructorSetHash);
assert.equal(variantServiceType?.typeEquivalenceClassHeritageHash, baseServiceType?.typeEquivalenceClassHeritageHash);
assert.equal(variantServiceType?.typeEquivalenceProof?.status, 'passed');
assert.equal(variantServiceType?.typeEquivalenceProof?.constructorSignatureCount, 1);
assert.equal(variantServiceType?.typeEquivalenceProof?.classHeritageCount, 2);
assert.equal(variantServiceType?.typeEquivalenceProof?.constructorSetHash, variantServiceType?.typeEquivalenceConstructorSetHash);
assert.equal(variantServiceType?.typeEquivalenceProof?.classHeritageHash, variantServiceType?.typeEquivalenceClassHeritageHash);
assert.equal(variantServiceType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(hasHeritage(variantServiceType, 'extends', 'Base'), true);
assert.equal(hasHeritage(variantServiceType, 'implements', 'Runnable'), true);
assert.equal(hasConstructorParameter(variantServiceType, { name: 'id', typeText: 'string', accessibility: 'public', parameterProperty: true }), true);
assert.equal(hasConstructorParameter(variantServiceType, { name: 'attempts', typeText: 'number', optional: true }), true);
assert.equal(variantServiceType?.typeEquivalenceCheckerEvidence?.constructorSignatureTexts?.length, 1);
assert.equal(variantServiceType?.typeEquivalenceCheckerEvidence?.classHeritageTypeTexts?.length, 2);

function serviceSource(...constructorBody) {
  return [
    'export class Base { protected ready = true; }',
    'export interface Runnable { run(): void; }',
    'export class Service extends Base implements Runnable {',
    '  constructor(public readonly id: string, attempts: number = 1) {',
    '    super();',
    ...constructorBody.map((line) => `    ${line}`),
    '  }',
    '  run(): void {}',
    '}',
    ''
  ].join('\n');
}

function publicType(graph, fullyQualifiedName) {
  return graph.compilerTypeRecords.find((record) => record.publicContract && record.fullyQualifiedName === fullyQualifiedName);
}

function hasHeritage(record, kind, expressionText) {
  return Boolean(record?.classHeritage?.some((heritage) => heritage.kind === kind && heritage.expressionText === expressionText));
}

function hasConstructorParameter(record, expected) {
  return Boolean(record?.constructorSignatures?.some((signature) => signature.parameters?.some((parameter) => (
    Object.entries(expected).every(([key, value]) => parameter[key] === value)
  ))));
}

async function compilerGraph(files, id) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_class_api_shape_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    outputProjectImports: await importsForFiles(files),
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
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(adapter, {
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
