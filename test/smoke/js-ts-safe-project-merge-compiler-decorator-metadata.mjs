import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import { decoratorRuntimeExecutionHash } from '../../src/internal/index-impl/projectSymbolGraphCompilerDecoratorRuntimeProof.js';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const files = { 'src/service.ts': [
  '@sealed',
  'export class Service {',
  '  @fieldDec value: number = 1;',
  '  @accessorDec accessor count: number = 0;',
  '  @methodDec method(@paramDec input: string): void {}',
  '  @getDec get label(): string { return "x"; }',
  '  @setDec set label(@paramSetDec value: string) {}',
  '  constructor(@ctorParamDec public readonly dep: Dep) {}',
  '}',
  'export interface Dep {}',
  ''
].join('\n') };

const graph = await compilerGraph(files, 'decorators');
const serviceType = graph.compilerTypeRecords.find((record) => (
  record.publicContract && record.fullyQualifiedName === '"src/service".Service'
));
assert.equal(serviceType?.decoratorMetadataCount, 9);
assert.equal(serviceType?.classDecoratorCount, 1);
assert.equal(serviceType?.memberDecoratorCount, 5);
assert.equal(serviceType?.parameterDecoratorCount, 3);
assert.equal(typeof serviceType?.decoratorMetadataHash, 'string');
assert.equal(serviceType?.decoratorMetadataProof?.kind, 'typescript-checker-decorator-static-metadata-evidence');
assert.equal(serviceType?.decoratorMetadataProof?.status, 'passed');
assert.equal(serviceType?.decoratorMetadataProof?.proofScope, 'static-decorator-metadata-only');
assert.equal(serviceType?.decoratorMetadataProof?.staticDecoratorMetadataEvidence, true);
assert.equal(serviceType?.decoratorMetadataProof?.runtimeEquivalenceClaim, false);
assert.equal(serviceType?.decoratorMetadataProof?.decoratorExecutionEquivalenceClaim, false);
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.kind, 'typescript-checker-decorator-runtime-execution-equivalence-gap');
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.status, 'blocked');
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.reasonCode, 'decorator-execution-equivalence-not-claimed');
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.routeId, 'prove-decorator-runtime-execution-equivalence');
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.routeLane, 'decorator-runtime-boundaries');
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.failClosed, true);
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.blocksSemanticEquivalence, true);
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.semanticEquivalenceClaim, false);
assert.equal(serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.decoratorExecutionEquivalenceClaim, false);
assert.equal(serviceType?.decoratorMetadataProof?.conflictRouting?.status, 'fail-closed');
assert.equal(serviceType?.decoratorMetadataProof?.conflictRouting?.branchDivergenceSignal, 'decoratorMetadataHash');
assert.equal(serviceType?.decoratorMetadataProof?.conflictRouting?.routeId, 'prove-decorator-runtime-execution-equivalence');
assert.equal(hasDecorator(serviceType, { kind: 'class-decorator', targetKind: 'class', expressionText: 'sealed' }), true);
assert.equal(hasDecorator(serviceType, { kind: 'member-decorator', targetKind: 'field', memberName: 'value', expressionText: 'fieldDec' }), true);
assert.equal(hasDecorator(serviceType, { kind: 'member-decorator', targetKind: 'accessor-field', memberName: 'count', expressionText: 'accessorDec' }), true);
assert.equal(hasDecorator(serviceType, { kind: 'member-decorator', targetKind: 'method', memberName: 'method', expressionText: 'methodDec' }), true);
assert.equal(hasDecorator(serviceType, { kind: 'member-decorator', targetKind: 'get-accessor', memberName: 'label', expressionText: 'getDec' }), true);
assert.equal(hasDecorator(serviceType, { kind: 'member-decorator', targetKind: 'set-accessor', memberName: 'label', expressionText: 'setDec' }), true);
assert.equal(hasDecorator(serviceType, { kind: 'parameter-decorator', targetKind: 'method-parameter', memberName: 'method', parameterName: 'input', expressionText: 'paramDec' }), true);
assert.equal(hasDecorator(serviceType, { kind: 'parameter-decorator', targetKind: 'set-accessor-parameter', memberName: 'label', parameterName: 'value', expressionText: 'paramSetDec' }), true);
assert.equal(hasDecorator(serviceType, { kind: 'parameter-decorator', targetKind: 'constructor-parameter', memberName: 'constructor', parameterName: 'dep', expressionText: 'ctorParamDec' }), true);
assert.equal(serviceType?.decoratorMetadata?.every((record) => record.sourceSpan?.startLine), true);

const repeatGraph = await compilerGraph(files, 'decorators_repeat');
const repeatServiceType = repeatGraph.compilerTypeRecords.find((record) => (
  record.publicContract && record.fullyQualifiedName === '"src/service".Service'
));
assert.equal(repeatServiceType?.decoratorMetadataHash, serviceType?.decoratorMetadataHash);
assert.deepEqual(repeatServiceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap, serviceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap);

const proofGraph = await compilerGraph(files, 'decorators_runtime_proof', importsWithDecoratorRuntimeExecutionProof);
const proofServiceType = serviceTypeRecord(proofGraph);
assert.equal(proofServiceType?.decoratorRuntimeExecutionProof?.status, 'passed');
assert.equal(proofServiceType?.decoratorRuntimeExecutionProof?.schema, 'frontier.lang.typescript.decoratorRuntimeExecutionProof.v1');
assert.equal(typeof proofServiceType?.decoratorRuntimeExecutionHash, 'string');
assert.equal(proofServiceType?.decoratorRuntimeExecutionProof?.decoratorRuntimeExecutionHash, proofServiceType?.decoratorRuntimeExecutionHash);
assert.equal(proofServiceType?.decoratorRuntimeExecutionProof?.autoMergeClaim, false);
assert.equal(proofServiceType?.decoratorRuntimeExecutionProof?.semanticEquivalenceClaim, false);
assert.equal(proofServiceType?.decoratorRuntimeExecutionProof?.runtimeEquivalenceClaim, false);
assert.equal(proofServiceType?.decoratorRuntimeExecutionProof?.decoratorExecutionEquivalenceClaim, false);
assert.equal(proofServiceType?.decoratorRuntimeExecutionProof?.decoratorEmitRuntimeEquivalenceClaim, false);
assert.equal(proofServiceType?.decoratorMetadataProof?.proofScope, 'static-decorator-metadata-and-source-bound-runtime-execution');
assert.equal(proofServiceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap, undefined);
assert.equal(proofServiceType?.decoratorMetadataProof?.conflictRouting?.status, 'proof-bound');
assert.equal(proofServiceType?.decoratorMetadataProof?.conflictRouting?.reasonCode, 'decorator-runtime-execution-proof-bound');
assert.equal(proofServiceType?.decoratorMetadataProof?.conflictRouting?.failClosed, false);
assert.equal(proofServiceType?.decoratorMetadataProof?.decoratorRuntimeExecutionProofReasonCodes, undefined);

const staleProofGraph = await compilerGraph(
  files,
  'decorators_runtime_stale_source_proof',
  (imports) => importsWithDecoratorRuntimeExecutionProof(imports, { sourceHash: 'fnv1a32:stale-decorator-source' })
);
const staleProofServiceType = serviceTypeRecord(staleProofGraph);
assert.equal(staleProofServiceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.status, 'blocked');
assert.equal(staleProofServiceType?.decoratorRuntimeExecutionProofReasonCodes?.includes('typescript-decorator-runtime-execution-proof-source-hash-mismatch'), true);
assert.equal(staleProofServiceType?.decoratorRuntimeExecutionProofReasonCodes?.includes('typescript-decorator-runtime-execution-proof-execution-hash-mismatch'), true);

const missingTraceProofGraph = await compilerGraph(
  files,
  'decorators_runtime_missing_trace_hash_proof',
  (imports) => importsWithDecoratorRuntimeExecutionProof(imports, { omitTraceHash: 'decoratorSideEffectTraceHash' })
);
const missingTraceProofServiceType = serviceTypeRecord(missingTraceProofGraph);
assert.equal(missingTraceProofServiceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.status, 'blocked');
assert.equal(missingTraceProofServiceType?.decoratorRuntimeExecutionProofReasonCodes?.includes('typescript-decorator-runtime-execution-proof-decorator-side-effect-trace-hash-missing'), true);
assert.equal(missingTraceProofServiceType?.decoratorRuntimeExecutionProofReasonCodes?.includes('typescript-decorator-runtime-execution-proof-execution-hash-missing'), true);

const claimProofGraph = await compilerGraph(
  files,
  'decorators_runtime_claim_bearing_proof',
  (imports) => importsWithDecoratorRuntimeExecutionProof(imports, { semanticEquivalenceClaim: true })
);
const claimProofServiceType = serviceTypeRecord(claimProofGraph);
assert.equal(claimProofServiceType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.status, 'blocked');
assert.equal(claimProofServiceType?.decoratorRuntimeExecutionProofReasonCodes?.includes('typescript-decorator-runtime-execution-proof-claim-flags-missing'), true);

const variantGraph = await compilerGraph({ 'src/service.ts': files['src/service.ts'].replace('@fieldDec value', '@fieldDec2 value') }, 'decorators_variant');
const variantServiceType = serviceTypeRecord(variantGraph);
assert.notEqual(variantServiceType?.decoratorMetadataHash, serviceType?.decoratorMetadataHash);
assert.notEqual(variantServiceType?.apiSignatureHash, serviceType?.apiSignatureHash);

const workerServiceType = await serviceCompilerType({ 'src/service.ts': files['src/service.ts'].replace('@fieldDec value', '@workerField value') }, 'decorators_worker_delta');
const headServiceType = await serviceCompilerType({ 'src/service.ts': files['src/service.ts'].replace('@fieldDec value', '@headField value') }, 'decorators_head_delta');
const compilerConflict = publicCompilerTypeDeltaConflicts(
  graphWithType(serviceType),
  graphWithType(workerServiceType),
  graphWithType(headServiceType)
)[0];
assert.equal(compilerConflict?.details?.worker?.decoratorMetadataCount, 9);
assert.notEqual(compilerConflict?.details?.worker?.decoratorMetadataHash, compilerConflict?.details?.head?.decoratorMetadataHash);
assert.equal(compilerConflict?.details?.worker?.decoratorMetadataProof?.status, 'passed');
assert.equal(compilerConflict?.details?.worker?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.status, 'blocked');
assert.equal(compilerConflict?.details?.worker?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.routeId, 'prove-decorator-runtime-execution-equivalence');
assert.equal(compilerConflict?.details?.worker?.decoratorMetadataProof?.conflictRouting?.routeLane, 'decorator-runtime-boundaries');
assert.equal(compilerConflict?.details?.head?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap?.routeId, 'prove-decorator-runtime-execution-equivalence');

const sameDecoratorWorkerType = await serviceCompilerType({ 'src/service.ts': files['src/service.ts'].replace('@fieldDec value', '@sharedField value') }, 'decorators_same_delta_worker');
const sameDecoratorHeadType = await serviceCompilerType({ 'src/service.ts': files['src/service.ts'].replace('@fieldDec value', '@sharedField value') }, 'decorators_same_delta_head');
const sameDecoratorConflicts = publicCompilerTypeDeltaConflicts(graphWithType(serviceType), graphWithType(sameDecoratorWorkerType), graphWithType(sameDecoratorHeadType), graphWithType(sameDecoratorWorkerType));
const sameDecoratorConflict = sameDecoratorConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-decorator-runtime-execution-proof-missing');
assert.equal(sameDecoratorConflicts.length, 1);
assert.equal(Boolean(sameDecoratorConflict), true);
assert.equal(sameDecoratorConflict.details.decoratorRuntimeExecutionEvidence.requiredEvidence, 'frontier.lang.typescript.decoratorRuntimeExecutionProof');
assert.equal(sameDecoratorConflict.details.decoratorRuntimeExecutionEvidence.routeId, 'prove-decorator-runtime-execution-equivalence');
assert.equal(sameDecoratorConflict.details.decoratorRuntimeExecutionEvidence.routeLane, 'decorator-runtime-boundaries');
assert.equal(sameDecoratorConflict.details.decoratorRuntimeExecutionEvidence.failClosed, true);
assert.equal(sameDecoratorConflict.details.decoratorRuntimeExecutionEvidence.semanticEquivalenceClaim, false);
assert.equal(sameDecoratorConflict.details.decoratorRuntimeExecutionEvidence.missingRecords[0].decoratorMetadataHash, sameDecoratorWorkerType.decoratorMetadataHash);
assert.equal(sameDecoratorConflict.details.decoratorRuntimeExecutionEvidence.missingRecords[0].missingSignals.includes('typescript-decorator-runtime-execution-proof-missing'), true);
assert.equal(sameDecoratorConflict.details.decoratorRuntimeExecutionEvidence.missingRecords[0].runtimeExecutionEquivalenceGap.routeId, 'prove-decorator-runtime-execution-equivalence');

const sameDecoratorProofType = await serviceCompilerType({ 'src/service.ts': files['src/service.ts'].replace('@fieldDec value', '@sharedField value') }, 'decorators_same_delta_proof', importsWithDecoratorRuntimeExecutionProof);
assert.equal(sameDecoratorProofType?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap, undefined);
const sameDecoratorProofConflicts = publicCompilerTypeDeltaConflicts(graphWithType(serviceType), graphWithType(sameDecoratorProofType), graphWithType(sameDecoratorProofType), graphWithType(sameDecoratorProofType));
const sameDecoratorProofAccessorConflict = sameDecoratorProofConflicts.find((conflict) => (
  conflict.details?.reasonCode === 'typescript-public-api-class-private-accessor-runtime-proof-missing'
));
assert.equal(sameDecoratorProofConflicts.length, 1);
assert.equal(Boolean(sameDecoratorProofAccessorConflict), true);
assert.equal(sameDecoratorProofAccessorConflict.details.decoratorRuntimeExecutionEvidence, undefined);
assert.equal(sameDecoratorProofAccessorConflict.details.classPrivateAccessorRuntimeEvidence.routeId, 'prove-class-private-accessor-runtime-equivalence');

const proofWorkerServiceType = await serviceCompilerType(
  { 'src/service.ts': files['src/service.ts'].replace('@fieldDec value', '@workerField value') },
  'decorators_worker_delta_proof',
  importsWithDecoratorRuntimeExecutionProof
);
const proofHeadServiceType = await serviceCompilerType(
  { 'src/service.ts': files['src/service.ts'].replace('@fieldDec value', '@headField value') },
  'decorators_head_delta_proof',
  importsWithDecoratorRuntimeExecutionProof
);
const proofCompilerConflict = publicCompilerTypeDeltaConflicts(
  graphWithType(serviceType),
  graphWithType(proofWorkerServiceType),
  graphWithType(proofHeadServiceType)
)[0];
assert.equal(proofCompilerConflict?.details?.worker?.decoratorMetadataProof?.runtimeExecutionEquivalenceGap, undefined);
assert.equal(proofCompilerConflict?.details?.worker?.decoratorMetadataProof?.conflictRouting?.status, 'proof-bound');
assert.notEqual(proofCompilerConflict?.details?.worker?.decoratorRuntimeExecutionHash, proofCompilerConflict?.details?.head?.decoratorRuntimeExecutionHash);

function hasDecorator(record, expected) {
  return Boolean(record?.decoratorMetadata?.some((decorator) => (
    Object.entries(expected).every(([key, value]) => decorator[key] === value)
  )));
}

async function compilerGraph(filesForGraph, id, transformImports = (imports) => imports) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_decorator_metadata_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    outputProjectImports: transformImports(await importsForFiles(filesForGraph)),
    baseFiles: {},
    workerFiles: {},
    headFiles: filesForGraph
  });
  assert.equal(project.status, 'merged');
  assert.equal(project.admission.semanticEquivalenceClaim, false);
  return project.outputProjectSymbolGraph;
}

async function serviceCompilerType(filesForGraph, id, transformImports) {
  return serviceTypeRecord(await compilerGraph(filesForGraph, id, transformImports));
}

function serviceTypeRecord(projectGraph) {
  return projectGraph.compilerTypeRecords.find((record) => (
    record.publicContract && record.fullyQualifiedName === '"src/service".Service'
  ));
}

function graphWithType(record) {
  return { compilerTypeRecords: record ? [record] : [] };
}

function importsForFiles(filesForImport) {
  const program = typeScriptProgramForFiles(filesForImport);
  const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript, program });
  return Promise.all(Object.entries(filesForImport).map(([sourcePath, sourceText]) => runNativeImporterAdapter(adapter, {
    language: 'typescript',
    sourcePath,
    sourceText,
    adapterOptions: { sourceFile: program.getSourceFile(sourcePath) }
  })));
}

function importsWithDecoratorRuntimeExecutionProof(imports, overrides = {}) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? decoratorRuntimeProofFact(importResult, fact, overrides)
        : fact)
    } : importResult.semanticIndex
  }));
}

function decoratorRuntimeProofFact(importResult, fact, overrides) {
  const value = fact.value ?? {};
  if (!value.decoratorMetadataHash || !Array.isArray(value.decoratorMetadata)) return fact;
  const sourcePath = importResult.sourcePath;
  const sourceHash = importResult.semanticIndex?.documents?.find((document) => document.path === sourcePath)?.sourceHash;
  const counts = {
    decoratorMetadataCount: value.decoratorMetadataCount,
    classDecoratorCount: value.classDecoratorCount,
    memberDecoratorCount: value.memberDecoratorCount,
    parameterDecoratorCount: value.parameterDecoratorCount
  };
  const traceHashes = decoratorRuntimeTraceHashes(value, sourcePath);
  const { omitTraceHash, ...proofOverrides } = overrides;
  const proof = {
    id: 'decorator-runtime-execution-proof',
    evidenceId: 'decorator-runtime-execution-proof-evidence',
    schema: 'frontier.lang.typescript.decoratorRuntimeExecutionProof.v1',
    kind: 'frontier.lang.typescript.decoratorRuntimeExecutionProof',
    status: 'passed',
    sourcePath,
    sourceHash,
    decoratorMetadataHash: value.decoratorMetadataHash,
    decoratorMetadataCount: value.decoratorMetadataCount,
    ...traceHashes,
    command: 'fixture-decorator-runtime-execution-proof',
    traceHash: traceHashes.decoratorInvocationOrderHash,
    evidenceHash: hashSemanticValue({ kind: 'fixture.decoratorRuntimeEvidence', sourcePath, metadataHash: value.decoratorMetadataHash }),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    decoratorExecutionEquivalenceClaim: false,
    decoratorEmitRuntimeEquivalenceClaim: false,
    ...proofOverrides
  };
  if (omitTraceHash) delete proof[omitTraceHash];
  const proofSource = { sourcePath: proof.sourcePath, sourceHash: proof.sourceHash };
  if (!proof.decoratorRuntimeExecutionHash) proof.decoratorRuntimeExecutionHash = decoratorRuntimeExecutionHash(value, counts, proofSource, proof);
  return { ...fact, value: { ...value, decoratorRuntimeExecutionProof: proof } };
}

function decoratorRuntimeTraceHashes(value, sourcePath) {
  const base = { sourcePath, metadataHash: value.decoratorMetadataHash, count: value.decoratorMetadataCount };
  return {
    decoratorFactoryCallOrderHash: hashSemanticValue({ kind: 'fixture.decoratorFactoryCallOrder', ...base }),
    decoratorInvocationOrderHash: hashSemanticValue({ kind: 'fixture.decoratorInvocationOrder', ...base }),
    decoratorSideEffectTraceHash: hashSemanticValue({ kind: 'fixture.decoratorSideEffectTrace', ...base }),
    decoratorResultApplicationHash: hashSemanticValue({ kind: 'fixture.decoratorResultApplication', ...base }),
    decoratorEmitRuntimeEquivalenceHash: hashSemanticValue({ kind: 'fixture.decoratorEmitRuntimeEquivalence', ...base })
  };
}

function typeScriptProgramForFiles(filesForProgram) {
  const compilerOptions = { target: typescript.ScriptTarget.Latest, module: typescript.ModuleKind.ESNext, noLib: true, strict: true, experimentalDecorators: true };
  const normalizedFiles = new Map(Object.entries(filesForProgram).map(([sourcePath, sourceText]) => [normalizePath(sourcePath), sourceText]));
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
