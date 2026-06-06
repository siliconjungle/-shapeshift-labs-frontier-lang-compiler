export function parseRustSynSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.rustSyn?.parse ?? options.syn?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    edition: options.rustEdition ?? input.options?.rustEdition ?? '2021',
    includeAttributes: options.includeAttributes ?? input.options?.includeAttributes,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}
