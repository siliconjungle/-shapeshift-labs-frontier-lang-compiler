import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';
import { addConflict, detectLineEnding, normalizeLineEndings } from './js-ts-safe-merge-context.js';
import { importSpecifierCanonical } from './js-ts-safe-merge-ledger.js';

export function createSourceMergePlan(base, worker, head, workerPlan, headPlan, context) {
  const edits = [];
  let importSpecifierAdditions = 0;
  for (const baseEntry of base.entries.filter((entry) => entry.kind === 'import')) {
    const workerAdditions = workerPlan.importAdditions.get(baseEntry.key) ?? [];
    const headAdditions = headPlan.importAdditions.get(baseEntry.key) ?? [];
    if (!workerAdditions.length && !headAdditions.length) continue;
    importSpecifierAdditions += workerAdditions.length + headAdditions.length;
    const headEntry = head.entries.find((entry) => entry.key === baseEntry.key);
    if (!headEntry) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.insertionAnchorMissing,
        gateId: JsTsSafeMergeGateIds.resolvedInsertionAnchors,
        side: 'head',
        message: 'Head source is missing a base import anchor.',
        details: { key: baseEntry.key }
      });
      continue;
    }
    edits.push({
      kind: 'replace-import',
      start: headEntry.start,
      end: headEntry.end,
      text: renderImportStatement(baseEntry.importInfo, [...baseEntry.importInfo.specifiers, ...workerAdditions, ...headAdditions])
    });
  }

  const insertionGroups = workerInsertionGroups(worker, workerPlan.baseKeys, context);
  const headEntriesByKey = new Map(head.entries.map((entry) => [entry.key, entry]));
  let topLevelDeclarationAdditions = 0;
  for (const group of insertionGroups) {
    const anchor = headEntriesByKey.get(group.anchorKey);
    if (!anchor) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.insertionAnchorMissing,
        gateId: JsTsSafeMergeGateIds.resolvedInsertionAnchors,
        side: 'head',
        message: 'Head source is missing a declaration insertion anchor.',
        details: { anchorKey: group.anchorKey, mode: group.mode }
      });
      continue;
    }
    const insertionOffset = group.mode === 'after'
      ? offsetAfterEntryLine(head.sourceText, anchor)
      : offsetBeforeEntryLine(head.sourceText, anchor);
    edits.push({
      kind: 'insert-declarations',
      start: insertionOffset,
      end: insertionOffset,
      text: declarationInsertionText(group.entries, detectLineEnding(head.sourceText))
    });
    topLevelDeclarationAdditions += group.entries.length;
  }

  return {
    edits,
    importSpecifierAdditions,
    topLevelDeclarationAdditions
  };
}

function workerInsertionGroups(worker, baseKeys, context) {
  const groups = [];
  let index = 0;
  while (index < worker.entries.length) {
    const entry = worker.entries[index];
    if (baseKeys.has(entry.key)) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < worker.entries.length && !baseKeys.has(worker.entries[index].key)) index += 1;
    const entries = worker.entries.slice(start, index);
    const previousBase = findPreviousBaseEntry(worker.entries, start, baseKeys);
    const nextBase = findNextBaseEntry(worker.entries, index, baseKeys);
    if (!previousBase && !nextBase) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.ambiguousInsertionPoint,
        gateId: JsTsSafeMergeGateIds.resolvedInsertionAnchors,
        side: 'worker',
        message: 'Worker additions have no stable base declaration or import anchor.',
        details: { entries: entries.map((item) => item.names?.[0] ?? item.key) }
      });
      continue;
    }
    groups.push(previousBase
      ? { mode: 'after', anchorKey: previousBase.key, entries }
      : { mode: 'before', anchorKey: nextBase.key, entries });
  }
  return groups;
}

function findPreviousBaseEntry(entries, startIndex, baseKeys) {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    if (baseKeys.has(entries[index].key)) return entries[index];
  }
  return undefined;
}

function findNextBaseEntry(entries, startIndex, baseKeys) {
  for (let index = startIndex; index < entries.length; index += 1) {
    if (baseKeys.has(entries[index].key)) return entries[index];
  }
  return undefined;
}

export function applySourceMergePlan(sourceText, mergePlan) {
  return [...mergePlan.edits]
    .sort((left, right) => right.start - left.start || right.end - left.end)
    .reduce((current, edit) => `${current.slice(0, edit.start)}${edit.text}${current.slice(edit.end)}`, sourceText);
}

function renderImportStatement(importInfo, specifiers) {
  const clause = [];
  if (importInfo.defaultLocalName) clause.push(importInfo.defaultLocalName);
  if (importInfo.namespaceLocalName) clause.push(`* as ${importInfo.namespaceLocalName}`);
  if (specifiers.length) clause.push(`{ ${specifiers.map(importSpecifierCanonical).join(', ')} }`);
  const importType = importInfo.typeOnly ? 'type ' : '';
  return `import ${importType}${clause.join(', ')} from ${importInfo.quote}${importInfo.moduleSpecifier}${importInfo.quote};`;
}

function declarationInsertionText(entries, lineEnding) {
  return entries
    .map((entry) => normalizeLineEndings(entry.text.trimEnd(), lineEnding))
    .map((text) => text.endsWith(lineEnding) ? text : `${text}${lineEnding}`)
    .join('');
}

function offsetAfterEntryLine(sourceText, entry) {
  const lineEnd = sourceText.indexOf('\n', entry.end);
  return lineEnd === -1 ? sourceText.length : lineEnd + 1;
}

function offsetBeforeEntryLine(sourceText, entry) {
  return sourceText.lastIndexOf('\n', Math.max(0, entry.start - 1)) + 1;
}
