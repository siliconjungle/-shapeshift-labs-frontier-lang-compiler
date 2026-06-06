export function csharpRoslynPosition(value, options = {}) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.Position ?? value;
    const line = position.line ?? position.Line;
    const column = position.column ?? position.Column ?? position.character ?? position.Character;
    if (typeof line === 'number') {
      return {
        path: position.path ?? position.filePath ?? position.FilePath ?? position.file,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const resolver = typeof options.positionResolver === 'function'
    ? options.positionResolver
    : typeof options.lineMap?.position === 'function'
      ? options.lineMap.position.bind(options.lineMap)
      : typeof options.lineMap?.getLinePosition === 'function'
        ? options.lineMap.getLinePosition.bind(options.lineMap)
        : undefined;
  if (resolver) {
    const resolved = resolver(value);
    if (resolved !== value) return csharpRoslynPosition(resolved, options);
  }
  return undefined;
}
