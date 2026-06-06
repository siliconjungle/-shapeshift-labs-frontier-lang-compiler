import{normalizeNativeImporterAdapter}from'./normalizeNativeImporterAdapter.js';
export function safeNativeImporterAdapterSummary(adapter) {
  try {
    return normalizeNativeImporterAdapter(adapter);
  } catch {
    return undefined;
  }
}
