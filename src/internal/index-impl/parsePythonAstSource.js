export function parsePythonAstSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.pythonAst?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    mode: options.mode ?? input.options?.mode ?? 'exec',
    typeComments: options.typeComments ?? input.options?.typeComments,
    featureVersion: options.featureVersion ?? input.options?.featureVersion,
    optimize: options.optimize ?? input.options?.optimize,
    includeAttributes: options.includeAttributes ?? input.options?.includeAttributes,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}
