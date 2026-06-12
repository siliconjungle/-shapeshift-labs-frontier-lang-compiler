import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueRecordsById, uniqueStrings } from '../../native-import-utils.js';
import { summarizeSemanticEditOperations } from './semanticEditScriptClassification.js';

export function createBidirectionalSourceEditProjection(context = {}) {
  const source = context.source;
  const targetChangeSet = context.targetChangeSet;
  const matches = portableSingleAnchorMatches(context.sourceAnchorMatches, context.targetPortability);
  if (!source || !targetChangeSet || matches.length === 0) return {};

  const scriptId = `semantic_edit_script_${idFragment(context.id)}_source_projection`;
  const operations = matches.map((match, index) => sourceEditOperationForMatch(match, index, context));
  const sourceMapLinks = uniqueRecordsById(matches.flatMap((match) => match.sourceMapLinks));
  const sourceProjectionHint = sourceProjectionHintRecord({ context, matches, operations, sourceMapLinks, scriptId });
  const evidence = sourceEditProjectionEvidence({ context, operations, scriptId, sourceProjectionHint });
  const core = {
    kind: 'frontier.lang.semanticEditScript',
    version: 1,
    schema: 'frontier.lang.semanticEditScript.v1',
    id: scriptId,
    stableId: `semantic_edit_script_${idFragment(hashSemanticValue([scriptId, operations]))}`,
    language: source.language,
    sourcePath: projectionSourcePath(source, matches),
    baseHash: sourceHash(source),
    workerChangeSetId: targetChangeSet.id,
    operations,
    summary: summarizeSemanticEditOperations(operations),
    admission: {
      status: 'needs-port',
      action: 'reanchor-or-human-port',
      reviewRequired: true,
      autoApplyCandidate: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: projectionReasonCodes(context, matches),
      conflictKeys: uniqueStrings(matches.flatMap((match) => match.conflictKeys)),
      evidenceIds: evidence.map((record) => record.id)
    },
    evidence,
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      sourceProjectionHint,
      bidirectionalTargetChangeId: context.id,
      targetChangeSetId: targetChangeSet.id,
      targetPatchId: targetChangeSet.patch?.id,
      targetMergeCandidateId: targetChangeSet.mergeCandidate?.id,
      targetLanguage: targetChangeSet.language,
      targetPath: targetChangeSet.sourcePath,
      targetPortabilityStatus: context.targetPortability?.status,
      targetPortabilityAction: context.targetPortability?.action,
      sourceMapBacked: true,
      singleSourceAnchor: true
    }
  };
  return { sourceEditScript: { ...core, hash: hashSemanticValue(core) }, sourceProjectionHint, evidence };
}

function sourceEditOperationForMatch(match, index, context) {
  const anchor = match.sourceAnchors[0] ?? {};
  const region = match.targetRegion ?? {};
  const sourceMapLinks = uniqueRecordsById(match.sourceMapLinks);
  const sourceIdentity = {
    sourcePath: anchor.sourcePath,
    sourceHash: anchor.sourceHash,
    anchorKey: anchor.key,
    symbolId: anchor.symbolId,
    symbolName: anchor.symbolName,
    sourceSpan: anchor.sourceSpan
  };
  const core = compactRecord({
    id: `semantic_edit_op_${idFragment([context.id, match.id, index + 1].join(':'))}`,
    kind: semanticEditKind(region),
    changeKind: region.changeKind,
    anchor: compactRecord({
      key: anchor.key,
      conflictKey: anchor.key ?? region.conflictKey,
      regionId: region.id,
      regionKind: anchor.kind ?? region.regionKind,
      granularity: 'symbol',
      language: anchor.language ?? context.source?.language,
      sourcePath: anchor.sourcePath,
      symbolId: anchor.symbolId,
      symbolName: anchor.symbolName,
      sourceSpan: anchor.sourceSpan
    }),
    semanticKey: `bidirectional-source-edit:${anchor.key ?? match.id}`,
    semanticIdentityHash: hashSemanticValue({ matchId: match.id, targetRegion: region.key, sourceIdentity }),
    sourceIdentityHash: hashSemanticValue(sourceIdentity),
    spans: { base: anchor.sourceSpan, worker: anchor.sourceSpan },
    hashes: { baseSourceHash: anchor.sourceHash, workerSourceHash: sourceHash(context.source) },
    status: 'portable',
    readiness: 'needs-review',
    confidence: match.portability?.confidence ?? match.confidence,
    reasonCodes: uniqueStrings([
      'source-edit-script-projection-hint',
      'target-change-source-map-portable',
      'single-source-anchor-projection-hint',
      ...array(match.reasonCodes),
      ...array(match.portability?.reasonCodes)
    ]),
    evidenceIds: uniqueStrings(sourceMapLinks.map((link) => link.id)),
    metadata: {
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      bidirectionalTargetChangeId: context.id,
      targetRegion: region,
      sourceMapLinkIds: sourceMapLinks.map((link) => link.id),
      sourceMapMappingIds: uniqueStrings(sourceMapLinks.map((link) => link.sourceMapMappingId))
    }
  });
  return { ...core, operationContentHash: hashSemanticValue(core) };
}

function sourceProjectionHintRecord(input) {
  const { context, matches, operations, sourceMapLinks, scriptId } = input;
  const source = context.source;
  const targetChangeSet = context.targetChangeSet;
  const core = {
    schema: 'frontier.lang.bidirectionalTargetChangeSourceEditProjectionHint.v1',
    version: 1,
    id: `source_projection_hint_${idFragment(context.id)}`,
    scriptId,
    status: 'portable',
    action: context.targetPortability?.action ?? 'port-with-source-map-review',
    readiness: 'needs-review',
    sourcePath: projectionSourcePath(source, matches),
    sourceHash: sourceHash(source),
    targetPath: targetChangeSet.sourcePath,
    targetHash: targetChangeSet.afterHash,
    targetChangeSetId: targetChangeSet.id,
    targetPatchId: targetChangeSet.patch?.id,
    targetMergeCandidateId: targetChangeSet.mergeCandidate?.id,
    sourceAnchorMatchIds: matches.map((match) => match.id),
    sourceAnchorKeys: uniqueStrings(matches.flatMap((match) => match.sourceAnchors.map((anchor) => anchor.key))),
    sourceMapLinkIds: sourceMapLinks.map((link) => link.id),
    sourceMapIds: uniqueStrings(sourceMapLinks.map((link) => link.sourceMapId)),
    sourceMapMappingIds: uniqueStrings(sourceMapLinks.map((link) => link.sourceMapMappingId)),
    operationIds: operations.map((operation) => operation.id),
    reviewRequired: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: projectionReasonCodes(context, matches)
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function sourceEditProjectionEvidence(input) {
  const { context, operations, scriptId, sourceProjectionHint } = input;
  return [{
    id: `evidence_${idFragment(scriptId)}_source_projection_hint`,
    kind: 'semantic-edit-script',
    status: 'passed',
    path: sourceProjectionHint.sourcePath,
    summary: `Created source-side projection hint for ${operations.length} source-map-backed target edit operation(s).`,
    metadata: {
      schema: 'frontier.lang.bidirectionalTargetChangeSourceEditHintEvidence.v1',
      bidirectionalTargetChangeId: context.id,
      targetChangeSetId: context.targetChangeSet.id,
      sourceProjectionHintId: sourceProjectionHint.id,
      sourceEditScriptId: scriptId,
      operationIds: sourceProjectionHint.operationIds,
      sourceMapLinkIds: sourceProjectionHint.sourceMapLinkIds,
      sourceMapMappingIds: sourceProjectionHint.sourceMapMappingIds,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  }];
}

function portableSingleAnchorMatches(matches = [], targetPortability = {}) {
  return matches.filter((match) => (
    match.status === 'matched' &&
    match.sourceAnchors.length === 1 &&
    match.sourceMapLinks.length > 0 &&
    match.portability?.status === 'portable' &&
    targetPortability.status === 'portable'
  ));
}

function projectionReasonCodes(context, matches) {
  return uniqueStrings([
    'source-edit-script-projection-hint',
    'target-change-source-map-portable',
    'target-edit-requires-source-review',
    ...array(context.reasons),
    ...array(context.targetPortability?.reasonCodes),
    ...matches.flatMap((match) => [...array(match.reasonCodes), ...array(match.portability?.reasonCodes)])
  ]);
}

function semanticEditKind(region = {}) {
  const prefix = region.changeKind === 'added' ? 'add' : region.changeKind === 'removed' ? 'remove' : 'replace';
  if (region.regionKind === 'body') return `${prefix}Body`;
  if (region.regionKind === 'import') return `${prefix}Import`;
  if (region.regionKind === 'property') return `${prefix}Property`;
  return `${prefix}Region`;
}

function projectionSourcePath(source, matches) {
  return source?.sourcePath ?? matches.find((match) => match.sourceAnchors[0]?.sourcePath)?.sourceAnchors[0]?.sourcePath;
}

function sourceHash(source) {
  return source?.nativeSource?.sourceHash ?? source?.nativeAst?.sourceHash ?? source?.sourceHash;
}

function array(value) {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
