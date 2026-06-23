import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { findContainer, normalizeKind, normalizeMemberText, parseMembers } from './js-ts-semantic-merge-parse.js';
import { idFragment } from './native-import-utils.js';

function augmentProjectSymbolGraphPublicContracts(projectSymbolGraph, files, input, stageName) {
  const existingRegions = Array.isArray(projectSymbolGraph?.publicContractRegions) ? projectSymbolGraph.publicContractRegions : [];
  const seenKeys = new Set(existingRegions.map((region) => region?.key).filter(Boolean));
  const syntheticRegions = [];
  for (const file of files) {
    syntheticRegions.push(...syntheticPublicContractRegions(file, input, stageName, seenKeys));
  }
  if (!syntheticRegions.length) return projectSymbolGraph;
  return {
    ...projectSymbolGraph,
    publicContractRegions: [...existingRegions, ...syntheticRegions]
  };
}

function syntheticPublicContractRegions(file, input, stageName, seenKeys) {
  if (typeof file?.sourceText !== 'string' || !file.sourcePath) return [];
  const records = [];
  for (const region of publicContractPolicyRegionsForPath(input, file.sourcePath)) {
    const kind = normalizeKind(region?.kind);
    if (!['interface', 'type', 'class'].includes(kind) || typeof region?.name !== 'string') continue;
    const container = findContainer(file.sourceText, region);
    if (container.reasonCodes.length || !isExportedContainer(file.sourceText, container.value)) continue;
    const members = parseMembers(container.value.body, kind);
    if (members.reasonCodes.length) continue;
    const key = `source#${file.sourcePath}#export#${region.name}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    records.push(syntheticPublicContractRegion(file, input, stageName, kind, region.name, key, members.members));
  }
  return records;
}

function syntheticPublicContractRegion(file, input, stageName, kind, name, key, members) {
  const language = file.language ?? input.language ?? languageForPath(file.sourcePath);
  const memberRecords = members.map((member) => compactRecord({
    key: member.key,
    memberKind: member.memberKind,
    signature: normalizeMemberText(member.text, kind)
  }));
  const signatureHash = hashSemanticValue({
    kind: 'frontier.lang.syntheticPublicContractSignature',
    language,
    sourcePath: file.sourcePath,
    symbolName: name,
    sourceKind: kind,
    members: memberRecords
  });
  const contractHash = hashSemanticValue({
    kind: 'frontier.lang.syntheticPublicContractRegionHash',
    language,
    sourcePath: file.sourcePath,
    key,
    symbolName: name,
    symbolKind: 'export',
    apiSurfaceKind: 'module-export',
    exportedName: name,
    edgeKind: 'export',
    signatureHash
  });
  return compactRecord({
    id: `region_${idFragment(stageName)}_${idFragment(key)}`,
    key,
    regionKind: 'export',
    granularity: 'symbol',
    language,
    sourcePath: file.sourcePath,
    sourceHash: file.sourceHash,
    symbolId: `symbol:${language}:export:${idFragment(name)}`,
    symbolName: name,
    symbolKind: 'export',
    publicContract: true,
    exportedName: name,
    edgeKind: 'export',
    apiSurfaceKind: 'module-export',
    signatureHash,
    contractHash,
    metadata: {
      source: 'js-ts-safe-project-merge-policy',
      projectGraphStage: stageName,
      sourceKind: kind,
      memberKeys: memberRecords.map((member) => member.key)
    }
  });
}

function publicContractPolicyRegionsForPath(input, sourcePath) {
  const policy = input.policyByPath?.[sourcePath]
    ?? input.mergePolicyByPath?.[sourcePath]
    ?? input.policy
    ?? input.mergePolicy;
  const regions = Array.isArray(policy)
    ? policy
    : policy?.unorderedRegions
      ?? policy?.unorderedMemberRegions
      ?? policy?.safeList
      ?? policy?.safeMembers
      ?? [];
  return Array.isArray(regions) ? regions : [];
}

function isExportedContainer(sourceText, container) {
  if (!container) return false;
  return /^\s*export\b/.test(sourceText.slice(container.start, container.openStart));
}

function languageForPath(sourcePath) {
  const path = String(sourcePath ?? '').toLowerCase();
  if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.mjs') || path.endsWith('.cjs')) return 'javascript';
  return 'typescript';
}

export { augmentProjectSymbolGraphPublicContracts };
