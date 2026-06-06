export function resolveNativeProjectAdapter(source, adapters, input) {
  if (typeof input.adapterResolver === 'function') return input.adapterResolver(source, adapters);
  const language = source.language;
  const sourcePath = source.sourcePath ?? '';
  return adapters.find((adapter) => {
    if (source.adapter && adapter.id === source.adapter) return true;
    if (language && adapter.language !== language) return false;
    const extensions = adapter.supportedExtensions ?? [];
    return !extensions.length || extensions.some((extension) => sourcePath.toLowerCase().endsWith(extension.toLowerCase()));
  });
}
