import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings as uniqueRawStrings } from '../../native-import-utils.js';
import { createSemanticAnchor, createSemanticLineageEvent } from './semanticLineageRecords.js';

export const SemanticLineageResolutionStatuses = Object.freeze(['unchanged', 'resolved', 'ambiguous', 'deleted', 'recreated', 'cycle', 'max-depth', 'not-found']);

export function resolveSemanticLineage(eventsOrMap = [], query = {}, options = {}) {
  const events = lineageEventsFrom(eventsOrMap);
  const resolutionQuery = normalizeResolutionQuery(query);
  const start = createSemanticAnchor(resolutionQuery.anchor ?? resolutionQuery.anchorKey ?? resolutionQuery.key ?? resolutionQuery, resolutionQuery);
  const maxDepth = positiveInteger(resolutionQuery.maxDepth ?? options.maxDepth, 64);
  const byFromKey = new Map();
  const byFromId = new Map();
  for (const event of events.slice().sort(compareLineageEvents)) {
    indexLineageEvent(byFromKey, event.from?.key, event);
    indexLineageEvent(byFromId, event.from?.id, event);
  }
  const state = createResolutionState(start);
  const visitedEvents = new Set();
  const visitedStates = new Set([anchorStateKey(state.current)]);
  for (let depth = 0; depth < maxDepth; depth += 1) {
    const nextEvents = nextLineageEvents(state.current, byFromKey, byFromId).filter((event) => !visitedEvents.has(event.id));
    if (nextEvents.length === 0) break;
    for (const event of nextEvents) applyLineageEvent(state, event, visitedEvents);
    const key = anchorStateKey(state.current);
    if (visitedStates.has(key) && key) {
      state.cycle = true;
      state.status = 'cycle';
      state.reasonCodes.push('lineage-cycle');
      break;
    }
    visitedStates.add(key);
  }
  if (resolutionHitMaxDepth(state, maxDepth, byFromKey, byFromId, visitedEvents)) {
    state.maxDepthHit = true;
    state.status = 'max-depth';
    state.reasonCodes.push('max-depth');
  }
  if (!state.cycle && !state.maxDepthHit) {
    state.status = classifyResolutionStatus(state);
    if (state.status === 'ambiguous' && state.terminal.length > 0 && state.current.length > 0) {
      state.reasonCodes.push('inactive-anchor-has-active-candidates');
    }
  }
  return buildResolutionRecord(state, start, maxDepth, resolutionQuery, options);
}

export function resolveSemanticLineageBatch(eventsOrMap = [], queries = [], options = {}) {
  return array(queries).map((query) => resolveSemanticLineage(eventsOrMap, query, options));
}

function createResolutionState(start) {
  return {
    current: start ? [start] : [],
    traversed: [],
    terminal: [],
    sourcePaths: strings(start?.sourcePath),
    conflictKeys: [],
    evidenceIds: [],
    proofIds: [],
    operationIds: [],
    heads: [],
    eventKinds: [],
    reasonCodes: [],
    confidence: start ? 1 : undefined,
    status: start ? 'unchanged' : 'not-found',
    cycle: false,
    maxDepthHit: false
  };
}

function buildResolutionRecord(state, start, maxDepth, query, options) {
  const currentAnchors = uniqueAnchors(state.current).map((anchor) => anchorWithLineageLinks(anchor, state, start, query));
  const core = {
    kind: 'frontier.lang.semanticLineageResolution',
    version: 1,
    query: compactRecord({ anchorKey: start?.key, anchorId: start?.id, sourcePath: start?.sourcePath, symbolName: start?.symbolName, maxDepth }),
    startAnchor: start,
    currentAnchors,
    traversedEventIds: uniqueStrings(state.traversed),
    terminalEventIds: uniqueStrings(state.terminal),
    sourcePaths: lineageSourcePaths(state, start, query, currentAnchors),
    status: state.status,
    confidence: clampConfidence(state.confidence),
    conflictKeys: uniqueStrings(state.conflictKeys),
    evidenceIds: uniqueStrings(state.evidenceIds),
    proofIds: uniqueStrings(state.proofIds),
    crdtOperationIds: uniqueStrings(state.operationIds),
    crdtHeads: uniqueStrings(state.heads),
    lineageEventKinds: uniqueStrings(state.eventKinds),
    reasonCodes: uniqueStrings(state.reasonCodes),
    metadata: compactRecord(options.metadata ?? query.metadata)
  };
  const hash = hashSemanticValue(core);
  return {
    ...core,
    id: options.id ?? query.id ?? `semantic_lineage_resolution_${idFragment(firstString(start?.key, start?.id, hash))}`,
    stableId: `semantic_lineage_resolution_${idFragment(hash)}`,
    hash,
    generatedAt: options.generatedAt ?? query.generatedAt ?? Date.now()
  };
}

function applyLineageEvent(state, event, visitedEvents) {
  visitedEvents.add(event.id);
  state.traversed.push(event.id);
  state.conflictKeys.push(...(event.conflictKeys ?? []));
  state.evidenceIds.push(...(event.evidenceIds ?? []));
  state.proofIds.push(...(event.proofIds ?? []));
  state.operationIds.push(event.crdt?.operationId);
  state.heads.push(...(event.crdt?.heads ?? []));
  state.eventKinds.push(event.eventKind);
  state.reasonCodes.push(...lineageEventReasonCodes(event));
  state.sourcePaths.push(event.from?.sourcePath, ...event.to.map((anchor) => anchor.sourcePath));
  if (event.confidence !== undefined) state.confidence = state.confidence === undefined ? event.confidence : Math.min(state.confidence, event.confidence);
  const matched = state.current.filter((anchor) => anchorsMatch(anchor, event.from));
  const unmatched = state.current.filter((anchor) => !anchorsMatch(anchor, event.from));
  if (event.eventKind === 'deleted' || event.to.length === 0) {
    state.current = unmatched;
    state.terminal.push(event.id);
    state.reasonCodes.push(event.eventKind === 'deleted' ? 'anchor-deleted' : 'lineage-event-without-target-anchor');
    return;
  }
  state.current = uniqueAnchors([...unmatched, ...event.to]);
  if (matched.length === 0) state.reasonCodes.push('lineage-event-applied-by-index');
  if (event.eventKind === 'split' || event.to.length > 1) state.reasonCodes.push('anchor-split');
  if (event.eventKind === 'merged') state.reasonCodes.push('anchor-merged');
  if (event.eventKind === 'recreated') state.reasonCodes.push('anchor-recreated');
}

function lineageEventsFrom(value) {
  const source = value?.kind === 'frontier.lang.semanticLineageMap' ? value.events : value;
  return array(source).map((event) => event?.kind === 'frontier.lang.semanticLineageEvent' ? event : createSemanticLineageEvent(event)).filter(Boolean);
}

function resolutionHitMaxDepth(state, maxDepth, byFromKey, byFromId, visitedEvents) {
  return !state.cycle && state.traversed.length >= maxDepth && nextLineageEvents(state.current, byFromKey, byFromId).some((event) => !visitedEvents.has(event.id));
}

function nextLineageEvents(anchors, byFromKey, byFromId) {
  const records = [];
  for (const anchor of anchors) {
    for (const event of byFromKey.get(String(anchor.key ?? '')) ?? []) records.push(event);
    for (const event of byFromId.get(String(anchor.id ?? '')) ?? []) records.push(event);
  }
  return uniqueEvents(records).sort(compareLineageEvents);
}

function classifyResolutionStatus(state) {
  if (state.current.length === 0 && state.traversed.length > 0) return 'deleted';
  if (state.terminal.length > 0 && state.current.length > 0) return 'ambiguous';
  if (state.eventKinds.includes('recreated')) return 'recreated';
  if (state.current.length > 1 || state.eventKinds.includes('split') || state.eventKinds.includes('merged')) return 'ambiguous';
  if (state.traversed.length > 0) return 'resolved';
  return 'unchanged';
}

function indexLineageEvent(index, key, event) {
  if (!key) return;
  const value = String(key);
  if (!index.has(value)) index.set(value, []);
  index.get(value).push(event);
}

function normalizeResolutionQuery(query) { return typeof query === 'string' ? { anchorKey: query } : query ?? {}; }
function anchorsMatch(left, right) { return Boolean(left && right && ((left.key && left.key === right.key) || (left.id && left.id === right.id))); }
function anchorStateKey(anchors) { return uniqueStrings(anchors.map((anchor) => anchor.key ?? anchor.id)).sort().join('|'); }
function compareLineageEvents(left, right) { return compareCreatedAt(left.createdAt, right.createdAt) || String(left.id).localeCompare(String(right.id)); }
function compareCreatedAt(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) return leftNumber - rightNumber;
  return String(left ?? '').localeCompare(String(right ?? ''));
}
function uniqueAnchors(anchors) {
  const seen = new Set();
  return anchors.filter(Boolean).filter((anchor) => {
    const key = anchor.key ?? anchor.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function uniqueEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    if (!event?.id || seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}
function anchorWithLineageLinks(anchor, state, start, query) {
  return compactRecord({
    ...anchor,
    lineageEventIds: uniqueStrings(state.traversed),
    terminalLineageEventIds: uniqueStrings(state.terminal),
    lineageSourcePaths: lineageSourcePaths(state, start, query, [anchor]),
    evidenceIds: uniqueStrings(state.evidenceIds),
    proofIds: uniqueStrings(state.proofIds),
    crdtOperationIds: uniqueStrings(state.operationIds),
    crdtHeads: uniqueStrings(state.heads),
    lineageEventKinds: uniqueStrings(state.eventKinds),
    lineageReasonCodes: uniqueStrings(state.reasonCodes)
  });
}
function lineageSourcePaths(state, start, query, anchors = []) {
  return uniqueStrings([
    query?.sourcePath,
    start?.sourcePath,
    ...state.sourcePaths,
    ...array(anchors).map((anchor) => anchor?.sourcePath),
    ...array(anchors).flatMap((anchor) => anchor?.lineageSourcePaths ?? [])
  ]);
}
function lineageEventReasonCodes(event) {
  return uniqueStrings([
    ...array(event.reasonCodes),
    ...array(event.metadata?.reasonCodes),
    event.evidence?.signatureHashMatch ? 'signature-hash-match' : undefined,
    event.evidence?.bodyHashMatch ? 'body-hash-match' : undefined,
    event.evidence?.pathMatch ? 'source-path-match' : undefined,
    event.evidence?.sourceSpanMoved ? 'source-span-moved' : undefined
  ]);
}
function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}
function clampConfidence(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  return Math.max(0, Math.min(1, number));
}
function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function uniqueStrings(values) { return uniqueRawStrings(strings(values)); }
function firstString(...values) { return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
