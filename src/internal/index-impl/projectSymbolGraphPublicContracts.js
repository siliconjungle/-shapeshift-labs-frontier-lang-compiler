import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';

export function publicContractRegionRecord(value, fact, symbol) {
  const record = {
    ...value,
    factId: fact.id,
    symbolId: fact.subjectId,
    apiSurfaceKind: value.apiSurfaceKind ?? apiSurfaceKind(value, symbol),
    signatureHash: value.signatureHash ?? symbol?.signatureHash
  };
  return compactRecord({
    ...record,
    contractHash: value.contractHash ?? publicContractHash(record)
  });
}

function apiSurfaceKind(region, symbol) {
  if (region.edgeKind === 're-export') return 'module-re-export';
  if (region.edgeKind === 'export') return 'module-export';
  if (symbol?.kind === 'export') return 'named-export';
  return region.symbolKind ?? symbol?.kind ?? region.regionKind;
}

function publicContractHash(region) {
  return hashSemanticValue({
    kind: 'frontier.lang.publicContractRegionHash',
    sourceHash: region.sourceHash,
    symbolId: region.symbolId,
    symbolName: region.symbolName,
    symbolKind: region.symbolKind,
    signatureHash: region.signatureHash,
    moduleSpecifier: region.moduleSpecifier,
    exportedName: region.exportedName,
    edgeKind: region.edgeKind,
    apiSurfaceKind: region.apiSurfaceKind
  });
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
