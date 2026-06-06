export function javaAnnotationProcessingSummary(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return { processorCount: value.length };
  if (typeof value === 'object') {
    const summary = {};
    if (typeof value.hash === 'string') summary.hash = value.hash;
    if (typeof value.enabled === 'boolean') summary.enabled = value.enabled;
    if (Array.isArray(value.processors)) summary.processorCount = value.processors.length;
    if (Array.isArray(value.generatedSources)) summary.generatedSourceCount = value.generatedSources.length;
    return Object.keys(summary).length ? summary : { present: true };
  }
  return { present: Boolean(value) };
}
