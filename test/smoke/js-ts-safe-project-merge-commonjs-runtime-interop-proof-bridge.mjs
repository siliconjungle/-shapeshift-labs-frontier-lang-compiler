import { assert } from './helpers.mjs';
import { importNativeProject } from './compiler-api.mjs';
import { createProjectAdmissionRoutes } from '../../src/js-ts-safe-project-merge-admission-routes.js';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';

const baseFiles = {
  'src/consumer.js': 'exports.stable = 1;\n',
  'src/legacy.cjs': 'const runtime = {};\n'
};
const workerFiles = {
  ...baseFiles,
  'src/consumer.js': "const legacy = __importDefault(require('./legacy.cjs'));\nexports.stable = 1;\nexports.used = legacy.default;\n"
};
const headFiles = {
  ...baseFiles,
  'src/legacy.cjs': 'const runtime = {};\nmodule.exports = runtime;\n'
};

const stages = {
  base: await projectGraphStage('commonjs_runtime_interop_proof_base', baseFiles),
  worker: await projectGraphStage('commonjs_runtime_interop_proof_worker', workerFiles),
  head: await projectGraphStage('commonjs_runtime_interop_proof_head', headFiles),
  output: await projectGraphStage('commonjs_runtime_interop_proof_output', {
    ...headFiles,
    ...workerFiles,
    'src/legacy.cjs': headFiles['src/legacy.cjs']
  })
};
const projectGraphDelta = { stages };
const missingProofConflicts = projectGraphDeltaConflicts(projectGraphDelta);
const missingProofTargetConflict = importTargetConflict(missingProofConflicts);
assert.equal(Boolean(missingProofTargetConflict), true);
assert.equal(missingProofTargetConflict.details.routeId, 'prove-commonjs-runtime-interop-equivalence');
assert.equal(missingProofTargetConflict.details.routeLane, 'module-runtime-interop');
assert.equal(missingProofTargetConflict.details.commonJsRuntimeInteropProof.status, 'missing');
assert.equal(missingProofTargetConflict.details.reasonCodes.includes('commonjs-runtime-interop-proof-missing'), true);
assert.equal(missingProofTargetConflict.details.commonJsRuntimeInteropProof.delta.interopHelper, '__importDefault');
assert.equal(missingProofTargetConflict.details.commonJsRuntimeInteropProof.delta.outputTargetSymbolId, 'symbol:javascript:export:module_exports');
assert.equal(createProjectAdmissionRoutes({ conflicts: missingProofConflicts }).some((route) => route.routeId === 'prove-commonjs-runtime-interop-equivalence'), true);

const validProof = proofFromDelta(missingProofTargetConflict.details.commonJsRuntimeInteropProof.delta);
const proofBoundConflicts = projectGraphDeltaConflicts(projectGraphDelta, { commonJsRuntimeInteropProofs: [validProof] });
assert.equal(Boolean(importTargetConflict(proofBoundConflicts)), false);
assert.equal(proofBoundConflicts.some((conflict) => conflict.details?.routeId === 'prove-commonjs-runtime-interop-equivalence'), false);

const staleSourceConflicts = projectGraphDeltaConflicts(projectGraphDelta, {
  commonJsRuntimeInteropProofs: [proofFromDelta(missingProofTargetConflict.details.commonJsRuntimeInteropProof.delta, {
    sourceHash: 'stale-source-hash'
  })]
});
const staleSourceConflict = importTargetConflict(staleSourceConflicts);
assert.equal(staleSourceConflict.details.reasonCodes.includes('commonjs-runtime-interop-proof-source-hash-mismatch'), true);
assert.equal(staleSourceConflict.details.commonJsRuntimeInteropProof.status, 'failed');

const claimBearingConflicts = projectGraphDeltaConflicts(projectGraphDelta, {
  commonJsRuntimeInteropProofs: [proofFromDelta(missingProofTargetConflict.details.commonJsRuntimeInteropProof.delta, {
    semanticEquivalenceClaim: true
  })]
});
const claimBearingConflict = importTargetConflict(claimBearingConflicts);
assert.equal(claimBearingConflict.details.reasonCodes.includes('commonjs-runtime-interop-proof-claim-flags-missing'), true);
assert.equal(claimBearingConflict.details.commonJsRuntimeInteropProof.status, 'failed');

async function projectGraphStage(id, files) {
  const projectImport = await importNativeProject({
    id,
    projectRoot: 'src',
    sources: Object.entries(files).map(([sourcePath, sourceText]) => ({
      language: 'javascript',
      sourcePath,
      sourceText,
      metadata: { semanticImportExpected: true }
    }))
  });
  return { projectImport, projectSymbolGraph: projectImport.projectSymbolGraph };
}

function importTargetConflict(conflicts) {
  return conflicts.find((conflict) => conflict.code === 'project-import-target-delta-conflict');
}

function proofFromDelta(delta, overrides = {}) {
  return {
    schema: 'frontier.lang.commonJsRuntimeInteropProof.v1',
    status: 'passed',
    proofLevel: 'commonjs-runtime-interop',
    sourcePath: delta.sourcePath,
    sourceHash: delta.sourceHash,
    identityKey: delta.identityKey,
    moduleSpecifier: delta.moduleSpecifier,
    importedName: delta.importedName,
    localName: delta.localName,
    importKind: delta.importKind,
    commonJs: delta.commonJs,
    interopHelper: delta.interopHelper,
    packageRuntimeCondition: delta.packageRuntimeCondition,
    packageRuntimeConditionEdgeKind: delta.packageRuntimeConditionEdgeKind,
    outputTargetSymbolId: delta.outputTargetSymbolId,
    workerTargetSymbolId: delta.workerTargetSymbolId,
    exportAssignmentShapeHash: delta.exportAssignmentShapeHash,
    helperTraceHash: 'trace:commonjs-helper-default-module-exports',
    evidenceHash: 'evidence:commonjs-helper-default-module-exports',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    runtimeInteropEquivalenceClaim: false,
    ...overrides
  };
}
