import{nativeTargetProjectionAdapterMatches}from'./nativeTargetProjectionAdapterMatches.js';
export function matchingNativeTargetProjectionAdapter(input, adapters = []) {
  return adapters.find((adapter) => nativeTargetProjectionAdapterMatches(adapter, input));
}
