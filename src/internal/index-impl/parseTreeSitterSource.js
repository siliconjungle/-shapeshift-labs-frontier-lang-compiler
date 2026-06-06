export function parseTreeSitterSource(input, options) {
  const parser = options.parserInstance ?? options.treeSitterParser ?? options.parser;
  if (parser && typeof parser.parse === 'function') return parser.parse(input.sourceText);
  if (typeof options.parse === 'function') return options.parse(input);
  return undefined;
}
