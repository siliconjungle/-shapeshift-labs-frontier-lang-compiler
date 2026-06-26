import { assert } from './helpers.mjs';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';
import { typeScriptProgramForFiles } from './js-ts-compiler-program-helpers.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const baseFiles = { 'src/service.ts': serviceSource('Base', 'string') };
const changedFiles = { 'src/service.ts': serviceSource('OtherBase', 'number') };
const baseGraph = await compilerGraph(baseFiles, undefined, 'base');
const changedWithProofGraph = await compilerGraph(changedFiles, undefined, 'changed_with_proof');
const changedWithoutProofGraph = await compilerGraph(changedFiles, importsWithoutCompilerClassShapeEvidence, 'changed_missing_class_shape_proof');

const missingProofConflicts = publicCompilerTypeDeltaConflicts(baseGraph, changedWithoutProofGraph, changedWithoutProofGraph, changedWithoutProofGraph);
const missingProofConflict = missingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(missingProofConflicts.length, 1);
assert.equal(Boolean(missingProofConflict), true);
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.requiredEvidence, 'typescript-checker-public-api-type-equivalence');
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords.length > 0, true);
const missingRecord = missingProofConflict.details.typeEquivalenceEvidence.missingRecords[0];
assert.equal(missingRecord.constructorSignatureCount, 1);
assert.equal(missingRecord.classHeritageCount, 2);
assert.equal(missingRecord.typeEquivalenceConstructorSetHash, undefined);
assert.equal(missingRecord.typeEquivalenceClassHeritageHash, undefined);
assert.equal(missingRecord.missingSignals.includes('compiler-constructor-parameter-type-texts'), true);
assert.equal(missingRecord.missingSignals.includes('compiler-class-heritage-type-texts'), true);
assert.equal(missingRecord.typeEquivalenceReasonCodes.includes('typescript-compiler-constructor-parameter-type-texts-missing'), true);
assert.equal(missingRecord.typeEquivalenceReasonCodes.includes('typescript-compiler-class-heritage-type-texts-missing'), true);
assert.equal(missingRecord.semanticEquivalenceClaim, false);
assert.equal(publicCompilerTypeDeltaConflicts(baseGraph, changedWithProofGraph, changedWithProofGraph, undefined).length, 0);

function serviceSource(baseClassName, idType) {
  return [
    'export class Base { protected ready = true; }',
    'export class OtherBase { protected ready = false; }',
    'export interface Runnable { run(): void; }',
    `export class Service extends ${baseClassName} implements Runnable {`,
    `  constructor(public readonly id: ${idType}, attempts: number = 1) {`,
    '    super();',
    '    void attempts;',
    '  }',
    '  run(): void {}',
    '}',
    ''
  ].join('\n');
}

async function compilerGraph(files, transformImports = (imports) => imports, id = 'graph') {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_class_shape_missing_proof_${id}`,
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
  const program = typeScriptProgramForFiles(typescript, files);
  const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript, program });
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(adapter, {
    language: 'typescript',
    sourcePath,
    sourceText,
    adapterOptions: { sourceFile: program.getSourceFile(sourcePath) }
  })));
}

function importsWithoutCompilerClassShapeEvidence(imports) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? {
            ...fact,
            value: {
              ...fact.value,
              constructorSignatures: (fact.value?.constructorSignatures ?? []).map((signature) => ({
                ...signature,
                parameters: (signature.parameters ?? []).map((parameter) => omitKey(parameter, 'typeText'))
              })),
              classHeritage: (fact.value?.classHeritage ?? []).map((heritage) => omitKey(heritage, 'typeText'))
            }
          }
        : fact)
    } : importResult.semanticIndex
  }));
}

function omitKey(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const { [key]: _omitted, ...rest } = value;
  return rest;
}
