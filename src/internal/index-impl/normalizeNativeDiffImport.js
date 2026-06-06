import{importNativeSource}from'./importNativeSource.js';
export function normalizeNativeDiffImport(value, input, side) {
  if (!value) return undefined;
  if (value.kind === 'frontier.lang.importResult' && value.nativeSource) return value;
  return importNativeSource({
    ...value,
    language: value.language ?? input.language,
    sourcePath: value.sourcePath ?? input.sourcePath,
    parser: value.parser ?? input.parser,
    metadata: {
      ...(value.metadata ?? {}),
      nativeSourceDiffSide: side
    }
  });
}
