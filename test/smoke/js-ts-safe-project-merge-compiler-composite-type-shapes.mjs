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

const baseGraph = await compilerGraph({ 'src/composite.ts': compositeTypesSource('"red"', 'number') }, 'base');
const changedGraph = await compilerGraph({ 'src/composite.ts': compositeTypesSource('"green"', 'boolean') }, 'changed');

const unionRecord = publicType(baseGraph, '"src/composite".Token');
const intersectionRecord = publicType(baseGraph, '"src/composite".Both');
const tupleRecord = publicType(baseGraph, '"src/composite".Pair');
assert.equal(unionRecord?.unionTypeCount, 1);
assert.equal(unionRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-union-type-shape-equivalence');
assert.equal(typeof unionRecord?.typeEquivalenceUnionTypeSetHash, 'string');
assert.equal(unionRecord?.typeEquivalenceProof?.unionTypeSetHash, unionRecord?.typeEquivalenceUnionTypeSetHash);
assert.equal(unionRecord?.typeEquivalenceCheckerEvidence?.unionTypeMemberTypeTexts?.[0]?.includes('"red"'), true);
assert.equal(intersectionRecord?.intersectionTypeCount, 1);
assert.equal(intersectionRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-intersection-type-shape-equivalence');
assert.equal(typeof intersectionRecord?.typeEquivalenceIntersectionTypeSetHash, 'string');
assert.equal(intersectionRecord?.typeEquivalenceCheckerEvidence?.intersectionTypeMemberTypeTexts?.[0]?.includes('Named'), true);
assert.equal(tupleRecord?.tupleTypeCount, 1);
assert.equal(tupleRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-tuple-type-shape-equivalence');
assert.equal(typeof tupleRecord?.typeEquivalenceTupleTypeSetHash, 'string');
assert.equal(tupleRecord?.typeEquivalenceCheckerEvidence?.tupleTypeElementTypeTexts?.[0]?.includes('string'), true);
assert.equal(tupleRecord?.typeEquivalenceProof?.autoMergeClaim, false);
assert.equal(tupleRecord?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(publicCompilerTypeDeltaConflicts(baseGraph, changedGraph, changedGraph, changedGraph).length, 0);

for (const [kind, omittedKey, missingSignal] of [
  ['union-type', 'memberTypeTexts', 'compiler-union-type-member-type-texts'],
  ['intersection-type', 'memberTypeTexts', 'compiler-intersection-type-member-type-texts'],
  ['tuple-type', 'tupleElementTypeTexts', 'compiler-tuple-type-element-type-texts']
]) {
  const missingProofGraph = await compilerGraph(
    { 'src/composite.ts': compositeTypesSource('"green"', 'boolean') },
    `missing_${kind}_${omittedKey}`,
    (imports) => importsWithoutShapeKey(imports, kind, omittedKey)
  );
  const conflict = publicCompilerTypeDeltaConflicts(baseGraph, missingProofGraph, missingProofGraph, missingProofGraph)
    .find((item) => item.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
  assert.equal(Boolean(conflict), true);
  assert.equal(conflict.details.typeEquivalenceEvidence.missingRecords.some((record) => record.missingSignals?.includes(missingSignal)), true);
}

function compositeTypesSource(extraLiteral, pairValueType) {
  return [
    'export interface Named { id: string; }',
    'export interface Counted { count: number; }',
    `export type Token = "red" | "blue" | ${extraLiteral};`,
    'export type Both = Named & Counted;',
    `export type Pair = [name: string, value?: ${pairValueType}];`,
    ''
  ].join('\n');
}

function publicType(graph, fullyQualifiedName) {
  return graph.compilerTypeRecords.find((record) => record.publicContract && record.fullyQualifiedName === fullyQualifiedName);
}

async function compilerGraph(files, id, transformImports = (imports) => imports) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_composite_type_shapes_${id}`,
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

function importsWithoutShapeKey(imports, kind, key) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? { ...fact, value: { ...fact.value, advancedTypeShapes: (fact.value?.advancedTypeShapes ?? []).map((shape) => shape.kind === kind ? omitKey(shape, key) : shape) } }
        : fact)
    } : importResult.semanticIndex
  }));
}

function omitKey(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const { [key]: _omitted, ...rest } = value;
  return rest;
}
