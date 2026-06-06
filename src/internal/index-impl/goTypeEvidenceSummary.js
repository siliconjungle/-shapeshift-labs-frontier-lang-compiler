export function goTypeEvidenceSummary(value) {
  if (!value || typeof value !== 'object') return undefined;
  const summary = {};
  if (typeof value.packagePath === 'string') summary.packagePath = value.packagePath;
  if (typeof value.hash === 'string') summary.hash = value.hash;
  if (Array.isArray(value.types)) summary.typeCount = value.types.length;
  if (Array.isArray(value.references)) summary.referenceCount = value.references.length;
  return Object.keys(summary).length ? summary : { present: true };
}
