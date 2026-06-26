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

const graph = await compilerGraph({ 'src/inference.ts': inferenceSyntaxSource('string') }, 'inference_base');
const inferenceRecords = graph.compilerTypeRecords.filter((record) => record.publicContract && record.typeInferenceSyntaxCount > 0);
const satisfiesAsConstRecord = inferenceRecords.find((record) => record.satisfiesExpressionCount === 1 && record.asConstAssertionCount === 1);
const constParameterRecord = inferenceRecords.find((record) => record.constTypeParameterCount === 1);

assert.equal(Boolean(satisfiesAsConstRecord), true);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxKinds.includes('satisfies-expression'), true);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxKinds.includes('as-const-assertion'), true);
assert.equal(typeof satisfiesAsConstRecord.typeInferenceSyntaxHash, 'string');
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.kind, 'typescript-checker-public-api-type-inference-syntax-evidence');
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.status, 'passed');
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.sourcePath, satisfiesAsConstRecord.sourcePath);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.sourceHash, satisfiesAsConstRecord.sourceHash);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.sourceBoundPublicApi, true);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.requiredSignals.includes('compiler-public-api-source-path'), true);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.requiredSignals.includes('compiler-public-api-source-hash'), true);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.missingSignals, undefined);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.reasonCodes, undefined);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.autoMergeClaim, false);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntaxProof.semanticEquivalenceClaim, false);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntax.some((record) => record.kind === 'satisfies-expression' && record.typeText.includes('tone:')), true);
assert.equal(satisfiesAsConstRecord.typeInferenceSyntax.some((record) => record.kind === 'as-const-assertion' && record.expressionText.includes('tone')), true);

assert.equal(Boolean(constParameterRecord), true);
assert.equal(constParameterRecord.typeInferenceSyntaxKinds.includes('const-type-parameter'), true);
assert.equal(typeof constParameterRecord.typeInferenceSyntaxHash, 'string');
assert.equal(constParameterRecord.typeInferenceSyntaxProof.sourcePath, constParameterRecord.sourcePath);
assert.equal(constParameterRecord.typeInferenceSyntaxProof.sourceHash, constParameterRecord.sourceHash);
assert.equal(constParameterRecord.typeInferenceSyntaxProof.sourceBoundPublicApi, true);
assert.equal(constParameterRecord.typeInferenceSyntax.some((record) => (
  record.kind === 'const-type-parameter' && record.name === 'T' && record.nodeText.includes('readonly string[]')
)), true);

const sameWorkerGraph = await compilerGraph({ 'src/inference.ts': inferenceSyntaxSource('"blue" | "red"') }, 'same_worker');
const sameHeadGraph = await compilerGraph({ 'src/inference.ts': inferenceSyntaxSource('"blue" | "red"') }, 'same_head');
assert.equal(publicCompilerTypeDeltaConflicts(graph, sameWorkerGraph, sameHeadGraph, sameWorkerGraph).length, 0);

const divergentWorkerGraph = await compilerGraph({ 'src/inference.ts': inferenceSyntaxSource('"blue" | "red"') }, 'worker_red');
const divergentHeadGraph = await compilerGraph({ 'src/inference.ts': inferenceSyntaxSource('"blue" | "green"') }, 'head_green');
const divergentConflicts = publicCompilerTypeDeltaConflicts(graph, divergentWorkerGraph, divergentHeadGraph, divergentWorkerGraph);
const inferenceConflict = divergentConflicts.find((conflict) => (
  conflict.details?.worker?.typeInferenceSyntaxHash && conflict.details?.head?.typeInferenceSyntaxHash
));
assert.equal(Boolean(inferenceConflict), true);
assert.equal(inferenceConflict.details.reasonCode, 'project-public-compiler-type-delta-conflict');
assert.notEqual(inferenceConflict.details.worker.typeInferenceSyntaxHash, inferenceConflict.details.head.typeInferenceSyntaxHash);
assert.equal(inferenceConflict.details.worker.typeInferenceSyntaxProof.semanticEquivalenceClaim, false);

function inferenceSyntaxSource(satisfiesTarget) {
  return [
    `export const palette = { tone: "blue", fixed: true } as const satisfies { tone: ${satisfiesTarget}; fixed: boolean };`,
    'export function tuple<const T extends readonly string[]>(value: T): T {',
    '  return value;',
    '}',
    ''
  ].join('\n');
}

async function compilerGraph(files, id) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_inference_syntax_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    outputProjectImports: await importsForFiles(files),
    baseFiles: {},
    workerFiles: {},
    headFiles: files
  });
  assert.equal(project.status, 'merged');
  assert.equal(project.admission.autoMergeClaim, false);
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
