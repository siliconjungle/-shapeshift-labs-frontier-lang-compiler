import { assert } from './helpers.mjs';
import {
  diffNativeSources,
  inferSemanticLineageEvents,
  importNativeSource,
  resolveSemanticLineage
} from './compiler-api.mjs';
import { matchLineageCandidates } from '../../src/internal/index-impl/semanticLineageInferenceMatching.js';
import { parserImportFixture, parserImportMultiFixture } from './semantic-lineage-fixtures.mjs';
const movedBefore = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  sourceText: 'export function step(value: number) { return value + 1; }\n'
});
const movedAfter = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-core.ts',
  sourceText: 'export function step(value: number) { return value + 1; }\n'
});
const movedInference = inferSemanticLineageEvents({
  id: 'lineage_inference_move_smoke',
  before: movedBefore,
  after: movedAfter,
  generatedAt: 10
});
assert.equal(movedInference.kind, 'frontier.lang.semanticLineageInference');
assert.equal(movedInference.summary.moved, 1);
assert.equal(movedInference.summary.renamed, 0);
assert.equal(movedInference.metadata.autoMergeClaim, false);
assert.equal(movedInference.metadata.semanticEquivalenceClaim, false);
assert.equal(movedInference.readiness, 'needs-review');
const movedEvent = movedInference.events.find((event) => event.eventKind === 'moved');
assert.ok(movedEvent);
assert.equal(movedEvent.evidence.bodyHashMatch, true);
assert.equal(movedEvent.metadata.reasonCodes.includes('source-hash-match'), true);
assert.equal(movedEvent.metadata.hashEvidence.sourceHashMatch, true);
assert.equal(movedEvent.metadata.autoMergeClaim, false);
assert.equal(movedEvent.metadata.semanticEquivalenceClaim, false);
const movedResolution = resolveSemanticLineage(movedInference.lineageMap, {
  anchorKey: movedEvent.from.key,
  generatedAt: 11
});
assert.equal(movedResolution.status, 'resolved');
assert.equal(movedResolution.currentAnchors[0].sourcePath, 'src/runtime-core.ts');
assert.equal(movedResolution.reasonCodes.includes('source-hash-match'), true);
assert.equal(movedResolution.currentAnchors[0].lineageReasonCodes.includes('source-hash-match'), true);
const renamedInference = inferSemanticLineageEvents({
  id: 'lineage_inference_rename_smoke',
  before: parserImportFixture({
    id: 'parser_before_step',
    symbolName: 'step',
    sourceText: 'export function step(value: number) { return value + 1; }\n'
  }),
  after: parserImportFixture({
    id: 'parser_after_advance',
    symbolName: 'advance',
    sourceText: 'export function advance(value: number) { return value + 1; }\n'
  }),
  generatedAt: 20
});
assert.equal(renamedInference.summary.renamed, 1);
const renamedEvent = renamedInference.events.find((event) => event.eventKind === 'renamed');
assert.ok(renamedEvent);
assert.equal(renamedEvent.evidence.signatureHashMatch, true);
assert.equal(renamedEvent.metadata.renamed, true);
const renamedResolution = resolveSemanticLineage(renamedInference.lineageMap, {
  anchorKey: renamedEvent.from.key,
  generatedAt: 21
});
assert.equal(renamedResolution.status, 'resolved');
assert.equal(renamedResolution.reasonCodes.includes('signature-hash-match'), true);
const identityMovedRenamed = matchLineageCandidates([
  lineageCandidateSymbol({
    key: 'source#src/runtime.ts#function#step',
    name: 'step',
    sourcePath: 'src/runtime.ts',
    sourceHash: 'source_hash_before_identity_move',
    sourceIdentityHash: 'source_identity_step_stable'
  })
], [
  lineageCandidateSymbol({
    key: 'source#src/runtime-core.ts#function#advance',
    name: 'advance',
    sourcePath: 'src/runtime-core.ts',
    sourceHash: 'source_hash_after_identity_move',
    sourceIdentityHash: 'source_identity_step_stable'
  })
], {
  id: 'lineage_identity_hash_move_rename_smoke',
  generatedAt: 22
}, {
  minConfidence: 0.74,
  ambiguityMargin: 0.08
});
assert.equal(identityMovedRenamed.events.length, 1);
assert.equal(identityMovedRenamed.ambiguous.length, 0);
const identityMovedRenamedEvent = identityMovedRenamed.events[0];
assert.equal(identityMovedRenamedEvent.eventKind, 'renamed');
assert.equal(identityMovedRenamedEvent.metadata.moved, true);
assert.equal(identityMovedRenamedEvent.metadata.reasonCodes.includes('source-identity-hash-match'), true);
assert.equal(identityMovedRenamedEvent.metadata.reasonCodes.includes('source-hash-changed'), true);
assert.equal(identityMovedRenamedEvent.metadata.hashEvidence.sourceIdentityHashMatch, true);
const identityMovedRenamedResolution = resolveSemanticLineage(identityMovedRenamed.events, {
  anchorKey: identityMovedRenamedEvent.from.key,
  generatedAt: 23
});
assert.equal(identityMovedRenamedResolution.status, 'resolved');
assert.equal(identityMovedRenamedResolution.reasonCodes.includes('source-identity-hash-match'), true);
assert.equal(identityMovedRenamedResolution.currentAnchors[0].sourcePath, 'src/runtime-core.ts');
const ambiguousIdentity = matchLineageCandidates([
  lineageCandidateSymbol({
    key: 'source#src/runtime.ts#function#load',
    name: 'load',
    sourcePath: 'src/runtime.ts',
    sourceHash: 'source_hash_before_load',
    sourceIdentityHash: 'source_identity_load_shared'
  })
], [
  lineageCandidateSymbol({
    key: 'source#src/runtime-core.ts#function#fetch',
    name: 'fetch',
    sourcePath: 'src/runtime-core.ts',
    sourceHash: 'source_hash_after_fetch',
    sourceIdentityHash: 'source_identity_load_shared'
  }),
  lineageCandidateSymbol({
    key: 'source#src/runtime-extra.ts#function#read',
    name: 'read',
    sourcePath: 'src/runtime-extra.ts',
    sourceHash: 'source_hash_after_read',
    sourceIdentityHash: 'source_identity_load_shared'
  })
], {
  id: 'lineage_identity_hash_ambiguous_smoke',
  generatedAt: 24
}, {
  minConfidence: 0.74,
  ambiguityMargin: 0.08
});
assert.equal(ambiguousIdentity.events.length, 0);
assert.equal(ambiguousIdentity.ambiguous.length, 1);
assert.equal(ambiguousIdentity.unmatchedBefore.length, 0);
assert.equal(ambiguousIdentity.ambiguous[0].reasonCodes.includes('ambiguous-lineage-candidates'), true);
assert.equal(ambiguousIdentity.ambiguous[0].candidates.length, 2);
assert.equal(ambiguousIdentity.ambiguous[0].candidates.every((candidate) => candidate.reasons.includes('source-identity-hash-match')), true);
const recreatedInference = inferSemanticLineageEvents({
  id: 'lineage_inference_recreate_smoke',
  before: parserImportFixture({
    id: 'parser_before_boot_legacy',
    symbolName: 'boot',
    sourceText: 'export function boot() { return "ready"; }\n',
    signatureHash: 'fixture_signature_boot',
    ownershipRegionKind: 'legacyBody'
  }),
  after: parserImportFixture({
    id: 'parser_after_boot_recreated',
    symbolName: 'boot',
    sourceText: 'export function boot() { return "ready"; }\n',
    signatureHash: 'fixture_signature_boot',
    ownershipRegionKind: 'body'
  }),
  generatedAt: 25
});
assert.equal(recreatedInference.summary.recreated, 1);
assert.equal(recreatedInference.summary.deleted, 0);
assert.equal(recreatedInference.readiness, 'needs-review');
assert.equal(recreatedInference.reasons.includes('recreated-anchor-lineage-inferred'), true);
const recreatedEvent = recreatedInference.events.find((event) => event.eventKind === 'recreated');
assert.ok(recreatedEvent);
assert.equal(recreatedEvent.metadata.reasonCodes.includes('delete-recreate-candidate'), true);
const recreatedResolution = resolveSemanticLineage(recreatedInference.lineageMap, {
  anchorKey: recreatedEvent.from.key,
  generatedAt: 26
});
assert.equal(recreatedResolution.status, 'recreated');
assert.equal(recreatedResolution.currentAnchors[0].key, recreatedEvent.to[0].key);
const splitInference = inferSemanticLineageEvents({
  id: 'lineage_inference_split_smoke',
  before: parserImportFixture({
    id: 'parser_before_render',
    symbolName: 'render',
    sourceText: 'export function render() { return "view"; }\n',
    signatureHash: 'fixture_signature_render'
  }),
  after: parserImportMultiFixture({
    id: 'parser_after_render_split',
    sourceText: [
      'export function renderCanvas() { return "view"; }',
      'export function renderDebug() { return "view"; }',
      ''
    ].join('\n'),
    symbols: [
      { symbolName: 'renderCanvas', signatureHash: 'fixture_signature_render', line: 1 },
      { symbolName: 'renderDebug', signatureHash: 'fixture_signature_render', line: 2 }
    ]
  }),
  generatedAt: 27
});
assert.equal(splitInference.summary.split, 1);
assert.equal(splitInference.summary.deleted, 0);
assert.equal(splitInference.summary.ambiguous, 0);
assert.equal(splitInference.readiness, 'needs-review');
assert.equal(splitInference.reasons.includes('split-anchor-lineage-inferred'), true);
const splitEvent = splitInference.events.find((event) => event.eventKind === 'split');
assert.ok(splitEvent);
assert.equal(splitEvent.to.length, 2);
assert.equal(splitEvent.metadata.reasonCodes.includes('split-lineage-candidate'), true);
const splitResolution = resolveSemanticLineage(splitInference.lineageMap, {
  anchorKey: splitEvent.from.key,
  generatedAt: 28
});
assert.equal(splitResolution.status, 'ambiguous');
assert.equal(splitResolution.reasonCodes.includes('anchor-split'), true);
assert.equal(splitResolution.currentAnchors.length, 2);
const ambiguousInference = inferSemanticLineageEvents({
  id: 'lineage_inference_ambiguous_move_smoke',
  before: parserImportFixture({
    id: 'parser_before_load',
    symbolName: 'load',
    sourceText: '\n\nexport function load() { return "data"; }\n',
    signatureHash: 'fixture_signature_load',
    line: 3
  }),
  after: parserImportMultiFixture({
    id: 'parser_after_load_ambiguous',
    sourceText: [
      'export function fetch() { return "data"; }',
      'export function read() { return "data"; }',
      ''
    ].join('\n'),
    symbols: [
      { symbolName: 'fetch', signatureHash: 'fixture_signature_load', line: 1 },
      { symbolName: 'read', signatureHash: 'fixture_signature_load', line: 2 }
    ]
  }),
  generatedAt: 29
});
assert.equal(ambiguousInference.summary.ambiguous, 1);
assert.equal(ambiguousInference.summary.deleted, 0);
assert.equal(ambiguousInference.events.some((event) => event.eventKind === 'deleted'), false);
assert.equal(ambiguousInference.readiness, 'blocked');
assert.equal(ambiguousInference.reasons.includes('lineage-inference-blocked'), true);
assert.equal(ambiguousInference.unmatched.ambiguous[0].reasonCodes.includes('ambiguous-lineage-candidates'), true);
const deletedInference = inferSemanticLineageEvents({
  id: 'lineage_inference_delete_smoke',
  before: importNativeSource({
    language: 'typescript',
    sourcePath: 'src/runtime.ts',
    sourceText: 'export function obsolete() { return false; }\n'
  }),
  after: importNativeSource({
    language: 'typescript',
    sourcePath: 'src/runtime.ts',
    sourceText: 'export const runtimeReady = true;\n'
  }),
  generatedAt: 30
});
assert.equal(deletedInference.summary.deleted, 1);
assert.equal(deletedInference.events.some((event) => event.eventKind === 'deleted'), true);
assert.equal(deletedInference.reasons.includes('deleted-anchor-lineage-inferred'), true);
const deletedEvent = deletedInference.events.find((event) => event.eventKind === 'deleted');
assert.equal(deletedEvent.confidence <= 0.8, true);
assert.equal(deletedEvent.metadata.deletionEvidenceScope, 'same-source-file');
const diffResult = diffNativeSources({
  id: 'lineage_inference_native_diff_smoke',
  language: 'typescript',
  beforeSourceText: 'export function load() { return "before"; }\n',
  afterSourceText: 'export function load() { return "after"; }\n',
  sourcePath: 'src/load.ts',
  generatedAt: 40
});
assert.equal(diffResult.lineageInference.kind, 'frontier.lang.semanticLineageInference');
assert.equal(diffResult.metadata.semanticLineageInferenceSummary.beforeSymbols >= 1, true);
assert.equal(diffResult.evidence.some((record) => record.metadata?.semanticLineageInferenceSummary), true);
function lineageCandidateSymbol({
  key,
  name,
  sourcePath,
  sourceHash,
  sourceIdentityHash,
  semanticIdentityHash = undefined,
  identityHash = undefined
}) {
  const sourceSpan = {
    path: sourcePath,
    startLine: 1,
    startColumn: 1,
    endLine: 1,
    endColumn: 40
  };
  return {
    id: `symbol:${sourceIdentityHash}:${name}`,
    name,
    kind: 'function',
    language: 'typescript',
    ownershipRegionKind: 'function',
    sourceHash,
    sourceIdentityHash,
    semanticIdentityHash,
    identityHash,
    anchor: {
      key,
      id: `anchor:${key}`,
      kind: 'function',
      language: 'typescript',
      sourcePath,
      sourceHash,
      symbolName: name,
      sourceSpan,
      metadata: {
        sourceIdentityHash,
        semanticIdentityHash,
        identityHash
      }
    }
  };
}
