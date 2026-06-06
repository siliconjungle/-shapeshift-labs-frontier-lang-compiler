import{normalizeNativeTargetProjectionAdapter}from'./normalizeNativeTargetProjectionAdapter.js';
export function safeNativeTargetProjectionAdapterSummary(adapter) {
  try {
    return normalizeNativeTargetProjectionAdapter(adapter);
  } catch {
    return undefined;
  }
}
