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
      text: renderImportStatement(baseEntry.importInfo, mergedImportSpecifiers(baseEntry.importInfo.specifiers, workerAdditions, headAdditions))
    });
  }

  const insertionGroups = variantInsertionGroups(worker, workerPlan.baseKeys, 'worker', context);
  const headInsertionGroups = variantInsertionGroups(head, headPlan.baseKeys, 'head', context);
  const headInsertionGroupsByAnchor = new Map(headInsertionGroups.map((group) => [insertionGroupKey(group), group]));
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
    const headGroup = headInsertionGroupsByAnchor.get(insertionGroupKey(group));
    const insertionSpan = declarationInsertionSpan(head.sourceText, anchor, group.mode, headGroup);
    const entries = mergedDeclarationEntries(group.entries, headGroup?.entries ?? []);
    edits.push({
      kind: 'insert-declarations',
      start: insertionSpan.start,
      end: insertionSpan.end,
      text: declarationInsertionText(entries, detectLineEnding(head.sourceText))
    });
    topLevelDeclarationAdditions += group.entries.length;
  }

  return {
    edits,
    importSpecifierAdditions,
    topLevelDeclarationAdditions
  };
}

function variantInsertionGroups(variant, baseKeys, side, context) {
  const groups = [];
  let index = 0;
  while (index < variant.entries.length) {
    const entry = variant.entries[index];
    if (baseKeys.has(entry.key)) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < variant.entries.length && !baseKeys.has(variant.entries[index].key)) index += 1;
    const entries = variant.entries.slice(start, index);
    const previousBase = findPreviousBaseEntry(variant.entries, start, baseKeys);
    const nextBase = findNextBaseEntry(variant.entries, index, baseKeys);
    if (!previousBase && !nextBase) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.ambiguousInsertionPoint,
        gateId: JsTsSafeMergeGateIds.resolvedInsertionAnchors,
        side,
        message: `${side} additions have no stable base declaration or import anchor.`,
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

function insertionGroupKey(group) {
  return `${group.mode}:${group.anchorKey}`;
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

function mergedImportSpecifiers(baseSpecifiers, workerAdditions, headAdditions) {
  const seen = new Set(baseSpecifiers.map((specifier) => specifier.canonical));
  const additions = [];
  for (const specifier of [...workerAdditions, ...headAdditions]) {
    if (seen.has(specifier.canonical)) continue;
    seen.add(specifier.canonical);
    additions.push(specifier);
  }
  additions.sort((left, right) => left.canonical.localeCompare(right.canonical));
  return [...baseSpecifiers, ...additions];
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

function mergedDeclarationEntries(workerEntries, headEntries) {
  const entriesByKey = new Map();
  for (const entry of [...workerEntries, ...headEntries]) {
    const key = `${entry.kind}:${entry.key}:${entry.text.trim()}`;
    if (!entriesByKey.has(key)) entriesByKey.set(key, entry);
  }
  return [...entriesByKey.values()].sort((left, right) => {
    const keyOrder = left.key.localeCompare(right.key);
    if (keyOrder !== 0) return keyOrder;
    return left.text.trim().localeCompare(right.text.trim());
  });
}

function declarationInsertionSpan(sourceText, anchor, mode, headGroup) {
  if (!headGroup?.entries.length) {
    const offset = mode === 'after'
      ? offsetAfterEntryLine(sourceText, anchor)
      : offsetBeforeEntryLine(sourceText, anchor);
    return { start: offset, end: offset };
  }
  if (mode === 'after') {
    return {
      start: offsetAfterEntryLine(sourceText, anchor),
      end: offsetAfterEntryLine(sourceText, headGroup.entries[headGroup.entries.length - 1])
    };
  }
  return {
    start: offsetBeforeEntryLine(sourceText, headGroup.entries[0]),
    end: offsetBeforeEntryLine(sourceText, anchor)
  };
}

function offsetAfterEntryLine(sourceText, entry) {
  const lineEnd = sourceText.indexOf('\n', entry.end);
  return lineEnd === -1 ? sourceText.length : lineEnd + 1;
}

function offsetBeforeEntryLine(sourceText, entry) {
  return sourceText.lastIndexOf('\n', Math.max(0, entry.start - 1)) + 1;
}
