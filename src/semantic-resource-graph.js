import { idFragment, uniqueRecordsById, uniqueStrings } from './native-import-utils.js';
import {
  dropsFromOwnershipRegions,
  lifetimeRegionsFromOwnershipRegions,
  ownersFromOwnershipRegions,
  ownersFromResources,
  resourceGraphsFromInput,
  resourcesFromOwnershipRegions,
  resourcesFromParadigmSemantics
} from './internal/index-impl/semanticResourceGraphInput.js';
import { rustResourceGraphRecordsFromInput } from './internal/index-impl/semanticResourceGraphRust.js';
import {
  aliasRecord,
  allRecords,
  conflictRecord,
  dropRecord,
  exclusiveAliasConflicts,
  lifetimeRegionRecord,
  loanRecord,
  match,
  movementRecord,
  ownerRecord,
  proofObligationRecord,
  proofObligationsForUnsafeBoundaries,
  resourceGraphStatus,
  resourceGraphSummary,
  resourceRecord,
  unsafeBoundaryConflicts,
  unsafeBoundaryRecord
} from './internal/index-impl/semanticResourceGraphRecords.js';

export const SemanticResourceGraphRecordKinds = Object.freeze([
  'resource',
  'owner',
  'loan',
  'alias',
  'move',
  'drop',
  'lifetime-region',
  'unsafe-boundary',
  'conflict',
  'proof-obligation'
]);

export const SemanticResourceLoanModes = Object.freeze([
  'shared',
  'mutable',
  'exclusive',
  'move',
  'raw',
  'unknown'
]);

export function createSemanticResourceGraph(input = {}) {
  const graphs = resourceGraphsFromInput(input);
  const rustRecords = rustResourceGraphRecordsFromInput(input);
  const evidenceIds = uniqueStrings([
    ...(input.evidenceIds ?? []),
    ...(input.evidence ?? []).map((record) => record?.id),
    ...graphs.flatMap((graph) => graph.evidenceIds ?? graph.evidence?.ids ?? [])
  ]);
  const resources = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.resources ?? []),
    ...(input.resources ?? []),
    ...resourcesFromParadigmSemantics(input),
    ...resourcesFromOwnershipRegions(input),
    ...rustRecords.resources
  ].map((record, index) => resourceRecord(record, index, input, evidenceIds)));
  const owners = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.owners ?? []),
    ...(input.owners ?? []),
    ...ownersFromResources(resources),
    ...ownersFromOwnershipRegions(input),
    ...rustRecords.owners
  ].map((record, index) => ownerRecord(record, index, input, evidenceIds)));
  const lifetimeRegions = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.lifetimeRegions ?? []),
    ...(input.lifetimeRegions ?? []),
    ...lifetimeRegionsFromOwnershipRegions(input),
    ...rustRecords.lifetimeRegions
  ].map((record, index) => lifetimeRegionRecord(record, index, input, evidenceIds)));
  const loans = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.loans ?? []),
    ...(input.loans ?? []),
    ...rustRecords.loans
  ].map((record, index) => loanRecord(record, index, input, evidenceIds)));
  const aliases = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.aliases ?? []),
    ...(input.aliases ?? []),
    ...rustRecords.aliases
  ].map((record, index) => aliasRecord(record, index, input, evidenceIds)));
  const moves = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.moves ?? []),
    ...(input.moves ?? [])
  ].map((record, index) => movementRecord(record, index, input, evidenceIds)));
  const drops = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.drops ?? []),
    ...(input.drops ?? []),
    ...dropsFromOwnershipRegions(input)
  ].map((record, index) => dropRecord(record, index, input, evidenceIds)));
  const unsafeBoundaries = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.unsafeBoundaries ?? []),
    ...(input.unsafeBoundaries ?? []),
    ...rustRecords.unsafeBoundaries
  ].map((record, index) => unsafeBoundaryRecord(record, index, input, evidenceIds)));
  const conflicts = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.conflicts ?? []),
    ...(input.conflicts ?? []),
    ...exclusiveAliasConflicts(loans, aliases),
    ...unsafeBoundaryConflicts(unsafeBoundaries)
  ].map((record, index) => conflictRecord(record, index, input, evidenceIds)));
  const proofObligations = uniqueRecordsById([
    ...graphs.flatMap((graph) => graph.proofObligations ?? []),
    ...(input.proofObligations ?? []),
    ...proofObligationsForUnsafeBoundaries(unsafeBoundaries)
  ].map((record, index) => proofObligationRecord(record, index, input, evidenceIds)));
  const summary = resourceGraphSummary({ resources, owners, loans, aliases, moves, drops, lifetimeRegions, unsafeBoundaries, conflicts, proofObligations });
  return {
    kind: 'frontier.lang.semanticResourceGraph',
    version: 1,
    id: input.id ?? `resource_graph_${idFragment(input.sourcePath ?? input.language ?? input.sourceLanguage ?? 'source')}`,
    sourceLanguage: input.sourceLanguage ?? input.language,
    sourcePath: input.sourcePath,
    sourceHash: input.sourceHash,
    status: resourceGraphStatus(summary),
    resources,
    owners,
    loans,
    aliases,
    moves,
    drops,
    lifetimeRegions,
    unsafeBoundaries,
    conflicts,
    proofObligations,
    evidenceIds,
    summary,
    query: {
      resourceIds: uniqueStrings(resources.map((record) => record.id)),
      ownerIds: uniqueStrings(owners.map((record) => record.id)),
      lifetimeRegionIds: uniqueStrings(lifetimeRegions.map((record) => record.id)),
      sourcePaths: uniqueStrings(allRecords({ resources, owners, loans, aliases, moves, drops, lifetimeRegions, unsafeBoundaries }).map((record) => record.sourcePath)),
      evidenceIds,
      blockerReasonCodes: summary.reasonCodes
    },
    claims: {
      borrowCheckerClaim: false,
      aliasSafetyClaim: false,
      lifetimeSoundnessClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Resource graph records ownership, aliasing, loans, moves, drops, lifetimes, and unsafe boundaries as evidence. It is not a borrow-checker proof by itself.',
      ...(input.metadata ?? {})
    }
  };
}

export function summarizeSemanticResourceGraph(graph = {}) {
  return resourceGraphSummary({
    resources: graph.resources ?? [],
    owners: graph.owners ?? [],
    loans: graph.loans ?? [],
    aliases: graph.aliases ?? [],
    moves: graph.moves ?? [],
    drops: graph.drops ?? [],
    lifetimeRegions: graph.lifetimeRegions ?? [],
    unsafeBoundaries: graph.unsafeBoundaries ?? [],
    conflicts: graph.conflicts ?? [],
    proofObligations: graph.proofObligations ?? []
  });
}

export function querySemanticResourceGraph(graph = {}, query = {}) {
  return allRecords(graph)
    .filter((record) => match(query.kind, record.recordKind))
    .filter((record) => match(query.resourceId, record.resourceId ?? record.id))
    .filter((record) => match(query.ownerId, record.ownerId))
    .filter((record) => match(query.lifetimeRegionId, record.lifetimeRegionId))
    .filter((record) => match(query.sourcePath, record.sourcePath))
    .filter((record) => match(query.status, record.status))
    .filter((record) => match(query.evidenceId, record.evidenceIds))
    .filter((record) => query.unsafe === undefined || Boolean(record.unsafeBoundary ?? record.recordKind === 'unsafe-boundary') === Boolean(query.unsafe));
}
