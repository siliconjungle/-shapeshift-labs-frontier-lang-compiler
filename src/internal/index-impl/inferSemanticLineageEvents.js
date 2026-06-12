import { idFragment, maxSemanticMergeReadiness, uniqueStrings } from '../../native-import-utils.js';
import { createSemanticImportSidecar } from './createSemanticImportSidecar.js';
import { createSemanticAnchor, createSemanticLineageEvent, createSemanticLineageMap } from './semanticLineageRecords.js';
import { matchExactAnchors, matchLineageCandidates, symbolSummary } from './semanticLineageInferenceMatching.js';
import { mapDiffSymbols } from './mapDiffSymbols.js';
import { normalizeNativeDiffImport } from './normalizeNativeDiffImport.js';

const DEFAULT_MIN_CONFIDENCE = 0.74;
const DEFAULT_AMBIGUITY_MARGIN = 0.08;

export function inferSemanticLineageEvents(input = {}, options = {}) {
  const before = normalizeNativeDiffImport(input.before, input, 'before');
  const after = normalizeNativeDiffImport(input.after, input, 'after');
  if (!before && !after) throw new Error('inferSemanticLineageEvents requires before or after native source input');
  const language = input.language ?? after?.language ?? before?.language;
  const sourcePath = input.sourcePath ?? after?.sourcePath ?? before?.sourcePath;
  const beforeHash = before?.nativeSource?.sourceHash ?? before?.nativeAst?.sourceHash ?? before?.sourceHash;
  const afterHash = after?.nativeSource?.sourceHash ?? after?.nativeAst?.sourceHash ?? after?.sourceHash;
  const idPart = idFragment(input.id ?? sourcePath ?? language ?? 'semantic_lineage_inference');
  const beforeSidecar = before ? createSemanticImportSidecar(before, { id: `lineage_sidecar_before_${idPart}`, generatedAt: input.generatedAt, regionPrefix: input.regionPrefix }) : undefined;
  const afterSidecar = after ? createSemanticImportSidecar(after, { id: `lineage_sidecar_after_${idPart}`, generatedAt: input.generatedAt, regionPrefix: input.regionPrefix }) : undefined;
  const beforeSymbols = [...mapDiffSymbols(before, beforeSidecar).values()].map((symbol) => lineageSymbol(symbol, before)).filter((symbol) => symbol.anchor?.key);
  const afterSymbols = [...mapDiffSymbols(after, afterSidecar).values()].map((symbol) => lineageSymbol(symbol, after)).filter((symbol) => symbol.anchor?.key);
  const exact = matchExactAnchors(beforeSymbols, afterSymbols);
  const candidates = matchLineageCandidates(exact.unmatchedBefore, exact.unmatchedAfter, input, {
    minConfidence: minConfidence(input),
    ambiguityMargin: ambiguityMargin(input)
  });
  const deleted = input.includeDeleted === false
    ? []
    : candidates.unmatchedBefore.map((symbol) => deletedEvent(symbol, input, options, { before, after }));
  const events = [...candidates.events, ...deleted].filter(Boolean);
  const evidence = [lineageInferenceEvidence({
    input,
    idPart,
    sourcePath,
    language,
    before,
    after,
    beforeHash,
    afterHash,
    exact,
    candidates,
    deleted,
    events
  })];
  const lineageMap = createSemanticLineageMap(events, {
    id: input.lineageMapId ?? `semantic_lineage_map_${idPart}`,
    generatedAt: input.generatedAt
  });
  const readiness = inferenceReadiness({ events, deleted, ambiguous: candidates.ambiguous, added: candidates.unmatchedAfter }, input);
  return {
    kind: 'frontier.lang.semanticLineageInference',
    version: 1,
    id: input.id ?? `semantic_lineage_inference_${idPart}`,
    language,
    sourcePath,
    beforeImportId: before?.id,
    afterImportId: after?.id,
    beforeHash,
    afterHash,
    events,
    lineageMap,
    evidence,
    unmatched: {
      removed: candidates.unmatchedBefore.map(symbolSummary),
      added: candidates.unmatchedAfter.map(symbolSummary),
      ambiguous: candidates.ambiguous
    },
    summary: {
      beforeSymbols: beforeSymbols.length,
      afterSymbols: afterSymbols.length,
      unchangedAnchors: exact.matched.length,
      inferredEvents: events.length,
      moved: events.filter((event) => event.eventKind === 'moved').length,
      renamed: events.filter((event) => event.eventKind === 'renamed').length,
      split: events.filter((event) => event.eventKind === 'split').length,
      recreated: events.filter((event) => event.eventKind === 'recreated').length,
      deleted: deleted.length,
      ambiguous: candidates.ambiguous.length,
      unmatchedAdded: candidates.unmatchedAfter.length,
      minConfidence: minConfidence(input),
      ambiguityMargin: ambiguityMargin(input)
    },
    readiness,
    reasons: inferenceReasons({ events, deleted, ambiguous: candidates.ambiguous, added: candidates.unmatchedAfter, readiness }),
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reviewRequired: true,
      beforeSidecarId: beforeSidecar?.id,
      afterSidecarId: afterSidecar?.id,
      note: 'Inferred lineage is refactoring-aware merge evidence, not proof of semantic equivalence.',
      ...input.metadata,
      ...options.metadata
    }
  };
}

function deletedEvent(symbol, input, options, context) {
  return createSemanticLineageEvent({
    id: `lineage_deleted_${idFragment(firstString(input.id, symbol.anchor.key))}`,
    createdAt: input.generatedAt,
    eventKind: 'deleted',
    from: symbol.anchor,
    confidence: deletedConfidence(input, options, context),
    actor: input.actor,
    actorId: input.actorId,
    actorRole: input.actorRole ?? 'semantic-lineage-inference',
    evidenceIds: [input.evidenceId ?? `evidence_${idFragment(input.id ?? symbol.anchor.key)}_lineage_inference`],
    conflictKeys: [symbol.anchor.key],
    metadata: {
      inferred: true,
      algorithm: 'frontier.semantic-lineage-inference.v1',
      reasonCodes: ['anchor-removed-from-after-import'],
      deletionEvidenceScope: deletionEvidenceScope(context),
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  });
}

function deletedConfidence(input, options, context) {
  if (options.deletedConfidence !== undefined) return options.deletedConfidence;
  if (input.deletedConfidence !== undefined) return input.deletedConfidence;
  return deletionEvidenceScope(context) === 'same-source-file' ? 0.8 : 0.55;
}

function deletionEvidenceScope(context) {
  const beforePath = context.before?.sourcePath ?? context.before?.nativeSource?.sourcePath;
  const afterPath = context.after?.sourcePath ?? context.after?.nativeSource?.sourcePath;
  return beforePath && afterPath && beforePath === afterPath ? 'same-source-file' : 'partial-or-moved-scope';
}

function lineageSymbol(symbol, imported) {
  const anchor = createSemanticAnchor({
    key: symbol.ownershipKey ?? symbol.key ?? symbol.id,
    kind: symbol.ownershipRegionKind ?? symbol.kind,
    language: symbol.language ?? imported?.language,
    sourcePath: symbol.sourcePath ?? imported?.sourcePath,
    sourceHash: symbol.sourceHash ?? imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash,
    symbolId: symbol.id,
    symbolName: symbol.name,
    signatureHash: symbol.signatureHash,
    bodyHash: symbol.spanHash,
    sourceSpan: symbol.sourceSpan,
    metadata: {
      nativeAstNodeId: symbol.nativeAstNodeId,
      semanticOccurrenceId: symbol.semanticOccurrenceId,
      sourceMapMappingId: symbol.sourceMapMappingId,
      ownershipRegionId: symbol.ownershipRegionId,
      ownershipRegionKind: symbol.ownershipRegionKind
    }
  }, { language: imported?.language, sourcePath: imported?.sourcePath });
  return { ...symbol, anchor };
}

function lineageInferenceEvidence(input) {
  return {
    id: input.input.evidenceId ?? `evidence_${input.idPart}_lineage_inference`,
    kind: 'import',
    status: 'passed',
    path: input.sourcePath,
    summary: `Inferred ${input.events.length} semantic lineage event(s) from ${input.before?.id ?? 'before'} to ${input.after?.id ?? 'after'}.`,
    metadata: {
      algorithm: 'frontier.semantic-lineage-inference.v1',
      beforeImportId: input.before?.id,
      afterImportId: input.after?.id,
      beforeHash: input.beforeHash,
      afterHash: input.afterHash,
      language: input.language,
      unchangedAnchors: input.exact.matched.length,
      inferredEvents: input.events.length,
      moved: input.events.filter((event) => event.eventKind === 'moved').length,
      renamed: input.events.filter((event) => event.eventKind === 'renamed').length,
      split: input.events.filter((event) => event.eventKind === 'split').length,
      recreated: input.events.filter((event) => event.eventKind === 'recreated').length,
      deleted: input.deleted.length,
      ambiguous: input.candidates.ambiguous.length,
      unmatchedAdded: input.candidates.unmatchedAfter.length,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  };
}

function inferenceReadiness(input, options) {
  if (input.ambiguous.length) return 'blocked';
  let readiness = 'ready';
  if (input.events.length || input.added.length) readiness = maxSemanticMergeReadiness(readiness, 'needs-review');
  return maxSemanticMergeReadiness(readiness, options.readiness ?? 'ready');
}

function inferenceReasons(input) {
  return uniqueStrings([
    input.events.length ? 'semantic-lineage-inferred' : undefined,
    input.events.some((event) => event.eventKind === 'split') ? 'split-anchor-lineage-inferred' : undefined,
    input.events.some((event) => event.eventKind === 'recreated') ? 'recreated-anchor-lineage-inferred' : undefined,
    input.deleted.length ? 'deleted-anchor-lineage-inferred' : undefined,
    input.added.length ? 'unmatched-added-anchor-review' : undefined,
    input.ambiguous.length ? 'ambiguous-lineage-candidates' : undefined,
    input.readiness === 'blocked' ? 'lineage-inference-blocked' : undefined,
    'no-auto-merge-claim'
  ].filter(Boolean));
}

function minConfidence(input) {
  return numeric(input.minConfidence, DEFAULT_MIN_CONFIDENCE);
}

function ambiguityMargin(input) {
  return numeric(input.ambiguityMargin, DEFAULT_AMBIGUITY_MARGIN);
}

function numeric(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}
