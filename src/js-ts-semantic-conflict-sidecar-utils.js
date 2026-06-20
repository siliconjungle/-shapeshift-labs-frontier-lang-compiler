import { uniqueStrings } from './native-import-utils.js';
import { deleteChangeKinds, modifyChangeKinds, riskRank, severityRank } from './js-ts-semantic-conflict-sidecar-constants.js';

export function changePairs(changes) {
  const pairs = [];
  for (let leftIndex = 0; leftIndex < changes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < changes.length; rightIndex += 1) {
      pairs.push([changes[leftIndex], changes[rightIndex]]);
    }
  }
  return pairs;
}

export function duplicateGroups(entries, keyFn) {
  const groups = new Map();
  for (const entry of entries) {
    const key = keyFn(entry);
    if (!key || /^(\|)+$/.test(key)) continue;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

export function dedupeSidecars(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = `${record.class}:${record.id}:${record.reasonCodes.join('|')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result.sort(compareSidecars);
}

function compareSidecars(left, right) {
  return (riskRank[right.risk] ?? 2) - (riskRank[left.risk] ?? 2)
    || (severityRank[right.severity] ?? 2) - (severityRank[left.severity] ?? 2)
    || String(left.class).localeCompare(String(right.class))
    || String(left.id).localeCompare(String(right.id));
}

export function mergeContext(input, options) {
  return {
    language: options.language ?? input.language ?? input.sourceLanguage ?? 'typescript',
    sourcePath: options.sourcePath ?? input.sourcePath ?? input.path,
    readiness: options.readiness ?? input.readiness,
    expectedSourceHash: firstString(
      options.expectedSourceHash,
      input.expectedSourceHash,
      input.expectedHash,
      input.sourceHashAssertions?.expectedSourceHash,
      input.sourceHashes?.expectedSourceHash
    ),
    currentSourceHash: firstString(
      options.currentSourceHash,
      input.currentSourceHash,
      input.actualSourceHash,
      input.sourceHashAssertions?.currentSourceHash,
      input.sourceHashes?.currentSourceHash
    )
  };
}

export function keysForChange(change) {
  return uniqueStrings([
    change.key,
    change.conflictKey,
    change.regionKey,
    change.semanticKey,
    change.anchorKey
  ]);
}

export function keysForAffected(entry) {
  return uniqueStrings([
    entry.key,
    entry.conflictKey,
    entry.regionKey,
    entry.semanticKey,
    entry.anchorKey,
    entry.containerKey,
    entry.id
  ]);
}

export function lossText(entry) {
  return [
    entry?.kind,
    entry?.code,
    entry?.reasonCode,
    ...(entry?.reasonCodes ?? []),
    entry?.message,
    entry?.summary,
    entry?.category,
    entry?.lossClass
  ].filter(Boolean).join(' ');
}

export function lossReasonCodes(entry) {
  return uniqueStrings([
    ...strings(entry?.reasonCode),
    ...strings(entry?.reasonCodes),
    entry?.code,
    entry?.kind
  ]);
}

export function classesFromRecords(records) {
  return records.map((record) => record.class);
}

export function summarySuggestedOutcome(records, readiness) {
  if (!records.length) return 'auto-merge-safe';
  const outcomes = uniqueStrings(records.map((record) => record.suggestedOutcome));
  if (readiness === 'blocked') return outcomes.includes('rerun-parser-and-ledger-before-merge')
    ? 'rerun-parser-and-ledger-before-merge'
    : 'manual-merge-required';
  return outcomes[0] ?? 'human-review';
}

export function highestSeverity(records) {
  const value = Math.max(0, ...records.map((record) => severityRank[record.severity] ?? 2));
  return Object.keys(severityRank).find((severity) => severityRank[severity] === value) ?? 'info';
}

export function highestRisk(records) {
  const value = Math.max(0, ...records.map((record) => riskRank[record.risk] ?? 2));
  return Object.keys(riskRank).find((risk) => riskRank[risk] === value) ?? 'low';
}

export function normalizeSeverity(value) {
  const severity = String(value ?? '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(severityRank, severity) ? severity : undefined;
}

export function normalizeRisk(value) {
  const risk = String(value ?? '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(riskRank, risk) ? risk : undefined;
}

export function normalizeChangeKind(value) {
  const text = String(value ?? 'modify').toLowerCase();
  if (text === 'removed') return 'delete';
  if (text === 'added') return 'insert';
  if (text === 'updated') return 'modify';
  return text;
}

export function isDeleteChange(change) {
  return deleteChangeKinds.test(change.changeKind);
}

export function isModifyChange(change) {
  return modifyChangeKinds.test(change.changeKind);
}

export function isInsertChange(change) {
  return /^(?:insert|add|create)$/i.test(change.changeKind);
}

export function numberValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return undefined;
}

export function numberOrUndefined(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function strings(value) {
  return array(value).flatMap((entry) => Array.isArray(entry) ? strings(entry) : [String(entry ?? '')]).filter(Boolean);
}

export function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}

export function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && entry !== ''));
}
