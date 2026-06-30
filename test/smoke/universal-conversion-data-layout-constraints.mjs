import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionWorklist,
  createUniversalDataLayoutConstraintEvidence,
  dataLayoutConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalDataLayoutConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'frontier-lang',
  sourceDataLayoutRecords: [
    { id: 'source_repr', kind: 'repr(C) field-order field-offset alignment', structId: 'Packet', sizeBytes: 16, alignmentBytes: 8 },
    { id: 'source_enum', kind: 'enum-discriminant tagged-union niche-optimization', enumId: 'PacketKind' }
  ],
  targetDataLayoutRecords: [
    { id: 'target_repr', kind: 'repr(C) field-order field-offset alignment', structId: 'Packet', sizeBytes: 16, alignmentBytes: 8 },
    { id: 'target_enum', kind: 'enum-discriminant tagged-union niche-optimization', enumId: 'PacketKind' }
  ],
  evidenceIds: ['data_layout_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-data-layout-record');
assert.equal(preserved.requiredKinds.includes('field-offset'), true);
assert.equal(preserved.requiredKinds.includes('enum-discriminant'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(dataLayoutConstraintMatches(preserved, { dataLayoutConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 949,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  evidence: [routeProof()],
  dataLayoutConstraints: [{
    sourceLanguage: 'c',
    target: 'rust',
    sourceDataLayoutRecords: [
      { id: 'source_packet', kind: 'packed-layout field-order field-offset bitfield-layout', structId: 'Packet', bitfieldId: 'Packet.flags', offsetBytes: 4 },
      { id: 'source_abi', kind: 'ffi-boundary abi-calling-convention endian pointer-width', callingConvention: 'cdecl', pointerWidth: 64 }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'c',
  target: 'rust',
  dataLayoutConstraintStatus: 'needs-evidence',
  dataLayoutConstraintMissingKind: 'field-offset'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.dataLayoutConstraint.status, 'needs-evidence');
assert.equal(route.dataLayoutConstraint.missingKinds.includes('bitfield-layout'), true);
assert.equal(route.translationAdmission.dataLayoutConstraint.status, 'needs-evidence');
assert.equal(route.translationAdmission.dataLayoutConstraintMissingEvidence.includes('translation-data-layout:field-offset'), true);
assert.equal(route.missingEvidence.includes('translation-data-layout:field-offset'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('data-layout'), true);
assert.equal(route.interlingua.constraints.families.includes('data-layout'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'data-layout' && obligation.kind === 'field-offset' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 950 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  dataLayoutConstraintMissingKind: 'field-offset',
  interlinguaConstraintFamily: 'data-layout',
  interlinguaConstraintObligationKind: 'field-offset',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.dataLayoutConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.dataLayoutConstraintMissingKinds.includes('field-offset'), true);
assert.equal(artifacts.summary.compactCounts.dataLayoutConstraint.missingKinds['field-offset'], 1);
assert.equal(artifact.admissionRecord.dataLayoutConstraint.status, 'needs-evidence');

const worklist = createUniversalConversionWorklist(routePlan, { routeId: route.id });
const obligationWork = queryUniversalConversionWorklist(worklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'data-layout',
  interlinguaConstraintObligationKind: 'field-offset',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationWork.found, true);
assert.equal(obligationWork.bestItem.action, 'collect-interlingua-obligation-evidence');
assert.equal(obligationWork.bestItem.tasks.some((task) => task.includes('field-offset')), true);

function routeProof() {
  return { id: 'data_layout_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_c_to_rust', sourceLanguage: 'c', target: 'rust' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 949,
    languages: [{
      language: 'c',
      aliases: [],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target: 'rust', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-c-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture ready adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language: 'c', targets: [{ target: 'rust', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['rust'] }
  };
}
