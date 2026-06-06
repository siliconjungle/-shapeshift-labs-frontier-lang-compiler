import{createSemanticIndexRecord}from'@shapeshift-labs/frontier-lang-kernel';
export function mergeSemanticIndexes(imports, input, idPart) {
  const indexes = imports.map((result) => result.semanticIndex ?? result.universalAst?.semanticIndex).filter(Boolean);
  if (!indexes.length) return undefined;
  return createSemanticIndexRecord({
    id: input.semanticIndexId ?? `index_${idPart}_project`,
    documents: indexes.flatMap((index) => index.documents ?? []),
    symbols: indexes.flatMap((index) => index.symbols ?? []),
    occurrences: indexes.flatMap((index) => index.occurrences ?? []),
    relations: indexes.flatMap((index) => index.relations ?? []),
    facts: indexes.flatMap((index) => index.facts ?? []),
    evidence: indexes.flatMap((index) => index.evidence ?? []),
    metadata: {
      projectRoot: input.projectRoot,
      sourceCount: imports.length,
      mergedIndexCount: indexes.length
    }
  });
}
