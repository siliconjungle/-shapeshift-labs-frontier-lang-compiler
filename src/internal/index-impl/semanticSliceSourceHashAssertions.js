import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{semanticSliceCurrentSource}from'./semanticSliceCurrentSource.js';
export function semanticSliceSourceHashAssertions(slice, currentSources) {
  if (!currentSources) return [];
  const assertions = [];
  for (const file of slice?.sourceFiles ?? []) {
    if (!file.sourceHash || !file.path) continue;
    const currentSource = semanticSliceCurrentSource(currentSources, file.path);
    if (typeof currentSource !== 'string') {
      assertions.push({
        id: `sourceHash:${file.path}`,
        status: 'warning',
        summary: `Current source text was not supplied for ${file.path}.`,
        metadata: { path: file.path, expectedSourceHash: file.sourceHash }
      });
      continue;
    }
    const actualSourceHash = hashSemanticValue(currentSource);
    assertions.push({
      id: `sourceHash:${file.path}`,
      status: actualSourceHash === file.sourceHash ? 'passed' : 'failed',
      summary: actualSourceHash === file.sourceHash ? `Source hash matched for ${file.path}.` : `Source hash changed for ${file.path}.`,
      metadata: { path: file.path, expectedSourceHash: file.sourceHash, actualSourceHash }
    });
  }
  return assertions;
}
