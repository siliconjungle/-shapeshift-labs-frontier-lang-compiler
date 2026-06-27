import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function cssModuleGeneratedClassNameMapHash(mergeOptions) {
  return cssModuleGeneratedClassNameMapProof(mergeOptions).generatedClassNameMapHash;
}

function cssModuleGeneratedClassNameMapProof(mergeOptions) {
  const generatedClassNameMap = objectValue(mergeOptions.generatedClassNameMap)
    ?? objectValue(mergeOptions.cssModuleGeneratedClassNameMap)
    ?? objectValue(mergeOptions.classMap);
  const declaredGeneratedClassNameMapHash = firstString(mergeOptions.generatedClassNameMapHash, mergeOptions.cssModuleGeneratedClassNameMapHash);
  const computedGeneratedClassNameMapHash = generatedClassNameMap ? hashGeneratedClassNameMap(generatedClassNameMap) : undefined;
  const hashMismatch = Boolean(
    declaredGeneratedClassNameMapHash
    && computedGeneratedClassNameMapHash
    && declaredGeneratedClassNameMapHash !== computedGeneratedClassNameMapHash
  );
  return {
    status: hashMismatch ? 'hash-mismatch' : generatedClassNameMap || declaredGeneratedClassNameMapHash ? 'ready' : 'missing',
    generatedClassNameMap: hashMismatch ? undefined : generatedClassNameMap,
    generatedClassNameMapHash: hashMismatch ? undefined : declaredGeneratedClassNameMapHash ?? computedGeneratedClassNameMapHash,
    declaredGeneratedClassNameMapHash,
    computedGeneratedClassNameMapHash
  };
}

function hashGeneratedClassNameMap(generatedClassNameMap) {
  return hashSemanticValue({
    kind: 'frontier.lang.css.modules.generatedClassNameMap.v1',
    generatedClassNameMap
  });
}

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

export { cssModuleGeneratedClassNameMapHash, cssModuleGeneratedClassNameMapProof, hashGeneratedClassNameMap };
