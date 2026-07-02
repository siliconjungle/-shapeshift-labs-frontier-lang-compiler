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
    lossIds: ['loss_node_process_env_projection'],
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
assert.equal(queryUniversalConversionPlan(blockedPlan, { dialectLossId: 'loss_node_process_env_projection' }).bestRoute.id, blockedRoute.id);
assert.equal(queryUniversalConversionPlan(blockedPlan, { dialectLossId: 'missing_loss' }).found, false);
assert.equal(queryUniversalConversionPlan(blockedPlan, { dialectRecordId: 'dialect_js_process_env_to_rust' }).bestRoute.id, blockedRoute.id);
assert.equal(queryUniversalConversionPlan(blockedPlan, { dialectReadiness: ['ready', 'blocked'], dialectRegistryId: ['missing_registry', blockedRegistry.id], dialectConstructKind: ['extern', 'runtime'], dialectRecordId: ['missing_record', 'dialect_js_process_env_to_rust'] }).bestRoute.id, blockedRoute.id);
assert.equal(createUniversalConversionRouteEvidenceReceipt(blockedPlan, { dialectReadiness: ['ready', 'blocked'], dialectRecordId: ['missing_record', 'dialect_js_process_env_to_rust'], dialectLossId: 'loss_node_process_env_projection' }).routeId, blockedRoute.id);
const blockedLossReceipt = createUniversalConversionRouteEvidenceReceipt(blockedPlan, { dialectLossId: 'loss_node_process_env_projection' });
assert.equal(blockedLossReceipt.dialectLossIds.includes('loss_node_process_env_projection'), true);
assert.equal(blockedLossReceipt.summary.routeDialect.lossIds.loss_node_process_env_projection, 1);
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
assert.equal(blockedArtifacts.summary.compactCounts.routeDialect.lossIds.loss_node_process_env_projection, 1);
const blockedLossArtifacts = createUniversalConversionArtifacts(blockedPlan, { dialectLossId: 'loss_node_process_env_projection' });
assert.equal(blockedLossArtifacts.index.dialectLossIds.includes('loss_node_process_env_projection'), true);
assert.equal(queryUniversalConversionArtifacts(blockedLossArtifacts, { dialectLossId: 'loss_node_process_env_projection' })[0].routeId, blockedRoute.id);
assert.equal(createUniversalConversionArtifacts(blockedPlan, { dialectLossId: 'missing_loss' }).routeArtifacts.length, 0);
const blockedWorklist = createUniversalConversionWorklist(blockedPlan, { routeId: blockedRoute.id });
const blockedDialectItem = queryUniversalConversionWorklist(blockedWorklist, {
  translationDialectReadiness: 'blocked',
  translationDialectRecordId: 'dialect_js_process_env_to_rust'
}).bestItem;
assert.equal(Boolean(blockedDialectItem), true);
assert.equal(blockedWorklist.summary.translationDialectReadinesses.includes('blocked'), true);
assert.equal(blockedWorklist.summary.translationDialectRecordIds.includes('dialect_js_process_env_to_rust'), true);
const blockedLossWorklist = createUniversalConversionWorklist(blockedPlan, { dialectLossId: 'loss_node_process_env_projection' });
assert.equal(blockedLossWorklist.items.length > 0, true);
assert.equal(queryUniversalConversionWorklist(blockedLossWorklist, { dialectLossId: 'loss_node_process_env_projection' }).found, true);
assert.equal(createUniversalConversionWorklist(blockedPlan, { dialectLossId: 'missing_loss' }).items.length, 0);
assert.equal(queryUniversalConversionWorklist(blockedLossWorklist, { dialectLossId: 'missing_loss' }).found, false);

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
assert.equal(reviewRoute.dialect.externKinds.includes('generatorArtifact'), true);
assert.equal(reviewRoute.dialect.evidenceIds.includes('evidence_vite_routes_manifest'), true);
assert.equal(queryUniversalConversionPlan(reviewPlan, { dialectDisposition: 'runtime-required' }).bestRoute.id, reviewRoute.id);
assert.equal(queryUniversalConversionPlan(reviewPlan, { dialectExternKind: 'generatorArtifact', dialectEvidenceId: 'evidence_vite_routes_manifest' }).bestRoute.id, reviewRoute.id);
assert.equal(queryUniversalConversionPlan(reviewPlan, { dialectExternKind: 'macroExpansion' }).found, false);
assert.equal(queryUniversalConversionPlan(reviewPlan, { dialectRegistryId: ['missing_registry', reviewRegistry.id], dialectDisposition: ['unsupported', 'runtime-required'], dialectEvidenceId: ['missing_evidence', 'evidence_vite_routes_manifest'] }).bestRoute.id, reviewRoute.id);
const reviewReceipt = createUniversalConversionRouteEvidenceReceipt(reviewPlan, { dialectExternKind: 'generatorArtifact', dialectEvidenceId: 'evidence_vite_routes_manifest' });
assert.equal(reviewReceipt.routeId, reviewRoute.id);
assert.equal(reviewReceipt.dialectExternKinds.includes('generatorArtifact'), true);
assert.equal(reviewReceipt.summary.routeDialect.externKinds.generatorArtifact, 1);
assert.equal(reviewReceipt.summary.routeDialect.evidenceIds.evidence_vite_routes_manifest, 1);
const reviewArtifacts = createUniversalConversionArtifacts(reviewPlan, { dialectExternKind: 'generatorArtifact', dialectEvidenceId: 'evidence_vite_routes_manifest' });
assert.equal(reviewArtifacts.index.dialectExternKinds.includes('generatorArtifact'), true);
assert.equal(reviewArtifacts.index.dialectEvidenceIds.includes('evidence_vite_routes_manifest'), true);
assert.equal(reviewArtifacts.summary.compactCounts.routeDialect.externKinds.generatorArtifact, 1);
assert.equal(reviewArtifacts.summary.compactCounts.routeDialect.evidenceIds.evidence_vite_routes_manifest, 1);
assert.equal(queryUniversalConversionArtifacts(reviewArtifacts, { dialectExternKind: 'generatorArtifact', dialectEvidenceId: 'evidence_vite_routes_manifest' })[0].routeId, reviewRoute.id);
assert.equal(createUniversalConversionArtifacts(reviewPlan, { dialectExternKind: 'macroExpansion' }).routeArtifacts.length, 0);
const reviewWorklist = createUniversalConversionWorklist(reviewPlan, { dialectExternKind: 'generatorArtifact', dialectEvidenceId: 'evidence_vite_routes_manifest' });
assert.equal(reviewWorklist.items.length > 0, true);
assert.equal(reviewWorklist.summary.dialectExternKinds.includes('generatorArtifact'), true);
assert.equal(reviewWorklist.summary.dialectEvidenceIds.includes('evidence_vite_routes_manifest'), true);
assert.equal(queryUniversalConversionWorklist(reviewWorklist, { dialectExternKind: 'generatorArtifact', dialectEvidenceId: 'evidence_vite_routes_manifest' }).bestItem.routeIds.includes(reviewRoute.id), true);
assert.equal(queryUniversalConversionWorklist(reviewWorklist, { dialectExternKind: 'macroExpansion' }).found, false);
assert.equal(createUniversalConversionWorklist(reviewPlan, { dialectEvidenceId: 'missing_evidence' }).items.length, 0);

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
