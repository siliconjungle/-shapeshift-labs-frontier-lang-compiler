import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  createUniversalLayoutStyleConstraintEvidence,
  layoutStyleConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalLayoutStyleConstraintEvidence({
  sourceLanguage: 'css',
  target: 'css',
  mode: 'preserve-source',
  sourceLayoutStyleRecords: [
    { id: 'source_button_color', kind: 'css-rule', selector: '.button', styleProperty: 'color', value: 'red', sourceMapIds: ['map_button_color'], proofEvidenceIds: ['style_runtime_probe'] },
    { id: 'source_button_layout', kind: 'flex display focus-order', selector: '.button', display: 'flex', focusOrderHash: 'focus_hash' }
  ]
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-layout-style-record');
assert.equal(preserved.requiredKinds.includes('style-rule'), true);
assert.equal(preserved.requiredKinds.includes('selector-target'), true);
assert.equal(preserved.requiredKinds.includes('focus-order'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.layoutStyleEquivalenceClaim, false);
assert.equal(preserved.claims.computedStyleEquivalenceClaim, false);
assert.equal(preserved.claims.renderEquivalenceClaim, false);
assert.equal(preserved.claims.layoutEquivalenceClaim, false);
assert.equal(preserved.claims.styleEquivalenceClaim, false);
assert.equal(preserved.claims.visualEquivalenceClaim, false);
assert.equal(preserved.claims.browserEquivalenceClaim, false);
assert.equal(preserved.claims.browserRuntimeEquivalenceClaim, false);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(preserved.claims.autoMergeClaim, false);
assert.equal(layoutStyleConstraintMatches(preserved, { layoutStyleConstraintStatus: 'satisfied', layoutStyleConstraintSourceMapId: 'map_button_color' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 951,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['swiftui'],
  evidence: [routeProof()],
  layoutStyleConstraints: [{
    sourceLanguage: 'css',
    target: 'swiftui',
    sourceLayoutStyleRecords: [
      {
        id: 'source_button_style',
        kind: 'css-rule',
        selector: '.button',
        styleProperty: 'color',
        value: 'red',
        cascadeLayer: 'components',
        specificity: '0-1-0',
        display: 'flex',
        layoutSnapshotHash: 'layout_hash_source',
        focusOrderHash: 'focus_hash_source',
        sourceMapIds: ['map_style_source'],
        proofObligationIds: ['proof_button_style'],
        failClosed: true
      }
    ]
  }]
});

const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'css',
  target: 'swiftui',
  layoutStyleConstraintStatus: 'needs-evidence',
  layoutStyleConstraintMissingKind: 'selector-target'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.layoutStyleConstraint.status, 'needs-evidence');
assert.equal(route.layoutStyleConstraint.requiredKinds.includes('style-rule'), true);
assert.equal(route.layoutStyleConstraint.requiredKinds.includes('selector-target'), true);
assert.equal(route.layoutStyleConstraint.requiredKinds.includes('layout-snapshot'), true);
assert.equal(route.layoutStyleConstraint.missingKinds.includes('selector-target'), true);
assert.equal(route.layoutStyleConstraint.missingEvidence.includes('translation-layout-style:selector-target'), true);
assert.equal(route.layoutStyleConstraint.proofObligationIds.includes('proof_button_style'), true);
assert.equal(route.layoutStyleConstraint.claims.renderEquivalenceClaim, false);
assert.equal(route.layoutStyleConstraint.claims.layoutEquivalenceClaim, false);
assert.equal(route.layoutStyleConstraint.claims.computedStyleEquivalenceClaim, false);
assert.equal(route.layoutStyleConstraint.claims.autoMergeClaim, false);
assert.equal(route.translationAdmission.layoutStyleConstraint.status, 'needs-evidence');
assert.equal(route.translationAdmission.layoutStyleConstraintMissingEvidence.includes('translation-layout-style:selector-target'), true);
assert.equal(route.missingEvidence.includes('translation-layout-style:selector-target'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('layout-style'), true);
assert.equal(route.interlingua.constraints.families.includes('layout-style'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'layout-style' && obligation.kind === 'selector-target' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 952 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  layoutStyleConstraintMissingKind: 'selector-target',
  interlinguaConstraintFamily: 'layout-style',
  interlinguaConstraintObligationKind: 'selector-target',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.layoutStyleConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.layoutStyleConstraintMissingKinds.includes('selector-target'), true);
assert.equal(artifacts.summary.compactCounts.layoutStyleConstraint.missingKinds['selector-target'], 1);
assert.equal(artifact.admissionRecord.layoutStyleConstraint.status, 'needs-evidence');
assert.equal(artifact.admissionRecord.layoutStyleConstraintMissingEvidence.includes('translation-layout-style:selector-target'), true);

const worklist = createUniversalConversionWorklist(routePlan, { routeId: route.id });
const obligationWork = queryUniversalConversionWorklist(worklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'layout-style',
  interlinguaConstraintObligationKind: 'selector-target',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationWork.found, true);
assert.equal(obligationWork.bestItem.action, 'collect-interlingua-obligation-evidence');
assert.equal(obligationWork.bestItem.tasks.some((task) => task.includes('selector-target')), true);

function routeProof() {
  return { id: 'layout_style_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_css_to_swiftui', sourceLanguage: 'css', target: 'swiftui' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 951,
    languages: [{
      language: 'css',
      aliases: [],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target: 'swiftui', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-css-swiftui', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture ready adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language: 'css', targets: [{ target: 'swiftui', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['swiftui'] }
  };
}
