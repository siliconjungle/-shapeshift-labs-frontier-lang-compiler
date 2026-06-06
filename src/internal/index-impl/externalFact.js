export function externalFact(fact, context, index) {
  return {
    ...fact,
    id: fact.id ?? `fact_${context.idPart}_${index + 1}`,
    predicate: fact.predicate ?? fact.kind ?? 'externalFact',
    subjectId: fact.subjectId ?? fact.subject_id ?? fact.symbolId ?? fact.symbol_id ?? `external:${context.format}`,
    value: fact.value ?? fact.data ?? fact,
    metadata: { format: context.format, ...fact.metadata }
  };
}
