export function javaPathEvidenceSummary(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return { entryCount: value.length };
  if (typeof value === 'string') return { entryCount: value.split(/[:;]/).filter(Boolean).length };
  if (typeof value === 'object') {
    const summary = {};
    if (typeof value.hash === 'string') summary.hash = value.hash;
    if (Array.isArray(value.entries)) summary.entryCount = value.entries.length;
    if (Array.isArray(value.roots)) summary.rootCount = value.roots.length;
    if (typeof value.source === 'string') summary.source = value.source;
    return Object.keys(summary).length ? summary : { present: true };
  }
  return { present: true };
}
