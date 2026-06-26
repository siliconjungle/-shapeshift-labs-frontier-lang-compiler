import { assert } from './helpers.mjs';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const handlerBaseFiles = { 'src/handler.ts': handlerSource('number') };
const handlerVariantFiles = { 'src/handler.ts': `// source-only comment\n${handlerSource('number')}` };
const handlerBaseGraph = await compilerGraph(handlerBaseFiles, undefined, 'handler_base');
const handlerVariantGraph = await compilerGraph(handlerVariantFiles, undefined, 'handler_variant');
const handlerBaseType = publicCompilerType(handlerBaseGraph, '"src/handler".Handler');
const handlerVariantType = publicCompilerType(handlerVariantGraph, '"src/handler".Handler');
assert.notEqual(handlerVariantType.sourceHash, handlerBaseType.sourceHash);
assert.equal(handlerVariantType.callSignatureCount, 1);
assert.equal(handlerVariantType.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(handlerVariantType.typeEquivalenceCallSignatureSetHash, handlerBaseType.typeEquivalenceCallSignatureSetHash);
assert.equal(handlerVariantType.callableSignatureEquivalenceProof.kind, 'typescript-checker-public-api-call-signature-shape-equivalence');
assert.equal(handlerVariantType.callableSignatureEquivalenceProof.status, 'passed');
assert.equal(handlerVariantType.callableSignatureEquivalenceProof.semanticEquivalenceClaim, false);
assert.equal(handlerVariantType.typeEquivalenceProof.callSignatureSetHash, handlerVariantType.typeEquivalenceCallSignatureSetHash);
assert.equal(handlerVariantType.typeEquivalenceCheckerEvidence.callSignatureTexts[0], '(event: string, retry?: boolean | undefined): number');

const constructBaseFiles = { 'src/factory.ts': constructSource('Widget') };
const constructVariantFiles = { 'src/factory.ts': constructSource('Widget', '  readonly stable?: true;') };
const constructBaseGraph = await compilerGraph(constructBaseFiles, undefined, 'construct_base');
const constructVariantGraph = await compilerGraph(constructVariantFiles, undefined, 'construct_variant');
const constructBaseType = publicCompilerType(constructBaseGraph, '"src/factory".WidgetFactory');
const constructVariantType = publicCompilerType(constructVariantGraph, '"src/factory".WidgetFactory');
assert.equal(constructVariantType.constructSignatureCount, 1);
assert.equal(constructVariantType.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(constructVariantType.typeEquivalenceConstructSignatureSetHash, constructBaseType.typeEquivalenceConstructSignatureSetHash);
assert.equal(constructVariantType.callableSignatureEquivalenceProof.kind, 'typescript-checker-public-api-construct-signature-shape-equivalence');
assert.equal(constructVariantType.callableSignatureEquivalenceProof.status, 'passed');

const changedHandlerFiles = { 'src/handler.ts': handlerSource('string') };
const changedWithProofGraph = await compilerGraph(changedHandlerFiles, undefined, 'handler_changed_proof');
const changedWithoutProofGraph = await compilerGraph(changedHandlerFiles, importsWithoutCallReturnTypeEvidence, 'handler_changed_missing_call_return_proof');
const missingProofConflicts = publicCompilerTypeDeltaConflicts(handlerBaseGraph, changedWithoutProofGraph, changedWithoutProofGraph, changedWithoutProofGraph);
const missingProofConflict = missingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(missingProofConflicts.length, 1);
assert.equal(Boolean(missingProofConflict), true);
assert.equal(
  missingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-call-signature-return-type-texts-missing'),
  true
);
assert.equal(publicCompilerTypeDeltaConflicts(handlerBaseGraph, changedWithProofGraph, changedWithProofGraph, undefined).length, 0);

function handlerSource(returnType) {
  return `export type Handler = (event: string, retry?: boolean) => ${returnType};\n`;
}

function constructSource(returnType, ...extraWidgetMembers) {
  return [
    'export interface Widget {',
    '  readonly id: string;',
    ...extraWidgetMembers,
    '}',
    'export interface WidgetFactory {',
    `  new (id: string): ${returnType};`,
    '}',
    ''
  ].join('\n');
}

function publicCompilerType(graph, fullyQualifiedName) {
  const record = graph.compilerTypeRecords.find((item) => item.publicContract && item.fullyQualifiedName === fullyQualifiedName);
  assert.ok(record, `missing public compiler type ${fullyQualifiedName}`);
  return record;
}

async function compilerGraph(files, transformImports = (imports) => imports, id = 'graph') {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_callable_signature_${id}`,
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

function importsWithoutCallReturnTypeEvidence(imports) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? { ...fact, value: { ...fact.value, callSignatures: (fact.value?.callSignatures ?? []).map((signature) => omitKey(signature, 'returnTypeText')) } }
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
