export function serializableIncludeGraphSummary(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) return { edgeCount: value.length };
  const summary = {};
  if (typeof value.hash === 'string') summary.hash = value.hash;
  if (typeof value.root === 'string') summary.root = value.root;
  if (Array.isArray(value.edges)) summary.edgeCount = value.edges.length;
  if (Array.isArray(value.includes)) summary.includeCount = value.includes.length;
  return Object.keys(summary).length ? summary : { present: true };
}
