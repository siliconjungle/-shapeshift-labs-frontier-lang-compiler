import { hashText, safeId } from './js-ts-safe-project-merge-core.js';

const CssDependencyGraphProofGap = 'css-dependency-graph-proof-unproved';
const CssDependencyGraphConflict = 'css-dependency-graph-proof-blocked';
const SourceBoundDependencyRecordProofGap = 'css-source-bound-dependency-records-missing';
const SourceBoundDependencyRecordConflict = 'css-source-bound-dependency-record-proof-blocked';
const CustomPropertyProjectProofLevel = 'css-custom-property-dependency-graph-project-source-bound';
const VarFallbackProjectProofLevel = 'css-var-fallback-dependency-graph-project-source-bound';
const SourceBoundDependencyGraphProofKind = 'css-source-bound-dependency-graph-proof';
const SynthesizableDependencyKinds = new Set(['custom-property-definition', 'custom-property-reference']);
const DependencyRecordSetKeys = Object.freeze(['customPropertyDefinitions', 'customPropertyReferences']);

function projectCssDependencyProofOptionsForBlockedMerge(input) {
  const { projectInput, sourcePath, firstResult, base, worker, head } = input;
  if (projectInput?.disableProjectCssDependencyGraphProofSynthesis === true) return undefined;
  if (firstResult?.status !== 'blocked' || typeof firstResult.candidateMergedSourceText !== 'string' || !firstResult.candidateMergedSourceHash) return undefined;
  const evidence = firstResult.dependencyGraphEvidence;
  const conflicts = dependencyGraphProofConflicts(firstResult);
  if (!evidence?.changedDependencySurfaces?.length || !conflicts.length) return undefined;
  const changesByKey = new Map(evidence.changedDependencySurfaces.map((change) => [dependencyChangeKey(change), change]));
  const proofChanges = conflicts
    .map((conflict) => changesByKey.get(dependencyConflictKey(conflict)) ?? dependencyChangeFromConflict(conflict))
    .filter((change) => change?.reasonCode === CssDependencyGraphProofGap && canSynthesizeDependencyChange(change));
  if (!proofChanges.length) return undefined;
  const sourceBoundChanges = proofChanges.map((change) => ({ change, sourceBoundDependencyRecords: sourceBoundDependencyRecordsForChange(evidence, change) }));
  const unboundChanges = sourceBoundChanges.filter(({ change, sourceBoundDependencyRecords }) => !hasRequiredSourceBoundDependencyRecords(sourceBoundDependencyRecords, change));
  if (unboundChanges.length) return { result: sourceBoundDependencyRecordBlockedResult({ firstResult, sourcePath, unboundChanges }) };
  return {
    mergeOptions: {
      cssDependencyGraphProofs: sourceBoundChanges.map(({ change, sourceBoundDependencyRecords }, index) => projectCssDependencyGraphProof({ sourcePath, evidence, change, sourceBoundDependencyRecords, firstResult, base, worker, head, index }))
    }
  };
}

function dependencyGraphProofConflicts(result) {
  return (result.conflicts ?? []).filter((conflict) => conflict.code === CssDependencyGraphConflict && conflict.details?.reasonCode === CssDependencyGraphProofGap);
}

function dependencyChangeFromConflict(conflict) {
  const details = conflict?.details;
  if (!details?.side || !details?.cascadeKey) return undefined;
  return {
    side: details.side,
    cascadeKey: details.cascadeKey,
    reasonCode: details.reasonCode,
    changeKind: details.changeKind,
    before: details.before,
    after: details.after
  };
}

function canSynthesizeDependencyChange(change) {
  const kinds = uniqueStrings([...(change.before?.dependencyKinds ?? []), ...(change.after?.dependencyKinds ?? [])]);
  return kinds.length > 0 && kinds.every((kind) => SynthesizableDependencyKinds.has(kind));
}

function projectCssDependencyGraphProof({ sourcePath, evidence, change, sourceBoundDependencyRecords, firstResult, base, worker, head, index }) {
  const dependencyKinds = uniqueStrings([...(change.before?.dependencyKinds ?? []), ...(change.after?.dependencyKinds ?? [])]);
  const varFallbackReferenceHashes = varFallbackHashesForChange(evidence, change);
  const sourceBoundDependencyRecordHashes = sourceBoundDependencyRecordHashesBySide(sourceBoundDependencyRecords);
  return {
    id: `project_css_dependency_graph_${safeId(sourcePath)}_${index}`,
    kind: SourceBoundDependencyGraphProofKind,
    status: 'passed',
    proofLevel: Object.keys(varFallbackReferenceHashes).length ? VarFallbackProjectProofLevel : CustomPropertyProjectProofLevel,
    sourcePath,
    reasonCode: change.reasonCode,
    side: change.side,
    cascadeKey: change.cascadeKey,
    dependencyKinds,
    baseSourceHash: hashText(base),
    workerSourceHash: hashText(worker),
    headSourceHash: hashText(head),
    outputSourceHash: firstResult.candidateMergedSourceHash,
    dependencyGraphHashes: dependencyGraphHashes(evidence),
    cssDependencyGraphHashes: cssDependencyGraphHashes(evidence),
    varFallbackReferenceHashes,
    sourceBoundDependencyRecords,
    sourceBoundDependencyRecordHashes,
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  };
}

function sourceBoundDependencyRecordsForChange(evidence, change) {
  return compactRecord({
    base: sourceBoundDependencyRecordsForSide(evidence.sides?.base, change.cascadeKey, change.before?.dependencyKinds),
    [change.side]: sourceBoundDependencyRecordsForSide(evidence.sides?.[change.side], change.cascadeKey, change.after?.dependencyKinds)
  });
}

function sourceBoundDependencyRecordsForSide(sideEvidence, cascadeKey, dependencyKinds = []) {
  const kinds = new Set(dependencyKinds);
  if (!kinds.size) return [];
  return dependencyRecordsForCascadeKey(sideEvidence, cascadeKey)
    .filter((record) => kinds.has(record.kind))
    .filter(hasSourceBoundDependencyRecord)
    .map(sourceBoundDependencyRecordSummary);
}

function dependencyRecordsForCascadeKey(sideEvidence, cascadeKey) {
  return DependencyRecordSetKeys.flatMap((key) => sideEvidence?.records?.[key] ?? [])
    .filter((record) => record?.cascadeKey === cascadeKey);
}

function hasRequiredSourceBoundDependencyRecords(recordsBySide, change) {
  return sideDependencyRecordRequirementMet(recordsBySide.base, change.before) &&
    sideDependencyRecordRequirementMet(recordsBySide[change.side], change.after);
}

function sideDependencyRecordRequirementMet(records = [], summary) {
  const kinds = summary?.dependencyKinds ?? [];
  return !kinds.length || records.length > 0;
}

function hasSourceBoundDependencyRecord(record) {
  return typeof record?.sourceHash === 'string' &&
    Number.isInteger(record?.sourceSpan?.startOffset) &&
    Number.isInteger(record?.sourceSpan?.endOffset) &&
    typeof record.declarationHash === 'string';
}

function sourceBoundDependencyRecordSummary(record) {
  return compactRecord({
    kind: record.kind,
    cascadeKey: record.cascadeKey,
    property: record.property,
    name: record.name,
    family: record.family,
    url: record.url,
    hasFallback: record.hasFallback,
    fallbackHash: record.fallbackHash,
    declarationHash: record.declarationHash,
    ruleHash: record.ruleHash,
    atRuleHash: record.atRuleHash,
    selectors: record.selectors,
    scopes: record.scopes,
    sourceHash: record.sourceHash,
    sourceSpan: record.sourceSpan
  });
}

function sourceBoundDependencyRecordHashesBySide(recordsBySide) {
  return Object.fromEntries(Object.entries(recordsBySide)
    .map(([side, records]) => [side, uniqueStrings((records ?? []).map(sourceBoundDependencyRecordHash))])
    .filter(([, hashes]) => hashes.length > 0));
}

function sourceBoundDependencyRecordHash(record) {
  return hashText(JSON.stringify(record));
}

function sourceBoundDependencyRecordBlockedResult({ firstResult, sourcePath, unboundChanges }) {
  const conflicts = [
    ...(firstResult.conflicts ?? []),
    ...unboundChanges.map(({ change, sourceBoundDependencyRecords }) => sourceBoundDependencyRecordConflict(firstResult.id, sourcePath, change, sourceBoundDependencyRecords))
  ];
  return compactRecord({
    ...firstResult,
    conflicts,
    admission: blockedSourceBoundDependencyRecordAdmission(firstResult.admission, conflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false
  });
}

function sourceBoundDependencyRecordConflict(id, sourcePath, change, sourceBoundDependencyRecords) {
  const missingSides = missingSourceBoundDependencyRecordSides(sourceBoundDependencyRecords, change);
  return {
    code: SourceBoundDependencyRecordConflict,
    gateId: 'css-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode: SourceBoundDependencyRecordProofGap,
      conflictKey: `css#${id ?? safeId(sourcePath)}#${SourceBoundDependencyRecordProofGap}#${change.side ?? 'side'}#${change.cascadeKey ?? sourcePath ?? 'source'}`,
      side: change.side,
      cascadeKey: change.cascadeKey,
      dependencyKinds: uniqueStrings([...(change.before?.dependencyKinds ?? []), ...(change.after?.dependencyKinds ?? [])]),
      missingSourceBoundDependencyRecordSides: missingSides,
      sourceBoundDependencyRecords,
      proofGap: {
        code: SourceBoundDependencyRecordProofGap,
        status: 'not-claimed',
        summary: 'Project-level CSS dependency proof synthesis requires parser-backed source spans and source hashes for changed custom-property or var() fallback dependency records.',
        nextProof: 'Supply dependency graph evidence whose custom property definition/reference records include declaration hashes, source spans, and source hashes on every changed side before synthesizing the source-bound dependency proof.',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    })
  };
}

function missingSourceBoundDependencyRecordSides(recordsBySide, change) {
  return [
    sideDependencyRecordRequirementMet(recordsBySide.base, change.before) ? undefined : 'base',
    sideDependencyRecordRequirementMet(recordsBySide[change.side], change.after) ? undefined : change.side
  ].filter(Boolean);
}

function blockedSourceBoundDependencyRecordAdmission(admission = {}, conflicts = []) {
  return compactRecord({
    ...admission,
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false,
    reasonCodes: uniqueStrings([...(admission.reasonCodes ?? []), ...conflicts.map((conflict) => conflict.details?.reasonCode ?? conflict.code)])
  });
}

function varFallbackHashesForChange(evidence, change) {
  const hashes = compactRecord({
    base: varFallbackHashesForCascadeKey(evidence.sides?.base, change.cascadeKey),
    [change.side]: varFallbackHashesForCascadeKey(evidence.sides?.[change.side], change.cascadeKey)
  });
  return Object.fromEntries(Object.entries(hashes).filter(([, values]) => values.length > 0));
}

function varFallbackHashesForCascadeKey(sideEvidence, cascadeKey) {
  return uniqueStrings((sideEvidence?.records?.customPropertyReferences ?? [])
    .filter((record) => record.cascadeKey === cascadeKey && record.hasFallback === true)
    .map((record) => record.fallbackHash));
}

function dependencyGraphHashes(evidence) {
  return compactRecord({
    base: evidence.sides?.base?.dependencyGraphHash,
    worker: evidence.sides?.worker?.dependencyGraphHash,
    head: evidence.sides?.head?.dependencyGraphHash
  });
}

function cssDependencyGraphHashes(evidence) {
  return compactRecord({
    base: evidence.sides?.base?.cssDependencyGraphHash,
    worker: evidence.sides?.worker?.cssDependencyGraphHash,
    head: evidence.sides?.head?.cssDependencyGraphHash
  });
}

function dependencyChangeKey(change) {
  return `${change?.side ?? ''}#${change?.cascadeKey ?? ''}#${change?.reasonCode ?? ''}`;
}

function dependencyConflictKey(conflict) {
  const details = conflict?.details ?? {};
  return `${details.side ?? ''}#${details.cascadeKey ?? ''}#${details.reasonCode ?? ''}`;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

export { projectCssDependencyProofOptionsForBlockedMerge };
