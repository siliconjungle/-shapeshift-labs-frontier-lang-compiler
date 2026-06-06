import{idFragment}from'../../native-import-utils.js';
export function fileLevelNativeChangeRegion(input) {
  const sourcePath = input.sourcePath ?? input.after?.sourcePath ?? input.before?.sourcePath;
  const key = ['source', sourcePath ?? `${input.language}:memory`, 'file'].join('#');
  return {
    id: `region_${idFragment(key)}`,
    key,
    changeKind: 'modified',
    regionKind: 'body',
    granularity: 'file',
    language: input.language,
    sourcePath,
    sourceHash: input.afterHash ?? input.beforeHash,
    precision: 'unknown',
    mergePolicy: 'file-level-review-required',
    conflictKey: `region:${key}`,
    metadata: {
      reason: 'source-hash-changed-without-symbol-diff',
      beforeHash: input.beforeHash,
      afterHash: input.afterHash
    }
  };
}
