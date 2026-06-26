import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';
import { typeScriptProgramForFiles } from './js-ts-compiler-program-helpers.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const baseGraph = await compilerGraph({ 'src/status.ts': enumSource('1', '2') }, 'enum_base');
const enumRecord = enumTypeRecord(baseGraph, 'Status');
assert.equal(enumRecord.enumKind, 'enum');
assert.equal(enumRecord.enumMemberCount, 2);
assert.equal(enumRecord.enumNumericMemberCount, 2);
assert.equal(enumRecord.enumRuntimeShapeProof.kind, 'typescript-checker-public-api-enum-runtime-shape-evidence');
assert.equal(enumRecord.enumRuntimeShapeProof.status, 'passed');
assert.equal(enumRecord.enumRuntimeShapeProof.autoMergeClaim, false);
assert.equal(enumRecord.enumRuntimeShapeProof.semanticEquivalenceClaim, false);
assert.equal(enumRecord.enumRuntimeShapeProof.runtimeEquivalenceClaim, false);
assert.equal(enumRecord.enumMembers.some((member) => member.name === 'Open' && member.valueText === '1'), true);
assert.equal(enumRecord.enumMembers.some((member) => member.name === 'Closed' && member.valueText === '2'), true);
assert.equal(enumRecord.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(enumRecord.typeEquivalenceEnumRuntimeShapeHash, enumRecord.enumRuntimeShapeHash);
assert.equal(enumRecord.typeEquivalenceProof.enumRuntimeShapeHash, enumRecord.enumRuntimeShapeHash);
assert.equal(enumRecord.typeEquivalenceProof.proofLevel.includes('enum-runtime-shape'), true);

const sameWorkerGraph = await compilerGraph({ 'src/status.ts': enumSource('10', '2') }, 'enum_same_worker');
const sameHeadGraph = await compilerGraph({ 'src/status.ts': enumSource('10', '2') }, 'enum_same_head');
assert.equal(publicCompilerTypeDeltaConflicts(baseGraph, sameWorkerGraph, sameHeadGraph, sameWorkerGraph).length, 0);

const divergentWorkerGraph = await compilerGraph({ 'src/status.ts': enumSource('10', '2') }, 'enum_worker_open_10');
const divergentHeadGraph = await compilerGraph({ 'src/status.ts': enumSource('20', '2') }, 'enum_head_open_20');
const divergentConflict = publicCompilerTypeDeltaConflicts(baseGraph, divergentWorkerGraph, divergentHeadGraph, divergentWorkerGraph).find((conflict) => (
  conflict.details?.worker?.enumRuntimeShapeHash && conflict.details?.head?.enumRuntimeShapeHash
));
assert.equal(Boolean(divergentConflict), true);
assert.equal(divergentConflict.details.reasonCode, 'project-public-compiler-type-delta-conflict');
assert.notEqual(divergentConflict.details.worker.enumRuntimeShapeHash, divergentConflict.details.head.enumRuntimeShapeHash);

const missingProofGraph = await compilerGraph(
  { 'src/status.ts': enumSource('10', '2') },
  'enum_changed_missing_shape_hash',
  importsWithoutEnumShapeHash
);
const missingProofConflict = publicCompilerTypeDeltaConflicts(baseGraph, missingProofGraph, missingProofGraph, missingProofGraph).find((conflict) => (
  conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing'
));
assert.equal(Boolean(missingProofConflict), true);
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
  record.missingSignals?.includes('compiler-enum-runtime-shape-hash')
)), true);

const computedGraph = await compilerGraph({ 'src/computed.ts': computedEnumSource() }, 'enum_computed');
const computedRecord = enumTypeRecord(computedGraph, 'Status');
assert.equal(computedRecord.enumComputedMemberCount, 1);
assert.equal(computedRecord.typeEquivalenceStatus, 'unsupported');
assert.equal(computedRecord.typeEquivalenceProof.unsupportedSignals.includes('compiler-enum-computed-runtime-value'), true);
assert.equal(computedRecord.typeEquivalenceProof.semanticEquivalenceClaim, false);

const computedProofGraph = await compilerGraph(
  { 'src/computed.ts': computedEnumSource() },
  'enum_computed_with_runtime_value_proof',
  (imports) => imports,
  { computedEnumRuntimeValueProofProvider: computedEnumRuntimeValueProofProvider() }
);
const computedProofRecord = enumTypeRecord(computedProofGraph, 'Status');
assert.equal(computedProofRecord.enumComputedMemberCount, 1);
assert.equal(computedProofRecord.enumMembers.some((member) => member.computed && member.runtimeValueText === '10' && member.runtimeValueKind === 'number'), true);
assert.equal(typeof computedProofRecord.enumEmittedRuntimeShapeHash, 'string');
assert.equal(computedProofRecord.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(computedProofRecord.typeEquivalenceProof.status, 'passed');
assert.equal(computedProofRecord.typeEquivalenceProof.unsupportedSignals, undefined);
assert.equal(computedProofRecord.typeEquivalenceProof.enumEmittedRuntimeShapeHash, computedProofRecord.enumEmittedRuntimeShapeHash);
assert.equal(computedProofRecord.typeEquivalenceProof.computedEnumRuntimeValueProof.status, 'passed');
assert.equal(computedProofRecord.typeEquivalenceProof.computedEnumRuntimeValueProof.enumEmittedRuntimeShapeHash, computedProofRecord.enumEmittedRuntimeShapeHash);
assert.equal(computedProofRecord.typeEquivalenceProof.computedEnumRuntimeValueProof.computedEnumRuntimeEvaluationEquivalenceClaim, false);
assert.equal(computedProofRecord.typeEquivalenceProof.evidenceIds.includes('computed-enum-runtime-value-proof'), true);
assert.equal(publicCompilerTypeDeltaConflicts(baseGraph, computedProofGraph, computedProofGraph, computedProofGraph).length, 0);

const staleComputedProofGraph = await compilerGraph(
  { 'src/computed.ts': computedEnumSource() },
  'enum_computed_with_stale_runtime_value_proof',
  (imports) => imports,
  { computedEnumRuntimeValueProofProvider: computedEnumRuntimeValueProofProvider({ sourceHash: 'fnv1a32:stale-computed-enum-source' }) }
);
const staleComputedProofRecord = enumTypeRecord(staleComputedProofGraph, 'Status');
assert.equal(staleComputedProofRecord.typeEquivalenceStatus, 'unsupported');
assert.equal(staleComputedProofRecord.typeEquivalenceProof.reasonCodes.includes('typescript-computed-enum-runtime-value-proof-source-hash-mismatch'), true);

const missingRuntimeValueProofGraph = await compilerGraph(
  { 'src/computed.ts': computedEnumSource() },
  'enum_computed_with_missing_runtime_value_proof',
  (imports) => imports,
  { computedEnumRuntimeValueProofProvider: computedEnumRuntimeValueProofProvider({ computedMembers: [] }) }
);
const missingRuntimeValueProofRecord = enumTypeRecord(missingRuntimeValueProofGraph, 'Status');
assert.equal(missingRuntimeValueProofRecord.typeEquivalenceStatus, 'unsupported');
assert.equal(missingRuntimeValueProofRecord.typeEquivalenceProof.reasonCodes.includes('typescript-computed-enum-runtime-value-proof-runtime-value-missing'), true);

const missingTraceProofGraph = await compilerGraph(
  { 'src/computed.ts': computedEnumSource() },
  'enum_computed_with_missing_trace_hash',
  (imports) => imports,
  { computedEnumRuntimeValueProofProvider: computedEnumRuntimeValueProofProvider({ traceHash: undefined }) }
);
const missingTraceProofRecord = enumTypeRecord(missingTraceProofGraph, 'Status');
assert.equal(missingTraceProofRecord.typeEquivalenceStatus, 'unsupported');
assert.equal(missingTraceProofRecord.typeEquivalenceProof.reasonCodes.includes('typescript-computed-enum-runtime-value-proof-trace-hash-missing'), true);

function enumSource(openValue, closedValue) {
  return [
    'export enum Status {',
    `  Open = ${openValue},`,
    `  Closed = ${closedValue},`,
    '}',
    ''
  ].join('\n');
}

function computedEnumSource() {
  return [
    'declare function seed(): number;',
    'export enum Status {',
    '  Open = seed(),',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n');
}

function enumTypeRecord(graph, symbolName) {
  const record = graph.compilerTypeRecords.find((entry) => (
    entry.publicContract && entry.symbolName === symbolName && entry.enumMemberCount > 0
  ));
  assert.equal(Boolean(record), true);
  return record;
}

async function compilerGraph(files, id, transformImports = (imports) => imports, adapterOptions = {}) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_enum_shape_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    outputProjectImports: transformImports(await importsForFiles(files, adapterOptions)),
    baseFiles: {},
    workerFiles: {},
    headFiles: files
  });
  assert.equal(project.status, 'merged');
  assert.equal(project.admission.autoMergeClaim, false);
  assert.equal(project.admission.semanticEquivalenceClaim, false);
  return project.outputProjectSymbolGraph;
}

async function importsForFiles(files, adapterOptions = {}) {
  const program = typeScriptProgramForFiles(typescript, files);
  const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript, program, ...adapterOptions });
  return Promise.all(Object.entries(files).map(([sourcePath, sourceText]) => runNativeImporterAdapter(adapter, {
    language: 'typescript',
    sourcePath,
    sourceText,
    adapterOptions: { sourceFile: program.getSourceFile(sourcePath) }
  })));
}

function importsWithoutEnumShapeHash(imports) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? { ...fact, value: { ...fact.value, enumRuntimeShapeHash: undefined, enumRuntimeShapeProof: undefined } }
        : fact)
    } : importResult.semanticIndex
  }));
}

function computedEnumRuntimeValueProofProvider(overrides = {}) {
  return ({ sourcePath, sourceHash, enumRuntimeShapeHash, enumComputedMemberCount, enumMembers }) => {
    const computedMembers = overrides.computedMembers ?? enumMembers.filter((member) => member.computed).map((member) => ({
      ...member,
      runtimeValueText: '10',
      runtimeValueKind: 'number'
    }));
  const proofValue = {
      enumRuntimeShapeHash,
      enumMembers: enumMembers.map((member) => member.computed
        ? { ...member, ...(computedMembers.find((computed) => computed.name === member.name) ?? {}) }
        : member)
  };
    return {
    id: 'computed-enum-runtime-value-proof',
    schema: 'frontier.lang.typescript.computedEnumRuntimeValueProof.v1',
    status: 'passed',
    sourcePath,
    sourceHash,
      enumRuntimeShapeHash,
      enumComputedMemberCount,
      computedMembers,
    computedEnumRuntimeValueHash: computedEnumRuntimeValueHash(proofValue, { sourcePath, sourceHash }),
    command: 'fixture-computed-enum-runtime-value-proof',
    traceHash: 'fixture-computed-enum-runtime-value-trace-hash',
    evidenceHash: 'fixture-computed-enum-runtime-value-proof-hash',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    computedEnumRuntimeEvaluationEquivalenceClaim: false,
    ...overrides
  };
  };
}

function computedEnumRuntimeValueHash(value, source) {
  return hashSemanticValue({
    kind: 'frontier.lang.typescript.computedEnumRuntimeValueProof.values',
    sourcePath: source.sourcePath,
    sourceHash: source.sourceHash,
    enumRuntimeShapeHash: value.enumRuntimeShapeHash,
    computedMembers: value.enumMembers.filter((member) => member.computed).map((member) => ({
      name: member.name,
      ordinal: member.ordinal,
      declarationOrdinal: member.declarationOrdinal,
      initializerText: member.initializerText,
      runtimeValueText: member.runtimeValueText,
      runtimeValueKind: member.runtimeValueKind
    }))
  });
}
