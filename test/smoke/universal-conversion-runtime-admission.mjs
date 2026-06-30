import { assert } from './helpers.mjs';
import {
  createUniversalConversionPlan,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const missingDomRoute = conversionRouteForRequirement('dom');
assert.equal(missingDomRoute.runtime.readiness, 'needs-review');
assert.equal(missingDomRoute.runtime.missingCapabilities.includes('dom'), true);
assert.equal(missingDomRoute.readiness, 'blocked');
assert.equal(missingDomRoute.admissionAction, 'reject');
assert.equal(missingDomRoute.priority, 'blocker');
assert.equal(missingDomRoute.blockers.includes('Runtime capability is missing: dom.'), true);
assert.equal(missingDomRoute.missingEvidence.includes('runtime-capability:dom'), true);
assert.equal(missingDomRoute.missingEvidence.includes('runtime-adapter-proof'), true);
assert.equal(missingDomRoute.mergeScore.risk, 'high');

const fetchAdapterRoute = conversionRouteForRequirement('fetch');
assert.equal(fetchAdapterRoute.runtime.readiness, 'needs-review');
assert.equal(fetchAdapterRoute.runtime.missingCapabilities.length, 0);
assert.equal(fetchAdapterRoute.runtime.adapterRequirements.length, 1);
assert.equal(fetchAdapterRoute.readiness, 'needs-review');
assert.equal(fetchAdapterRoute.admissionAction, 'prioritize');
assert.equal(fetchAdapterRoute.missingEvidence.includes('runtime-adapter-proof'), true);
assert.equal(fetchAdapterRoute.review.some((reason) => reason.includes('Runtime adapter evidence is required for fetch.')), true);
assert.equal(fetchAdapterRoute.mergeScore.risk, 'medium');

const hostPlan = createUniversalConversionPlan({
  generatedAt: 791,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  sourceHosts: ['javascript:web', 'javascript:node'],
  targetHosts: ['rust:cli'],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'filesystem' }],
  evidence: [{ id: 'host_filesystem_proof', kind: 'conversion-runtime-proof', status: 'passed', sourceLanguage: 'javascript', target: 'rust' }]
});
const hostQuery = queryUniversalConversionPlan(hostPlan, { sourceLanguage: 'javascript', target: 'rust' });
assert.equal(hostQuery.routes.length, 2);
assert.equal(new Set(hostQuery.routes.map((route) => route.id)).size, 2);
const webHostRoute = queryUniversalConversionPlan(hostPlan, { sourceHostId: 'javascript:web', target: 'rust' }).bestRoute;
const nodeHostRoute = queryUniversalConversionPlan(hostPlan, { sourceRuntime: 'node', target: 'rust' }).bestRoute;
assert.equal(webHostRoute.runtime.source.id, 'javascript:web');
assert.equal(webHostRoute.readiness, 'blocked');
assert.equal(webHostRoute.admissionAction, 'reject');
assert.equal(nodeHostRoute.runtime.source.id, 'javascript:node');
assert.equal(nodeHostRoute.readiness, 'needs-review');
assert.equal(nodeHostRoute.admissionAction, 'prioritize');
assert.equal(hostQuery.bestRoute.id, nodeHostRoute.id);
assert.equal(queryUniversalConversionPlan(hostPlan, { runtimeReadiness: 'blocked' }).bestRoute.id, webHostRoute.id);
assert.equal(queryUniversalConversionPlan(hostPlan, { runtimeAdapterRequirementId: nodeHostRoute.runtimeAdapterRequirements[0].id }).bestRoute.id, nodeHostRoute.id);

function conversionRouteForRequirement(capability) {
  const plan = createUniversalConversionPlan({
    generatedAt: 790,
    universalCapabilityMatrix: readyCapabilityMatrix(),
    targets: ['rust'],
    runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability }],
    evidence: [routeProof(capability)]
  });
  return queryUniversalConversionPlan(plan, {
    sourceLanguage: 'javascript',
    target: 'rust'
  }).bestRoute;
}

function routeProof(capability) {
  return {
    id: `runtime_${capability}_proof`,
    kind: 'conversion-runtime-proof',
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
    generatedAt: 790,
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
