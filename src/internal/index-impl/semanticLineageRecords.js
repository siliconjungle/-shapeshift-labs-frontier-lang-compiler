import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings as uniqueRawStrings } from '../../native-import-utils.js';

export const SemanticLineageEventKinds = Object.freeze(['unchanged', 'moved', 'renamed', 'split', 'merged', 'deleted', 'recreated', 'unknown']);

export function createSemanticAnchor(input = {}, defaults = {}) {
  const source = typeof input === 'string' ? { key: input } : input;
  const semanticPath = array(source.semanticPath ?? source.pathSegments).map((part) => String(part));
  const key = firstString(source.key, source.ownershipKey, source.conflictKey, source.semanticKey, semanticPath.join('.'), source.symbolName, source.id);
  const anchor = compactRecord({
    id: source.id ?? (key ? `semantic_anchor_${idFragment(key)}` : undefined),
    key,
    kind: source.kind ?? source.anchorKind ?? source.regionKind ?? source.symbolKind,
    language: source.language ?? defaults.language,
    sourcePath: source.sourcePath ?? defaults.sourcePath,
    sourceHash: source.sourceHash ?? source.hash ?? defaults.sourceHash,
    symbolId: source.symbolId,
    symbolName: source.symbolName ?? source.name,
    semanticPath,
    signatureHash: source.signatureHash,
    bodyHash: source.bodyHash,
    sourceSpan: source.sourceSpan ?? source.span,
    metadata: source.metadata
  });
  return nonEmptyRecord(anchor);
}

export function createSemanticLineageEvent(input = {}, options = {}) {
  const from = createSemanticAnchor(input.from ?? input.fromAnchor ?? input.before, input);
  const toAnchors = array(input.to ?? input.toAnchors ?? input.after).map((anchor) => createSemanticAnchor(anchor, input)).filter(Boolean);
  const eventKind = normalizeEventKind(input.eventKind ?? input.event ?? input.kind);
  const actor = normalizeActor(input.actor ?? options.actor ?? {
    id: input.actorId ?? options.actorId,
    role: input.actorRole ?? options.actorRole
  });
  const explicitCrdt = input.crdt ?? input.clock ?? input.operation;
  const crdt = normalizeCrdtClock(explicitCrdt ?? (hasInlineCrdtClock(input) ? input : undefined), {
    useIdAsOperationId: explicitCrdt !== undefined
  });
  const evidence = compactRecord({
    pathMatch: input.evidence?.pathMatch ?? input.pathMatch,
    signatureHashMatch: input.evidence?.signatureHashMatch ?? input.signatureHashMatch,
    bodyHashMatch: input.evidence?.bodyHashMatch ?? input.bodyHashMatch,
    syntaxShapeMatch: input.evidence?.syntaxShapeMatch ?? input.syntaxShapeMatch,
    sourceSpanMoved: input.evidence?.sourceSpanMoved ?? input.sourceSpanMoved,
    confidence: input.evidence?.confidence ?? input.confidence,
    command: input.evidence?.command ?? input.command
  });
  const core = {
    kind: 'frontier.lang.semanticLineageEvent',
    version: 1,
    eventKind,
    from,
    to: toAnchors,
    confidence: clampConfidence(input.confidence),
    actor,
    crdt,
    evidence,
    evidenceIds: uniqueStrings([...(strings(input.evidenceIds)), ...(array(input.evidence)).map((entry) => entry?.id)]),
    proofIds: uniqueStrings([...(strings(input.proofIds)), ...(array(input.proofs)).map((entry) => entry?.id)]),
    conflictKeys: uniqueStrings([
      ...(strings(input.conflictKeys)),
      input.conflictKey,
      from?.key,
      ...toAnchors.map((anchor) => anchor.key)
    ]),
    metadata: compactRecord(input.metadata)
  };
  const hash = input.hash ?? hashSemanticValue(core);
  return {
    ...core,
    id: input.id ?? options.id ?? `semantic_lineage_${idFragment(firstString(from?.key, toAnchors[0]?.key, crdt?.operationId, hash))}`,
    stableId: `semantic_lineage_${idFragment(hash)}`,
    hash,
    createdAt: input.createdAt ?? options.createdAt ?? Date.now()
  };
}

export function createSemanticLineageMap(events = [], options = {}) {
  const records = array(events).map((event) => event?.kind === 'frontier.lang.semanticLineageEvent' ? event : createSemanticLineageEvent(event, options));
  const byAnchorKey = {};
  const byEventKind = {};
  const byOperationId = {};
  const bySourcePath = {};
  for (const event of records) {
    indexPush(byEventKind, event.eventKind, event.id);
    indexPush(byOperationId, event.crdt?.operationId, event.id);
    for (const anchor of [event.from, ...event.to].filter(Boolean)) {
      indexPush(byAnchorKey, anchor.key, event.id);
      indexPush(bySourcePath, anchor.sourcePath, event.id);
    }
  }
  return {
    kind: 'frontier.lang.semanticLineageMap',
    version: 1,
    id: options.id ?? `semantic_lineage_map_${idFragment(hashSemanticValue(records.map((event) => event.id)))}`,
    generatedAt: options.generatedAt ?? Date.now(),
    events: records,
    byAnchorKey,
    byEventKind,
    byOperationId,
    bySourcePath,
    summary: {
      eventCount: records.length,
      anchorCount: Object.keys(byAnchorKey).length,
      operationCount: Object.keys(byOperationId).length,
      eventKinds: Object.keys(byEventKind)
    }
  };
}

export function querySemanticLineageEvents(events, query = {}) {
  return array(events).filter((event) => {
    const record = event?.kind === 'frontier.lang.semanticLineageEvent' ? event : createSemanticLineageEvent(event);
    const anchors = [record.from, ...record.to].filter(Boolean);
    return matchAny(query.eventKind, [record.eventKind])
      && matchAny(query.anchorKey, anchors.map((anchor) => anchor.key))
      && matchAny(query.fromKey, [record.from?.key])
      && matchAny(query.toKey, record.to.map((anchor) => anchor.key))
      && matchAny(query.sourcePath, anchors.map((anchor) => anchor.sourcePath))
      && matchAny(query.operationId, [record.crdt?.operationId])
      && matchAny(query.head, record.crdt?.heads)
      && matchAny(query.conflictKey, record.conflictKeys)
      && matchAny(query.evidenceId, record.evidenceIds);
  });
}

export function semanticLineageIndex(events) {
  const records = array(events).filter(Boolean);
  const anchors = records.flatMap((event) => [event.from, ...(event.to ?? [])]).filter(Boolean);
  return {
    lineageEventIds: uniqueStrings(records.map((event) => event.id)),
    semanticAnchorIds: uniqueStrings(anchors.map((anchor) => anchor.id)),
    semanticAnchorKeys: uniqueStrings(anchors.map((anchor) => anchor.key)),
    semanticLineageKinds: uniqueStrings(records.map((event) => event.eventKind)),
    crdtOperationIds: uniqueStrings(records.map((event) => event.crdt?.operationId)),
    crdtHeads: uniqueStrings(records.flatMap((event) => event.crdt?.heads ?? []))
  };
}

function hasInlineCrdtClock(source) {
  return source?.operationId !== undefined
    || source?.seq !== undefined
    || source?.deps !== undefined
    || source?.heads !== undefined
    || source?.stateVector !== undefined
    || source?.versionFrame !== undefined
    || source?.frame !== undefined;
}

function normalizeCrdtClock(source, options = {}) {
  if (!source) return undefined;
  return nonEmptyRecord(compactRecord({
    operationId: source.operationId ?? (options.useIdAsOperationId ? source.id : undefined),
    actor: source.actorId ?? source.actor,
    seq: source.seq,
    deps: uniqueStrings(source.deps),
    heads: uniqueStrings(source.heads),
    stateVector: source.stateVector,
    versionFrame: source.versionFrame ?? source.frame
  }));
}

function normalizeActor(value) {
  const actor = typeof value === 'string' ? { id: value } : value;
  return nonEmptyRecord(compactRecord({
    id: actor?.id ?? actor?.actorId,
    role: actor?.role,
    lane: actor?.lane,
    taskId: actor?.taskId,
    runId: actor?.runId,
    metadata: actor?.metadata
  }));
}

function normalizeEventKind(kind) {
  const text = String(kind ?? 'unknown');
  return SemanticLineageEventKinds.includes(text) ? text : text;
}

function clampConfidence(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  return Math.max(0, Math.min(1, number));
}

function indexPush(index, key, id) {
  if (!key || !id) return;
  const value = String(key);
  if (!index[value]) index[value] = [];
  if (!index[value].includes(id)) index[value].push(id);
}

function matchAny(queryValue, values) {
  const queries = strings(queryValue);
  if (queries.length === 0) return true;
  const valueSet = new Set(strings(values));
  return queries.some((query) => valueSet.has(query));
}

function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function uniqueStrings(values) { return uniqueRawStrings(strings(values)); }
function firstString(...values) { return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
function nonEmptyRecord(value) { return Object.keys(value ?? {}).length ? value : undefined; }
