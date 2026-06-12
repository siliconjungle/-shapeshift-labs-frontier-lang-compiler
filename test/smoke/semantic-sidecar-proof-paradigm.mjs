import { createProofSpecLayer, createUniversalAstEnvelope } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { createSemanticImportSidecar } from './compiler-api.mjs';

const scannedProofEvidence = { id: 'proof_scanned_js', kind: 'proof', status: 'passed' };
const scannedProofSpec = createProofSpecLayer({
  id: 'proof_scanned_js_spec',
  invariants: [{
    id: 'contract_scanned_routes',
    kind: 'invariant',
    subjectKind: 'semanticSymbol',
    subjectId: scannedJsImport.semanticIndex.symbols[0].id,
    statement: 'Scanned routes preserve declared route ownership.',
    evidenceIds: [scannedProofEvidence.id]
  }],
  obligations: [{
    id: 'obligation_scanned_routes',
    kind: 'invariant',
    status: 'discharged',
    subjectKind: 'semanticSymbol',
    subjectId: scannedJsImport.semanticIndex.symbols[0].id,
    contractIds: ['contract_scanned_routes'],
    statement: 'Route ownership invariant holds for the scanned fixture.',
    evidenceIds: [scannedProofEvidence.id]
  }],
  evidence: [scannedProofEvidence]
});
const scannedProofImport = {
  ...scannedJsImport,
  id: 'import_scanned_js_proof',
  evidence: [...scannedJsImport.evidence, scannedProofEvidence],
  universalAst: createUniversalAstEnvelope({
    id: 'uast_scanned_js_proof',
    document: scannedJsImport.document,
    nativeSources: scannedJsImport.universalAst.nativeSources,
    semanticIndex: scannedJsImport.semanticIndex,
    sourceMaps: scannedJsImport.sourceMaps,
    losses: scannedJsImport.losses,
    evidence: [...scannedJsImport.evidence, scannedProofEvidence],
    mergeCandidates: scannedJsImport.mergeCandidates,
    proof: scannedProofSpec
  })
};
const scannedProofSidecar = createSemanticImportSidecar(scannedProofImport, { generatedAt: 124 });
assert.equal(scannedProofSidecar.proofSpec.empty, false);
assert.equal(scannedProofSidecar.proofSpec.invariants, 1);
assert.equal(scannedProofSidecar.proofSpec.obligations, 1);
assert.equal(scannedProofSidecar.proofSpec.discharged, 1);
assert.equal(scannedProofSidecar.proofSpec.contractKinds.includes('invariant'), true);
assert.equal(scannedProofSidecar.imports[0].proofSpec.evidence, 1);
assert.equal(scannedProofSidecar.summary.proofSpecRecords, scannedProofSidecar.proofSpec.total);
assert.equal(scannedProofSidecar.summary.proofSpecObligations, 1);
assert.equal(scannedProofSidecar.summary.proofSpecFailedObligations, 0);
assert.equal(scannedProofSidecar.quality.proofSummary.obligations, 1);
assert.equal(scannedProofSidecar.admission.counts.proofObligations, 1);
assert.equal(scannedProofSidecar.admission.proofSummary.autoMergeProof, false);
assert.equal(scannedProofSidecar.semanticImpact.records.some((record) => record.proofObligationIds.includes('obligation_scanned_routes')), true);
assert.equal(scannedProofSidecar.semanticImpact.summary.proofObligations >= 1, true);
const checkerStatusProofSpec = createProofSpecLayer({
  id: 'proof_external_checker_statuses',
  obligations: [
    { id: 'why3_valid', kind: 'verificationCondition', status: 'valid' },
    { id: 'lean_qed', kind: 'theorem', status: 'qed' },
    { id: 'alloy_counterexample', kind: 'modelCheck', status: 'counterexample' },
    { id: 'coq_admitted', kind: 'theorem', status: 'admitted' },
    { id: 'dafny_pending', kind: 'assertion', status: 'pending' },
    { id: 'session_obsolete', kind: 'solverRun', status: 'obsolete' },
    { id: 'solver_timeout', kind: 'solverRun', status: 'timeout' },
    { id: 'solver_open', kind: 'solverRun', status: 'open' },
    { id: 'missing_status', kind: 'assertion' }
  ]
});
const checkerStatusSidecar = createSemanticImportSidecar({
  ...scannedJsImport,
  id: 'import_scanned_js_checker_statuses',
  universalAst: createUniversalAstEnvelope({
    ...scannedJsImport.universalAst,
    id: 'uast_scanned_js_checker_statuses',
    proof: checkerStatusProofSpec
  })
}, { generatedAt: 127 });
assert.equal(checkerStatusSidecar.proofSpec.obligations, 9);
assert.equal(checkerStatusSidecar.proofSpec.discharged, 2);
assert.equal(checkerStatusSidecar.proofSpec.failed, 1);
assert.equal(checkerStatusSidecar.proofSpec.pending, 1);
assert.equal(checkerStatusSidecar.proofSpec.assumed, 1);
assert.equal(checkerStatusSidecar.proofSpec.open, 2);
assert.equal(checkerStatusSidecar.proofSpec.stale, 1);
assert.equal(checkerStatusSidecar.proofSpec.unknown, 2);
assert.equal(checkerStatusSidecar.proofSpec.byStatus.valid, 1);
assert.equal(checkerStatusSidecar.proofSpec.byReadinessStatus.discharged, 2);
assert.equal(checkerStatusSidecar.admission.action, 'reject-failed-proof');
assert.equal(checkerStatusSidecar.quality.warnings.some((warning) => warning.code === 'stale-proof-obligations'), true);
assert.equal(checkerStatusSidecar.semanticImpact.summary.proofObligations, 9);
const reviewProofSpec = createProofSpecLayer({
  id: 'proof_scanned_js_review_spec',
  obligations: ['pending', 'assumed', 'external-tool-required', 'unknown'].map((status) => ({
    id: `obligation_review_${status.replace(/-/g, '_')}`,
    kind: 'merge',
    status,
    subjectKind: 'semanticSymbol',
    subjectId: scannedJsImport.semanticIndex.symbols[0].id,
    statement: `${status} proof review fixture.`
  }))
});
const reviewProofSidecar = createSemanticImportSidecar({
  ...scannedJsImport,
  id: 'import_scanned_js_review_proof',
  universalAst: createUniversalAstEnvelope({
    ...scannedJsImport.universalAst,
    id: 'uast_scanned_js_review_proof',
    proof: reviewProofSpec
  })
}, { generatedAt: 128 });
assert.equal(reviewProofSidecar.quality.eligible, true);
assert.equal(reviewProofSidecar.admission.action, 'review-proof-obligations');
assert.equal(reviewProofSidecar.admission.proofSummary.failed, 0);
assert.equal(reviewProofSidecar.admission.proofSummary.externalToolRequired, 1);
const scannedParadigmEvidence = { id: 'paradigm_scanned_js', kind: 'import', status: 'passed' };
const scannedParadigmImport = {
  ...scannedJsImport,
  id: 'import_scanned_js_paradigm',
  evidence: [...scannedJsImport.evidence, scannedParadigmEvidence],
  universalAst: {
    ...scannedJsImport.universalAst,
    paradigmSemantics: {
      kind: 'frontier.lang.paradigmSemantics',
      version: 1,
      id: 'paradigm_scanned_js_spec',
      logicPrograms: [{ id: 'logic_scanned_route', kind: 'hornClause', predicate: 'route(R) :- exported(R)' }],
      stackEffects: [{ id: 'stack_scanned_route', kind: 'concatenativeStackEffect', inputs: ['route'], outputs: ['valid?'] }],
      arrayShapes: [{ id: 'array_scanned_routes', kind: 'rankedArray', rank: 1 }],
      numericKernels: [{ id: 'kernel_route_count', kind: 'elementalKernel', arrayShapeId: 'array_scanned_routes' }],
      macroExpansions: [{ id: 'macro_route_config', kind: 'sourceMacroBoundary' }],
      reflectionBoundaries: [{ id: 'reflection_dynamic_import', kind: 'dynamicImportBoundary' }],
      loweringRecords: [{ id: 'lower_route_logic_to_js', kind: 'frontierToTarget', sourceRecordId: 'logic_scanned_route' }],
      evidence: [scannedParadigmEvidence]
    }
  }
};
const scannedParadigmSidecar = createSemanticImportSidecar(scannedParadigmImport, { generatedAt: 125 });
assert.equal(scannedParadigmSidecar.paradigmSemantics.empty, false);
assert.equal(scannedParadigmSidecar.paradigmSemantics.logicPrograms, 1);
assert.equal(scannedParadigmSidecar.paradigmSemantics.stackEffects, 1);
assert.equal(scannedParadigmSidecar.paradigmSemantics.hasStackSemantics, true);
assert.equal(scannedParadigmSidecar.paradigmSemantics.hasArraySemantics, true);
assert.equal(scannedParadigmSidecar.paradigmSemantics.hasMacroOrReflection, true);
assert.equal(scannedParadigmSidecar.paradigmSemantics.hasLowering, true);
assert.equal(scannedParadigmSidecar.imports[0].paradigmSemantics.loweringRecords, 1);
assert.equal(scannedParadigmSidecar.summary.paradigmSemanticsRecords, scannedParadigmSidecar.paradigmSemantics.total);
assert.equal(scannedParadigmSidecar.summary.paradigmSemanticsGroups >= 4, true);
