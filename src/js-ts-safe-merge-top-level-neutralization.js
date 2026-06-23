import { findCompatibleBaseImportEntry, findSameImportTargetBaseEntry } from './js-ts-safe-merge-import-shape.js';
import { scanJsTsTopLevelLedger } from './js-ts-safe-merge-ledger.js';
import { sameStatementText } from './js-ts-safe-merge-context.js';

function neutralizeJsTsSafeTopLevelMergeSources(input = {}) {
  if (typeof input.baseSourceText !== 'string'
    || typeof input.workerSourceText !== 'string'
    || typeof input.headSourceText !== 'string') {
    return { ok: false, reasonCodes: ['missing-source-text'] };
  }

  const context = quietLedgerContext(input);
  const base = scanJsTsTopLevelLedger(input.baseSourceText, 'base', context);
  const worker = scanJsTsTopLevelLedger(input.workerSourceText, 'worker', context);
  const head = scanJsTsTopLevelLedger(input.headSourceText, 'head', context);
  if (context.conflicts.length) {
    return { ok: false, reasonCodes: context.conflicts.map((conflict) => conflict.code) };
  }

  const baseEntries = base.entries;
  const topLevelWorker = neutralizeChangedExistingDeclarations(input.workerSourceText, worker, baseEntries);
  const topLevelHead = neutralizeChangedExistingDeclarations(input.headSourceText, head, baseEntries);
  const semanticWorker = neutralizeSafeTopLevelAdditions(input.workerSourceText, worker, baseEntries);
  const semanticHead = neutralizeSafeTopLevelAdditions(input.headSourceText, head, baseEntries);

  return {
    ok: true,
    base,
    worker,
    head,
    baseSourceText: input.baseSourceText,
    topLevelWorkerSourceText: topLevelWorker.sourceText,
    topLevelHeadSourceText: topLevelHead.sourceText,
    semanticWorkerSourceText: semanticWorker.sourceText,
    semanticHeadSourceText: semanticHead.sourceText,
    summary: {
      workerChangedExistingDeclarations: topLevelWorker.changedExistingDeclarations,
      headChangedExistingDeclarations: topLevelHead.changedExistingDeclarations,
      workerNeutralizedSafeTopLevelChanges: semanticWorker.neutralizedSafeTopLevelChanges,
      headNeutralizedSafeTopLevelChanges: semanticHead.neutralizedSafeTopLevelChanges
    }
  };
}

function createJsTsChangedDeclarationReplay(input = {}, neutralization, currentSourceText) {
  if (!neutralization?.ok || typeof currentSourceText !== 'string') {
    return { ok: false, reasonCodes: ['missing-neutralized-current-source'], edits: [] };
  }
  const context = quietLedgerContext(input);
  const current = scanJsTsTopLevelLedger(currentSourceText, 'current', context);
  if (context.conflicts.length) {
    return { ok: false, reasonCodes: context.conflicts.map((conflict) => conflict.code), edits: [] };
  }

  const baseEntries = neutralization.base.entries;
  const workerMatches = matchedEntriesByBaseKey(neutralization.worker, baseEntries);
  const headMatches = matchedEntriesByBaseKey(neutralization.head, baseEntries);
  const currentMatches = matchedEntriesByBaseKey(current, baseEntries);
  const edits = [];
  const reasonCodes = [];
  for (const baseEntry of baseEntries) {
    if (baseEntry.kind === 'import') continue;
    const workerEntry = workerMatches.get(baseEntry.key);
    if (!workerEntry || sameStatementText(workerEntry.text, baseEntry.text)) continue;
    const headEntry = headMatches.get(baseEntry.key);
    const currentEntry = currentMatches.get(baseEntry.key);
    if (!headEntry || !sameStatementText(headEntry.text, baseEntry.text)) {
      reasonCodes.push(`head-anchor-changed-since-base:${baseEntry.key}`);
      continue;
    }
    if (!currentEntry || !sameStatementText(currentEntry.text, baseEntry.text)) {
      reasonCodes.push(`current-anchor-changed-since-base:${baseEntry.key}`);
      continue;
    }
    edits.push({
      key: baseEntry.key,
      names: workerEntry.names ?? baseEntry.names ?? [],
      declarationKind: workerEntry.declarationInfo?.declarationKind ?? baseEntry.declarationInfo?.declarationKind,
      start: currentEntry.start,
      end: currentEntry.end,
      currentText: currentEntry.text,
      replacementText: workerEntry.text
    });
  }
  return {
    ok: reasonCodes.length === 0,
    reasonCodes,
    edits,
    outputSourceText: reasonCodes.length ? undefined : applySourceEdits(
      currentSourceText,
      edits.map((edit) => ({ start: edit.start, end: edit.end, text: edit.replacementText }))
    )
  };
}

function neutralizeChangedExistingDeclarations(sourceText, ledger, baseEntries) {
  const usedBaseKeys = new Set();
  const edits = [];
  let changedExistingDeclarations = 0;
  for (const entry of ledger.entries) {
    const baseEntry = findBaseEntry(entry, baseEntries, usedBaseKeys);
    if (!baseEntry) continue;
    usedBaseKeys.add(baseEntry.key);
    if (entry.kind === 'import' || sameStatementText(entry.text, baseEntry.text)) continue;
    edits.push({ start: entry.start, end: entry.end, text: baseEntry.text });
    changedExistingDeclarations += 1;
  }
  return {
    sourceText: applySourceEdits(sourceText, edits),
    changedExistingDeclarations
  };
}

function neutralizeSafeTopLevelAdditions(sourceText, ledger, baseEntries) {
  const usedBaseKeys = new Set();
  const edits = [];
  let neutralizedSafeTopLevelChanges = 0;
  for (const entry of ledger.entries) {
    const baseEntry = findBaseEntry(entry, baseEntries, usedBaseKeys);
    if (!baseEntry) {
      edits.push(deleteEntryEdit(sourceText, entry));
      neutralizedSafeTopLevelChanges += 1;
      continue;
    }
    usedBaseKeys.add(baseEntry.key);
    if (entry.kind !== 'import' || sameStatementText(entry.text, baseEntry.text)) continue;
    edits.push({ start: entry.start, end: entry.end, text: baseEntry.text });
    neutralizedSafeTopLevelChanges += 1;
  }
  return {
    sourceText: applySourceEdits(sourceText, edits),
    neutralizedSafeTopLevelChanges
  };
}

function findBaseEntry(entry, baseEntries, usedBaseKeys) {
  if (!entry) return undefined;
  const direct = baseEntries.find((candidate) => candidate.key === entry.key && !usedBaseKeys.has(candidate.key));
  if (direct) return direct;
  return entry.kind === 'import'
    ? findCompatibleBaseImportEntry(entry, baseEntries, usedBaseKeys)
      ?? findSameImportTargetBaseEntry(entry, baseEntries, usedBaseKeys)
    : undefined;
}

function matchedEntriesByBaseKey(ledger, baseEntries) {
  const usedBaseKeys = new Set();
  const matches = new Map();
  for (const entry of ledger.entries) {
    const baseEntry = findBaseEntry(entry, baseEntries, usedBaseKeys);
    if (!baseEntry) continue;
    usedBaseKeys.add(baseEntry.key);
    matches.set(baseEntry.key, entry);
  }
  return matches;
}

function deleteEntryEdit(sourceText, entry) {
  const lineEnd = sourceText.indexOf('\n', entry.end);
  const end = lineEnd === -1 ? entry.end : lineEnd + 1;
  const lineStart = sourceText.lastIndexOf('\n', Math.max(0, entry.start - 1)) + 1;
  const start = onlyWhitespace(sourceText.slice(lineStart, entry.start)) ? lineStart : entry.start;
  return { start, end, text: '' };
}

function onlyWhitespace(text) {
  return /^[\t ]*$/.test(text);
}

function applySourceEdits(sourceText, edits) {
  return [...edits]
    .sort((left, right) => right.start - left.start || right.end - left.end)
    .reduce((current, edit) => `${current.slice(0, edit.start)}${edit.text}${current.slice(edit.end)}`, sourceText);
}

function quietLedgerContext(input) {
  return {
    id: String(input.id ?? 'js_ts_safe_merge'),
    sourcePath: input.sourcePath,
    language: input.language ?? 'typescript',
    conflicts: [],
    blockedGateIds: new Set(),
    gateReasonCodes: new Map()
  };
}

export {
  createJsTsChangedDeclarationReplay,
  neutralizeJsTsSafeTopLevelMergeSources
};
