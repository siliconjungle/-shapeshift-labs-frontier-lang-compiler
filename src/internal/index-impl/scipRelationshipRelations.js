import{idFragment}from'../../native-import-utils.js';
import{normalizeArray}from'./normalizeArray.js';import{scipSymbolId}from'./scipSymbolId.js';
export function scipRelationshipRelations(symbolInfo, symbolId, context) {
  return normalizeArray(symbolInfo.relationships).flatMap((relationship, index) => {
    const targetId = scipSymbolId(relationship.symbol, context);
    if (!targetId) return [];
    const predicates = [];
    if (relationship.is_reference ?? relationship.isReference) predicates.push('references');
    if (relationship.is_implementation ?? relationship.isImplementation) predicates.push('implements');
    if (relationship.is_type_definition ?? relationship.isTypeDefinition) predicates.push('typeDefinition');
    if (relationship.is_definition ?? relationship.isDefinition) predicates.push('definitionOf');
    return (predicates.length ? predicates : ['related']).map((predicate) => ({
      id: `rel_${idFragment(symbolId)}_${idFragment(targetId)}_${idFragment(predicate)}_${index + 1}`,
      sourceId: symbolId,
      predicate,
      targetId,
      metadata: { format: 'scip', relationship }
    }));
  });
}
