import{safeProjectionIdentifier}from'./safeProjectionIdentifier.js';
export function renderPythonProjectionStubs(declarations) {
  if (!declarations.length) return 'pass';
  return declarations.map((declaration) => {
    const name = safeProjectionIdentifier(declaration.name);
    if (declaration.kind === 'function') return `def ${name}(*args, **kwargs):\n    raise NotImplementedError("Frontier native source stub")`;
    if (declaration.kind === 'class') return `class ${name}:\n    pass`;
    return `${name} = None`;
  }).join('\n\n');
}
