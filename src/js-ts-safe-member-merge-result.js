import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds,
  jsTsSafeMergeGateOrder
} from './js-ts-safe-merge-constants.js';
import { uniqueStrings } from './js-ts-semantic-merge-parse.js';

function mergeResult(status, sourceText, reasonCodes, regions, input, explicitPolicy) {
  const conflicts = status === 'merged'
    ? []
    : reasonCodes.map((reason, index) => memberConflictForReason(reason, input, index));
  const mergedRegions = regions.map((region) => ({
    kind: region.kind,
    name: region.name,
    regionKind: region.policy.regionKind,
    workerAddedKeys: region.workerAddedKeys,
    headAddedKeys: region.headAddedKeys
  }));
  return {
    kind: 'frontier.lang.jsTsSafeMemberMerge',
    version: 1,
    status,
    sourceText,
    reasonCodes,
    conflicts,
    gates: memberGates(conflicts),
    admission: memberAdmission(status, conflicts),
    mergedRegions,
    summary: {
      regions: mergedRegions.length,
      workerAdditions: mergedRegions.reduce((total, region) => total + region.workerAddedKeys.length, 0),
      headAdditions: mergedRegions.reduce((total, region) => total + region.headAddedKeys.length, 0),
      appliedAdditions: status === 'merged' ? mergedRegions.reduce((total, region) => total + region.workerAddedKeys.length, 0) : 0,
      conflicts: conflicts.length
    },
    metadata: { explicitPolicy }
  };
}

function memberAdmission(status, conflicts) {
  const reasonCodes = uniqueStrings(conflicts.map((conflict) => conflict.details.reasonCode ?? conflict.code));
  if (status === 'merged') {
    return {
      status: 'auto-merge-candidate',
      action: 'apply',
      reviewRequired: false,
      autoApplyCandidate: true,
      reasonCodes: []
    };
  }
  return {
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    reasonCodes
  };
}

function memberGates(conflicts) {
  const blockedGateIds = new Set(conflicts.map((conflict) => conflict.gateId));
  const reasonCodesByGate = new Map();
  for (const conflict of conflicts) {
    const gateReasonCodes = reasonCodesByGate.get(conflict.gateId) ?? [];
    gateReasonCodes.push(conflict.details.reasonCode ?? conflict.code);
    reasonCodesByGate.set(conflict.gateId, uniqueStrings(gateReasonCodes));
  }
  let blockedSeen = false;
  return jsTsSafeMergeGateOrder.map((id) => {
    const blocked = blockedGateIds.has(id);
    const status = blocked ? 'blocked' : blockedSeen ? 'skipped' : 'passed';
    if (blocked) blockedSeen = true;
    return { id, status, reasonCodes: reasonCodesByGate.get(id) ?? [] };
  });
}

function memberConflictForReason(reason, input, index) {
  const reasonCode = blockedReasonCode(reason);
  const code = conflictCodeForReason(reasonCode);
  const gateId = gateIdForReason(reasonCode);
  const details = reasonDetails(reason, reasonCode);
  return {
    code,
    gateId,
    message: memberConflictMessage(reasonCode, details),
    side: details.side,
    sourcePath: input.sourcePath,
    details: { ...details, index }
  };
}

function blockedReasonCode(reason) {
  if (reason.includes('computed-key')) return 'computed-key';
  if (reason.includes('decorator-member')) return 'decorator-member';
  if (reason.includes('static-block-ordering')) return 'static-block-ordering';
  if (reason.includes('accessor-pairing')) return 'accessor-pairing';
  if (reason.includes('private-name-scope')) return 'private-name-scope';
  if (reason.includes('spread-like-member') || reason.includes('spread-member')) return 'spread-like-member';
  if (reason.includes('overload-collision')) return 'overload-collision';
  if (reason.includes('type-alias-conflict')) return 'type-alias-conflict';
  if (reason.includes('duplicate-added-key') || reason.includes('duplicate-key')) return 'duplicate-member-name';
  if (reason.includes('existing-member-changed')) return 'changed-existing-member';
  if (reason.includes('existing-member-removed')) return 'removed-existing-member';
  if (reason.includes('existing-member-order-changed')) return 'existing-member-order-changed';
  if (reason.includes('order-sensitive-region-kind')) return 'order-sensitive-region-kind';
  if (reason.includes('non-policy-source-change')) return 'non-policy-source-change';
  if (reason.includes('unterminated-container')) return 'malformed-syntax';
  if (reason.includes('unsupported-')) return 'unsupported-js-ts-syntax';
  if (reason.includes('missing-') || reason.includes('not-safe-listed') || reason.includes('not-declared')) return 'invalid-input';
  if (reason.includes('ambiguous-container') || reason.includes('container-not-found')) return 'parser-or-ledger-loss';
  return reason.split(':')[0] || 'member-merge-blocked';
}

function conflictCodeForReason(reasonCode) {
  if (reasonCode === 'computed-key') return JsTsSafeMergeConflictCodes.computedKey;
  if (reasonCode === 'decorator-member') return JsTsSafeMergeConflictCodes.unsupportedDecorator;
  if (reasonCode === 'static-block-ordering') return JsTsSafeMergeConflictCodes.topLevelOrderChanged;
  if (reasonCode === 'accessor-pairing' || reasonCode === 'private-name-scope') return JsTsSafeMergeConflictCodes.duplicateName;
  if (reasonCode === 'overload-collision') return JsTsSafeMergeConflictCodes.unsupportedOverload;
  if (reasonCode === 'type-alias-conflict') return JsTsSafeMergeConflictCodes.typeAliasConflict;
  if (reasonCode === 'duplicate-member-name') return JsTsSafeMergeConflictCodes.duplicateName;
  if (reasonCode === 'changed-existing-member' || reasonCode === 'removed-existing-member' || reasonCode === 'non-policy-source-change') {
    return JsTsSafeMergeConflictCodes.changedExistingDeclaration;
  }
  if (reasonCode === 'existing-member-order-changed' || reasonCode === 'order-sensitive-region-kind') return JsTsSafeMergeConflictCodes.topLevelOrderChanged;
  if (reasonCode === 'malformed-syntax') return JsTsSafeMergeConflictCodes.malformedSyntax;
  if (reasonCode === 'invalid-input') return JsTsSafeMergeConflictCodes.invalidInput;
  return JsTsSafeMergeConflictCodes.parserLedgerLoss;
}

function gateIdForReason(reasonCode) {
  if (reasonCode === 'duplicate-member-name' || reasonCode === 'overload-collision' || reasonCode === 'accessor-pairing' || reasonCode === 'private-name-scope') {
    return JsTsSafeMergeGateIds.uniqueNames;
  }
  if (reasonCode === 'changed-existing-member' || reasonCode === 'removed-existing-member' || reasonCode === 'non-policy-source-change') {
    return JsTsSafeMergeGateIds.stableExistingDeclarations;
  }
  if (reasonCode === 'existing-member-order-changed' || reasonCode === 'order-sensitive-region-kind' || reasonCode === 'static-block-ordering') {
    return JsTsSafeMergeGateIds.preserveBaseOrder;
  }
  return JsTsSafeMergeGateIds.parseLedger;
}

function reasonDetails(reason, reasonCode) {
  const parts = String(reason).split(':');
  const details = { reason, reasonCode };
  if (['base', 'worker', 'head'].includes(parts[1])) details.side = parts[1];
  if (['base', 'worker', 'head'].includes(parts[2])) details.side = parts[2];
  const kind = parts.find((part) => ['interface', 'type', 'class', 'object'].includes(part));
  if (kind) details.regionKind = kind;
  if (reasonCode === 'duplicate-member-name'
    || reasonCode === 'overload-collision'
    || reasonCode === 'accessor-pairing'
    || reasonCode === 'private-name-scope') {
    details.memberName = parts.at(-3) ?? parts.at(-1);
  }
  if (reasonCode === 'changed-existing-member' || reasonCode === 'removed-existing-member') details.memberName = parts.at(-3);
  return details;
}

function memberConflictMessage(reasonCode, details) {
  if (reasonCode === 'computed-key') return 'Computed member keys are not safe for automatic member merge.';
  if (reasonCode === 'decorator-member') return 'Decorated class members are not safe for automatic unordered member merge.';
  if (reasonCode === 'static-block-ordering') return 'Class static blocks make member order observable and block unordered member merge.';
  if (reasonCode === 'accessor-pairing') return 'Getter/setter member pairs are not safe for automatic unordered member merge.';
  if (reasonCode === 'private-name-scope') return 'Private class names must remain scoped to one class element declaration set.';
  if (reasonCode === 'spread-like-member') return 'Spread-like member syntax makes object member merge ambiguous.';
  if (reasonCode === 'overload-collision') return 'Member overloads or duplicate method signatures collide in an unordered member region.';
  if (reasonCode === 'changed-existing-member') return 'An existing member changed inside a safe member-addition region.';
  if (reasonCode === 'removed-existing-member') return 'An existing member was removed inside a safe member-addition region.';
  if (reasonCode === 'duplicate-member-name') return 'Worker and head member additions contain the same member key.';
  if (reasonCode === 'existing-member-order-changed') return 'A side changed the order of existing members in a non-semantic member region.';
  return `JS/TS member merge blocked: ${details.reason}`;
}

export {
  mergeResult
};
