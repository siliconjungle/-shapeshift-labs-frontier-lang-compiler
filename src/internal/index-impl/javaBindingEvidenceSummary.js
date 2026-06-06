export function javaBindingEvidenceSummary(value) {
  if (!value || typeof value !== 'object') return undefined;
  const summary = {};
  if (typeof value.hash === 'string') summary.hash = value.hash;
  if (Array.isArray(value.bindings)) summary.bindingCount = value.bindings.length;
  if (Array.isArray(value.types)) summary.typeCount = value.types.length;
  if (Array.isArray(value.references)) summary.referenceCount = value.references.length;
  if (typeof value.solver === 'string') summary.solver = value.solver;
  return Object.keys(summary).length ? summary : { present: true };
}
