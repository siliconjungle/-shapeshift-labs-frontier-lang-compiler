import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';

function classifyImportExpansion(baseImport, variantImport) {
  if (baseImport.moduleSpecifier !== variantImport.moduleSpecifier
    || baseImport.typeOnly !== variantImport.typeOnly
    || baseImport.sideEffectOnly !== variantImport.sideEffectOnly) {
    return importShapeConflict('variant changes import module, type-only mode, or side-effect mode');
  }
  if (baseImport.sideEffectOnly) return { compatible: true };
  if (baseImport.defaultLocalName && variantImport.defaultLocalName !== baseImport.defaultLocalName) {
    return importShapeConflict('variant changes or removes an existing default import binding');
  }
  if (baseImport.namespaceLocalName && variantImport.namespaceLocalName !== baseImport.namespaceLocalName) {
    return importShapeConflict('variant changes or removes an existing namespace import binding');
  }
  if (variantImport.namespaceLocalName && variantImport.specifiers.length > 0) {
    return importShapeConflict('variant combines namespace and named import specifiers');
  }
  const variantSpecifiersByCanonical = new Set(variantImport.specifiers.map((specifier) => specifier.canonical));
  const missingBaseSpecifiers = baseImport.specifiers.filter((specifier) => !variantSpecifiersByCanonical.has(specifier.canonical));
  if (missingBaseSpecifiers.length) {
    return {
      compatible: false,
      code: JsTsSafeMergeConflictCodes.importSpecifierRemoved,
      gateId: JsTsSafeMergeGateIds.independentImportSpecifiers,
      message: 'variant removes import specifiers.',
      details: { missing: missingBaseSpecifiers.map((specifier) => specifier.canonical) }
    };
  }
  return {
    compatible: true,
    defaultAddition: !baseImport.defaultLocalName && variantImport.defaultLocalName
      ? importShapeAddition('default', variantImport.defaultLocalName, variantImport.typeOnly)
      : undefined,
    namespaceAddition: !baseImport.namespaceLocalName && variantImport.namespaceLocalName
      ? importShapeAddition('namespace', variantImport.namespaceLocalName, variantImport.typeOnly)
      : undefined
  };
}

function findCompatibleBaseImportEntry(variantEntry, baseEntries, usedBaseKeys = new Set()) {
  if (variantEntry?.kind !== 'import') return undefined;
  const candidates = [];
  for (const baseEntry of baseEntries) {
    if (usedBaseKeys.has(baseEntry.key) || baseEntry.kind !== 'import') continue;
    if (classifyImportExpansion(baseEntry.importInfo, variantEntry.importInfo).compatible) candidates.push(baseEntry);
  }
  return candidates.length === 1 ? candidates[0] : undefined;
}

function findSameImportTargetBaseEntry(variantEntry, baseEntries, usedBaseKeys = new Set()) {
  if (variantEntry?.kind !== 'import') return undefined;
  const candidates = [];
  for (const baseEntry of baseEntries) {
    if (usedBaseKeys.has(baseEntry.key) || baseEntry.kind !== 'import') continue;
    if (sameImportTarget(baseEntry.importInfo, variantEntry.importInfo)) candidates.push(baseEntry);
  }
  return candidates.length === 1 ? candidates[0] : undefined;
}

function findCompatibleVariantImportEntry(baseEntry, variantEntries, usedVariantKeys = new Set()) {
  if (baseEntry?.kind !== 'import') return undefined;
  const candidates = [];
  for (const variantEntry of variantEntries) {
    if (usedVariantKeys.has(variantEntry.key) || variantEntry.kind !== 'import') continue;
    if (classifyImportExpansion(baseEntry.importInfo, variantEntry.importInfo).compatible) candidates.push(variantEntry);
  }
  return candidates.length === 1 ? candidates[0] : undefined;
}

function sameImportTarget(left, right) {
  return left.moduleSpecifier === right.moduleSpecifier
    && left.typeOnly === right.typeOnly
    && left.sideEffectOnly === right.sideEffectOnly;
}

function importShapeConflict(reasonCode) {
  return {
    compatible: false,
    code: JsTsSafeMergeConflictCodes.importShapeChanged,
    gateId: JsTsSafeMergeGateIds.independentImportSpecifiers,
    message: 'variant changes an existing import shape instead of adding safe bindings.',
    details: { reasonCode }
  };
}

function importShapeAddition(kind, localName, typeOnly) {
  return {
    additionKind: kind,
    importedName: kind === 'default' ? 'default' : '*',
    localName,
    typeOnly,
    canonical: `${kind}:${localName}`
  };
}

export {
  classifyImportExpansion,
  findCompatibleBaseImportEntry,
  findSameImportTargetBaseEntry,
  findCompatibleVariantImportEntry
};
