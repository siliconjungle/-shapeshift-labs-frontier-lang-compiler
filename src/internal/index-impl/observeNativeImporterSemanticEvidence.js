import{semanticPredicateMatches}from'./semanticPredicateMatches.js';
export function observeNativeImporterSemanticEvidence(semanticIndex = {}) {
  const occurrences = semanticIndex?.occurrences ?? [];
  const relations = semanticIndex?.relations ?? [];
  const facts = semanticIndex?.facts ?? [];
  const symbols = semanticIndex?.symbols ?? [];
  const referenceRelations = relations.filter((relation) => semanticPredicateMatches(relation?.predicate, ['reference', 'call', 'read', 'write', 'use']));
  const typeFacts = facts.filter((fact) => semanticPredicateMatches(fact?.predicate, ['type', 'declaredtype', 'inferredtype', 'typeof']));
  const typedSymbols = symbols.filter((symbol) => Boolean(symbol?.declaredType ?? symbol?.inferredType ?? symbol?.typeId ?? symbol?.valueType));
  const controlFlowRecords = [
    ...relations.filter((relation) => semanticPredicateMatches(relation?.predicate, ['controlflow', 'cfg', 'flow'])),
    ...facts.filter((fact) => semanticPredicateMatches(fact?.predicate, ['controlflow', 'cfg', 'flow']))
  ];
  const effectRecords = facts.filter((fact) => semanticPredicateMatches(fact?.predicate, ['effect', 'mutation', 'sideeffect']));
  return {
    declarations: occurrences.filter((occurrence) => occurrence?.role === 'definition' || occurrence?.role === 'declaration').length,
    references: occurrences.filter((occurrence) => {
      const role = String(occurrence?.role ?? '').toLowerCase();
      return role && role !== 'definition' && role !== 'declaration';
    }).length + referenceRelations.length,
    types: typeFacts.length + typedSymbols.length,
    controlFlow: controlFlowRecords.length,
    effects: effectRecords.length
  };
}
