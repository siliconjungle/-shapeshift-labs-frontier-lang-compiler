import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  importNativeSource,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const rustImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/ownership_transfer.rs',
  sourceText: [
    'pub fn transfer(value: String) -> String {',
    '  let local = value;',
    '  audit(local);',
    '  let output = String::new();',
    '  output',
    '}',
    ''
  ].join('\n')
});
const sidecar = createSemanticImportSidecar(rustImport, { generatedAt: 812 });
const plan = createUniversalConversionPlan({
  generatedAt: 812,
  universalCapabilityMatrix: rustToTypescriptCapabilityMatrix(),
  targets: ['typescript'],
  imports: [rustImport],
  evidence: [routeProof()],
  resourceTransfers: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceGraph: sidecar.resourceGraph
  }]
});
const route = queryUniversalConversionPlan(plan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  resourceTransferStatus: 'needs-evidence',
  ownershipConstraintMissingKind: 'call-argument-ownership-transfer'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.resourceTransfer.ownershipConstraints.missingKinds.includes('return-ownership-transfer'), true);
assert.equal(route.missingEvidence.includes('translation-ownership-constraint:call-argument-ownership-transfer'), true);
assert.equal(route.translationAdmission.status, 'needs-evidence');

const artifacts = createUniversalConversionArtifacts(plan, { routeId: route.id, generatedAt: 813 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  ownershipConstraintMissingEvidence: 'translation-ownership-constraint:return-ownership-transfer'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifacts.index.ownershipConstraintMissingKinds.includes('call-argument-ownership-transfer'), true);
assert.equal(artifacts.summary.compactCounts.resourceTransfer.ownershipConstraintMissingKinds['return-ownership-transfer'], 1);

const copyCloneDropImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/copy_clone_drop.rs',
  sourceText: [
    'pub fn copy_clone_drop(source: String, count: usize) -> String {',
    '  let temp = String::new();',
    '  let copied = count;',
    '  let cloned = source.clone();',
    '  consume(cloned);',
    '  source',
    '}',
    ''
  ].join('\n')
});
const copyCloneDropSidecar = createSemanticImportSidecar(copyCloneDropImport, { generatedAt: 814 });
const copyCloneDropPlan = createUniversalConversionPlan({
  generatedAt: 814,
  universalCapabilityMatrix: rustToTypescriptCapabilityMatrix(),
  targets: ['typescript'],
  imports: [copyCloneDropImport],
  evidence: [routeProof()],
  resourceTransfers: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceGraph: copyCloneDropSidecar.resourceGraph
  }]
});
const copyCloneDropRoute = queryUniversalConversionPlan(copyCloneDropPlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  ownershipConstraintMissingKind: 'clone-produces-owned-value'
}).bestRoute;

assert.equal(copyCloneDropRoute.resourceTransfer.ownershipConstraints.missingKinds.includes('copy-preserves-source'), true);
assert.equal(copyCloneDropRoute.resourceTransfer.ownershipConstraints.missingKinds.includes('destructor-drop-semantics'), true);
assert.equal(copyCloneDropRoute.interlingua.constraints.missingKinds.includes('clone-produces-owned-value'), true);

const copyCloneDropArtifacts = createUniversalConversionArtifacts(copyCloneDropPlan, { routeId: copyCloneDropRoute.id, generatedAt: 815 });
const copyCloneDropArtifact = queryUniversalConversionArtifacts(copyCloneDropArtifacts, {
  interlinguaConstraintMissingKind: 'destructor-drop-semantics'
})[0];

assert.equal(Boolean(copyCloneDropArtifact), true);
assert.equal(copyCloneDropArtifacts.index.ownershipConstraintMissingKinds.includes('copy-preserves-source'), true);

function routeProof() {
  return {
    id: 'evidence_rust_ts_transfer_route_proof',
    kind: 'conversion-replay-proof',
    status: 'passed',
    sourceLanguage: 'rust',
    target: 'typescript'
  };
}

function rustToTypescriptCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 812,
    languages: [{
      language: 'rust',
      aliases: ['rs'],
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
          target: 'typescript',
          lossClass: 'targetAdapterProjection',
          supported: true,
          readiness: 'ready',
          adapter: 'fixture-rust-typescript',
          adapterKind: 'targetProjection',
          lossKinds: [],
          reason: 'fixture target adapter'
        }]
      },
      blockers: [],
      review: []
    }],
    matrices: {
      projectionReadiness: {
        languages: [{ language: 'rust', targets: [{ target: 'typescript', readiness: 'ready' }] }]
      }
    },
    metadata: { compileTargets: ['typescript'] }
  };
}
