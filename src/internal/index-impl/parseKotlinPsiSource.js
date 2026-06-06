export function parseKotlinPsiSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.kotlinPsi?.parse ?? options.kotlinCompiler?.parse ?? options.intellijPsi?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    kotlinVersion: options.kotlinVersion ?? input.options?.kotlinVersion,
    languageVersion: options.languageVersion ?? input.options?.languageVersion,
    apiVersion: options.apiVersion ?? input.options?.apiVersion,
    script: options.script ?? input.options?.script ?? /\.kts$/i.test(input.sourcePath ?? ''),
    includeAnnotations: options.includeAnnotations ?? input.options?.includeAnnotations,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}
