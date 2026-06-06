import{diffNativeSourceImports}from'./diffNativeSourceImports.js';
export function diffNativeSources(input) {
  const language = input.language ?? input.before?.language ?? input.after?.language;
  if (!language) throw new Error('diffNativeSources requires a language');
  const sourcePath = input.sourcePath ?? input.before?.sourcePath ?? input.after?.sourcePath;
  return diffNativeSourceImports({
    ...input,
    before: input.before ?? (input.beforeSourceText === undefined ? undefined : {
      language,
      sourcePath,
      sourceText: input.beforeSourceText,
      sourceHash: input.beforeSourceHash,
      parser: input.parser,
      metadata: input.beforeMetadata
    }),
    after: input.after ?? (input.afterSourceText === undefined ? undefined : {
      language,
      sourcePath,
      sourceText: input.afterSourceText,
      sourceHash: input.afterSourceHash,
      parser: input.parser,
      metadata: input.afterMetadata
    })
  });
}
