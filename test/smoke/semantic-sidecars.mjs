import { createProofSpecLayer, createUniversalAstEnvelope } from '@shapeshift-labs/frontier-lang-kernel';
import { assert, assertSemanticImportFixture } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import {
  createSemanticImportSidecar,
  diffNativeSourceImports,
  diffNativeSources,
  importNativeSource,
  NativeImportRegionTaxonomyKinds
} from './compiler-api.mjs';

const scannedJsSidecar = createSemanticImportSidecar(scannedJsImport, { generatedAt: 123, targetPath: 'dist/scanned.js' });
assertSemanticImportFixture(scannedJsImport, {
  sidecar: scannedJsSidecar,
  expectedSymbols: ['addTodo', 'TodoStore.save'],
  expectedRegionKinds: ['body', 'route', 'content', 'config', 'property'],
  expectedReadiness: 'needs-review',
  expectedWarningCodes: ['external-tool-proof-obligations'],
  expectEligible: true
});
assert.equal(scannedJsSidecar.kind, 'frontier.lang.semanticImportSidecar');
assert.equal(scannedJsSidecar.generatedAt, 123);
assert.equal(scannedJsSidecar.summary.emptySemanticIndex, false);
assert.ok(scannedJsSidecar.summary.symbols >= 4);
assert.ok(scannedJsSidecar.ownershipRegions.length >= 4);
assert.equal(NativeImportRegionTaxonomyKinds.includes('import'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('import'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('body') || scannedJsSidecar.regionTaxonomy.presentKinds.includes('type'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('route'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('content'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('config'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('property'), true);
assert.equal(scannedJsSidecar.summary.regionKinds >= 2, true);
assert.equal(scannedJsSidecar.symbols.some((symbol) => symbol.name === 'TodoStore.save' && symbol.ownershipRegionId), true);
assert.equal(scannedJsSidecar.symbols.some((symbol) => symbol.ownershipRegionKind), true);
assert.equal(scannedJsSidecar.imports.some((entry) => entry.regionTaxonomy?.presentKinds?.length), true);
assert.equal(scannedJsSidecar.imports[0].sourcePreservationRecordCount >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsSidecar.imports[0].sourcePreservationLevels.includes('exact'), true);
assert.equal(scannedJsImport.universalAst.layers.semanticSymbols.semanticSymbolIds.length >= scannedJsImport.semanticIndex.symbols.length, true);
assert.equal(scannedJsImport.universalAst.layers.projectionEvidence.sourceMapMappingIds.length >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsSidecar.imports[0].universalAstLayerCount > 0, true);
assert.equal(scannedJsSidecar.imports[0].universalAstLayerNames.includes('semanticSymbols'), true);
assert.equal(scannedJsSidecar.universalAstLayers.names.includes('projectionEvidence'), true);
assert.equal(scannedJsSidecar.summary.universalAstLayers, scannedJsSidecar.universalAstLayers.total);
assert.equal(scannedJsSidecar.proofSpec.empty, false);
assert.equal(scannedJsSidecar.proofSpec.obligations >= 2, true);
assert.equal(scannedJsSidecar.proofSpec.open >= 1, true);
assert.equal(scannedJsSidecar.proofSpec.externalToolRequired >= 1, true);
assert.equal(scannedJsSidecar.summary.proofSpecRecords, scannedJsSidecar.proofSpec.total);
assert.equal(scannedJsSidecar.paradigmSemantics.empty, false);
assert.equal(scannedJsSidecar.paradigmSemantics.bindings >= scannedJsImport.semanticIndex.symbols.length, true);
assert.equal(scannedJsSidecar.paradigmSemantics.loweringRecords >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsSidecar.paradigmSemantics.hasLowering, true);
assert.equal(scannedJsSidecar.sourcePreservation.total >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsSidecar.sourcePreservation.exact >= 1, true);
assert.equal((scannedJsSidecar.sourcePreservation.byLevel.declaration ?? 0) + (scannedJsSidecar.sourcePreservation.byLevel.estimated ?? 0) >= 1, true);
assert.equal(scannedJsSidecar.summary.sourcePreservationRecords, scannedJsSidecar.sourcePreservation.total);
assert.equal(scannedJsSidecar.patchHints.some((hint) => hint.supportedOperations.includes('replace-import')), true);
assert.equal(scannedJsSidecar.patchHints.some((hint) => hint.sourcePath === 'src/scanned.js' && hint.projection.targetPath === 'dist/scanned.js'), true);
assert.equal(scannedJsSidecar.quality.imported, true);
assert.equal(scannedJsSidecar.quality.eligible, true);
assert.equal(scannedJsSidecar.quality.emptyEvidenceWarnings.length, 0);
assert.equal(scannedJsSidecar.quality.symbolCount, scannedJsSidecar.summary.symbols);
assert.equal(scannedJsSidecar.admission.counts.patchHints, scannedJsSidecar.patchHints.length);
assert.equal(['admit', 'review', 'review-proof-obligations'].includes(scannedJsSidecar.admission.action), true);
assert.equal(scannedJsSidecar.summary.patchHints, scannedJsSidecar.patchHints.length);
assert.equal(scannedJsSidecar.summary.evidenceWarnings, 0);
const nativeLossSummaryOnlyImport = {
  ...scannedJsImport,
  id: 'import_scanned_js_native_loss_summary_only',
  losses: [],
  mergeCandidates: [],
  metadata: {
    ...scannedJsImport.metadata,
    semanticMergeReadiness: undefined,
    nativeImportLossSummary: {
      semanticMergeReadiness: 'blocked'
    }
  }
};
const nativeLossSummaryOnlySidecar = createSemanticImportSidecar(nativeLossSummaryOnlyImport, { generatedAt: 132 });
assert.equal(nativeLossSummaryOnlySidecar.imports[0].readiness, 'blocked');
assert.equal(nativeLossSummaryOnlySidecar.summary.readiness, 'blocked');
assert.equal(nativeLossSummaryOnlySidecar.symbols.every((symbol) => symbol.readiness === 'blocked'), true);
assert.equal(nativeLossSummaryOnlySidecar.patchHints.every((hint) => hint.readiness === 'blocked'), true);
assert.equal(nativeLossSummaryOnlySidecar.admission.action, 'reject-blocked');
const emptySemanticImport = {
  id: 'empty_import',
  language: 'javascript',
  sourcePath: 'src/empty.js',
  semanticIndex: { id: 'empty_index', symbols: [] },
  evidence: []
};
const emptySemanticSidecar = createSemanticImportSidecar(emptySemanticImport, { generatedAt: 126 });
assertSemanticImportFixture(emptySemanticImport, {
  sidecar: emptySemanticSidecar,
  minSymbols: 0,
  minOwnershipRegions: 0,
  minSourceMapMappings: 0,
  minPatchHints: 0,
  expectEligible: false,
  expectedWarningCodes: ['empty-evidence', 'empty-semantic-index', 'missing-ownership-regions', 'missing-patch-hints']
});
assert.equal(emptySemanticSidecar.quality.imported, true);
assert.equal(emptySemanticSidecar.quality.eligible, false);
assert.equal(emptySemanticSidecar.admission.action, 'reject-empty-evidence');
assert.equal(emptySemanticSidecar.quality.emptyEvidenceWarnings.some((warning) => warning.code === 'empty-semantic-index'), true);
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
const checkerStatusProofSpec = createProofSpecLayer({
  id: 'proof_external_checker_statuses',
  obligations: [
    { id: 'why3_valid', kind: 'verificationCondition', status: 'valid' },
    { id: 'lean_qed', kind: 'theorem', status: 'qed' },
    { id: 'alloy_counterexample', kind: 'modelCheck', status: 'counterexample' },
    { id: 'coq_admitted', kind: 'theorem', status: 'admitted' },
    { id: 'dafny_pending', kind: 'assertion', status: 'pending' },
    { id: 'session_obsolete', kind: 'solverRun', status: 'obsolete' },
    { id: 'solver_timeout', kind: 'solverRun', status: 'timeout' }
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
assert.equal(checkerStatusSidecar.proofSpec.obligations, 7);
assert.equal(checkerStatusSidecar.proofSpec.discharged, 2);
assert.equal(checkerStatusSidecar.proofSpec.failed, 1);
assert.equal(checkerStatusSidecar.proofSpec.pending, 1);
assert.equal(checkerStatusSidecar.proofSpec.assumed, 1);
assert.equal(checkerStatusSidecar.proofSpec.open, 1);
assert.equal(checkerStatusSidecar.proofSpec.stale, 1);
assert.equal(checkerStatusSidecar.proofSpec.unknown, 1);
assert.equal(checkerStatusSidecar.proofSpec.byStatus.valid, 1);
assert.equal(checkerStatusSidecar.proofSpec.byReadinessStatus.discharged, 2);
assert.equal(checkerStatusSidecar.admission.action, 'reject-failed-proof');
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
const jsRegionFalsePositiveImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/false-positive.ts',
  sourceText: '/*\nexport const fakeRoutes = [\n  { path: "/fake", component: Fake }\n];\n*/\nconst template = `\nexport const fakeContent = { docs: { title: "Fake" } };\n`;\nexport const realRoutes = [\n  { path: "/real", component: Real }\n];\n'
});
assert.equal(jsRegionFalsePositiveImport.semanticIndex.symbols.some((symbol) => symbol.name.includes('fakeRoutes')), false);
assert.equal(jsRegionFalsePositiveImport.semanticIndex.symbols.some((symbol) => symbol.name.includes('fakeContent')), false);
assert.equal(jsRegionFalsePositiveImport.semanticIndex.symbols.some((symbol) => symbol.name === 'realRoutes./real'), true);
assert.equal(jsRegionFalsePositiveImport.sourceMaps[0].mappings.length, jsRegionFalsePositiveImport.semanticIndex.occurrences.length);
const jsChangeSet = diffNativeSources({
  language: 'javascript',
  sourcePath: 'src/change.js',
  beforeSourceText: 'import { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title }; }\n',
  afterSourceText: 'import { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title, done: false }; }\nexport const TODO_LIMIT = 128;\n'
});
assert.equal(jsChangeSet.kind, 'frontier.lang.nativeSourceChangeSet');
assert.equal(jsChangeSet.summary.sourceChanged, true);
assert.equal(jsChangeSet.summary.modifiedSymbols >= 1, true);
assert.equal(jsChangeSet.summary.addedSymbols, 1);
assert.equal(jsChangeSet.changedSymbols.some((symbol) => symbol.name === 'addTodo' && symbol.changeKind === 'modified'), true);
assert.equal(jsChangeSet.changedSymbols.some((symbol) => symbol.name === 'TODO_LIMIT' && symbol.changeKind === 'added'), true);
assert.equal(jsChangeSet.changedRegions.length >= 2, true);
assert.equal(jsChangeSet.patch.operations.some((operation) => operation.op === 'upsertNode'), true);
assert.equal(jsChangeSet.patch.operations.some((operation) => operation.op === 'addEvidence'), true);
assert.equal(jsChangeSet.mergeCandidate.kind, 'frontier.lang.semanticMergeCandidate');
assert.equal(jsChangeSet.mergeCandidate.patchId, jsChangeSet.patch.id);
assert.equal(jsChangeSet.mergeCandidate.conflictKeys.some((key) => key.startsWith('region:source#src/change.js')), true);
assert.equal(jsChangeSet.readiness, 'needs-review');
const jsChangeProjection = jsChangeSet.changedRegions.find((region) => region.metadata?.changedRegionProjection?.sourceMapLinks?.length)?.metadata.changedRegionProjection;
assert.equal(jsChangeProjection.schema, 'frontier.lang.changedRegionProjection.v1');
assert.equal(jsChangeProjection.reviewRequired, true);
assert.equal(jsChangeProjection.autoMergeClaim, false);
assert.equal(jsChangeProjection.after.sourceHash, jsChangeSet.afterHash);
assert.equal(jsChangeProjection.admission.readiness, jsChangeSet.readiness);
assert.equal(jsChangeProjection.admission.action, 'review-port');
assert.equal(jsChangeProjection.sourceMapLinks.some((link) => link.side === 'after' && link.sourceMapMappingId), true);
assert.equal(jsChangeSet.mergeCandidate.metadata.changedRegionProjectionSummary.schema, 'frontier.lang.changedRegionProjectionSummary.v1');
assert.equal(jsChangeSet.mergeCandidate.metadata.changedRegionProjectionSummary.withProjection, jsChangeSet.changedRegions.length);
assert.equal(jsChangeSet.mergeCandidate.metadata.changedRegionProjectionSummary.autoMergeClaims, 0);
assert.equal(jsChangeSet.metadata.changedRegionProjectionSummary.reviewRequired, jsChangeSet.changedRegions.length);
assert.equal(jsChangeSet.mergeCandidate.nativeSpans.some((span) => span.metadata?.changedRegionProjection?.schema === 'frontier.lang.changedRegionProjection.v1'), true);
const unchangedDeclarationChangeSet = diffNativeSourceImports({
  before: importNativeSource({
    language: 'javascript',
    sourcePath: 'src/body-only.js',
    sourceText: 'export function bodyOnly(value) {\n  return value;\n}\n'
  }),
  after: importNativeSource({
    language: 'javascript',
    sourcePath: 'src/body-only.js',
    sourceText: 'export function bodyOnly(value) {\n  return String(value);\n}\n'
  })
});
assert.equal(unchangedDeclarationChangeSet.summary.sourceChanged, true);
assert.equal(unchangedDeclarationChangeSet.summary.symbols, 0);
assert.equal(unchangedDeclarationChangeSet.summary.regions, 1);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].granularity, 'file');
assert.equal(unchangedDeclarationChangeSet.reasons.some((reason) => reason.includes('file-level review')), true);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.admission.action, 'review-file');
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.autoMergeClaim, false);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.sourceMapLinks.some((link) => link.side === 'before'), true);
