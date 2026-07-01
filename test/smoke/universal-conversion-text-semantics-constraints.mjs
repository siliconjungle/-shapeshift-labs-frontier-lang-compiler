import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalTextSemanticsConstraintEvidence,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  textSemanticsConstraintMatches,
  UniversalInterlinguaConstraintEdgeKinds,
  UniversalInterlinguaLayerKinds
} from './compiler-api.mjs';

const textKinds = [
  'text-type',
  'encoding',
  'code-unit',
  'code-point',
  'grapheme-cluster',
  'indexing-semantics',
  'slicing-semantics',
  'normalization',
  'locale',
  'collation',
  'case-mapping',
  'regex-semantics',
  'escaping',
  'interpolation',
  'null-termination',
  'byte-text-boundary',
  'string-mutability'
];

const preserved = createUniversalTextSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceTextSemanticsRecords: [textRecord('source_text_contract', textKinds)],
  targetTextSemanticsRecords: [textRecord('target_text_contract', textKinds)],
  evidenceIds: ['text_semantics_contract_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-text-semantics-record');
assert.equal(preserved.requiredKinds.includes('encoding'), true);
assert.equal(preserved.requiredKinds.includes('regex-semantics'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.textEquivalenceClaim, false);
assert.equal(preserved.claims.unicodeEquivalenceClaim, false);
assert.equal(preserved.claims.regexEquivalenceClaim, false);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(preserved.claims.autoMergeClaim, false);
assert.equal(textSemanticsConstraintMatches(preserved, { textSemanticsConstraintStatus: 'satisfied' }), true);

const failClosedWithoutTarget = createUniversalTextSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceTextSemanticsRecords: [textRecord('source_unicode_regex', [
    'encoding',
    'code-unit',
    'indexing-semantics',
    'normalization',
    'regex-semantics',
    'byte-text-boundary'
  ])]
});

assert.equal(failClosedWithoutTarget.status, 'needs-evidence');
assert.equal(failClosedWithoutTarget.action, 'collect-text-semantics-evidence');
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-text-semantics-target-evidence'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-text-semantics-proof'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-text-semantics:normalization'), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Unicode encoding')), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Regex engine')), true);
assert.equal(failClosedWithoutTarget.claims.semanticEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.autoMergeClaim, false);

const preserveSource = createUniversalConversionPlan({
  generatedAt: 2401,
  universalCapabilityMatrix: capabilityMatrix('typescript', 'typescript', ['ts']),
  targets: ['typescript'],
  evidence: [routeProof('typescript', 'typescript')],
  textSemanticsConstraints: [{
    sourceLanguage: 'typescript',
    target: 'typescript',
    sourceTextSemanticsRecords: [textRecord('same_language_string_contract', ['text-type', 'encoding', 'code-unit'])]
  }]
});
const preserveRoute = queryUniversalConversionPlan(preserveSource, {
  sourceLanguage: 'typescript',
  target: 'typescript',
  textSemanticsConstraintStatus: 'satisfied'
}).bestRoute;

assert.equal(Boolean(preserveRoute), true);
assert.equal(preserveRoute.mode, 'preserve-source');
assert.equal(preserveRoute.textSemanticsConstraint.status, 'satisfied');
assert.equal(preserveRoute.textSemanticsConstraint.missingEvidence.length, 0);
assert.equal(preserveRoute.translationAdmission.textSemanticsConstraintStatus, 'satisfied');
assert.equal(preserveRoute.semanticEquivalenceClaim, false);

const routePlan = createUniversalConversionPlan({
  generatedAt: 2402,
  universalCapabilityMatrix: capabilityMatrix('rust', 'typescript'),
  targets: ['typescript'],
  evidence: [routeProof('rust', 'typescript')],
  imports: [{ language: 'rust', textSemanticsRecords: [textRecord('imported_str_contract', ['encoding', 'code-point', 'byte-text-boundary'])] }],
  textSemanticsConstraints: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceTextSemanticsRecords: [textRecord('route_text_contract', [
      'encoding',
      'code-unit',
      'code-point',
      'grapheme-cluster',
      'indexing-semantics',
      'normalization',
      'case-mapping',
      'regex-semantics',
      'byte-text-boundary'
    ])],
    targetTextSemanticsRecords: [{ id: 'target_partial_text_contract', kind: 'text', constraintKinds: ['encoding', 'code-unit'] }]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  textSemanticsConstraintStatus: 'degraded',
  textSemanticsConstraintMissingKind: 'normalization',
  interlinguaConstraintFamily: 'text-semantics',
  interlinguaConstraintObligationKind: 'normalization',
  interlinguaConstraintObligationStatus: 'missing'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.textSemanticsConstraint.status, 'degraded');
assert.equal(route.textSemanticsConstraint.missingKinds.includes('normalization'), true);
assert.equal(route.textSemanticsConstraint.missingEvidence.includes('translation-text-semantics:regex-semantics'), true);
assert.equal(route.missingEvidence.includes('translation-text-semantics-proof'), true);
assert.equal(route.translationAdmission.textSemanticsConstraintStatus, 'degraded');
assert.equal(route.translationAdmission.requiredConstructKinds.includes('text-semantics-contract'), true);
assert.equal(route.interlingua.layers.kinds.includes('text-semantics-contract'), true);
assert.equal(route.interlingua.constraints.families.includes('text-semantics'), true);
const textNormalizationObligation = route.interlingua.constraints.obligations.find((obligation) => obligation.family === 'text-semantics' && obligation.kind === 'normalization');
assert.equal(textNormalizationObligation.status, 'missing');
assert.equal(textNormalizationObligation.sourceNodeIds.includes('route_text_contract'), true);
assert.equal(textNormalizationObligation.targetNodeIds.length, 0);
assert.equal(UniversalInterlinguaLayerKinds.includes('text-semantics-contract'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('text-semantics'), true);
assert.equal(route.autoMergeClaim, false);
assert.equal(route.semanticEquivalenceClaim, false);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 2403 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  textSemanticsConstraintMissingKind: 'normalization',
  textSemanticsConstraintMissingEvidence: 'translation-text-semantics:regex-semantics',
  interlinguaConstraintFamily: 'text-semantics',
  interlinguaConstraintObligationKind: 'normalization',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.textSemanticsConstraint.status, 'degraded');
assert.equal(artifacts.index.textSemanticsConstraintStatuses.includes('degraded'), true);
assert.equal(artifacts.index.textSemanticsConstraintMissingKinds.includes('normalization'), true);
assert.equal(artifacts.summary.compactCounts.textSemanticsConstraint.missingKinds.normalization, 1);
assert.equal(artifact.admissionRecord.textSemanticsConstraint.status, 'degraded');
assert.equal(artifact.admissionRecord.metadata.textSemanticsConstraint.status, 'degraded');
assert.equal(artifact.materialization.autoMergeClaim, false);
assert.equal(artifact.materialization.semanticEquivalenceClaim, false);
assert.equal(artifact.autoMergeClaim, false);
assert.equal(artifact.semanticEquivalenceClaim, false);

function textRecord(id, constraintKinds) {
  return {
    id,
    kind: 'text',
    name: 'DisplayName',
    encoding: 'utf-8',
    codeUnit: 'byte',
    indexingUnit: 'unicode-scalar',
    normalizationForm: 'nfc',
    locale: 'en-US',
    collation: 'unicode-collation',
    caseMapping: 'locale-aware',
    regexEngine: 'unicode-regex',
    escapeMode: 'raw-string',
    interpolationMode: 'template',
    termination: 'length-prefixed',
    boundaryKinds: ['byte', 'code-point', 'grapheme'],
    mutability: 'immutable',
    constraintKinds
  };
}

function routeProof(sourceLanguage, target) {
  return { id: `text_route_proof_${sourceLanguage}_${target}`, kind: 'conversion-replay-proof', status: 'passed', routeId: `conversion_${sourceLanguage}_to_${target}`, sourceLanguage, target };
}

function capabilityMatrix(language, target, aliases = ['rs']) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 2400,
    languages: [{
      language,
      aliases,
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target, lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: `fixture-${language}-${target}`, adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language, targets: [{ target, readiness: 'ready' }] }] } },
    metadata: { compileTargets: [target] }
  };
}
