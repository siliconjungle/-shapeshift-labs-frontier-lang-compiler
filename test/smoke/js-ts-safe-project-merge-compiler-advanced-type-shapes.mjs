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

const advancedFiles = { 'src/types.ts': advancedTypesSource('string') };
const advancedGraph = await compilerGraph(advancedFiles, 'advanced_shapes');
const advancedRecords = advancedGraph.compilerTypeRecords.filter((record) => record.publicContract && record.advancedTypeShapeCount > 0);
const allKinds = new Set(advancedRecords.flatMap((record) => record.advancedTypeShapeKinds ?? []));
assert.equal(allKinds.has('conditional-type'), true);
assert.equal(allKinds.has('mapped-type'), true);
assert.equal(allKinds.has('indexed-access-type'), true);
assert.equal(allKinds.has('keyof-type-operator'), true);

const conditionalRecord = advancedRecords.find((record) => hasShape(record, 'conditional-type'));
const mappedRecord = advancedRecords.find((record) => hasShape(record, 'mapped-type') && record.mappedTypeCount < record.advancedTypeShapeCount);
const indexedRecord = advancedRecords.find((record) => hasShape(record, 'indexed-access-type') && record.indexedAccessTypeCount === record.advancedTypeShapeCount);
const keyofRecord = advancedRecords.find((record) => hasShape(record, 'keyof-type-operator') && record.keyofTypeOperatorCount === record.advancedTypeShapeCount);

assert.equal(conditionalRecord?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(conditionalRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-conditional-type-shape-equivalence');
assert.equal(conditionalRecord?.typeEquivalenceProof?.status, 'passed');
assert.equal(conditionalRecord?.typeEquivalenceProof?.autoMergeClaim, false);
assert.equal(conditionalRecord?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(typeof conditionalRecord?.typeEquivalenceConditionalTypeSetHash, 'string');
assert.equal(conditionalRecord?.typeEquivalenceProof?.conditionalTypeSetHash, conditionalRecord?.typeEquivalenceConditionalTypeSetHash);
assert.equal(conditionalRecord?.typeEquivalenceCheckerEvidence?.conditionalTypeCheckTypeTexts?.length, conditionalRecord?.conditionalTypeCount);
assert.equal(conditionalRecord?.typeEquivalenceCheckerEvidence?.conditionalTypeExtendsTypeTexts?.length, conditionalRecord?.conditionalTypeCount);
assert.equal(conditionalRecord?.typeEquivalenceCheckerEvidence?.conditionalTypeTrueTypeTexts?.length, conditionalRecord?.conditionalTypeCount);
assert.equal(conditionalRecord?.typeEquivalenceCheckerEvidence?.conditionalTypeFalseTypeTexts?.length, conditionalRecord?.conditionalTypeCount);

assert.equal(indexedRecord?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(indexedRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-indexed-access-type-shape-equivalence');
assert.equal(indexedRecord?.typeEquivalenceProof?.status, 'passed');
assert.equal(indexedRecord?.typeEquivalenceProof?.autoMergeClaim, false);
assert.equal(indexedRecord?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(typeof indexedRecord?.typeEquivalenceIndexedAccessTypeSetHash, 'string');
assert.equal(indexedRecord?.typeEquivalenceProof?.indexedAccessTypeSetHash, indexedRecord?.typeEquivalenceIndexedAccessTypeSetHash);
assert.equal(indexedRecord?.typeEquivalenceCheckerEvidence?.indexedAccessTypeTypeTexts?.length, indexedRecord?.indexedAccessTypeCount);
assert.equal(indexedRecord?.typeEquivalenceCheckerEvidence?.indexedAccessTypeObjectTypeTexts?.length, indexedRecord?.indexedAccessTypeCount);
assert.equal(indexedRecord?.typeEquivalenceCheckerEvidence?.indexedAccessTypeIndexTypeTexts?.length, indexedRecord?.indexedAccessTypeCount);

assert.equal(keyofRecord?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(keyofRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-keyof-type-operator-shape-equivalence');
assert.equal(keyofRecord?.typeEquivalenceProof?.status, 'passed');
assert.equal(typeof keyofRecord?.typeEquivalenceKeyofTypeOperatorSetHash, 'string');
assert.equal(keyofRecord?.typeEquivalenceProof?.keyofTypeOperatorSetHash, keyofRecord?.typeEquivalenceKeyofTypeOperatorSetHash);
assert.equal(keyofRecord?.typeEquivalenceCheckerEvidence?.keyofTypeOperatorTargetTypeTexts?.length, keyofRecord?.keyofTypeOperatorCount);

assert.equal(mappedRecord?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(mappedRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-advanced-type-shape-set-equivalence');
assert.equal(mappedRecord?.typeEquivalenceProof?.status, 'passed');
assert.equal(mappedRecord?.typeEquivalenceProof?.autoMergeClaim, false);
assert.equal(mappedRecord?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(mappedRecord?.typeEquivalenceCheckerEvidence?.advancedTypeShapeNodeTexts?.length, mappedRecord?.advancedTypeShapeCount);
assert.equal(mappedRecord?.typeEquivalenceCheckerEvidence?.advancedTypeShapeTypeTexts?.length, mappedRecord?.advancedTypeShapeCount);
assert.equal(typeof mappedRecord?.typeEquivalenceMappedTypeSetHash, 'string');
assert.equal(typeof mappedRecord?.typeEquivalenceIndexedAccessTypeSetHash, 'string');
assert.equal(typeof mappedRecord?.typeEquivalenceKeyofTypeOperatorSetHash, 'string');
assert.equal(mappedRecord?.typeEquivalenceProof?.unsupportedSignals, undefined);
assert.equal(Boolean(mappedRecord?.advancedTypeShapes?.some((shape) => shape.mappedConstraintTypeText?.includes('keyof'))), true);
assert.equal(Boolean(indexedRecord?.advancedTypeShapes?.some((shape) => shape.objectTypeText && shape.indexTypeText)), true);
assert.equal(Boolean(keyofRecord?.advancedTypeShapes?.some((shape) => shape.keyofTargetTypeText)), true);

const changedGraph = await compilerGraph({ 'src/types.ts': advancedTypesSource('number') }, 'advanced_changed');
const advancedConflicts = publicCompilerTypeDeltaConflicts(advancedGraph, changedGraph, changedGraph, changedGraph);
assert.equal(advancedConflicts.length, 0);

const changedWithoutProofGraph = await compilerGraph(
  { 'src/types.ts': advancedTypesSource('number') },
  'advanced_changed_missing_conditional_proof',
  (imports) => importsWithoutShapeKey(imports, 'conditional-type', 'trueTypeText')
);
const missingProofConflicts = publicCompilerTypeDeltaConflicts(advancedGraph, changedWithoutProofGraph, changedWithoutProofGraph, changedWithoutProofGraph);
const missingConditionalProofConflict = missingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(Boolean(missingConditionalProofConflict), true);
assert.equal(missingConditionalProofConflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
  record.missingSignals?.includes('compiler-conditional-type-true-type-texts')
)), true);

const changedWithoutMixedProofGraph = await compilerGraph(
  { 'src/types.ts': advancedTypesSource('number') },
  'advanced_changed_missing_mixed_mapped_value_proof',
  (imports) => importsWithoutShapeKey(imports, 'mapped-type', 'mappedValueTypeText')
);
const missingMixedProofConflicts = publicCompilerTypeDeltaConflicts(advancedGraph, changedWithoutMixedProofGraph, changedWithoutMixedProofGraph, changedWithoutMixedProofGraph);
const missingMixedProofConflict = missingMixedProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(Boolean(missingMixedProofConflict), true);
assert.equal(missingMixedProofConflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
  record.missingSignals?.includes('compiler-mapped-type-value-type-texts')
)), true);

const indexedBaseGraph = await compilerGraph({ 'src/indexed.ts': indexedTypesSource('string') }, 'indexed_base');
const indexedChangedGraph = await compilerGraph({ 'src/indexed.ts': indexedTypesSource('number') }, 'indexed_changed');
assert.equal(publicCompilerTypeDeltaConflicts(indexedBaseGraph, indexedChangedGraph, indexedChangedGraph, indexedChangedGraph).length, 0);

for (const [label, omittedKey, missingSignal] of [
  ['type_text', 'typeText', 'compiler-indexed-access-type-type-texts'],
  ['object_type_text', 'objectTypeText', 'compiler-indexed-access-type-object-type-texts'],
  ['index_type_text', 'indexTypeText', 'compiler-indexed-access-type-index-type-texts']
]) {
  const missingIndexedProofGraph = await compilerGraph(
    { 'src/indexed.ts': indexedTypesSource('number') },
    `indexed_changed_missing_${label}`,
    (imports) => importsWithoutShapeKey(imports, 'indexed-access-type', omittedKey)
  );
  const conflicts = publicCompilerTypeDeltaConflicts(indexedBaseGraph, missingIndexedProofGraph, missingIndexedProofGraph, missingIndexedProofGraph);
  const missingProofConflict = conflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
  assert.equal(Boolean(missingProofConflict), true);
  assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
    record.missingSignals?.includes(missingSignal)
  )), true);
}

const indexedWorkerGraph = await compilerGraph({ 'src/indexed.ts': indexedTypesSource('number') }, 'indexed_worker_number');
const indexedHeadGraph = await compilerGraph({ 'src/indexed.ts': indexedTypesSource('boolean') }, 'indexed_head_boolean');
const divergentIndexedConflicts = publicCompilerTypeDeltaConflicts(indexedBaseGraph, indexedWorkerGraph, indexedHeadGraph, indexedWorkerGraph);
const divergentIndexedConflict = divergentIndexedConflicts.find((conflict) => (
  conflict.details?.worker?.typeEquivalenceIndexedAccessTypeSetHash
    && conflict.details?.head?.typeEquivalenceIndexedAccessTypeSetHash
));
assert.equal(Boolean(divergentIndexedConflict), true);
assert.equal(divergentIndexedConflict.details.reasonCode, 'project-public-compiler-type-delta-conflict');

const mappedBaseGraph = await compilerGraph({ 'src/mapped.ts': mappedTypesSource('string') }, 'mapped_base');
const mappedChangedGraph = await compilerGraph({ 'src/mapped.ts': mappedTypesSource('number') }, 'mapped_changed');
const mappedProofRecord = mappedChangedGraph.compilerTypeRecords.find((record) => record.publicContract && record.mappedTypeCount === record.advancedTypeShapeCount);
assert.equal(mappedProofRecord?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(mappedProofRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-mapped-type-shape-equivalence');
assert.equal(typeof mappedProofRecord?.typeEquivalenceMappedTypeSetHash, 'string');
assert.equal(mappedProofRecord?.typeEquivalenceProof?.mappedTypeSetHash, mappedProofRecord?.typeEquivalenceMappedTypeSetHash);
assert.equal(mappedProofRecord?.typeEquivalenceCheckerEvidence?.mappedTypeConstraintTypeTexts?.length, mappedProofRecord?.mappedTypeCount);
assert.equal(mappedProofRecord?.typeEquivalenceCheckerEvidence?.mappedTypeValueTypeTexts?.length, mappedProofRecord?.mappedTypeCount);
assert.equal(publicCompilerTypeDeltaConflicts(mappedBaseGraph, mappedChangedGraph, mappedChangedGraph, mappedChangedGraph).length, 0);

for (const [label, omittedKey, missingSignal] of [
  ['constraint_type', 'mappedConstraintTypeText', 'compiler-mapped-type-constraint-type-texts'],
  ['value_type', 'mappedValueTypeText', 'compiler-mapped-type-value-type-texts']
]) {
  const missingMappedProofGraph = await compilerGraph(
    { 'src/mapped.ts': mappedTypesSource('number') },
    `mapped_changed_missing_${label}`,
    (imports) => importsWithoutShapeKey(imports, 'mapped-type', omittedKey)
  );
  const conflicts = publicCompilerTypeDeltaConflicts(mappedBaseGraph, missingMappedProofGraph, missingMappedProofGraph, missingMappedProofGraph);
  const missingProofConflict = conflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
  assert.equal(Boolean(missingProofConflict), true);
  assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
    record.missingSignals?.includes(missingSignal)
  )), true);
}

const mappedHeadGraph = await compilerGraph({ 'src/mapped.ts': mappedTypesSource('boolean') }, 'mapped_head_boolean');
const divergentMappedConflict = publicCompilerTypeDeltaConflicts(mappedBaseGraph, mappedChangedGraph, mappedHeadGraph, mappedChangedGraph).find((conflict) => (
  conflict.details?.worker?.typeEquivalenceMappedTypeSetHash
    && conflict.details?.head?.typeEquivalenceMappedTypeSetHash
));
assert.equal(Boolean(divergentMappedConflict), true);
assert.equal(divergentMappedConflict.details.reasonCode, 'project-public-compiler-type-delta-conflict');

const keyofBaseGraph = await compilerGraph({ 'src/keyof.ts': keyofTypesSource('ModelA') }, 'keyof_base');
const keyofChangedGraph = await compilerGraph({ 'src/keyof.ts': keyofTypesSource('ModelB') }, 'keyof_changed');
assert.equal(publicCompilerTypeDeltaConflicts(keyofBaseGraph, keyofChangedGraph, keyofChangedGraph, keyofChangedGraph).length, 0);

const missingKeyofProofGraph = await compilerGraph(
  { 'src/keyof.ts': keyofTypesSource('ModelB') },
  'keyof_changed_missing_target_type',
  (imports) => importsWithoutShapeKey(imports, 'keyof-type-operator', 'keyofTargetTypeText')
);
const missingKeyofConflicts = publicCompilerTypeDeltaConflicts(keyofBaseGraph, missingKeyofProofGraph, missingKeyofProofGraph, missingKeyofProofGraph);
const missingKeyofConflict = missingKeyofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(Boolean(missingKeyofConflict), true);
assert.equal(missingKeyofConflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
  record.missingSignals?.includes('compiler-keyof-type-operator-target-type-texts')
)), true);

const keyofHeadGraph = await compilerGraph({ 'src/keyof.ts': keyofTypesSource('ModelC') }, 'keyof_head_model_c');
const divergentKeyofConflict = publicCompilerTypeDeltaConflicts(keyofBaseGraph, keyofChangedGraph, keyofHeadGraph, keyofChangedGraph).find((conflict) => (
  conflict.details?.worker?.typeEquivalenceKeyofTypeOperatorSetHash
    && conflict.details?.head?.typeEquivalenceKeyofTypeOperatorSetHash
));
assert.equal(Boolean(divergentKeyofConflict), true);
assert.equal(divergentKeyofConflict.details.reasonCode, 'project-public-compiler-type-delta-conflict');

function advancedTypesSource(conditionValue) {
  return [
    'export interface Model {',
    '  id: string;',
    '  count: number;',
    '}',
    `export type Conditional<T> = T extends ${conditionValue} ? { value: T } : never;`,
    'export type PickModel = { [P in keyof Model]: Model[P] };',
    'export type ModelId = Model["id"];',
    'export type ModelKeys = keyof Model;',
    ''
  ].join('\n');
}

function indexedTypesSource(idType) {
  return [
    'export interface Model {',
    `  id: ${idType};`,
    '  count: number;',
    '}',
    'export type ModelId = Model["id"];',
    ''
  ].join('\n');
}

function mappedTypesSource(valueType) {
  return [
    `export type Flags = { [P in "enabled" | "visible"]: ${valueType}; };`,
    ''
  ].join('\n');
}

function keyofTypesSource(targetName) {
  return [
    'export interface ModelA { a: string; }',
    'export interface ModelB { b: number; }',
    'export interface ModelC { c: boolean; }',
    `export type ModelKeys = keyof ${targetName};`,
    ''
  ].join('\n');
}

function hasShape(record, kind) {
  return Boolean(record?.advancedTypeShapes?.some((shape) => shape.kind === kind));
}

async function compilerGraph(files, id, transformImports = (imports) => imports) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_advanced_type_shapes_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    outputProjectImports: transformImports(await importsForFiles(files)),
    baseFiles: {},
    workerFiles: {},
    headFiles: files
  });
  assert.equal(project.status, 'merged');
  assert.equal(project.admission.autoMergeClaim, false);
  assert.equal(project.admission.semanticEquivalenceClaim, false);
  return project.outputProjectSymbolGraph;
}

function importsWithoutShapeKey(imports, kind, key) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? {
            ...fact,
            value: {
              ...fact.value,
              advancedTypeShapes: (fact.value?.advancedTypeShapes ?? []).map((shape) => shape.kind === kind
                ? omitKey(shape, key)
                : shape)
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
