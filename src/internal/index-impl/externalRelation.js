export function externalRelation(relation, context, index) {
  return {
    ...relation,
    id: relation.id ?? `rel_${context.idPart}_${index + 1}`,
    sourceId: relation.sourceId ?? relation.source_id ?? relation.subjectId ?? relation.subject_id ?? `external:${context.format}`,
    predicate: relation.predicate ?? relation.label ?? relation.kind ?? 'related',
    targetId: relation.targetId ?? relation.target_id ?? relation.objectId ?? relation.object_id ?? relation.symbol ?? `external:${context.format}`,
    metadata: { format: context.format, ...relation.metadata }
  };
}
