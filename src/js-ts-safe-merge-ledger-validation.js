import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';
import { addConflict } from './js-ts-safe-merge-context.js';

export function validateLedgerUniqueness(ledger, context) {
  const keyOwners = new Map();
  for (const entry of ledger.entries) {
    const existing = keyOwners.get(entry.key);
    if (existing) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.duplicateName,
        gateId: JsTsSafeMergeGateIds.uniqueNames,
        side: ledger.label,
        message: `${ledger.label} source has duplicate top-level ledger keys.`,
        details: { key: entry.key, firstOffset: existing.start, secondOffset: entry.start }
      });
    } else {
      keyOwners.set(entry.key, entry);
    }
  }

  const nameOwners = new Map();
  for (const entry of ledger.entries) {
    for (const name of entry.names ?? []) {
      const nameKey = `${entry.kind}:${name}`;
      const existing = nameOwners.get(nameKey);
      if (existing) {
        addConflict(context, {
          code: JsTsSafeMergeConflictCodes.duplicateName,
          gateId: JsTsSafeMergeGateIds.uniqueNames,
          side: ledger.label,
          message: `${ledger.label} source has duplicate top-level names.`,
          details: { name, firstOffset: existing.start, secondOffset: entry.start }
        });
      } else {
        nameOwners.set(nameKey, entry);
      }
    }
  }

  for (const entry of ledger.entries.filter((item) => item.kind === 'import')) {
    validateUniqueImportSpecifiers(entry, ledger.label, context);
  }
}

function validateUniqueImportSpecifiers(entry, side, context) {
  const localNames = new Map();
  const specifiers = [
    ...(entry.importInfo.defaultLocalName ? [{ localName: entry.importInfo.defaultLocalName, canonical: `default:${entry.importInfo.defaultLocalName}` }] : []),
    ...(entry.importInfo.namespaceLocalName ? [{ localName: entry.importInfo.namespaceLocalName, canonical: `namespace:${entry.importInfo.namespaceLocalName}` }] : []),
    ...entry.importInfo.specifiers
  ];
  for (const specifier of specifiers) {
    const existing = localNames.get(specifier.localName);
    if (existing) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.duplicateName,
        gateId: JsTsSafeMergeGateIds.uniqueNames,
        side,
        message: `${side} source has duplicate import binding names.`,
        details: { importKey: entry.key, localName: specifier.localName, first: existing.canonical, second: specifier.canonical }
      });
    } else {
      localNames.set(specifier.localName, specifier);
    }
  }
}

export function indexBaseLedger(base, context) {
  const entriesByKey = new Map();
  for (const entry of base.entries) entriesByKey.set(entry.key, entry);
  const names = new Set();
  for (const entry of base.entries) {
    for (const name of entry.names ?? []) {
      const nameKey = `${entry.kind}:${name}`;
      if (names.has(nameKey)) {
        addConflict(context, {
          code: JsTsSafeMergeConflictCodes.duplicateName,
          gateId: JsTsSafeMergeGateIds.uniqueNames,
          side: 'base',
          message: 'Base source has duplicate declaration or export names.',
          details: { name }
        });
      }
      names.add(nameKey);
    }
  }
  return {
    entriesByKey,
    orderedKeys: base.entries.map((entry) => entry.key),
    names
  };
}
