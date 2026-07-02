import { assert } from './helpers.mjs';
import {
  createUniversalConversionPlanFromFrontierSource,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const source = `
module InterlinguaConversion @id("mod_interlingua_conversion")

conversion JsToRust @id("conversion_interlingua_js_rust") {
  sourceLanguage javascript
  target rust
}

interlingua JsToRust @id("interlingua_js_rust") {
  sourceLanguage javascript
  target rust
  mode target-adapter
  lift source @id("lift_js") sourceImport native_import_js sourcePath src/public-api.js sourceHash sha256:source sourceMap source_map_js ownership symbol:displayName conflict symbol:displayName evidence evidence_translation proof proof_translation
  layer symbols @id("layer_symbols") kind semantic-symbol status represented evidence evidence_translation
  layer ownership @id("layer_ownership") kind semantic-ownership status missing missingEvidence translation-borrow-scope:borrow-across-await
  constraint borrowAwait @id("constraint_borrow_await") family borrow-scope layer semantic-ownership status needs-evidence action collect-borrow-scope required shared-borrow-compatible|borrow-across-await represented shared-borrow-compatible missing borrow-across-await missingEvidence translation-borrow-scope:borrow-across-await evidence evidence_borrow_scope obligation obligation_borrow_await
  obligation borrowAwait @id("obligation_borrow_await") edge constraint_borrow_await family borrow-scope kind borrow-across-await status missing missingEvidence translation-borrow-scope:borrow-across-await evidence evidence_borrow_scope severity warning
  lowering rustAdapter @id("lowering_rust_adapter") disposition target-adapter adapter fixture-js-rust adapterKind targetProjection readiness needs-review lossClass targetAdapterProjection proofEvidence proof_translation missingEvidence host-target-adapter-review review adapter-review
  evidence translation @id("evidence_translation") kind conversion-replay-proof status passed path reports/conversion.json
}
`;

const plan = createUniversalConversionPlanFromFrontierSource(source, {
  fileName: 'interlingua-conversion.frontier',
  generatedAt: 903,
  universalCapabilityMatrix: capabilityMatrix('javascript', 'rust'),
  evidence: [{ id: 'proof_translation', kind: 'conversion-replay-proof', status: 'passed', sourceLanguage: 'javascript', target: 'rust' }]
});

assert.equal(plan.document.metadata.universalInterlingua.id, 'interlingua_js_rust');
assert.equal(plan.metadata.authoredFrontierSource.universalInterlinguaId, 'interlingua_js_rust');
assert.equal(plan.metadata.authoredFrontierSource.universalInterlinguaRecordIds[0], 'interlingua_js_rust');
assert.equal(plan.metadata.authoredFrontierSource.universalInterlinguaConstraintIds[0], 'constraint_borrow_await');
assert.equal(plan.metadata.authoredFrontierSource.universalInterlinguaObligationIds[0], 'obligation_borrow_await');
assert.equal(plan.metadata.authoredFrontierSource.universalInterlinguaLoweringIds[0], 'lowering_rust_adapter');
assert.equal(plan.metadata.authoredFrontierSource.universalInterlinguaLiftIds[0], 'lift_js');
assert.equal(plan.metadata.authoredFrontierSource.universalInterlinguaEvidenceIds.includes('evidence_translation'), true);

const route = queryUniversalConversionPlan(plan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  interlinguaConstraintFamily: 'borrow-scope',
  interlinguaConstraintObligationKind: 'borrow-across-await',
  interlinguaConstraintObligationStatus: 'missing',
  interlinguaConstraintObligationEvidenceId: 'evidence_borrow_scope',
  interlinguaConstraintObligationMissingEvidence: 'translation-borrow-scope:borrow-across-await',
  interlinguaProofEvidenceId: 'proof_translation',
  interlinguaTargetAdapterId: 'fixture-js-rust'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.interlingua.metadata.authoredInterlinguaId, 'interlingua_js_rust');
assert.equal(route.interlingua.metadata.authoredFrontierInterlingua, true);
assert.equal(route.interlingua.claims.semanticEquivalenceClaim, false);
assert.equal(route.interlingua.claims.autoMergeClaim, false);
assert.equal(route.interlingua.autoMergeClaim, false);
assert.equal(route.interlingua.semanticEquivalenceClaim, false);
assert.equal(route.interlingua.layers.representedKinds.includes('semantic-symbol'), true);
assert.equal(route.interlingua.layers.missingKinds.includes('semantic-ownership'), true);
assert.equal(route.interlingua.constraints.families.includes('borrow-scope'), true);
assert.equal(route.interlingua.constraints.requiredKinds.includes('borrow-across-await'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.id === 'obligation_borrow_await' && obligation.kind === 'borrow-across-await'), true);
assert.equal(route.interlingua.lowering.missingEvidence.includes('host-target-adapter-review'), true);
assert.equal(route.interlingua.lift.sourceImportIds[0], 'native_import_js');
assert.equal(queryUniversalConversionPlan(plan, { sourceLanguage: 'javascript', target: 'rust', interlinguaConstraintFamily: 'not-a-family' }).found, false);

function capabilityMatrix(language, target) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 903,
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
