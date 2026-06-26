import { assert } from './helpers.mjs';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const baseFiles = { 'src/registry.ts': registrySource('number') };
const variantFiles = { 'src/registry.ts': registrySource('number', '  // implementation-only note keeps the indexer contract stable') };
const baseGraph = await compilerGraph(baseFiles, undefined, 'base');
const variantGraph = await compilerGraph(variantFiles, undefined, 'variant');
const baseRegistryType = publicType(baseGraph, '"src/registry".Registry');
const variantRegistryType = publicType(variantGraph, '"src/registry".Registry');
assert.notEqual(variantRegistryType?.sourceHash, baseRegistryType?.sourceHash);
assert.equal(variantRegistryType?.apiSignatureHash, baseRegistryType?.apiSignatureHash);
assert.equal(variantRegistryType?.indexSignatureCount, 1);
assert.equal(variantRegistryType?.indexSignatureReadonlyCount, 1);
assert.equal(variantRegistryType?.indexSignatures?.[0]?.keyTypeText, 'string');
assert.equal(variantRegistryType?.indexSignatures?.[0]?.valueTypeText, 'number');
assert.equal(variantRegistryType?.indexSignatures?.[0]?.readonly, true);
assert.equal(variantRegistryType?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(variantRegistryType?.typeEquivalenceIndexSignatureSetHash, baseRegistryType?.typeEquivalenceIndexSignatureSetHash);
assert.equal(variantRegistryType?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-index-signature-equivalence');
assert.equal(variantRegistryType?.typeEquivalenceProof?.status, 'passed');
assert.equal(variantRegistryType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);

const changedFiles = { 'src/registry.ts': registrySource('string') };
const changedWithProofGraph = await compilerGraph(changedFiles, undefined, 'changed_proof');
const changedWithoutProofGraph = await compilerGraph(changedFiles, importsWithoutCompilerIndexSignatureValueText, 'changed_missing_proof');
const missingProofConflicts = publicCompilerTypeDeltaConflicts(baseGraph, changedWithoutProofGraph, changedWithoutProofGraph, changedWithoutProofGraph);
const missingProofConflict = missingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(missingProofConflicts.length, 1);
assert.equal(Boolean(missingProofConflict), true);
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords.length > 0, true);
assert.equal(
  missingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceReasonCodes.includes('typescript-compiler-index-signature-value-type-texts-missing'),
  true
);
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords[0].typeEquivalenceIndexSignatureSetHash, undefined);
assert.equal(publicCompilerTypeDeltaConflicts(baseGraph, changedWithProofGraph, changedWithProofGraph, undefined).length, 0);

function registrySource(valueType, ...body) {
  return ['export interface Registry {', ...body, `  readonly [key: string]: ${valueType};`, '}', ''].join('\n');
}

function publicType(graph, fullyQualifiedName) {
  return graph.compilerTypeRecords.find((record) => record.publicContract && record.fullyQualifiedName === fullyQualifiedName);
}

async function compilerGraph(files, transformImports = (imports) => imports, id = 'graph') {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_index_signatures_${id}`,
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

function importsWithoutCompilerIndexSignatureValueText(imports) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? { ...fact, value: { ...fact.value, indexSignatures: (fact.value?.indexSignatures ?? []).map((signature) => omitKey(signature, 'valueTypeText')) } }
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
