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
const baseFiles = { 'src/service.ts': serviceSource('return 1;') };
const changedFiles = { 'src/service.ts': serviceSource('return 2;') };
const baseGraph = await compilerGraph(baseFiles, undefined, 'base');
const changedGraph = await compilerGraph(changedFiles, undefined, 'changed');
const validRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof(), 'valid_runtime_proof');
const staleRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ sourceHash: 'stale-source-hash' }), 'stale_runtime_proof');
const missingTraceRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ omitTrace: 'privateMemberAccessTraceHash' }), 'missing_trace_runtime_proof');
const missingBrandTraceRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ omitTrace: 'privateBrandCheckTraceHash' }), 'missing_brand_trace_runtime_proof');
const missingMethodTraceRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ omitTrace: 'privateMethodCallTraceHash' }), 'missing_method_trace_runtime_proof');
const missingAccessorDescriptorRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ omitTrace: 'accessorDescriptorTraceHash' }), 'missing_accessor_descriptor_runtime_proof');
const missingRequiredSignalRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ omitRequiredSignal: 'typescript-private-brand-check-trace' }), 'missing_required_signal_runtime_proof');
const schemaOnlyMismatchRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ schema: 'wrong.schema' }), 'schema_only_mismatch_runtime_proof');
const kindOnlyMismatchRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ kind: 'wrong.kind' }), 'kind_only_mismatch_runtime_proof');
const missingCommandRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ omitCommand: true }), 'missing_command_runtime_proof');
const claimBearingRuntimeProofGraph = await compilerGraph(changedFiles, withClassPrivateAccessorRuntimeProof({ semanticEquivalenceClaim: true }), 'claim_bearing_runtime_proof');
const missingProofGraph = await compilerGraph(changedFiles, withoutClassMemberShapeHashes, 'missing_proof');
const serviceType = publicType(changedGraph, '"src/service".Service');
const validRuntimeProofServiceType = publicType(validRuntimeProofGraph, '"src/service".Service');
const staleRuntimeProofServiceType = publicType(staleRuntimeProofGraph, '"src/service".Service');
const missingTraceRuntimeProofServiceType = publicType(missingTraceRuntimeProofGraph, '"src/service".Service');
const missingBrandTraceRuntimeProofServiceType = publicType(missingBrandTraceRuntimeProofGraph, '"src/service".Service');
const missingMethodTraceRuntimeProofServiceType = publicType(missingMethodTraceRuntimeProofGraph, '"src/service".Service');
const missingAccessorDescriptorRuntimeProofServiceType = publicType(missingAccessorDescriptorRuntimeProofGraph, '"src/service".Service');
const missingRequiredSignalRuntimeProofServiceType = publicType(missingRequiredSignalRuntimeProofGraph, '"src/service".Service');
const schemaOnlyMismatchRuntimeProofServiceType = publicType(schemaOnlyMismatchRuntimeProofGraph, '"src/service".Service');
const kindOnlyMismatchRuntimeProofServiceType = publicType(kindOnlyMismatchRuntimeProofGraph, '"src/service".Service');
const missingCommandRuntimeProofServiceType = publicType(missingCommandRuntimeProofGraph, '"src/service".Service');
const claimBearingRuntimeProofServiceType = publicType(claimBearingRuntimeProofGraph, '"src/service".Service');

assert.equal(serviceType?.privateClassMemberCount, 4);
assert.equal(serviceType?.accessorFieldCount, 1);
assert.equal(serviceType?.classHeritageCount, 1);
assert.equal(Boolean(serviceType?.privateClassMemberShapeHash), true);
assert.equal(Boolean(serviceType?.accessorFieldShapeHash), true);
assert.equal(Boolean(serviceType?.typeEquivalencePrivateClassMemberSetHash), true);
assert.equal(Boolean(serviceType?.typeEquivalenceAccessorFieldSetHash), true);
assert.equal(serviceType?.classMemberShapeProof?.status, 'passed');
assert.equal(serviceType?.classMemberShapeProof?.runtimeEquivalenceClaim, false);
assert.equal(serviceType?.typeEquivalenceProof?.proofLevel.includes('private-class-member-set-and-accessor-field-set'), true);
assert.equal(serviceType?.typeEquivalenceProof?.requiredSignals.includes('compiler-private-class-member-shape-hash'), true);
assert.equal(serviceType?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(hasMember(serviceType.privateClassMembers, '#secret', 'private-field'), true);
assert.equal(hasStaticMember(serviceType.privateClassMembers, '#salt', 'private-field'), true);
assert.equal(hasMember(serviceType.privateClassMembers, '#load', 'private-method'), true);
assert.equal(hasMember(serviceType.privateClassMembers, '#ready', 'private-get-accessor'), true);
assert.equal(hasMember(serviceType.accessorFieldMembers, 'count', 'accessor-field'), true);
assert.equal(serviceType?.typeEquivalenceCheckerEvidence?.privateClassMemberNames.includes('#secret'), true);
assert.equal(serviceType?.typeEquivalenceCheckerEvidence?.accessorFieldNames.includes('count'), true);
assert.equal(serviceType?.classMemberShapeProof?.proofScope, 'static-private-accessor-shape-only');
assert.equal(serviceType?.classMemberShapeProof?.runtimeEquivalenceGap?.routeId, 'prove-class-private-accessor-runtime-equivalence');
assert.equal(serviceType?.classMemberShapeProof?.runtimeEquivalenceGap?.failClosed, true);
assert.equal(serviceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-missing'), true);
assert.equal(serviceType?.classPrivateAccessorRuntimeProofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-missing'), true);
assert.equal(serviceType?.classPrivateAccessorRuntimeHash, undefined);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.status, 'passed');
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.sourcePath, 'src/service.ts');
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.sourceHash, validRuntimeProofServiceType.sourceHash);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.privateClassMemberShapeHash, validRuntimeProofServiceType.privateClassMemberShapeHash);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.accessorFieldShapeHash, validRuntimeProofServiceType.accessorFieldShapeHash);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.semanticEquivalenceClaim, false);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.requiredSignals.includes('typescript-private-brand-check-trace'), true);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.requiredSignals.includes('typescript-static-private-member-access-trace'), true);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.requiredSignals.includes('typescript-subclass-private-brand-boundary-trace'), true);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProof?.requiredSignals.includes('typescript-accessor-field-descriptor-trace'), true);
assert.equal(Boolean(validRuntimeProofServiceType?.classPrivateAccessorRuntimeHash), true);
assert.equal(validRuntimeProofServiceType?.classMemberShapeProof?.proofScope, 'static-private-accessor-shape-and-source-bound-runtime');
assert.equal(validRuntimeProofServiceType?.classMemberShapeProof?.conflictRouting?.status, 'proof-bound');
assert.equal(validRuntimeProofServiceType?.classMemberShapeProof?.conflictRouting?.routeId, 'prove-class-private-accessor-runtime-equivalence');
assert.equal(validRuntimeProofServiceType?.classMemberShapeProof?.conflictRouting?.failClosed, false);
assert.equal(validRuntimeProofServiceType?.classMemberShapeProof?.conflictRouting?.semanticEquivalenceClaim, false);
assert.equal(validRuntimeProofServiceType?.classPrivateAccessorRuntimeProofReasonCodes, undefined);
assert.equal(staleRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-source-hash-mismatch'), true);
assert.equal(missingTraceRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-private-member-access-trace-hash-missing'), true);
assert.equal(missingBrandTraceRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-private-brand-check-trace-hash-missing'), true);
assert.equal(missingMethodTraceRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-private-method-call-trace-hash-missing'), true);
assert.equal(missingAccessorDescriptorRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-accessor-descriptor-trace-hash-missing'), true);
assert.equal(missingRequiredSignalRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-required-signals-missing'), true);
assert.equal(schemaOnlyMismatchRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-schema-missing'), true);
assert.equal(kindOnlyMismatchRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-kind-missing'), true);
assert.equal(missingCommandRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-command-missing'), true);
assert.equal(claimBearingRuntimeProofServiceType?.classMemberShapeProof?.runtimeEquivalenceGap?.proofReasonCodes.includes('typescript-class-private-accessor-runtime-proof-claim-flags-missing'), true);

const missingProofConflicts = publicCompilerTypeDeltaConflicts(baseGraph, missingProofGraph, missingProofGraph, missingProofGraph);
const missingProofConflict = missingProofConflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(missingProofConflicts.length, 1);
assert.equal(Boolean(missingProofConflict), true);
const missingRecord = missingProofConflict.details.typeEquivalenceEvidence.missingRecords[0];
assert.equal(missingRecord.privateClassMemberCount, 4);
assert.equal(missingRecord.accessorFieldCount, 1);
assert.equal(missingRecord.typeEquivalencePrivateClassMemberSetHash, undefined);
assert.equal(missingRecord.typeEquivalenceAccessorFieldSetHash, undefined);
assert.equal(missingRecord.missingSignals.includes('compiler-private-class-member-shape-hash'), true);
assert.equal(missingRecord.missingSignals.includes('compiler-accessor-field-shape-hash'), true);
assert.equal(publicCompilerTypeDeltaConflicts(baseGraph, changedGraph, changedGraph, changedGraph).length, 0);

function serviceSource(loadBody) {
  return [
    'class Base {',
    '  protected base = 0;',
    '}',
    'export class Service extends Base {',
    '  static #salt: number = 1;',
    '  #secret: string = "";',
    '  accessor count: number = 0;',
    '  get #ready(): boolean { return true; }',
    `  #load(input: string): number { void input; ${loadBody} }`,
    '  static readSalt(): number { return Service.#salt; }',
    '  run(): number { return this.#load("x") + this.base; }',
    '}',
    ''
  ].join('\n');
}

function publicType(graph, fullyQualifiedName) {
  return graph.compilerTypeRecords.find((record) => record.publicContract && record.fullyQualifiedName === fullyQualifiedName);
}

function hasMember(records, name, kind) {
  return Boolean(records?.some((record) => record.name === name && record.kind === kind));
}

function hasStaticMember(records, name, kind) {
  return Boolean(records?.some((record) => record.name === name && record.kind === kind && record.static === true));
}

async function compilerGraph(files, transformImports = (imports) => imports, id = 'graph') {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_compiler_class_private_accessor_shape_${id}`,
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

function withoutClassMemberShapeHashes(imports) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? { ...fact, value: omitKeys(fact.value, ['privateClassMemberShapeHash', 'accessorFieldShapeHash', 'classMemberShapeProof']) }
        : fact)
    } : importResult.semanticIndex
  }));
}

function withClassPrivateAccessorRuntimeProof(overrides = {}) {
  return (imports) => imports.map((importResult) => {
    const sourcePath = importResult.sourcePath ?? importResult.semanticIndex?.documents?.[0]?.path;
    const sourceHash = importResult.semanticIndex?.documents?.[0]?.sourceHash;
    return {
      ...importResult,
      semanticIndex: importResult.semanticIndex ? {
        ...importResult.semanticIndex,
        facts: (importResult.semanticIndex.facts ?? []).map((fact) => {
          if (fact.predicate !== 'compilerType' || !fact.value?.privateClassMemberShapeHash) return fact;
          return {
            ...fact,
            value: {
              ...fact.value,
              classPrivateAccessorRuntimeProof: classPrivateAccessorRuntimeProof({
                ...fact.value,
                sourcePath,
                sourceHash,
                ...overrides
              })
            }
          };
        })
      } : importResult.semanticIndex
    };
  });
}

function classPrivateAccessorRuntimeProof(value) {
  const traceHashes = {
    classConstructionOrderTraceHash: 'hash:class-construction-order',
    privateMemberInitializationTraceHash: 'hash:private-member-initialization',
    privateMemberAccessTraceHash: 'hash:private-member-access',
    privateBrandCheckTraceHash: 'hash:private-brand-check',
    privateMethodCallTraceHash: 'hash:private-method-call',
    privateAccessorGetSetTraceHash: 'hash:private-accessor-get-set',
    staticPrivateMemberAccessTraceHash: 'hash:static-private-member-access',
    subclassPrivateBrandBoundaryTraceHash: 'hash:subclass-private-brand-boundary',
    accessorInitializationTraceHash: 'hash:accessor-initialization',
    accessorGetSetTraceHash: 'hash:accessor-get-set',
    accessorDescriptorTraceHash: 'hash:accessor-descriptor'
  };
  const requiredSignals = [
    'compiler-public-api-source-path',
    'compiler-public-api-source-hash',
    'compiler-private-class-member-count',
    'compiler-private-class-member-shape-hash',
    'compiler-accessor-field-count',
    'compiler-accessor-field-shape-hash',
    'typescript-class-construction-order-trace',
    'typescript-private-member-initialization-trace',
    'typescript-private-member-access-trace',
    'typescript-private-brand-check-trace',
    'typescript-private-method-call-trace',
    'typescript-private-accessor-get-set-trace',
    'typescript-static-private-member-access-trace',
    'typescript-subclass-private-brand-boundary-trace',
    'typescript-accessor-field-initialization-trace',
    'typescript-accessor-field-get-set-trace',
    'typescript-accessor-field-descriptor-trace',
    'runtime-command',
    'runtime-trace-hash',
    'runtime-evidence-hash'
  ].filter((signal) => signal !== value.omitRequiredSignal);
  if (value.omitTrace) delete traceHashes[value.omitTrace];
  const classPrivateAccessorRuntimeHash = hashSemanticValue({
    kind: 'frontier.lang.typescript.classPrivateAccessorRuntimeProof.values',
    sourcePath: value.sourcePath,
    sourceHash: value.sourceHash,
    privateClassMemberShapeHash: value.privateClassMemberShapeHash,
    accessorFieldShapeHash: value.accessorFieldShapeHash,
    privateClassMemberCount: value.privateClassMemberCount,
    accessorFieldCount: value.accessorFieldCount,
    requiredSignals,
    traceHashes
  });
  return {
    id: 'proof:class-private-accessor-runtime',
    evidenceId: 'evidence:class-private-accessor-runtime',
    schema: value.schema ?? 'frontier.lang.typescript.classPrivateAccessorRuntimeProof.v1',
    kind: value.kind ?? 'frontier.lang.typescript.classPrivateAccessorRuntimeProof',
    status: 'passed',
    sourcePath: value.sourcePath,
    sourceHash: value.sourceHash,
    privateClassMemberShapeHash: value.privateClassMemberShapeHash,
    accessorFieldShapeHash: value.accessorFieldShapeHash,
    privateClassMemberCount: value.privateClassMemberCount,
    accessorFieldCount: value.accessorFieldCount,
    requiredSignals,
    classPrivateAccessorRuntimeHash,
    ...traceHashes,
    command: value.omitCommand ? undefined : 'node ./scripts/prove-private-accessor-runtime.mjs',
    traceHash: 'hash:runtime-trace',
    evidenceHash: 'hash:runtime-evidence',
    autoMergeClaim: false,
    semanticEquivalenceClaim: value.semanticEquivalenceClaim ?? false,
    runtimeEquivalenceClaim: false,
    privateMemberRuntimeEquivalenceClaim: false,
    accessorRuntimeEquivalenceClaim: false
  };
}

function omitKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}
