import { JsTsSafeMergeConflictCodes } from './js-ts-safe-merge-constants.js';
import { sameStatementText } from './js-ts-safe-merge-context.js';
import { scanJsTsTopLevelLedger } from './js-ts-safe-merge-ledger.js';
import { uniqueStrings } from './native-import-utils.js';

function createIndependentTopLevelDeletionPlan(input, topLevelResult) {
  const originalReasonCodes = topLevelResult?.admission?.reasonCodes ?? [];
  if (!originalReasonCodes.includes(JsTsSafeMergeConflictCodes.topLevelOrderChanged)) {
    return { ok: false, reasonCodes: ['top-level-order-not-deletion-shaped'] };
  }
  const allowedOriginalReasonCodes = new Set([
    JsTsSafeMergeConflictCodes.topLevelOrderChanged,
    JsTsSafeMergeConflictCodes.changedExistingDeclaration,
    JsTsSafeMergeConflictCodes.typeAliasConflict
  ]);
  if (originalReasonCodes.some((reason) => !allowedOriginalReasonCodes.has(reason))) {
    return { ok: false, reasonCodes: ['top-level-deletion-has-unsafe-original-conflict'] };
  }
  if (typeof input.baseSourceText !== 'string'
    || typeof input.workerSourceText !== 'string'
    || typeof input.headSourceText !== 'string') {
    return { ok: false, reasonCodes: ['missing-source-text'] };
  }

  const context = quietDeletionLedgerContext(input);
  const base = scanJsTsTopLevelLedger(input.baseSourceText, 'base', context);
  const worker = scanJsTsTopLevelLedger(input.workerSourceText, 'worker', context);
  const head = scanJsTsTopLevelLedger(input.headSourceText, 'head', context);
  if (context.conflicts.length) {
    return { ok: false, reasonCodes: uniqueStrings(context.conflicts.map((conflict) => conflict.code)) };
  }

  const duplicateLedgerReason = firstDuplicateLedgerReason(base, worker, head);
  if (duplicateLedgerReason) return { ok: false, reasonCodes: [duplicateLedgerReason] };

  const baseByKey = entriesByKey(base.entries);
  const workerByKey = entriesByKey(worker.entries);
  const headByKey = entriesByKey(head.entries);
  const baseKeys = base.entries.map((entry) => entry.key);
  const missingWorkerBaseEntries = base.entries.filter((entry) => !workerByKey.has(entry.key));
  const deletedWorkerEntries = missingWorkerBaseEntries.filter((entry) => entry.kind !== 'import');
  const workerAddedEntries = worker.entries.filter((entry) => !baseByKey.has(entry.key));
  if (missingWorkerBaseEntries.length !== 1
    || deletedWorkerEntries.length !== 1
    || workerAddedEntries.length !== 0) {
    return { ok: false, reasonCodes: ['worker-top-level-deletion-not-isolated'] };
  }

  const deletedEntry = deletedWorkerEntries[0];
  if (deletedEntry.kind !== 'declaration' || deletedEntry.declarationInfo?.exported === true) {
    return { ok: false, reasonCodes: ['exported-or-unsupported-top-level-deletion'] };
  }
  if (isUnsupportedTopLevelDeletion(deletedEntry)) {
    return { ok: false, reasonCodes: ['unsupported-top-level-deletion-declaration'] };
  }

  const expectedWorkerKeys = base.entries
    .filter((entry) => entry.key !== deletedEntry.key)
    .map((entry) => entry.key);
  if (!sameStringList(worker.entries.map((entry) => entry.key), expectedWorkerKeys)) {
    return { ok: false, reasonCodes: ['worker-top-level-deletion-order-changed'] };
  }
  for (const baseEntry of base.entries) {
    if (baseEntry.key === deletedEntry.key) continue;
    const workerEntry = workerByKey.get(baseEntry.key);
    if (!workerEntry || !sameStatementText(workerEntry.text, baseEntry.text)) {
      return { ok: false, reasonCodes: [`worker-changed-nondeleted-entry:${baseEntry.key}`] };
    }
  }

  const headProjectedBaseKeys = head.entries
    .filter((entry) => baseByKey.has(entry.key))
    .map((entry) => entry.key);
  if (!sameStringList(headProjectedBaseKeys, baseKeys)) {
    return { ok: false, reasonCodes: ['head-base-order-or-presence-changed'] };
  }

  const headEntry = headByKey.get(deletedEntry.key);
  if (!headEntry) return { ok: false, reasonCodes: [`head-anchor-missing:${deletedEntry.key}`] };
  if (!sameStatementText(headEntry.text, deletedEntry.text)) {
    return { ok: false, reasonCodes: [`head-anchor-changed-since-base:${deletedEntry.key}`] };
  }

  const edit = deleteEntryEdit(input.headSourceText, headEntry);
  const deletedText = input.headSourceText.slice(edit.start, edit.end);
  const mergedSourceText = applySourceEdits(input.headSourceText, [edit]);
  return {
    ok: true,
    base,
    worker,
    head,
    deletedEntry,
    headEntry,
    edit,
    deletedText,
    mergedSourceText,
    summary: {
      key: deletedEntry.key,
      name: deletedEntry.names?.[0],
      declarationKind: deletedEntry.declarationInfo?.declarationKind,
      exported: false,
      reasonCodes: ['head-anchor-matches-base', 'independent-top-level-deletion']
    }
  };
}

function quietDeletionLedgerContext(input) {
  return {
    id: String(input.id ?? 'js_ts_safe_merge'),
    sourcePath: input.sourcePath,
    language: input.language ?? 'typescript',
    conflicts: [],
    blockedGateIds: new Set(),
    gateReasonCodes: new Map()
  };
}

function firstDuplicateLedgerReason(...ledgers) {
  for (const ledger of ledgers) {
    const seen = new Set();
    for (const entry of ledger.entries) {
      if (seen.has(entry.key)) return `duplicate-ledger-key:${ledger.label}:${entry.key}`;
      seen.add(entry.key);
    }
  }
  return undefined;
}

function entriesByKey(entries) {
  return new Map(entries.map((entry) => [entry.key, entry]));
}

function isUnsupportedTopLevelDeletion(entry) {
  if (entry.declarationInfo?.declarationKind === 'module') return true;
  return /^\s*(?:export\s+)?declare\b/.test(entry.text ?? '');
}

function sameStringList(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function deleteEntryEdit(sourceText, entry) {
  const lineEnd = sourceText.indexOf('\n', entry.end);
  const end = lineEnd === -1 ? entry.end : lineEnd + 1;
  const lineStart = sourceText.lastIndexOf('\n', Math.max(0, entry.start - 1)) + 1;
  const start = /^[\t ]*$/.test(sourceText.slice(lineStart, entry.start)) ? lineStart : entry.start;
  return { start, end, text: '' };
}

function applySourceEdits(sourceText, edits) {
  return [...edits]
    .sort((left, right) => right.start - left.start || right.end - left.end)
    .reduce((current, edit) => `${current.slice(0, edit.start)}${edit.text}${current.slice(edit.end)}`, sourceText);
}

export { createIndependentTopLevelDeletionPlan };
