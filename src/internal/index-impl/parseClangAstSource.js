export function parseClangAstSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.clang?.parse ?? options.libclang?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    language: options.language ?? input.language,
    standard: options.cStandard ?? input.options?.cStandard,
    compileFlags: options.compileFlags ?? input.options?.compileFlags,
    includeSystemHeaders: options.includeSystemHeaders ?? input.options?.includeSystemHeaders,
    astDumpFormat: 'json',
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}
