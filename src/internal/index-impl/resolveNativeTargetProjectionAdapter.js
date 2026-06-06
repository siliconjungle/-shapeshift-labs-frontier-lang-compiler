import{matchingNativeTargetProjectionAdapter}from'./matchingNativeTargetProjectionAdapter.js';
export function resolveNativeTargetProjectionAdapter(input, options = {}) {
  const adapters = options.targetAdapters ?? [];
  if (options.targetAdapter && typeof options.targetAdapter === 'object') return options.targetAdapter;
  if (typeof options.targetAdapter === 'string') {
    const explicit = adapters.find((adapter) => adapter?.id === options.targetAdapter);
    if (explicit) return explicit;
  }
  if (typeof options.targetAdapterResolver === 'function') {
    const resolved = options.targetAdapterResolver(input, adapters);
    if (resolved) return resolved;
  }
  return matchingNativeTargetProjectionAdapter(input, adapters);
}
