import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;
const serviceClassFiles = { 'src/service.ts': [
  'export class Service {',
  '  readonly id: string = "";',
  '  optional?: boolean;',
  '  load(input: string): number { return 1; }',
  '}',
  ''
].join('\n') };
const serviceClassProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_public_class_member_property_type_equivalence',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: await parserBackedImportsForFiles(serviceClassFiles),
  baseFiles: {},
  workerFiles: {},
  headFiles: serviceClassFiles
});
const serviceClassType = serviceClassProject.outputProjectSymbolGraph.compilerTypeRecords.find((record) => (
  record.publicContract && record.fullyQualifiedName === '"src/service".Service'
    && hasCompilerProperty(record, 'id', 'string')
    && hasCompilerProperty(record, 'optional', 'boolean')
    && hasCompilerProperty(record, 'load', '(input: string) => number')
));
assert.equal(serviceClassProject.status, 'merged');
assert.equal(serviceClassType?.propertyCount, 3);
assert.equal(serviceClassType?.propertyOptionalCount, 1);
assert.equal(serviceClassType?.propertyReadonlyCount, 1);
assert.equal(serviceClassType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(serviceClassType?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-member-property-signature-equivalence');
assert.equal(serviceClassType?.typeEquivalenceProof?.propertySetHash, serviceClassType?.typeEquivalencePropertySetHash);
assert.equal(serviceClassType?.typeEquivalenceProof?.propertyOptionalCount, 1);
assert.equal(serviceClassType?.typeEquivalenceProof?.propertyReadonlyCount, 1);
assert.deepEqual(serviceClassType?.typeEquivalenceCheckerEvidence?.propertyOptionality, [false, false, true]);
assert.deepEqual(serviceClassType?.typeEquivalenceCheckerEvidence?.propertyReadonly, [true, false, false]);
assert.equal(serviceClassType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(hasCompilerPropertyModifiers(serviceClassType, 'id', { optional: false, readonly: true }), true);
assert.equal(hasCompilerPropertyModifiers(serviceClassType, 'optional', { optional: true, readonly: false }), true);
assert.equal(serviceClassProject.admission.semanticEquivalenceClaim, false);

function hasCompilerProperty(record, name, typeText) {
  return Boolean(record?.properties?.some((property) => property.name === name && (
    property.typeText === typeText || property.typeText === `${typeText} | undefined`
  )));
}

function hasCompilerPropertyModifiers(record, name, expected) {
  return Boolean(record?.properties?.some((property) => (
    property.name === name && Object.entries(expected).every(([key, value]) => property[key] === value)
  )));
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
