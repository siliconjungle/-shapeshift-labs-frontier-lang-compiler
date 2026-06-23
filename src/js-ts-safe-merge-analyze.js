import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';
import { addConflict, arraysEqual, sameStatementText } from './js-ts-safe-merge-context.js';
import { validateCrossSideExportStarAdditions } from './js-ts-safe-merge-export-star-validation.js';

export function analyzeVariantLedger(base, variant, baseIndex, side, context) {
  const projectedBaseKeys = [];
  const addedEntries = [];
  const importAdditions = new Map();
  const baseKeys = new Set(baseIndex.orderedKeys);

  for (const entry of variant.entries) {
    const baseEntry = baseIndex.entriesByKey.get(entry.key);
    if (!baseEntry) {
      if (entry.kind === 'import') {
        addConflict(context, {
          code: JsTsSafeMergeConflictCodes.newImportDeclaration,
          gateId: JsTsSafeMergeGateIds.independentImportSpecifiers,
          side,
          message: `${side} source adds a new import declaration; only specifier additions to existing imports are accepted.`,
          details: { key: entry.key, statement: entry.text.trim() }
        });
      } else {
        addedEntries.push(entry);
      }
      continue;
    }
    projectedBaseKeys.push(entry.key);
    if (entry.kind !== baseEntry.kind) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.parserLedgerLoss,
        gateId: JsTsSafeMergeGateIds.parseLedger,
        side,
        message: `${side} source changes a base ledger entry kind.`,
        details: { key: entry.key, baseKind: baseEntry.kind, sideKind: entry.kind }
      });
      continue;
    }
    if (entry.kind === 'import') {
      const additions = analyzeImportStatementChange(baseEntry, entry, side, context);
      if (additions.length) importAdditions.set(entry.key, additions);
    } else if (!sameStatementText(baseEntry.text, entry.text)) {
      const typeAliasConflict = baseEntry.declarationInfo?.declarationKind === 'type'
        || entry.declarationInfo?.declarationKind === 'type';
      addConflict(context, {
        code: typeAliasConflict ? JsTsSafeMergeConflictCodes.typeAliasConflict : JsTsSafeMergeConflictCodes.changedExistingDeclaration,
        gateId: JsTsSafeMergeGateIds.stableExistingDeclarations,
        side,
        message: typeAliasConflict
          ? `${side} source changes an existing type alias body.`
          : `${side} source changes an existing top-level declaration or export body.`,
        details: { key: entry.key, name: entry.names?.[0], declarationKind: entry.declarationInfo?.declarationKind }
      });
    }
  }

  if (!arraysEqual(projectedBaseKeys, baseIndex.orderedKeys)) {
    const code = base.entries.some((entry) => entry.kind === 'import' && entry.importInfo.sideEffectOnly)
      ? JsTsSafeMergeConflictCodes.sideEffectImportReorder
      : JsTsSafeMergeConflictCodes.topLevelOrderChanged;
    addConflict(context, {
      code,
      gateId: JsTsSafeMergeGateIds.preserveBaseOrder,
      side,
      message: `${side} source changes the order or presence of base top-level entries.`,
      details: {
        expected: baseIndex.orderedKeys,
        actual: projectedBaseKeys
      }
    });
  }

  return {
    side,
    addedEntries,
    importAdditions,
    baseKeys
  };
}

function analyzeImportStatementChange(baseEntry, variantEntry, side, context) {
  const baseImport = baseEntry.importInfo;
  const variantImport = variantEntry.importInfo;
  if (!sameImportShape(baseImport, variantImport)) {
    addConflict(context, {
      code: baseImport.sideEffectOnly ? JsTsSafeMergeConflictCodes.sideEffectImportReorder : JsTsSafeMergeConflictCodes.importShapeChanged,
      gateId: JsTsSafeMergeGateIds.independentImportSpecifiers,
      side,
      message: `${side} source changes an existing import shape instead of adding named specifiers.`,
      details: { key: baseEntry.key }
    });
    return [];
  }
  if (baseImport.sideEffectOnly) {
    if (!sameStatementText(baseEntry.text, variantEntry.text)) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.sideEffectImportReorder,
        gateId: JsTsSafeMergeGateIds.preserveBaseOrder,
        side,
        message: `${side} source changes a side-effect import.`,
        details: { key: baseEntry.key }
      });
    }
    return [];
  }

  const baseSpecifiers = baseImport.specifiers;
  const variantSpecifiers = variantImport.specifiers;
  if (variantSpecifiers.length < baseSpecifiers.length) {
    addConflict(context, {
      code: JsTsSafeMergeConflictCodes.importSpecifierRemoved,
      gateId: JsTsSafeMergeGateIds.independentImportSpecifiers,
      side,
      message: `${side} source removes import specifiers.`,
      details: { key: baseEntry.key }
    });
    return [];
  }
  for (let index = 0; index < baseSpecifiers.length; index += 1) {
    if (variantSpecifiers[index]?.canonical !== baseSpecifiers[index].canonical) {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.importSpecifierReordered,
        gateId: JsTsSafeMergeGateIds.independentImportSpecifiers,
        side,
        message: `${side} source reorders or changes existing import specifiers.`,
        details: {
          key: baseEntry.key,
          expected: baseSpecifiers.map((specifier) => specifier.canonical),
          actual: variantSpecifiers.map((specifier) => specifier.canonical)
        }
      });
      return [];
    }
  }
  const additions = variantSpecifiers.slice(baseSpecifiers.length);
  if (additions.length === 0 && !sameStatementText(baseEntry.text, variantEntry.text)) {
    addConflict(context, {
      code: JsTsSafeMergeConflictCodes.importFormattingChanged,
      gateId: JsTsSafeMergeGateIds.independentImportSpecifiers,
      side,
      message: `${side} source changes import formatting without a specifier addition.`,
      details: { key: baseEntry.key }
    });
  }
  return additions;
}

function sameImportShape(left, right) {
  return left.moduleSpecifier === right.moduleSpecifier
    && left.typeOnly === right.typeOnly
    && left.sideEffectOnly === right.sideEffectOnly
    && left.defaultLocalName === right.defaultLocalName
    && left.namespaceLocalName === right.namespaceLocalName;
}

export function validateIndependentAdditions(base, workerPlan, headPlan, context) {
  const declarationNames = new Set();
  for (const entry of base.entries.filter((item) => item.kind !== 'import')) {
    for (const name of entry.names ?? []) declarationNames.add(`${entry.kind}:${name}`);
  }
  validateAddedEntryNames(workerPlan, declarationNames, context);
  validateAddedEntryNames(headPlan, declarationNames, context);
  validateCrossSideAddedNames(workerPlan, headPlan, context);
  validateCrossSideExportStarAdditions(workerPlan, headPlan, context);
  validateCrossSideImportAdditions(workerPlan, headPlan, context);
  validateMergedImportAndDeclarationNames(base, workerPlan, headPlan, context);
}

function validateAddedEntryNames(plan, baseNames, context) {
  for (const entry of plan.addedEntries) {
    if (entry.kind !== 'declaration' && entry.kind !== 'export') {
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.parserLedgerLoss,
        gateId: JsTsSafeMergeGateIds.independentTopLevelDeclarations,
        side: plan.side,
        message: `${plan.side} source adds an unsupported top-level entry.`,
        details: { kind: entry.kind, statement: entry.text.trim() }
      });
      continue;
    }
    for (const name of entry.names ?? []) {
      const nameKey = `${entry.kind}:${name}`;
      if (baseNames.has(nameKey)) {
        addConflict(context, {
          code: JsTsSafeMergeConflictCodes.duplicateName,
          gateId: JsTsSafeMergeGateIds.uniqueNames,
          side: plan.side,
          message: `${plan.side} source adds a duplicate top-level name.`,
          details: { name, kind: entry.kind }
        });
      }
    }
  }
}

function validateCrossSideAddedNames(workerPlan, headPlan, context) {
  const headEntriesByName = new Map();
  for (const entry of headPlan.addedEntries) {
    for (const name of entry.names ?? []) headEntriesByName.set(`${entry.kind}:${name}`, entry);
  }
  for (const entry of workerPlan.addedEntries) {
    for (const name of entry.names ?? []) {
      const nameKey = `${entry.kind}:${name}`;
      const headEntry = headEntriesByName.get(nameKey);
      if (headEntry) {
        if (shouldDeferReExportNameConflict(entry, headEntry, context)) continue;
        const typeAliasConflict = entry.declarationInfo?.declarationKind === 'type'
          || headEntry.declarationInfo?.declarationKind === 'type';
        addConflict(context, {
          code: typeAliasConflict ? JsTsSafeMergeConflictCodes.typeAliasConflict : JsTsSafeMergeConflictCodes.duplicateName,
          gateId: JsTsSafeMergeGateIds.uniqueNames,
          side: 'worker',
          message: typeAliasConflict
            ? 'Worker and head add conflicting type aliases.'
            : 'Worker and head add the same top-level name.',
          details: { name, kind: entry.kind, workerDeclarationKind: entry.declarationInfo?.declarationKind, headDeclarationKind: headEntry.declarationInfo?.declarationKind }
        });
      }
    }
  }
}

function shouldDeferReExportNameConflict(left, right, context) {
  return context.deferReExportIdentityConflictsToProjectGraph === true
    && isReExportEntry(left)
    && isReExportEntry(right);
}

function isReExportEntry(entry) {
  return entry?.kind === 'export' && entry.declarationInfo?.reExport === true;
}

function validateCrossSideImportAdditions(workerPlan, headPlan, context) {
  for (const [key, workerAdditions] of workerPlan.importAdditions) {
    const headAdditions = headPlan.importAdditions.get(key) ?? [];
    const headLocalNames = new Set(headAdditions.map((specifier) => specifier.localName));
    const headImportedNames = new Set(headAdditions.map((specifier) => `${specifier.typeOnly ? 'type:' : 'value:'}${specifier.importedName}`));
    for (const specifier of workerAdditions) {
      if (headLocalNames.has(specifier.localName) || headImportedNames.has(`${specifier.typeOnly ? 'type:' : 'value:'}${specifier.importedName}`)) {
        addConflict(context, {
          code: JsTsSafeMergeConflictCodes.duplicateName,
          gateId: JsTsSafeMergeGateIds.uniqueNames,
          side: 'worker',
          message: 'Worker and head add duplicate import specifiers.',
          details: { key, specifier: specifier.canonical }
        });
      }
    }
  }
}

function validateMergedImportAndDeclarationNames(base, workerPlan, headPlan, context) {
  const topLevelBindingNames = new Set();
  for (const entry of base.entries.filter((item) => item.kind !== 'import')) {
    for (const name of entry.names ?? []) topLevelBindingNames.add(name);
  }
  for (const plan of [workerPlan, headPlan]) {
    for (const entry of plan.addedEntries.filter((item) => item.kind !== 'import')) {
      for (const name of entry.names ?? []) topLevelBindingNames.add(name);
    }
  }
  const importLocalNames = new Set();
  for (const entry of base.entries.filter((item) => item.kind === 'import')) {
    const additions = [
      ...(workerPlan.importAdditions.get(entry.key) ?? []),
      ...(headPlan.importAdditions.get(entry.key) ?? [])
    ];
    for (const specifier of [
      ...(entry.importInfo.defaultLocalName ? [{ localName: entry.importInfo.defaultLocalName, canonical: `default:${entry.importInfo.defaultLocalName}` }] : []),
      ...(entry.importInfo.namespaceLocalName ? [{ localName: entry.importInfo.namespaceLocalName, canonical: `namespace:${entry.importInfo.namespaceLocalName}` }] : []),
      ...entry.importInfo.specifiers,
      ...additions
    ]) {
      if (importLocalNames.has(specifier.localName)) {
        addConflict(context, {
          code: JsTsSafeMergeConflictCodes.duplicateName,
          gateId: JsTsSafeMergeGateIds.uniqueNames,
          message: 'Merged imports would contain duplicate local names.',
          details: { localName: specifier.localName, specifier: specifier.canonical }
        });
      }
      if (topLevelBindingNames.has(specifier.localName)) {
        addConflict(context, {
          code: JsTsSafeMergeConflictCodes.duplicateName,
          gateId: JsTsSafeMergeGateIds.uniqueNames,
          message: 'Merged imports would duplicate a top-level declaration name.',
          details: { localName: specifier.localName, specifier: specifier.canonical }
        });
      }
      importLocalNames.add(specifier.localName);
    }
  }
}
