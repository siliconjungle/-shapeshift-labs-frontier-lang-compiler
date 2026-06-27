import { hashText, safeId } from './js-ts-safe-project-merge-core.js';

const CssDependencyGraphProofGap = 'css-dependency-graph-proof-unproved';
const CssDependencyGraphConflict = 'css-dependency-graph-proof-blocked';
const ProjectProofLevel = 'css-custom-property-dependency-graph-project-source-bound';
const SourceBoundDependencyGraphProofKind = 'css-source-bound-dependency-graph-proof';
const SynthesizableDependencyKinds = new Set(['custom-property-definition', 'custom-property-reference']);

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
  return {
    mergeOptions: {
      cssDependencyGraphProofs: proofChanges.map((change, index) => projectCssDependencyGraphProof({ sourcePath, evidence, change, firstResult, base, worker, head, index }))
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

function projectCssDependencyGraphProof({ sourcePath, evidence, change, firstResult, base, worker, head, index }) {
  return {
    id: `project_css_dependency_graph_${safeId(sourcePath)}_${index}`,
    kind: SourceBoundDependencyGraphProofKind,
    status: 'passed',
    proofLevel: ProjectProofLevel,
    sourcePath,
    reasonCode: change.reasonCode,
    side: change.side,
    cascadeKey: change.cascadeKey,
    dependencyKinds: uniqueStrings([...(change.before?.dependencyKinds ?? []), ...(change.after?.dependencyKinds ?? [])]),
    baseSourceHash: hashText(base),
    workerSourceHash: hashText(worker),
    headSourceHash: hashText(head),
    outputSourceHash: firstResult.candidateMergedSourceHash,
    dependencyGraphHashes: dependencyGraphHashes(evidence),
    cssDependencyGraphHashes: cssDependencyGraphHashes(evidence),
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  };
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
