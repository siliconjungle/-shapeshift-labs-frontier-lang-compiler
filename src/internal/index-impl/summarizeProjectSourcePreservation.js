export function summarizeProjectSourcePreservation(imports) {
  const records = imports
    .map((result) => result.metadata?.sourcePreservation ?? result.nativeSource?.metadata?.sourcePreservation ?? result.nativeAst?.metadata?.sourcePreservation)
    .filter(Boolean);
  return {
    total: records.length,
    exactSourceAvailable: records.filter((record) => record.summary?.exactSourceAvailable).length,
    sourceBytes: records.reduce((sum, record) => sum + (record.sourceBytes ?? 0), 0),
    tokens: records.reduce((sum, record) => sum + (record.summary?.tokens ?? record.tokens?.length ?? 0), 0),
    trivia: records.reduce((sum, record) => sum + (record.summary?.trivia ?? record.trivia?.length ?? 0), 0),
    directives: records.reduce((sum, record) => sum + (record.summary?.directives ?? record.directives?.length ?? 0), 0),
    truncated: records.some((record) => record.summary?.truncated === true),
    ids: records.map((record) => record.id).filter(Boolean)
  };
}
