import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionRouteEvidenceReceipt,
  createUniversalConversionWorklist,
  createUniversalDialectRegistry,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist
} from './compiler-api.mjs';

const blockedRegistry = createUniversalDialectRegistry({
  id: 'dialect_registry_blocked_js_runtime',
  language: 'javascript',
  dialects: [{
    id: 'dialect_js_process_env_to_rust',
    language: 'javascript',
    dialect: 'node.runtime',
    constructKind: 'runtime',
    name: 'process.env',
    projection: { disposition: 'unsupported', targets: ['rust'] }
  }]
});
const blockedPlan = createUniversalConversionPlan({
  generatedAt: 792,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  universalDialectRegistry: blockedRegistry,
  evidence: [routeProof('blocked_dialect')]
});
const blockedRoute = queryUniversalConversionPlan(blockedPlan, { sourceLanguage: 'javascript', target: 'rust' }).bestRoute;
assert.equal(blockedRoute.dialect.readiness, 'blocked');
assert.equal(blockedRoute.readiness, 'blocked');
assert.equal(blockedRoute.admissionAction, 'reject');
assert.equal(blockedRoute.blockers.some((reason) => reason.includes('Dialect projection is blocked')), true);
assert.equal(blockedRoute.missingEvidence.includes('dialect-projection-evidence'), true);
assert.equal(blockedRoute.representation.constructKinds.includes('dialect-projection'), true);
assert.equal(blockedRoute.representation.surfaces.dialect.recordIds.includes('dialect_js_process_env_to_rust'), true);
assert.equal(queryUniversalConversionPlan(blockedPlan, { dialectReadiness: 'blocked' }).bestRoute.id, blockedRoute.id);
assert.equal(queryUniversalConversionPlan(blockedPlan, { dialectConstructKind: 'runtime' }).bestRoute.id, blockedRoute.id);
assert.equal(queryUniversalConversionPlan(blockedPlan, { dialectRecordId: 'dialect_js_process_env_to_rust' }).bestRoute.id, blockedRoute.id);
assert.equal(queryUniversalConversionPlan(blockedPlan, { dialectReadiness: ['ready', 'blocked'], dialectRegistryId: ['missing_registry', blockedRegistry.id], dialectConstructKind: ['extern', 'runtime'], dialectRecordId: ['missing_record', 'dialect_js_process_env_to_rust'] }).bestRoute.id, blockedRoute.id);
assert.equal(createUniversalConversionRouteEvidenceReceipt(blockedPlan, { dialectReadiness: ['ready', 'blocked'], dialectRecordId: ['missing_record', 'dialect_js_process_env_to_rust'] }).routeId, blockedRoute.id);
assert.equal(blockedRoute.translationAdmission.dialectReadiness, 'blocked');
assert.equal(blockedRoute.translationAdmission.dialectRecordIds.includes('dialect_js_process_env_to_rust'), true);
assert.equal(queryUniversalConversionPlan(blockedPlan, {
  translationDialectReadiness: 'blocked',
  translationDialectRecordId: 'dialect_js_process_env_to_rust'
}).bestRoute.id, blockedRoute.id);
const blockedArtifacts = createUniversalConversionArtifacts(blockedPlan, { routeId: blockedRoute.id, generatedAt: 794 });
const blockedArtifact = queryUniversalConversionArtifacts(blockedArtifacts, {
  translationDialectReadiness: 'blocked',
  translationDialectRecordId: 'dialect_js_process_env_to_rust'
})[0];
assert.equal(blockedArtifact.routeId, blockedRoute.id);
assert.equal(blockedArtifacts.index.translationDialectReadinesses.includes('blocked'), true);
assert.equal(blockedArtifacts.index.translationDialectRecordIds.includes('dialect_js_process_env_to_rust'), true);
assert.equal(blockedArtifacts.summary.compactCounts.translationAdmission.dialectRecordIds.dialect_js_process_env_to_rust, 1);
const blockedWorklist = createUniversalConversionWorklist(blockedPlan, { routeId: blockedRoute.id });
const blockedDialectItem = queryUniversalConversionWorklist(blockedWorklist, {
  translationDialectReadiness: 'blocked',
  translationDialectRecordId: 'dialect_js_process_env_to_rust'
}).bestItem;
assert.equal(Boolean(blockedDialectItem), true);
assert.equal(blockedWorklist.summary.translationDialectReadinesses.includes('blocked'), true);
assert.equal(blockedWorklist.summary.translationDialectRecordIds.includes('dialect_js_process_env_to_rust'), true);

const reviewRegistry = createUniversalDialectRegistry({
  id: 'dialect_registry_review_js_generator',
  language: 'javascript',
  externs: [{
    id: 'extern_vite_virtual_routes_to_rust',
    language: 'javascript',
    dialect: 'vite.plugin.virtual-module',
    externKind: 'generatorArtifact',
    name: 'virtual:routes',
    evidenceIds: ['evidence_vite_routes_manifest'],
    projection: {
      disposition: 'runtime-required',
      targets: ['rust'],
      evidenceIds: ['evidence_vite_routes_manifest']
    }
  }]
});
const reviewPlan = createUniversalConversionPlan({
  generatedAt: 793,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  imports: [{ language: 'javascript', universalAst: { metadata: { dialects: reviewRegistry } } }],
  evidence: [routeProof('review_dialect')]
});
const reviewRoute = queryUniversalConversionPlan(reviewPlan, { dialectRegistryId: reviewRegistry.id }).bestRoute;
assert.equal(reviewRoute.dialect.readiness, 'needs-review');
assert.equal(reviewRoute.readiness, 'needs-review');
assert.equal(reviewRoute.admissionAction, 'prioritize');
assert.equal(reviewRoute.missingEvidence.includes('dialect-projection-evidence'), false);
assert.equal(reviewRoute.review.some((reason) => reason.includes('Dialect projection needs review')), true);
assert.equal(reviewRoute.representation.constructs.find((entry) => entry.kind === 'dialect-projection').status, 'review');
assert.equal(queryUniversalConversionPlan(reviewPlan, { dialectDisposition: 'runtime-required' }).bestRoute.id, reviewRoute.id);
assert.equal(queryUniversalConversionPlan(reviewPlan, { dialectRegistryId: ['missing_registry', reviewRegistry.id], dialectDisposition: ['unsupported', 'runtime-required'] }).bestRoute.id, reviewRoute.id);

function routeProof(id) {
  return {
    id: `evidence_${id}_proof`,
    kind: 'conversion-replay-proof',
    status: 'passed',
    routeId: 'conversion_javascript_to_rust',
    sourceLanguage: 'javascript',
    target: 'rust'
  };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 792,
    languages: [{
      language: 'javascript',
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
        targets: [{
          target: 'rust',
          lossClass: 'targetAdapterProjection',
          supported: true,
          readiness: 'ready',
          adapter: 'fixture-js-rust',
          adapterKind: 'targetProjection',
          lossKinds: [],
          reason: 'fixture ready adapter'
        }]
      },
      blockers: [],
      review: []
    }],
    matrices: {
      projectionReadiness: {
        languages: [{ language: 'javascript', targets: [{ target: 'rust', readiness: 'ready' }] }]
      }
    },
    metadata: { compileTargets: ['rust'] }
  };
}
