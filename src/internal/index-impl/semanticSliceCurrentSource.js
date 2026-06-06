export function semanticSliceCurrentSource(currentSources, path) {
  if (currentSources instanceof Map) return currentSources.get(path);
  return currentSources[path] ?? currentSources[`./${path}`];
}
