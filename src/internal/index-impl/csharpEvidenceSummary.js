export function csharpEvidenceSummary(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return { entryCount: value.length };
  if (typeof value === 'string') return { value };
  if (typeof value === 'object') {
    const summary = {};
    if (typeof value.hash === 'string') summary.hash = value.hash;
    if (typeof value.solver === 'string') summary.solver = value.solver;
    if (Array.isArray(value.entries)) summary.entryCount = value.entries.length;
    if (Array.isArray(value.references)) summary.referenceCount = value.references.length;
    if (Array.isArray(value.symbols)) summary.symbolCount = value.symbols.length;
    if (Array.isArray(value.diagnostics)) summary.diagnosticCount = value.diagnostics.length;
    if (Array.isArray(value.generators)) summary.generatorCount = value.generators.length;
    if (Array.isArray(value.projects)) summary.projectCount = value.projects.length;
    return Object.keys(summary).length ? summary : { present: true };
  }
  return { present: true };
}
