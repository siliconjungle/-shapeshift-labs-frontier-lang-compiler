export function parseGoAstSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.goAst?.parse ?? options.goParser?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    mode: options.mode ?? input.options?.mode ?? 'ParseComments',
    goVersion: options.goVersion ?? input.options?.goVersion,
    packageName: options.packageName ?? input.options?.packageName,
    includeComments: options.includeComments ?? input.options?.includeComments,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}
