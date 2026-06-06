import{nativeImportCategoryForLossKind}from'./nativeImportCategoryForLossKind.js';import{normalizeLossSeverity}from'./normalizeLossSeverity.js';import{normalizeNativeLossKind}from'./normalizeNativeLossKind.js';import{semanticMergeAdmissionForSeverity}from'./semanticMergeAdmissionForSeverity.js';
export function normalizeNativeLossRecord(loss, fallbackId) {
  const record = typeof loss === 'string' ? { message: loss } : loss ?? {};
  const severity = normalizeLossSeverity(record.severity);
  const kind = normalizeNativeLossKind(record, severity);
  const category = nativeImportCategoryForLossKind(kind);
  return {
    ...record,
    id: String(record.id ?? fallbackId),
    severity,
    kind,
    message: String(record.message ?? `${kind} loss during native import.`),
    metadata: {
      lossCategory: category,
      semanticMergeAdmission: semanticMergeAdmissionForSeverity(severity),
      dashboardSeverity: severity,
      ...record.metadata
    }
  };
}
