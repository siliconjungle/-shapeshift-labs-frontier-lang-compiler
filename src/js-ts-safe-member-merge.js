import {
  applyMemberAdditions,
  canonicalizeSourceBodies,
  findContainer,
  normalizeKind,
  normalizeMemberText,
  parseMembers,
  uniqueStrings
} from './js-ts-semantic-merge-parse.js';

const NonSemanticRegionKinds = new Set(['property', 'type', 'config', 'content']);
const OrderSensitiveRegionKinds = new Set(['body', 'call', 'controlFlow', 'effect', 'import', 'mutation', 'route']);

function safeMergeJsTsMembers(input = {}) {
  return mergeJsTsSafeMemberAdditions(input);
}

function mergeJsTsSafeMemberAdditions(input = {}) {
  const baseSourceText = input.baseSourceText;
  const workerSourceText = input.workerSourceText;
  const headSourceText = input.headSourceText;
  const reasonCodes = [];
  if (typeof baseSourceText !== 'string') reasonCodes.push('missing-base-source-text');
  if (typeof workerSourceText !== 'string') reasonCodes.push('missing-worker-source-text');
  if (typeof headSourceText !== 'string') reasonCodes.push('missing-head-source-text');
  const policyRegions = normalizePolicyRegions(input.policy ?? input.mergePolicy ?? input);
  if (!policyRegions.length) reasonCodes.push('missing-unordered-region-policy');
  const preparedRegions = [];
  for (const region of policyRegions) {
    const policyReasons = validatePolicyRegion(region);
    reasonCodes.push(...policyReasons);
    if (policyReasons.length) continue;
    if (typeof baseSourceText !== 'string' || typeof workerSourceText !== 'string' || typeof headSourceText !== 'string') continue;
    const prepared = prepareRegion({ region, baseSourceText, workerSourceText, headSourceText });
    reasonCodes.push(...prepared.reasonCodes);
    if (prepared.ok) preparedRegions.push(prepared.value);
  }
  if (typeof baseSourceText === 'string' && typeof workerSourceText === 'string' && preparedRegions.length) {
    const canonicalWorker = canonicalizeSourceBodies(workerSourceText, preparedRegions, 'worker');
    if (canonicalWorker !== baseSourceText) reasonCodes.push('non-policy-source-change:worker');
  }
  if (typeof baseSourceText === 'string' && typeof headSourceText === 'string' && preparedRegions.length) {
    const canonicalHead = canonicalizeSourceBodies(headSourceText, preparedRegions, 'head');
    if (canonicalHead !== baseSourceText) reasonCodes.push('non-policy-source-change:head');
  }
  const uniqueReasons = uniqueStrings(reasonCodes);
  if (uniqueReasons.length) return mergeResult('rejected', undefined, uniqueReasons, preparedRegions, input);
  const sourceText = applyMemberAdditions(headSourceText, preparedRegions);
  return mergeResult('merged', sourceText, [], preparedRegions, input);
}

function normalizePolicyRegions(policy) {
  const direct = Array.isArray(policy) ? policy : undefined;
  const regions = direct
    ?? policy?.unorderedRegions
    ?? policy?.unorderedMemberRegions
    ?? policy?.safeList
    ?? policy?.safeMembers
    ?? [];
  return Array.isArray(regions) ? regions : [];
}

function validatePolicyRegion(region) {
  const reasonCodes = [];
  const kind = normalizeKind(region?.kind);
  if (!kind || !['interface', 'type', 'object'].includes(kind)) reasonCodes.push('unsupported-region-kind');
  if (!region?.name || typeof region.name !== 'string') reasonCodes.push('missing-region-name');
  if (!regionDeclaresNonSemanticOrder(region)) reasonCodes.push('region-not-declared-non-semantic');
  const regionKind = region?.regionKind;
  if (regionKind && OrderSensitiveRegionKinds.has(regionKind)) reasonCodes.push(`order-sensitive-region-kind:${regionKind}`);
  if (kind === 'object' && (!regionKind || !NonSemanticRegionKinds.has(regionKind))) reasonCodes.push('object-region-kind-not-safe-listed');
  return reasonCodes;
}

function regionDeclaresNonSemanticOrder(region) {
  return region?.order === 'non-semantic'
    || region?.ordering === 'non-semantic'
    || region?.nonSemanticOrder === true
    || region?.orderSensitive === false;
}

function prepareRegion(input) {
  const kind = normalizeKind(input.region.kind);
  const base = findContainer(input.baseSourceText, input.region);
  const worker = findContainer(input.workerSourceText, input.region);
  const head = findContainer(input.headSourceText, input.region);
  const reasonCodes = [];
  for (const [side, match] of [['base', base], ['worker', worker], ['head', head]]) {
    if (match.reasonCodes.length) reasonCodes.push(...match.reasonCodes.map((reason) => `${reason}:${side}:${kind}:${input.region.name}`));
  }
  if (reasonCodes.length) return { ok: false, reasonCodes };
  const baseMembers = parseMembers(base.value.body, kind);
  const workerMembers = parseMembers(worker.value.body, kind);
  const headMembers = parseMembers(head.value.body, kind);
  reasonCodes.push(...regionParseReasons(input.region, 'base', baseMembers));
  reasonCodes.push(...regionParseReasons(input.region, 'worker', workerMembers));
  reasonCodes.push(...regionParseReasons(input.region, 'head', headMembers));
  reasonCodes.push(...duplicateReasons(input.region, 'base', baseMembers.members));
  reasonCodes.push(...duplicateReasons(input.region, 'worker', workerMembers.members));
  reasonCodes.push(...duplicateReasons(input.region, 'head', headMembers.members));
  if (reasonCodes.length) return { ok: false, reasonCodes };
  const baseByKey = membersByKey(baseMembers.members);
  const workerByKey = membersByKey(workerMembers.members);
  const headByKey = membersByKey(headMembers.members);
  reasonCodes.push(...existingMemberReasons(input.region, 'worker', baseMembers.members, workerMembers.members, workerByKey));
  reasonCodes.push(...existingMemberReasons(input.region, 'head', baseMembers.members, headMembers.members, headByKey));
  const workerAddedKeys = workerMembers.members.map((member) => member.key).filter((key) => !baseByKey.has(key));
  const headAddedKeys = headMembers.members.map((member) => member.key).filter((key) => !baseByKey.has(key));
  const duplicateAddedKeys = workerAddedKeys.filter((key) => headByKey.has(key));
  for (const key of duplicateAddedKeys) reasonCodes.push(regionReason(input.region, `duplicate-added-key:${key}`));
  if (reasonCodes.length) return { ok: false, reasonCodes };
  return {
    ok: true,
    reasonCodes: [],
    value: {
      policy: input.region,
      kind,
      name: input.region.name,
      base: base.value,
      worker: worker.value,
      head: head.value,
      baseMembers: baseMembers.members,
      workerMembers: workerMembers.members,
      headMembers: headMembers.members,
      workerAddedKeys,
      headAddedKeys,
      workerAddedMembers: workerMembers.members.filter((member) => workerAddedKeys.includes(member.key))
    }
  };
}

function regionParseReasons(region, side, parsed) {
  return parsed.reasonCodes.map((reason) => regionReason(region, `${reason}:${side}`));
}

function duplicateReasons(region, side, members) {
  const seen = new Set();
  const duplicates = new Set();
  for (const member of members) {
    if (seen.has(member.key)) duplicates.add(member.key);
    seen.add(member.key);
  }
  return [...duplicates].map((key) => regionReason(region, `duplicate-key:${side}:${key}`));
}

function existingMemberReasons(region, side, baseMembers, sideMembers, sideByKey) {
  const reasonCodes = [];
  const sideBaseOrder = sideMembers.map((member) => member.key).filter((key) => baseMembers.some((baseMember) => baseMember.key === key));
  const baseOrder = baseMembers.map((member) => member.key);
  if (sideBaseOrder.join('\u0000') !== baseOrder.join('\u0000')) {
    reasonCodes.push(regionReason(region, `existing-member-order-changed:${side}`));
  }
  for (const baseMember of baseMembers) {
    const sideMember = sideByKey.get(baseMember.key);
    if (!sideMember) {
      reasonCodes.push(regionReason(region, `existing-member-removed:${side}:${baseMember.key}`));
      continue;
    }
    if (normalizeMemberText(sideMember.text) !== normalizeMemberText(baseMember.text)) {
      reasonCodes.push(regionReason(region, `existing-member-changed:${side}:${baseMember.key}`));
    }
  }
  return reasonCodes;
}

function membersByKey(members) {
  return new Map(members.map((member) => [member.key, member]));
}

function regionReason(region, reason) {
  return `${reason}:${normalizeKind(region.kind)}:${region.name}`;
}

function mergeResult(status, sourceText, reasonCodes, regions, input) {
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
    mergedRegions,
    summary: {
      regions: mergedRegions.length,
      workerAdditions: mergedRegions.reduce((total, region) => total + region.workerAddedKeys.length, 0),
      headAdditions: mergedRegions.reduce((total, region) => total + region.headAddedKeys.length, 0),
      appliedAdditions: status === 'merged' ? mergedRegions.reduce((total, region) => total + region.workerAddedKeys.length, 0) : 0
    },
    metadata: {
      explicitPolicy: normalizePolicyRegions(input.policy ?? input.mergePolicy ?? input).length > 0
    }
  };
}

export {
  mergeJsTsSafeMemberAdditions,
  safeMergeJsTsMembers
};
