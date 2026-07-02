import { assert } from './helpers.mjs';
import {
  createUniversalConversionPlanFromFrontierSource,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const source = `
module ResourceGraphConversion @id("mod_resource_graph_conversion")

conversion JsToRust @id("conversion_resource_js_rust") {
  sourceLanguage javascript
  target rust
}

resourceGraph BufferResources @id("resource_graph_buffer") {
  sourceLanguage javascript
  sourcePath src/buffer.js
  sourceHash sha256:buffer
  evidence evidence_buffer_resource
  resource buffer @id("resource_buffer") kind heap-buffer owner owner_parser evidence evidence_buffer_resource
  owner parser @id("owner_parser") kind function evidence evidence_buffer_resource
  lifetime parse @id("life_parse") kind lexical evidence evidence_buffer_resource
  loan header @id("loan_header") resource resource_buffer owner owner_parser lifetime life_parse mode shared evidence evidence_buffer_resource
  alias headerAlias @id("alias_header") resource resource_buffer owner owner_parser alias alias:header kind view evidence evidence_buffer_resource
  move consume @id("move_buffer") resource resource_buffer fromOwner owner_parser toOwner owner_consumer kind transfer evidence evidence_buffer_resource
  drop cleanup @id("drop_buffer") resource resource_buffer owner owner_consumer lifetime life_parse kind cleanup evidence evidence_buffer_resource
  borrow parseScope @id("borrow_scope_parse") resource resource_buffer lifetime life_parse kind shared-borrow-compatible constraint shared-borrow-compatible|drop-cleanup-order evidence evidence_buffer_resource
  unsafe ffi @id("unsafe_buffer_ffi") resource resource_buffer kind ffi proofStatus missing evidence evidence_buffer_resource
  conflict ffiProof @id("conflict_buffer_ffi") resource resource_buffer unsafeBoundary unsafe_buffer_ffi reasonCode unsafe-boundary-proof-missing status open severity error
  proof ffiProof @id("proof_obligation_ffi") resource resource_buffer conflict conflict_buffer_ffi kind unsafe-boundary status open statement "Prove the FFI boundary preserves buffer ownership."
}
`;

const plan = createUniversalConversionPlanFromFrontierSource(source, {
  fileName: 'resource-graph-conversion.frontier',
  generatedAt: 902,
  universalCapabilityMatrix: capabilityMatrix('javascript', 'rust')
});

assert.equal(plan.document.metadata.semanticResourceGraphs.id, 'resource_graph_buffer');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphId, 'resource_graph_buffer');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphResourceIds[0], 'resource_buffer');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphOwnerIds[0], 'owner_parser');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphLoanIds[0], 'loan_header');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphAliasIds[0], 'alias_header');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphMoveIds[0], 'move_buffer');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphDropIds[0], 'drop_buffer');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphLifetimeRegionIds[0], 'life_parse');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphBorrowScopeIds[0], 'borrow_scope_parse');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphUnsafeBoundaryIds[0], 'unsafe_buffer_ffi');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphConflictIds[0], 'conflict_buffer_ffi');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphProofObligationIds[0], 'proof_obligation_ffi');
assert.equal(plan.metadata.authoredFrontierSource.semanticResourceGraphSummary.resourceCount, 1);

const route = queryUniversalConversionPlan(plan, {
  sourceLanguage: 'javascript',
  target: 'rust'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.resourceTransfer.requiredKinds.includes('resource-identity'), true);
assert.equal(route.resourceTransfer.requiredKinds.includes('owner'), true);
assert.equal(route.resourceTransfer.requiredKinds.includes('loan'), true);
assert.equal(route.resourceTransfer.requiredKinds.includes('alias'), true);
assert.equal(route.resourceTransfer.requiredKinds.includes('move'), true);
assert.equal(route.resourceTransfer.requiredKinds.includes('drop'), true);
assert.equal(route.resourceTransfer.requiredKinds.includes('unsafe-boundary'), true);
assert.equal(route.resourceTransfer.missingEvidence.includes('translation-resource-transfer-target-graph'), true);
assert.equal(route.lifetimeConstraint.requiredKinds.includes('lifetime-region'), true);
assert.equal(route.lifetimeConstraint.requiredKinds.includes('loan-region-binding'), true);
assert.equal(route.lifetimeConstraint.requiredKinds.includes('drop-region-bound'), true);
assert.equal(route.lifetimeConstraint.requiredKinds.includes('unsafe-lifetime-proof'), true);
assert.equal(route.borrowScopeConstraint.requiredKinds.includes('shared-borrow-compatible'), true);
assert.equal(route.borrowScopeConstraint.requiredKinds.includes('drop-cleanup-order'), true);
assert.equal(route.borrowCheckerConstraint.requiredFamilies.includes('resource-transfer'), true);
assert.equal(route.borrowCheckerConstraint.requiredFamilies.includes('lifetime'), true);
assert.equal(route.borrowCheckerConstraint.requiredFamilies.includes('borrow-scope'), true);

function capabilityMatrix(language, target) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 902,
    languages: [{
      language,
      aliases: ['js'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } } },
        targets: [{ target, lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-js-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language, targets: [{ target, readiness: 'ready' }] }] } },
    metadata: { compileTargets: [target] }
  };
}
