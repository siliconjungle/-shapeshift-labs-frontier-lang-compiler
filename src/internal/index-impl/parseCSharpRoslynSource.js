export function parseCSharpRoslynSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.roslyn?.parse ?? options.csharpRoslyn?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    languageVersion: options.languageVersion ?? input.options?.languageVersion,
    csharpVersion: options.csharpVersion ?? input.options?.csharpVersion,
    nullableContext: options.nullableContext ?? input.options?.nullableContext,
    kind: options.sourceCodeKind ?? input.options?.sourceCodeKind,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}
