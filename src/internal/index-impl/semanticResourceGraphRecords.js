import { idFragment, uniqueStrings } from '../../native-import-utils.js';

export function resourceRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'resource',
    id: record.id ?? `resource_${idFragment(record.name ?? record.resourceKind ?? index)}`,
    name: record.name,
    resourceKind: record.resourceKind ?? record.kind ?? 'resource',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function ownerRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'owner',
    id: record.id ?? `owner_${idFragment(record.name ?? index)}`,
    ownerKind: record.ownerKind ?? record.kind ?? 'owner',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function lifetimeRegionRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'lifetime-region',
    id: record.id ?? `lifetime_${idFragment(record.name ?? index)}`,
    lifetimeKind: record.lifetimeKind ?? record.kind ?? 'lexical',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function loanRecord(record, index, input, evidenceIds) {
  const mode = normalizeLoanMode(record.mode ?? record.loanMode ?? record.kind);
  return compactRecord({
    ...record,
    recordKind: 'loan',
    id: record.id ?? `loan_${idFragment(record.resourceId ?? index)}_${idFragment(record.ownerId ?? mode)}`,
    mode,
    access: record.access ?? loanAccess(mode),
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function aliasRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'alias',
    id: record.id ?? `alias_${idFragment(record.resourceId ?? index)}_${idFragment(record.ownerId ?? record.aliasId ?? 'alias')}`,
    aliasKind: record.aliasKind ?? record.kind ?? 'alias',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function movementRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'move',
    id: record.id ?? `move_${idFragment(record.resourceId ?? index)}_${idFragment(record.fromOwnerId ?? 'from')}_${idFragment(record.toOwnerId ?? 'to')}`,
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function dropRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'drop',
    id: record.id ?? `drop_${idFragment(record.resourceId ?? index)}`,
    dropKind: record.dropKind ?? record.kind ?? 'drop',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function escapeRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'escape',
    id: record.id ?? `escape_${idFragment(record.resourceId ?? record.ownerId ?? record.name ?? index)}`,
    escapeKind: record.escapeKind ?? record.kind ?? 'escape',
    status: record.status ?? 'needs-proof',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function unsafeBoundaryRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'unsafe-boundary',
    id: record.id ?? `unsafe_${idFragment(record.resourceId ?? record.name ?? index)}`,
    unsafeBoundary: true,
    proofStatus: record.proofStatus ?? record.status ?? 'missing',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function conflictRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'conflict',
    id: record.id ?? `conflict_${idFragment(record.resourceId ?? record.reasonCode ?? index)}`,
    status: record.status ?? 'blocked',
    severity: record.severity ?? 'error',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function proofObligationRecord(record, index, input, evidenceIds) {
  return compactRecord({
    ...record,
    recordKind: 'proof-obligation',
    id: record.id ?? `resource_proof_${idFragment(record.resourceId ?? record.kind ?? index)}`,
    status: record.status ?? 'open',
    sourcePath: record.sourcePath ?? input.sourcePath,
    sourceHash: record.sourceHash ?? input.sourceHash,
    evidenceIds: uniqueStrings([...(record.evidenceIds ?? []), ...evidenceIds])
  });
}

export function exclusiveAliasConflicts(loans, aliases) {
  const aliasesByResource = new Map();
  for (const alias of aliases) {
    if (!alias.resourceId) continue;
    const list = aliasesByResource.get(alias.resourceId) ?? [];
    list.push(alias);
    aliasesByResource.set(alias.resourceId, list);
  }
  return loans
    .filter((loan) => ['mutable', 'exclusive', 'move'].includes(loan.mode))
    .flatMap((loan) => (aliasesByResource.get(loan.resourceId) ?? []).map((alias) => ({
      id: `conflict_${idFragment(loan.id)}_${idFragment(alias.id)}`,
      resourceId: loan.resourceId,
      ownerId: loan.ownerId,
      aliasId: alias.id,
      loanId: loan.id,
      reasonCode: 'exclusive-resource-alias-requires-proof',
      message: 'Exclusive or mutable resource loan overlaps an alias; admission needs alias/lifetime proof.',
      sourcePath: loan.sourcePath ?? alias.sourcePath,
      sourceHash: loan.sourceHash ?? alias.sourceHash,
      evidenceIds: uniqueStrings([...(loan.evidenceIds ?? []), ...(alias.evidenceIds ?? [])])
    })));
}

export function unsafeBoundaryConflicts(unsafeBoundaries) {
  return unsafeBoundaries
    .filter((boundary) => !['proved', 'discharged', 'passed', 'trusted'].includes(String(boundary.proofStatus ?? boundary.status ?? '').toLowerCase()))
    .map((boundary) => ({
      id: `conflict_${idFragment(boundary.id)}_unsafe_proof_missing`,
      resourceId: boundary.resourceId,
      unsafeBoundaryId: boundary.id,
      reasonCode: 'unsafe-resource-boundary-requires-proof',
      message: 'Unsafe resource boundary needs source-bound alias/lifetime proof before merge admission.',
      sourcePath: boundary.sourcePath,
      sourceHash: boundary.sourceHash,
      evidenceIds: boundary.evidenceIds
    }));
}

export function proofObligationsForUnsafeBoundaries(unsafeBoundaries) {
  return unsafeBoundaryConflicts(unsafeBoundaries).map((conflict) => ({
    id: `proof_${idFragment(conflict.unsafeBoundaryId)}_alias_lifetime`,
    kind: 'unsafeAliasLifetimeProof',
    status: 'open',
    resourceId: conflict.resourceId,
    conflictId: conflict.id,
    statement: 'Provide external evidence that the unsafe boundary preserves aliasing and lifetime invariants.',
    sourcePath: conflict.sourcePath,
    sourceHash: conflict.sourceHash,
    evidenceIds: conflict.evidenceIds
  }));
}

export function resourceGraphSummary(input) {
  const reasonCodes = uniqueStrings([
    ...(input.resources.length ? [] : ['missing-resource-records']),
    ...(input.loans.length || input.aliases.length || input.moves.length || input.drops.length ? [] : ['missing-alias-loan-move-drop-records']),
    ...(input.lifetimeRegions.length ? [] : ['missing-lifetime-region-records']),
    ...(input.escapes.length ? ['escape-proof-review-required'] : []),
    ...(input.unsafeBoundaries.length ? ['unsafe-boundary-review-required'] : []),
    ...input.conflicts.map((record) => record.reasonCode)
  ]);
  return {
    records: allRecords(input).length,
    resources: input.resources.length,
    owners: input.owners.length,
    loans: input.loans.length,
    aliases: input.aliases.length,
    moves: input.moves.length,
    drops: input.drops.length,
    escapes: input.escapes.length,
    lifetimeRegions: input.lifetimeRegions.length,
    unsafeBoundaries: input.unsafeBoundaries.length,
    conflicts: input.conflicts.length,
    proofObligations: input.proofObligations.length,
    unsafeBoundariesWithoutProof: unsafeBoundaryConflicts(input.unsafeBoundaries).length,
    reasonCodes
  };
}

export function resourceGraphStatus(summary) {
  if (summary.records === 0) return 'missing';
  if (summary.conflicts > 0 || summary.unsafeBoundariesWithoutProof > 0) return 'blocked';
  return 'partial';
}

export function allRecords(input) {
  return [
    ...(input.resources ?? []),
    ...(input.owners ?? []),
    ...(input.loans ?? []),
    ...(input.aliases ?? []),
    ...(input.moves ?? []),
    ...(input.drops ?? []),
    ...(input.escapes ?? []),
    ...(input.lifetimeRegions ?? []),
    ...(input.unsafeBoundaries ?? []),
    ...(input.conflicts ?? []),
    ...(input.proofObligations ?? [])
  ];
}

export function match(filter, value) {
  if (filter === undefined) return true;
  const filters = Array.isArray(filter) ? filter : [filter];
  const values = Array.isArray(value) ? value : [value];
  const valueSet = new Set(values.filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}

function normalizeLoanMode(value) {
  const mode = String(value ?? 'unknown').toLowerCase();
  if (['shared', 'read', 'immutable', 'borrow'].includes(mode)) return 'shared';
  if (['mutable', 'write', 'mut', 'mut-borrow'].includes(mode)) return 'mutable';
  if (['exclusive', 'unique'].includes(mode)) return 'exclusive';
  if (['move', 'moved'].includes(mode)) return 'move';
  if (['raw', 'unsafe', 'pointer'].includes(mode)) return 'raw';
  return 'unknown';
}

function loanAccess(mode) {
  if (mode === 'shared') return 'read';
  if (mode === 'mutable' || mode === 'exclusive') return 'write';
  return mode;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
