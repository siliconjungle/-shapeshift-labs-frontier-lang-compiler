import{idFragment}from'../../native-import-utils.js';
import{normalizeArray}from'./normalizeArray.js';
export function scipSymbolFacts(symbolInfo, symbolId) {
  const facts = [];
  if (symbolInfo.documentation) {
    facts.push({
      id: `fact_${idFragment(symbolId)}_documentation`,
      predicate: 'documentation',
      subjectId: symbolId,
      value: normalizeArray(symbolInfo.documentation)
    });
  }
  const signature = symbolInfo.signature_documentation ?? symbolInfo.signatureDocumentation;
  if (signature) {
    facts.push({
      id: `fact_${idFragment(symbolId)}_signature`,
      predicate: 'signature',
      subjectId: symbolId,
      value: signature
    });
  }
  for (const [index, relationship] of normalizeArray(symbolInfo.relationships).entries()) {
    facts.push({
      id: `fact_${idFragment(symbolId)}_relationship_${index + 1}`,
      predicate: 'relationship',
      subjectId: symbolId,
      value: relationship
    });
  }
  return facts;
}
