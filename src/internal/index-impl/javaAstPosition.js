export function javaAstPosition(value, options = {}) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.Position ?? value.pos ?? value.start ?? value;
    const line = position.line ?? position.Line ?? position.lineno;
    const column = position.column ?? position.Column ?? position.col ?? position.character;
    if (typeof line === 'number') {
      return {
        path: position.path ?? position.file ?? position.filename ?? position.Filename,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const resolver = typeof options.positionResolver === 'function'
    ? options.positionResolver
    : typeof options.lineMap?.position === 'function'
      ? options.lineMap.position.bind(options.lineMap)
      : typeof options.lineMap?.getPosition === 'function'
        ? options.lineMap.getPosition.bind(options.lineMap)
        : typeof options.lineMap?.getLineNumber === 'function'
          ? (offset) => ({
            line: options.lineMap.getLineNumber(offset),
            column: typeof options.lineMap.getColumnNumber === 'function' ? options.lineMap.getColumnNumber(offset) : undefined
          })
          : undefined;
  if (resolver) {
    const resolved = resolver(value);
    if (resolved !== value) return javaAstPosition(resolved, options);
  }
  return undefined;
}
