import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';
import { addConflict, detectLineEnding, normalizeLineEndings } from './js-ts-safe-merge-context.js';
import { findCompatibleVariantImportEntry } from './js-ts-safe-merge-import-shape.js';
import { importSpecifierCanonical } from './js-ts-safe-merge-ledger.js';

export function createSourceMergePlan(base, worker, head, workerPlan, headPlan, context) {
  const edits = [];
  let importSpecifierAdditions = 0;
  let importDeclarationAdditions = 0;
  const headEntriesByBaseKey = variantEntriesByBaseKey(head, headPlan);
  const usedHeadImportKeys = new Set();
  for (const baseEntry of base.entries.filter((entry) => entry.kind === 'import')) {
    const workerAdditions = workerPlan.importAdditions.get(baseEntry.key) ?? [];
    const headAdditions = headPlan.importAdditions.get(baseEntry.key) ?? [];
    if (!workerAdditions.length && !headAdditions.length) continue;
    importSpecifierAdditions += workerAdditions.length + headAdditions.length;
    const headEntry = headEntriesByBaseKey.get(baseEntry.key)
      ?? findCompatibleVariantImportEntry(baseEntry, head.entries, usedHeadImportKeys);
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
    usedHeadImportKeys.add(headEntry.key);
    const importInfo = mergedImportInfo(baseEntry.importInfo, workerAdditions, headAdditions);
    edits.push({
      kind: 'replace-import',
      start: headEntry.start,
      end: headEntry.end,
      text: renderImportStatement(importInfo, importInfo.specifiers)
    });
  }

  const importInsertionGroups = variantInsertionGroups(worker, workerPlan.matchedVariantKeys, 'worker', context, {
    baseKeyByVariantKey: workerPlan.baseKeyByVariantKey,
    includeEntry: (entry) => entry.kind === 'import',
    label: 'import'
  });
  const headImportInsertionGroups = variantInsertionGroups(head, headPlan.matchedVariantKeys, 'head', context, {
    baseKeyByVariantKey: headPlan.baseKeyByVariantKey,
    includeEntry: (entry) => entry.kind === 'import',
    label: 'import'
  });
  const headImportGroupsByAnchor = new Map(headImportInsertionGroups.map((group) => [insertionGroupKey(group), group]));
  const countedImportInsertionGroups = new Set();
  for (const group of importInsertionGroups) {
    countedImportInsertionGroups.add(insertionGroupKey(group));
    const anchor = headEntriesByBaseKey.get(group.anchorKey);
    if (!anchor) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.insertionAnchorMissing,
        gateId: JsTsSafeMergeGateIds.resolvedInsertionAnchors,
        side: 'head',
        message: 'Head source is missing an import insertion anchor.',
        details: { anchorKey: group.anchorKey, mode: group.mode }
      });
      continue;
    }
    const headGroup = headImportGroupsByAnchor.get(insertionGroupKey(group));
    const insertionSpan = declarationInsertionSpan(head.sourceText, anchor, group.mode, headGroup);
    const entries = mergedImportEntries(group.entries, headGroup?.entries ?? []);
    edits.push({
      kind: 'insert-imports',
      start: insertionSpan.start,
      end: insertionSpan.end,
      text: importInsertionText(entries, detectLineEnding(head.sourceText))
    });
    importDeclarationAdditions += entries.length;
  }
  for (const group of headImportInsertionGroups) {
    if (!countedImportInsertionGroups.has(insertionGroupKey(group))) importDeclarationAdditions += group.entries.length;
  }

  const insertionGroups = variantInsertionGroups(worker, workerPlan.matchedVariantKeys, 'worker', context, {
    baseKeyByVariantKey: workerPlan.baseKeyByVariantKey,
    includeEntry: (entry) => entry.kind !== 'import',
    label: 'declaration'
  });
  const headInsertionGroups = variantInsertionGroups(head, headPlan.matchedVariantKeys, 'head', context, {
    baseKeyByVariantKey: headPlan.baseKeyByVariantKey,
    includeEntry: (entry) => entry.kind !== 'import',
    label: 'declaration'
  });
  const headDeclarationGroupsByAnchor = new Map(headInsertionGroups.map((group) => [insertionGroupKey(group), group]));
  let topLevelDeclarationAdditions = 0;
  const countedDeclarationInsertionGroups = new Set();
  for (const group of insertionGroups) {
    countedDeclarationInsertionGroups.add(insertionGroupKey(group));
    const anchor = headEntriesByBaseKey.get(group.anchorKey);
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
    const headGroup = headDeclarationGroupsByAnchor.get(insertionGroupKey(group));
    const insertionSpan = declarationInsertionSpan(head.sourceText, anchor, group.mode, headGroup);
    const entries = mergedDeclarationEntries(group.entries, headGroup?.entries ?? []);
    edits.push({
      kind: 'insert-declarations',
      start: insertionSpan.start,
      end: insertionSpan.end,
      text: declarationInsertionText(entries, detectLineEnding(head.sourceText))
    });
    topLevelDeclarationAdditions += entries.length;
  }
  for (const group of headInsertionGroups) {
    if (!countedDeclarationInsertionGroups.has(insertionGroupKey(group))) topLevelDeclarationAdditions += group.entries.length;
  }

  return {
    edits,
    importSpecifierAdditions,
    importDeclarationAdditions,
    topLevelDeclarationAdditions
  };
}

function variantInsertionGroups(variant, baseKeys, side, context, options = {}) {
  const includeEntry = options.includeEntry ?? (() => true);
  const baseKeyByVariantKey = options.baseKeyByVariantKey ?? new Map();
  const groups = [];
  let index = 0;
  while (index < variant.entries.length) {
    const entry = variant.entries[index];
    if (baseKeys.has(entry.key) || !includeEntry(entry)) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < variant.entries.length && !baseKeys.has(variant.entries[index].key) && includeEntry(variant.entries[index])) index += 1;
    const entries = variant.entries.slice(start, index);
    const previousBase = findPreviousBaseEntry(variant.entries, start, baseKeys);
    const nextBase = findNextBaseEntry(variant.entries, index, baseKeys);
    if (!previousBase && !nextBase) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.ambiguousInsertionPoint,
        gateId: JsTsSafeMergeGateIds.resolvedInsertionAnchors,
        side,
        message: `${side} ${options.label ?? 'additions'} additions have no stable base declaration or import anchor.`,
        details: { entries: entries.map((item) => item.names?.[0] ?? item.key) }
      });
      continue;
    }
    groups.push(previousBase
      ? { mode: 'after', anchorKey: baseKeyForVariantEntry(previousBase, baseKeyByVariantKey), entries }
      : { mode: 'before', anchorKey: baseKeyForVariantEntry(nextBase, baseKeyByVariantKey), entries });
  }
  return groups;
}

function variantEntriesByBaseKey(variant, plan) {
  const entriesByKey = new Map(variant.entries.map((entry) => [entry.key, entry]));
  const entriesByBaseKey = new Map();
  for (const [variantKey, baseKey] of plan.baseKeyByVariantKey ?? []) {
    const entry = entriesByKey.get(variantKey);
    if (entry) entriesByBaseKey.set(baseKey, entry);
  }
  return entriesByBaseKey;
}

function baseKeyForVariantEntry(entry, baseKeyByVariantKey) {
  return baseKeyByVariantKey.get(entry.key) ?? entry.key;
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
  for (const specifier of [...workerAdditions, ...headAdditions].filter((addition) => !addition.additionKind)) {
    if (seen.has(specifier.canonical)) continue;
    seen.add(specifier.canonical);
    additions.push(specifier);
  }
  additions.sort((left, right) => left.canonical.localeCompare(right.canonical));
  return [...baseSpecifiers, ...additions];
}

function mergedImportInfo(baseImportInfo, workerAdditions, headAdditions) {
  const additions = [...workerAdditions, ...headAdditions];
  const defaultAddition = additions.find((addition) => addition.additionKind === 'default');
  const namespaceAddition = additions.find((addition) => addition.additionKind === 'namespace');
  return {
    ...baseImportInfo,
    defaultLocalName: baseImportInfo.defaultLocalName ?? defaultAddition?.localName,
    namespaceLocalName: baseImportInfo.namespaceLocalName ?? namespaceAddition?.localName,
    specifiers: mergedImportSpecifiers(baseImportInfo.specifiers, workerAdditions, headAdditions)
  };
}

function renderImportStatement(importInfo, specifiers) {
  if (importInfo.sideEffectOnly) return `import ${importInfo.quote}${importInfo.moduleSpecifier}${importInfo.quote};`;
  const clause = [];
  if (importInfo.defaultLocalName) clause.push(importInfo.defaultLocalName);
  if (importInfo.namespaceLocalName) clause.push(`* as ${importInfo.namespaceLocalName}`);
  if (specifiers.length) clause.push(`{ ${specifiers.map((specifier) => renderImportSpecifier(specifier, importInfo)).join(', ')} }`);
  const importType = importInfo.typeOnly ? 'type ' : '';
  return `import ${importType}${clause.join(', ')} from ${importInfo.quote}${importInfo.moduleSpecifier}${importInfo.quote};`;
}

const renderImportSpecifier = (specifier, importInfo) => importSpecifierCanonical(importInfo.typeOnly ? { ...specifier, typeOnly: false } : specifier);

function importInsertionText(entries, lineEnding) {
  return entries
    .map((entry) => normalizeLineEndings(entry.text.trimEnd(), lineEnding))
    .map((text) => text.endsWith(lineEnding) ? text : `${text}${lineEnding}`)
    .join('');
}

function mergedImportEntries(workerEntries, headEntries) {
  const entriesByKey = new Map();
  for (const entry of [...headEntries, ...workerEntries]) {
    const existing = entriesByKey.get(entry.key);
    if (!existing) {
      entriesByKey.set(entry.key, { ...entry, importInfo: { ...entry.importInfo, specifiers: [...entry.importInfo.specifiers] } });
      continue;
    }
    existing.importInfo.specifiers = mergedNewImportSpecifiers(existing.importInfo.specifiers, entry.importInfo.specifiers);
    existing.text = renderImportStatement(existing.importInfo, existing.importInfo.specifiers);
  }
  return [...entriesByKey.values()].sort(compareImportEntries);
}

function mergedNewImportSpecifiers(left, right) {
  const byCanonical = new Map();
  for (const specifier of [...left, ...right]) byCanonical.set(specifier.canonical, specifier);
  return [...byCanonical.values()].sort((a, b) => a.canonical.localeCompare(b.canonical));
}

function compareImportEntries(left, right) {
  const moduleOrder = left.importInfo.moduleSpecifier.localeCompare(right.importInfo.moduleSpecifier);
  if (moduleOrder !== 0) return moduleOrder;
  const typeOrder = Number(Boolean(left.importInfo.typeOnly)) - Number(Boolean(right.importInfo.typeOnly));
  if (typeOrder !== 0) return typeOrder;
  return left.key.localeCompare(right.key);
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
