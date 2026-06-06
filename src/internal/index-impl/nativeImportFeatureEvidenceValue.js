export function nativeImportFeatureEvidenceValue(record, key) {
  if (!record || !key) return undefined;
  const candidates = [record, record.metadata].filter(Boolean);
  for (const candidate of candidates) {
    const direct = candidate[key];
    if (direct !== undefined) return direct;
    const dotted = String(key).split('.').reduce((current, part) => current?.[part], candidate);
    if (dotted !== undefined) return dotted;
  }
  return undefined;
}
