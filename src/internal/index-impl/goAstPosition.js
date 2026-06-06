export function goAstPosition(value, options = {}) {
  if (!value) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.Position ?? value.pos ?? value.Pos ?? value;
    const line = position.Line ?? position.line;
    const column = position.Column ?? position.column ?? position.Col ?? position.col;
    if (typeof line === 'number') {
      return {
        path: position.Filename ?? position.filename ?? position.file ?? position.path,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const fileSet = options.fileSet ?? options.fset;
  const positionFor = typeof fileSet?.PositionFor === 'function'
    ? fileSet.PositionFor.bind(fileSet)
    : typeof fileSet?.positionFor === 'function'
      ? fileSet.positionFor.bind(fileSet)
      : typeof fileSet?.Position === 'function'
        ? fileSet.Position.bind(fileSet)
        : typeof fileSet?.position === 'function'
          ? fileSet.position.bind(fileSet)
          : undefined;
  if (positionFor) {
    const resolved = positionFor(value, true);
    return goAstPosition(resolved, options);
  }
  return undefined;
}
