export function parseSwiftSyntaxSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.swiftSyntax?.parse ?? options.swiftParser?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    swiftVersion: options.swiftVersion ?? input.options?.swiftVersion,
    languageMode: options.languageMode ?? input.options?.languageMode,
    enableBareSlashRegex: options.enableBareSlashRegex ?? input.options?.enableBareSlashRegex,
    parseTransition: options.parseTransition ?? input.options?.parseTransition,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}
