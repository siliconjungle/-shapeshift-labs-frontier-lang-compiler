import { uniqueStrings } from '../../native-import-utils.js';
import { resolveSemanticLineage } from './semanticLineageResolutionRecords.js';

export const SemanticEditScriptAdmissionStatuses = Object.freeze([
  'auto-merge-candidate',
  'needs-port',
  'conflict',
  'stale',
  'blocked',
  'evidence-only'
]);

export function classifySemanticEdit(input) {
  if (!input.context.head) return editStatus('candidate', 'needs-review', 0.66, ['head-source-not-provided']);
  if (!input.anchorKey) return editStatus('blocked', 'blocked', 0, ['missing-semantic-anchor']);
  if (input.context.workerChangeSet.beforeHash &&
    input.context.headChangeSet?.afterHash === input.context.workerChangeSet.beforeHash &&
    sameSourcePath(input.context.base, input.context.head)) {
    return editStatus('portable', 'ready', 0.95, ['head-source-matches-base']);
  }
  if (input.region.changeKind === 'added') return classifyAddedRegion(input);
  if (!input.baseSymbol) return classifyMissingBaseAnchor(input);
  if (!input.headSymbol) return classifyMissingHeadAnchor(input);
  if (input.headSymbol.spanHash && input.baseSymbol.spanHash && input.headSymbol.spanHash === input.baseSymbol.spanHash) {
    return editStatus('portable', 'ready', 0.9, ['head-anchor-matches-base']);
  }
  if (input.headSymbol.spanHash && input.workerSymbol?.spanHash && input.headSymbol.spanHash === input.workerSymbol.spanHash) {
    return editStatus('already-applied', 'ready', 0.92, ['head-anchor-matches-worker']);
  }
  return editStatus('conflict', 'blocked', 0.2, ['head-anchor-changed-since-base']);
}

export function summarizeSemanticEditOperations(operations) {
  const byStatus = countBy(operations.map((operation) => operation.status));
  const byKind = countBy(operations.map((operation) => operation.kind));
  return {
    operations: operations.length,
    byStatus,
    byKind,
    portable: byStatus.portable ?? 0,
    alreadyApplied: byStatus['already-applied'] ?? 0,
    needsPort: byStatus['needs-port'] ?? 0,
    conflicts: byStatus.conflict ?? 0,
    stale: byStatus.stale ?? 0,
    blocked: byStatus.blocked ?? 0,
    covered: byStatus.covered ?? 0,
    candidates: byStatus.candidate ?? 0,
    autoMergeCandidates: (byStatus.portable ?? 0) + (byStatus['already-applied'] ?? 0),
    semanticKeys: uniqueStrings(operations.map((operation) => operation.semanticKey).filter(Boolean)),
    semanticIdentityHashes: uniqueStrings(operations.map((operation) => operation.semanticIdentityHash).filter(Boolean)),
    sourceIdentityHashes: uniqueStrings(operations.map((operation) => operation.sourceIdentityHash).filter(Boolean)),
    operationContentHashes: uniqueStrings(operations.map((operation) => operation.operationContentHash).filter(Boolean))
  };
}

export function semanticEditAdmission(input) {
  const status = admissionStatus(input.summary);
  return {
    status,
    action: admissionAction(status),
    reviewRequired: status !== 'auto-merge-candidate',
    autoApplyCandidate: status === 'auto-merge-candidate',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    reasonCodes: uniqueStrings([
      ...input.workerChangeSet.reasons,
      ...(input.headChangeSet?.reasons ?? []),
      ...input.operations.flatMap((operation) => operation.reasonCodes ?? [])
    ]),
    conflictKeys: uniqueStrings(input.operations.map((operation) => operation.anchor?.conflictKey).filter(Boolean)),
    evidenceIds: uniqueStrings(input.operations.flatMap((operation) => operation.evidenceIds ?? []))
  };
}

function classifyAddedRegion(input) {
  if (!input.headSymbol) return editStatus('portable', 'ready', 0.86, ['added-anchor-absent-from-head']);
  if (input.headSymbol.spanHash && input.workerSymbol?.spanHash && input.headSymbol.spanHash === input.workerSymbol.spanHash) {
    return editStatus('already-applied', 'ready', 0.88, ['added-anchor-already-present-in-head']);
  }
  return editStatus('conflict', 'blocked', 0.25, ['added-anchor-already-exists-in-head']);
}

function classifyMissingBaseAnchor(input) {
  const conflictKey = input.region.conflictKey ?? `region:${input.anchorKey}`;
  if (input.context.headChangedConflictKeys.has(conflictKey)) {
    return editStatus('conflict', 'blocked', 0.18, ['base-anchor-missing-and-head-changed-same-region']);
  }
  return editStatus('stale', 'needs-review', 0.25, ['base-anchor-missing']);
}

function classifyMissingHeadAnchor(input) {
  const resolved = input.context.headLineage
    ? resolveSemanticLineage(input.context.headLineage.lineageMap, { anchorKey: input.anchorKey })
    : undefined;
  if (resolved?.status === 'resolved' && resolved.currentAnchors.length === 1) {
    const target = resolved.currentAnchors[0];
    const reanchor = reanchorRecord(input.anchorKey, target, resolved);
    if (target.bodyHash && input.baseSymbol?.spanHash && target.bodyHash === input.baseSymbol.spanHash) {
      return editStatus('portable', 'ready', 0.86, ['anchor-reanchored-head-matches-base'], reanchor, resolved.evidenceIds);
    }
    if (target.bodyHash && input.workerSymbol?.spanHash && target.bodyHash === input.workerSymbol.spanHash) {
      return editStatus('already-applied', 'ready', 0.87, ['anchor-reanchored-head-matches-worker'], reanchor, resolved.evidenceIds);
    }
    return editStatus('needs-port', 'needs-review', 0.72, ['anchor-moved-or-renamed'], reanchor, resolved.evidenceIds);
  }
  if (resolved?.status === 'ambiguous') {
    return editStatus('blocked', 'blocked', 0.1, ['anchor-lineage-ambiguous'], { fromAnchorKey: input.anchorKey, lineageStatus: resolved.status }, resolved.evidenceIds);
  }
  if (resolved?.status === 'deleted') {
    return editStatus('blocked', 'blocked', 0.1, ['anchor-deleted-in-head'], { fromAnchorKey: input.anchorKey, lineageStatus: resolved.status }, resolved.evidenceIds);
  }
  return editStatus('stale', 'needs-review', 0.25, ['head-anchor-missing']);
}

function editStatus(status, readiness, confidence, reasonCodes, reanchor, evidenceIds = []) {
  return { status, readiness, confidence, reasonCodes, reanchor, evidenceIds };
}

function reanchorRecord(fromAnchorKey, target, resolved) {
  return {
    fromAnchorKey,
    toAnchorKey: target.key,
    toSourcePath: target.sourcePath,
    toSymbolName: target.symbolName,
    toSymbolKind: target.kind,
    lineageStatus: resolved.status,
    traversedEventIds: resolved.traversedEventIds
  };
}

function admissionStatus(summary) {
  if (summary.operations === 0) return 'evidence-only';
  if (summary.blocked > 0) return 'blocked';
  if (summary.conflicts > 0) return 'conflict';
  if (summary.stale > 0) return 'stale';
  if (summary.needsPort > 0 || summary.candidates > 0) return 'needs-port';
  return 'auto-merge-candidate';
}

function admissionAction(status) {
  if (status === 'auto-merge-candidate') return 'run-gates-and-apply';
  if (status === 'needs-port') return 'reanchor-or-human-port';
  if (status === 'evidence-only') return 'record-evidence';
  return 'block';
}

function countBy(values) {
  const result = {};
  for (const value of values.filter(Boolean)) result[value] = (result[value] ?? 0) + 1;
  return result;
}

function sameSourcePath(left, right) {
  return (left?.sourcePath ?? left?.nativeSource?.sourcePath) === (right?.sourcePath ?? right?.nativeSource?.sourcePath);
}
