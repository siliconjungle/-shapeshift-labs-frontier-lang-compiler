import { uniqueStrings } from '../../native-import-utils.js';

export function lineageLinkInputs(source, options, changedRegions, targetPortability) {
  return [
    ...array(options.lineageResolutionLinks ?? options.semanticLineageResolutionLinks),
    ...array(options.lineageResolutions ?? options.semanticLineageResolutions),
    ...array(source.lineageResolutionLinks ?? source.semanticLineageResolutionLinks),
    ...array(source.lineageResolutions ?? source.semanticLineageResolutions),
    ...array(source.metadata?.semanticLineageResolutionLinks),
    ...array(source.metadata?.semanticHistoryLineageResolution),
    ...array(source.metadata?.semanticLineageResolution),
    ...array(source.metadata?.targetPortability?.lineageResolutionLinks),
    ...array(targetPortability?.lineageResolutionLinks),
    ...array(targetPortability?.lineageResolutions),
    ...changedRegions.flatMap((region) => lineageLinksFromRegion(region))
  ];
}

export function normalizeLineageResolutionLinks(entries) {
  const seen = new Set();
  const result = [];
  for (const entry of lineageResolutionEntries(entries)) {
    const currentAnchors = array(entry.currentAnchors);
    const summary = entry.summary ?? {};
    const anchorSummary = entry.anchorSummary ?? {};
    const ids = uniqueStrings([
      entry.id,
      entry.resolutionId,
      entry.lineageResolutionId,
      ...strings(entry.lineageResolutionIds),
      ...strings(entry.semanticLineageResolutionIds),
      ...strings(summary.lineageResolutionIds)
    ]);
    const link = compactRecord({
      id: firstString(entry.id, entry.resolutionId, entry.lineageResolutionId, ids[0]),
      lineageResolutionIds: ids,
      status: entry.status,
      readiness: entry.readiness ?? entry.admission?.readiness,
      action: entry.action ?? entry.admission?.action,
      anchorKeys: uniqueStrings([
        entry.anchorKey,
        entry.query?.anchorKey,
        entry.startAnchor?.key,
        ...strings(entry.anchorKeys),
        ...strings(anchorSummary.activeAnchorKeys),
        ...strings(anchorSummary.candidateAnchorKeys),
        ...strings(anchorSummary.blockedAnchorKeys),
        ...strings(summary.activeAnchorKeys),
        ...strings(summary.candidateAnchorKeys),
        ...strings(summary.blockedAnchorKeys),
        ...currentAnchors.map((anchor) => anchor.key)
      ]),
      sourcePaths: uniqueStrings([
        entry.sourcePath,
        entry.query?.sourcePath,
        entry.startAnchor?.sourcePath,
        ...strings(entry.sourcePaths),
        ...strings(entry.lineageSourcePaths),
        ...strings(summary.sourcePaths),
        ...currentAnchors.flatMap((anchor) => [anchor.sourcePath, ...strings(anchor.lineageSourcePaths)])
      ]),
      evidenceIds: uniqueStrings([
        ...strings(entry.evidenceIds),
        ...strings(entry.lineageEvidenceIds),
        ...strings(summary.evidenceIds),
        ...currentAnchors.flatMap((anchor) => strings(anchor.evidenceIds))
      ]),
      proofIds: uniqueStrings([
        ...strings(entry.proofIds),
        ...strings(entry.lineageProofIds),
        ...strings(summary.proofIds),
        ...currentAnchors.flatMap((anchor) => strings(anchor.proofIds))
      ]),
      lineageEventIds: uniqueStrings([
        ...strings(entry.lineageEventIds),
        ...strings(entry.traversedEventIds),
        ...strings(summary.lineageEventIds),
        ...strings(summary.traversedEventIds),
        ...currentAnchors.flatMap((anchor) => strings(anchor.lineageEventIds))
      ]),
      terminalEventIds: uniqueStrings([
        ...strings(entry.terminalEventIds),
        ...strings(summary.terminalEventIds),
        ...currentAnchors.flatMap((anchor) => strings(anchor.terminalLineageEventIds))
      ]),
      crdtOperationIds: uniqueStrings([
        ...strings(entry.crdtOperationIds),
        ...strings(summary.crdtOperationIds),
        ...currentAnchors.flatMap((anchor) => strings(anchor.crdtOperationIds))
      ]),
      crdtHeads: uniqueStrings([
        ...strings(entry.crdtHeads),
        ...strings(summary.crdtHeads),
        ...currentAnchors.flatMap((anchor) => strings(anchor.crdtHeads))
      ]),
      reasonCodes: uniqueStrings([
        ...strings(entry.reasonCodes),
        ...strings(entry.lineageReasonCodes),
        ...strings(summary.reasonCodes),
        ...currentAnchors.flatMap((anchor) => strings(anchor.lineageReasonCodes))
      ])
    });
    const key = firstString(link.id, ...strings(link.lineageResolutionIds), ...strings(link.lineageEventIds), ...strings(link.evidenceIds), ...strings(link.sourcePaths));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(link);
  }
  return result;
}

export function semanticLineageLinkIndex(links = [], changedRegions = [], targetPortability, admission) {
  const records = normalizeLineageResolutionLinks([
    ...array(links),
    ...array(targetPortability?.lineageResolutionLinks),
    ...array(targetPortability?.lineageResolutions),
    ...array(admission?.metadata?.semanticLineageResolutionLinks),
    ...array(changedRegions).flatMap((region) => lineageLinksFromRegion(region))
  ]);
  return {
    lineageResolutionIds: uniqueStrings(records.flatMap((record) => [record.id, ...strings(record.lineageResolutionIds)])),
    lineageEventIds: uniqueStrings(records.flatMap((record) => record.lineageEventIds)),
    sourcePaths: uniqueStrings(records.flatMap((record) => record.sourcePaths)),
    evidenceIds: uniqueStrings(records.flatMap((record) => record.evidenceIds)),
    proofIds: uniqueStrings(records.flatMap((record) => record.proofIds)),
    reasonCodes: uniqueStrings(records.flatMap((record) => record.reasonCodes)),
    terminalEventIds: uniqueStrings(records.flatMap((record) => record.terminalEventIds)),
    crdtOperationIds: uniqueStrings(records.flatMap((record) => record.crdtOperationIds)),
    crdtHeads: uniqueStrings(records.flatMap((record) => record.crdtHeads))
  };
}

export function linkAdmissionLineage(admission, lineageLinks) {
  if (lineageLinks.length === 0) return admission;
  const lineageIndex = semanticLineageLinkIndex(lineageLinks);
  return {
    ...admission,
    evidenceIds: uniqueStrings([...strings(admission.evidenceIds), ...lineageIndex.evidenceIds]),
    reasonCodes: uniqueStrings([...strings(admission.reasonCodes), 'semantic-lineage-resolution-linked', ...lineageIndex.reasonCodes]),
    metadata: compactRecord({
      ...(admission.metadata ?? {}),
      semanticLineageResolutionLinks: lineageLinks
    })
  };
}

function lineageLinksFromRegion(region = {}) {
  const metadata = region.metadata ?? {};
  const bidirectional = metadata.bidirectionalTargetChange ?? {};
  const history = metadata.semanticHistoryLineageResolution ?? {};
  const lineage = metadata.semanticLineageResolution ?? {};
  return [
    ...array(region.lineageResolutionLinks),
    ...array(region.lineageResolutions),
    compactRecord({
      lineageResolutionIds: region.lineageResolutionIds,
      lineageEventIds: region.lineageEventIds,
      sourcePaths: region.lineageSourcePaths,
      evidenceIds: region.lineageEvidenceIds,
      proofIds: region.lineageProofIds,
      reasonCodes: region.lineageReasonCodes
    }),
    bidirectional,
    history,
    lineage,
    ...array(bidirectional.lineageResolutionLinks),
    ...array(history.lineageResolutionLinks),
    ...array(lineage.lineageResolutionLinks)
  ].filter((entry) => Object.keys(entry ?? {}).length > 0);
}

function lineageResolutionEntries(entries) {
  const result = [];
  for (const entry of array(entries).filter(Boolean)) {
    result.push(entry);
    result.push(...array(entry.resolutions));
    result.push(...array(entry.lineageResolutions));
    result.push(...array(entry.semanticLineageResolutions));
    result.push(...array(entry.lineageResolutionLinks));
    result.push(...array(entry.semanticLineageResolutionLinks));
  }
  return result;
}

function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function strings(value) {
  return array(value).map((entry) => String(entry ?? '')).filter(Boolean);
}

function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
