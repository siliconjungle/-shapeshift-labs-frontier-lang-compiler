import{idFragment}from'../../native-import-utils.js';
export function semanticDbSymbolFacts(symbolInfo, symbolId) {
  const facts = [];
  for (const key of ['signature', 'properties', 'annotations', 'access', 'language']) {
    if (symbolInfo[key] !== undefined) {
      facts.push({
        id: `fact_${idFragment(symbolId)}_${idFragment(key)}`,
        predicate: key,
        subjectId: symbolId,
        value: symbolInfo[key]
      });
    }
  }
  return facts;
}
