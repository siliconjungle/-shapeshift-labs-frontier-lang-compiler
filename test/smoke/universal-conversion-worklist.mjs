import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import {
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
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
const proofQuery = queryUniversalConversionWorklist(adapterGapWorklist, {
  kind: 'collect-translation-proof',
  evidenceKey: 'translation-proof-or-replay'
});
assert.equal(proofQuery.kind, 'frontier.lang.universalConversionWorklistQuery');
assert.equal(proofQuery.found, true);
assert.equal(proofQuery.bestItem.kind, 'collect-translation-proof');
assert.equal(proofQuery.summary.proofEvidenceGaps >= 1, true);

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
const runtimeQuery = queryUniversalConversionWorklist(runtimePlan, {
  kind: 'prove-runtime-adapter',
  runtimeAdapterRequirementId: runtimeRoute.runtimeAdapterRequirements[0].id
});
assert.equal(runtimeQuery.found, true);
assert.equal(runtimeQuery.bestItem.kind, 'prove-runtime-adapter');
assert.equal(runtimeQuery.bestItem.routeIds.includes(runtimeRoute.id), true);
assert.equal(runtimeWorklist.summary.runtimeProofSignalGaps >= 1, true);
assert.equal(runtimeWorklist.items.some((item) => item.kind === 'collect-runtime-proof-signal'
  && item.runtimeProofMissingSignals.includes('network-trace-hash')), true);
const runtimeSignalQuery = queryUniversalConversionWorklist(runtimePlan, {
  kind: 'collect-runtime-proof-signal',
  runtimeProofMissingSignal: 'network-trace-hash'
});
assert.equal(runtimeSignalQuery.found, true);
assert.equal(runtimeSignalQuery.bestItem.action, 'collect-runtime-proof-signals');
const obligationPlan = createUniversalConversionPlan({
  generatedAt: 803,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  imports: [scannedJsImport],
  evidence: [routeProof('obligation')],
  resourceTransfers: [{ sourceLanguage: 'javascript', target: 'rust', sourceResourceGraph: sourceResourceGraph(), targetResourceGraph: targetResourceGraph() }],
  lifetimeConstraints: [{ sourceLanguage: 'javascript', target: 'rust', sourceLifetimeConstraints: [{ kind: 'lifetime-region' }, { kind: 'loan borrow region' }, { kind: 'move region bound' }], targetLifetimeConstraints: [{ kind: 'lifetime-region' }, { kind: 'loan borrow region' }] }],
  controlFlowConstraints: [{ sourceLanguage: 'javascript', target: 'rust', sourceControlFlows: [{ id: 'branch', kind: 'branch condition' }, { id: 'await', kind: 'await-order promise chain' }], targetControlFlows: [{ id: 'rust_branch', kind: 'branch condition' }] }],
  borrowScopeConstraints: [{ sourceLanguage: 'javascript', target: 'rust', targetBorrowScopes: [{ id: 'rust_scope', kind: 'loan scope boundary' }] }]
});
const obligationWorklist = createUniversalConversionWorklist(obligationPlan);
assert.equal(obligationWorklist.summary.interlinguaObligationGaps >= 1, true);
assert.equal(obligationWorklist.items.some((item) => item.kind === 'collect-interlingua-obligation-proof'
  && item.interlinguaConstraintFamilies.includes('borrow-scope')
  && item.interlinguaConstraintObligationKinds.includes('borrow-across-await')), true);
const obligationQuery = queryUniversalConversionWorklist(obligationWorklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'borrow-scope',
  interlinguaConstraintObligationKind: 'borrow-across-await',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationQuery.found, true);
assert.equal(obligationQuery.bestItem.action, 'collect-interlingua-obligation-evidence');
assert.equal(obligationQuery.bestItem.tasks.some((task) => task.includes('borrow-across-await')), true);
const missQuery = queryUniversalConversionWorklist(adapterGapWorklist, { target: 'python' });
assert.equal(missQuery.found, false);
assert.equal(missQuery.reasons[0].includes('target=python'), true);
assert.equal(UniversalConversionWorkItemKinds.includes('prove-runtime-adapter'), true);
assert.equal(UniversalConversionWorkItemKinds.includes('collect-interlingua-obligation-proof'), true);
assert.equal(UniversalConversionWorkItemKinds.includes('collect-runtime-proof-signal'), true);

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

function graphSummary(overrides = {}) {
  return { records: 4, resources: 1, owners: 1, loans: 1, aliases: 0, moves: 0, drops: 0, lifetimeRegions: 1, unsafeBoundaries: 0, conflicts: 0, proofObligations: 0, unsafeBoundariesWithoutProof: 0, reasonCodes: [], ...overrides };
}

function sourceResourceGraph() {
  return {
    id: 'source_worklist_obligation_graph',
    summary: graphSummary({ moves: 1 }),
    resources: [{ id: 'user', resourceKind: 'object' }],
    owners: [{ id: 'user_owner', ownerKind: 'single' }],
    loans: [{ id: 'user_mut_loan', mode: 'mutable', lifetimeRegionId: 'lt_user' }],
    moves: [{ id: 'user_move', moveKind: 'move', lifetimeRegionId: 'lt_user' }],
    lifetimeRegions: [{ id: 'lt_user', lifetimeKind: 'lexical' }]
  };
}

function targetResourceGraph() {
  return {
    id: 'target_worklist_obligation_graph',
    summary: graphSummary(),
    resources: [{ id: 'user', resourceKind: 'object' }],
    owners: [{ id: 'user_owner', ownerKind: 'single' }],
    loans: [{ id: 'user_mut_loan', mode: 'mutable', lifetimeRegionId: 'lt_user' }],
    lifetimeRegions: [{ id: 'lt_user', lifetimeKind: 'lexical' }]
  };
}

function routeProof(id) {
  return { id: `worklist_${id}_proof`, kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_javascript_to_rust', sourceLanguage: 'javascript', target: 'rust' };
}
