import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueRecordsById, uniqueStrings } from '../../native-import-utils.js';
import { exactSourceBackprojectionForMatch } from './bidirectionalExactSourceBackprojection.js';
import { createBidirectionalSourceEditProjectionArtifacts } from './bidirectionalSourceEditProjectionArtifacts.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { summarizeSemanticEditOperations } from './semanticEditScriptClassification.js';
import { projectionCoveredContainerOperationIds, spanOffsets } from './semanticEditSourceRanges.js';

export function createBidirectionalSourceEditProjection(context = {}) {
  const source = context.source;
  const targetChangeSet = context.targetChangeSet;
  const matches = portableSingleAnchorMatches(context.sourceAnchorMatches, context.targetPortability);
  if (!source || !targetChangeSet || matches.length === 0) return {};

  const scriptId = `semantic_edit_script_${idFragment(context.id)}_source_projection`;
  const sourceText = nativeImportSourceText(source);
  const initialOperations = matches.map((match, index) => sourceEditOperationForMatch(match, index, context));
  const operations = markCoveredByExactSourceRange(initialOperations, sourceText);
  const sourceMapLinks = uniqueRecordsById(matches.flatMap((match) => match.sourceMapLinks));
  const coveredOperationIds = projectionCoveredContainerOperationIds(operations, nativeImportSourceText(targetChangeSet.after));
  const exactBackprojection = operations.length > 0 && operations.every((operation) => (
    operation.metadata?.sourceBackprojection?.mode === 'same-language-exact-source-map' ||
    operation.status === 'covered' ||
    coveredOperationIds.has(operation.id) ||
    operationCoveredByExactSourceRange(operation, operations, sourceText)
  ));
  const sourceProjectionHint = sourceProjectionHintRecord({ context, matches, operations, sourceMapLinks, scriptId });
  const evidence = sourceEditProjectionEvidence({ context, operations, scriptId, sourceProjectionHint });
  const reasonCodes = sourceEditAdmissionReasonCodes(context, matches, exactBackprojection);
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
      status: exactBackprojection ? 'auto-merge-candidate' : 'needs-port',
      action: exactBackprojection ? 'apply-source-map-backprojection' : 'reanchor-or-human-port',
      reviewRequired: !exactBackprojection,
      autoApplyCandidate: exactBackprojection,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes,
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
      singleSourceAnchor: true,
      sourceBackprojectionMode: exactBackprojection ? 'same-language-exact-source-map' : 'review-only'
    }
  };
  const sourceEditScript = { ...core, hash: hashSemanticValue(core) };
  const artifacts = createBidirectionalSourceEditProjectionArtifacts(context, sourceEditScript);
  return {
    sourceEditScript,
    sourceProjectionHint,
    sourceEditProjection: artifacts.sourceEditProjection,
    sourceEditReplay: artifacts.sourceEditReplay,
    evidence: [...evidence, ...array(artifacts.evidence)]
  };
}

function sourceEditOperationForMatch(match, index, context) {
  const anchor = match.sourceAnchors[0] ?? {};
  const region = match.targetRegion ?? {};
  const sourceMapLinks = uniqueRecordsById(match.sourceMapLinks);
  const backprojection = exactSourceBackprojectionForMatch(match, context);
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
    spans: {
      base: backprojection?.sourceEditSpan ?? anchor.sourceSpan,
      worker: backprojection?.targetAfterEditSpan ?? anchor.sourceSpan,
      head: backprojection?.sourceEditSpan
    },
    hashes: {
      baseSourceHash: anchor.sourceHash,
      workerSourceHash: backprojection?.targetAfterSourceHash ?? sourceHash(context.source),
      baseTextHash: backprojection?.sourceEditTextHash,
      headTextHash: backprojection?.sourceEditTextHash,
      workerTextHash: backprojection?.targetAfterEditTextHash
    },
    status: backprojection?.alreadyApplied ? 'already-applied' : 'portable',
    readiness: backprojection ? 'ready' : 'needs-review',
    confidence: match.portability?.confidence ?? match.confidence,
    reasonCodes: uniqueStrings([
      'source-edit-script-projection-hint',
      'target-change-source-map-portable',
      'single-source-anchor-projection-hint',
      backprojection?.alreadyApplied ? 'source-edit-already-applied' : undefined,
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
      sourceMapMappingIds: uniqueStrings(sourceMapLinks.map((link) => link.sourceMapMappingId)),
      sourceBackprojection: backprojection
    }
  });
  return { ...core, operationContentHash: hashSemanticValue(core) };
}

function sourceProjectionHintRecord(input) {
  const { context, matches, operations, sourceMapLinks, scriptId } = input;
  const source = context.source;
  const targetChangeSet = context.targetChangeSet;
  const exactBackprojection = operations.length > 0 && operations.every((operation) => (
    operation.metadata?.sourceBackprojection?.mode === 'same-language-exact-source-map' || operation.status === 'covered'
  ));
  const core = {
    schema: 'frontier.lang.bidirectionalTargetChangeSourceEditProjectionHint.v1',
    version: 1,
    id: `source_projection_hint_${idFragment(context.id)}`,
    scriptId,
    status: exactBackprojection ? 'auto-merge-candidate' : 'portable',
    action: exactBackprojection ? 'apply-source-map-backprojection' : context.targetPortability?.action ?? 'port-with-source-map-review',
    readiness: exactBackprojection ? 'ready' : 'needs-review',
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
    reviewRequired: !exactBackprojection,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: sourceEditAdmissionReasonCodes(context, matches, exactBackprojection),
    sourceBackprojectionMode: exactBackprojection ? 'same-language-exact-source-map' : 'review-only'
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

function markCoveredByExactSourceRange(operations, sourceText) {
  return operations.map((operation) => {
    const coveredBy = exactSourceRangeCoveringOperation(operation, operations, sourceText);
    if (!coveredBy) return operation;
    return {
      ...operation,
      status: 'covered',
      readiness: 'ready',
      metadata: {
        ...(operation.metadata ?? {}),
        coveredByOperationIds: [coveredBy.id]
      }
    };
  });
}

function operationCoveredByExactSourceRange(operation, operations, sourceText) { return Boolean(exactSourceRangeCoveringOperation(operation, operations, sourceText)); }

function exactSourceRangeCoveringOperation(operation, operations, sourceText) {
  if (operation.metadata?.sourceBackprojection?.mode === 'same-language-exact-source-map') return undefined;
  const operationRange = spanOffsets(sourceText, operation.spans?.base ?? operation.anchor?.sourceSpan);
  if (!operationRange) return undefined;
  return operations.find((candidate) => {
    if (candidate === operation || candidate.status === 'covered') return false;
    const backprojection = candidate.metadata?.sourceBackprojection;
    const candidateRange = spanOffsets(sourceText, backprojection?.sourceEditSpan);
    return backprojection?.mode === 'same-language-exact-source-map' &&
      sameSourcePath(operation, candidate) &&
      containedRange(operationRange, candidateRange);
  });
}

function sameSourcePath(left, right) {
  const leftPath = left.anchor?.sourcePath ?? left.insertion?.sourcePath;
  const rightPath = right.anchor?.sourcePath ?? right.insertion?.sourcePath;
  return !leftPath || !rightPath || leftPath === rightPath;
}

function containedRange(inner, outer) { return Boolean(inner && outer && outer.start <= inner.start && inner.end <= outer.end); }

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

function sourceEditAdmissionReasonCodes(context, matches, exactBackprojection) {
  if (!exactBackprojection) return projectionReasonCodes(context, matches);
  return uniqueStrings([
    'source-edit-script-projection-hint',
    'target-change-source-map-portable',
    'same-language-exact-source-map-backprojection',
    ...array(context.targetPortability?.reasonCodes).filter((reason) => !reviewOnlyReason(reason)),
    ...matches.flatMap((match) => [...array(match.reasonCodes), ...array(match.portability?.reasonCodes)])
      .filter((reason) => !reviewOnlyReason(reason))
  ]);
}

function targetRegionForMatch(match, context) {
  return context.targetChangeSet.changedRegions.find((region) => region.id === match.targetRegion?.id)
    ?? match.targetRegion;
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

function reviewOnlyReason(reason) {
  return ['target-edit-requires-source-review', 'source-port-review-required', 'human-source-port-required']
    .includes(reason);
}

function array(value) {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
