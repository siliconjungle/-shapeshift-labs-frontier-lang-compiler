import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import {
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  queryUniversalConversionPlan,
  UniversalConversionWorkItemKinds
} from './compiler-api.mjs';

const adapterGapPlan = createUniversalConversionPlan({
  generatedAt: 801,
  imports: [scannedJsImport],
  targets: ['rust']
});
const adapterGapWorklist = createUniversalConversionWorklist(adapterGapPlan);
assert.equal(adapterGapWorklist.kind, 'frontier.lang.universalConversionWorklist');
assert.equal(adapterGapWorklist.planId, adapterGapPlan.id);
assert.equal(adapterGapWorklist.metadata.autoMergeClaim, false);
assert.equal(adapterGapWorklist.metadata.semanticEquivalenceClaim, false);
assert.equal(adapterGapWorklist.summary.autoMergeClaims, 0);
assert.equal(adapterGapWorklist.summary.semanticEquivalenceClaims, 0);
assert.equal(adapterGapWorklist.summary.targetAdapterGaps >= 1, true);
assert.equal(adapterGapWorklist.summary.proofEvidenceGaps >= 1, true);
assert.equal(adapterGapWorklist.items.some((item) => item.kind === 'add-target-adapter' && item.targets.includes('rust')), true);
assert.equal(adapterGapWorklist.items.some((item) => item.kind === 'collect-translation-proof'), true);
assert.equal(adapterGapWorklist.items.every((item) => item.autoMergeClaim === false && item.semanticEquivalenceClaim === false), true);

const filteredWorklist = createUniversalConversionWorklist(adapterGapPlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  kind: 'add-target-adapter'
});
assert.equal(filteredWorklist.items.length >= 1, true);
assert.equal(filteredWorklist.items.every((item) => item.kind === 'add-target-adapter'), true);

const runtimePlan = createUniversalConversionPlan({
  generatedAt: 802,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'fetch' }],
  evidence: [{
    id: 'runtime_fetch_route_proof',
    kind: 'conversion-runtime-proof',
    status: 'passed',
    routeId: 'conversion_javascript_to_rust',
    sourceLanguage: 'javascript',
    target: 'rust'
  }]
});
const runtimeRoute = queryUniversalConversionPlan(runtimePlan, { sourceLanguage: 'javascript', target: 'rust' }).bestRoute;
const runtimeWorklist = createUniversalConversionWorklist(runtimePlan, { routeId: runtimeRoute.id });
assert.equal(runtimeWorklist.summary.runtimeAdapterGaps >= 1, true);
assert.equal(runtimeWorklist.items.some((item) => item.kind === 'prove-runtime-adapter'
  && item.runtimeAdapterRequirementIds.includes(runtimeRoute.runtimeAdapterRequirements[0].id)), true);
assert.equal(UniversalConversionWorkItemKinds.includes('prove-runtime-adapter'), true);

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 802,
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
