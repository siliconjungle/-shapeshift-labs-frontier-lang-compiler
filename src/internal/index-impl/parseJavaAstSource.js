export function parseJavaAstSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.javac?.parse ?? options.jdt?.parse ?? options.javaParser?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    javaVersion: options.javaVersion ?? input.options?.javaVersion,
    sourceLevel: options.sourceLevel ?? input.options?.sourceLevel,
    classPath: options.classPath ?? input.options?.classPath,
    modulePath: options.modulePath ?? input.options?.modulePath,
    includeAnnotations: options.includeAnnotations ?? input.options?.includeAnnotations,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}
