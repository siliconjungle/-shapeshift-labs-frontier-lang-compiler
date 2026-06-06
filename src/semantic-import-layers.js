import { uniqueStrings } from './native-import-utils.js';

function summarizeSemanticImportSidecarProofSpec(importEntries) {
  const byStatus = {};
  const byReadinessStatus = {};
  const byContractKind = {};
  const byArtifactKind = {};
  const ids = [];
  const contractKinds = [];
  const artifactKinds = [];
  const totals = {
    total: 0,
    contracts: 0,
    refinements: 0,
    invariants: 0,
    termination: 0,
    temporal: 0,
    obligations: 0,
    artifacts: 0,
    assumptions: 0,
    evidence: 0,
    discharged: 0,
    pending: 0,
    failed: 0,
    open: 0,
    unknown: 0,
    stale: 0,
    assumed: 0,
    externalToolRequired: 0
  };
  for (const entry of importEntries) {
    const proof = entry.proofSpec ?? summarizeProofSpecLayer();
    ids.push(...(proof.ids ?? []));
    contractKinds.push(...(proof.contractKinds ?? []));
    artifactKinds.push(...(proof.artifactKinds ?? []));
    for (const key of Object.keys(totals)) {
      totals[key] += proof[key] ?? 0;
    }
    for (const [status, count] of Object.entries(proof.byStatus ?? {})) {
      byStatus[status] = (byStatus[status] ?? 0) + count;
    }
    for (const [status, count] of Object.entries(proof.byReadinessStatus ?? {})) {
      byReadinessStatus[status] = (byReadinessStatus[status] ?? 0) + count;
    }
    for (const [kind, count] of Object.entries(proof.byContractKind ?? {})) {
      byContractKind[kind] = (byContractKind[kind] ?? 0) + count;
    }
    for (const [kind, count] of Object.entries(proof.byArtifactKind ?? {})) {
      byArtifactKind[kind] = (byArtifactKind[kind] ?? 0) + count;
    }
  }
  return {
    ...totals,
    ids: uniqueStrings(ids),
    contractKinds: uniqueStrings(contractKinds),
    artifactKinds: uniqueStrings(artifactKinds),
    byStatus,
    byReadinessStatus,
    byContractKind,
    byArtifactKind,
    empty: totals.total === 0
  };
}

const ParadigmSemanticSummaryGroups = Object.freeze([
  'bindingScopes',
  'bindings',
  'patterns',
  'typeConstraints',
  'evaluationModels',
  'memoryLocations',
  'effectRegions',
  'controlRegions',
  'logicPrograms',
  'actorSystems',
  'stackEffects',
  'arrayShapes',
  'numericKernels',
  'dataflowNetworks',
  'clockModels',
  'objectModels',
  'macroExpansions',
  'reflectionBoundaries',
  'loweringRecords'
]);

function summarizeSemanticImportSidecarParadigmSemantics(importEntries) {
  const totals = emptyParadigmSemanticsSummary();
  const ids = [];
  const kinds = [];
  const byGroup = {};
  const byKind = {};
  for (const entry of importEntries) {
    const summary = entry.paradigmSemantics ?? summarizeParadigmSemanticsLayer();
    ids.push(...(summary.ids ?? []));
    kinds.push(...(summary.kinds ?? []));
    totals.total += summary.total ?? 0;
    totals.evidence += summary.evidence ?? 0;
    for (const group of ParadigmSemanticSummaryGroups) {
      totals[group] += summary[group] ?? 0;
    }
    for (const [group, count] of Object.entries(summary.byGroup ?? {})) {
      byGroup[group] = (byGroup[group] ?? 0) + count;
    }
    for (const [kind, count] of Object.entries(summary.byKind ?? {})) {
      byKind[kind] = (byKind[kind] ?? 0) + count;
    }
  }
  return {
    ...totals,
    ids: uniqueStrings(ids),
    groups: uniqueStrings(Object.keys(byGroup).filter((group) => byGroup[group] > 0)),
    kinds: uniqueStrings(kinds),
    byGroup,
    byKind,
    hasRuntimeSemantics: hasAnyParadigmCount(totals, ['evaluationModels', 'memoryLocations', 'effectRegions', 'controlRegions', 'actorSystems', 'clockModels']),
    hasLogicSemantics: totals.logicPrograms > 0,
    hasStackSemantics: totals.stackEffects > 0,
    hasArraySemantics: totals.arrayShapes > 0 || totals.numericKernels > 0,
    hasMacroOrReflection: totals.macroExpansions > 0 || totals.reflectionBoundaries > 0,
    hasLowering: totals.loweringRecords > 0,
    empty: totals.total === 0
  };
}

function summarizeParadigmSemanticsLayer(paradigmSemantics = {}) {
  const totals = emptyParadigmSemanticsSummary();
  const ids = [];
  const kinds = [];
  const byGroup = {};
  const byKind = {};
  ids.push(paradigmSemantics?.id);
  for (const group of ParadigmSemanticSummaryGroups) {
    const records = paradigmSemantics?.[group] ?? [];
    totals[group] = records.length;
    totals.total += records.length;
    if (records.length > 0) {
      byGroup[group] = records.length;
    }
    for (const record of records) {
      ids.push(record?.id);
      if (record?.kind) {
        kinds.push(record.kind);
        byKind[record.kind] = (byKind[record.kind] ?? 0) + 1;
      }
    }
  }
  totals.evidence = (paradigmSemantics?.evidence ?? []).length;
  ids.push(...(paradigmSemantics?.evidence ?? []).map((record) => record?.id));
  return {
    ...totals,
    ids: uniqueStrings(ids.filter(Boolean)),
    groups: uniqueStrings(Object.keys(byGroup)),
    kinds: uniqueStrings(kinds),
    byGroup,
    byKind,
    hasRuntimeSemantics: hasAnyParadigmCount(totals, ['evaluationModels', 'memoryLocations', 'effectRegions', 'controlRegions', 'actorSystems', 'clockModels']),
    hasLogicSemantics: totals.logicPrograms > 0,
    hasStackSemantics: totals.stackEffects > 0,
    hasArraySemantics: totals.arrayShapes > 0 || totals.numericKernels > 0,
    hasMacroOrReflection: totals.macroExpansions > 0 || totals.reflectionBoundaries > 0,
    hasLowering: totals.loweringRecords > 0,
    empty: totals.total === 0
  };
}

function emptyParadigmSemanticsSummary() {
  return {
    total: 0,
    evidence: 0,
    ...Object.fromEntries(ParadigmSemanticSummaryGroups.map((group) => [group, 0]))
  };
}

function hasAnyParadigmCount(summary, groups) {
  return groups.some((group) => (summary[group] ?? 0) > 0);
}

const ProofObligationStatusAliases = Object.freeze({
  accepted: 'discharged', checked: 'discharged', ok: 'discharged', passed: 'discharged',
  proved: 'discharged', qed: 'discharged', success: 'discharged', succeeded: 'discharged',
  valid: 'discharged', verified: 'discharged',
  counterexample: 'failed', cex: 'failed', error: 'failed', falsified: 'failed',
  invalid: 'failed', rejected: 'failed', violated: 'failed',
  pending: 'pending', todo: 'pending', unproved: 'pending', unverified: 'pending',
  obsolete: 'stale', outdated: 'stale', admit: 'assumed', admitted: 'assumed',
  assume: 'assumed', axiom: 'assumed', trusted: 'assumed', unchecked: 'assumed',
  'solver-required': 'external-tool-required', 'prover-required': 'external-tool-required', 'tool-required': 'external-tool-required', 'external-tool-required': 'external-tool-required'
});

function proofObligationStatusKey(status) {
  return String(status ?? 'unknown').trim().toLowerCase().replace(/[\s_]+/g, '-') || 'unknown';
}

function proofObligationReadinessStatus(status) {
  const key = proofObligationStatusKey(status);
  const known = ['discharged', 'failed', 'pending', 'open', 'unknown', 'stale', 'assumed', 'external-tool-required'];
  return ProofObligationStatusAliases[key] ?? (known.includes(key) ? key : 'unknown');
}

function summarizeProofSpecLayer(proof = {}) {
  const contracts = proof?.contracts ?? [];
  const refinements = proof?.refinements ?? [];
  const invariants = proof?.invariants ?? [];
  const termination = proof?.termination ?? [];
  const temporal = proof?.temporal ?? [];
  const obligations = proof?.obligations ?? [];
  const artifacts = proof?.artifacts ?? [];
  const assumptions = proof?.assumptions ?? [];
  const evidence = proof?.evidence ?? [];
  const allContracts = [...contracts, ...refinements, ...invariants, ...termination, ...temporal];
  const byStatus = {};
  const byReadinessStatus = {};
  for (const obligation of obligations) {
    const status = proofObligationStatusKey(obligation?.status);
    const readinessStatus = proofObligationReadinessStatus(status);
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    byReadinessStatus[readinessStatus] = (byReadinessStatus[readinessStatus] ?? 0) + 1;
  }
  const byContractKind = {};
  for (const contract of allContracts) {
    const kind = contract?.kind ?? 'unknown';
    byContractKind[kind] = (byContractKind[kind] ?? 0) + 1;
  }
  const byArtifactKind = {};
  for (const artifact of artifacts) {
    const kind = artifact?.kind ?? 'unknown';
    byArtifactKind[kind] = (byArtifactKind[kind] ?? 0) + 1;
  }
  const recordGroups = [allContracts, obligations, artifacts, assumptions];
  const ids = uniqueStrings([
    proof?.id,
    ...recordGroups.flatMap((records) => records.map((record) => record?.id)),
    ...evidence.map((record) => record?.id)
  ].filter(Boolean));
  const total = allContracts.length + obligations.length + artifacts.length + assumptions.length;
  return {
    total,
    ids,
    contracts: contracts.length,
    refinements: refinements.length,
    invariants: invariants.length,
    termination: termination.length,
    temporal: temporal.length,
    obligations: obligations.length,
    artifacts: artifacts.length,
    assumptions: assumptions.length,
    evidence: evidence.length,
    discharged: byReadinessStatus.discharged ?? 0,
    pending: byReadinessStatus.pending ?? 0,
    failed: byReadinessStatus.failed ?? 0,
    open: (byReadinessStatus.open ?? 0) + (byReadinessStatus.pending ?? 0),
    unknown: byReadinessStatus.unknown ?? 0,
    stale: byReadinessStatus.stale ?? 0,
    assumed: byReadinessStatus.assumed ?? 0,
    externalToolRequired: byReadinessStatus['external-tool-required'] ?? 0,
    contractKinds: uniqueStrings(allContracts.map((record) => record?.kind).filter(Boolean)),
    artifactKinds: uniqueStrings(artifacts.map((record) => record?.kind).filter(Boolean)),
    byStatus,
    byReadinessStatus,
    byContractKind,
    byArtifactKind,
    empty: total === 0
  };
}

function summarizeSemanticImportSidecarUniversalAstLayers(importEntries) {
  const names = [];
  const ids = [];
  const byName = {};
  for (const entry of importEntries) {
    names.push(...(entry.universalAstLayerNames ?? []));
    ids.push(...(entry.universalAstLayerIds ?? []));
    for (const name of entry.universalAstLayerNames ?? []) {
      byName[name] = (byName[name] ?? 0) + 1;
    }
  }
  const uniqueNames = uniqueStrings(names);
  return {
    total: ids.length,
    names: uniqueNames,
    ids: uniqueStrings(ids),
    byName,
    empty: ids.length === 0
  };
}

function summarizeUniversalAstLayers(universalAst) {
  const layers = collectUniversalAstLayerRecords(universalAst?.layers);
  const names = uniqueStrings(layers.map((layer) => layer.layer).filter(Boolean));
  const ids = uniqueStrings(layers.map((layer) => layer.id).filter(Boolean));
  const byName = {};
  for (const layer of layers) {
    if (!layer?.layer) continue;
    byName[layer.layer] = (byName[layer.layer] ?? 0) + 1;
  }
  return {
    total: layers.length,
    names,
    ids,
    byName,
    empty: layers.length === 0
  };
}

function collectUniversalAstLayerRecords(layers) {
  if (!layers) return [];
  if (Array.isArray(layers)) return layers.filter(Boolean);
  if (typeof layers !== 'object') return [];
  return Object.values(layers).flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean);
}

export {
  summarizeParadigmSemanticsLayer,
  summarizeProofSpecLayer,
  summarizeSemanticImportSidecarParadigmSemantics,
  summarizeSemanticImportSidecarProofSpec,
  summarizeSemanticImportSidecarUniversalAstLayers,
  summarizeUniversalAstLayers
};
