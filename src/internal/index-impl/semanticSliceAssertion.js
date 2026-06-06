export function semanticSliceAssertion(id, ok, summary, metadata = {}) {
  return {
    id,
    status: ok ? 'passed' : 'failed',
    summary,
    metadata
  };
}
