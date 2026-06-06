export function kotlinPsiPosition(value, options = {}) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.location ?? value;
    const line = position.line ?? position.Line;
    const column = position.column ?? position.character ?? position.Column;
    if (typeof line === 'number') {
      return {
        path: position.path ?? position.filePath ?? position.file,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const resolver = typeof options.positionResolver === 'function'
    ? options.positionResolver
    : typeof options.lineMap?.position === 'function'
      ? options.lineMap.position.bind(options.lineMap)
      : typeof options.lineMap?.getLineAndColumn === 'function'
        ? options.lineMap.getLineAndColumn.bind(options.lineMap)
        : undefined;
  if (resolver) {
    const resolved = resolver(value);
    if (resolved !== value) return kotlinPsiPosition(resolved, options);
  }
  return undefined;
}
