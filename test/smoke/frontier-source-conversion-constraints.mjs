import { assert } from './helpers.mjs';
import {
  compileFrontierSource,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionRouteEvidenceReceipt,
  createUniversalConversionWorklist,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const source = `
module ConversionProbe @id("mod_conversion_probe")

conversion JsToRust @id("conversion_js_rust") {
  sourceLanguage javascript
  target rust
  constraint type publicApi @id("type_constraint_public_api") role source kind property symbol symbol:nickname signatureHash sig_read_user optional evidence evidence_type_translation_proof
  constraint type rustApi @id("type_constraint_rust_api") role target kind public-function symbol symbol:nicknameRust signatureHash sig_read_user evidence evidence_type_translation_proof
  constraint controlFlow saveFlow @id("control_flow_save") role source kind async-flow from action_save to effect_persist evidence evidence_type_translation_proof async
}
`;

const result = compileFrontierSource(source, { target: 'javascript' });
assert.equal(result.ok, true);
assert.equal(result.document.metadata.universalConversionPlan.targets[0], 'rust');
assert.equal(result.document.metadata.universalConversionPlan.typeConstraints[0].sourceTypes[0].optional, true);

const rawInput = {
  document: result.document,
  generatedAt: 901,
  universalCapabilityMatrix: capabilityMatrix('javascript', 'rust'),
  imports: [sourceImport()],
  evidence: [routeProof()]
};

const plan = createUniversalConversionPlan(rawInput);
assert.equal(plan.metadata.compileTargets[0], 'rust');

const route = queryUniversalConversionPlan(plan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  typeConstraintMissingKind: 'nullability'
}).bestRoute;
assert.equal(Boolean(route), true);
assert.equal(route.translationAdmission.typeConstraintStatus, 'degraded');
assert.equal(route.typeConstraint.missingEvidence.includes('translation-type-constraint:nullability'), true);
assert.equal(route.typeConstraint.targetTypes[0].symbolId, 'symbol:nicknameRust');
assert.equal(route.controlFlowConstraint.requiredKinds.includes('async-suspension'), true);

const rawQuery = queryUniversalConversionPlan(rawInput, {
  sourceLanguage: 'javascript',
  target: 'rust',
  typeConstraintMissingKind: 'nullability'
});
assert.equal(rawQuery.found, true);
assert.equal(rawQuery.bestRoute.typeConstraint.targetTypes[0].symbolId, 'symbol:nicknameRust');

const artifacts = createUniversalConversionArtifacts(rawInput, {
  sourceLanguage: 'javascript',
  target: 'rust',
  typeConstraintMissingKind: 'nullability'
});
assert.equal(artifacts.routeArtifacts.length, 1);
assert.equal(artifacts.routeArtifacts[0].typeConstraint.targetTypes[0].symbolId, 'symbol:nicknameRust');

const worklist = createUniversalConversionWorklist(rawInput, {
  sourceLanguage: 'javascript',
  target: 'rust'
});
assert.equal(worklist.summary.missingEvidence.includes('translation-type-constraint:nullability'), true);

const receipt = createUniversalConversionRouteEvidenceReceipt(rawInput, {
  sourceLanguage: 'javascript',
  target: 'rust',
  typeConstraintMissingKind: 'nullability'
});
assert.equal(receipt.missingEvidence.includes('translation-type-constraint:nullability'), true);
assert.equal(receipt.interlinguaConstraintSourceIds.includes('type_constraint_public_api'), true);
assert.equal(receipt.interlinguaConstraintEvidenceIds.includes('evidence_type_translation_proof'), true);

function capabilityMatrix(language, target) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 901,
    languages: [{
      language,
      aliases: ['js'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: {
          exactSource: { evidence: { importsWithExactSource: 1 } },
          stubs: { evidence: { importsWithDeclarations: 1 } }
        },
        targets: [{ target, lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-js-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language, targets: [{ target, readiness: 'ready' }] }] } },
    metadata: { compileTargets: [target] }
  };
}

function sourceImport() {
  return {
    id: 'native_import_js_conversion_constraints',
    language: 'javascript',
    sourcePath: 'src/public-api.js',
    sourceHash: 'hash_public_api_source',
    evidence: [{ id: 'native_import_conversion_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_public_api', ownershipKeys: ['symbol.publicApi'], conflictKeys: ['symbol.publicApi'] }],
    sourceMaps: [{ id: 'source_map_conversion', mappings: [{ id: 'source_map_mapping_conversion', ownershipRegionKey: 'symbol.publicApi', sourceSpan: { path: 'src/public-api.js' } }] }]
  };
}

function routeProof() {
  return {
    id: 'evidence_type_translation_proof',
    kind: 'conversion-replay-proof',
    status: 'passed',
    sourceLanguage: 'javascript',
    target: 'rust'
  };
}
